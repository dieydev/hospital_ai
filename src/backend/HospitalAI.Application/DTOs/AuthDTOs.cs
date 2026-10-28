using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace HospitalAI.Application.DTOs;

public class LoginRequestDto
{
    [Required(ErrorMessage = "Tên đăng nhập không được để trống")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Tên đăng nhập từ 3 đến 100 ký tự")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequestDto
{
    [Required(ErrorMessage = "Tên đăng nhập không được để trống")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Tên đăng nhập từ 3 đến 100 ký tự")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu không được để trống")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu tối thiểu 6 ký tự")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Họ và tên không được để trống")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "Họ và tên từ 2 đến 150 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Định dạng email không hợp lệ")]
    public string Email { get; set; } = string.Empty;

    [RegularExpression(@"^0\d{9,10}$", ErrorMessage = "Số điện thoại không hợp lệ (10-11 số bắt đầu bằng số 0)")]
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = "Patient"; // Default Role
    public string? Specialty { get; set; }
    public string? Title { get; set; }
    public string? IdentityCardNumber { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? OtpCode { get; set; }
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
    public string? Token { get; set; }
}

public class SendOtpRequestDto
{
    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [RegularExpression(@"^0\d{9,10}$", ErrorMessage = "Số điện thoại không hợp lệ (10-11 số bắt đầu bằng số 0)")]
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
    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [RegularExpression(@"^0\d{9,10}$", ErrorMessage = "Số điện thoại không hợp lệ")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã OTP không được để trống")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Mã OTP phải gồm 6 chữ số")]
    public string OtpCode { get; set; } = string.Empty;
}

/// <summary>Gửi OTP cho luồng Quên mật khẩu (Bệnh nhân đã đăng ký)</summary>
public class ForgotPasswordOtpRequestDto
{
    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [RegularExpression(@"^0\d{9,10}$", ErrorMessage = "Số điện thoại không hợp lệ")]
    public string PhoneNumber { get; set; } = string.Empty;
}

/// <summary>Đặt lại mật khẩu sau khi xác thực OTP quên mật khẩu</summary>
public class ResetPasswordOtpRequestDto
{
    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    [RegularExpression(@"^0\d{9,10}$", ErrorMessage = "Số điện thoại không hợp lệ")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã OTP không được để trống")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Mã OTP phải gồm 6 chữ số")]
    public string OtpCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới không được để trống")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu mới tối thiểu 6 ký tự")]
    public string NewPassword { get; set; } = string.Empty;
}

public class CompleteProfileRequestDto
{
    public string? PhoneNumber { get; set; }

    [Required(ErrorMessage = "Họ và tên không được để trống")]
    [StringLength(150, MinimumLength = 2, ErrorMessage = "Họ và tên từ 2 đến 150 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số CCCD/CMND không được để trống")]
    [RegularExpression(@"^\d{9,12}$", ErrorMessage = "Số CCCD/CMND phải là dãy 9-12 chữ số")]
    public string IdentityCardNumber { get; set; } = string.Empty;

    public DateTime? DateOfBirth { get; set; }
    public string Gender { get; set; } = "Nam";
    public string Address { get; set; } = string.Empty;
    public string? HealthInsuranceNumber { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelation { get; set; }
    public string? AvatarUrl { get; set; }
}

public class UpdateAvatarRequestDto
{
    [Required(ErrorMessage = "Đường dẫn ảnh đại diện không được để trống")]
    [MaxLength(2000)]
    public string AvatarUrl { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    [Required(ErrorMessage = "Mật khẩu hiện tại không được để trống")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới không được để trống")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu mới tối thiểu 6 ký tự")]
    public string NewPassword { get; set; } = string.Empty;
}

public class GoogleLoginRequestDto
{
    [Required(ErrorMessage = "Google Token không được để trống")]
    public string IdToken { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Email không hợp lệ")]
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

public class UserAccountItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public string? Department { get; set; }
    public string? Title { get; set; }
    public bool IsActive { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}

public class CreateAccountPayloadDto
{
    [Required(ErrorMessage = "Tên đăng nhập không được để trống")]
    public string Username { get; set; } = string.Empty;
    public string? Password { get; set; }
    [Required(ErrorMessage = "Họ tên không được để trống")]
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    [Required(ErrorMessage = "Số điện thoại không được để trống")]
    public string PhoneNumber { get; set; } = string.Empty;
    public string Role { get; set; } = "Doctor";
    public string? Department { get; set; }
    public string? Title { get; set; }
}

public class AdminResetPasswordDto
{
    [Required(ErrorMessage = "Mật khẩu mới không được để trống")]
    public string NewPassword { get; set; } = string.Empty;
}

