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

    public ExaminationService(HospitalDbContext context)
    {
        _context = context;
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

        var countToday = await _context.Examinations
            .Where(e => e.ExaminationDate.Date == DateTime.UtcNow.Date)
            .CountAsync();

        var examCode = $"LK{DateTime.UtcNow:yyyyMMdd}-{(countToday + 1):D4}";

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
            CreatedAt = DateTime.UtcNow
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
}
