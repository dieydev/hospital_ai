using System;
using System.Collections.Generic;

namespace HospitalAI.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty; // TenDangNhap
    public string PasswordHash { get; set; } = string.Empty; // MatKhauMaHoa
    public string FullName { get; set; } = string.Empty; // HoTen
    public string Email { get; set; } = string.Empty; // Email
    public string PhoneNumber { get; set; } = string.Empty; // SoDienThoai
    public bool IsActive { get; set; } = true; // TrangThaiKichHoat
    public bool TwoFactorEnabled { get; set; } = false; // BaoMatHaiLop
    public string? Specialty { get; set; }
    public string? Title { get; set; }
    public string AvatarUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // NgayTao

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
