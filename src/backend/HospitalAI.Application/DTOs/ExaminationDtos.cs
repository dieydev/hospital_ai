using System;
using System.Collections.Generic;

namespace HospitalAI.Application.DTOs;

public class ExaminationDto
{
    public Guid Id { get; set; }
    public string ExaminationCode { get; set; } = string.Empty; // LK2026xxxx
    public Guid PatientId { get; set; }
    public string PatientCode { get; set; } = string.Empty;
    public string PatientName { get; set; } = string.Empty;
    public string PatientGender { get; set; } = string.Empty;
    public int PatientAge { get; set; }
    public string IdentityCardNumber { get; set; } = string.Empty;
    public string? HealthInsuranceNumber { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string DepartmentName { get; set; } = string.Empty;
    public DateTime ExaminationDate { get; set; }

    // SOAP
    public string Subjective { get; set; } = string.Empty; // S (Triệu chứng)
    
    // Vitals (O)
    public int PulseRate { get; set; } // Mạch (lần/phút)
    public decimal Temperature { get; set; } // Nhiệt độ °C
    public string BloodPressure { get; set; } = string.Empty; // Huyết áp (e.g. 120/80)
    public int RespiratoryRate { get; set; } // Nhịp thở
    public decimal Weight { get; set; } // kg
    public decimal Height { get; set; } // cm
    public decimal Bmi { get; set; } // BMI tự tính

    public string Assessment { get; set; } = string.Empty; // A (Đánh giá chẩn đoán)
    public string ICD10Code { get; set; } = string.Empty; // e.g. J02.9
    public string ICD10Name { get; set; } = string.Empty; // Tên bệnh chuẩn ICD-10

    public string Plan { get; set; } = string.Empty; // P (Kế hoạch xử trí)
    public string Status { get; set; } = "Hoàn thành"; // Đang khám, Chờ CLS, Hoàn thành
    public DateTime CreatedAt { get; set; }

    public List<PrescriptionDetailDto> PrescriptionDetails { get; set; } = new();
    public List<ServiceOrderDetailDto> ServiceOrderDetails { get; set; } = new();
}

public class CreateExaminationDto
{
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string DepartmentName { get; set; } = "Khoa Nội Tổng Hợp";
    public string Subjective { get; set; } = string.Empty;
    
    // Vitals
    public int PulseRate { get; set; } = 75;
    public decimal Temperature { get; set; } = 37.0m;
    public string BloodPressure { get; set; } = "120/80";
    public int RespiratoryRate { get; set; } = 18;
    public decimal Weight { get; set; } = 65.0m;
    public decimal Height { get; set; } = 168.0m;

    public string Assessment { get; set; } = string.Empty;
    public string ICD10Code { get; set; } = "J02.9";
    public string ICD10Name { get; set; } = "Viêm họng cấp tính";
    public string Plan { get; set; } = string.Empty;
    public string Status { get; set; } = "Hoàn thành";

    public List<PrescriptionDetailDto> PrescriptionDetails { get; set; } = new();
    public List<ServiceOrderDetailDto> ServiceOrderDetails { get; set; } = new();
}

public class PrescriptionDetailDto
{
    public Guid? Id { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Unit { get; set; } = "Viên";
    public int Quantity { get; set; }
    public string DosageInstruction { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
}

public class ServiceOrderDetailDto
{
    public Guid? Id { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string ServiceCategory { get; set; } = "Xét nghiệm";
    public decimal Price { get; set; }
    public string? Result { get; set; }
    public string Status { get; set; } = "Đã có kết quả";
}
