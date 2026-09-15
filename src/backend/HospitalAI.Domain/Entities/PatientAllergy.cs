using System;

namespace HospitalAI.Domain.Entities;

public class PatientAllergy
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PatientId { get; set; }
    public Patient? Patient { get; set; }

    public string AllergyType { get; set; } = string.Empty;
    public string Allergen { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
}
