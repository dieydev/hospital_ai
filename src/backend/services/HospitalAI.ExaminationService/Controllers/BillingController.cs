using HospitalAI.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalAI.ExaminationService.Controllers;

[ApiController]
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly HospitalDbContext _dbContext;

    public BillingController(HospitalDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetBillings([FromQuery] string? status = null, [FromQuery] string? type = null)
    {
        var query = _dbContext.Billings
            .Include(b => b.Patient)
            .Include(b => b.Items)
            .AsQueryable();

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

    [HttpPost("{id}/pay-cash")]
    public async Task<IActionResult> PayCash(Guid id)
    {
        var billing = await _dbContext.Billings
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (billing == null)
            return NotFound(new { Message = "Không tìm thấy hóa đơn" });

        if (billing.Status == "Paid")
            return BadRequest(new { Message = "Hóa đơn đã được thanh toán trước đó" });

        billing.Status = "Paid";
        billing.PaidAt = DateTime.UtcNow;
        billing.PaymentMethod = "Tiền mặt";

        // Cập nhật trạng thái liên quan (VD: Lượt khám, Phiếu chỉ định)
        if (billing.BillingType == "Registration" && billing.ExaminationId.HasValue)
        {
            var exam = await _dbContext.Examinations.FirstOrDefaultAsync(e => e.Id == billing.ExaminationId.Value);
            if (exam != null)
            {
                exam.Status = "Paid"; // Hoặc "Queued" tuỳ logic
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

        return Ok(new { Message = "Thanh toán tiền mặt thành công", Success = true });
    }
}
