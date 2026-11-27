using HospitalAI.Application.DTOs;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalAI.ExaminationService.Controllers;

[ApiController]
[Route("api/billing")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly HospitalDbContext _dbContext;
    private readonly IConfiguration? _configuration;

    public BillingController(HospitalDbContext dbContext, IConfiguration? configuration = null)
    {
        _dbContext = dbContext;
        _configuration = configuration;
    }

    private bool IsStaff()
    {
        return User.IsInRole("Admin") || User.IsInRole("Doctor") || User.IsInRole("Receptionist") ||
               User.IsInRole("Triage") || User.IsInRole("Pharmacy") || User.IsInRole("Nurse") || User.IsInRole("Cashier");
    }

    /// <summary>
    /// Lấy danh sách hóa đơn viện phí (Bệnh nhân chỉ xem được hóa đơn của chính mình)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetBillings([FromQuery] string? status = null, [FromQuery] string? type = null)
    {
        var options = PaymentQrHelper.ResolveOptions(_configuration);

        var query = _dbContext.Billings
            .Include(b => b.Patient)
            .Include(b => b.Items)
            .AsNoTracking()
            .AsQueryable();

        // IDOR Protection: Nếu là Bệnh nhân, chỉ lấy hóa đơn gắn với tài khoản của họ
        if (!IsStaff())
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(currentUserId, out var parsedUserId))
            {
                query = query.Where(b => b.Patient != null && b.Patient.UserId == parsedUserId);
            }
            else
            {
                return Ok(new object[] { });
            }
        }

        if (!string.IsNullOrEmpty(status) && status != "ALL")
        {
            query = query.Where(b => b.Status == status);
        }

        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(b => b.BillingType == type);
        }

        var rawBillings = await query
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var billings = rawBillings.Select(b =>
        {
            var paymentCode = PaymentQrHelper.ResolveFallbackDisplayCode(b, options.PaymentPrefix);
            var vietQrUrl = b.Status == "Unpaid"
                ? PaymentQrHelper.BuildVietQrImageUrl(options, b.TotalAmount, paymentCode)
                : null;

            return new
            {
                Id = b.Id,
                MaHoaDon = paymentCode,
                MaThanhToan = paymentCode,
                MaBenhNhan = b.Patient != null ? (!string.IsNullOrWhiteSpace(b.Patient.PatientCode) ? b.Patient.PatientCode : b.Patient.Id.ToString().Substring(0, 8).ToUpper()) : "",
                TenBenhNhan = b.Patient != null ? b.Patient.FullName : "Khách vãng lai",
                MaLuotKham = b.ExaminationId != null ? b.ExaminationId.ToString()!.Substring(0, 8).ToUpper() : "",
                AppointmentId = b.AppointmentId,
                NgayLap = b.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                TongTien = b.TotalAmount,
                Status = b.Status,
                TrangThai = b.Status == "Paid" ? "Đã thanh toán" : (b.Status == "Cancelled" ? "Đã hủy" : "Chưa thanh toán"),
                PhuongThucThanhToan = b.PaymentMethod ?? "",
                TransactionRef = b.TransactionRef,
                GhiChuDoiSoat = b.DiscrepancyNote,
                VietQrUrl = vietQrUrl,
                Environment = options.Environment,
                IsSandbox = options.IsSandbox,
                LoaiHoaDon = b.BillingType,
                Items = b.Items.Select(i => new
                {
                    TenDichVu = i.ItemName,
                    DonGia = i.UnitPrice,
                    SoLuong = i.Quantity,
                    ThanhTien = i.TotalPrice
                }).ToList()
            };
        }).ToList();

        return Ok(billings);
    }

    /// <summary>
    /// Lấy trạng thái thanh toán thời gian thực của một hóa đơn (hỗ trợ auto-polling ở Thu ngân và Đặt lịch Online)
    /// </summary>
    [HttpGet("{id:guid}/status")]
    public async Task<IActionResult> GetBillingStatus(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest(new { Message = "Mã hóa đơn không hợp lệ" });

        var billing = await _dbContext.Billings
            .Include(b => b.Patient)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);

        if (billing == null)
            return NotFound(new { Message = "Không tìm thấy hóa đơn" });

        if (!IsStaff())
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isOwner = billing.Patient != null &&
                          billing.Patient.UserId.HasValue &&
                          Guid.TryParse(currentUserId, out var parsedUid) &&
                          billing.Patient.UserId.Value == parsedUid;
            if (!isOwner)
            {
                return Forbid();
            }
        }

        var options = PaymentQrHelper.ResolveOptions(_configuration);
        var paymentCode = PaymentQrHelper.ResolveFallbackDisplayCode(billing, options.PaymentPrefix);
        var vietQrUrl = billing.Status == "Unpaid"
            ? PaymentQrHelper.BuildVietQrImageUrl(options, billing.TotalAmount, paymentCode)
            : null;

        var recentLogs = await _dbContext.SepayWebhookTransactions
            .AsNoTracking()
            .Where(l => l.BillingId == billing.Id)
            .OrderByDescending(l => l.ReceivedAt)
            .Take(5)
            .Select(l => new SepayDiscrepancyLogDto
            {
                SepayTransactionId = l.SepayTransactionId,
                TransferAmount = l.TransferAmount,
                ExpectedAmount = l.ExpectedAmount,
                DiscrepancyAmount = l.DiscrepancyAmount,
                ProcessingStatus = l.ProcessingStatus,
                Note = l.Note,
                ReceivedAt = l.ReceivedAt
            })
            .ToListAsync();

        return Ok(new BillingStatusSummaryDto
        {
            BillingId = billing.Id,
            PaymentCode = paymentCode,
            BillingType = billing.BillingType,
            TotalAmount = billing.TotalAmount,
            Status = billing.Status,
            TrangThai = billing.Status == "Paid" ? "Đã thanh toán" : (billing.Status == "Cancelled" ? "Đã hủy" : "Chưa thanh toán"),
            PaymentMethod = billing.PaymentMethod,
            TransactionRef = billing.TransactionRef,
            DiscrepancyNote = billing.DiscrepancyNote,
            PaidAt = billing.PaidAt,
            AppointmentId = billing.AppointmentId,
            VietQrUrl = vietQrUrl,
            Environment = options.Environment,
            IsSandbox = options.IsSandbox,
            RecentWebhookEvents = recentLogs
        });
    }

    /// <summary>
    /// Thu tiền mặt viện phí tại quầy (Phân định trách nhiệm: Tiếp nhận chỉ thu phí khám ban đầu, Thu ngân thu toàn bộ. Admin bị chặn)
    /// </summary>
    [HttpPost("{id}/pay-cash")]
    [Authorize(Roles = "Cashier,Receptionist")]
    public async Task<IActionResult> PayCash(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest(new { Message = "Mã hóa đơn không hợp lệ" });

        Guid? cashierUserId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsedUid)
            ? parsedUid
            : null;

        var result = await BillingSettlementService.SettleManualCashAsync(
            _dbContext,
            id,
            cashierUserId,
            User.IsInRole("Cashier") || User.IsInRole("Admin"),
            User.IsInRole("Receptionist"));

        return result.Code switch
        {
            SettlementOutcomeCode.NotFound => NotFound(new { Message = result.Message }),
            SettlementOutcomeCode.AlreadyPaid or SettlementOutcomeCode.Cancelled or SettlementOutcomeCode.ForbiddenRole => BadRequest(new { Message = result.Message }),
            SettlementOutcomeCode.Replay => Conflict(new { Message = result.Message }),
            SettlementOutcomeCode.Success => Ok(new { Message = result.Message, Success = true, BillingId = result.Billing!.Id, PaymentCode = result.Billing.PaymentCode }),
            _ => StatusCode(500, new { Message = result.Message })
        };
    }

    /// <summary>
    /// Xác nhận thanh toán Chuyển khoản VietQR Ngân hàng (Thu ngân xác thực giao dịch chuyển khoản đối soát thủ công. Admin bị chặn)
    /// </summary>
    [HttpPost("{id}/pay-transfer")]
    [Authorize(Roles = "Cashier,Receptionist")]
    public async Task<IActionResult> PayTransfer(Guid id, [FromQuery] string? transactionRef = null)
    {
        if (id == Guid.Empty)
            return BadRequest(new { Message = "Mã hóa đơn không hợp lệ" });

        Guid? cashierUserId = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var parsedUid)
            ? parsedUid
            : null;

        var result = await BillingSettlementService.SettleManualTransferAsync(
            _dbContext,
            id,
            transactionRef,
            cashierUserId,
            User.IsInRole("Cashier") || User.IsInRole("Admin"),
            User.IsInRole("Receptionist"),
            User.IsInRole("Cashier"));

        return result.Code switch
        {
            SettlementOutcomeCode.NotFound => NotFound(new { Message = result.Message }),
            SettlementOutcomeCode.Replay => Conflict(new { Message = result.Message }),
            SettlementOutcomeCode.AlreadyPaid or SettlementOutcomeCode.Cancelled or SettlementOutcomeCode.ForbiddenRole or SettlementOutcomeCode.InvalidReference => BadRequest(new { Message = result.Message }),
            SettlementOutcomeCode.Success => Ok(new { Message = result.Message, Success = true, BillingId = result.Billing!.Id, TransactionRef = result.Billing.TransactionRef, PaymentCode = result.Billing.PaymentCode }),
            _ => StatusCode(500, new { Message = result.Message })
        };
    }
}
