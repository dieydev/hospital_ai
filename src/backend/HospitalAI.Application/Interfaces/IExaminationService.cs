using HospitalAI.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalAI.Application.Interfaces;

public interface IExaminationService
{
    Task<List<ExaminationDto>> GetExaminationsAsync(string? search, Guid? patientId, DateTime? date);
    Task<ExaminationDto?> GetExaminationByIdAsync(Guid id);
    Task<ExaminationDto> CreateExaminationAsync(CreateExaminationDto dto);
    Task<ExaminationDto> UpdateExaminationAsync(Guid id, CreateExaminationDto dto);
    Task<bool> DeleteExaminationAsync(Guid id);
}
