using System;
using System.Collections.Generic;

namespace HospitalAI.Application.DTOs;

public class AILogDto
{
    public string Id { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string UserRole { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string ModelUsed { get; set; } = string.Empty;
    public string PromptText { get; set; } = string.Empty;
    public string ResponseText { get; set; } = string.Empty;
    public int LatencyMs { get; set; }
    public bool PiiRedacted { get; set; }
    public List<string>? RedactedCategories { get; set; }
    public List<string>? Sources { get; set; }
    public string Status { get; set; } = "SUCCESS";
}

public class CreateAILogDto
{
    public string UserRole { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string ModelUsed { get; set; } = string.Empty;
    public string PromptText { get; set; } = string.Empty;
    public string ResponseText { get; set; } = string.Empty;
    public int LatencyMs { get; set; }
    public bool PiiRedacted { get; set; }
    public List<string>? RedactedCategories { get; set; }
    public List<string>? Sources { get; set; }
    public string Status { get; set; } = "SUCCESS";
}
