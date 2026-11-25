using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalAI.QueueService.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IFcmNotificationService _fcmService;
    private readonly HospitalDbContext? _dbContext;

    public NotificationsController(IFcmNotificationService fcmService, HospitalDbContext? dbContext = null)
    {
        _fcmService = fcmService;
        _dbContext = dbContext;
    }

    private bool IsStaff()
    {
        return User.IsInRole("Admin") || User.IsInRole("Doctor") || User.IsInRole("Receptionist") ||
               User.IsInRole("Triage") || User.IsInRole("Pharmacy") || User.IsInRole("Nurse") || User.IsInRole("Cashier");
    }

    private static string NormalizeId(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var clean = raw.Trim().Replace(" ", "").Replace("-", "");
        if (clean.StartsWith("+84") && clean.Length > 3)
            clean = "0" + clean.Substring(3);
        return clean.ToLowerInvariant();
    }

    private async Task<HashSet<string>> ResolveCallerIdentifiersAsync()
    {
        var ids = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var candidate in new[]
        {
            User.FindFirstValue(ClaimTypes.MobilePhone),
            User.FindFirstValue(ClaimTypes.Name),
            User.FindFirstValue(ClaimTypes.NameIdentifier),
            User.FindFirstValue(ClaimTypes.Email)
        })
        {
            var norm = NormalizeId(candidate);
            if (!string.IsNullOrEmpty(norm)) ids.Add(norm);
        }

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (_dbContext != null && Guid.TryParse(userIdStr, out var userIdGuid))
        {
            var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userIdGuid);
            if (user != null)
            {
                foreach (var val in new[] { user.PhoneNumber, user.Username })
                {
                    var norm = NormalizeId(val);
                    if (!string.IsNullOrEmpty(norm)) ids.Add(norm);
                }
            }

            var patient = await _dbContext.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.UserId == userIdGuid);
            if (patient != null)
            {
                foreach (var val in new[] { patient.PatientCode, patient.IdentityCardNumber, patient.EmergencyContactPhone })
                {
                    var norm = NormalizeId(val);
                    if (!string.IsNullOrEmpty(norm)) ids.Add(norm);
                }
            }
        }

        return ids;
    }

    /// <summary>
    /// Đăng ký FCM Device Token từ thiết bị di động (Chỉ được đăng ký cho tài khoản của chính mình trừ Staff)
    /// </summary>
    [HttpPost("register-token")]
    public async Task<IActionResult> RegisterToken([FromBody] DeviceTokenRegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DeviceToken))
            return BadRequest(new { message = "Device Token không được để trống." });

        if (!IsStaff())
        {
            var callerPhone = User.FindFirstValue(ClaimTypes.MobilePhone) ?? User.FindFirstValue(ClaimTypes.Name);
            var callerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            dto.UserIdentifier = !string.IsNullOrWhiteSpace(callerPhone)
                ? callerPhone
                : (callerId ?? string.Empty);

            if (string.IsNullOrWhiteSpace(dto.UserIdentifier))
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
        }
        else if (string.IsNullOrWhiteSpace(dto.UserIdentifier))
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
    /// Lấy danh sách thông báo của người dùng hiện tại (Chống IDOR: bệnh nhân chỉ đọc thông báo của chính mình)
    /// </summary>
    [HttpGet("my-notifications")]
    public async Task<IActionResult> GetMyNotifications([FromQuery] string? phoneOrId)
    {
        if (IsStaff() && !string.IsNullOrWhiteSpace(phoneOrId))
        {
            var staffQueryNotifs = await _fcmService.GetNotificationsByUserAsync(phoneOrId);
            return Ok(staffQueryNotifs);
        }

        var callerIdentifiers = await ResolveCallerIdentifiersAsync();
        if (!string.IsNullOrWhiteSpace(phoneOrId))
        {
            var requested = NormalizeId(phoneOrId);
            if (!string.IsNullOrEmpty(requested) && !callerIdentifiers.Contains(requested))
            {
                return Forbid();
            }
        }

        if (callerIdentifiers.Count == 0)
            return Ok(new object[] { });

        var notifs = await _fcmService.GetNotificationsForIdentifiersAsync(callerIdentifiers);
        return Ok(notifs);
    }

    /// <summary>
    /// Đánh dấu một thông báo đã đọc (Kiểm tra quyền sở hữu)
    /// </summary>
    [HttpPost("mark-read/{id}")]
    public async Task<IActionResult> MarkRead(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
            return BadRequest(new { message = "Mã thông báo không hợp lệ." });

        try
        {
            IEnumerable<string>? allowedRecipients = IsStaff() ? null : await ResolveCallerIdentifiersAsync();
            var success = await _fcmService.MarkAsReadAsync(id, allowedRecipients);
            return Ok(new { success });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Gửi thông báo thử nghiệm (Chỉ dành cho Quản trị viên Admin)
    /// </summary>
    [HttpPost("test-push")]
    [Authorize(Roles = "Admin")]
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

