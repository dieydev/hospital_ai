using System;
using System.Collections.Generic;

namespace HospitalAI.Domain.Entities;

public class Billing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PatientId { get; set; }
    public Patient? Patient { get; set; }

    public Guid? ExaminationId { get; set; }
    public Examination? Examination { get; set; }

    public string BillingType { get; set; } = string.Empty; // Registration, ServiceOrder, Prescription
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Unpaid"; // Unpaid, Paid, Cancelled

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }
    
    public string? PaymentMethod { get; set; } // VNPay, Cash, Transfer
    public string? TransactionRef { get; set; } // VNPay transaction no
    
    public Guid? CashierId { get; set; }
    public StaffProfile? Cashier { get; set; }

    public ICollection<BillingItem> Items { get; set; } = new List<BillingItem>();
}
