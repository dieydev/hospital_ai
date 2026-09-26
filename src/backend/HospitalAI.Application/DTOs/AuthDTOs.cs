using System;
using System.Collections.Generic;

namespace HospitalAI.Application.DTOs;

public class LoginRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequestDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = "Patient"; // Default Role
    public string? Specialty { get; set; }
    public string? Title { get; set; }
    public string? IdentityCardNumber { get; set; }
    public string? Gender { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserProfileDto User { get; set; } = null!;
}

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Specialty { get; set; }
    public string? Title { get; set; }
    public List<string> Roles { get; set; } = new();
    public string AvatarUrl { get; set; } = string.Empty;
    public string? PatientCode { get; set; }
    public string? IdentityCardNumber { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? HealthInsuranceNumber { get; set; }
    public bool IsProfileComplete { get; set; }
}

public class SendOtpRequestDto
{
    public string PhoneNumber { get; set; } = string.Empty;
}

public class SendOtpResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? OtpCode { get; set; } // Available in dev/testing mode
}

public class VerifyOtpRequestDto
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
}

public class CompleteProfileRequestDto
{
    public string? PhoneNumber { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string IdentityCardNumber { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = "Nam";
    public string Address { get; set; } = string.Empty;
    public string? HealthInsuranceNumber { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class GoogleLoginRequestDto
{
    public string IdToken { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
}

public class DoctorDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Dept { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
}

