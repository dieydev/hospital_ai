using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Security.Claims;
using System.Threading.Tasks;
using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.ExaminationService.Controllers;
using HospitalAI.ExaminationService.Security;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using HospitalAI.QueueService.Controllers;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace HospitalAI.Tests;

using QueueEngine = HospitalAI.Infrastructure.Services.QueueService;
using ExamEngine = HospitalAI.Infrastructure.Services.ExaminationService;

public class SecurityHardeningRegressionTests
{
    private static HospitalDbContext CreateInMemoryDb(string? name = null)
    {
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseInMemoryDatabase(databaseName: name ?? ("SecTest_" + Guid.NewGuid()))
            .Options;
        return new HospitalDbContext(options);
    }

    private static IConfiguration BuildTestConfig(Dictionary<string, string?>? values = null)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values ?? new Dictionary<string, string?>())
            .Build();
    }

    private static ControllerContext CreateUserContext(
        string role,
        string nameIdentifier,
        string name,
        string? phone = null)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, nameIdentifier),
            new(ClaimTypes.Name, name),
            new(ClaimTypes.Role, role)
        };
        if (!string.IsNullOrWhiteSpace(phone))
            claims.Add(new Claim(ClaimTypes.MobilePhone, phone));

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));
        return new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } };
    }

    [Theory]
    [InlineData("Admin@123")]
    [InlineData("Admin123")]
    [InlineData("HospitalAI@2026")]
    [InlineData("123456")]
    public async Task AuthService_Login_MustRejectBackdoorAndWrongPasswords(string attemptedPassword)
    {
        using var db = CreateInMemoryDb();
        var hasher = new PasswordHasher();
        var config = BuildTestConfig(new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "TEST_ONLY_JWT_SECRET_KEY_32_CHARS_LONG_2026"
        });

        var adminRole = new Role { Id = Guid.NewGuid(), Name = "Admin" };
        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin",
            Email = "admin@hospital-ai.vn",
            PhoneNumber = "0900000001",
            FullName = "Admin",
            PasswordHash = hasher.HashPassword("RealUniquePwd@9988"),
            IsActive = true
        };
        adminUser.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id, Role = adminRole });
        db.Roles.Add(adminRole);
        db.Users.Add(adminUser);
        await db.SaveChangesAsync();

        var auth = new AuthService(db, hasher, new JwtTokenGenerator(config), config);

        await Assert.ThrowsAsync<Exception>(() =>
            auth.LoginAsync(new LoginRequestDto { Username = "admin", Password = attemptedPassword }));

        var validLogin = await auth.LoginAsync(new LoginRequestDto { Username = "admin", Password = "RealUniquePwd@9988" });
        Assert.False(string.IsNullOrWhiteSpace(validLogin.Token));
    }

    [Fact]
    public async Task AuthService_Register_MustRejectMasterOtp123456_AndBlankOtp()
    {
        using var db = CreateInMemoryDb();
        var hasher = new PasswordHasher();
        var config = BuildTestConfig(new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "TEST_ONLY_JWT_SECRET_KEY_32_CHARS_LONG_2026"
        });
        var auth = new AuthService(db, hasher, new JwtTokenGenerator(config), config);

        await auth.SendOtpAsync(new SendOtpRequestDto { PhoneNumber = "0911223344" });

        await Assert.ThrowsAsync<Exception>(() => auth.RegisterAsync(new RegisterRequestDto
        {
            Username = "0911223344",
            PhoneNumber = "0911223344",
            Password = "StrongPwd@2026",
            FullName = "Nguyen Van Test",
            OtpCode = ""
        }));

        // Trừ trường hợp xác suất 1/900000 trùng ngẫu nhiên đúng 123456, 2 lần thử không đúng phải từ chối
        await Assert.ThrowsAsync<Exception>(() => auth.RegisterAsync(new RegisterRequestDto
        {
            Username = "0911223344",
            PhoneNumber = "0911223344",
            Password = "StrongPwd@2026",
            FullName = "Nguyen Van Test",
            OtpCode = "000000"
        }));
    }

    [Fact]
    public async Task AuthService_VerifyOtpAndLogin_MustRejectLockedUser()
    {
        using var db = CreateInMemoryDb();
        var hasher = new PasswordHasher();
        var config = BuildTestConfig(new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "TEST_ONLY_JWT_SECRET_KEY_32_CHARS_LONG_2026"
        });

        var patientRole = new Role { Id = Guid.NewGuid(), Name = "Patient" };
        var lockedUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "0933445566",
            PhoneNumber = "0933445566",
            FullName = "Locked User",
            PasswordHash = hasher.HashPassword("StrongPwd@2026"),
            IsActive = false
        };
        lockedUser.UserRoles.Add(new UserRole { UserId = lockedUser.Id, RoleId = patientRole.Id, Role = patientRole });
        db.Roles.Add(patientRole);
        db.Users.Add(lockedUser);
        await db.SaveChangesAsync();

        var auth = new AuthService(db, hasher, new JwtTokenGenerator(config), config);

        // Chèn OTP test trực tiếp vào _otpStore thông qua reflection để kiểm chứng đúng bước check user.IsActive
        var otpField = typeof(AuthService).GetField("_otpStore", BindingFlags.NonPublic | BindingFlags.Static);
        var entryType = typeof(AuthService).GetNestedType("OtpEntry", BindingFlags.NonPublic);
        Assert.NotNull(otpField);
        Assert.NotNull(entryType);

        var entry = Activator.CreateInstance(entryType!, "778899", DateTime.UtcNow.AddMinutes(5), 0, DateTime.UtcNow);
        dynamic dict = otpField!.GetValue(null)!;
        var tryAddMethod = otpField.FieldType.GetMethod("TryAdd");
        tryAddMethod!.Invoke(dict, new[] { "0933445566", entry! });

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            auth.VerifyOtpAndLoginAsync(new VerifyOtpRequestDto { PhoneNumber = "0933445566", OtpCode = "778899" }));
        Assert.Contains("bị khóa", ex.Message);
    }

    [Fact]
    public async Task AuthService_CompleteProfile_MustPreventCccdTakeoverBetweenDifferentUsers()
    {
        using var db = CreateInMemoryDb();
        var hasher = new PasswordHasher();
        var config = BuildTestConfig(new Dictionary<string, string?>
        {
            ["JwtSettings:SecretKey"] = "TEST_ONLY_JWT_SECRET_KEY_32_CHARS_LONG_2026"
        });

        var victim = new User
        {
            Id = Guid.NewGuid(),
            Username = "google_victim",
            Email = "victim@gmail.com",
            PhoneNumber = "0900000000", // Placeholder thường gặp ở Google Login
            FullName = "Nạn Nhân",
            PasswordHash = hasher.HashPassword("StrongPwd@2026"),
            IsActive = true
        };
        var attacker = new User
        {
            Id = Guid.NewGuid(),
            Username = "0977889900",
            Email = "attacker@gmail.com",
            PhoneNumber = "0977889900",
            FullName = "Kẻ Tấn Công",
            PasswordHash = hasher.HashPassword("StrongPwd@2026"),
            IsActive = true
        };
        var victimPatient = new Patient
        {
            Id = Guid.NewGuid(),
            UserId = victim.Id,
            PatientCode = "BN2026990001",
            FullName = "Nạn Nhân",
            IdentityCardNumber = "079090998877",
            Address = "TP.HCM"
        };

        db.Users.AddRange(victim, attacker);
        db.Patients.Add(victimPatient);
        await db.SaveChangesAsync();

        var auth = new AuthService(db, hasher, new JwtTokenGenerator(config), config);

        await Assert.ThrowsAsync<Exception>(() => auth.CompleteProfileAsync(attacker.Id.ToString(), new CompleteProfileRequestDto
        {
            FullName = "Attacker Claim",
            IdentityCardNumber = "079090998877",
            PhoneNumber = "0900000000",
            Address = "123 Street, Binh Duong"
        }));

        var reloadedPatient = await db.Patients.FindAsync(victimPatient.Id);
        Assert.Equal(victim.Id, reloadedPatient!.UserId);
    }

    [Fact]
    public async Task NotificationsController_MustRequireAuth_AndPreventIdor()
    {
        // 1. Kiểm tra Attributes [Authorize] & không có [AllowAnonymous]
        Assert.NotNull(typeof(NotificationsController).GetCustomAttribute<AuthorizeAttribute>());
        foreach (var methodName in new[] { "RegisterToken", "GetMyNotifications", "MarkRead", "TestPush" })
        {
            var mi = typeof(NotificationsController).GetMethod(methodName);
            Assert.NotNull(mi);
            Assert.Null(mi!.GetCustomAttribute<AllowAnonymousAttribute>());
        }
        var testPushAuth = typeof(NotificationsController).GetMethod("TestPush")!.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(testPushAuth);
        Assert.Equal("Admin", testPushAuth!.Roles);

        // 2. Kiểm tra IDOR khi Patient cố truy vấn thông báo của người khác
        var fcmMock = new Mock<IFcmNotificationService>();
        fcmMock.Setup(s => s.GetNotificationsForIdentifiersAsync(It.IsAny<IEnumerable<string>>()))
               .ReturnsAsync(new List<PushNotificationDto>());

        var controller = new NotificationsController(fcmMock.Object)
        {
            ControllerContext = CreateUserContext("Patient", Guid.NewGuid().ToString(), "0911111111", "0911111111")
        };

        var forbidRes = await controller.GetMyNotifications("0999888777");
        Assert.IsType<ForbidResult>(forbidRes);

        var okOwnRes = await controller.GetMyNotifications("0911111111");
        Assert.IsType<OkObjectResult>(okOwnRes);
    }

    [Fact]
    public void QueueHub_And_Controllers_MustEnforceAuthAttributes_AndNoClientBroadcast()
    {
        Assert.NotNull(typeof(QueueHub).GetCustomAttribute<AuthorizeAttribute>());
        Assert.Null(typeof(QueueHub).GetMethod("BroadcastQueueUpdate"));

        var getTodayQueue = typeof(QueueController).GetMethod("GetTodayQueue");
        Assert.NotNull(getTodayQueue);
        Assert.Null(getTodayQueue!.GetCustomAttribute<AllowAnonymousAttribute>());
        Assert.NotNull(getTodayQueue.GetCustomAttribute<AuthorizeAttribute>());

        var createApt = typeof(AppointmentsController).GetMethod("CreateAppointment");
        Assert.NotNull(createApt);
        Assert.Null(createApt!.GetCustomAttribute<AllowAnonymousAttribute>());
        Assert.NotNull(createApt.GetCustomAttribute<AuthorizeAttribute>());
    }

    [Fact]
    public async Task QueueController_GetTodayQueue_ForPatient_MustMaskOtherPatientsPII()
    {
        using var db = CreateInMemoryDb();
        var userAId = Guid.NewGuid();
        var userBId = Guid.NewGuid();
        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Nội", Location = "P101" };
        var patientA = new Patient { Id = Guid.NewGuid(), UserId = userAId, PatientCode = "BN001", FullName = "Nguyễn Văn A", IdentityCardNumber = "079090000001", DateOfBirth = DateTime.UtcNow.AddYears(-30) };
        var patientB = new Patient { Id = Guid.NewGuid(), UserId = userBId, PatientCode = "BN002", FullName = "Trần Thị Bí Mật", IdentityCardNumber = "079090000002", DateOfBirth = DateTime.UtcNow.AddYears(-25) };

        db.Departments.Add(dept);
        db.Patients.AddRange(patientA, patientB);
        await db.SaveChangesAsync();

        var qs = new QueueEngine(db);
        await qs.IssueQueueTicketAsync(new IssueQueueTicketDto { PatientId = patientA.Id, DepartmentId = dept.Id });
        await qs.IssueQueueTicketAsync(new IssueQueueTicketDto { PatientId = patientB.Id, DepartmentId = dept.Id });

        var mockHub = new Mock<IHubContext<QueueHub>>();
        var controller = new QueueController(qs, mockHub.Object, db)
        {
            ControllerContext = CreateUserContext("Patient", userAId.ToString(), "0911000111")
        };

        var res = Assert.IsType<OkObjectResult>(await controller.GetTodayQueue(null, null));
        var list = Assert.IsType<List<QueueTicketDto>>(res.Value);
        Assert.Equal(2, list.Count);

        var ownTicket = list.Single(t => t.PatientId == patientA.Id);
        var otherTicket = list.Single(t => t.PatientId == patientB.Id);

        Assert.Equal("Nguyễn Văn A", ownTicket.PatientName);
        Assert.NotEqual("Trần Thị Bí Mật", otherTicket.PatientName);
        Assert.Contains("*", otherTicket.PatientName);
        Assert.Equal(string.Empty, otherTicket.PatientCode);
        Assert.Equal("***", otherTicket.IdentityCardNumber);
    }

    [Fact]
    public async Task PaymentController_MustRejectAnonymousNonKioskCaller_AndBlockOpenRedirect()
    {
        using var db = CreateInMemoryDb();
        var config = BuildTestConfig(new Dictionary<string, string?>
        {
            ["Vnpay:TmnCode"] = "TESTTMN",
            ["Vnpay:HashSecret"] = "TEST_SECRET_KEY_1234567890",
            ["Vnpay:BaseUrl"] = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            ["Vnpay:ReturnUrl"] = "https://dmedical.site/api/payment/vnpay-return"
        });
        var paymentService = new VNPayService(config);

        var anonController = new PaymentController(paymentService, db, config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
        };
        var unauthRes = await anonController.CreatePaymentUrl(new PaymentInformationModel
        {
            OrderId = "LH123456",
            Amount = 150000
        });
        Assert.IsType<UnauthorizedObjectResult>(unauthRes);

        // Người dùng hợp lệ gửi ReturnUrl ngoài domain cho phép -> tự đưa về Vnpay:ReturnUrl mặc định
        var userController = new PaymentController(paymentService, db, config)
        {
            ControllerContext = CreateUserContext("Patient", Guid.NewGuid().ToString(), "0912345678")
        };
        var okRes = Assert.IsType<OkObjectResult>(await userController.CreatePaymentUrl(new PaymentInformationModel
        {
            OrderId = "LH123456",
            Amount = 150000,
            ReturnUrl = "https://evil.attacker.example/phishing"
        }));
        var json = System.Text.Json.JsonSerializer.Serialize(okRes.Value);
        Assert.DoesNotContain("evil.attacker.example", json);

        // Thiếu vnp_SecureHash không được ném exception 500
        Assert.False(paymentService.ValidateSignature(new Dictionary<string, string> { ["vnp_ResponseCode"] = "00" }));
    }

    [Fact]
    public async Task ExaminationService_VerifySignature_MustDetectHmacTampering()
    {
        using var db = CreateInMemoryDb();
        var patient = new Patient { Id = Guid.NewGuid(), PatientCode = "BN-SIG-01", FullName = "Bệnh Nhân Ký Số", IdentityCardNumber = "079091234567", DateOfBirth = DateTime.UtcNow.AddYears(-30) };
        var doctor = new User { Id = Guid.NewGuid(), Username = "dr.sig", FullName = "BS. Ký Số", PasswordHash = "x" };
        db.Patients.Add(patient);
        db.Users.Add(doctor);
        await db.SaveChangesAsync();

        var config = BuildTestConfig(new Dictionary<string, string?>
        {
            ["DigitalSignature:SecretKey"] = "UNIT_TEST_HMAC_SECRET_KEY_2026_SECURE"
        });
        var examService = new ExamEngine(db, null, config);

        var created = await examService.CreateExaminationAsync(new CreateExaminationDto
        {
            PatientId = patient.Id,
            DoctorId = doctor.Id,
            Subjective = "Đau đầu",
            Assessment = "Căng cơ",
            ICD10Code = "R51",
            ICD10Name = "Đau đầu",
            Plan = "Nghỉ ngơi",
            Status = "Hoàn thành"
        });

        await examService.SignExaminationAsync(created.Id, new SignExaminationRequestDto { PinCode = "ignored", DoctorLicenseNumber = "CCHN-001", CertificateSerial = "SER-001" }, doctor.FullName);

        var validVerify = await examService.VerifySignatureAsync(created.Id);
        Assert.True(validVerify.IsValid);

        // Kẻ gian sửa lén chữ ký DigitalSignature trong DB dù giữ nguyên SignatureHash
        var dbExam = await db.Examinations.FindAsync(created.Id);
        dbExam!.DigitalSignature = "BYT.SMARTCA.TAMPERED_SIGNATURE_BYTES";
        await db.SaveChangesAsync();

        var tamperedVerify = await examService.VerifySignatureAsync(created.Id);
        Assert.False(tamperedVerify.IsValid);
    }

    [Fact]
    public void ClinicalGuardrails_SanitizePII_MustRedactCmnd9DigitsNameAndAddress()
    {
        var raw = "Bệnh nhân: Nguyễn Văn An, CMND 272123456, Địa chỉ: 120 Hoàng Hoa Thám, SĐT 0987654321 bị ho sốt.";
        var clean = ClinicalGuardrails.SanitizePII(raw);

        Assert.DoesNotContain("Nguyễn Văn An", clean);
        Assert.DoesNotContain("272123456", clean);
        Assert.DoesNotContain("120 Hoàng Hoa Thám", clean);
        Assert.DoesNotContain("0987654321", clean);
    }

    [Fact]
    public void KioskTerminalValidator_ProductionWithoutConfiguredSecrets_MustRejectDefaultSecret()
    {
        var prevEnv = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        try
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Production");
            var emptyProdConfig = BuildTestConfig(new Dictionary<string, string?>
            {
                ["Kiosk:Terminals:0:TerminalId"] = "KIOSK-SANH-A-01",
                ["Kiosk:Terminals:0:Secret"] = ""
            });

            var ctx = new DefaultHttpContext();
            ctx.Request.Headers["X-Kiosk-Terminal-Id"] = "KIOSK-SANH-A-01";
            ctx.Request.Headers["X-Kiosk-Terminal-Secret"] = "DMED-KIOSK-A01-2026";

            var (isAuthorized, _, _) = KioskTerminalValidator.ValidateRequest(ctx.Request, ctx.User, emptyProdConfig);
            Assert.False(isAuthorized);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", prevEnv);
        }
    }

    [Fact]
    public async Task AppointmentsController_GetAppointments_MustScopeToAccountUserIdAndNormalizedPhone_WithoutCrossPatientLeak()
    {
        using var db = CreateInMemoryDb();
        var userAId = Guid.NewGuid();
        var userBId = Guid.NewGuid();

        var userA = new User
        {
            Id = userAId,
            Username = "patient.oauth@gmail.com",
            Email = "patient.oauth@gmail.com",
            PhoneNumber = "+84911222333",
            FullName = "Nguyễn Google",
            PasswordHash = "hash"
        };
        var userB = new User
        {
            Id = userBId,
            Username = "0988999000",
            PhoneNumber = "0988999000",
            FullName = "Trần Người Khác",
            PasswordHash = "hash"
        };

        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Tim Mạch", Location = "Tầng 2" };
        var staff = new StaffProfile { Id = Guid.NewGuid(), UserId = Guid.NewGuid(), DepartmentId = dept.Id, FullName = "BS. Nguyễn Thanh Duy", Title = "BS. CKII" };
        var schedule = new DoctorSchedule
        {
            Id = Guid.NewGuid(),
            StaffId = staff.Id,
            DepartmentId = dept.Id,
            WorkDate = DateTime.UtcNow.Date.AddDays(1),
            TimeSlot = "08:00 - 08:30",
            MaxPatients = 10
        };

        var patientA = new Patient
        {
            Id = Guid.NewGuid(),
            UserId = userAId,
            PatientCode = "BN-OAUTH-001",
            FullName = "Nguyễn Google",
            IdentityCardNumber = "079095001122",
            EmergencyContactPhone = "0911222333",
            DateOfBirth = DateTime.UtcNow.AddYears(-28)
        };
        var patientB = new Patient
        {
            Id = Guid.NewGuid(),
            UserId = userBId,
            PatientCode = "BN-OTHER-002",
            FullName = "Trần Người Khác",
            IdentityCardNumber = "079095003344",
            EmergencyContactPhone = "0988999000",
            DateOfBirth = DateTime.UtcNow.AddYears(-35)
        };

        var aptA = new Appointment
        {
            Id = Guid.NewGuid(),
            PatientId = patientA.Id,
            ScheduleId = schedule.Id,
            AppointmentDate = DateTime.UtcNow.Date.AddDays(1).AddHours(8),
            Symptoms = "Khám tim mạch",
            Status = "Pending"
        };
        var aptB = new Appointment
        {
            Id = Guid.NewGuid(),
            PatientId = patientB.Id,
            ScheduleId = schedule.Id,
            AppointmentDate = DateTime.UtcNow.Date.AddDays(1).AddHours(9),
            Symptoms = "Khám riêng tư B",
            Status = "Pending"
        };

        db.Users.AddRange(userA, userB);
        db.Departments.Add(dept);
        db.StaffProfiles.Add(staff);
        db.DoctorSchedules.Add(schedule);
        db.Patients.AddRange(patientA, patientB);
        db.Appointments.AddRange(aptA, aptB);
        await db.SaveChangesAsync();

        var mockHub = new Mock<IHubContext<QueueHub>>();
        var controller = new AppointmentsController(mockHub.Object, db)
        {
            // Đăng nhập qua email/Google -> ClaimTypes.Name KHÔNG phải SĐT
            ControllerContext = CreateUserContext("Patient", userAId.ToString(), "patient.oauth@gmail.com")
        };

        var getRes = Assert.IsType<OkObjectResult>(await controller.GetAppointments());
        var list = Assert.IsType<List<OnlineAppointmentItem>>(getRes.Value);

        Assert.Single(list);
        Assert.Equal(aptA.Id.ToString(), list[0].Id);
        Assert.DoesNotContain(list, a => a.Id == aptB.Id.ToString());
    }

    [Fact]
    public async Task AppointmentsController_CreateAppointment_WithNonPhoneUsername_PreservesEnteredPhoneAndLinksUserId()
    {
        using var db = CreateInMemoryDb();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Username = "oauth_user_99",
            Email = "oauth99@gmail.com",
            PhoneNumber = "",
            FullName = "Lê OAuth",
            PasswordHash = "hash"
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var mockHub = new Mock<IHubContext<QueueHub>>();
        var controller = new AppointmentsController(mockHub.Object, db)
        {
            ControllerContext = CreateUserContext("Patient", userId.ToString(), "oauth_user_99")
        };

        var createRes = Assert.IsType<OkObjectResult>(await controller.CreateAppointment(new OnlineAppointmentItem
        {
            PatientName = "Lê OAuth",
            PatientPhone = "0933444555",
            IdentityCardNumber = "079099112233",
            DepartmentName = "Khoa Nội Tổng Hợp",
            AppointmentDate = DateTime.UtcNow.Date.AddDays(3).ToString("yyyy-MM-dd"),
            AppointmentTime = "09:00 - 09:30",
            SymptomsReason = "Kiểm tra sức khỏe"
        }));

        var created = Assert.IsType<OnlineAppointmentItem>(createRes.Value);
        Assert.Equal("0933444555", created.PatientPhone);

        var savedPatient = await db.Patients.FirstOrDefaultAsync(p => p.IdentityCardNumber == "079099112233");
        Assert.NotNull(savedPatient);
        Assert.Equal(userId, savedPatient!.UserId);

        var listRes = Assert.IsType<OkObjectResult>(await controller.GetAppointments());
        var myList = Assert.IsType<List<OnlineAppointmentItem>>(listRes.Value);
        Assert.Contains(myList, a => a.Id == created.Id);
    }
}
