using HospitalAI.Application.DTOs;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Services;

public enum SettlementOutcomeCode
{
    Success = 0,
    NotFound = 1,
    AlreadyPaid = 2,
    Cancelled = 3,
    InvalidAmount = 4,
    Replay = 5,
    ForbiddenRole = 6,
    InvalidReference = 7,
    AlreadyProcessedWebhook = 8,
    IgnoredWebhook = 9,
    DiscrepancyRecorded = 10,
    DatabaseFailure = 11
}

public sealed record BillingSettlementResult(
    SettlementOutcomeCode Code,
    string Message,
    Billing? Billing = null,
    string? ProcessingStatus = null);

public sealed record HmacVerificationResult(
    bool IsValid,
    int HttpStatusCode,
    string ErrorMessage,
    long TimestampSeconds);

/// <summary>
/// Dịch vụ điều phối tạo hóa đơn không trùng lặp và gạch nợ nguyên tử giữa Tiền mặt, Chuyển khoản thủ công, VNPay và SePay.
/// Sử dụng khóa keyed SemaphoreSlim kết hợp Transaction IsolationLevel.Serializable + SQL Server sp_getapplock.
/// </summary>
public static class BillingSettlementService
{
    private static readonly ConcurrentDictionary<Guid, SemaphoreSlim> _billingLocks = new();
    private static readonly ConcurrentDictionary<long, SemaphoreSlim> _sepayTxnLocks = new();
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _registrationCreationLocks = new(StringComparer.OrdinalIgnoreCase);

    private static SemaphoreSlim GetBillingLock(Guid billingId) =>
        _billingLocks.GetOrAdd(billingId, _ => new SemaphoreSlim(1, 1));

    private static SemaphoreSlim GetSepayTxnLock(long sepayTransactionId) =>
        _sepayTxnLocks.GetOrAdd(sepayTransactionId, _ => new SemaphoreSlim(1, 1));

    private static SemaphoreSlim GetCreationLock(Guid patientId, Guid? appointmentId)
    {
        var key = appointmentId.HasValue && appointmentId.Value != Guid.Empty
            ? $"apt:{appointmentId.Value:N}"
            : $"pat:{patientId:N}";
        return _registrationCreationLocks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
    }

    public static string NormalizeAccountNumber(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        return new string(raw.Where(char.IsLetterOrDigit).ToArray()).ToUpperInvariant();
    }

    public static HmacVerificationResult VerifySepayHmacSignature(
        string? signatureHeader,
        string? timestampHeader,
        byte[] rawBodyBytes,
        SepayPaymentOptions options,
        DateTimeOffset? utcNowOverride = null)
    {
        if (!options.IsTimestampToleranceConfigValid)
        {
            return new HmacVerificationResult(false, 401, "Cấu hình cửa sổ timestamp SePay không hợp lệ.", 0);
        }

        if (string.IsNullOrWhiteSpace(options.WebhookSecret))
        {
            return new HmacVerificationResult(false, 401, "Thiếu cấu hình SEPAY_WEBHOOK_SECRET trên máy chủ.", 0);
        }

        if (string.IsNullOrWhiteSpace(options.AccountNumber))
        {
            return new HmacVerificationResult(false, 503, "Thiếu cấu hình tài khoản ngân hàng nhận tiền SePay.", 0);
        }

        if (rawBodyBytes == null || rawBodyBytes.Length == 0)
        {
            return new HmacVerificationResult(false, 400, "Payload webhook trống.", 0);
        }

        if (string.IsNullOrWhiteSpace(timestampHeader) ||
            !long.TryParse(timestampHeader.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var timestampSeconds))
        {
            return new HmacVerificationResult(false, 401, "Thiếu hoặc sai định dạng header X-SePay-Timestamp.", 0);
        }

        var nowSeconds = (utcNowOverride ?? DateTimeOffset.UtcNow).ToUnixTimeSeconds();
        if (timestampSeconds - nowSeconds > PaymentQrHelper.MaxFutureClockSkewSeconds)
        {
            return new HmacVerificationResult(false, 401, "Timestamp webhook vượt quá sai lệch tương lai cho phép.", timestampSeconds);
        }

        if (nowSeconds - timestampSeconds > options.TimestampToleranceSeconds)
        {
            return new HmacVerificationResult(false, 401, "Timestamp webhook đã hết hạn (quá cửa sổ chống phát lại).", timestampSeconds);
        }

        if (string.IsNullOrWhiteSpace(signatureHeader))
        {
            return new HmacVerificationResult(false, 401, "Thiếu header X-SePay-Signature.", timestampSeconds);
        }

        var trimmedSig = signatureHeader.Trim();
        if (!trimmedSig.StartsWith("sha256=", StringComparison.OrdinalIgnoreCase))
        {
            return new HmacVerificationResult(false, 401, "Định dạng X-SePay-Signature không hợp lệ.", timestampSeconds);
        }

        var hexPart = trimmedSig.Substring(7).Trim();
        if (hexPart.Length != 64)
        {
            return new HmacVerificationResult(false, 401, "Độ dài chữ ký HMAC-SHA256 không hợp lệ.", timestampSeconds);
        }

        byte[] incomingHashBytes;
        try
        {
            incomingHashBytes = Convert.FromHexString(hexPart);
        }
        catch (FormatException)
        {
            return new HmacVerificationResult(false, 401, "Chữ ký hex X-SePay-Signature không hợp lệ.", timestampSeconds);
        }

        var timestampPrefixBytes = Encoding.UTF8.GetBytes($"{timestampHeader.Trim()}.");
        var payloadToSign = new byte[timestampPrefixBytes.Length + rawBodyBytes.Length];
        Buffer.BlockCopy(timestampPrefixBytes, 0, payloadToSign, 0, timestampPrefixBytes.Length);
        Buffer.BlockCopy(rawBodyBytes, 0, payloadToSign, timestampPrefixBytes.Length, rawBodyBytes.Length);

        var keyBytes = Encoding.UTF8.GetBytes(options.WebhookSecret);
        var expectedHashBytes = HMACSHA256.HashData(keyBytes, payloadToSign);

        if (!CryptographicOperations.FixedTimeEquals(expectedHashBytes, incomingHashBytes))
        {
            return new HmacVerificationResult(false, 401, "Chữ ký HMAC-SHA256 không khớp.", timestampSeconds);
        }

        return new HmacVerificationResult(true, 200, "OK", timestampSeconds);
    }

