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
    public string? PriorityReason { get; set; } // Căn cứ ưu tiên theo Điều 3 Luật KBCB 15/2023/QH15 hoặc đánh giá sàng lọc
    public string? EmergencyConfirmedBy { get; set; }
    public DateTime? EmergencyConfirmedAt { get; set; }
    public string? EmergencyReason { get; set; }
    public Guid? AppointmentId { get; set; }
    public string? VisitType { get; set; } // "New" / "FollowUp"
    public string PaymentStatus { get; set; } = "Paid"; // "Paid", "Unpaid", "InsuranceWaived"
    public string QueueType { get; set; } = "Exam"; // "Exam", "ParaclinicalResult"
    public Guid? UnpaidBillingId { get; set; }
    public decimal UnpaidAmount { get; set; }
    public string? PreviousRecordCode { get; set; }
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

    public string? PriorityReason { get; set; }

    // Phân loại đối tượng ưu tiên theo Khoản 2 Điều 3 Luật Khám bệnh, chữa bệnh số 15/2023/QH15
    public bool? IsPregnant { get; set; }              // Phụ nữ có thai
    public bool? IsDisabled { get; set; }              // Người khuyết tật đặc biệt nặng, người khuyết tật nặng
    public bool? HasRevolutionaryMerit { get; set; }   // Người có công với cách mạng

    // Xác nhận khẩn cấp từ nhân sự y tế chuyên môn (Nhân viên sàng lọc y tế hoặc Bác sĩ lâm sàng)
    public bool? IsEmergencyConfirmed { get; set; }
    public string? EmergencyConfirmedBy { get; set; }
    public DateTime? EmergencyConfirmedAt { get; set; }
    public string? EmergencyReason { get; set; }

    public Guid? AppointmentId { get; set; }

    [StringLength(100)]
    public string? IdempotencyKey { get; set; }

    [StringLength(50)]
    public string? VisitType { get; set; } = "New";

    [StringLength(50)]
    public string? QueueType { get; set; } = "Exam";

    [StringLength(50)]
    public string? PreviousRecordCode { get; set; }
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
