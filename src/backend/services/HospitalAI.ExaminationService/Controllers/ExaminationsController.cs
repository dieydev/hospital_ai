using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace HospitalAI.ExaminationService.Controllers;

[ApiController]
[Route("api/examinations")]
public class ExaminationsController : ControllerBase
{
    private readonly IExaminationService _examinationService;

    public ExaminationsController(IExaminationService examinationService)
    {
        _examinationService = examinationService;
    }

    /// <summary>
    /// Lấy danh sách lượt khám bệnh SOAP / EMR (Hỗ trợ lọc theo bệnh nhân, ngày khám, từ khóa)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetExaminations([FromQuery] string? search, [FromQuery] Guid? patientId, [FromQuery] DateTime? date)
    {
        var result = await _examinationService.GetExaminationsAsync(search, patientId, date);
        return Ok(result);
    }

    /// <summary>
    /// Lấy chi tiết lượt khám bệnh theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetExaminationById(Guid id)
    {
        var result = await _examinationService.GetExaminationByIdAsync(id);
        if (result == null)
            return NotFound(new { message = $"Không tìm thấy lượt khám với ID {id}" });

        return Ok(result);
    }

    /// <summary>
    /// Tạo mới lượt khám bệnh SOAP, chỉ số sinh hiệu, chẩn đoán ICD-10 và kê đơn thuốc
    /// </summary>
    [HttpPost]
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
    /// Cập nhật lượt khám bệnh
    /// </summary>
    [HttpPut("{id:guid}")]
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
    /// Xóa lượt khám bệnh
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteExamination(Guid id)
    {
        var success = await _examinationService.DeleteExaminationAsync(id);
        if (!success)
            return NotFound(new { message = $"Không tìm thấy lượt khám với ID {id}" });

        return NoContent();
    }
}
