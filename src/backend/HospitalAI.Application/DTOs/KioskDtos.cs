using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HospitalAI.Application.DTOs;

public class KioskTerminalInfoDto
{
    public string TerminalId { get; set; } = string.Empty;
    public string TerminalName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ZoneType { get; set; } = "Reception"; // Reception | FollowUp | Paraclinical
}

public class KioskQrParseResultDto
{
    public string Format { get; set; } = "RAW"; // CCCD_CHIP | EXAM_PASS_JSON | MEDQR | URL | RAW
    public string LookupKey { get; set; } = string.Empty;
    public string? AppointmentId { get; set; }
    public string? PatientCode { get; set; }
    public string? IdentityCardNumber { get; set; }
    public string? FullName { get; set; }
    public string? DateOfBirth { get; set; } // yyyy-MM-dd
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? AppointmentType { get; set; }
    public string? PreviousRecordCode { get; set; }
}

public class KioskParseRequestDto
{
    public string RawCode { get; set; } = string.Empty;
}

public class KioskCheckInRequestDto
{
    [Required(ErrorMessage = "Vui lòng quét hoặc nhập mã tiếp nhận")]
    public string QrCodeOrCode { get; set; } = string.Empty;

    public string? TerminalId { get; set; }
}

public class KioskBillingSummaryDto
{
    public Guid BillingId { get; set; }
    public string BillingCode { get; set; } = string.Empty;
    public string BillingType { get; set; } = "Registration";
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Unpaid";
    public string PatientName { get; set; } = string.Empty;
    public string PatientCode { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string VietQrPayload { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class KioskPreviousExamSummaryDto
{
    public string ExaminationCode { get; set; } = string.Empty;
    public string ExaminationDate { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public string ICD10Code { get; set; } = string.Empty;
    public string ICD10Name { get; set; } = string.Empty;
    public string Assessment { get; set; } = string.Empty;
    public string? FollowUpAppointmentCode { get; set; }
}

public class KioskCheckInResponseDto
{
    public string Outcome { get; set; } = "SUCCESS"; // SUCCESS | ALREADY_CHECKED_IN | UNPAID_REQUIRED | NOT_FOUND | REJECTED
    public string Message { get; set; } = string.Empty;
    public string VisitType { get; set; } = "New";
    public QueueTicketDto? Ticket { get; set; }
    public KioskBillingSummaryDto? UnpaidBilling { get; set; }
    public KioskPreviousExamSummaryDto? PreviousExam { get; set; }
    public KioskQrParseResultDto? ParsedQr { get; set; }
    public string? TerminalId { get; set; }
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}

public class KioskWalkInRequestDto
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên bệnh nhân")]
    [StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số CCCD/Định danh cá nhân")]
    [StringLength(20)]
    public string IdentityCardNumber { get; set; } = string.Empty;

    [StringLength(20)]
    public string? PhoneNumber { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [StringLength(10)]
    public string Gender { get; set; } = "Nam";

    [StringLength(255)]
    public string? Address { get; set; }

    [StringLength(20)]
    public string? HealthInsuranceNumber { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn chuyên khoa khám")]
    public Guid DepartmentId { get; set; }

    public bool RequirePrepayment { get; set; } = false;
    public bool IsPregnant { get; set; } = false;
    public bool IsDisabled { get; set; } = false;
    public bool HasRevolutionaryMerit { get; set; } = false;
    public string? TerminalId { get; set; }
}

public class KioskClsReturnRequestDto
{
    [Required(ErrorMessage = "Vui lòng quét mã QR hoặc nhập mã bệnh nhân")]
    public string QrCodeOrCode { get; set; } = string.Empty;

    public string? TerminalId { get; set; }
}

public class KioskClsServiceItemDto
{
    public string ServiceName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ResultSummary { get; set; }
}

public class KioskClsReturnResponseDto
{
    public string Outcome { get; set; } = "SUCCESS"; // SUCCESS | PENDING_RESULTS | UNPAID_CLS | NOT_FOUND
    public string Message { get; set; } = string.Empty;
    public string? ExaminationCode { get; set; }
    public QueueTicketDto? Ticket { get; set; }
    public KioskBillingSummaryDto? UnpaidBilling { get; set; }
    public int CompletedCount { get; set; }
    public int PendingCount { get; set; }
    public List<KioskClsServiceItemDto> ServiceItems { get; set; } = new();
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}
