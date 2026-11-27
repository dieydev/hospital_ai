using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using System.Linq;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HospitalAI.ExaminationService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;
        private readonly HospitalDbContext _dbContext;
        private readonly IConfiguration? _configuration;
        private readonly ILogger<PaymentController>? _logger;
        private readonly Func<DateTimeOffset>? _utcNowProvider;

        private static readonly JsonSerializerOptions WebhookJsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public PaymentController(
            IPaymentService paymentService,
            HospitalDbContext dbContext,
            IConfiguration? configuration = null,
            ILogger<PaymentController>? logger = null,
            Func<DateTimeOffset>? utcNowProvider = null)
        {
            _paymentService = paymentService;
            _dbContext = dbContext;
            _configuration = configuration;
            _logger = logger;
            _utcNowProvider = utcNowProvider;
        }

        [HttpGet("qr-config")]
        [AllowAnonymous]
        public IActionResult GetPublicQrConfig()
        {
            var options = PaymentQrHelper.ResolveOptions(_configuration);
            return Ok(new PaymentQrPublicConfigDto
            {
                Environment = options.Environment,
                IsSandbox = options.IsSandbox,
                BankCode = options.BankCode,
                BankBin = options.BankBin,
                AccountNumber = options.AccountNumber,
                AccountName = options.AccountName,
                PaymentPrefix = options.PaymentPrefix,
                IsConfigured = options.HasValidQrConfig
            });
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
                if (billing.Status == "Cancelled")
                {
                    return BadRequest(new { message = "Hóa đơn viện phí này đã bị hủy, không thể thanh toán." });
                }

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
                var displayCode = PaymentQrHelper.ResolveFallbackDisplayCode(billing);
                model.OrderDescription = $"Thanh toan vien phi {displayCode}";

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
                var url = _paymentService.CreatePaymentUrl(model, ipAddress);
                return Ok(new { Url = url, Amount = billing.TotalAmount, BillingId = billing.Id, PaymentCode = displayCode });
            }

            // Nếu OrderId là Guid của Appointment đặt khám trực tuyến -> tìm hoặc tạo 1 hóa đơn Registration duy nhất
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

            if (string.Equals(appointment.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new { message = "Lịch hẹn đã bị hủy, không thể khởi tạo thanh toán." });
            }

            var sepayOpts = PaymentQrHelper.ResolveOptions(_configuration);
            var boundedFee = (model.Amount >= 10000 && model.Amount <= 50000000) ? (decimal)Math.Round(model.Amount, 2) : 150000m;
            var aptBilling = await BillingSettlementService.GetOrCreateRegistrationBillingAsync(
                _dbContext,
                appointment.PatientId,
                appointment.Id,
                boundedFee,
                $"Phí khám theo lịch hẹn #{appointment.Id.ToString()[..8].ToUpperInvariant()}",
                sepayOpts);

            if (aptBilling.Status == "Paid")
            {
                return BadRequest(new { message = "Hóa đơn cho lịch hẹn này đã được thanh toán trước đó." });
            }

            model.OrderId = aptBilling.Id.ToString();
            model.Amount = (double)aptBilling.TotalAmount;
            var aptPayCode = PaymentQrHelper.ResolveFallbackDisplayCode(aptBilling, sepayOpts.PaymentPrefix);
            model.OrderDescription = $"Thanh toan vien phi {aptPayCode}";

            var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var aptPayUrl = _paymentService.CreatePaymentUrl(model, clientIp);
            return Ok(new { Url = aptPayUrl, Amount = aptBilling.TotalAmount, BillingId = aptBilling.Id, PaymentCode = aptPayCode });
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

            decimal actualPaidAmount = rawPaidAmount / 100m;

            if (vnp_ResponseCode != "00")
            {
                return BadRequest(new { Message = "Thanh toán thất bại hoặc bị hủy bởi người dùng", Success = false });
            }

            if (Guid.TryParse(vnp_TxnRef, out Guid billingId))
            {
                var settle = await BillingSettlementService.SettleVnPayAsync(
                    _dbContext,
                    billingId,
                    actualPaidAmount,
                    vnp_TxnRef,
                    Request.Query["vnp_TransactionNo"].ToString());

                if (settle.Code == SettlementOutcomeCode.NotFound)
                    return NotFound(new { Message = "Không tìm thấy hóa đơn tương ứng với giao dịch" });
                if (settle.Code == SettlementOutcomeCode.Cancelled)
                    return BadRequest(new { Message = "Hóa đơn đã bị hủy trước đó, không thể ghi nhận thanh toán." });
                if (settle.Code == SettlementOutcomeCode.InvalidAmount)
                    return BadRequest(new { Message = "Cảnh báo gian lận: Số tiền thực trả không khớp tổng tiền hóa đơn!", PaidAmount = actualPaidAmount });
                if (settle.Code == SettlementOutcomeCode.Replay)
                    return BadRequest(new { Message = "Cảnh báo gian lận: Mã giao dịch VNPay đã được sử dụng trước đó (Replay Attack)." });
                if (settle.Code == SettlementOutcomeCode.AlreadyPaid)
                    return Ok(new { Message = "Hóa đơn đã được xác nhận thanh toán trước đó.", OrderId = vnp_TxnRef, Success = true, BillingId = billingId });
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

            decimal actualPaidAmount = rawPaidAmount / 100m;

            if (Guid.TryParse(vnp_TxnRef, out Guid billingId))
            {
                if (vnp_ResponseCode != "00")
                {
                    var exists = await _dbContext.Billings.AsNoTracking().AnyAsync(b => b.Id == billingId);
                    if (!exists) return Ok(new { RspCode = "01", Message = "Order not found" });
                    return Ok(new { RspCode = "00", Message = "Confirm Success (Payment Failed at Gate)" });
                }

                var settle = await BillingSettlementService.SettleVnPayAsync(
                    _dbContext,
                    billingId,
                    actualPaidAmount,
                    vnp_TxnRef,
                    Request.Query["vnp_TransactionNo"].ToString());

                return settle.Code switch
                {
                    SettlementOutcomeCode.NotFound => Ok(new { RspCode = "01", Message = "Order not found" }),
                    SettlementOutcomeCode.AlreadyPaid or SettlementOutcomeCode.Replay or SettlementOutcomeCode.Cancelled => Ok(new { RspCode = "02", Message = "Order already confirmed" }),
                    SettlementOutcomeCode.InvalidAmount => Ok(new { RspCode = "04", Message = "Invalid amount" }),
                    _ => Ok(new { RspCode = "00", Message = "Confirm Success" })
                };
            }

            return Ok(new { RspCode = "00", Message = "Confirm Success" });
        }

        /// <summary>
        /// SePay Webhook tự động xác nhận thanh toán chuyển khoản VietQR (hỗ trợ cả SePay CLI Sandbox và HTTPS Production).
        /// Xác thực HMAC-SHA256 trên raw body gốc theo X-SePay-Signature và X-SePay-Timestamp.
        /// </summary>
        [HttpPost("sepay-webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> ReceiveSepayWebhook()
        {
            var options = PaymentQrHelper.ResolveOptions(_configuration);

            Request.EnableBuffering();
            byte[] rawBytes;
            using (var ms = new MemoryStream())
            {
                await Request.Body.CopyToAsync(ms);
                rawBytes = ms.ToArray();
            }

            if (Request.Body.CanSeek)
            {
                Request.Body.Position = 0;
            }

            var signatureHeader = Request.Headers["X-SePay-Signature"].FirstOrDefault();
            var timestampHeader = Request.Headers["X-SePay-Timestamp"].FirstOrDefault();

            var authCheck = BillingSettlementService.VerifySepayHmacSignature(
                signatureHeader,
                timestampHeader,
                rawBytes,
                options,
                _utcNowProvider?.Invoke());

            if (!authCheck.IsValid)
            {
                _logger?.LogWarning("SePay webhook rejected with status {StatusCode}: {Reason}", authCheck.HttpStatusCode, authCheck.ErrorMessage);
                return StatusCode(authCheck.HttpStatusCode, new { success = false, message = authCheck.ErrorMessage });
            }

            SepayWebhookPayloadDto? payload;
            try
            {
                payload = JsonSerializer.Deserialize<SepayWebhookPayloadDto>(rawBytes, WebhookJsonOptions);
            }
            catch (JsonException)
            {
                return BadRequest(new { success = false, message = "Payload JSON không hợp lệ." });
            }

            if (payload == null || payload.Id <= 0)
            {
                return BadRequest(new { success = false, message = "Thiếu thông tin định danh giao dịch SePay." });
            }

            var result = await BillingSettlementService.ProcessSepayWebhookAsync(
                _dbContext,
                payload,
                authCheck.TimestampSeconds,
                options);

            if (result.Code == SettlementOutcomeCode.DatabaseFailure)
            {
                _logger?.LogError("SePay webhook persistence failed for txn {SepayTxnId}: {Message}", payload.Id, result.Message);
                return StatusCode(500, new { success = false, message = result.Message });
            }

            if (result.Code == SettlementOutcomeCode.InvalidReference)
            {
                return BadRequest(new { success = false, message = result.Message });
            }

            _logger?.LogInformation(
                "SePay webhook handled for txn {SepayTxnId} with status {ProcessingStatus}",
                payload.Id,
                result.ProcessingStatus ?? result.Code.ToString());

            return Ok(new
            {
                success = true,
                status = result.ProcessingStatus ?? result.Code.ToString(),
                billingId = result.Billing?.Id,
                paymentCode = result.Billing?.PaymentCode
            });
        }
    }
}