    public sealed record TriageBillingAssignmentResult(
        Billing? Billing,
        string Action,
        string? DiscrepancyWarning = null);

    public static async Task<Billing> GetOrCreateRegistrationBillingAsync(
        HospitalDbContext dbContext,
        Guid patientId,
        Guid? appointmentId,
        decimal amount,
        string itemName,
        SepayPaymentOptions? options = null,
        CancellationToken ct = default)
    {
        var resolvedOptions = options ?? PaymentQrHelper.ResolveOptions(null);
        var gate = GetCreationLock(patientId, appointmentId);
        await gate.WaitAsync(ct);
        try
        {
            var existing = await FindActiveRegistrationBillingAsync(dbContext, patientId, appointmentId, resolvedOptions, ct);
            if (existing != null)
            {
                return existing;
            }

            return await CreateRegistrationBillingCoreAsync(dbContext, patientId, appointmentId, amount, itemName, resolvedOptions, ct);
        }
        finally
        {
            gate.Release();
        }
    }

    /// <summary>
    /// Chốt hoặc cập nhật duy nhất 1 hóa đơn Registration theo đúng chuyên khoa được Nhân viên Sàng lọc chỉ định (Cách 1).
    /// Tuyệt đối không tạo trùng hóa đơn và không ghi đè hóa đơn đã thanh toán (Paid).
    /// </summary>
    public static async Task<TriageBillingAssignmentResult> TriageAssignOrUpdateRegistrationBillingAsync(
        HospitalDbContext dbContext,
        Guid patientId,
        Guid? appointmentId,
        decimal departmentFee,
        string departmentName,
        bool isWaivedByBhytOrEmergency,
        SepayPaymentOptions? options = null,
        CancellationToken ct = default)
    {
        var resolvedOptions = options ?? PaymentQrHelper.ResolveOptions(null);
        var cleanFee = Math.Max(0m, decimal.Round(departmentFee, 2, MidpointRounding.AwayFromZero));
        var itemTitle = $"Phí khám chuyên khoa - {departmentName}";

        Billing? existing;
        var gate = GetCreationLock(patientId, appointmentId);
        await gate.WaitAsync(ct);
        try
        {
            existing = await FindActiveRegistrationBillingAsync(dbContext, patientId, appointmentId, resolvedOptions, ct);
            if (existing == null)
            {
                if (isWaivedByBhytOrEmergency)
                {
                    return new TriageBillingAssignmentResult(null, "WaivedBhytOrEmergency");
                }

                var created = await CreateRegistrationBillingCoreAsync(
                    dbContext, patientId, appointmentId, cleanFee, itemTitle, resolvedOptions, ct);
                return new TriageBillingAssignmentResult(created, "Created");
            }
        }
        finally
        {
            gate.Release();
        }

        string action = "Unchanged";
        string? warning = null;
        Billing? latestBilling = existing;

        var lockOutcome = await ExecuteLockedBillingTransactionAsync(dbContext, existing.Id, async () =>
        {
            var lockedBill = await dbContext.Billings
                .Include(b => b.Items)
                .FirstOrDefaultAsync(b => b.Id == existing.Id, ct);

            if (lockedBill == null)
                return new BillingSettlementResult(SettlementOutcomeCode.NotFound, "Không tìm thấy hóa đơn.");

            latestBilling = lockedBill;

            if (lockedBill.Status == "Cancelled")
                return new BillingSettlementResult(SettlementOutcomeCode.Cancelled, "Hóa đơn đã hủy.", lockedBill);

            if (lockedBill.Status == "Paid")
            {
                action = "KeptExistingPaid";
                if (!isWaivedByBhytOrEmergency && lockedBill.TotalAmount != cleanFee)
                {
                    var diff = cleanFee - lockedBill.TotalAmount;
                    var diffText = diff > 0 ? $"thiếu {diff:0.##}đ" : $"dư {Math.Abs(diff):0.##}đ";
                    warning = $"Hóa đơn đã thanh toán {lockedBill.TotalAmount:0.##}đ trước khi Sàng lọc chuyển sang {departmentName} ({cleanFee:0.##}đ, {diffText}). Cần Thu ngân đối soát.";
                    AppendBillingDiscrepancyNote(lockedBill, warning);
                    await dbContext.SaveChangesAsync(ct);
                }
                return new BillingSettlementResult(SettlementOutcomeCode.Success, "OK", lockedBill);
            }

            if (isWaivedByBhytOrEmergency)
            {
                lockedBill.Status = "Cancelled";
                AppendBillingDiscrepancyNote(lockedBill, $"Miễn tạm ứng tại Sàng lọc (BHYT/Cấp cứu) khi phân vào {departmentName}.");
                await dbContext.SaveChangesAsync(ct);
                action = "WaivedBhytOrEmergency";
                return new BillingSettlementResult(SettlementOutcomeCode.Success, "OK", lockedBill);
            }

            lockedBill.TotalAmount = cleanFee;
            var primaryItem = lockedBill.Items.FirstOrDefault();
            if (primaryItem != null)
            {
                primaryItem.ItemName = itemTitle;
                primaryItem.UnitPrice = cleanFee;
                primaryItem.Quantity = 1;
                primaryItem.TotalPrice = cleanFee;
            }
            else
            {
                dbContext.BillingItems.Add(new BillingItem
                {
                    Id = Guid.NewGuid(),
                    BillingId = lockedBill.Id,
                    ItemName = itemTitle,
                    UnitPrice = cleanFee,
                    Quantity = 1,
                    TotalPrice = cleanFee
                });
            }

            if (cleanFee == 0m)
            {
                lockedBill.Status = "Paid";
                lockedBill.PaidAt = DateTime.UtcNow;
                lockedBill.PaymentMethod = "Miễn phí / BHYT chi trả 100%";
            }

            await dbContext.SaveChangesAsync(ct);
            action = "UpdatedUnpaid";
            return new BillingSettlementResult(SettlementOutcomeCode.Success, "OK", lockedBill);
        }, ct);

        if (lockOutcome.Code != SettlementOutcomeCode.Success && warning == null)
        {
            warning = lockOutcome.Message;
        }

        return new TriageBillingAssignmentResult(latestBilling, action, warning);
    }

