using System;

namespace HospitalAI.Domain.Entities;

/// <summary>
/// Nhật ký giao dịch Webhook SePay (đảm bảo idempotency, chống replay và lưu vết đối soát sai lệch số tiền / giao dịch muộn).
/// Tuyệt đối không lưu secret hay dữ liệu nhạy cảm bệnh nhân trong bảng này.
/// </summary>
public class SepayWebhookTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// ID giao dịch duy nhất từ SePay (Unique Index chống xử lý trùng).
    /// </summary>
    public long SepayTransactionId { get; set; }

    public string? ReferenceCode { get; set; }
    public string? Gateway { get; set; }
    public string? TransactionDate { get; set; }
    public string? AccountNumber { get; set; }
    public string? SubAccount { get; set; }
    public string? TransferType { get; set; }
    public decimal TransferAmount { get; set; }
    public decimal? ExpectedAmount { get; set; }
    public decimal? DiscrepancyAmount { get; set; }
    public string? PaymentCode { get; set; }

    public Guid? BillingId { get; set; }
    public Billing? Billing { get; set; }

    /// <summary>
    /// Processed | Ignored_OutTransfer | Ignored_WrongAccount | Ignored_InvalidCode |
    /// Ignored_NotFound | Discrepancy_Underpaid | Discrepancy_Overpaid |
    /// Late_AfterPaid | Late_AfterCancelled
    /// </summary>
    public string ProcessingStatus { get; set; } = string.Empty;

    public string? Note { get; set; }
    public long WebhookTimestamp { get; set; }
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
}
