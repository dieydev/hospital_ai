using System.Threading.Tasks;
using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalAI.ExaminationService.Controllers;

[ApiController]
[Route("api/ailogs")]
[Authorize]
public class AILogsController : ControllerBase
{
    private readonly IAILogService _aiLogService;

    public AILogsController(IAILogService aiLogService)
    {
        _aiLogService = aiLogService;
    }

    /// <summary>
    /// Lấy danh sách nhật ký AI kiểm toán (Chỉ dành cho Quản trị viên Admin)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetLogs()
    {
        var logs = await _aiLogService.GetLogsAsync();
        return Ok(logs);
    }

    /// <summary>
    /// Ghi nhận nhật ký truy vấn AI (Bác sĩ và Quản trị viên)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> CreateLog([FromBody] CreateAILogDto dto)
    {
        var log = await _aiLogService.CreateLogAsync(dto);
        return CreatedAtAction(nameof(GetLogs), new { id = log.Id }, log);
    }
}
