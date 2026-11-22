using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace HospitalAI.ExaminationService.Controllers
{
    public class MedicineInventoryItem
    {
        public string DrugCode { get; set; } = string.Empty;
        public string DrugName { get; set; } = string.Empty;
        public string ActiveIngredient { get; set; } = string.Empty;
        public string BatchNumber { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public int StockQuantity { get; set; }
        public string Unit { get; set; } = "Viên";
        public decimal UnitPrice { get; set; }
    }

    [ApiController]
    [Route("api/pharmacy")]
    [Authorize]
    public class PharmacyController : ControllerBase
    {
        private readonly HospitalDbContext _dbContext;
        private static readonly SemaphoreSlim _dispenseLock = new(1, 1);

        // Kho dược quản lý tồn kho theo số lô và hạn dùng (Batch & Expiry tracking)
        private static readonly ConcurrentDictionary<string, MedicineInventoryItem> _inventory = new(
            new Dictionary<string, MedicineInventoryItem>(StringComparer.OrdinalIgnoreCase)
            {
                ["PARA-500"] = new()
                {
                    DrugCode = "PARA-500",
                    DrugName = "Paracetamol 500mg",
                    ActiveIngredient = "Paracetamol",
                    BatchNumber = "LOT-2026-PARA01",
                    ExpiryDate = DateTime.UtcNow.AddMonths(18),
                    StockQuantity = 1000,
                    Unit = "Viên",
                    UnitPrice = 1500m
                },
                ["AMOX-500"] = new()
                {
                    DrugCode = "AMOX-500",
                    DrugName = "Amoxicillin 500mg",
                    ActiveIngredient = "Amoxicillin",
                    BatchNumber = "LOT-2026-AMOX02",
                    ExpiryDate = DateTime.UtcNow.AddMonths(12),
                    StockQuantity = 500,
                    Unit = "Viên",
                    UnitPrice = 3000m
                },
                ["IBU-400"] = new()
                {
                    DrugCode = "IBU-400",
                    DrugName = "Ibuprofen 400mg",
                    ActiveIngredient = "Ibuprofen",
                    BatchNumber = "LOT-2026-IBU03",
                    ExpiryDate = DateTime.UtcNow.AddMonths(15),
                    StockQuantity = 400,
                    Unit = "Viên",
                    UnitPrice = 2500m
                },
                ["CEF-500"] = new()
                {
                    DrugCode = "CEF-500",
                    DrugName = "Cefuroxime 500mg",
                    ActiveIngredient = "Cefuroxime",
                    BatchNumber = "LOT-2026-CEF04",
                    ExpiryDate = DateTime.UtcNow.AddMonths(24),
                    StockQuantity = 300,
                    Unit = "Viên",
                    UnitPrice = 8500m
                },
                ["OMEP-20"] = new()
                {
                    DrugCode = "OMEP-20",
                    DrugName = "Omeprazole 20mg",
                    ActiveIngredient = "Omeprazole",
                    BatchNumber = "LOT-2026-OMEP05",
                    ExpiryDate = DateTime.UtcNow.AddMonths(20),
                    StockQuantity = 600,
                    Unit = "Viên",
                    UnitPrice = 2000m
                }
            }
        );

        public PharmacyController(HospitalDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Lấy danh mục thuốc trong kho viện (Kèm số lô, hạn sử dụng và số lượng tồn)
        /// </summary>
        [HttpGet("inventory")]
        [Authorize(Roles = "Pharmacy,Doctor,Admin")]
        public IActionResult GetInventory()
        {
            return Ok(_inventory.Values.OrderBy(i => i.DrugName).ToList());
        }

        /// <summary>
        /// Lấy danh sách các đơn thuốc cần cấp phát (Nhà thuốc, Bác sĩ, Quản trị)
        /// </summary>
        [HttpGet("prescriptions")]
        [Authorize(Roles = "Pharmacy,Doctor,Admin")]
        public async Task<IActionResult> GetPrescriptions([FromQuery] string? status = null)
        {
            var query = _dbContext.Examinations
                .Include(e => e.Patient)
                .Include(e => e.Doctor)
                .Include(e => e.PrescriptionDetails)
                .Where(e => e.PrescriptionDetails.Any())
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "ALL" && status != "Tất cả")
            {
                query = query.Where(e => e.PrescriptionDispenseStatus == status);
            }

            var list = await query
                .OrderByDescending(e => e.ExaminationDate)
                .Select(e => new
                {
                    PrescriptionId = e.Id,
                    ExaminationCode = e.ExaminationCode,
                    PatientId = e.PatientId,
                    PatientName = e.Patient != null ? e.Patient.FullName : "Khách vãng lai",
                    PatientCode = e.Patient != null ? e.Patient.PatientCode : "",
                    IdentityCardNumber = e.Patient != null ? e.Patient.IdentityCardNumber : "",
                    DoctorName = e.Doctor != null ? e.Doctor.FullName : "Bác sĩ phụ trách",
                    PrescribedDate = e.ExaminationDate.ToString("yyyy-MM-dd HH:mm"),
                    NationalPrescriptionCode = e.NationalPrescriptionCode,
                    Status = e.PrescriptionDispenseStatus ?? "Chờ cấp phát",
                    DispensedAt = e.PrescriptionDispensedAt != null ? e.PrescriptionDispensedAt.Value.ToString("yyyy-MM-dd HH:mm") : null,
                    DispensedBy = e.PrescriptionDispensedBy,
                    DoctorAdvice = e.DietaryAdvice ?? e.Plan,
                    Items = e.PrescriptionDetails.Select(p => new
                    {
                        MedicineName = p.MedicineName,
                        NationalDrugCode = p.NationalDrugCode,
                        Unit = p.Unit,
                        Quantity = p.Quantity,
                        DosageInstruction = p.DosageInstruction,
                        UnitPrice = p.UnitPrice,
                        TotalPrice = p.Quantity * p.UnitPrice
                    }).ToList()
                })
                .ToListAsync();

            return Ok(list);
        }

        /// <summary>
        /// Cấp phát đơn thuốc tại quầy Nhà thuốc (Atomic Concurrency Control & Double Dispense Prevention)
        /// </summary>
        [HttpPost("prescriptions/{id:guid}/dispense")]
        [Authorize(Roles = "Pharmacy,Admin")]
        public async Task<IActionResult> DispensePrescription(Guid id)
        {
            if (id == Guid.Empty)
            {
                return BadRequest(new { message = "Mã đơn thuốc không hợp lệ." });
            }

            // Đồng bộ khóa nguyên tử chống race condition khi 2 request gửi đồng thời (Chống cấp phát trùng & trừ kho 2 lần)
            await _dispenseLock.WaitAsync();
            try
            {
                var exam = await _dbContext.Examinations
                    .Include(e => e.PrescriptionDetails)
                    .Include(e => e.Patient)
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (exam == null)
                {
                    return NotFound(new { message = $"Không tìm thấy đơn thuốc tương ứng với mã {id}." });
                }

                // 1. Kiểm tra đơn thuốc đã bị hủy hoặc thay thế bởi Bác sĩ
                if (exam.PrescriptionDispenseStatus == "Đã hủy")
                {
                    return BadRequest(new { message = "Đơn thuốc này đã bị hủy hoặc thay thế bởi Bác sĩ lâm sàng. Không được phép cấp phát!" });
                }

                // 2. Chống cấp phát trùng lặp (Idempotency / Double Dispense Prevention) -> Trả về HTTP 409 Conflict
                if (exam.PrescriptionDispenseStatus == "Đã cấp phát")
                {
                    return Conflict(new
                    {
                        message = "Đơn thuốc này đã được cấp phát trước đó! Không thể cấp phát trùng lặp.",
                        dispensedAt = exam.PrescriptionDispensedAt,
                        dispensedBy = exam.PrescriptionDispensedBy
                    });
                }

                // 3. Kiểm tra số lượng tồn kho và hạn sử dụng từng loại thuốc theo lô (Batch & Expiry check)
                foreach (var detail in exam.PrescriptionDetails)
                {
                    var matchedStock = _inventory.Values.FirstOrDefault(i =>
                        i.DrugName.Contains(detail.MedicineName, StringComparison.OrdinalIgnoreCase) ||
                        detail.MedicineName.Contains(i.DrugName, StringComparison.OrdinalIgnoreCase) ||
                        (!string.IsNullOrEmpty(detail.NationalDrugCode) && i.DrugCode.Equals(detail.NationalDrugCode, StringComparison.OrdinalIgnoreCase)));

                    if (matchedStock != null)
                    {
                        // Kiểm tra hạn sử dụng
                        if (matchedStock.ExpiryDate <= DateTime.UtcNow)
                        {
                            return BadRequest(new
                            {
                                message = $"Thuốc '{matchedStock.DrugName}' thuộc lô {matchedStock.BatchNumber} đã hết hạn sử dụng ({matchedStock.ExpiryDate:dd/MM/yyyy}). Không thể xuất kho!",
                                drugName = matchedStock.DrugName,
                                batchNumber = matchedStock.BatchNumber
                            });
                        }

                        // Kiểm tra tồn kho
                        if (matchedStock.StockQuantity < detail.Quantity)
                        {
                            return BadRequest(new
                            {
                                message = $"Thuốc '{matchedStock.DrugName}' không đủ tồn kho để cấp phát (Tồn kho: {matchedStock.StockQuantity}, Cần: {detail.Quantity}).",
                                drugName = matchedStock.DrugName,
                                availableStock = matchedStock.StockQuantity,
                                requiredQuantity = detail.Quantity
                            });
                        }
                    }
                }

                // 4. Trừ tồn kho dược an toàn
                foreach (var detail in exam.PrescriptionDetails)
                {
                    var matchedStock = _inventory.Values.FirstOrDefault(i =>
                        i.DrugName.Contains(detail.MedicineName, StringComparison.OrdinalIgnoreCase) ||
                        detail.MedicineName.Contains(i.DrugName, StringComparison.OrdinalIgnoreCase) ||
                        (!string.IsNullOrEmpty(detail.NationalDrugCode) && i.DrugCode.Equals(detail.NationalDrugCode, StringComparison.OrdinalIgnoreCase)));

                    if (matchedStock != null)
                    {
                        matchedStock.StockQuantity -= detail.Quantity;
                    }
                }

                // 5. Cập nhật trạng thái cấp phát
                var currentUserName = User.FindFirstValue(ClaimTypes.Name) ??
                                      (User.IsInRole("Admin") ? "Quản trị viên (Admin)" : "Nhà thuốc (D-Medical)");

                exam.PrescriptionDispenseStatus = "Đã cấp phát";
                exam.PrescriptionDispensedAt = DateTime.UtcNow;
                exam.PrescriptionDispensedBy = currentUserName;

                await _dbContext.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Cấp phát thuốc thành công và đã xuất kho an toàn.",
                    prescriptionId = exam.Id,
                    examinationCode = exam.ExaminationCode,
                    patientName = exam.Patient?.FullName,
                    dispensedAt = exam.PrescriptionDispensedAt,
                    dispensedBy = exam.PrescriptionDispensedBy
                });
            }
            finally
            {
                _dispenseLock.Release();
            }
        }

        /// <summary>
        /// Bác sĩ lâm sàng hoặc Admin hủy đơn thuốc (Ngăn chặn nhà thuốc cấp phát đơn lỗi)
        /// </summary>
        [HttpPost("prescriptions/{id:guid}/cancel")]
        [Authorize(Roles = "Doctor,Admin")]
        public async Task<IActionResult> CancelPrescription(Guid id, [FromQuery] string? reason = null)
        {
            if (id == Guid.Empty)
            {
                return BadRequest(new { message = "Mã đơn thuốc không hợp lệ." });
            }

            var exam = await _dbContext.Examinations.FirstOrDefaultAsync(e => e.Id == id);
            if (exam == null)
            {
                return NotFound(new { message = $"Không tìm thấy đơn thuốc với mã {id}." });
            }

            if (exam.PrescriptionDispenseStatus == "Đã cấp phát")
            {
                return BadRequest(new { message = "Đơn thuốc đã được Nhà thuốc cấp phát và xuất kho, không thể hủy!" });
            }

            exam.PrescriptionDispenseStatus = "Đã hủy";
            await _dbContext.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Đã hủy đơn thuốc thành công.",
                prescriptionId = id,
                cancelReason = reason ?? "Bác sĩ lâm sàng điều chỉnh phác đồ hoặc thay thế đơn thuốc"
            });
        }
    }
}
