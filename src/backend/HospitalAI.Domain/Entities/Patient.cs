using System;
using System.Collections.Generic;

namespace HospitalAI.Domain.Entities;

public class Patient
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string PatientCode { get; set; } = string.Empty; // BN2026xxxx
    public string FullName { get; set; } = string.Empty;
    public string Gender { get; set; } = "Nam"; // Nam, Nữ, Khác
    public DateTime DateOfBirth { get; set; }
    public string IdentityCardNumber { get; set; } = string.Empty; // CCCD
    public string? HealthInsuranceNumber { get; set; } // Mã BHYT
    public string Address { get; set; } = string.Empty;
    public string? EmergencyContactName { get; set; } // Người thân liên hệ khẩn cấp
    public string? EmergencyContactPhone { get; set; } // SĐT người thân
    public string? EmergencyContactRelation { get; set; } // Mối quan hệ (Vợ, Chồng, Cha, Mẹ, Con...)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public ICollection<Examination> Examinations { get; set; } = new List<Examination>();
}
