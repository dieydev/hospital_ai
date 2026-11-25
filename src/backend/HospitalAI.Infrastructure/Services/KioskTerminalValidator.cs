using HospitalAI.Application.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace HospitalAI.Infrastructure.Services;

/// <summary>
/// Xác thực trạm thiết bị Kiosk thực tế bằng JWT Staff hoặc cặp Header thiết bị cấu hình trên Server.
/// Ngăn truy cập trái phép hoặc giả mạo trạm Kiosk từ bên ngoài, đồng thời hỗ trợ ẩn danh PII ở sảnh công cộng.
/// </summary>
public static class KioskTerminalValidator
{
    public sealed record TerminalConfig(string TerminalId, string TerminalName, string Location, string ZoneType, string Secret);

    // Cấu hình trạm Kiosk chuẩn mặc định (có thể ghi đè qua appsettings Kiosk:Terminals)
    private static readonly List<TerminalConfig> DefaultTerminals = new()
    {
        new("KIOSK-SANH-A-01", "Kiosk Sảnh A - Tiếp Nhận & Khám Bệnh", "Sảnh A - Tầng Trệt", "Reception", "DMED-KIOSK-A01-2026"),
        new("KIOSK-TAI-KHAM-02", "Kiosk Sảnh B - Tái Khám Theo Hẹn", "Sảnh B - Tầng 1", "FollowUp", "DMED-KIOSK-B02-2026"),
        new("KIOSK-CLS-03", "Kiosk Khu Cận Lâm Sàng - Trả Kết Quả", "Khu Cận Lâm Sàng - Tầng 2", "Paraclinical", "DMED-KIOSK-C03-2026")
    };

    public static List<TerminalConfig> GetConfiguredTerminals(IConfiguration? configuration)
    {
        var section = configuration?.GetSection("Kiosk:Terminals");
        if (section != null && section.Exists())
        {
            var configured = section.GetChildren()
                .Select(c => new TerminalConfig(
                    c["TerminalId"] ?? string.Empty,
                    c["TerminalName"] ?? string.Empty,
                    c["Location"] ?? string.Empty,
                    c["ZoneType"] ?? "Reception",
                    c["Secret"] ?? string.Empty))
                .Where(t => !string.IsNullOrWhiteSpace(t.TerminalId) && !string.IsNullOrWhiteSpace(t.Secret))
                .ToList();

            if (configured.Count > 0) return configured;
        }

        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        var isProduction = string.Equals(env, "Production", StringComparison.OrdinalIgnoreCase);
        if (isProduction && configuration != null)
        {
            // Trong môi trường Production bắt buộc phải cấu hình secret riêng qua appsettings/env vars, không dùng secret mặc định trong mã nguồn
            return new List<TerminalConfig>();
        }

        return DefaultTerminals;
    }

    public static List<KioskTerminalInfoDto> GetPublicTerminalList(IConfiguration? configuration)
    {
        return GetConfiguredTerminals(configuration)
            .Select(t => new KioskTerminalInfoDto
            {
                TerminalId = t.TerminalId,
                TerminalName = t.TerminalName,
                Location = t.Location,
                ZoneType = t.ZoneType
            })
            .ToList();
    }

    public static (bool IsAuthorized, bool IsStaffSession, KioskTerminalInfoDto? Terminal) ValidateRequest(
        HttpRequest? request,
        ClaimsPrincipal? user,
        IConfiguration? configuration)
    {
        var isStaff = user != null && (
            user.IsInRole("Admin") ||
            user.IsInRole("Receptionist") ||
            user.IsInRole("Triage"));

        var terminals = GetConfiguredTerminals(configuration);
        KioskTerminalInfoDto? matchedTerminalDto = null;

        if (request != null)
        {
            var terminalId = request.Headers["X-Kiosk-Terminal-Id"].FirstOrDefault()?.Trim();
            var terminalSecret = request.Headers["X-Kiosk-Terminal-Secret"].FirstOrDefault()?.Trim();

            if (!string.IsNullOrWhiteSpace(terminalId) && !string.IsNullOrWhiteSpace(terminalSecret))
            {
                var found = terminals.FirstOrDefault(t =>
                    string.Equals(t.TerminalId, terminalId, StringComparison.OrdinalIgnoreCase));

                if (found != null && ConstantTimeEquals(found.Secret, terminalSecret))
                {
                    matchedTerminalDto = new KioskTerminalInfoDto
                    {
                        TerminalId = found.TerminalId,
                        TerminalName = found.TerminalName,
                        Location = found.Location,
                        ZoneType = found.ZoneType
                    };
                }
            }
        }

        return (isStaff || matchedTerminalDto != null, isStaff, matchedTerminalDto);
    }

    /// <summary>
    /// Che một phần họ tên trên bảng điện tử sảnh công cộng (VD: "Nguyễn Văn An" -> "Nguyễn V*** A*")
    /// </summary>
    public static string MaskPersonName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return "***";
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 1)
        {
            return parts[0].Length > 1 ? parts[0][0] + new string('*', parts[0].Length - 1) : "*";
        }
        return string.Join(" ", parts.Select((p, idx) =>
        {
            if (idx == 0) return p; // Giữ họ
            return p.Length > 1 ? p[0] + new string('*', Math.Min(3, p.Length - 1)) : "*";
        }));
    }

    public static string MaskIdentifier(string? value, int showStart = 3, int showEnd = 3)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var trimmed = value.Trim();
        if (trimmed.Length <= showStart + showEnd) return new string('*', trimmed.Length);
        return $"{trimmed[..showStart]}{new string('*', trimmed.Length - showStart - showEnd)}{trimmed[^showEnd..]}";
    }

    private static bool ConstantTimeEquals(string a, string b)
    {
        var aBytes = Encoding.UTF8.GetBytes(a);
        var bBytes = Encoding.UTF8.GetBytes(b);
        return CryptographicOperations.FixedTimeEquals(aBytes, bBytes);
    }
}
