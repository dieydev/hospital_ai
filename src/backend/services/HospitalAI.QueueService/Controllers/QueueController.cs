using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Security.Claims;
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
    /// Lấy danh sách các Khoa/Phòng khám (Công khai cho màn hình sảnh và đặt lịch)
    /// </summary>
    [HttpGet("departments")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDepartments()
    {
        var result = await _queueService.GetDepartmentsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách hàng chờ trong ngày (Hiển thị bảng điện tử và app bệnh nhân)
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetTodayQueue([FromQuery] Guid? departmentId, [FromQuery] string? status)
    {
        var result = await _queueService.GetTodayQueueTicketsAsync(departmentId, status);
        return Ok(result);
    }

    /// <summary>
    /// Tiếp nhận & Cấp số thứ tự hàng chờ mới cho bệnh nhân
    /// </summary>
    [HttpPost("issue")]
    [Authorize]
    public async Task<IActionResult> IssueTicket([FromBody] IssueQueueTicketDto dto)
    {
        try
        {
            // BẢO VỆ CHỐNG GIẢ MẠO CẤP CỨU (Anti-Tampering & Least Privilege):
            // Các trường IsEmergencyConfirmed, EmergencyConfirmedBy, EmergencyConfirmedAt TUYỆT ĐỐI không được tin client.
            // Danh tính người xác nhận bắt buộc phải được kiểm tra từ JWT Claims và quyền Backend (chỉ Triage hoặc Doctor).
            if (dto.IsEmergencyConfirmed == true || string.Equals(dto.Priority, "Emergency", StringComparison.OrdinalIgnoreCase))
            {
                var isClinicalStaff = User.IsInRole("Triage") || User.IsInRole("Doctor");
                if (isClinicalStaff && !string.IsNullOrWhiteSpace(dto.EmergencyReason))
                {
                    var staffRole = User.IsInRole("Doctor") ? "Bác sĩ lâm sàng" : "Nhân viên sàng lọc y tế";
                    var staffName = User.FindFirst("name")?.Value 
                                    ?? User.FindFirst(ClaimTypes.Name)?.Value 
                                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                                    ?? "Cán bộ y tế chuyên môn";

                    dto.IsEmergencyConfirmed = true;
                    dto.EmergencyConfirmedBy = $"{staffRole} - {staffName}";
                    dto.EmergencyConfirmedAt = DateTime.UtcNow; // Server timestamp, không dùng client timestamp
                    dto.Priority = "Emergency";
                }
                else
                {
                    // Người dùng không có vai trò Triage/Doctor hoặc không có lý do chuyên môn -> Thu hồi toàn bộ cờ cấp cứu
                    dto.IsEmergencyConfirmed = false;
                    dto.EmergencyConfirmedBy = null;
                    dto.EmergencyConfirmedAt = null;
                    dto.EmergencyReason = null;
                    dto.Priority = "Normal";
                }
            }
            else
            {
                // Không phải trường hợp cấp cứu: xóa sạch các trường xác nhận để ngăn client gửi giá trị rác
                dto.IsEmergencyConfirmed = false;
                dto.EmergencyConfirmedBy = null;
                dto.EmergencyConfirmedAt = null;
            }

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
    /// Cập nhật trạng thái phiếu hàng chờ (Chỉ dành cho Cán bộ y tế & Quản trị)
    /// </summary>
    [HttpPut("{ticketId:guid}/status")]
    [Authorize(Roles = "Doctor,Receptionist,Triage,Nurse,Cashier,Admin")]
    public async Task<IActionResult> UpdateStatus(Guid ticketId, [FromBody] UpdateQueueStatusDto dto)
    {
        if (ticketId == Guid.Empty)
            return BadRequest(new { message = "Mã phiếu hàng chờ không hợp lệ." });

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
    /// Gọi loa mời bệnh nhân tiếp theo vào khám (Chỉ dành cho Bác sĩ và Quản trị viên)
    /// </summary>
    [HttpPost("departments/{departmentId:guid}/call-next")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> CallNext(Guid departmentId)
    {
        if (departmentId == Guid.Empty)
            return BadRequest(new { message = "Mã chuyên khoa không hợp lệ." });

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
