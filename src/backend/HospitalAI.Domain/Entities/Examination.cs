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
    public string? FollowUpAppointmentCode { get; set; } // MaGiayHenTaiKham (e.g. HEN-xxxx-xxxx)
    public string? PreviousRecordCode { get; set; } // MaBenhAnCu / MaGiayHenLienKet
    public string? TreatmentResponse { get; set; } // MucDoDapUngDieuTri (good, partial, poor, adverse)
    public string? SymptomProgress { get; set; } // DienTienLamSang & DanhGiaCuaBacSi
    public string? DigitalSignature { get; set; } // ChuKySo
    public bool? IsDigitallySigned { get; set; } = false;
    public DateTime? SignedAt { get; set; }
    public string? DoctorLicenseNumber { get; set; } // So CCHN Bac si
    public string? SignatureCertificateSerial { get; set; } // Serial Chung thu so
    public string? SignatureHash { get; set; } // Ma bam toan ven SHA-256

    // Chuẩn chẩn đoán mã bệnh ICD-10 (Thông tư 06/2026/TT-BYT)
    public string? ICD10ChapterCode { get; set; } // Mã chương bệnh (vd: IX, XI, X)
    public string? ICD10ChapterName { get; set; } // Tên chương bệnh
    public string? SecondaryDiagnosesJson { get; set; } // Danh sách mã ICD-10 bệnh kèm theo / biến chứng (JSON)
    public string? DiseaseStage { get; set; } // Giai đoạn bệnh: Cấp tính, Mạn tính, Đợt cấp...
    public string? DiagnosisType { get; set; } // Loại chẩn đoán: Ban đầu, Xác định, Phân biệt, Ra viện
    public bool? IsEpidemicAlert { get; set; } = false; // Cảnh báo dịch tễ

    // Chuẩn liên thông Đơn thuốc điện tử quốc gia (Thông tư 26/2025/TT-BYT & Donthuocquocgia.vn)
    public string? NationalPrescriptionCode { get; set; } // Mã đơn thuốc điện tử quốc gia: 74001_YYYYMMDD_STT
    public string? FacilityCode { get; set; } = "74001"; // Mã CSKCB Bộ Y Tế
    public string? FacilityName { get; set; } = "Bệnh viện Đa khoa Thủ Dầu Một - Hospital AI";
    public string? NationalSyncStatus { get; set; } = "NotSynced"; // NotSynced, Pending, Synced, Failed
    public string? NationalTransactionId { get; set; } // Mã giao dịch ERX
    public DateTime? NationalSyncTimestamp { get; set; }
    public string? NationalSyncMessage { get; set; }
    public string? NationalLookupQR { get; set; }

    // Chứng chỉ & Phạm vi hành nghề Bác sĩ (Thông tư 32/2023/TT-BYT)
    public string? DoctorScopeOfPractice { get; set; } // Phạm vi hành nghề bác sĩ theo TT 32/2023
    public string? DoctorDegreeLevel { get; set; } // Học hàm học vị
    public string? DoctorIssuer { get; set; } // Nơi cấp CCHN
    public bool? IsPracticeScopeCompliant { get; set; } = true;

    // Quản lý cấp phát thuốc Nhà thuốc (Dược sĩ / Pharmacy)
    public string? PrescriptionDispenseStatus { get; set; } = "Chờ cấp phát"; // "Chờ cấp phát", "Đã cấp phát", "Đã hủy"
    public DateTime? PrescriptionDispensedAt { get; set; }
    public string? PrescriptionDispensedBy { get; set; }

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

    // Trường chuẩn liên thông Cổng Đơn thuốc điện tử quốc gia (Thông tư 26/2025/TT-BYT)
    public string? NationalDrugCode { get; set; } // Mã thuốc quốc gia QĐ 7603 / TT 26/2025
    public string? BrandName { get; set; } // Tên biệt dược
    public string? ActiveIngredient { get; set; } // Tên hoạt chất
    public string? Concentration { get; set; } // Hàm lượng
    public string? DosageForm { get; set; } // Dạng bào chế
    public string? AdministrationRoute { get; set; } // Đường dùng
    public int? DurationDays { get; set; } = 7; // Số ngày dùng thuốc
    public string? MorningDose { get; set; } // Liều sáng
    public string? NoonDose { get; set; } // Liều trưa
    public string? AfternoonDose { get; set; } // Liều chiều
    public string? EveningDose { get; set; } // Liều tối
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
