using HospitalAI.Application.DTOs;
using System;
using System.Threading.Tasks;

namespace HospitalAI.Application.Interfaces;

public interface IPatientService
{
    Task<PatientListResultDto> GetPatientsAsync(string? search, int pageIndex = 1, int pageSize = 20);
    Task<PatientDto?> GetPatientByIdAsync(Guid id);
    Task<PatientDto?> GetPatientByCodeAsync(string code);
    Task<PatientDto?> GetPatientByIdentityCardAsync(string identityCardNumber);
    Task<PatientDto> CreatePatientAsync(CreatePatientDto dto);
    Task<PatientDto> UpdatePatientAsync(Guid id, UpdatePatientDto dto);
    Task<bool> DeletePatientAsync(Guid id);
}
