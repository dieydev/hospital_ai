using System.Threading.Tasks;
using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HospitalAI.ExaminationService.Controllers;

[ApiController]
[Route("api/ailogs")]
public class AILogsController : ControllerBase
{
    private readonly IAILogService _aiLogService;

    public AILogsController(IAILogService aiLogService)
    {
        _aiLogService = aiLogService;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs()
    {
        var logs = await _aiLogService.GetLogsAsync();
        return Ok(logs);
    }

    [HttpPost]
    public async Task<IActionResult> CreateLog([FromBody] CreateAILogDto dto)
    {
        var log = await _aiLogService.CreateLogAsync(dto);
        return CreatedAtAction(nameof(GetLogs), new { id = log.Id }, log);
    }
}
