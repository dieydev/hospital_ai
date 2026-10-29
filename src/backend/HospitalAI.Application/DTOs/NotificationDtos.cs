using System;
using System.Collections.Generic;

namespace HospitalAI.Application.DTOs;

public class DeviceTokenRegisterDto
{
    public string UserIdentifier { get; set; } = string.Empty; // SĐT hoặc Mã BN hoặc UserId
    public string DeviceToken { get; set; } = string.Empty;    // FCM Registration Token
    public string Platform { get; set; } = "Android";          // Android, iOS, Web
}

public class PushNotificationDto
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RecipientPhoneOrId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Type { get; set; } = "SYSTEM"; // QUEUE_APPROACHING, PRESCRIPTION_COMPLETED, APPOINTMENT_REMINDER, SYSTEM
    public string Priority { get; set; } = "HIGH"; // HIGH, MEDIUM, LOW
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false;
    public Dictionary<string, string> Metadata { get; set; } = new();
}

public class TestPushRequestDto
{
    public string RecipientPhoneOrId { get; set; } = string.Empty;
    public string Title { get; set; } = "Thông báo Thử nghiệm";
    public string Body { get; set; } = "Đây là thông báo thử nghiệm từ hệ thống Hospital AI.";
    public string Type { get; set; } = "SYSTEM";
}

