using System.Threading.Tasks;
using HospitalAI.Application.DTOs;

namespace HospitalAI.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<UserProfileDto> RegisterAsync(RegisterRequestDto request);
    Task<UserProfileDto> GetUserProfileAsync(string username);
    Task<bool> ChangePasswordAsync(string username, ChangePasswordDto request);
}
