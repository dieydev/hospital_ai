using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Services;

public sealed class SepayPaymentOptions
{
    public string Environment { get; init; } = "Sandbox";
    public string BankCode { get; init; } = string.Empty;
    public string BankBin { get; init; } = string.Empty;
    public string AccountNumber { get; init; } = string.Empty;
    public string SubAccount { get; init; } = string.Empty;
    public string AccountName { get; init; } = string.Empty;
    public string PaymentPrefix { get; init; } = "HAI";
    public string WebhookSecret { get; init; } = string.Empty;
    public int TimestampToleranceSeconds { get; init; } = 3600;
    public bool IsTimestampToleranceConfigValid { get; init; } = true;

    public bool IsSandbox => !string.Equals(Environment, "Live", StringComparison.OrdinalIgnoreCase);

    public bool HasValidWebhookSecurityConfig =>
        IsTimestampToleranceConfigValid &&
        !string.IsNullOrWhiteSpace(WebhookSecret) &&
        !string.IsNullOrWhiteSpace(AccountNumber);

    public bool HasValidQrConfig =>
        (!string.IsNullOrWhiteSpace(BankCode) || !string.IsNullOrWhiteSpace(BankBin)) &&
        !string.IsNullOrWhiteSpace(AccountNumber) &&
        !string.IsNullOrWhiteSpace(AccountName);
}

/// <summary>
/// Helper dùng chung cho mã thanh toán HAI + 8 ký tự hex in hoa, dựng ảnh VietQR theo cấu hình môi trường
/// và xác thực tham số Webhook SePay theo cơ chế fail-closed.
/// </summary>
public static class PaymentQrHelper
{
    public const string DefaultPaymentPrefix = "HAI";
    public const int DefaultTimestampToleranceSeconds = 3600;
    public const int MaxAllowedTimestampToleranceSeconds = 18000; // 5 giờ tối đa (khớp cửa sổ retry tối đa của SePay)
    public const int MaxFutureClockSkewSeconds = 60;

    public static string NormalizePrefix(string? rawPrefix)
    {
        var candidate = string.IsNullOrWhiteSpace(rawPrefix)
            ? DefaultPaymentPrefix
            : new string(rawPrefix.Trim().ToUpperInvariant().Where(char.IsLetterOrDigit).ToArray());

        return string.IsNullOrWhiteSpace(candidate) ? DefaultPaymentPrefix : candidate;
    }

    public static string GeneratePaymentCode(string? prefix = null)
    {
        var normalizedPrefix = NormalizePrefix(prefix);
        var bytes = RandomNumberGenerator.GetBytes(4);
        return $"{normalizedPrefix}{Convert.ToHexString(bytes)}";
    }

    public static string? ExtractPaymentCode(string? codeField, string? contentField, string? descriptionField, string? prefix = null)
    {
        var normalizedPrefix = NormalizePrefix(prefix);
        var regex = new Regex($@"(?<![A-Z0-9])({Regex.Escape(normalizedPrefix)}[A-F0-9]{{8}})(?![A-Z0-9])", RegexOptions.IgnoreCase);

        foreach (var source in new[] { codeField, contentField, descriptionField })
        {
            if (string.IsNullOrWhiteSpace(source)) continue;
            var match = regex.Match(source.Trim());
            if (match.Success)
            {
                return match.Groups[1].Value.ToUpperInvariant();
            }
        }

        return null;
    }

    public static async Task<string> EnsureUniquePaymentCodeAsync(
        HospitalDbContext dbContext,
        Billing billing,
        string? prefix = null,
        CancellationToken ct = default)
    {
        if (!string.IsNullOrWhiteSpace(billing.PaymentCode))
        {
            billing.PaymentCode = billing.PaymentCode.Trim().ToUpperInvariant();
            return billing.PaymentCode;
        }

        var normalizedPrefix = NormalizePrefix(prefix);
        for (var attempt = 0; attempt < 16; attempt++)
        {
            var candidate = GeneratePaymentCode(normalizedPrefix);
            var exists = await dbContext.Billings
                .AsNoTracking()
                .AnyAsync(b => b.PaymentCode == candidate && b.Id != billing.Id, ct);
            if (!exists)
            {
                billing.PaymentCode = candidate;
                return candidate;
            }
        }

        throw new InvalidOperationException("Không thể sinh mã thanh toán duy nhất sau nhiều lần thử.");
    }

