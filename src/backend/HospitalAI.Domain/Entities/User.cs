using System;
using System.Collections.Generic;

namespace HospitalAI.Domain.Entities;

public enum UserRoleEnum
{
    Admin,
    Doctor,
    Nurse,
    Receptionist,
    Patient
}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? Specialty { get; set; }
    public string? Title { get; set; }
    public string Role { get; set; } = nameof(UserRoleEnum.Doctor);
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
