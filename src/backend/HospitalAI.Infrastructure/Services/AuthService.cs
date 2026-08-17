using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly HospitalDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public AuthService(HospitalDbContext context, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower() || u.Email.ToLower() == request.Username.ToLower());

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new Exception("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        if (!user.IsActive)
        {
            throw new Exception("Tài khoản của bạn đã bị khóa.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        var (token, expiresAt) = _tokenGenerator.GenerateToken(user, roles);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Specialty = user.Specialty,
                Title = user.Title,
                Roles = roles,
                AvatarUrl = user.AvatarUrl
            }
        };
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Patient")
                ?? new Role { Name = "Patient", Description = "Bệnh nhân Google Login" };

            user = new User
            {
                Username = request.Email.Split('@')[0] + "_" + DateTime.UtcNow.Ticks.ToString().Substring(12),
                PasswordHash = _passwordHasher.HashPassword(Guid.NewGuid().ToString()),
                FullName = string.IsNullOrWhiteSpace(request.FullName) ? request.Email : request.FullName,
                Email = request.Email,
                PhoneNumber = "0900000000",
                IsActive = true,
                AvatarUrl = string.IsNullOrWhiteSpace(request.PhotoUrl) ? $"https://lh3.googleusercontent.com/a/default-user" : request.PhotoUrl,
                CreatedAt = DateTime.UtcNow
            };

            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        if (!roles.Any()) roles.Add("Patient");

        var (token, expiresAt) = _tokenGenerator.GenerateToken(user, roles);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Specialty = user.Specialty,
                Title = user.Title,
                Roles = roles,
                AvatarUrl = user.AvatarUrl
            }
        };
    }

    public async Task<UserProfileDto> RegisterAsync(RegisterRequestDto request)
    {
        var existingUser = await _context.Users.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());
        if (existingUser)
        {
            throw new Exception("Tên đăng nhập đã tồn tại trong hệ thống.");
        }

        var roleName = string.IsNullOrWhiteSpace(request.Role) ? "Patient" : request.Role;
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role == null)
        {
            role = new Role { Name = roleName, Description = $"Vai trò {roleName}" };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        var newUser = new User
        {
            Username = request.Username,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Specialty = request.Specialty,
            Title = request.Title,
            IsActive = true,
            AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={request.Username}",
            CreatedAt = DateTime.UtcNow
        };

        newUser.UserRoles.Add(new UserRole { UserId = newUser.Id, RoleId = role.Id });

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return new UserProfileDto
        {
            Id = newUser.Id,
            Username = newUser.Username,
            FullName = newUser.FullName,
            Email = newUser.Email,
            PhoneNumber = newUser.PhoneNumber,
            Specialty = newUser.Specialty,
            Title = newUser.Title,
            Roles = new List<string> { role.Name },
            AvatarUrl = newUser.AvatarUrl
        };
    }

    public async Task<UserProfileDto> GetUserProfileAsync(string username)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

        if (user == null)
        {
            throw new Exception("Không tìm thấy thông tin người dùng.");
        }

        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Specialty = user.Specialty,
            Title = user.Title,
            Roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList(),
            AvatarUrl = user.AvatarUrl
        };
    }

    public async Task<bool> ChangePasswordAsync(string username, ChangePasswordDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        if (user == null) throw new Exception("Không tìm thấy người dùng.");

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new Exception("Mật khẩu hiện tại không chính xác.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<DoctorDto>> GetDoctorsAsync()
    {
        var doctorUsers = await _context.Users
            .Where(u => u.UserRoles.Any(ur => ur.Role != null && ur.Role.Name == "Doctor") || u.Specialty != null)
            .Select(u => new DoctorDto
            {
                Id = u.Id,
                Name = u.FullName,
                Dept = u.Specialty ?? "Khoa Nội Tổng Hợp",
                Title = u.Title ?? "Bác sĩ Chuyên khoa",
                Avatar = string.IsNullOrEmpty(u.AvatarUrl) ? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80" : u.AvatarUrl
            })
            .ToListAsync();

        return doctorUsers;
    }
}
