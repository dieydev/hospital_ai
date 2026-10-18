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

    public ExaminationsController(IExaminationService examinationService)
    {
        _examinationService = examinationService;
    }

    private bool IsStaff()
    {
        return User.IsInRole("Admin") || User.IsInRole("Doctor") || User.IsInRole("Nurse") || User.IsInRole("Receptionist");
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
    /// Tạo mới lượt khám bệnh SOAP, ICD-10 và kê đơn thuốc (Chỉ dành cho Bác sĩ và Admin)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> CreateExamination([FromBody] CreateExaminationDto dto)
    {
        try
        {
            var result = await _examinationService.CreateExaminationAsync(dto);
            return CreatedAtAction(nameof(GetExaminationById), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật lượt khám bệnh (Chỉ dành cho Bác sĩ và Admin)
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> UpdateExamination(Guid id, [FromBody] CreateExaminationDto dto)
    {
        try
        {
            var result = await _examinationService.UpdateExaminationAsync(id, dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Xóa lượt khám bệnh (Chỉ dành cho Quản trị viên)
    /// </summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteExamination(Guid id)
    {
        var success = await _examinationService.DeleteExaminationAsync(id);
        if (!success)
            return NotFound(new { message = $"Không tìm thấy lượt khám với ID {id}" });

        return NoContent();
    }
}
