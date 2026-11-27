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

    public Guid? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }

    public string BillingType { get; set; } = string.Empty; // Registration, ServiceOrder, Prescription
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Unpaid"; // Unpaid, Paid, Cancelled

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaidAt { get; set; }

    public string? PaymentCode { get; set; } // Mã thanh toán chuẩn duy nhất (VD: HAI1A2B3C4D)
    public string? PaymentMethod { get; set; } // VNPay, Cash, Transfer, SePay
    public string? TransactionRef { get; set; } // VNPay / SePay / Manual transaction reference
    public string? DiscrepancyNote { get; set; } // Ghi chú đối soát sai lệch số tiền hoặc webhook đến muộn

    public Guid? CashierId { get; set; }
    public StaffProfile? Cashier { get; set; }

    public ICollection<BillingItem> Items { get; set; } = new List<BillingItem>();
}
