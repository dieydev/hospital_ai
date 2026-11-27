using HospitalAI.Application.DTOs;
using System;
using System.Globalization;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace HospitalAI.Infrastructure.Services;

/// <summary>
/// Bộ phân tích chuẩn hóa các định dạng mã QR & Barcode tại Kiosk Bệnh viện Việt Nam:
/// 1. QR CCCD gắn chip (Bộ Công An): 12 số CCCD | CMND | Họ tên | ddMMyyyy | Giới tính | Địa chỉ | Ngày cấp
/// 2. JSON Exam Pass v2.0 (D_MEDICAL_EXAM_PASS) từ Mobile App / Web Booking
/// 3. MEDQR|... từ Giấy hẹn tái khám & Phiếu tiếp nhận
/// 4. URL .../queue/{id}
/// 5. Mã tra cứu thô (BN2026xxxx, CCCD, SĐT, STT)
/// </summary>
public static class KioskQrParser
{
    private static readonly Regex TwelveDigitRegex = new(@"^\d{12}$", RegexOptions.Compiled);

    public static KioskQrParseResultDto Parse(string? rawInput)
    {
        var input = (rawInput ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(input))
        {
            return new KioskQrParseResultDto { Format = "RAW", LookupKey = string.Empty };
        }

        // 1. JSON Payload (D_MEDICAL_EXAM_PASS hoặc tương đương)
        if (input.StartsWith("{") && input.EndsWith("}"))
        {
            try
            {
                using var doc = JsonDocument.Parse(input);
                var root = doc.RootElement;
                string? GetStr(string prop) =>
                    root.TryGetProperty(prop, out var el) && el.ValueKind == JsonValueKind.String
                        ? el.GetString()
                        : null;

                var aptId = GetStr("appointmentId") ?? GetStr("id") ?? GetStr("ticketId");
                var pCode = GetStr("patientCode");
                var cccd = GetStr("identityCard");
                var aptType = GetStr("appointmentType");
                var prevCode = GetStr("previousRecordCode");

                return new KioskQrParseResultDto
                {
                    Format = "EXAM_PASS_JSON",
                    AppointmentId = aptId,
                    PatientCode = pCode,
                    IdentityCardNumber = cccd,
                    FullName = GetStr("patientName"),
                    AppointmentType = aptType,
                    PreviousRecordCode = prevCode,
                    LookupKey = aptId ?? pCode ?? cccd ?? input
                };
            }
            catch
            {
                // Fall through if malformed JSON
            }
        }

        // 2. MEDQR|... (Giấy hẹn tái khám / Phiếu tiếp nhận / Lịch hẹn)
        if (input.StartsWith("MEDQR|", StringComparison.OrdinalIgnoreCase))
        {
            var parts = input.Split('|');
            var key1 = parts.Length > 1 ? parts[1].Trim() : string.Empty;
            var key2 = parts.Length > 2 ? parts[2].Trim() : string.Empty;

            var isFollowUp = key1.Equals("TAIKHAM", StringComparison.OrdinalIgnoreCase)
                || key1.StartsWith("HEN-", StringComparison.OrdinalIgnoreCase)
                || parts.Any(p => p.Contains("FOLLOWUP", StringComparison.OrdinalIgnoreCase));

            var aptId = !string.IsNullOrEmpty(key1) && !key1.Equals("TAIKHAM", StringComparison.OrdinalIgnoreCase) && !key1.StartsWith("HEN-", StringComparison.OrdinalIgnoreCase)
                ? key1
                : null;

            return new KioskQrParseResultDto
            {
                Format = "MEDQR",
                AppointmentId = aptId,
                PatientCode = !string.IsNullOrEmpty(key2) ? key2 : null,
                PreviousRecordCode = key1.StartsWith("HEN-", StringComparison.OrdinalIgnoreCase) ? key1 : null,
                AppointmentType = isFollowUp ? "FollowUp" : null,
                LookupKey = !string.IsNullOrEmpty(key2) ? key2 : (!string.IsNullOrEmpty(key1) ? key1 : input)
            };
        }

        // 3. QR CCCD gắn chip Việt Nam (6 hoặc 7 trường phân cách bằng dấu '|')
        if (input.Contains('|'))
        {
            var parts = input.Split('|');
            var cccd = parts[0].Trim();
            if (parts.Length >= 6 && TwelveDigitRegex.IsMatch(cccd))
            {
                var fullName = parts[2].Trim();
                var rawDob = parts[3].Trim();
                var gender = parts[4].Trim();
                var address = parts[5].Trim();

                string? isoDob = null;
                if (DateTime.TryParseExact(rawDob, "ddMMyyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDob))
                {
                    isoDob = parsedDob.ToString("yyyy-MM-dd");
                }

                return new KioskQrParseResultDto
                {
                    Format = "CCCD_CHIP",
                    IdentityCardNumber = cccd,
                    FullName = string.IsNullOrWhiteSpace(fullName) ? null : fullName,
                    DateOfBirth = isoDob,
                    Gender = NormalizeGender(gender),
                    Address = string.IsNullOrWhiteSpace(address) ? null : address,
                    LookupKey = cccd
                };
            }
        }

        // 4. URL chứa /queue/{id}
        if (input.Contains("/queue/", StringComparison.OrdinalIgnoreCase))
        {
            var idx = input.IndexOf("/queue/", StringComparison.OrdinalIgnoreCase);
            var tail = input[(idx + "/queue/".Length)..].Trim().Trim('/');
            return new KioskQrParseResultDto
            {
                Format = "URL",
                LookupKey = tail
            };
        }

        // 5. Mã thô (BN2026..., CCCD, SĐT, HEN-..., STT)
        var cleaned = input.Replace("#", "").Trim();
        if (cleaned.StartsWith("STT", StringComparison.OrdinalIgnoreCase) && cleaned.Length > 3 && cleaned[3..].All(char.IsDigit))
        {
            cleaned = cleaned[3..];
        }

        return new KioskQrParseResultDto
        {
            Format = "RAW",
            IdentityCardNumber = TwelveDigitRegex.IsMatch(cleaned) ? cleaned : null,
            PreviousRecordCode = cleaned.StartsWith("HEN-", StringComparison.OrdinalIgnoreCase) ? cleaned.ToUpperInvariant() : null,
            AppointmentType = cleaned.StartsWith("HEN-", StringComparison.OrdinalIgnoreCase) ? "FollowUp" : null,
            LookupKey = cleaned
        };
    }

    /// <summary>
    /// Tạo chuỗi VietQR QuickLink chuẩn Napas 247 (img.vietqr.io) chứa đúng số tiền & nội dung hóa đơn thật
    /// </summary>
    public static string BuildVietQrImageUrl(string bankBin, string accountNo, string accountName, decimal amount, string transferContent)
    {
        return PaymentQrHelper.BuildVietQrImageUrl(bankBin, accountNo, accountName, amount, transferContent);
    }

    private static string NormalizeGender(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "Nam";
        var lower = raw.Trim().ToLowerInvariant();
        if (lower.Contains("nữ") || lower == "nu" || lower == "female" || lower == "f") return "Nữ";
        if (lower.Contains("nam") || lower == "male" || lower == "m") return "Nam";
        return "Khác";
    }
}
