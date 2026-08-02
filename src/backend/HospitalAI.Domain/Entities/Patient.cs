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
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? MedicalHistory { get; set; } // Tiền sử bệnh
    public string? DrugAllergies { get; set; } // Tiền sử dị ứng
    public string? BloodType { get; set; } // O+, A+, B+, AB+
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Examination> Examinations { get; set; } = new List<Examination>();
}
