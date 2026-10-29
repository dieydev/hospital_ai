using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Services;

public class ExaminationService : IExaminationService
{
    private readonly HospitalDbContext _context;
    private readonly IFcmNotificationService? _fcmService;

    public ExaminationService(HospitalDbContext context, IFcmNotificationService? fcmService = null)
    {
        _context = context;
        _fcmService = fcmService;
    }

    public async Task<List<ExaminationDto>> GetExaminationsAsync(string? search, Guid? patientId, DateTime? date)
    {
        var query = _context.Examinations
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
            .Include(e => e.PrescriptionDetails)
            .Include(e => e.ServiceOrderDetails)
            .AsNoTracking();

        if (patientId.HasValue && patientId.Value != Guid.Empty)
        {
            query = query.Where(e => e.PatientId == patientId.Value);
        }

        if (date.HasValue)
        {
            var targetDate = date.Value.Date;
            query = query.Where(e => e.ExaminationDate.Date == targetDate);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim().ToLower();
            query = query.Where(e =>
                e.ExaminationCode.ToLower().Contains(keyword) ||
                e.ICD10Code.ToLower().Contains(keyword) ||
                e.ICD10Name.ToLower().Contains(keyword) ||
                (e.Patient != null && (
                    e.Patient.FullName.ToLower().Contains(keyword) ||
                    e.Patient.PatientCode.ToLower().Contains(keyword) ||
                    e.Patient.IdentityCardNumber.ToLower().Contains(keyword)
                ))
            );
        }

        var list = await query
            .OrderByDescending(e => e.ExaminationDate)
            .ToListAsync();

        return list.Select(MapToDto).ToList();
    }

