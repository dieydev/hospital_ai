using System;

namespace HospitalAI.Domain.Entities;

public class ServiceResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ServiceOrderId { get; set; }
    public ServiceOrder? ServiceOrder { get; set; }

    public Guid TechnicianId { get; set; }
    public StaffProfile? Technician { get; set; }

    public string? MetricName { get; set; }
    public string? MeasuredValue { get; set; }
    public string? ReferenceRange { get; set; }
    public bool IsAbnormal { get; set; } = false;
    public string? ImageConclusion { get; set; }
    
    public DateTime ApprovalTime { get; set; } = DateTime.UtcNow;
}
