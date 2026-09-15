using System;

namespace HospitalAI.Domain.Entities;

public class Diagnosis
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ExaminationId { get; set; }
    public Examination? Examination { get; set; }

    public string ICD10Code { get; set; } = string.Empty;
    public string ICD10Name { get; set; } = string.Empty;
    public bool IsPrimary { get; set; } = true;
    public string? Notes { get; set; }
}
