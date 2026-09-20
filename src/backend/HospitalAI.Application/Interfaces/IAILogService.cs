using System.Collections.Generic;
using System.Threading.Tasks;
using HospitalAI.Application.DTOs;

namespace HospitalAI.Application.Interfaces;

public interface IAILogService
{
    Task<AILogDto> CreateLogAsync(CreateAILogDto dto);
    Task<List<AILogDto>> GetLogsAsync();
}