    private static async Task<Billing?> FindActiveRegistrationBillingAsync(
        HospitalDbContext dbContext,
        Guid patientId,
        Guid? appointmentId,
        SepayPaymentOptions resolvedOptions,
        CancellationToken ct)
    {
        if (appointmentId.HasValue && appointmentId.Value != Guid.Empty)
        {
            var existingForApt = await dbContext.Billings
                .Include(b => b.Items)
                .Where(b => b.AppointmentId == appointmentId.Value
                    && b.BillingType == "Registration"
                    && b.Status != "Cancelled")
                .OrderByDescending(b => b.CreatedAt)
                .FirstOrDefaultAsync(ct);

            if (existingForApt != null)
            {
                if (string.IsNullOrWhiteSpace(existingForApt.PaymentCode))
                {
                    await PaymentQrHelper.EnsureUniquePaymentCodeAsync(dbContext, existingForApt, resolvedOptions.PaymentPrefix, ct);
                    await dbContext.SaveChangesAsync(ct);
                }
                return existingForApt;
            }
        }

        var cutoff = DateTime.UtcNow.Date.AddDays(-1);
        var existingRecent = await dbContext.Billings
            .Include(b => b.Items)
            .Where(b => b.PatientId == patientId
                && b.BillingType == "Registration"
                && b.Status != "Cancelled"
                && b.CreatedAt >= cutoff)
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (existingRecent != null)
        {
            var updated = false;
            if (appointmentId.HasValue && appointmentId.Value != Guid.Empty && !existingRecent.AppointmentId.HasValue)
            {
                existingRecent.AppointmentId = appointmentId.Value;
                updated = true;
            }
            if (string.IsNullOrWhiteSpace(existingRecent.PaymentCode))
            {
                await PaymentQrHelper.EnsureUniquePaymentCodeAsync(dbContext, existingRecent, resolvedOptions.PaymentPrefix, ct);
                updated = true;
            }
            if (updated)
            {
                await dbContext.SaveChangesAsync(ct);
            }
            return existingRecent;
        }

        return null;
    }

    private static async Task<Billing> CreateRegistrationBillingCoreAsync(
        HospitalDbContext dbContext,
        Guid patientId,
        Guid? appointmentId,
        decimal amount,
        string itemName,
        SepayPaymentOptions resolvedOptions,
        CancellationToken ct)
    {
        var cleanAmount = Math.Max(0m, decimal.Round(amount, 2, MidpointRounding.AwayFromZero));
        var initialStatus = cleanAmount == 0m ? "Paid" : "Unpaid";

        for (var attempt = 0; attempt < 5; attempt++)
        {
            var bill = new Billing
            {
                Id = Guid.NewGuid(),
                PatientId = patientId,
                AppointmentId = (appointmentId.HasValue && appointmentId.Value != Guid.Empty) ? appointmentId.Value : null,
                BillingType = "Registration",
                TotalAmount = cleanAmount,
                Status = initialStatus,
                PaidAt = cleanAmount == 0m ? DateTime.UtcNow : null,
                PaymentMethod = cleanAmount == 0m ? "Miễn phí / BHYT chi trả 100%" : null,
                CreatedAt = DateTime.UtcNow,
                Items = new List<BillingItem>
                {
                    new BillingItem
                    {
                        Id = Guid.NewGuid(),
                        ItemName = itemName,
                        UnitPrice = cleanAmount,
                        Quantity = 1,
                        TotalPrice = cleanAmount
                    }
                }
            };

            await PaymentQrHelper.EnsureUniquePaymentCodeAsync(dbContext, bill, resolvedOptions.PaymentPrefix, ct);
            dbContext.Billings.Add(bill);

            try
            {
                await dbContext.SaveChangesAsync(ct);
                return bill;
            }
            catch (DbUpdateException)
            {
                dbContext.ChangeTracker.Clear();

                if (appointmentId.HasValue && appointmentId.Value != Guid.Empty)
                {
                    var racedBill = await dbContext.Billings
                        .Include(b => b.Items)
                        .FirstOrDefaultAsync(b => b.AppointmentId == appointmentId.Value
                            && b.BillingType == "Registration"
                            && b.Status != "Cancelled", ct);
                    if (racedBill != null)
                    {
                        return racedBill;
                    }
                }
            }
        }

        throw new InvalidOperationException("Không thể khởi tạo hóa đơn công khám duy nhất sau nhiều lần thử.");
    }

