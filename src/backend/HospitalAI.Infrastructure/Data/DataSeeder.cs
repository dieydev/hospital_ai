using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(HospitalDbContext context, IPasswordHasher passwordHasher)
    {
        await context.Database.EnsureCreatedAsync();

        // 1. Seed Roles: 7 Vai trò chuẩn hệ thống + Bệnh nhân
        var roles = new[] { "Admin", "Doctor", "Receptionist", "Triage", "Pharmacy", "Nurse", "Cashier", "Patient" };
        foreach (var roleName in roles)
        {
            if (!await context.Roles.AnyAsync(r => r.Name == roleName))
            {
                context.Roles.Add(new Role { Name = roleName, Description = $"Vai trò {roleName} hệ thống bệnh viện" });
            }
        }
        await context.SaveChangesAsync();

        var adminRole = await context.Roles.FirstAsync(r => r.Name == "Admin");
        var doctorRole = await context.Roles.FirstAsync(r => r.Name == "Doctor");
        var receptionistRole = await context.Roles.FirstAsync(r => r.Name == "Receptionist");
        var triageRole = await context.Roles.FirstAsync(r => r.Name == "Triage");
        var pharmacyRole = await context.Roles.FirstAsync(r => r.Name == "Pharmacy");
        var nurseRole = await context.Roles.FirstAsync(r => r.Name == "Nurse");
        var cashierRole = await context.Roles.FirstAsync(r => r.Name == "Cashier");
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
                Title = "Nhân viên Tiếp nhận",
                IsActive = true,
                AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Reception"
            };
            recepUser.UserRoles.Add(new UserRole { UserId = recepUser.Id, RoleId = receptionistRole.Id });
            context.Users.Add(recepUser);
        }

        if (!await context.Users.AnyAsync(u => u.Username == "triage01"))
        {
            var triageUser = new User
            {
                Username = "triage01",
                PasswordHash = passwordHasher.HashPassword("123456"),
                FullName = "Lê Hoàng Nam",
                Email = "nam.triage@hospital-ai.vn",
                PhoneNumber = "0923456789",
                Title = "Nhân viên Sàng lọc & Phân luồng",
                IsActive = true,
                AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=TriageNam"
            };
            triageUser.UserRoles.Add(new UserRole { UserId = triageUser.Id, RoleId = triageRole.Id });
            context.Users.Add(triageUser);
        }

        if (!await context.Users.AnyAsync(u => u.Username == "pharmacy01"))
        {
            var pharmUser = new User
            {
                Username = "pharmacy01",
                PasswordHash = passwordHasher.HashPassword("123456"),
                FullName = "Dược sĩ Vũ Minh Thảo",
                Email = "thao.pharmacy@hospital-ai.vn",
                PhoneNumber = "0934567890",
                Title = "Dược sĩ Quản lý Kho Dược",
                IsActive = true,
                AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=PharmThao"
            };
            pharmUser.UserRoles.Add(new UserRole { UserId = pharmUser.Id, RoleId = pharmacyRole.Id });
            context.Users.Add(pharmUser);
        }

        if (!await context.Users.AnyAsync(u => u.Username == "nurse01"))
        {
            var nurseUser = new User
            {
                Username = "nurse01",
                PasswordHash = passwordHasher.HashPassword("123456"),
                FullName = "Hoàng Thị Yến",
                Email = "yen.nurse@hospital-ai.vn",
                PhoneNumber = "0945678901",
                Title = "Điều dưỡng viên Y tế",
                IsActive = true,
                AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=NurseYen"
            };
            nurseUser.UserRoles.Add(new UserRole { UserId = nurseUser.Id, RoleId = nurseRole.Id });
            context.Users.Add(nurseUser);
        }

        if (!await context.Users.AnyAsync(u => u.Username == "cashier01"))
        {
            var cashierUser = new User
            {
                Username = "cashier01",
                PasswordHash = passwordHasher.HashPassword("123456"),
                FullName = "Đặng Thu Trang",
                Email = "trang.cashier@hospital-ai.vn",
                PhoneNumber = "0956789012",
                Title = "Thu ngân Viện phí Quầy 01",
                IsActive = true,
                AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=CashierTrang"
            };
            cashierUser.UserRoles.Add(new UserRole { UserId = cashierUser.Id, RoleId = cashierRole.Id });
            context.Users.Add(cashierUser);
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

        // Seed thêm các Bác sĩ chuyên khoa nếu chưa có
        var seedDoctors = new (string username, string name, string dept, string title)[]
        {
            ("dr.duc", "BS. CKI. Phạm Minh Đức", "Khoa Nhi", "Trưởng Khoa Nhi"),
            ("dr.mai", "BS. CKI. Trần Ngọc Mai", "Khoa Mắt", "Trưởng Khoa Mắt"),
            ("dr.tuan", "BS. CKII. Lê Văn Tuấn", "Khoa Tai Mũi Họng", "Trưởng Khoa TMH"),
            ("dr.dung", "TS. BS. Huỳnh Quốc Dũng", "Khoa Tim Mạch", "Trưởng Khoa Tim Mạch"),
            ("dr.vuong", "BS. CKII. Đinh Khắc Vương", "Khoa Tiêu Hóa", "Trưởng Khoa Tiêu Hóa"),
            ("dr.giang", "BS. CKII. Đỗ Hoàng Giang", "Khoa Ngoại Tổng Quát", "Trưởng Khoa Ngoại"),
            ("dr.nghia", "BS. CKI. Hoàng Trọng Nghĩa", "Khoa Răng Hàm Mặt", "Trưởng Khoa Răng Hàm Mặt"),
            ("dr.phuonganh", "BS. CKI. Nguyễn Phương Anh", "Khoa Da Liễu", "Trưởng Khoa Da Liễu"),
            ("dr.phuong", "BS. CKII. Lê Thị Kim Phượng", "Khoa Sản Phụ Khoa", "Trưởng Khoa Sản"),
            ("dr.thanh", "BS. CKI. Trịnh Văn Thành", "Khoa Cấp Cứu & Hồi Sức", "Trưởng Kíp Cấp Cứu")
        };

        foreach (var doc in seedDoctors)
        {
            if (!await context.Users.AnyAsync(u => u.Username == doc.username))
            {
                var docUser = new User
                {
                    Username = doc.username,
                    PasswordHash = passwordHasher.HashPassword("123456"),
                    FullName = doc.name,
                    Email = $"{doc.username}@hospital-ai.vn",
                    PhoneNumber = "0901234567",
                    Specialty = doc.dept,
                    Title = doc.title,
                    IsActive = true,
                    AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={doc.username}"
                };
                docUser.UserRoles.Add(new UserRole { UserId = docUser.Id, RoleId = doctorRole.Id });
                context.Users.Add(docUser);
            }
        }
        await context.SaveChangesAsync();

        // 3. Seed Default Departments (Đầy đủ các chuyên khoa D-Medical)
        if (!await context.Departments.AnyAsync())
        {
            var initialDepts = new[]
            {
                new Department { DepartmentName = "Khoa Nội Tổng Hợp", Location = "Phòng 102 - Tầng 1", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Nhi", Location = "Phòng 105 - Tầng 1", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Mắt", Location = "Phòng 201 - Tầng 2", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Tai Mũi Họng", Location = "Phòng 205 - Tầng 2", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Tim Mạch", Location = "Phòng 301 - Tầng 3", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Tiêu Hóa", Location = "Phòng 305 - Tầng 3", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Ngoại Tổng Quát", Location = "Phòng 401 - Tầng 4", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Răng Hàm Mặt", Location = "Phòng 203 - Tầng 2", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Da Liễu", Location = "Phòng 208 - Tầng 2", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Sản Phụ Khoa", Location = "Phòng 308 - Tầng 3", RoomType = "Clinical" },
                new Department { DepartmentName = "Khoa Cấp Cứu & Hồi Sức", Location = "Tầng Trệt - Khu A", RoomType = "Emergency" },
                new Department { DepartmentName = "Phòng Chẩn Đoán Hình Ảnh (X-Quang)", Location = "Tầng 1 - Khu B", RoomType = "Lab" },
            };
            await context.Departments.AddRangeAsync(initialDepts);
            await context.SaveChangesAsync();
        }

        // 4. Seed Default Patients
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
                    Address = "123 Đường Bác Bác, TP. Thủ Dầu Một, Bình Dương",
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
                    Address = "45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
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
                    Address = "88 Nguyễn Huệ, TP. Bến Cát, Bình Dương",
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
                    Address = "12 Lý Thường Kiệt, TP. Dĩ An, Bình Dương",
                    EmergencyContactName = "Phạm Văn Hùng",
                    EmergencyContactPhone = "0909998877",
                    EmergencyContactRelation = "Anh ruột",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                }
            };

            await context.Patients.AddRangeAsync(initialPatients);
            await context.SaveChangesAsync();
        }

        // 5. Seed Default Queue Tickets
        if (!await context.QueueTickets.AnyAsync())
        {
            var firstDept = await context.Departments.FirstOrDefaultAsync();
            var firstPatient = await context.Patients.FirstOrDefaultAsync();

            if (firstDept != null && firstPatient != null)
            {
                var sampleQueue = new[]
                {
                    new QueueTicket
                    {
                        PatientId = firstPatient.Id,
                        DepartmentId = firstDept.Id,
                        SequenceNumber = 101,
                        Status = "Examining",
                        Priority = "Normal",
                        CreatedAt = DateTime.UtcNow
                    }
                };

                await context.QueueTickets.AddRangeAsync(sampleQueue);
                await context.SaveChangesAsync();
            }
        }

        // 6. Seed Default Examinations
        if (!await context.Examinations.AnyAsync())
        {
            var doctor = await context.Users.FirstOrDefaultAsync(u => u.Username == "dr.duy");
            var patient = await context.Patients.FirstOrDefaultAsync();

            if (doctor != null && patient != null)
            {
                var sampleExam = new Examination
                {
                    ExaminationCode = "LK20260802-01",
                    PatientId = patient.Id,
                    DoctorId = doctor.Id,
                    DepartmentName = "Khoa Nội Tổng Hợp",
                    ExaminationDate = DateTime.UtcNow.AddDays(-1),
                    Subjective = "Bệnh nhân sốt nhẹ 38.0°C, ho khan 3 ngày nay, đau họng khi nuốt.",
                    PulseRate = 82,
                    Temperature = 38.0m,
                    BloodPressure = "120/80",
                    RespiratoryRate = 18,
                    Weight = 65.5m,
                    Height = 170.0m,
                    Assessment = "Viêm họng cấp tính",
                    ICD10Code = "J02.9",
                    ICD10Name = "Viêm họng cấp tính, không đặc hiệu",
                    Plan = "Nghỉ ngơi, uống nhiều nước ấm, duy trì uống thuốc đúng liều 7 ngày.",
                    Status = "Hoàn thành",
                    PrescriptionDetails = new List<PrescriptionDetail>
                    {
                        new PrescriptionDetail { MedicineName = "Paracetamol 500mg", Unit = "Viên", Quantity = 20, DosageInstruction = "Uống 1 viên khi sốt > 38.5°C, mỗi 6-8h", UnitPrice = 1200 },
                        new PrescriptionDetail { MedicineName = "Augmentin 1g", Unit = "Viên", Quantity = 14, DosageInstruction = "Uống 1 viên sau ăn sáng và tối", UnitPrice = 18500 }
                    },
                    ServiceOrderDetails = new List<ServiceOrderDetail>
                    {
                        new ServiceOrderDetail { ServiceName = "Công thức máu toàn phần (CBC)", ServiceCategory = "Xét nghiệm", Price = 85000, Result = "Bạch cầu WBC 11.2 G/L (Tăng nhẹ)", Status = "Đã có kết quả" }
                    }
                };

                await context.Examinations.AddAsync(sampleExam);
                await context.SaveChangesAsync();
            }
        }

        // 7. Tự động đồng bộ các tài khoản Patient chưa có bản ghi trong bảng BenhNhan
        var patientUsersWithoutProfile = await context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .Where(u => u.UserRoles.Any(ur => ur.Role != null && ur.Role.Name == "Patient"))
            .Where(u => !context.Patients.Any(p => p.UserId == u.Id))
            .ToListAsync();

        foreach (var u in patientUsersWithoutProfile)
        {
            var currentYear = DateTime.Now.Year;
            var prefix = $"BN{currentYear}";
            var count = await context.Patients.CountAsync(p => p.PatientCode.StartsWith(prefix));
            var pCode = $"{prefix}{(count + 1):D6}";
            var cccd = !string.IsNullOrWhiteSpace(u.PhoneNumber) ? u.PhoneNumber.Trim() : $"CD{(count + 1):D9}";
            if (await context.Patients.AnyAsync(p => p.IdentityCardNumber == cccd))
            {
                cccd = $"P{DateTime.UtcNow.Ticks % 1000000000000:D12}";
            }

            context.Patients.Add(new Patient
            {
                Id = Guid.NewGuid(),
                UserId = u.Id,
                PatientCode = pCode,
                FullName = !string.IsNullOrWhiteSpace(u.FullName) && u.FullName != "Bệnh nhân mới"
                    ? u.FullName
                    : (!string.IsNullOrWhiteSpace(u.PhoneNumber) ? $"Bệnh nhân {u.PhoneNumber}" : "Bệnh nhân mới"),
                Gender = "Nam",
                DateOfBirth = DateTime.UtcNow.AddYears(-20),
                IdentityCardNumber = cccd,
                Address = "Chưa cập nhật",
                CreatedAt = DateTime.UtcNow
            });
        }
        if (patientUsersWithoutProfile.Any())
        {
            await context.SaveChangesAsync();
        }

        // 8. Seed Default Invoices (Dữ liệu Hóa đơn Viện phí & BHYT)
        if (!await context.Billings.AnyAsync())
        {
            var p1 = await context.Patients.FirstOrDefaultAsync(p => p.FullName.Contains("Nguyễn Văn An")) ?? await context.Patients.FirstOrDefaultAsync();
            var p2 = await context.Patients.Skip(1).FirstOrDefaultAsync() ?? p1;
            var p3 = await context.Patients.Skip(2).FirstOrDefaultAsync() ?? p1;

            if (p1 != null)
            {
                var seedBillings = new List<Billing>
                {
                    new Billing
                    {
                        Id = Guid.NewGuid(),
                        PatientId = p1.Id,
                        BillingType = "Registration",
                        TotalAmount = 150000,
                        Status = "Unpaid",
                        CreatedAt = DateTime.UtcNow.AddHours(-3),
                        Items = new List<BillingItem>
                        {
                            new BillingItem { ItemName = "Khám chuyên khoa Nội Tổng Hợp", UnitPrice = 150000, Quantity = 1, TotalPrice = 150000 }
                        }
                    },
                    new Billing
                    {
                        Id = Guid.NewGuid(),
                        PatientId = p2?.Id ?? p1.Id,
                        BillingType = "ServiceOrder",
                        TotalAmount = 235000,
                        Status = "Unpaid",
                        CreatedAt = DateTime.UtcNow.AddHours(-2),
                        Items = new List<BillingItem>
                        {
                            new BillingItem { ItemName = "Chụp X-quang Ngực thẳng (Kỹ thuật số)", UnitPrice = 150000, Quantity = 1, TotalPrice = 150000 },
                            new BillingItem { ItemName = "Tổng phân tích tế bào máu ngoại vi (CBC)", UnitPrice = 85000, Quantity = 1, TotalPrice = 85000 }
                        }
                    },
                    new Billing
                    {
                        Id = Guid.NewGuid(),
                        PatientId = p3?.Id ?? p1.Id,
                        BillingType = "Prescription",
                        TotalAmount = 283000,
                        Status = "Paid",
                        PaymentMethod = "Tiền mặt",
                        PaidAt = DateTime.UtcNow.AddHours(-1),
                        CreatedAt = DateTime.UtcNow.AddHours(-2),
                        Items = new List<BillingItem>
                        {
                            new BillingItem { ItemName = "Augmentin 1g (Hộp 14 viên)", UnitPrice = 259000, Quantity = 1, TotalPrice = 259000 },
                            new BillingItem { ItemName = "Paracetamol 500mg (Vỉ 10 viên)", UnitPrice = 12000, Quantity = 2, TotalPrice = 24000 }
                        }
                    },
                    new Billing
                    {
                        Id = Guid.NewGuid(),
                        PatientId = p1.Id,
                        BillingType = "ServiceOrder",
                        TotalAmount = 450000,
                        Status = "Paid",
                        PaymentMethod = "Chuyển khoản VietQR",
                        PaidAt = DateTime.UtcNow.AddMinutes(-40),
                        CreatedAt = DateTime.UtcNow.AddHours(-1),
                        Items = new List<BillingItem>
                        {
                            new BillingItem { ItemName = "Siêu âm Doppler Tim màu đa chiều", UnitPrice = 350000, Quantity = 1, TotalPrice = 350000 },
                            new BillingItem { ItemName = "Đo điện tim gắng sức (ECG 12 cần)", UnitPrice = 100000, Quantity = 1, TotalPrice = 100000 }
                        }
                    },
                    new Billing
                    {
                        Id = Guid.NewGuid(),
                        PatientId = p2?.Id ?? p1.Id,
                        BillingType = "Registration",
                        TotalAmount = 120000,
                        Status = "Unpaid",
                        CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                        Items = new List<BillingItem>
                        {
                            new BillingItem { ItemName = "Khám chuyên khoa Nhi Tổng Quát", UnitPrice = 120000, Quantity = 1, TotalPrice = 120000 }
                        }
                    },
                    new Billing
                    {
                        Id = Guid.NewGuid(),
                        PatientId = p3?.Id ?? p1.Id,
                        BillingType = "Prescription",
                        TotalAmount = 320000,
                        Status = "Unpaid",
                        CreatedAt = DateTime.UtcNow.AddMinutes(-15),
                        Items = new List<BillingItem>
                        {
                            new BillingItem { ItemName = "Nexium 40mg (Hộp 28 viên)", UnitPrice = 320000, Quantity = 1, TotalPrice = 320000 }
                        }
                    }
                };

                await context.Billings.AddRangeAsync(seedBillings);
                await context.SaveChangesAsync();
            }
        }
    }
}
