using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace HospitalAI.ExaminationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly HospitalDbContext _dbContext;
        private readonly IConfiguration? _configuration;

        public PaymentController(IPaymentService paymentService, HospitalDbContext dbContext, IConfiguration? configuration = null)
        {
            _paymentService = paymentService;
            _dbContext = dbContext;
            _configuration = configuration;
        }

        [HttpPost("create-payment-url")]
        [AllowAnonymous]
        public async Task<IActionResult> CreatePaymentUrl([FromBody] PaymentInformationModel model)
        {
            if (!Guid.TryParse(model.OrderId, out Guid billingId))
            {
                // Cho phép tạo link thanh toán VNPay linh hoạt cho lịch hẹn khám hoặc gói khám trực tuyến
                if (model.Amount > 0)
                {
                    if (string.IsNullOrWhiteSpace(model.OrderDescription))
                    {
                        model.OrderDescription = $"Thanh toan phi dat kham {model.OrderId}";
                    }
                    var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                    var paymentUrl = _paymentService.CreatePaymentUrl(model, ip);
                    return Ok(new { Url = paymentUrl, Amount = model.Amount });
                }
                return BadRequest(new { message = "Mã hóa đơn hoặc số tiền thanh toán không hợp lệ." });
            }

            var billing = await _dbContext.Billings
                .Include(b => b.Patient)
                .FirstOrDefaultAsync(b => b.Id == billingId);

            if (billing == null)
            {
                return NotFound(new { message = "Không tìm thấy hóa đơn viện phí cần thanh toán." });
            }

            if (billing.Status == "Paid")
            {
                return BadRequest(new { message = "Hóa đơn viện phí này đã được thanh toán trước đó." });
            }

            // IDOR Protection: Bệnh nhân chỉ được thanh toán hóa đơn của chính mình; Kiosk hợp lệ được phép tạo mã thanh toán VNPay cho hóa đơn thật
            var isStaff = User.IsInRole("Admin") || User.IsInRole("Doctor") || User.IsInRole("Receptionist") || User.IsInRole("Nurse") || User.IsInRole("Cashier");
            var (isKioskAuthorized, _, _) = KioskTerminalValidator.ValidateRequest(Request, User, _configuration);
            if (!isStaff && !isKioskAuthorized)
            {
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (billing.Patient == null || !billing.Patient.UserId.HasValue || billing.Patient.UserId.Value.ToString() != currentUserId)
                {
                    return Forbid();
                }
            }

            // Ghi đè số tiền và nội dung bằng dữ liệu thực tế từ CSDL (Chống Price Tampering)
            model.Amount = (double)billing.TotalAmount;
            model.OrderDescription = $"Thanh toan vien phi {billing.Id.ToString().Substring(0, 8).ToUpper()}";

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var url = _paymentService.CreatePaymentUrl(model, ipAddress);
            return Ok(new { Url = url, Amount = billing.TotalAmount });
        }

        [HttpGet("vnpay-return")]
        public async Task<IActionResult> PaymentCallback()
        {
            var dict = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
            var response = _paymentService.ValidateSignature(dict);
            if (!response)
            {
                return BadRequest(new { Message = "Chữ ký số VNPay không hợp lệ hoặc đã bị can thiệp" });
            }

            var vnp_ResponseCode = Request.Query["vnp_ResponseCode"].ToString();
            var vnp_TxnRef = Request.Query["vnp_TxnRef"].ToString();

            if (!long.TryParse(Request.Query["vnp_Amount"], out long rawPaidAmount))
            {
                return BadRequest(new { Message = "Số tiền thanh toán phản hồi không hợp lệ" });
            }

            var actualPaidAmount = rawPaidAmount / 100;

            if (vnp_ResponseCode == "00")
            {
                if (Guid.TryParse(vnp_TxnRef, out Guid billingId))
                {
                    var billing = await _dbContext.Billings
                        .Include(b => b.Items)
                        .FirstOrDefaultAsync(b => b.Id == billingId);

                    if (billing == null)
                    {
                        return NotFound(new { Message = "Không tìm thấy hóa đơn tương ứng với giao dịch" });
                    }

                    // Chống gian lận số tiền thanh toán (Payment Amount Verification)
                    if (actualPaidAmount < (long)billing.TotalAmount)
                    {
                        return BadRequest(new
                        {
                            Message = "Cảnh báo gian lận: Số tiền thực trả thấp hơn tổng tiền hóa đơn!",
                            PaidAmount = actualPaidAmount,
                            RequiredAmount = billing.TotalAmount
                        });
                    }

                    if (billing.Status != "Paid")
                    {
                        var vnp_TransactionNo = Request.Query["vnp_TransactionNo"].ToString();
                        var finalRef = !string.IsNullOrEmpty(vnp_TransactionNo) && vnp_TransactionNo != "0" 
                            ? $"VNPAY-{vnp_TransactionNo}" 
                            : vnp_TxnRef;

                        // Chống Replay Attack: Kiểm tra mã giao dịch cổng thanh toán VNPay có bị dùng lặp lại không
                        var isReplay = await _dbContext.Billings.AnyAsync(b => b.TransactionRef == finalRef && b.Id != billing.Id);
                        if (isReplay)
                        {
                            return BadRequest(new { Message = "Cảnh báo gian lận: Mã giao dịch VNPay đã được sử dụng trước đó (Replay Attack)." });
                        }

                        billing.Status = "Paid";
                        billing.PaidAt = DateTime.UtcNow;
                        billing.PaymentMethod = "VNPay";
                        billing.TransactionRef = finalRef;

                        // Cập nhật trạng thái phiếu chỉ định cận lâm sàng nếu có
                        if (billing.BillingType == "ServiceOrder")
                        {
                            var item = billing.Items.FirstOrDefault();
                            if (item != null && item.ReferenceId.HasValue)
                            {
                                var serviceOrder = await _dbContext.ServiceOrders.FirstOrDefaultAsync(s => s.Id == item.ReferenceId.Value);
                                if (serviceOrder != null) serviceOrder.Status = "Paid";
                            }
                        }

                        await _dbContext.SaveChangesAsync();
                    }
                }
                
                return Ok(new { Message = "Thanh toán thành công", OrderId = vnp_TxnRef, Success = true });
            }
            
            return BadRequest(new { Message = "Thanh toán thất bại hoặc bị hủy bởi người dùng", Success = false });
        }

        /// <summary>
        /// VNPay Server-to-Server IPN Webhook (Đảm bảo cập nhật giao dịch ngay cả khi người dùng đóng trình duyệt)
        /// </summary>
        [HttpGet("vnpay-ipn")]
        [AllowAnonymous]
        public async Task<IActionResult> PaymentIpn()
        {
            var dict = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
            var isValidSignature = _paymentService.ValidateSignature(dict);
            if (!isValidSignature)
            {
                return Ok(new { RspCode = "97", Message = "Invalid Signature" });
            }

            var vnp_ResponseCode = Request.Query["vnp_ResponseCode"].ToString();
            var vnp_TxnRef = Request.Query["vnp_TxnRef"].ToString();

            if (!long.TryParse(Request.Query["vnp_Amount"], out long rawPaidAmount))
            {
                return Ok(new { RspCode = "04", Message = "Invalid Amount" });
            }

            var actualPaidAmount = rawPaidAmount / 100;

            if (Guid.TryParse(vnp_TxnRef, out Guid billingId))
            {
                var billing = await _dbContext.Billings
                    .Include(b => b.Items)
                    .FirstOrDefaultAsync(b => b.Id == billingId);

                if (billing == null)
                {
                    return Ok(new { RspCode = "01", Message = "Order not found" });
                }

                if (billing.Status == "Paid")
                {
                    return Ok(new { RspCode = "02", Message = "Order already confirmed" });
                }

                if (actualPaidAmount < (long)billing.TotalAmount)
                {
                    return Ok(new { RspCode = "04", Message = "Invalid amount" });
                }

                if (vnp_ResponseCode == "00")
                {
                    var vnp_TransactionNo = Request.Query["vnp_TransactionNo"].ToString();
                    var finalRef = !string.IsNullOrEmpty(vnp_TransactionNo) && vnp_TransactionNo != "0" 
                        ? $"VNPAY-{vnp_TransactionNo}" 
                        : vnp_TxnRef;

                    // Chống Replay Webhook IPN
                    var isReplay = await _dbContext.Billings.AnyAsync(b => b.TransactionRef == finalRef && b.Id != billing.Id);
                    if (isReplay)
                    {
                        return Ok(new { RspCode = "02", Message = "Duplicate transaction reference" });
                    }

                    billing.Status = "Paid";
                    billing.PaidAt = DateTime.UtcNow;
                    billing.PaymentMethod = "VNPay";
                    billing.TransactionRef = finalRef;

                    if (billing.BillingType == "ServiceOrder")
                    {
                        var item = billing.Items.FirstOrDefault();
                        if (item != null && item.ReferenceId.HasValue)
                        {
                            var serviceOrder = await _dbContext.ServiceOrders.FirstOrDefaultAsync(s => s.Id == item.ReferenceId.Value);
                            if (serviceOrder != null) serviceOrder.Status = "Paid";
                        }
                    }

                    await _dbContext.SaveChangesAsync();
                    return Ok(new { RspCode = "00", Message = "Confirm Success" });
                }
                else
                {
                    return Ok(new { RspCode = "00", Message = "Confirm Success (Payment Failed at Gate)" });
                }
            }

            return Ok(new { RspCode = "00", Message = "Confirm Success" });
        }
    }
}
