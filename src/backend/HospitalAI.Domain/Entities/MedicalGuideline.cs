using System;

namespace HospitalAI.Domain.Entities;

public class MedicalGuideline
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
