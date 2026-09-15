using System;

namespace HospitalAI.Domain.Entities;

public class AILog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ExaminationId { get; set; }
    public Examination? Examination { get; set; }

    public string AIType { get; set; } = string.Empty;
    public string InputData { get; set; } = string.Empty;
    public string OutputResult { get; set; } = string.Empty;
    public string DoctorFeedback { get; set; } = "Accepted";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
