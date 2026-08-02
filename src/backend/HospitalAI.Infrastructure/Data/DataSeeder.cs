using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(HospitalDbContext context, IPasswordHasher passwordHasher)
    {
        await context.Database.EnsureCreatedAsync();

        // 1. Seed Roles
        var roles = new[] { "Admin", "Doctor", "Nurse", "Receptionist", "Patient" };
        foreach (var roleName in roles)
        {
            if (!await context.Roles.AnyAsync(r => r.Name == roleName))
            {
                context.Roles.Add(new Role { Name = roleName, Description = $"Vai trò {roleName} hệ thống" });
            }
        }
        await context.SaveChangesAsync();

        var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");
        var doctorRole = await context.Roles.FirstAsync(r => r.Name == "Doctor");
        var nurseRole = await context.Roles.FirstAsync(r => r.Name == "Nurse");
        var receptionistRole = await context.Roles.FirstAsync(r => r.Name == "Receptionist");
        var patientRole = await context.Roles.FirstAsync(r => r.Name == "Patient");

        // 2. Seed Default Accounts
        if (!await context.Users.AnyAsync(u => u.Username == "admin"))
        {
            var adminUser = new User
            {
                Username = "admin",
                PasswordHash = passwordHasher.HashPassword("123456"),
                FullName = "Quản trị viên Hệ thống",
                Email = "admin@hospital-ai.vn",
                PhoneNumber = "0900000001",
                Title = "Quản trị viên",
                IsActive = true,
                AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
            };
            adminUser.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
            context.Users.Add(adminUser);
        }

        if (!await context.Users.AnyAsync(u => u.Username == "dr.duy"))
        {
            var doctorUser = new User
            {
                Username = "dr.duy",
                PasswordHash = passwordHasher.HashPassword("123456"),
                FullName = "BS. CKII. Nguyễn Thanh Duy",
                Email = "thanhduy.md@hospital-ai.vn",
                PhoneNumber = "0336022526",
                Specialty = "Khoa Nội Tổng Hợp",
                Title = "Bác sĩ Điều trị",
                IsActive = true,
                AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=DuyDoctor"
            };
            doctorUser.UserRoles.Add(new UserRole { UserId = doctorUser.Id, RoleId = doctorRole.Id });
            doctorUser.UserRoles.Add(new UserRole { UserId = doctorUser.Id, RoleId = adminRole.Id });
            context.Users.Add(doctorUser);
        }

        if (!await context.Users.AnyAsync(u => u.Username == "receptionist"))
        {
            var recepUser = new User
            {
                Username = "receptionist",
                PasswordHash = passwordHasher.HashPassword("123456"),
                FullName = "Lễ tân Trần Thị Hương",
                Email = "huong.reception@hospital-ai.vn",
                PhoneNumber = "0912345678",
                Title = "Nhân viên Lễ tân",
                IsActive = true,
                AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Reception"
            };
            recepUser.UserRoles.Add(new UserRole { UserId = recepUser.Id, RoleId = receptionistRole.Id });
            context.Users.Add(recepUser);
        }

        if (!await context.Users.AnyAsync(u => u.Username == "patient01"))
        {
            var patientUser = new User
            {
                Username = "patient01",
                PasswordHash = passwordHasher.HashPassword("123456"),
                FullName = "Nguyễn Văn An",
                Email = "an.nguyen@gmail.com",
                PhoneNumber = "0987654321",
                IsActive = true,
                AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=PatientAn"
            };
            patientUser.UserRoles.Add(new UserRole { UserId = patientUser.Id, RoleId = patientRole.Id });
            context.Users.Add(patientUser);
        }

        await context.SaveChangesAsync();
    }
}
