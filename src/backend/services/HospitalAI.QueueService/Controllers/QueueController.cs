using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

namespace HospitalAI.QueueService.Controllers;

[ApiController]
[Route("api/queue")]
public class QueueController : ControllerBase
{
    private readonly IQueueService _queueService;
    private readonly IHubContext<QueueHub> _hubContext;

    public QueueController(IQueueService queueService, IHubContext<QueueHub> hubContext)
    {
        _queueService = queueService;
        _hubContext = hubContext;
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

            // Bắn tín hiệu SignalR thời gian thực đến Web Bác sĩ, Tiếp tân và Mobile App
            try
            {
                await _hubContext.Clients.All.SendAsync("NewPatientInQueue", result);
                await _hubContext.Clients.All.SendAsync("ReceiveQueueUpdate", result);
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", result);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] IssueTicket broadcast failed: {hubEx.Message}");
            }

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

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveQueueStatusChanged", result);
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", result);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] UpdateStatus broadcast failed: {hubEx.Message}");
            }

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

        try
        {
            await _hubContext.Clients.All.SendAsync("ReceiveCallingPatient", result);
            await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", result);
        }
        catch (Exception hubEx)
        {
            Console.WriteLine($"[SignalR Warning] CallNext broadcast failed: {hubEx.Message}");
        }

        return Ok(result);
    }
}
