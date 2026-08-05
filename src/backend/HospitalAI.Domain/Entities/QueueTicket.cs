using System;

namespace HospitalAI.Domain.Entities;

public class QueueTicket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PatientId { get; set; }
    public Patient? Patient { get; set; }
    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }
    public Guid? AppointmentId { get; set; }
    public int SequenceNumber { get; set; } // SoThuTu (#101, #102...)
    public string Status { get; set; } = "Waiting"; // Waiting, Calling, Processing, Skipped, Finished
    public string Priority { get; set; } = "Normal"; // Normal, Priority, Emergency
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
