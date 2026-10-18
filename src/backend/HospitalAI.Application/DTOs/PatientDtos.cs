using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HospitalAI.Application.DTOs;

public class PatientDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string PatientCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Gender { get; set; } = "Nam";
    public DateTime DateOfBirth { get; set; }
    public int Age => DateTime.Today.Year - DateOfBirth.Year - (DateTime.Today < DateOfBirth.AddYears(DateTime.Today.Year - DateOfBirth.Year) ? 1 : 0);
    public string IdentityCardNumber { get; set; } = string.Empty;
    public string? HealthInsuranceNumber { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Profession { get; set; }
    public string? MedicalHistory { get; set; }
    public string? DrugAllergies { get; set; }
    public string? BloodType { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactAddress { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreatePatientDto
{
    [Required(ErrorMessage = "Họ và tên bệnh nhân không được để trống")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "Họ và tên từ 2 đến 150 ký tự")]
    public string FullName { get; set; } = string.Empty;

    public string Gender { get; set; } = "Nam";

    [Required(ErrorMessage = "Ngày sinh không được để trống")]
    public DateTime DateOfBirth { get; set; }

    [Required(ErrorMessage = "Số CCCD/CMND không được để trống")]
    [RegularExpression(@"^\d{9,12}$", ErrorMessage = "Số CCCD/CMND phải là dãy 9-12 chữ số")]
    public string IdentityCardNumber { get; set; } = string.Empty;

    public string? HealthInsuranceNumber { get; set; }

    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [RegularExpression(@"^0\d{9,10}$", ErrorMessage = "Số điện thoại không hợp lệ")]
    public string PhoneNumber { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
    public string? Email { get; set; }

    [Required(ErrorMessage = "Địa chỉ liên hệ không được để trống")]
    [StringLength(250, ErrorMessage = "Địa chỉ tối đa 250 ký tự")]
    public string Address { get; set; } = string.Empty;
    public string? Profession { get; set; }
    public string? MedicalHistory { get; set; }
    public string? DrugAllergies { get; set; }
    public string? BloodType { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? EmergencyContactAddress { get; set; }
}

public class UpdatePatientDto : CreatePatientDto
{
}

public class PatientListResultDto
{
    public List<PatientDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
}
