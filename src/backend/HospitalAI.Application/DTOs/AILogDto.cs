using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

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
    [Required]
    [StringLength(50)]
    public string UserRole { get; set; } = string.Empty;

    [Required]
    [StringLength(150)]
    public string DoctorName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string ActionType { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string ModelUsed { get; set; } = string.Empty;

    [Required]
    public string PromptText { get; set; } = string.Empty;

    [Required]
    public string ResponseText { get; set; } = string.Empty;

    public int LatencyMs { get; set; }
    public bool PiiRedacted { get; set; }
    public List<string>? RedactedCategories { get; set; }
    public List<string>? Sources { get; set; }

    [StringLength(50)]
    public string Status { get; set; } = "SUCCESS";
}
