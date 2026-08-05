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

        // 3. Seed Default Patients
        if (!await context.Patients.AnyAsync())
        {
            var initialPatients = new[]
            {
                new Patient
                {
                    PatientCode = "BN2026000001",
                    FullName = "Nguyễn Văn An",
                    Gender = "Nam",
                    DateOfBirth = new DateTime(1990, 5, 15),
                    IdentityCardNumber = "038090001234",
                    HealthInsuranceNumber = "DN40101234567",
                    PhoneNumber = "0912345678",
                    Email = "an.nguyen@gmail.com",
                    Address = "123 Đường Bác Bác, TP. Thủ Dầu Một, Bình Dương",
                    MedicalHistory = "Tăng huyết áp nhẹ (chuẩn đoán 2024)",
                    DrugAllergies = "Không ghi nhận",
                    BloodType = "O+",
                    EmergencyContactName = "Nguyễn Văn Bình",
                    EmergencyContactPhone = "0903112233",
                    EmergencyContactRelation = "Cha ruột",
                    CreatedAt = DateTime.UtcNow.AddDays(-30)
                },
                new Patient
                {
                    PatientCode = "BN2026000002",
                    FullName = "Trần Thị Bình",
                    Gender = "Nữ",
                    DateOfBirth = new DateTime(1985, 11, 20),
                    IdentityCardNumber = "038185005678",
                    HealthInsuranceNumber = "GD40109876543",
                    PhoneNumber = "0987654321",
                    Email = "binh.tran@yahoo.com",
                    Address = "45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                    MedicalHistory = "Đái tháo đường Tuýp 2 (Đang điều trị bằng Insulin)",
                    DrugAllergies = "Penicillin (Gây dị ứng mẩn ngứa nghiêm trọng)",
                    BloodType = "A+",
                    EmergencyContactName = "Trần Văn Cường",
                    EmergencyContactPhone = "0908887766",
                    EmergencyContactRelation = "Chồng",
                    CreatedAt = DateTime.UtcNow.AddDays(-20)
                },
                new Patient
                {
                    PatientCode = "BN2026000003",
                    FullName = "Lê Hoàng Nam",
                    Gender = "Nam",
                    DateOfBirth = new DateTime(2012, 8, 4),
                    IdentityCardNumber = "038212009876",
                    HealthInsuranceNumber = "TE40105554433",
                    PhoneNumber = "0933445566",
                    Email = "hoangnam.parent@gmail.com",
                    Address = "88 Nguyễn Huệ, TP. Bến Cát, Bình Dương",
                    MedicalHistory = "Viêm phế quản co thắt tái phát",
                    DrugAllergies = "Không ghi nhận",
                    BloodType = "B+",
                    EmergencyContactName = "Lê Văn Hoàng",
                    EmergencyContactPhone = "0933445566",
                    EmergencyContactRelation = "Cha ruột",
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                },
                new Patient
                {
                    PatientCode = "BN2026000004",
                    FullName = "Phạm Thu Cúc",
                    Gender = "Nữ",
                    DateOfBirth = new DateTime(1995, 2, 18),
                    IdentityCardNumber = "038195003456",
                    HealthInsuranceNumber = "DN40107778899",
                    PhoneNumber = "0908112233",
                    Email = "cuc.pham@gmail.com",
                    Address = "12 Lý Thường Kiệt, TP. Dĩ An, Bình Dương",
                    MedicalHistory = "Tiền sử khỏe mạnh, không bệnh nền",
                    DrugAllergies = "Aspirin (Đau dạ dày, mẩn đỏ)",
                    BloodType = "AB+",
                    EmergencyContactName = "Phạm Văn Hùng",
                    EmergencyContactPhone = "0909998877",
                    EmergencyContactRelation = "Anh ruột",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                }
            };

            await context.Patients.AddRangeAsync(initialPatients);
        }

        await context.SaveChangesAsync();
    }
}
