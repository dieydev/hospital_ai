using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalAI.PatientService.Controllers;

[ApiController]
[Route("api/patients")]
public class PatientsController : ControllerBase
{
    private readonly IPatientService _patientService;

    public PatientsController(IPatientService patientService)
    {
        _patientService = patientService;
    }

    /// <summary>
    /// Lấy danh sách bệnh nhân (Có hỗ trợ lọc tìm kiếm & phân trang)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPatients([FromQuery] string? search, [FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _patientService.GetPatientsAsync(search, pageIndex, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Lấy thông tin bệnh nhân theo ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPatientById(Guid id)
    {
        var patient = await _patientService.GetPatientByIdAsync(id);
        if (patient == null)
            return NotFound(new { message = $"Không tìm thấy bệnh nhân với ID {id}" });

        return Ok(patient);
    }

    /// <summary>
    /// Tìm bệnh nhân theo Mã Bệnh Nhân (Ví dụ: BN2026000001)
    /// </summary>
    [HttpGet("code/{code}")]
    public async Task<IActionResult> GetPatientByCode(string code)
    {
        var patient = await _patientService.GetPatientByCodeAsync(code);
        if (patient == null)
            return NotFound(new { message = $"Không tìm thấy bệnh nhân với mã {code}" });

        return Ok(patient);
    }

    /// <summary>
    /// Tìm bệnh nhân theo Số CCCD
    /// </summary>
    [HttpGet("identity/{cccd}")]
    public async Task<IActionResult> GetPatientByIdentity(string cccd)
    {
        var patient = await _patientService.GetPatientByIdentityCardAsync(cccd);
        if (patient == null)
            return NotFound(new { message = $"Không tìm thấy bệnh nhân với số CCCD {cccd}" });

        return Ok(patient);
    }

    /// <summary>
    /// Tiếp nhận & Thêm hồ sơ Bệnh nhân mới
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreatePatient([FromBody] CreatePatientDto dto)
    {
        try
        {
            var result = await _patientService.CreatePatientAsync(dto);
            return CreatedAtAction(nameof(GetPatientById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
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
    /// Cập nhật thông tin hồ sơ Bệnh nhân
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdatePatient(Guid id, [FromBody] UpdatePatientDto dto)
    {
        try
        {
            var result = await _patientService.UpdatePatientAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
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
    /// Xóa thông tin Bệnh nhân
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePatient(Guid id)
    {
        var success = await _patientService.DeletePatientAsync(id);
        if (!success)
            return NotFound(new { message = "Không tìm thấy bệnh nhân để xóa." });

        return Ok(new { message = "Xóa hồ sơ bệnh nhân thành công." });
    }
}
