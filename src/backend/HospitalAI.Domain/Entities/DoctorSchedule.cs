using System;

namespace HospitalAI.Domain.Entities;

public class DoctorSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid StaffId { get; set; }
    public StaffProfile? Staff { get; set; }

    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }

    public DateTime WorkDate { get; set; }
    public string TimeSlot { get; set; } = string.Empty;
    public int MaxPatients { get; set; } = 20;
}
