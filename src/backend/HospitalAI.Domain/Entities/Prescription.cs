using System;
using System.Collections.Generic;

namespace HospitalAI.Domain.Entities;

public class Prescription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ExaminationId { get; set; }
    public Examination? Examination { get; set; }

    public Guid DoctorId { get; set; }
    public StaffProfile? Doctor { get; set; }

    public DateTime PrescribedTime { get; set; } = DateTime.UtcNow;
    public string? DigitalSignature { get; set; }
    public string? DoctorAdvice { get; set; }
    
    public ICollection<PrescriptionDetail> Details { get; set; } = new List<PrescriptionDetail>();
}
