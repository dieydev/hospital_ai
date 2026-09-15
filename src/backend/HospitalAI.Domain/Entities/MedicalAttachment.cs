using System;

namespace HospitalAI.Domain.Entities;

public class MedicalAttachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ExaminationId { get; set; }
    public Examination? Examination { get; set; }

    public string FileFormat { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public DateTime UploadTime { get; set; } = DateTime.UtcNow;
}
