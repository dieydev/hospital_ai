using System;

namespace HospitalAI.Domain.Entities;

public class StaffProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool IsAvailable { get; set; } = true;
}
