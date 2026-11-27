using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace HospitalAI.Application.DTOs;

public class SepayWebhookPayloadDto
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    [JsonPropertyName("gateway")]
    public string? Gateway { get; set; }

    [JsonPropertyName("transactionDate")]
    public string? TransactionDate { get; set; }

    [JsonPropertyName("accountNumber")]
    public string? AccountNumber { get; set; }

    [JsonPropertyName("subAccount")]
    public string? SubAccount { get; set; }

    [JsonPropertyName("code")]
    public string? Code { get; set; }

    [JsonPropertyName("content")]
    public string? Content { get; set; }

    [JsonPropertyName("transferType")]
    public string? TransferType { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("transferAmount")]
    public decimal TransferAmount { get; set; }

    [JsonPropertyName("accumulated")]
    public decimal? Accumulated { get; set; }

    [JsonPropertyName("referenceCode")]
    public string? ReferenceCode { get; set; }
}

public class PaymentQrPublicConfigDto
{
    public string Environment { get; set; } = "Sandbox";
    public bool IsSandbox { get; set; } = true;
    public string BankCode { get; set; } = string.Empty;
    public string BankBin { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
    public string PaymentPrefix { get; set; } = "HAI";
    public bool IsConfigured { get; set; }
}

public class BillingStatusSummaryDto
{
    public Guid BillingId { get; set; }
    public string PaymentCode { get; set; } = string.Empty;
    public string BillingType { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Unpaid";
    public string TrangThai { get; set; } = "Chưa thanh toán";
    public string? PaymentMethod { get; set; }
    public string? TransactionRef { get; set; }
    public string? DiscrepancyNote { get; set; }
    public DateTime? PaidAt { get; set; }
    public Guid? AppointmentId { get; set; }
    public string? VietQrUrl { get; set; }
    public string Environment { get; set; } = "Sandbox";
    public bool IsSandbox { get; set; } = true;
    public List<SepayDiscrepancyLogDto> RecentWebhookEvents { get; set; } = new();
}

public class SepayDiscrepancyLogDto
{
    public long SepayTransactionId { get; set; }
    public decimal TransferAmount { get; set; }
    public decimal? ExpectedAmount { get; set; }
    public decimal? DiscrepancyAmount { get; set; }
    public string ProcessingStatus { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime ReceivedAt { get; set; }
}
