using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;
using System;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using System.Linq;
using System.Security.Claims;
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
        private static readonly SemaphoreSlim _vnpaySettleLock = new(1, 1);

        public PaymentController(IPaymentService paymentService, HospitalDbContext dbContext, IConfiguration? configuration = null)
        {
            _paymentService = paymentService;
            _dbContext = dbContext;
            _configuration = configuration;
        }

        private bool IsStaffUser()
        {
            return User.IsInRole("Admin") || User.IsInRole("Doctor") || User.IsInRole("Receptionist") ||
                   User.IsInRole("Nurse") || User.IsInRole("Cashier") || User.IsInRole("Triage");
        }

        private string? ResolveSafeReturnUrl(string? requestedReturnUrl)
        {
            var defaultReturnUrl = _configuration?["Vnpay:ReturnUrl"];
            if (string.IsNullOrWhiteSpace(requestedReturnUrl))
            {
                return defaultReturnUrl;
            }

            if (!Uri.TryCreate(requestedReturnUrl.Trim(), UriKind.Absolute, out var uri))
            {
                return defaultReturnUrl;
            }

            if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            {
                return defaultReturnUrl;
            }

            var allowedHosts = _configuration?.GetSection("Vnpay:AllowedReturnHosts").Get<string[]>()
                ?? new[] { "dmedical.site", "www.dmedical.site", "localhost", "127.0.0.1" };

            var isAllowed = allowedHosts.Any(h =>
                string.Equals(h, uri.Host, StringComparison.OrdinalIgnoreCase) ||
                uri.Host.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase));

            return isAllowed ? uri.ToString() : defaultReturnUrl;
        }

        [HttpPost("create-payment-url")]
        [AllowAnonymous]
        public async Task<IActionResult> CreatePaymentUrl([FromBody] PaymentInformationModel model)
        {
            var isStaff = IsStaffUser();
            var isAuthenticatedUser = User?.Identity?.IsAuthenticated == true;
            var (isKioskAuthorized, _, _) = KioskTerminalValidator.ValidateRequest(Request, User, _configuration);

            // Chặn người dùng ẩn danh bên ngoài lạm dụng khóa merchant ký URL VNPay hoặc tạo Open Redirect
            if (!isAuthenticatedUser && !isKioskAuthorized)
            {
                return Unauthorized(new { message = "Vui lòng đăng nhập hoặc kết nối qua Trạm Kiosk hợp lệ để tạo liên kết thanh toán VNPay." });
            }

            if (string.IsNullOrWhiteSpace(model.OrderId))
            {
                return BadRequest(new { message = "Mã đơn hàng hoặc hóa đơn không được để trống." });
            }

            // Chống Open Redirect: Chỉ giữ ReturnUrl thuộc danh sách tên miền cho phép
            model.ReturnUrl = ResolveSafeReturnUrl(model.ReturnUrl);

            if (!Guid.TryParse(model.OrderId, out Guid orderGuid))
            {
                if (model.Amount < 10000 || model.Amount > 50000000)
                {
                    return BadRequest(new { message = "Số tiền thanh toán trực tuyến không nằm trong hạn mức hợp lệ (10.000 - 50.000.000 VNĐ)." });
                }

                model.OrderDescription = string.IsNullOrWhiteSpace(model.OrderDescription)
                    ? $"Thanh toan phi dat kham {model.OrderId}"
                    : model.OrderDescription.Trim()[..Math.Min(model.OrderDescription.Trim().Length, 120)];

                var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                var paymentUrl = _paymentService.CreatePaymentUrl(model, ip);
                return Ok(new { Url = paymentUrl, Amount = model.Amount });
            }

            var billing = await _dbContext.Billings
                .Include(b => b.Patient)
                .FirstOrDefaultAsync(b => b.Id == orderGuid);

            if (billing != null)
            {
                if (billing.Status == "Paid")
                {
                    return BadRequest(new { message = "Hóa đơn viện phí này đã được thanh toán trước đó." });
                }

                // IDOR Protection: Bệnh nhân chỉ được thanh toán hóa đơn của chính mình; Staff/Kiosk hợp lệ được phép
                if (!isStaff && !isKioskAuthorized)
                {
                    var currentUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (billing.Patient == null || !billing.Patient.UserId.HasValue || billing.Patient.UserId.Value.ToString() != currentUserId)
                    {
                        return Forbid();
                    }
                }

                // Ghi đè số tiền và nội dung bằng dữ liệu thực tế từ CSDL (Chống Price Tampering)
                model.Amount = (double)billing.TotalAmount;
                model.OrderDescription = $"Thanh toan vien phi {billing.Id.ToString()[..8].ToUpper()}";

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                var url = _paymentService.CreatePaymentUrl(model, ipAddress);
                return Ok(new { Url = url, Amount = billing.TotalAmount });
            }

            // Nếu OrderId là Guid của Appointment đặt khám trực tuyến (chưa xuất Billing riêng)
            var appointment = await _dbContext.Appointments
                .Include(a => a.Patient)
                .FirstOrDefaultAsync(a => a.Id == orderGuid);

            if (appointment == null)
            {
                return NotFound(new { message = "Không tìm thấy hóa đơn hoặc lịch hẹn cần thanh toán." });
            }

            if (!isStaff && !isKioskAuthorized)
            {
                var currentUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var currentPhone = User?.FindFirst(ClaimTypes.Name)?.Value;
                var isAptOwner = appointment.Patient != null && (
                    (appointment.Patient.UserId.HasValue && appointment.Patient.UserId.Value.ToString() == currentUserId) ||
                    (!string.IsNullOrWhiteSpace(currentPhone) && appointment.Patient.EmergencyContactPhone == currentPhone));
                if (!isAptOwner)
                {
                    return Forbid();
                }
            }

            var boundedFee = (model.Amount >= 10000 && model.Amount <= 50000000) ? model.Amount : 150000;
            model.Amount = boundedFee;
            model.OrderDescription = $"Thanh toan phi dat kham {appointment.Id.ToString()[..8].ToUpper()}";

            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var aptPayUrl = _paymentService.CreatePaymentUrl(model, clientIp);
            return Ok(new { Url = aptPayUrl, Amount = boundedFee });
        }

        [HttpGet("vnpay-return")]
        public async Task<IActionResult> PaymentCallback()
        {
            var dict = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
            if (!_paymentService.ValidateSignature(dict))
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

            if (vnp_ResponseCode != "00")
            {
                return BadRequest(new { Message = "Thanh toán thất bại hoặc bị hủy bởi người dùng", Success = false });
            }

            if (Guid.TryParse(vnp_TxnRef, out Guid billingId))
            {
                var settle = await SettleBillingTransactionAsync(
                    billingId,
                    actualPaidAmount,
                    vnp_TxnRef,
                    Request.Query["vnp_TransactionNo"].ToString());

                if (settle.Code == "01")
                    return NotFound(new { Message = "Không tìm thấy hóa đơn tương ứng với giao dịch" });
                if (settle.Code == "04")
                    return BadRequest(new { Message = "Cảnh báo gian lận: Số tiền thực trả thấp hơn tổng tiền hóa đơn!", PaidAmount = actualPaidAmount });
                if (settle.Code == "REPLAY")
                    return BadRequest(new { Message = "Cảnh báo gian lận: Mã giao dịch VNPay đã được sử dụng trước đó (Replay Attack)." });
            }

            return Ok(new { Message = "Thanh toán thành công", OrderId = vnp_TxnRef, Success = true });
        }

        /// <summary>
        /// VNPay Server-to-Server IPN Webhook (Đảm bảo cập nhật giao dịch ngay cả khi người dùng đóng trình duyệt)
        /// </summary>
        [HttpGet("vnpay-ipn")]
        [AllowAnonymous]
        public async Task<IActionResult> PaymentIpn()
        {
            var dict = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
            if (!_paymentService.ValidateSignature(dict))
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
                if (vnp_ResponseCode != "00")
                {
                    var exists = await _dbContext.Billings.AsNoTracking().AnyAsync(b => b.Id == billingId);
                    if (!exists) return Ok(new { RspCode = "01", Message = "Order not found" });
                    return Ok(new { RspCode = "00", Message = "Confirm Success (Payment Failed at Gate)" });
                }

                var settle = await SettleBillingTransactionAsync(
                    billingId,
                    actualPaidAmount,
                    vnp_TxnRef,
                    Request.Query["vnp_TransactionNo"].ToString());

                return settle.Code switch
                {
                    "01" => Ok(new { RspCode = "01", Message = "Order not found" }),
                    "02" or "REPLAY" => Ok(new { RspCode = "02", Message = "Order already confirmed" }),
                    "04" => Ok(new { RspCode = "04", Message = "Invalid amount" }),
                    _ => Ok(new { RspCode = "00", Message = "Confirm Success" })
                };
            }

            return Ok(new { RspCode = "00", Message = "Confirm Success" });
        }

        private async Task<(string Code, string Message)> SettleBillingTransactionAsync(
            Guid billingId,
            long actualPaidAmount,
            string vnpTxnRef,
            string vnpTransactionNo)
        {
            await _vnpaySettleLock.WaitAsync();
            Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? tx = null;
            try
            {
                if (_dbContext.Database.IsRelational())
                {
                    tx = await _dbContext.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                }

                var billing = await _dbContext.Billings
                    .Include(b => b.Items)
                    .FirstOrDefaultAsync(b => b.Id == billingId);

                if (billing == null)
                {
                    if (tx != null) await tx.RollbackAsync();
                    return ("01", "Order not found");
                }

                if (actualPaidAmount < (long)billing.TotalAmount)
                {
                    if (tx != null) await tx.RollbackAsync();
                    return ("04", "Invalid amount");
                }

                if (billing.Status == "Paid")
                {
                    if (tx != null) await tx.RollbackAsync();
                    return ("02", "Order already confirmed");
                }

                var finalRef = !string.IsNullOrEmpty(vnpTransactionNo) && vnpTransactionNo != "0"
                    ? $"VNPAY-{vnpTransactionNo}"
                    : vnpTxnRef;

                var isReplay = await _dbContext.Billings.AnyAsync(b => b.TransactionRef == finalRef && b.Id != billing.Id);
                if (isReplay)
                {
                    if (tx != null) await tx.RollbackAsync();
                    return ("REPLAY", "Duplicate transaction reference");
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
                if (tx != null) await tx.CommitAsync();
                return ("00", "Confirm Success");
            }
            catch (DbUpdateException)
            {
                if (tx != null) await tx.RollbackAsync();
                return ("02", "Order already confirmed");
            }
            finally
            {
                _vnpaySettleLock.Release();
            }
        }
    }
}
