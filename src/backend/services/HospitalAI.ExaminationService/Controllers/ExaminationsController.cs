using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalAI.ExaminationService.Controllers;

[ApiController]
[Route("api/examinations")]
[Authorize]
public class ExaminationsController : ControllerBase
{
    private readonly IExaminationService _examinationService;
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _rateLimiter = new();

    public ExaminationsController(IExaminationService examinationService)
    {
        _examinationService = examinationService;
    }

    private bool IsStaff()
    {
        return User.IsInRole("Admin") || User.IsInRole("Doctor") || User.IsInRole("Receptionist") ||
               User.IsInRole("Triage") || User.IsInRole("Pharmacy") || User.IsInRole("Nurse") || User.IsInRole("Cashier");
    }

    /// <summary>
    /// Lấy danh sách lượt khám bệnh SOAP / EMR (Bệnh nhân chỉ xem được lượt khám của chính mình)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetExaminations([FromQuery] string? search, [FromQuery] Guid? patientId, [FromQuery] DateTime? date)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var result = await _examinationService.GetExaminationsAsync(search, patientId, date);

        // IDOR Protection: Bệnh nhân chỉ xem được lượt khám thuộc về tài khoản của mình
        if (!IsStaff())
        {
            result = result.Where(e => e.PatientUserId.HasValue && e.PatientUserId.ToString() == currentUserId).ToList();
        }

        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết lượt khám bệnh theo ID (Kiểm tra quyền sở hữu)
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetExaminationById(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest(new { message = "Mã ID lượt khám không hợp lệ." });

        var result = await _examinationService.GetExaminationByIdAsync(id);
        if (result == null)
            return NotFound(new { message = $"Không tìm thấy lượt khám với ID {id}" });

        if (!IsStaff())
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!result.PatientUserId.HasValue || result.PatientUserId.ToString() != currentUserId)
            {
                return Forbid();
            }
        }

        return Ok(result);
    }

    /// <summary>
    /// Tạo mới lượt khám bệnh SOAP, ICD-10 và kê đơn thuốc (Chỉ Bác sĩ có CCHN theo TT 32/2023)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> CreateExamination([FromBody] CreateExaminationDto dto)
    {
        try
        {
            // Chống giả mạo danh tính Bác sĩ kê đơn: ưu tiên gắn DoctorId từ JWT của Bác sĩ đang đăng nhập
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(currentUserId, out var authenticatedDoctorId) && authenticatedDoctorId != Guid.Empty)
            {
                dto.DoctorId = authenticatedDoctorId;
            }

            var result = await _examinationService.CreateExaminationAsync(dto);
            return CreatedAtAction(nameof(GetExaminationById), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật lượt khám bệnh (Chỉ Bác sĩ điều trị - Không cho phép sửa bệnh án đã ký số)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> UpdateExamination(Guid id, [FromBody] CreateExaminationDto dto)
    {
        if (id == Guid.Empty)
            return BadRequest(new { message = "Mã ID lượt khám không hợp lệ." });

        try
        {
            var result = await _examinationService.UpdateExaminationAsync(id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa lượt khám bệnh (Chỉ dành cho Quản trị viên - Không thể xóa bệnh án đã ký số)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteExamination(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest(new { message = "Mã ID lượt khám không hợp lệ." });

        try
        {
            var success = await _examinationService.DeleteExaminationAsync(id);
            if (!success)
                return NotFound(new { message = $"Không tìm thấy lượt khám với ID {id}" });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Ký số Bác sĩ vào Hồ sơ Bệnh án EMR theo chuẩn Bộ Y Tế (Chỉ Bác sĩ có chứng chỉ hành nghề)
    /// </summary>
    [HttpPost("{id:guid}/sign")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> SignExamination(Guid id, [FromBody] SignExaminationRequestDto dto)
    {
        if (id == Guid.Empty)
            return BadRequest(new { message = "Mã ID lượt khám không hợp lệ." });

        try
        {
            var doctorName = User.FindFirstValue(ClaimTypes.Name) ?? "Bác sĩ lâm sàng";
            var result = await _examinationService.SignExaminationAsync(id, dto, doctorName);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xác thực tính toàn vẹn Chữ ký số EMR (Hỗ trợ quét QR trên bản in PDF)
    /// Endpoint công khai có cơ chế giới hạn truy vấn (Rate Limit) chống dò quét ID bệnh án
    /// </summary>
    [HttpGet("{id:guid}/verify-signature")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifySignature(Guid id)
    {
        if (id == Guid.Empty)
            return BadRequest(new { message = "Mã ID lượt khám không hợp lệ." });

        // Giới hạn tần suất tra cứu công khai chống enumeration dò quét ID
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "default_client";
        var now = DateTime.UtcNow;
        var entry = _rateLimiter.AddOrUpdate(clientIp, (1, now), (k, old) =>
            (now - old.WindowStart).TotalMinutes < 1 ? (old.Count + 1, old.WindowStart) : (1, now));

        if (entry.Count > 60)
        {
            return StatusCode(429, new { message = "Bạn đã thực hiện quá nhiều yêu cầu xác minh trong thời gian ngắn. Vui lòng thử lại sau 1 phút!" });
        }

        try
        {
            var result = await _examinationService.VerifySignatureAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            // Trả về thông điệp an toàn, không xác nhận sự tồn tại cụ thể
            return NotFound(new { message = "Không tìm thấy hồ sơ bệnh án hoặc mã xác thực không hợp lệ." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật & Chứng thực Kết quả Cận lâm sàng (Chỉ dành cho Nhân viên Y tế và Bác sĩ)
    /// Nhân viên sàng lọc y tế (Triage) không được phép can thiệp kết quả CLS
    /// </summary>
    [HttpPut("{id:guid}/cls-result")]
    [Authorize(Roles = "Nurse,Doctor")]
    public async Task<IActionResult> UpdateClsResult(Guid id, [FromBody] UpdateClsResultDto dto)
    {
        if (id == Guid.Empty || dto.ServiceOrderDetailId == Guid.Empty)
            return BadRequest(new { message = "Mã lượt khám hoặc mã dịch vụ CLS không hợp lệ." });

        try
        {
            var success = await _examinationService.UpdateClsResultAsync(id, dto.ServiceOrderDetailId, dto.Result, dto.Status);
            if (!success)
                return NotFound(new { message = "Không tìm thấy chỉ định dịch vụ CLS tương ứng." });

            return Ok(new { message = "Cập nhật và chứng thực kết quả cận lâm sàng thành công." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Ghi nhận Chỉ số Sinh tồn & Sàng lọc ban đầu (Dành cho Nhân viên Sàng lọc y tế Triage, Y tế và Bác sĩ)
    /// Tiếp tân, Thu ngân, Nhà thuốc không có quyền can thiệp chỉ số sinh tồn y tế
    /// </summary>
    [HttpPost("{id:guid}/vital-signs")]
    [Authorize(Roles = "Triage,Nurse,Doctor")]
    public async Task<IActionResult> RecordVitalSigns(Guid id, [FromBody] RecordVitalSignsDto dto)
    {
        if (id == Guid.Empty)
            return BadRequest(new { message = "Mã lượt khám không hợp lệ." });

        try
        {
            var success = await _examinationService.RecordVitalSignsAsync(id, dto);
            if (!success)
                return NotFound(new { message = "Không tìm thấy lượt khám tương ứng." });

            return Ok(new { message = "Ghi nhận chỉ số sinh tồn và phân loại sàng lọc thành công." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

}
