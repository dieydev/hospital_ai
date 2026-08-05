using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace HospitalAI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QueueController : ControllerBase
{
    private readonly IQueueService _queueService;

    public QueueController(IQueueService queueService)
    {
        _queueService = queueService;
    }

    /// <summary>
    /// Lấy danh sách các Khoa/Phòng khám
    /// </summary>
    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments()
    {
        var result = await _queueService.GetDepartmentsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách hàng chờ trong ngày
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetTodayQueue([FromQuery] Guid? departmentId, [FromQuery] string? status)
    {
        var result = await _queueService.GetTodayQueueTicketsAsync(departmentId, status);
        return Ok(result);
    }

    /// <summary>
    /// Tiếp nhận & Cấp số thứ tự hàng chờ mới cho bệnh nhân
    /// </summary>
    [HttpPost("issue")]
    public async Task<IActionResult> IssueTicket([FromBody] IssueQueueTicketDto dto)
    {
        try
        {
            var result = await _queueService.IssueQueueTicketAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật trạng thái phiếu hàng chờ (Waiting -> Calling -> Examining -> Finished)
    /// </summary>
    [HttpPut("{ticketId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid ticketId, [FromBody] UpdateQueueStatusDto dto)
    {
        try
        {
            var result = await _queueService.UpdateQueueTicketStatusAsync(ticketId, dto.Status);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Gọi loa mời bệnh nhân tiếp theo vào khám
    /// </summary>
    [HttpPost("departments/{departmentId:guid}/call-next")]
    public async Task<IActionResult> CallNext(Guid departmentId)
    {
        var result = await _queueService.CallNextPatientAsync(departmentId);
        if (result == null)
            return NotFound(new { message = "Không có bệnh nhân nào đang chờ trong phòng khám này." });

        return Ok(result);
    }
}