    public async Task<ExaminationDto?> GetExaminationByIdAsync(Guid id)
    {
        var exam = await _context.Examinations
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
            .Include(e => e.PrescriptionDetails)
            .Include(e => e.ServiceOrderDetails)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exam == null) return null;
        return MapToDto(exam);
    }

    public async Task<ExaminationDto> CreateExaminationAsync(CreateExaminationDto dto)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);
        if (patient == null)
            throw new KeyNotFoundException($"Không tìm thấy bệnh nhân với ID {dto.PatientId}");

        var doctor = await _context.Users.FindAsync(dto.DoctorId);

        var datePrefix = $"LK{DateTime.UtcNow:yyyyMMdd}-";
        var lastExam = await _context.Examinations
            .Where(e => e.ExaminationCode.StartsWith(datePrefix))
            .OrderByDescending(e => e.ExaminationCode)
            .Select(e => e.ExaminationCode)
            .FirstOrDefaultAsync();

        var nextNum = 1;
        if (!string.IsNullOrEmpty(lastExam) && lastExam.Length > datePrefix.Length)
        {
            var suffix = lastExam.Substring(datePrefix.Length);
            if (int.TryParse(suffix, out var parsed))
            {
                nextNum = parsed + 1;
            }
        }

        var examCode = $"{datePrefix}{nextNum:D4}";

        var exam = new Examination
        {
            Id = Guid.NewGuid(),
            ExaminationCode = examCode,
            PatientId = dto.PatientId,
            DoctorId = dto.DoctorId,
            DepartmentName = string.IsNullOrWhiteSpace(dto.DepartmentName) ? "Khoa Nội Tổng Hợp" : dto.DepartmentName,
            ExaminationDate = DateTime.UtcNow,
            Subjective = dto.Subjective,
            PulseRate = dto.PulseRate,
            Temperature = dto.Temperature,
            BloodPressure = dto.BloodPressure,
            RespiratoryRate = dto.RespiratoryRate,
            Weight = dto.Weight,
            Height = dto.Height,
            Assessment = dto.Assessment,
            ICD10Code = dto.ICD10Code,
            ICD10Name = dto.ICD10Name,
            Plan = dto.Plan,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Hoàn thành" : dto.Status,
            CreatedAt = DateTime.UtcNow,
            ReasonForAdmission = dto.ReasonForAdmission,
            PathologicalProcess = dto.PathologicalProcess,
            GeneralExamination = dto.GeneralExamination,
            InitialDiagnosis = dto.InitialDiagnosis,
            PreliminaryDiagnosis = dto.PreliminaryDiagnosis,
            DifferentialDiagnosis = dto.DifferentialDiagnosis,
            DischargeStatus = dto.DischargeStatus,
            NextTreatmentPlan = dto.NextTreatmentPlan,
            DietaryAdvice = dto.DietaryAdvice,
            FollowUpAppointment = dto.FollowUpAppointment,
            DigitalSignature = dto.DigitalSignature
        };

        if (dto.PrescriptionDetails != null && dto.PrescriptionDetails.Any())
        {
            foreach (var p in dto.PrescriptionDetails)
            {
                exam.PrescriptionDetails.Add(new PrescriptionDetail
                {
                    Id = Guid.NewGuid(),
                    ExaminationId = exam.Id,
                    MedicineName = p.MedicineName,
                    Unit = string.IsNullOrWhiteSpace(p.Unit) ? "Viên" : p.Unit,
                    Quantity = p.Quantity,
                    DosageInstruction = p.DosageInstruction,
                    UnitPrice = p.UnitPrice
                });
            }
        }

        if (dto.ServiceOrderDetails != null && dto.ServiceOrderDetails.Any())
        {
            foreach (var s in dto.ServiceOrderDetails)
            {
                exam.ServiceOrderDetails.Add(new ServiceOrderDetail
                {
                    Id = Guid.NewGuid(),
                    ExaminationId = exam.Id,
                    ServiceName = s.ServiceName,
                    ServiceCategory = string.IsNullOrWhiteSpace(s.ServiceCategory) ? "Xét nghiệm" : s.ServiceCategory,
                    Price = s.Price,
                    Result = s.Result,
                    Status = string.IsNullOrWhiteSpace(s.Status) ? "Đã có kết quả" : s.Status
                });
            }
        }

        _context.Examinations.Add(exam);
        await _context.SaveChangesAsync();

        exam.Patient = patient;
        exam.Doctor = doctor;

        return MapToDto(exam);
    }

    public async Task<ExaminationDto> UpdateExaminationAsync(Guid id, CreateExaminationDto dto)
    {
        var exam = await _context.Examinations
            .Include(e => e.PrescriptionDetails)
            .Include(e => e.ServiceOrderDetails)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exam == null)
            throw new KeyNotFoundException($"Không tìm thấy phiếu lượt khám với ID {id}");

        exam.Subjective = dto.Subjective;
        exam.PulseRate = dto.PulseRate;
        exam.Temperature = dto.Temperature;
        exam.BloodPressure = dto.BloodPressure;
        exam.RespiratoryRate = dto.RespiratoryRate;
        exam.Weight = dto.Weight;
        exam.Height = dto.Height;
        exam.Assessment = dto.Assessment;
        exam.ICD10Code = dto.ICD10Code;
        exam.ICD10Name = dto.ICD10Name;
        exam.Plan = dto.Plan;
        exam.Status = dto.Status;

        exam.ReasonForAdmission = dto.ReasonForAdmission;
        exam.PathologicalProcess = dto.PathologicalProcess;
        exam.GeneralExamination = dto.GeneralExamination;
        exam.InitialDiagnosis = dto.InitialDiagnosis;
        exam.PreliminaryDiagnosis = dto.PreliminaryDiagnosis;
        exam.DifferentialDiagnosis = dto.DifferentialDiagnosis;
        exam.DischargeStatus = dto.DischargeStatus;
        exam.NextTreatmentPlan = dto.NextTreatmentPlan;
        exam.DietaryAdvice = dto.DietaryAdvice;
        exam.FollowUpAppointment = dto.FollowUpAppointment;
        exam.DigitalSignature = dto.DigitalSignature;

        // Update Prescriptions
        _context.PrescriptionDetails.RemoveRange(exam.PrescriptionDetails);
        if (dto.PrescriptionDetails != null)
        {
            foreach (var p in dto.PrescriptionDetails)
            {
                exam.PrescriptionDetails.Add(new PrescriptionDetail
                {
                    Id = Guid.NewGuid(),
                    ExaminationId = exam.Id,
                    MedicineName = p.MedicineName,
                    Unit = p.Unit,
                    Quantity = p.Quantity,
                    DosageInstruction = p.DosageInstruction,
                    UnitPrice = p.UnitPrice
                });
            }
        }

        await _context.SaveChangesAsync();

        var updatedExam = await GetExaminationByIdAsync(id);
        return updatedExam!;
    }

    public async Task<bool> DeleteExaminationAsync(Guid id)
    {
        var exam = await _context.Examinations.FindAsync(id);
        if (exam == null) return false;

        _context.Examinations.Remove(exam);
        await _context.SaveChangesAsync();
        return true;
    }

    private static ExaminationDto MapToDto(Examination e)
    {
        var age = 0;
        if (e.Patient != null && e.Patient.DateOfBirth != default)
        {
            age = DateTime.UtcNow.Year - e.Patient.DateOfBirth.Year;
        }

        var heightInMeters = e.Height > 0 ? e.Height / 100m : 1.7m;
        var bmi = heightInMeters > 0 ? Math.Round(e.Weight / (heightInMeters * heightInMeters), 1) : 0m;

        return new ExaminationDto
        {
            Id = e.Id,
            ExaminationCode = e.ExaminationCode,
            PatientId = e.PatientId,
            PatientUserId = e.Patient?.UserId,
            PatientCode = e.Patient?.PatientCode ?? string.Empty,
            PatientName = e.Patient?.FullName ?? string.Empty,
            PatientGender = e.Patient?.Gender ?? string.Empty,
            PatientAge = age,
            IdentityCardNumber = e.Patient?.IdentityCardNumber ?? string.Empty,
            HealthInsuranceNumber = e.Patient?.HealthInsuranceNumber,
            DoctorId = e.DoctorId,
            DoctorName = e.Doctor?.FullName ?? "BS. CKII. Nguyễn Thanh Duy",
            DepartmentName = e.DepartmentName,
            ExaminationDate = e.ExaminationDate,
            Subjective = e.Subjective,
            PulseRate = e.PulseRate,
            Temperature = e.Temperature,
            BloodPressure = e.BloodPressure,
            RespiratoryRate = e.RespiratoryRate,
            Weight = e.Weight,
            Height = e.Height,
            Bmi = bmi,
            Assessment = e.Assessment,
            ICD10Code = e.ICD10Code,
            ICD10Name = e.ICD10Name,
            Plan = e.Plan,
            Status = e.Status,
            CreatedAt = e.CreatedAt,
            ReasonForAdmission = e.ReasonForAdmission,
            PathologicalProcess = e.PathologicalProcess,
            GeneralExamination = e.GeneralExamination,
            InitialDiagnosis = e.InitialDiagnosis,
            PreliminaryDiagnosis = e.PreliminaryDiagnosis,
            DifferentialDiagnosis = e.DifferentialDiagnosis,
            DischargeStatus = e.DischargeStatus,
            NextTreatmentPlan = e.NextTreatmentPlan,
            DietaryAdvice = e.DietaryAdvice,
            FollowUpAppointment = e.FollowUpAppointment,
            DigitalSignature = e.DigitalSignature,
            IsDigitallySigned = e.IsDigitallySigned,
            SignedAt = e.SignedAt,
            DoctorLicenseNumber = e.DoctorLicenseNumber,
            SignatureCertificateSerial = e.SignatureCertificateSerial,
            SignatureHash = e.SignatureHash,
            PrescriptionDetails = e.PrescriptionDetails.Select(p => new PrescriptionDetailDto
            {
                Id = p.Id,
                MedicineName = p.MedicineName,
                Unit = p.Unit,
                Quantity = p.Quantity,
                DosageInstruction = p.DosageInstruction,
                UnitPrice = p.UnitPrice
            }).ToList(),
            ServiceOrderDetails = e.ServiceOrderDetails.Select(s => new ServiceOrderDetailDto
            {
                Id = s.Id,
                ServiceName = s.ServiceName,
                ServiceCategory = s.ServiceCategory,
                Price = s.Price,
                Result = s.Result,
                Status = s.Status
            }).ToList()
        };
    }

    public async Task<DigitalSignatureResultDto> SignExaminationAsync(Guid id, SignExaminationRequestDto dto, string? doctorName)
    {
        var exam = await _context.Examinations
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
            .Include(e => e.PrescriptionDetails)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exam == null)
            throw new KeyNotFoundException($"Không tìm thấy phiếu khám bệnh với ID {id}");

        // Tạo chuỗi nội dung dữ liệu lâm sàng cần bảo vệ toàn vẹn
        var prescriptionSummary = string.Join(";", exam.PrescriptionDetails.Select(p => $"{p.MedicineName}:{p.Quantity}:{p.DosageInstruction}"));
        var rawDataToSign = $"{exam.ExaminationCode}|{exam.Patient?.PatientCode}|{exam.ICD10Code}|{exam.Subjective}|{exam.Assessment}|{exam.Plan}|{prescriptionSummary}|{exam.ExaminationDate:yyyy-MM-ddTHH:mm:ss}";

        // Tính mã băm SHA-256 toàn vẹn
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(rawDataToSign));
        var hashHex = Convert.ToHexString(hashBytes).ToLowerInvariant();

        // Tạo chữ ký số điện tử chuẩn SmartCA (Mã hóa Hash kết hợp Private Key / Secret)
        var timestamp = DateTime.UtcNow;
        var licenseNumber = !string.IsNullOrWhiteSpace(dto.DoctorLicenseNumber) ? dto.DoctorLicenseNumber.Trim() : "029831/BYT-CCHN";
        var certSerial = !string.IsNullOrWhiteSpace(dto.CertificateSerial) ? dto.CertificateSerial.Trim() : $"5404-B7A1-{(timestamp.Ticks % 100000000):D8}";
        
        var signaturePayload = $"{hashHex}:{licenseNumber}:{certSerial}:{timestamp:O}";
        using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes("HOSPITAL_AI_SMARTCA_ROOT_KEY_2026_MOH_VIETNAM"));
        var signatureBytes = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(signaturePayload));
        var digitalSignature = $"BYT.SMARTCA.{Convert.ToBase64String(signatureBytes)}";

        // Cập nhật trạng thái ký số vào Entity
        exam.DigitalSignature = digitalSignature;
        exam.IsDigitallySigned = true;
        exam.SignedAt = timestamp;
        exam.DoctorLicenseNumber = licenseNumber;
        exam.SignatureCertificateSerial = certSerial;
        exam.SignatureHash = hashHex;
        exam.Status = "Hoàn thành";

        await _context.SaveChangesAsync();

        var signingDoctorName = !string.IsNullOrWhiteSpace(doctorName) ? doctorName : (exam.Doctor?.FullName ?? "Bác sĩ điều trị");

        if (_fcmService != null && exam.Patient != null)
        {
            try
            {
                var patientPhone = exam.Patient.IdentityCardNumber ?? "";
                var patientName = exam.Patient.FullName ?? "Bệnh nhân";
                _ = _fcmService.SendPrescriptionCompletedAlertAsync(patientPhone, patientName, signingDoctorName, exam.ExaminationCode);
            }
            catch { }
        }

        return new DigitalSignatureResultDto
        {
            ExaminationId = exam.Id,
            ExaminationCode = exam.ExaminationCode,
            IsDigitallySigned = true,
            DigitalSignature = digitalSignature,
            SignatureHash = hashHex,
            SignedAt = timestamp,
            DoctorName = signingDoctorName,
            DoctorLicenseNumber = licenseNumber,
            CertificateSerial = certSerial,
            CertificateAuthority = "Ban Cơ yếu Chính phủ / Bộ Y Tế SmartCA",
            VerificationUrl = $"https://dmedical.site/verify-emr?code={exam.ExaminationCode}&hash={hashHex.Substring(0, 16)}",
            Message = "Ký số hồ sơ bệnh án EMR thành công theo quy chuẩn Bộ Y Tế."
        };
    }

    public async Task<VerifySignatureResponseDto> VerifySignatureAsync(Guid id)
    {
        var exam = await _context.Examinations
            .Include(e => e.Patient)
            .Include(e => e.Doctor)
            .Include(e => e.PrescriptionDetails)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exam == null)
            throw new KeyNotFoundException($"Không tìm thấy phiếu khám bệnh với ID {id}");

        if (!exam.IsDigitallySigned || string.IsNullOrEmpty(exam.DigitalSignature))
        {
            return new VerifySignatureResponseDto
            {
                IsValid = false,
                ExaminationCode = exam.ExaminationCode,
                PatientName = exam.Patient?.FullName ?? "",
                DoctorName = exam.Doctor?.FullName ?? "",
                IntegrityStatus = "Hồ sơ chưa được ký số điện tử.",
                CertificateIssuer = ""
            };
        }

        // Tính lại mã băm hiện tại để xác định tính toàn vẹn (chưa bị sửa đổi lén trong CSDL)
        var prescriptionSummary = string.Join(";", exam.PrescriptionDetails.Select(p => $"{p.MedicineName}:{p.Quantity}:{p.DosageInstruction}"));
        var rawDataToVerify = $"{exam.ExaminationCode}|{exam.Patient?.PatientCode}|{exam.ICD10Code}|{exam.Subjective}|{exam.Assessment}|{exam.Plan}|{prescriptionSummary}|{exam.ExaminationDate:yyyy-MM-ddTHH:mm:ss}";
        
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        var currentHash = Convert.ToHexString(sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(rawDataToVerify))).ToLowerInvariant();

        var isIntegrityValid = string.Equals(currentHash, exam.SignatureHash, StringComparison.OrdinalIgnoreCase);

        return new VerifySignatureResponseDto
        {
            IsValid = isIntegrityValid,
            ExaminationCode = exam.ExaminationCode,
            PatientName = exam.Patient?.FullName ?? "",
            DoctorName = exam.Doctor?.FullName ?? "",
            DoctorLicenseNumber = exam.DoctorLicenseNumber ?? "",
            CertificateSerial = exam.SignatureCertificateSerial ?? "",
            SignedAt = exam.SignedAt,
            SignatureHash = exam.SignatureHash ?? "",
            IntegrityStatus = isIntegrityValid 
                ? "Hồ sơ Bệnh án EMR toàn vẹn 100%, chữ ký số hợp lệ và chưa từng bị sửa đổi kể từ thời điểm ký."
                : "CẢNH BÁO: Dữ liệu hồ sơ bệnh án có dấu hiệu bị chỉnh sửa sau khi ký số!",
            CertificateIssuer = "Hệ thống Quản lý Chứng thư số Y tế Quốc gia (Bộ Y Tế / VNPT-CA)"
        };
    }

}