    public static async Task<BillingSettlementResult> SettleManualCashAsync(
        HospitalDbContext dbContext,
        Guid billingId,
        Guid? cashierUserId,
        bool isCashierOrAdmin,
        bool isReceptionistOnly,
        CancellationToken ct = default)
    {
        return await ExecuteLockedBillingTransactionAsync(dbContext, billingId, async () =>
        {
            var billing = await dbContext.Billings
                .Include(b => b.Items)
                .FirstOrDefaultAsync(b => b.Id == billingId, ct);

            if (billing == null)
                return new BillingSettlementResult(SettlementOutcomeCode.NotFound, "Không tìm thấy hóa đơn");

            if (billing.Status == "Cancelled")
                return new BillingSettlementResult(SettlementOutcomeCode.Cancelled, "Hóa đơn đã bị hủy, không thể thu tiền", billing);

            if (billing.Status == "Paid")
                return new BillingSettlementResult(SettlementOutcomeCode.AlreadyPaid, "Hóa đơn đã được thanh toán trước đó", billing);

            if (isReceptionistOnly && !isCashierOrAdmin && billing.BillingType != "Registration")
            {
                return new BillingSettlementResult(
                    SettlementOutcomeCode.ForbiddenRole,
                    "Nhân viên tiếp nhận chỉ có thẩm quyền thu phí khám ban đầu (Registration). Vui lòng chuyển bệnh nhân sang quầy Thu ngân để thanh toán viện phí cận lâm sàng hoặc thuốc.",
                    billing);
            }

            if (cashierUserId.HasValue && cashierUserId.Value != Guid.Empty)
            {
                var staff = await dbContext.StaffProfiles.FirstOrDefaultAsync(s => s.UserId == cashierUserId.Value || s.Id == cashierUserId.Value, ct);
                if (staff != null) billing.CashierId = staff.Id;
            }

            billing.Status = "Paid";
            billing.PaidAt = DateTime.UtcNow;
            billing.PaymentMethod = "Tiền mặt";

            await ApplyRelatedEntitySettlementUpdatesAsync(dbContext, billing, ct);
            await dbContext.SaveChangesAsync(ct);

            return new BillingSettlementResult(SettlementOutcomeCode.Success, "Thanh toán tiền mặt thành công", billing);
        }, ct);
    }

    public static async Task<BillingSettlementResult> SettleManualTransferAsync(
        HospitalDbContext dbContext,
        Guid billingId,
        string? transactionRef,
        Guid? cashierUserId,
        bool isCashierOrAdmin,
        bool isReceptionistOnly,
        bool isCashierRole,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(transactionRef) || transactionRef.Trim().Length < 6)
        {
            return new BillingSettlementResult(
                SettlementOutcomeCode.InvalidReference,
                "Vui lòng cung cấp mã tham chiếu giao dịch (TransactionRef) hoặc mã chuẩn chi ngân hàng tối thiểu 6 ký tự để đối soát thanh toán hợp lệ.");
        }

        var cleanRef = transactionRef.Trim();
        var lowerRef = cleanRef.ToLowerInvariant();
        if (lowerRef is "123456" or "string" or "transactionref" or "test" or "null")
        {
            return new BillingSettlementResult(
                SettlementOutcomeCode.InvalidReference,
                "Mã giao dịch không hợp lệ hoặc là giá trị giữ chỗ (Placeholder). Vui lòng nhập mã chuẩn chi thực tế.");
        }

