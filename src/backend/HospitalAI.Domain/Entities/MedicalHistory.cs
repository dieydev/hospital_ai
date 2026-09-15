using System;

namespace HospitalAI.Domain.Entities;

public class MedicalHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PatientId { get; set; }
    public Patient? Patient { get; set; }

    public string DiseaseName { get; set; } = string.Empty;
    public DateTime? OnsetDate { get; set; }
    public string? Notes { get; set; }
}
