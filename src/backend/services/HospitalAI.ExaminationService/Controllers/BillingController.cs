using HospitalAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    public BillingController(HospitalDbContext dbContext)
    {
        _dbContext = dbContext;
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
        var query = _dbContext.Billings
            .Include(b => b.Patient)
            .Include(b => b.Items)
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

        var billings = await query
            .OrderByDescending(b => b.CreatedAt)
            .Select(b => new
            {
                Id = b.Id,
                MaHoaDon = b.Id.ToString().Substring(0, 8).ToUpper(),
                MaBenhNhan = b.Patient != null ? b.Patient.Id.ToString().Substring(0, 8).ToUpper() : "",
                TenBenhNhan = b.Patient != null ? b.Patient.FullName : "Khách vãng lai",
                MaLuotKham = b.ExaminationId != null ? b.ExaminationId.ToString()!.Substring(0, 8).ToUpper() : "",
                NgayLap = b.CreatedAt.ToString("yyyy-MM-dd HH:mm"),
                TongTien = b.TotalAmount,
                TrangThai = b.Status == "Paid" ? "Đã thanh toán" : "Chưa thanh toán",
                PhuongThucThanhToan = b.PaymentMethod ?? "",
                LoaiHoaDon = b.BillingType,
                Items = b.Items.Select(i => new
                {
                    TenDichVu = i.ItemName,
                    DonGia = i.UnitPrice,
                    SoLuong = i.Quantity,
                    ThanhTien = i.TotalPrice
                }).ToList()
            })
            .ToListAsync();

        return Ok(billings);
    }

    /// <summary>
    /// Thu tiền mặt viện phí tại quầy (Phân định trách nhiệm: Tiếp nhận chỉ thu phí khám ban đầu, Thu ngân thu toàn bộ)
    /// </summary>
    [HttpPost("{id}/pay-cash")]
    [Authorize(Roles = "Cashier,Receptionist,Admin")]
    public async Task<IActionResult> PayCash(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest(new { Message = "Mã hóa đơn không hợp lệ" });

        var billing = await _dbContext.Billings
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (billing == null)
            return NotFound(new { Message = "Không tìm thấy hóa đơn" });

        if (billing.Status == "Paid")
            return BadRequest(new { Message = "Hóa đơn đã được thanh toán trước đó" });

        // Phân định trách nhiệm: Nhân viên tiếp nhận chỉ được thu phí khám ban đầu (Registration)
        if (User.IsInRole("Receptionist") && !User.IsInRole("Cashier") && !User.IsInRole("Admin"))
        {
            if (billing.BillingType != "Registration")
            {
                return BadRequest(new { Message = "Nhân viên tiếp nhận chỉ có thẩm quyền thu phí khám ban đầu (Registration). Vui lòng chuyển bệnh nhân sang quầy Thu ngân để thanh toán viện phí cận lâm sàng hoặc thuốc." });
            }
        }

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(currentUserId, out var cashierGuid))
        {
            billing.CashierId = cashierGuid;
        }

        billing.Status = "Paid";
        billing.PaidAt = DateTime.UtcNow;
        billing.PaymentMethod = "Tiền mặt";

        // Cập nhật trạng thái liên quan (VD: Lượt khám, Phiếu chỉ định)
        if (billing.BillingType == "Registration" && billing.ExaminationId.HasValue)
        {
            var exam = await _dbContext.Examinations.FirstOrDefaultAsync(e => e.Id == billing.ExaminationId.Value);
            if (exam != null)
            {
                exam.Status = "Paid";
            }
        }
        else if (billing.BillingType == "ServiceOrder")
        {
            var item = billing.Items.FirstOrDefault();
            if (item != null && item.ReferenceId.HasValue)
            {
                var serviceOrder = await _dbContext.ServiceOrders.FirstOrDefaultAsync(s => s.Id == item.ReferenceId.Value);
                if (serviceOrder != null) serviceOrder.Status = "Paid";
            }
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new { Message = "Thanh toán tiền mặt thành công", Success = true, BillingId = billing.Id });
    }

    /// <summary>
    /// Xác nhận thanh toán Chuyển khoản VietQR Ngân hàng (Thu ngân xác thực giao dịch chuyển khoản đối soát)
    /// </summary>
    [HttpPost("{id}/pay-transfer")]
    [Authorize(Roles = "Cashier,Receptionist,Admin")]
    public async Task<IActionResult> PayTransfer(Guid id, [FromQuery] string? transactionRef = null)
    {
        if (id == Guid.Empty)
            return BadRequest(new { Message = "Mã hóa đơn không hợp lệ" });

        var billing = await _dbContext.Billings
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (billing == null)
            return NotFound(new { Message = "Không tìm thấy hóa đơn" });

        if (billing.Status == "Paid")
            return BadRequest(new { Message = "Hóa đơn đã được thanh toán trước đó" });

        // Phân định trách nhiệm thu phí
        if (User.IsInRole("Receptionist") && !User.IsInRole("Cashier") && !User.IsInRole("Admin"))
        {
            if (billing.BillingType != "Registration")
            {
                return BadRequest(new { Message = "Nhân viên tiếp nhận chỉ có thẩm quyền xác nhận thu phí khám ban đầu. Vui lòng chuyển bệnh nhân sang quầy Thu ngân." });
            }
        }

        // Chống giả mạo xác nhận thanh toán: Bắt buộc phải có mã giao dịch/đối soát hợp lệ từ ngân hàng
        if (string.IsNullOrWhiteSpace(transactionRef))
        {
            return BadRequest(new { Message = "Vui lòng cung cấp mã tham chiếu giao dịch (TransactionRef) hoặc mã chuẩn chi ngân hàng để đối soát thanh toán hợp lệ." });
        }

        var cleanRef = transactionRef.Trim();

        // Chống Replay / Giao dịch trùng lặp: Kiểm tra mã tham chiếu giao dịch đã từng được dùng cho hóa đơn nào khác chưa
        var isDuplicateTxn = await _dbContext.Billings.AnyAsync(b => b.TransactionRef == cleanRef && b.Id != id);
        if (isDuplicateTxn)
        {
            return Conflict(new { Message = "Mã giao dịch đối soát này đã được ghi nhận cho một hóa đơn khác trong hệ thống. Cảnh báo giao dịch trùng lặp hoặc giả mạo!" });
        }

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(currentUserId, out var cashierGuid))
        {
            billing.CashierId = cashierGuid;
        }

        billing.Status = "Paid";
        billing.PaidAt = DateTime.UtcNow;
        billing.PaymentMethod = "Chuyển khoản VietQR";
        billing.TransactionRef = cleanRef;

        // Cập nhật trạng thái liên quan
        if (billing.BillingType == "Registration" && billing.ExaminationId.HasValue)
        {
            var exam = await _dbContext.Examinations.FirstOrDefaultAsync(e => e.Id == billing.ExaminationId.Value);
            if (exam != null)
            {
                exam.Status = "Paid";
            }
        }
        else if (billing.BillingType == "ServiceOrder")
        {
            var item = billing.Items.FirstOrDefault();
            if (item != null && item.ReferenceId.HasValue)
            {
                var serviceOrder = await _dbContext.ServiceOrders.FirstOrDefaultAsync(s => s.Id == item.ReferenceId.Value);
                if (serviceOrder != null) serviceOrder.Status = "Paid";
            }
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new { Message = "Xác nhận chuyển khoản VietQR thành công", Success = true, BillingId = billing.Id, TransactionRef = billing.TransactionRef });
    }
}
