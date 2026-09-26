using System.Threading.Tasks;
using HospitalAI.Application.DTOs;

namespace HospitalAI.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto request);
    Task<UserProfileDto> RegisterAsync(RegisterRequestDto request);
    Task<SendOtpResponseDto> SendOtpAsync(SendOtpRequestDto request);
    Task<AuthResponseDto> VerifyOtpAndLoginAsync(VerifyOtpRequestDto request);
    Task<UserProfileDto> CompleteProfileAsync(string usernameOrPhone, CompleteProfileRequestDto request);
    Task<UserProfileDto> GetUserProfileAsync(string username);
    Task<bool> ChangePasswordAsync(string username, ChangePasswordDto request);
    Task<List<DoctorDto>> GetDoctorsAsync();
}
