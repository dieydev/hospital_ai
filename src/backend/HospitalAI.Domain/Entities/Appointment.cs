using System;

namespace HospitalAI.Domain.Entities;

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PatientId { get; set; }
    public Patient? Patient { get; set; }

    public Guid ScheduleId { get; set; }
    public DoctorSchedule? Schedule { get; set; }

    public DateTime AppointmentDate { get; set; }
    public string? Symptoms { get; set; }
    public string Status { get; set; } = "Pending";
}
