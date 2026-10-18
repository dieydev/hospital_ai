using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HospitalAI.Application.DTOs;

public class QueueTicketDto
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public string PatientCode { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientGender { get; set; } = string.Empty;
    public int PatientAge { get; set; }
    public string IdentityCardNumber { get; set; } = string.Empty;
    public string? HealthInsuranceNumber { get; set; }
    public Guid DepartmentId { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int SequenceNumber { get; set; }
    public string Status { get; set; } = "Waiting"; // Waiting, Calling, Processing, Skipped, Finished
    public string Priority { get; set; } = "Normal"; // Normal, Priority, Emergency
    public DateTime CreatedAt { get; set; }
}

public class IssueQueueTicketDto
{
    [Required(ErrorMessage = "Mã bệnh nhân không được để trống")]
    public Guid PatientId { get; set; }

    [Required(ErrorMessage = "Khoa khám bệnh không được để trống")]
    public Guid DepartmentId { get; set; }

    [StringLength(50)]
    public string Priority { get; set; } = "Normal";
}

public class UpdateQueueStatusDto
{
    [Required(ErrorMessage = "Trạng thái không được để trống")]
    [StringLength(50)]
    public string Status { get; set; } = "Waiting";
}

public class DepartmentDto
{
    public Guid Id { get; set; }
    public string DepartmentName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string RoomType { get; set; } = "Clinical";
}
