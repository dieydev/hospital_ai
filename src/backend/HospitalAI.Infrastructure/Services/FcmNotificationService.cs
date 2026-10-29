using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Services;

public class FcmNotificationService : IFcmNotificationService
{
    private readonly ILogger<FcmNotificationService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _tokensFilePath;
    private readonly string _notificationsFilePath;
    private static readonly object _fileLock = new();

    // Map: UserIdentifier (SĐT / Mã BN) -> List of DeviceTokens
    private static readonly ConcurrentDictionary<string, HashSet<string>> _deviceTokens = new();

    // List of notifications in memory
    private static readonly ConcurrentBag<PushNotificationDto> _notificationStore = new();

    public FcmNotificationService(
        ILogger<FcmNotificationService> logger,
        IConfiguration configuration,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;

        var dataDir = Environment.GetEnvironmentVariable("DATA_DIR") ?? Path.Combine(AppContext.BaseDirectory, "data");
        if (!Directory.Exists(dataDir))
        {
            Directory.CreateDirectory(dataDir);
        }

        _tokensFilePath = Path.Combine(dataDir, "device_tokens.json");
        _notificationsFilePath = Path.Combine(dataDir, "notifications.json");

        LoadDataFromFile();
    }

    private void LoadDataFromFile()
    {
        lock (_fileLock)
        {
            try
            {
                if (File.Exists(_tokensFilePath))
                {
                    var json = File.ReadAllText(_tokensFilePath);
                    var dict = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(json);
                    if (dict != null)
                    {
                        foreach (var kvp in dict)
                        {
                            _deviceTokens[kvp.Key] = new HashSet<string>(kvp.Value);
                        }
                    }
                }

                if (File.Exists(_notificationsFilePath))
                {
                    var json = File.ReadAllText(_notificationsFilePath);
                    var list = JsonSerializer.Deserialize<List<PushNotificationDto>>(json);
                    if (list != null)
                    {
                        foreach (var item in list)
                        {
                            _notificationStore.Add(item);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Không thể nạp dữ liệu tokens/notifications từ file: {Message}", ex.Message);
            }
        }
    }

    private void SaveTokensToFile()
    {
        lock (_fileLock)
        {
            try
            {
                var dict = _deviceTokens.ToDictionary(k => k.Key, v => v.Value.ToList());
                File.WriteAllText(_tokensFilePath, JsonSerializer.Serialize(dict, new JsonSerializerOptions { WriteIndented = true }));
            }
            catch (Exception ex)
            {
                _logger.LogError("Lỗi lưu file device_tokens: {Message}", ex.Message);
            }
        }
    }

    private void SaveNotificationsToFile()
    {
        lock (_fileLock)
        {
            try
            {
                var list = _notificationStore.OrderByDescending(n => n.CreatedAt).Take(500).ToList();
                File.WriteAllText(_notificationsFilePath, JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true }));
            }
            catch (Exception ex)
            {
                _logger.LogError("Lỗi lưu file notifications: {Message}", ex.Message);
            }
        }
    }

    public Task RegisterDeviceTokenAsync(DeviceTokenRegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserIdentifier) || string.IsNullOrWhiteSpace(dto.DeviceToken))
            return Task.CompletedTask;

        var key = dto.UserIdentifier.Trim().ToLowerInvariant();
        _deviceTokens.AddOrUpdate(
            key,
            _ => new HashSet<string> { dto.DeviceToken.Trim() },
            (_, existing) =>
            {
                existing.Add(dto.DeviceToken.Trim());
                return existing;
            });