    public static string ResolveFallbackDisplayCode(Billing billing, string? prefix = null)
    {
        if (!string.IsNullOrWhiteSpace(billing.PaymentCode))
        {
            return billing.PaymentCode.Trim().ToUpperInvariant();
        }

        var normalizedPrefix = NormalizePrefix(prefix);
        return $"{normalizedPrefix}{billing.Id.ToString("N")[..8].ToUpperInvariant()}";
    }

    public static SepayPaymentOptions ResolveOptions(IConfiguration? configuration)
    {
        string? Read(params string[] keys)
        {
            foreach (var key in keys)
            {
                var fromCfg = configuration?[key];
                if (!string.IsNullOrWhiteSpace(fromCfg)) return fromCfg.Trim();
            }

            foreach (var key in keys)
            {
                if (!key.Contains(':'))
                {
                    var fromEnv = Environment.GetEnvironmentVariable(key);
                    if (!string.IsNullOrWhiteSpace(fromEnv)) return fromEnv.Trim();
                }
            }

            return null;
        }

        var envName = Read("Sepay:Environment", "PaymentQr:Environment", "SEPAY_ENVIRONMENT") ?? "Sandbox";
        var bankCode = Read("PaymentQr:BankCode", "Sepay:BankCode", "SEPAY_BANK_CODE") ?? string.Empty;
        var bankBin = Read("PaymentQr:BankBin", "Sepay:BankBin", "SEPAY_BANK_BIN") ?? string.Empty;
        var accountNo = Read("Sepay:AccountNumber", "PaymentQr:AccountNumber", "SEPAY_ACCOUNT_NUMBER") ?? string.Empty;
        var subAccount = Read("Sepay:SubAccount", "PaymentQr:SubAccount", "SEPAY_SUB_ACCOUNT") ?? string.Empty;
        var accountName = Read("PaymentQr:AccountName", "Sepay:AccountName", "SEPAY_ACCOUNT_NAME") ?? string.Empty;
        var prefix = NormalizePrefix(Read("Sepay:PaymentPrefix", "PaymentQr:PaymentPrefix", "SEPAY_PAYMENT_PREFIX"));
        var secret = Read("Sepay:WebhookSecret", "SEPAY_WEBHOOK_SECRET") ?? string.Empty;

        var rawTolerance = Read("Sepay:TimestampToleranceSeconds", "SEPAY_TIMESTAMP_TOLERANCE_SECONDS");
        var tolerance = DefaultTimestampToleranceSeconds;
        var toleranceValid = true;
        if (!string.IsNullOrWhiteSpace(rawTolerance))
        {
            if (!int.TryParse(rawTolerance, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsedTolerance) ||
                parsedTolerance <= 0 ||
                parsedTolerance > MaxAllowedTimestampToleranceSeconds)
            {
                // Fail-closed: cấm cấu hình <= 0 để vô hiệu hóa kiểm tra timestamp hoặc quá 5 giờ
                toleranceValid = false;
            }
            else
            {
                tolerance = parsedTolerance;
            }
        }

        return new SepayPaymentOptions
        {
            Environment = envName,
            BankCode = bankCode,
            BankBin = bankBin,
            AccountNumber = accountNo,
            SubAccount = subAccount,
            AccountName = accountName,
            PaymentPrefix = prefix,
            WebhookSecret = secret,
            TimestampToleranceSeconds = tolerance,
            IsTimestampToleranceConfigValid = toleranceValid
        };
    }

    public static string? BuildVietQrImageUrl(SepayPaymentOptions options, decimal amount, string transferContent)
    {
        if (!options.HasValidQrConfig)
        {
            return null;
        }

        var bankSlug = !string.IsNullOrWhiteSpace(options.BankCode) ? options.BankCode : options.BankBin;
        return BuildVietQrImageUrl(bankSlug, options.AccountNumber, options.AccountName, amount, transferContent);
    }

    public static string BuildVietQrImageUrl(string bankIdentifier, string accountNo, string accountName, decimal amount, string transferContent)
    {
        var encodedName = Uri.EscapeDataString((accountName ?? string.Empty).Trim());
        var encodedInfo = Uri.EscapeDataString((transferContent ?? string.Empty).Trim());
        var normalizedAmount = Math.Max(0m, decimal.Round(amount, 0, MidpointRounding.AwayFromZero));
        var amountStr = normalizedAmount.ToString("0", CultureInfo.InvariantCulture);
        return $"https://img.vietqr.io/image/{Uri.EscapeDataString(bankIdentifier.Trim())}-{Uri.EscapeDataString(accountNo.Trim())}-compact2.png?amount={amountStr}&addInfo={encodedInfo}&accountName={encodedName}";
    }
}
