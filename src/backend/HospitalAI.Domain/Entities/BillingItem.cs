using System;

namespace HospitalAI.Domain.Entities;

public class BillingItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid BillingId { get; set; }
    public Billing? Billing { get; set; }

    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal TotalPrice { get; set; }
    
    public Guid? ReferenceId { get; set; } // Tham chiếu đến ID ChiDinh, DonThuoc...
}
