using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using MongoDB.Driver;

namespace HospitalAI.Infrastructure.Services;

public class AILogService : IAILogService
{
    private readonly MongoDbContext _context;

    public AILogService(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<AILogDto> CreateLogAsync(CreateAILogDto dto)
    {
        var log = new MongoAILog
        {
            Timestamp = DateTime.UtcNow,
            UserRole = dto.UserRole,
            DoctorName = dto.DoctorName,
            ActionType = dto.ActionType,
            ModelUsed = dto.ModelUsed,
            PromptText = dto.PromptText,
            ResponseText = dto.ResponseText,
            LatencyMs = dto.LatencyMs,
            PiiRedacted = dto.PiiRedacted,
            RedactedCategories = dto.RedactedCategories,
            Sources = dto.Sources,
            Status = dto.Status
        };

        await _context.AILogs.InsertOneAsync(log);

        return MapToDto(log);
    }

    public async Task<List<AILogDto>> GetLogsAsync()
    {
        var logs = await _context.AILogs
            .Find(_ => true)
            .SortByDescending(x => x.Timestamp)
            .Limit(100)
            .ToListAsync();

        return logs.Select(MapToDto).ToList();
    }

    private AILogDto MapToDto(MongoAILog log)
    {
        return new AILogDto
        {
            Id = log.Id,
            Timestamp = log.Timestamp,
            UserRole = log.UserRole,
            DoctorName = log.DoctorName,
            ActionType = log.ActionType,
            ModelUsed = log.ModelUsed,
            PromptText = log.PromptText,
            ResponseText = log.ResponseText,
            LatencyMs = log.LatencyMs,
            PiiRedacted = log.PiiRedacted,
            RedactedCategories = log.RedactedCategories,
            Sources = log.Sources,
            Status = log.Status
        };
    }
}