        SaveTokensToFile();
        _logger.LogInformation("[FCM] Đã đăng ký Device Token cho người dùng: {User} (Platform: {Platform})", dto.UserIdentifier, dto.Platform);
        return Task.CompletedTask;
    }

    public async Task<bool> SendPushNotificationAsync(PushNotificationDto notification)
    {
        if (notification == null) return false;

        _notificationStore.Add(notification);
        SaveNotificationsToFile();

        var key = notification.RecipientPhoneOrId?.Trim().ToLowerInvariant() ?? "";
        _deviceTokens.TryGetValue(key, out var tokens);

        _logger.LogInformation("[PUSH-NOTIF] Gửi thông báo tới [{Recipient}]: {Title} - {Body} (Số tokens: {Count})",
            notification.RecipientPhoneOrId, notification.Title, notification.Body, tokens?.Count ?? 0);

        // Nếu có cấu hình Firebase FCM Server Key hoặc Service Account thì gửi thật qua FCM v1 API
        var fcmServerKey = _configuration["Firebase:ServerKey"] ?? Environment.GetEnvironmentVariable("FIREBASE_SERVER_KEY");
        if (!string.IsNullOrWhiteSpace(fcmServerKey) && tokens != null && tokens.Any())
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"key={fcmServerKey}");

                foreach (var token in tokens)
                {
                    var payload = new
                    {
                        to = token,
                        notification = new
                        {
                            title = notification.Title,
                            body = notification.Body,
                            sound = "default"
                        },
                        data = notification.Metadata
                    };

                    var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                    await client.PostAsync("https://fcm.googleapis.com/fcm/send", content);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Lỗi khi chuyển tiếp thông báo qua FCM Gateway: {Message}", ex.Message);
            }
        }

        return true;
    }

    public async Task SendQueueApproachingAlertAsync(string phone, string patientName, int sequenceNumber, string departmentName, int remainingAhead)
    {
        var remainingText = remainingAhead <= 0
            ? "Đang gọi số của bạn ngay bây giờ!"
            : $"Hiện chỉ còn {remainingAhead} người nữa là đến lượt bạn.";

        var notif = new PushNotificationDto
        {
            RecipientPhoneOrId = phone,
            Title = $"🏥 SẮP ĐẾN LƯỢT KHÁM: SỐ THỨ TỰ #{sequenceNumber}",
            Body = $"Bệnh nhân: {patientName}. Khoa: {departmentName}. {remainingText} Vui lòng di chuyển đến trước cửa phòng khám để chuẩn bị vào khám.",
            Type = "QUEUE_APPROACHING",
            Priority = "HIGH",
            CreatedAt = DateTime.UtcNow,
            Metadata = new Dictionary<string, string>
            {
                { "sequenceNumber", sequenceNumber.ToString() },
                { "departmentName", departmentName },
                { "remainingAhead", remainingAhead.ToString() },
                { "action", "OPEN_QUEUE_TRACKER" }
            }
        };

        await SendPushNotificationAsync(notif);
    }

    public async Task SendPrescriptionCompletedAlertAsync(string phone, string patientName, string doctorName, string examCode)
    {
        var notif = new PushNotificationDto
        {
            RecipientPhoneOrId = phone,
            Title = $"💊 ĐÃ CÓ KẾT QUẢ KHÁM & ĐƠN THUỐC MÃ {examCode}",
            Body = $"Bác sĩ {doctorName} đã hoàn tất chẩn đoán và ký số điện tử toa thuốc cho bệnh nhân {patientName}. Vui lòng mở ứng dụng để xem Sổ Bệnh Án EMR và tiến hành nhận thuốc.",
            Type = "PRESCRIPTION_COMPLETED",
            Priority = "HIGH",
            CreatedAt = DateTime.UtcNow,
            Metadata = new Dictionary<string, string>
            {
                { "examinationCode", examCode },
                { "doctorName", doctorName },
                { "action", "OPEN_EMR_RECORD" }
            }
        };

        await SendPushNotificationAsync(notif);
    }

    public Task<List<PushNotificationDto>> GetNotificationsByUserAsync(string userIdentifier)
    {
        if (string.IsNullOrWhiteSpace(userIdentifier))
            return Task.FromResult(new List<PushNotificationDto>());

        var key = userIdentifier.Trim().ToLowerInvariant();
        var results = _notificationStore
            .Where(n => string.Equals(n.RecipientPhoneOrId, key, StringComparison.OrdinalIgnoreCase) ||
                        (n.RecipientPhoneOrId != null && n.RecipientPhoneOrId.EndsWith(key.TrimStart('0'))))
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .ToList();

        return Task.FromResult(results);
    }

    public Task<bool> MarkAsReadAsync(string notificationId)
    {
        var item = _notificationStore.FirstOrDefault(n => n.Id == notificationId);
        if (item != null)
        {
            item.IsRead = true;
            SaveNotificationsToFile();
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }
}

