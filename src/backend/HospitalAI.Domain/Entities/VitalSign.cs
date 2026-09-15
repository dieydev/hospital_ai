using System;

namespace HospitalAI.Domain.Entities;

public class VitalSign
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ExaminationId { get; set; }
    public Examination? Examination { get; set; }

    public int? PulseRate { get; set; }
    public decimal? Temperature { get; set; }
    public int? SystolicBloodPressure { get; set; }
    public int? DiastolicBloodPressure { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
    
    public DateTime MeasurementTime { get; set; } = DateTime.UtcNow;
}
