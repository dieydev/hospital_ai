using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalAI.QueueService.Controllers;

[ApiController]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly IFcmNotificationService _fcmService;

    public NotificationsController(IFcmNotificationService fcmService)
    {
        _fcmService = fcmService;
    }

    /// <summary>
    /// Đăng ký FCM Device Token từ thiết bị di động
    /// </summary>
    [HttpPost("register-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterToken([FromBody] DeviceTokenRegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DeviceToken))
            return BadRequest(new { message = "Device Token không được để trống." });

        if (string.IsNullOrWhiteSpace(dto.UserIdentifier))
        {
            var userPhone = User.FindFirstValue(ClaimTypes.MobilePhone) ?? User.FindFirstValue(ClaimTypes.Name);
            if (!string.IsNullOrWhiteSpace(userPhone))
            {
                dto.UserIdentifier = userPhone;
            }
        }

        await _fcmService.RegisterDeviceTokenAsync(dto);
        return Ok(new { success = true, message = "Đăng ký Device Token thành công." });
    }

    /// <summary>
    /// Lấy danh sách thông báo của người dùng hiện tại (bệnh nhân / bác sĩ)
    /// </summary>
    [HttpGet("my-notifications")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMyNotifications([FromQuery] string? phoneOrId)
    {
        var targetUser = phoneOrId;
        if (string.IsNullOrWhiteSpace(targetUser))
        {
            targetUser = User.FindFirstValue(ClaimTypes.MobilePhone) ?? User.FindFirstValue(ClaimTypes.Name);
        }

        if (string.IsNullOrWhiteSpace(targetUser))
            return Ok(new object[] { });

        var notifs = await _fcmService.GetNotificationsByUserAsync(targetUser);
        return Ok(notifs);
    }

    /// <summary>
    /// Đánh dấu một thông báo đã đọc
    /// </summary>
    [HttpPost("mark-read/{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> MarkRead(string id)
    {
        var success = await _fcmService.MarkAsReadAsync(id);
        return Ok(new { success });
    }

    /// <summary>
    /// Gửi thông báo thử nghiệm
    /// </summary>
    [HttpPost("test-push")]
    [AllowAnonymous]
    public async Task<IActionResult> TestPush([FromBody] TestPushRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RecipientPhoneOrId))
            return BadRequest(new { message = "Số điện thoại/định danh người nhận không được để trống." });

        var notif = new PushNotificationDto
        {
            RecipientPhoneOrId = dto.RecipientPhoneOrId,
            Title = dto.Title,
            Body = dto.Body,
            Type = dto.Type,
            Priority = "HIGH"
        };

        var ok = await _fcmService.SendPushNotificationAsync(notif);
        return Ok(new { success = ok, message = "Đã gửi thông báo thử nghiệm thành công." });
    }
}
