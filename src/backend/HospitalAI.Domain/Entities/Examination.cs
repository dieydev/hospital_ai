using System;
using System.Collections.Generic;

namespace HospitalAI.Domain.Entities;

public class Examination
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ExaminationCode { get; set; } = string.Empty; // LK2026xxxx
    
    public Guid PatientId { get; set; }
    public Patient? Patient { get; set; }

    public Guid DoctorId { get; set; }
    public User? Doctor { get; set; }

    public string DepartmentName { get; set; } = string.Empty;
    public DateTime ExaminationDate { get; set; } = DateTime.UtcNow;

    // SOAP Model
    public string Subjective { get; set; } = string.Empty; // Triệu chứng
    
    // Vital Signs (Objective)
    public int PulseRate { get; set; } // Mạch (l/p)
    public decimal Temperature { get; set; } // Nhiệt độ °C
    public string BloodPressure { get; set; } = string.Empty; // 120/80
    public int RespiratoryRate { get; set; } // Nhịp thở
    public decimal Weight { get; set; } // kg
    public decimal Height { get; set; } // cm

    public string Assessment { get; set; } = string.Empty; // Đánh giá chẩn đoán
    public string ICD10Code { get; set; } = string.Empty; // Mã ICD-10 e.g. J02.9
    public string ICD10Name { get; set; } = string.Empty; // Tên bệnh theo ICD-10

    public string Plan { get; set; } = string.Empty; // Kế hoạch điều trị

    public string Status { get; set; } = "Hoàn thành"; // Đang khám, Chờ CLS, Hoàn thành
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Các trường EMR mở rộng chuẩn Bộ Y tế
    public string? ReasonForAdmission { get; set; } // LyDoVaoVien
    public string? PathologicalProcess { get; set; } // QuaTrinhBenhLy
    public string? GeneralExamination { get; set; } // KhamToanThan
    public string? InitialDiagnosis { get; set; } // ChanDoanVaoVien
    public string? PreliminaryDiagnosis { get; set; } // ChanDoanSoBo
    public string? DifferentialDiagnosis { get; set; } // ChanDoanPhanBiet
    public string? DischargeStatus { get; set; } // TinhTrangRaVien
    public string? NextTreatmentPlan { get; set; } // HuongDieuTri
    public string? DietaryAdvice { get; set; } // CheDoDinhDuong
    public string? FollowUpAppointment { get; set; } // LichTaiKham
    public string? DigitalSignature { get; set; } // ChuKySo

    public ICollection<PrescriptionDetail> PrescriptionDetails { get; set; } = new List<PrescriptionDetail>();
    public ICollection<ServiceOrderDetail> ServiceOrderDetails { get; set; } = new List<ServiceOrderDetail>();
}

public class PrescriptionDetail
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ExaminationId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Unit { get; set; } = "Viên";
    public int Quantity { get; set; }
    public string DosageInstruction { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
}

public class ServiceOrderDetail
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ExaminationId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string ServiceCategory { get; set; } = "Xét nghiệm";
    public decimal Price { get; set; }
    public string? Result { get; set; }
    public string Status { get; set; } = "Đã có kết quả";
}
