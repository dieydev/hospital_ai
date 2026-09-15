using System;
using System.Collections.Generic;

namespace HospitalAI.Domain.Entities;

public class ServiceOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ExaminationId { get; set; }
    public Examination? Examination { get; set; }

    public Guid DoctorId { get; set; }
    public StaffProfile? Doctor { get; set; }

    public string ServiceCode { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public string Status { get; set; } = "Ordered";
    
    public DateTime OrderTime { get; set; } = DateTime.UtcNow;

    public ICollection<ServiceResult> Results { get; set; } = new List<ServiceResult>();
}
