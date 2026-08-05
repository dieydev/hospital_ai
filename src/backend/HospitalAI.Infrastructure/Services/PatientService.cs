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

public class PatientService : IPatientService
{
    private readonly HospitalDbContext _context;

    public PatientService(HospitalDbContext context)
    {
        _context = context;
    }

    public async Task<PatientListResultDto> GetPatientsAsync(string? search, int pageIndex = 1, int pageSize = 20)
    {
        var query = _context.Patients.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            search = search.Trim().ToLower();
            query = query.Where(p =>
                p.FullName.ToLower().Contains(search) ||
                p.PatientCode.ToLower().Contains(search) ||
                p.IdentityCardNumber.Contains(search) ||
                p.PhoneNumber.Contains(search) ||
                (p.HealthInsuranceNumber != null && p.HealthInsuranceNumber.ToLower().Contains(search))
            );
        }

        var totalCount = await query.CountAsync();

        var patients = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .Select(p => MapToDto(p))
            .ToListAsync();

        return new PatientListResultDto
        {
            Items = patients,
            TotalCount = totalCount,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }

    public async Task<PatientDto?> GetPatientByIdAsync(Guid id)
    {
        var patient = await _context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        return patient == null ? null : MapToDto(patient);
    }

    public async Task<PatientDto?> GetPatientByCodeAsync(string code)
    {
        var patient = await _context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.PatientCode == code);
        return patient == null ? null : MapToDto(patient);
    }

    public async Task<PatientDto?> GetPatientByIdentityCardAsync(string identityCardNumber)
    {
        var patient = await _context.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.IdentityCardNumber == identityCardNumber);
        return patient == null ? null : MapToDto(patient);
    }

    public async Task<PatientDto> CreatePatientAsync(CreatePatientDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FullName))
            throw new ArgumentException("Họ và tên bệnh nhân không được để trống.");

        if (string.IsNullOrWhiteSpace(dto.IdentityCardNumber))
            throw new ArgumentException("Số CCCD/Định danh cá nhân không được để trống.");

        var existingCCCD = await _context.Patients.AnyAsync(p => p.IdentityCardNumber == dto.IdentityCardNumber.Trim());
        if (existingCCCD)
            throw new InvalidOperationException($"Số CCCD {dto.IdentityCardNumber} đã tồn tại trên hệ thống!");

        var patientCode = await GeneratePatientCodeAsync();

        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            PatientCode = patientCode,
            FullName = dto.FullName.Trim(),
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            IdentityCardNumber = dto.IdentityCardNumber.Trim(),
            HealthInsuranceNumber = dto.HealthInsuranceNumber?.Trim(),
            PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty,
            Email = dto.Email?.Trim(),
            Address = dto.Address?.Trim() ?? string.Empty,
            MedicalHistory = dto.MedicalHistory?.Trim(),
            DrugAllergies = dto.DrugAllergies?.Trim(),
            BloodType = dto.BloodType,
            EmergencyContactName = dto.EmergencyContactName?.Trim(),
            EmergencyContactPhone = dto.EmergencyContactPhone?.Trim(),
            EmergencyContactRelation = dto.EmergencyContactRelation?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        return MapToDto(patient);
    }

    public async Task<PatientDto> UpdatePatientAsync(Guid id, UpdatePatientDto dto)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == id);
        if (patient == null)
            throw new KeyNotFoundException($"Không tìm thấy bệnh nhân với ID: {id}");

        if (string.IsNullOrWhiteSpace(dto.FullName))
            throw new ArgumentException("Họ và tên bệnh nhân không được để trống.");

        if (string.IsNullOrWhiteSpace(dto.IdentityCardNumber))
            throw new ArgumentException("Số CCCD không được để trống.");

        // Kiểm tra trùng CCCD với bệnh nhân khác
        var existingCCCD = await _context.Patients.AnyAsync(p => p.IdentityCardNumber == dto.IdentityCardNumber.Trim() && p.Id != id);
        if (existingCCCD)
            throw new InvalidOperationException($"Số CCCD {dto.IdentityCardNumber} đã thuộc về một bệnh nhân khác!");

        patient.FullName = dto.FullName.Trim();
        patient.Gender = dto.Gender;
        patient.DateOfBirth = dto.DateOfBirth;
        patient.IdentityCardNumber = dto.IdentityCardNumber.Trim();
        patient.HealthInsuranceNumber = dto.HealthInsuranceNumber?.Trim();
        patient.PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty;
        patient.Email = dto.Email?.Trim();
        patient.Address = dto.Address?.Trim() ?? string.Empty;
        patient.MedicalHistory = dto.MedicalHistory?.Trim();
        patient.DrugAllergies = dto.DrugAllergies?.Trim();
        patient.BloodType = dto.BloodType;
        patient.EmergencyContactName = dto.EmergencyContactName?.Trim();
        patient.EmergencyContactPhone = dto.EmergencyContactPhone?.Trim();
        patient.EmergencyContactRelation = dto.EmergencyContactRelation?.Trim();
        patient.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(patient);
    }

    public async Task<bool> DeletePatientAsync(Guid id)
    {
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.Id == id);
        if (patient == null) return false;

        _context.Patients.Remove(patient);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<string> GeneratePatientCodeAsync()
    {
        var currentYear = DateTime.Now.Year;
        var prefix = $"BN{currentYear}";

        var count = await _context.Patients.CountAsync(p => p.PatientCode.StartsWith(prefix));
        return $"{prefix}{(count + 1):D6}";
    }

    private static PatientDto MapToDto(Patient p)
    {
        return new PatientDto
        {
            Id = p.Id,
            PatientCode = p.PatientCode,
            FullName = p.FullName,
            Gender = p.Gender,
            DateOfBirth = p.DateOfBirth,
            IdentityCardNumber = p.IdentityCardNumber,
            HealthInsuranceNumber = p.HealthInsuranceNumber,
            PhoneNumber = p.PhoneNumber,
            Email = p.Email,
            Address = p.Address,
            MedicalHistory = p.MedicalHistory,
            DrugAllergies = p.DrugAllergies,
            BloodType = p.BloodType,
            EmergencyContactName = p.EmergencyContactName,
            EmergencyContactPhone = p.EmergencyContactPhone,
            EmergencyContactRelation = p.EmergencyContactRelation,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }
}