        return await ExecuteLockedBillingTransactionAsync(dbContext, billingId, async () =>
        {
            var billing = await dbContext.Billings
                .Include(b => b.Items)
                .FirstOrDefaultAsync(b => b.Id == billingId, ct);

            if (billing == null)
                return new BillingSettlementResult(SettlementOutcomeCode.NotFound, "Không tìm thấy hóa đơn");

            if (billing.Status == "Cancelled")
                return new BillingSettlementResult(SettlementOutcomeCode.Cancelled, "Hóa đơn đã bị hủy, không thể xác nhận thanh toán", billing);

            if (billing.Status == "Paid")
                return new BillingSettlementResult(SettlementOutcomeCode.AlreadyPaid, "Hóa đơn đã được thanh toán trước đó", billing);

            if (isReceptionistOnly && !isCashierOrAdmin && billing.BillingType != "Registration")
            {
                return new BillingSettlementResult(
                    SettlementOutcomeCode.ForbiddenRole,
                    "Nhân viên tiếp nhận chỉ có thẩm quyền xác nhận thu phí khám ban đầu. Vui lòng chuyển bệnh nhân sang quầy Thu ngân.",
                    billing);
            }

            var isDuplicateTxn = await dbContext.Billings.AnyAsync(b => b.TransactionRef == cleanRef && b.Id != billingId, ct);
            if (isDuplicateTxn)
            {
                return new BillingSettlementResult(
                    SettlementOutcomeCode.Replay,
                    "Mã giao dịch đối soát này đã được ghi nhận cho một hóa đơn khác trong hệ thống. Cảnh báo giao dịch trùng lặp hoặc giả mạo!",
                    billing);
            }

            if (cashierUserId.HasValue && cashierUserId.Value != Guid.Empty)
            {
                var staff = await dbContext.StaffProfiles.FirstOrDefaultAsync(s => s.UserId == cashierUserId.Value || s.Id == cashierUserId.Value, ct);
                if (staff != null) billing.CashierId = staff.Id;
            }

            billing.Status = "Paid";
            billing.PaidAt = DateTime.UtcNow;
            billing.PaymentMethod = isCashierRole
                ? "Chuyển khoản VietQR (Thu ngân đối soát)"
                : "Chuyển khoản VietQR (Tiếp nhận đối soát)";
            billing.TransactionRef = cleanRef;

            await ApplyRelatedEntitySettlementUpdatesAsync(dbContext, billing, ct);
            await dbContext.SaveChangesAsync(ct);

            return new BillingSettlementResult(SettlementOutcomeCode.Success, "Xác nhận chuyển khoản VietQR thành công", billing);
        }, ct);
    }

    public static async Task<BillingSettlementResult> SettleVnPayAsync(
        HospitalDbContext dbContext,
        Guid billingId,
        decimal actualPaidAmount,
        string vnpTxnRef,
        string vnpTransactionNo,
        CancellationToken ct = default)
    {
        return await ExecuteLockedBillingTransactionAsync(dbContext, billingId, async () =>
        {
            var billing = await dbContext.Billings
                .Include(b => b.Items)
                .FirstOrDefaultAsync(b => b.Id == billingId, ct);

            if (billing == null)
                return new BillingSettlementResult(SettlementOutcomeCode.NotFound, "Order not found");

            if (billing.Status == "Cancelled")
                return new BillingSettlementResult(SettlementOutcomeCode.Cancelled, "Order cancelled", billing);

            if (billing.Status == "Paid")
                return new BillingSettlementResult(SettlementOutcomeCode.AlreadyPaid, "Order already confirmed", billing);

            if (actualPaidAmount != billing.TotalAmount)
                return new BillingSettlementResult(SettlementOutcomeCode.InvalidAmount, "Invalid amount", billing);

            var finalRef = !string.IsNullOrEmpty(vnpTransactionNo) && vnpTransactionNo != "0"
                ? $"VNPAY-{vnpTransactionNo}"
                : vnpTxnRef;

            var isReplay = await dbContext.Billings.AnyAsync(b => b.TransactionRef == finalRef && b.Id != billing.Id, ct);
            if (isReplay)
                return new BillingSettlementResult(SettlementOutcomeCode.Replay, "Duplicate transaction reference", billing);

            billing.Status = "Paid";
            billing.PaidAt = DateTime.UtcNow;
            billing.PaymentMethod = "VNPay";
            billing.TransactionRef = finalRef;

            await ApplyRelatedEntitySettlementUpdatesAsync(dbContext, billing, ct);
            await dbContext.SaveChangesAsync(ct);

            return new BillingSettlementResult(SettlementOutcomeCode.Success, "Confirm Success", billing);
        }, ct);
    }

    public static async Task<BillingSettlementResult> ProcessSepayWebhookAsync(
        HospitalDbContext dbContext,
        SepayWebhookPayloadDto payload,
        long webhookTimestamp,
        SepayPaymentOptions options,
        CancellationToken ct = default)
    {
        if (payload.Id <= 0)
        {
            return new BillingSettlementResult(SettlementOutcomeCode.InvalidReference, "ID giao dịch SePay không hợp lệ.");
        }

        // Tiền kiểm tra loại giao dịch / tài khoản / mã thanh toán để xác định khóa hóa đơn tương ứng
        var extractedCode = PaymentQrHelper.ExtractPaymentCode(payload.Code, payload.Content, payload.Description, options.PaymentPrefix);
        Billing? targetHint = null;
        if (!string.IsNullOrWhiteSpace(extractedCode))
        {
            targetHint = await dbContext.Billings
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.PaymentCode == extractedCode, ct);
        }

        var isRelational = dbContext.Database.IsRelational();
        var memGate = targetHint != null ? GetBillingLock(targetHint.Id) : GetSepayTxnLock(payload.Id);
        await memGate.WaitAsync(ct);

        IDbContextTransaction? tx = null;
        try
        {
            if (isRelational)
            {
                tx = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
                var lockResource = targetHint != null
                    ? $"BillingLock_{targetHint.Id:N}"
                    : $"SepayTxn_{payload.Id}";
                await AcquireSqlAppLockAsync(dbContext, lockResource, ct);
            }

            // 1. Idempotency: Đã từng xử lý ID giao dịch SePay này chưa?
            var alreadyLogged = await dbContext.SepayWebhookTransactions
                .AsNoTracking()
                .AnyAsync(t => t.SepayTransactionId == payload.Id, ct);

            if (alreadyLogged)
            {
                if (tx != null) await tx.RollbackAsync(ct);
                return new BillingSettlementResult(SettlementOutcomeCode.AlreadyProcessedWebhook, "Giao dịch SePay đã được xử lý trước đó.", ProcessingStatus: "Ignored_Duplicate");
            }

            var logEntry = new SepayWebhookTransaction
            {
                Id = Guid.NewGuid(),
                SepayTransactionId = payload.Id,
                ReferenceCode = Truncate(payload.ReferenceCode, 100),
                Gateway = Truncate(payload.Gateway, 50),
                TransactionDate = Truncate(payload.TransactionDate, 40),
                AccountNumber = Truncate(payload.AccountNumber, 50),
                SubAccount = Truncate(payload.SubAccount, 50),
                TransferType = Truncate(payload.TransferType, 20),
                TransferAmount = payload.TransferAmount,
                PaymentCode = Truncate(extractedCode, 30),
                WebhookTimestamp = webhookTimestamp,
                ReceivedAt = DateTime.UtcNow
            };

            // 2. Chỉ xử lý giao dịch tiền vào (transferType == "in")
            if (!string.Equals(payload.TransferType?.Trim(), "in", StringComparison.OrdinalIgnoreCase))
            {
                logEntry.ProcessingStatus = "Ignored_OutTransfer";
                logEntry.Note = "Bỏ qua giao dịch không phải tiền vào.";
                dbContext.SepayWebhookTransactions.Add(logEntry);
                await dbContext.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);
                return new BillingSettlementResult(SettlementOutcomeCode.IgnoredWebhook, logEntry.Note, ProcessingStatus: logEntry.ProcessingStatus);
            }

            // 3. Kiểm tra chính xác tài khoản ngân hàng nhận tiền cấu hình
            var expectedAcc = NormalizeAccountNumber(options.AccountNumber);
            var incomingAcc = NormalizeAccountNumber(payload.AccountNumber);
            var expectedSubAcc = NormalizeAccountNumber(options.SubAccount);
            var incomingSubAcc = NormalizeAccountNumber(payload.SubAccount);

            var accountMatched = !string.IsNullOrEmpty(expectedAcc) && string.Equals(incomingAcc, expectedAcc, StringComparison.Ordinal);
            var subAccountMatched = string.IsNullOrEmpty(expectedSubAcc) || string.Equals(incomingSubAcc, expectedSubAcc, StringComparison.Ordinal);

            if (!accountMatched || !subAccountMatched)
            {
                logEntry.ProcessingStatus = "Ignored_WrongAccount";
                logEntry.Note = "Số tài khoản nhận trong webhook không khớp cấu hình bệnh viện.";
                dbContext.SepayWebhookTransactions.Add(logEntry);
                await dbContext.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);
                return new BillingSettlementResult(SettlementOutcomeCode.IgnoredWebhook, logEntry.Note, ProcessingStatus: logEntry.ProcessingStatus);
            }

            // 4. Kiểm tra mã thanh toán HAI + 8 hex
            if (string.IsNullOrWhiteSpace(extractedCode))
            {
                logEntry.ProcessingStatus = "Ignored_InvalidCode";
                logEntry.Note = $"Không trích xuất được mã thanh toán chuẩn {options.PaymentPrefix} + 8 ký tự hex.";
                dbContext.SepayWebhookTransactions.Add(logEntry);
                await dbContext.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);
                return new BillingSettlementResult(SettlementOutcomeCode.IgnoredWebhook, logEntry.Note, ProcessingStatus: logEntry.ProcessingStatus);
            }

            var billing = await dbContext.Billings
                .Include(b => b.Items)
                .FirstOrDefaultAsync(b => b.PaymentCode == extractedCode, ct);

            if (billing == null)
            {
                logEntry.ProcessingStatus = "Ignored_NotFound";
                logEntry.Note = $"Không tìm thấy hóa đơn có mã thanh toán {extractedCode}.";
                dbContext.SepayWebhookTransactions.Add(logEntry);
                await dbContext.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);
                return new BillingSettlementResult(SettlementOutcomeCode.IgnoredWebhook, logEntry.Note, ProcessingStatus: logEntry.ProcessingStatus);
            }

            logEntry.BillingId = billing.Id;
            logEntry.ExpectedAmount = billing.TotalAmount;
            logEntry.DiscrepancyAmount = payload.TransferAmount - billing.TotalAmount;

            // 5. Không ghi đè nếu hóa đơn đã Paid hoặc đã Cancelled
            if (billing.Status == "Paid")
            {
                logEntry.ProcessingStatus = "Late_AfterPaid";
                logEntry.Note = $"Nhận SePay #{payload.Id} ({payload.TransferAmount:0.##}đ) sau khi hóa đơn đã đóng qua '{billing.PaymentMethod}'. Cần Thu ngân đối soát.";
                AppendBillingDiscrepancyNote(billing, logEntry.Note);
                dbContext.SepayWebhookTransactions.Add(logEntry);
                await dbContext.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);
                return new BillingSettlementResult(SettlementOutcomeCode.DiscrepancyRecorded, logEntry.Note, billing, logEntry.ProcessingStatus);
            }

            if (billing.Status == "Cancelled")
            {
                logEntry.ProcessingStatus = "Late_AfterCancelled";
                logEntry.Note = $"Nhận SePay #{payload.Id} ({payload.TransferAmount:0.##}đ) nhưng hóa đơn đã hủy. Cần Thu ngân hoàn tiền/đối soát.";
                AppendBillingDiscrepancyNote(billing, logEntry.Note);
                dbContext.SepayWebhookTransactions.Add(logEntry);
                await dbContext.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);
                return new BillingSettlementResult(SettlementOutcomeCode.DiscrepancyRecorded, logEntry.Note, billing, logEntry.ProcessingStatus);
            }

            // 6. Chỉ tự động xác nhận khi số tiền khớp chính xác từng phần thập phân (không ép kiểu long!)
            if (billing.TotalAmount <= 0m || payload.TransferAmount <= 0m || payload.TransferAmount != billing.TotalAmount)
            {
                var isUnderpaid = payload.TransferAmount < billing.TotalAmount;
                logEntry.ProcessingStatus = isUnderpaid ? "Discrepancy_Underpaid" : "Discrepancy_Overpaid";
                logEntry.Note = isUnderpaid
                    ? $"Chuyển thiếu tiền qua SePay #{payload.Id}: nhận {payload.TransferAmount:0.##}đ / cần {billing.TotalAmount:0.##}đ (thiếu {billing.TotalAmount - payload.TransferAmount:0.##}đ). Chờ Thu ngân đối soát."
                    : $"Chuyển thừa tiền qua SePay #{payload.Id}: nhận {payload.TransferAmount:0.##}đ / cần {billing.TotalAmount:0.##}đ (thừa {payload.TransferAmount - billing.TotalAmount:0.##}đ). Chờ Thu ngân đối soát.";
                AppendBillingDiscrepancyNote(billing, logEntry.Note);
                dbContext.SepayWebhookTransactions.Add(logEntry);
                await dbContext.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);
                return new BillingSettlementResult(SettlementOutcomeCode.DiscrepancyRecorded, logEntry.Note, billing, logEntry.ProcessingStatus);
            }

            // 7. Khớp chính xác số tiền -> Chốt Paid nguyên tử cùng nhật ký SePay
            var sepayTxnRef = $"SEPAY-{payload.Id}";
            var refConflict = await dbContext.Billings.AnyAsync(b => b.TransactionRef == sepayTxnRef && b.Id != billing.Id, ct);
            if (refConflict)
            {
                logEntry.ProcessingStatus = "Ignored_DuplicateRef";
                logEntry.Note = $"Mã tham chiếu {sepayTxnRef} đã gắn cho hóa đơn khác.";
                dbContext.SepayWebhookTransactions.Add(logEntry);
                await dbContext.SaveChangesAsync(ct);
                if (tx != null) await tx.CommitAsync(ct);
                return new BillingSettlementResult(SettlementOutcomeCode.Replay, logEntry.Note, billing, logEntry.ProcessingStatus);
            }

            billing.Status = "Paid";
            billing.PaidAt = DateTime.UtcNow;
            billing.PaymentMethod = "Chuyển khoản VietQR (SePay)";
            billing.TransactionRef = sepayTxnRef;

            logEntry.ProcessingStatus = "Processed";
            logEntry.Note = $"Xác nhận thanh toán tự động thành công qua SePay #{payload.Id} (Ref: {payload.ReferenceCode ?? "N/A"}).";

            dbContext.SepayWebhookTransactions.Add(logEntry);
            await ApplyRelatedEntitySettlementUpdatesAsync(dbContext, billing, ct);
            await dbContext.SaveChangesAsync(ct);

            if (tx != null) await tx.CommitAsync(ct);
            return new BillingSettlementResult(SettlementOutcomeCode.Success, "Confirm Success", billing, logEntry.ProcessingStatus);
        }
        catch (DbUpdateException)
        {
            if (tx != null)
            {
                try { await tx.RollbackAsync(ct); } catch { }
            }
            dbContext.ChangeTracker.Clear();

            // Kiểm tra lại xem có phải race condition do request song song của chính SepayTransactionId này đã commit thành công không
            try
            {
                var committedByPeer = await dbContext.SepayWebhookTransactions
                    .AsNoTracking()
                    .AnyAsync(t => t.SepayTransactionId == payload.Id, ct);

                if (committedByPeer)
                {
                    return new BillingSettlementResult(
                        SettlementOutcomeCode.AlreadyProcessedWebhook,
                        "Giao dịch SePay đã được tiến trình song song ghi nhận.",
                        ProcessingStatus: "Ignored_Duplicate");
                }
            }
            catch
            {
                // Rơi xuống trả lỗi DB thật bên dưới
            }

            return new BillingSettlementResult(SettlementOutcomeCode.DatabaseFailure, "Lỗi CSDL khi ghi nhận giao dịch thanh toán.");
        }
        catch (Exception)
        {
            if (tx != null)
            {
                try { await tx.RollbackAsync(ct); } catch { }
            }
            dbContext.ChangeTracker.Clear();
            return new BillingSettlementResult(SettlementOutcomeCode.DatabaseFailure, "Lỗi máy chủ khi xử lý giao dịch CSDL.");
        }
        finally
        {
            if (tx != null)
            {
                await tx.DisposeAsync();
            }
            memGate.Release();
        }
    }

    private static async Task<BillingSettlementResult> ExecuteLockedBillingTransactionAsync(
        HospitalDbContext dbContext,
        Guid billingId,
        Func<Task<BillingSettlementResult>> operation,
        CancellationToken ct)
    {
        var isRelational = dbContext.Database.IsRelational();
        var memGate = GetBillingLock(billingId);
        await memGate.WaitAsync(ct);
        IDbContextTransaction? tx = null;
        try
        {
            if (isRelational)
            {
                tx = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
                await AcquireSqlAppLockAsync(dbContext, $"BillingLock_{billingId:N}", ct);
            }

            var result = await operation();
            if (tx != null)
            {
                if (result.Code == SettlementOutcomeCode.Success)
                {
                    await tx.CommitAsync(ct);
                }
                else
                {
                    await tx.RollbackAsync(ct);
                }
            }
            return result;
        }
        catch (DbUpdateException)
        {
            if (tx != null)
            {
                try { await tx.RollbackAsync(ct); } catch { }
            }
            dbContext.ChangeTracker.Clear();
            return new BillingSettlementResult(
                SettlementOutcomeCode.Replay,
                "Mã giao dịch đối soát này đã được ghi nhận cho một hóa đơn khác trong hệ thống (Ràng buộc duy nhất Database). Cảnh báo giao dịch trùng lặp hoặc giả mạo!");
        }
        finally
        {
            if (tx != null)
            {
                await tx.DisposeAsync();
            }
            memGate.Release();
        }
    }

    private static async Task AcquireSqlAppLockAsync(HospitalDbContext dbContext, string lockResource, CancellationToken ct)
    {
        var connection = dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(ct);
        }

        using var cmd = connection.CreateCommand();
        cmd.Transaction = dbContext.Database.CurrentTransaction?.GetDbTransaction();
        cmd.CommandText = "sp_getapplock";
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.CommandTimeout = 15;

        var pResource = cmd.CreateParameter();
        pResource.ParameterName = "@Resource";
        pResource.Value = lockResource;
        pResource.DbType = DbType.String;
        cmd.Parameters.Add(pResource);

        var pMode = cmd.CreateParameter();
        pMode.ParameterName = "@LockMode";
        pMode.Value = "Exclusive";
        pMode.DbType = DbType.String;
        cmd.Parameters.Add(pMode);

        var pOwner = cmd.CreateParameter();
        pOwner.ParameterName = "@LockOwner";
        pOwner.Value = "Transaction";
        pOwner.DbType = DbType.String;
        cmd.Parameters.Add(pOwner);

        var pTimeout = cmd.CreateParameter();
        pTimeout.ParameterName = "@LockTimeout";
        pTimeout.Value = 10000;
        pTimeout.DbType = DbType.Int32;
        cmd.Parameters.Add(pTimeout);

        var pReturn = cmd.CreateParameter();
        pReturn.ParameterName = "@ReturnValue";
        pReturn.Direction = ParameterDirection.ReturnValue;
        cmd.Parameters.Add(pReturn);

        await cmd.ExecuteNonQueryAsync(ct);
        var retCode = Convert.ToInt32(pReturn.Value);
        if (retCode < 0)
        {
            throw new InvalidOperationException($"Không thể xác lập khóa giao dịch hóa đơn (sp_getapplock code: {retCode}).");
        }
    }

    /// <summary>
    /// Kiểm tra vòng đời Appointment, Examination, ServiceOrder trước khi đồng bộ trạng thái; không ghi đè trạng thái đã hoàn thành hoặc đã hủy.
    /// </summary>
    private static async Task ApplyRelatedEntitySettlementUpdatesAsync(HospitalDbContext dbContext, Billing billing, CancellationToken ct)
    {
        if (billing.BillingType == "Registration" && billing.ExaminationId.HasValue)
        {
            var exam = await dbContext.Examinations.FirstOrDefaultAsync(e => e.Id == billing.ExaminationId.Value, ct);
            if (exam != null && IsEligibleForPaidExamTransition(exam.Status))
            {
                exam.Status = "Paid";
            }
        }
        else if (billing.BillingType == "ServiceOrder")
        {
            var refIds = billing.Items
                .Where(i => i.ReferenceId.HasValue)
                .Select(i => i.ReferenceId!.Value)
                .Distinct()
                .ToList();

            if (refIds.Count > 0)
            {
                var serviceOrders = await dbContext.ServiceOrders
                    .Where(s => refIds.Contains(s.Id))
                    .ToListAsync(ct);

                foreach (var so in serviceOrders)
                {
                    if (IsEligibleForPaidServiceOrderTransition(so.Status))
                    {
                        so.Status = "Paid";
                    }
                }
            }
        }

        if (billing.AppointmentId.HasValue && billing.AppointmentId.Value != Guid.Empty)
        {
            var apt = await dbContext.Appointments.FirstOrDefaultAsync(a => a.Id == billing.AppointmentId.Value, ct);
            if (apt != null && string.Equals(apt.Status, "Pending", StringComparison.OrdinalIgnoreCase))
            {
                apt.Status = "Confirmed";
            }
        }
    }

    private static bool IsEligibleForPaidExamTransition(string? status)
    {
        var s = (status ?? string.Empty).Trim();
        return s.Equals("Pending", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Unpaid", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Waiting", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Chờ khám", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Chờ thanh toán", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsEligibleForPaidServiceOrderTransition(string? status)
    {
        var s = (status ?? string.Empty).Trim();
        return string.IsNullOrEmpty(s)
            || s.Equals("Pending", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Unpaid", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Chờ thanh toán", StringComparison.OrdinalIgnoreCase)
            || s.Equals("Chờ thực hiện", StringComparison.OrdinalIgnoreCase);
    }

    private static void AppendBillingDiscrepancyNote(Billing billing, string note)
    {
        var clean = note.Trim();
        if (string.IsNullOrWhiteSpace(billing.DiscrepancyNote))
        {
            billing.DiscrepancyNote = Truncate(clean, 500);
        }
        else if (!billing.DiscrepancyNote.Contains(clean, StringComparison.Ordinal))
        {
            billing.DiscrepancyNote = Truncate($"{billing.DiscrepancyNote} | {clean}", 500);
        }
    }

    private static string? Truncate(string? value, int maxLen)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLen ? trimmed : trimmed[..maxLen];
    }
}
