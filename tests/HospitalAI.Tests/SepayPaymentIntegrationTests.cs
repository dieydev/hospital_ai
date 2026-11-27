using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.ExaminationService.Controllers;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using HospitalAI.QueueService.Controllers;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace HospitalAI.Tests;

public class SepayPaymentIntegrationTests
{
    private const string TestWebhookSecret = "ephemeral-unit-test-hmac-secret-2026-not-real";
    private const string TestSandboxAccount = "0000000001";

    private static HospitalDbContext CreateInMemoryDb(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseInMemoryDatabase(dbName ?? $"SepayTestDb_{Guid.NewGuid()}")
            .Options;
        return new HospitalDbContext(options);
    }

    private static IConfiguration BuildSepayConfig(
        string? secret = TestWebhookSecret,
        string? accountNumber = TestSandboxAccount,
        string? toleranceSeconds = "3600")
    {
        var dict = new Dictionary<string, string?>
        {
            ["Sepay:Environment"] = "Sandbox",
            ["Sepay:BankCode"] = "MB",
            ["Sepay:BankBin"] = "970422",
            ["Sepay:AccountName"] = "HOSPITAL AI DEMO",
            ["Sepay:PaymentPrefix"] = "HAI",
            ["Vnpay:TmnCode"] = "TESTTMN",
            ["Vnpay:HashSecret"] = "TEST_VNPAY_SECRET_1234567890",
            ["Vnpay:BaseUrl"] = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            ["Vnpay:ReturnUrl"] = "https://dmedical.site/api/payment/vnpay-return"
        };

        if (secret != null) dict["Sepay:WebhookSecret"] = secret;
        if (accountNumber != null) dict["Sepay:AccountNumber"] = accountNumber;
        if (toleranceSeconds != null) dict["Sepay:TimestampToleranceSeconds"] = toleranceSeconds;

        return new ConfigurationBuilder()
            .AddInMemoryCollection(dict)
            .Build();
    }

    private static string SignRawPayload(string rawBody, long timestampSeconds, string secret = TestWebhookSecret)
    {
        var data = Encoding.UTF8.GetBytes($"{timestampSeconds}.{rawBody}");
        var key = Encoding.UTF8.GetBytes(secret);
        var hash = HMACSHA256.HashData(key, data);
        return $"sha256={Convert.ToHexString(hash).ToLowerInvariant()}";
    }

    private static void AttachSignedWebhookRequest(
        ControllerBase controller,
        string rawBody,
        long timestampSeconds,
        string? overrideSignature = null,
        string secret = TestWebhookSecret)
    {
        var httpContext = new DefaultHttpContext();
        var bytes = Encoding.UTF8.GetBytes(rawBody);
        httpContext.Request.Body = new MemoryStream(bytes);
        httpContext.Request.ContentType = "application/json";
        httpContext.Request.Headers["X-SePay-Timestamp"] = timestampSeconds.ToString();
        httpContext.Request.Headers["X-SePay-Signature"] = overrideSignature ?? SignRawPayload(rawBody, timestampSeconds, secret);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    private static string BuildSepayJson(
        long id,
        decimal transferAmount,
        string? code = null,
        string? content = null,
        string accountNumber = TestSandboxAccount,
        string transferType = "in",
        string? description = null,
        string referenceCode = "FT2633100001")
    {
        var obj = new
        {
            id,
            gateway = "MBBank",
            transactionDate = "2026-11-27 12:00:00",
            accountNumber,
            subAccount = "",
            code,
            content = content ?? $"CHUYEN KHOAN {code}",
            transferType,
            description = description ?? $"HOSPITAL AI DEMO {code}",
            transferAmount,
            accumulated = 5000000,
            referenceCode
        };
        return JsonSerializer.Serialize(obj);
    }

    private static ClaimsPrincipal BuildPrincipal(string role, string name = "cashier_test", string? userId = null)
    {
        return new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.Name, name),
            new Claim(ClaimTypes.NameIdentifier, userId ?? Guid.NewGuid().ToString())
        }, "TestAuth"));
    }

    private static IHubContext<QueueHub> CreateMockHub()
    {
        var hubMock = new Mock<IHubContext<QueueHub>>();
        var clientsMock = new Mock<IHubClients>();
        var proxyMock = new Mock<IClientProxy>();
        clientsMock.Setup(c => c.All).Returns(proxyMock.Object);
        hubMock.Setup(h => h.Clients).Returns(clientsMock.Object);
        return hubMock.Object;
    }

    private sealed class FailingSaveHospitalDbContext : HospitalDbContext
    {
        public FailingSaveHospitalDbContext(DbContextOptions<HospitalDbContext> options) : base(options) { }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            throw new DbUpdateException("Simulated DB failure before commit", new Exception("SQL error"));
        }
    }

    [Fact]
    public async Task SepayWebhook_MissingSecret_MustFailClosedWith401()
    {
        using var db = CreateInMemoryDb();
        var config = BuildSepayConfig(secret: string.Empty);
        var controller = new PaymentController(new VNPayService(config), db, config);

        var now = DateTimeOffset.UtcNow;
        var raw = BuildSepayJson(1001, 150000m, "HAI11223344");
        AttachSignedWebhookRequest(controller, raw, now.ToUnixTimeSeconds(), overrideSignature: "sha256=" + new string('a', 64));

        var res = Assert.IsType<ObjectResult>(await controller.ReceiveSepayWebhook());
        Assert.Equal(401, res.StatusCode);
        Assert.Contains("\"success\":false", JsonSerializer.Serialize(res.Value));
    }

    [Fact]
    public async Task SepayWebhook_MissingAccountNumber_MustFailClosedWith503()
    {
        using var db = CreateInMemoryDb();
        var config = BuildSepayConfig(accountNumber: string.Empty);
        var controller = new PaymentController(new VNPayService(config), db, config);

        var now = DateTimeOffset.UtcNow;
        var raw = BuildSepayJson(1002, 150000m, "HAI11223344");
        AttachSignedWebhookRequest(controller, raw, now.ToUnixTimeSeconds());

        var res = Assert.IsType<ObjectResult>(await controller.ReceiveSepayWebhook());
        Assert.Equal(503, res.StatusCode);
        Assert.Contains("\"success\":false", JsonSerializer.Serialize(res.Value));
    }

    [Fact]
    public async Task SepayWebhook_InvalidSignature_AndRawBodyTampering_MustReject401()
    {
        using var db = CreateInMemoryDb();
        var config = BuildSepayConfig();
        var fixedNow = new DateTimeOffset(2026, 11, 27, 5, 0, 0, TimeSpan.Zero);
        var controller = new PaymentController(new VNPayService(config), db, config, utcNowProvider: () => fixedNow);

        var raw = BuildSepayJson(1003, 150000m, "HAI11223344");
        // Chữ ký đúng nhưng dùng sai key
        AttachSignedWebhookRequest(controller, raw, fixedNow.ToUnixTimeSeconds(), secret: "wrong-secret");
        var wrongSigRes = Assert.IsType<ObjectResult>(await controller.ReceiveSepayWebhook());
        Assert.Equal(401, wrongSigRes.StatusCode);

        // Ký trên chuỗi đã chèn thêm 1 khoảng trắng rồi gửi raw khác -> bắt buộc lỗi chữ ký raw body
        var modifiedBody = raw + " ";
        var sigForOriginal = SignRawPayload(raw, fixedNow.ToUnixTimeSeconds());
        AttachSignedWebhookRequest(controller, modifiedBody, fixedNow.ToUnixTimeSeconds(), overrideSignature: sigForOriginal);
        var tamperedRes = Assert.IsType<ObjectResult>(await controller.ReceiveSepayWebhook());
        Assert.Equal(401, tamperedRes.StatusCode);
    }

    [Fact]
    public async Task SepayWebhook_ExpiredTimestamp_AndZeroToleranceBypassAttempt_MustReject401()
    {
        using var db = CreateInMemoryDb();
        var fixedNow = new DateTimeOffset(2026, 11, 27, 5, 0, 0, TimeSpan.Zero);
        var config = BuildSepayConfig(toleranceSeconds: "3600");
        var controller = new PaymentController(new VNPayService(config), db, config, utcNowProvider: () => fixedNow);

        var raw = BuildSepayJson(1004, 150000m, "HAI11223344");
        // Quá 1 giờ (3605 giây) -> từ chối
        var expiredTs = fixedNow.ToUnixTimeSeconds() - 3605;
        AttachSignedWebhookRequest(controller, raw, expiredTs);
        var expiredRes = Assert.IsType<ObjectResult>(await controller.ReceiveSepayWebhook());
        Assert.Equal(401, expiredRes.StatusCode);

        // Cố cấu hình tolerance = 0 để tắt check timestamp -> vẫn fail-closed 401
        var bypassConfig = BuildSepayConfig(toleranceSeconds: "0");
        var bypassCtrl = new PaymentController(new VNPayService(bypassConfig), db, bypassConfig, utcNowProvider: () => fixedNow);
        AttachSignedWebhookRequest(bypassCtrl, raw, fixedNow.ToUnixTimeSeconds());
        var bypassRes = Assert.IsType<ObjectResult>(await bypassCtrl.ReceiveSepayWebhook());
        Assert.Equal(401, bypassRes.StatusCode);
    }

    [Fact]
    public async Task SepayWebhook_LateRetryWithinSePayWindow_MustVerifyAndHandleIdempotently()
    {
        using var db = CreateInMemoryDb();
        var fixedNow = new DateTimeOffset(2026, 11, 27, 5, 30, 0, TimeSpan.Zero);
        var config = BuildSepayConfig(toleranceSeconds: "3600");

        var patient = new Patient { Id = Guid.NewGuid(), PatientCode = "BN-RETRY-01", FullName = "Bệnh Nhân Retry", IdentityCardNumber = "079095111222" };
        var bill = new Billing
        {
            Id = Guid.NewGuid(),
            PatientId = patient.Id,
            BillingType = "Registration",
            TotalAmount = 150000m,
            Status = "Unpaid",
            PaymentCode = "HAIABCDEF12"
        };
        db.Patients.Add(patient);
        db.Billings.Add(bill);
        await db.SaveChangesAsync();

        var controller = new PaymentController(new VNPayService(config), db, config, utcNowProvider: () => fixedNow);
        var raw = BuildSepayJson(2001, 150000m, "HAIABCDEF12");

        // Retry đến muộn 20 phút (1200s < 3600s trong chu kỳ retry Fibonacci 33 phút của SePay)
        var delayedTs = fixedNow.ToUnixTimeSeconds() - 1200;
        AttachSignedWebhookRequest(controller, raw, delayedTs);
        var ok1 = Assert.IsType<OkObjectResult>(await controller.ReceiveSepayWebhook());
        Assert.Contains("\"success\":true", JsonSerializer.Serialize(ok1.Value));

        var settledBill = await db.Billings.FindAsync(bill.Id);
        Assert.Equal("Paid", settledBill!.Status);
        Assert.Equal("SEPAY-2001", settledBill.TransactionRef);

        // Retry thêm 1 lần ở phút 30 -> vẫn thành công idempotent, không tạo log trùng
        var delayedTs2 = fixedNow.ToUnixTimeSeconds() - 1800;
        AttachSignedWebhookRequest(controller, raw, delayedTs2);
        var ok2 = Assert.IsType<OkObjectResult>(await controller.ReceiveSepayWebhook());
        Assert.Contains("\"success\":true", JsonSerializer.Serialize(ok2.Value));
        Assert.Equal(1, await db.SepayWebhookTransactions.CountAsync(t => t.SepayTransactionId == 2001));
    }

    [Fact]
    public async Task SepayWebhook_ValidExactTransaction_ShouldSettleBillingAppointmentAndExam_AndSupportFractionalDecimal()
    {
        using var db = CreateInMemoryDb();
        var fixedNow = new DateTimeOffset(2026, 11, 27, 5, 0, 0, TimeSpan.Zero);
        var config = BuildSepayConfig();

        var patient = new Patient { Id = Guid.NewGuid(), PatientCode = "BN-OK-01", FullName = "Trần Minh Khoa", IdentityCardNumber = "079092001122" };
        var schedule = new DoctorSchedule { Id = Guid.NewGuid(), WorkDate = DateTime.UtcNow.Date, TimeSlot = "08:00 - 08:30", MaxPatients = 5 };
        var apt = new Appointment { Id = Guid.NewGuid(), PatientId = patient.Id, ScheduleId = schedule.Id, AppointmentDate = DateTime.UtcNow.Date.AddHours(8), Status = "Pending" };
        var exam = new Examination { Id = Guid.NewGuid(), PatientId = patient.Id, ExaminationCode = "LK-OK-01", Status = "Pending" };
        var bill = new Billing
        {
            Id = Guid.NewGuid(),
            PatientId = patient.Id,
            AppointmentId = apt.Id,
            ExaminationId = exam.Id,
            BillingType = "Registration",
            TotalAmount = 150000.50m, // Kiểm tra giữ nguyên thập phân
            Status = "Unpaid",
            PaymentCode = "HAI8899AABB"
        };

        db.Patients.Add(patient);
        db.DoctorSchedules.Add(schedule);
        db.Appointments.Add(apt);
        db.Examinations.Add(exam);
        db.Billings.Add(bill);
        await db.SaveChangesAsync();

        var controller = new PaymentController(new VNPayService(config), db, config, utcNowProvider: () => fixedNow);
        var raw = BuildSepayJson(3001, 150000.50m, code: null, content: "CHUYEN KHOAN HAI8899AABB TIEN KHAM");
        AttachSignedWebhookRequest(controller, raw, fixedNow.ToUnixTimeSeconds());

        var res = Assert.IsType<OkObjectResult>(await controller.ReceiveSepayWebhook());
        Assert.Contains("\"success\":true", JsonSerializer.Serialize(res.Value));

        var updatedBill = await db.Billings.FindAsync(bill.Id);
        Assert.Equal("Paid", updatedBill!.Status);
        Assert.Equal("Chuyển khoản VietQR (SePay)", updatedBill.PaymentMethod);
        Assert.Equal("SEPAY-3001", updatedBill.TransactionRef);

        var updatedApt = await db.Appointments.FindAsync(apt.Id);
        Assert.Equal("Confirmed", updatedApt!.Status);

        var updatedExam = await db.Examinations.FindAsync(exam.Id);
        Assert.Equal("Paid", updatedExam!.Status);

        var log = await db.SepayWebhookTransactions.SingleAsync(t => t.SepayTransactionId == 3001);
        Assert.Equal("Processed", log.ProcessingStatus);
        Assert.Equal(0m, log.DiscrepancyAmount);
    }

    [Fact]
    public async Task SepayWebhook_WrongAccount_InvalidCode_AndOutTransfer_MustIgnoreWithoutSettling()
    {
        using var db = CreateInMemoryDb();
        var fixedNow = new DateTimeOffset(2026, 11, 27, 5, 0, 0, TimeSpan.Zero);
        var config = BuildSepayConfig();

        var bill = new Billing
        {
            Id = Guid.NewGuid(),
            BillingType = "Registration",
            TotalAmount = 150000m,
            Status = "Unpaid",
            PaymentCode = "HAI11112222"
        };
        db.Billings.Add(bill);
        await db.SaveChangesAsync();

        var controller = new PaymentController(new VNPayService(config), db, config, utcNowProvider: () => fixedNow);

        // 1. Sai tài khoản nhận
        AttachSignedWebhookRequest(controller, BuildSepayJson(4001, 150000m, "HAI11112222", accountNumber: "9999999999"), fixedNow.ToUnixTimeSeconds());
        await controller.ReceiveSepayWebhook();

        // 2. Sai mã hóa đơn
        AttachSignedWebhookRequest(controller, BuildSepayJson(4002, 150000m, "HAI99998888"), fixedNow.ToUnixTimeSeconds());
        await controller.ReceiveSepayWebhook();

        // 3. Giao dịch tiền ra ("out")
        AttachSignedWebhookRequest(controller, BuildSepayJson(4003, 150000m, "HAI11112222", transferType: "out"), fixedNow.ToUnixTimeSeconds());
        await controller.ReceiveSepayWebhook();

        var unchangedBill = await db.Billings.FindAsync(bill.Id);
        Assert.Equal("Unpaid", unchangedBill!.Status);
        Assert.Null(unchangedBill.TransactionRef);

        Assert.Equal("Ignored_WrongAccount", (await db.SepayWebhookTransactions.SingleAsync(t => t.SepayTransactionId == 4001)).ProcessingStatus);
        Assert.Equal("Ignored_NotFound", (await db.SepayWebhookTransactions.SingleAsync(t => t.SepayTransactionId == 4002)).ProcessingStatus);
        Assert.Equal("Ignored_OutTransfer", (await db.SepayWebhookTransactions.SingleAsync(t => t.SepayTransactionId == 4003)).ProcessingStatus);
    }

    [Fact]
    public async Task SepayWebhook_Underpaid_And_Overpaid_MustRecordDiscrepancyAndKeepUnpaid()
    {
        using var db = CreateInMemoryDb();
        var fixedNow = new DateTimeOffset(2026, 11, 27, 5, 0, 0, TimeSpan.Zero);
        var config = BuildSepayConfig();

        var bill = new Billing
        {
            Id = Guid.NewGuid(),
            BillingType = "Registration",
            TotalAmount = 150000.50m,
            Status = "Unpaid",
            PaymentCode = "HAI33334444"
        };
        db.Billings.Add(bill);
        await db.SaveChangesAsync();

        var controller = new PaymentController(new VNPayService(config), db, config, utcNowProvider: () => fixedNow);

        // Thiếu 0.50đ -> Không được ép kiểu (long) làm mất phần thập phân
        AttachSignedWebhookRequest(controller, BuildSepayJson(5001, 150000.00m, "HAI33334444"), fixedNow.ToUnixTimeSeconds());
        await controller.ReceiveSepayWebhook();

        // Thừa tiền -> Cũng không được tự chốt hay bỏ qua chênh lệch
        AttachSignedWebhookRequest(controller, BuildSepayJson(5002, 200000.50m, "HAI33334444"), fixedNow.ToUnixTimeSeconds());
        await controller.ReceiveSepayWebhook();

        var refreshed = await db.Billings.FindAsync(bill.Id);
        Assert.Equal("Unpaid", refreshed!.Status);
        Assert.Contains("Chuyển thiếu tiền", refreshed.DiscrepancyNote);
        Assert.Contains("Chuyển thừa tiền", refreshed.DiscrepancyNote);

        var underLog = await db.SepayWebhookTransactions.SingleAsync(t => t.SepayTransactionId == 5001);
        Assert.Equal("Discrepancy_Underpaid", underLog.ProcessingStatus);
        Assert.Equal(-0.50m, underLog.DiscrepancyAmount);

        var overLog = await db.SepayWebhookTransactions.SingleAsync(t => t.SepayTransactionId == 5002);
        Assert.Equal("Discrepancy_Overpaid", overLog.ProcessingStatus);
        Assert.Equal(50000m, overLog.DiscrepancyAmount);
    }

    [Fact]
    public async Task SepayWebhook_CancelledOrAlreadyPaidCash_MustRecordAuditWithoutOverwritingBilling()
    {
        using var db = CreateInMemoryDb();
        var fixedNow = new DateTimeOffset(2026, 11, 27, 5, 0, 0, TimeSpan.Zero);
        var config = BuildSepayConfig();

        var cancelledBill = new Billing
        {
            Id = Guid.NewGuid(),
            BillingType = "Registration",
            TotalAmount = 150000m,
            Status = "Cancelled",
            PaymentCode = "HAICA000001"
        };
        var cashPaidBill = new Billing
        {
            Id = Guid.NewGuid(),
            BillingType = "Registration",
            TotalAmount = 150000m,
            Status = "Unpaid",
            PaymentCode = "HAICA540001"
        };
        db.Billings.AddRange(cancelledBill, cashPaidBill);
        await db.SaveChangesAsync();

        // Thu ngân thu tiền mặt trước
        var billingCtrl = new BillingController(db, config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Cashier") } }
        };
        Assert.IsType<OkObjectResult>(await billingCtrl.PayCash(cashPaidBill.Id));

        // Sau đó SePay webhook đến cho cả 2 hóa đơn
        var payCtrl = new PaymentController(new VNPayService(config), db, config, utcNowProvider: () => fixedNow);
        AttachSignedWebhookRequest(payCtrl, BuildSepayJson(6001, 150000m, "HAICA000001"), fixedNow.ToUnixTimeSeconds());
        await payCtrl.ReceiveSepayWebhook();

        AttachSignedWebhookRequest(payCtrl, BuildSepayJson(6002, 150000m, "HAICA540001"), fixedNow.ToUnixTimeSeconds());
        await payCtrl.ReceiveSepayWebhook();

        var dbCancelled = await db.Billings.FindAsync(cancelledBill.Id);
        Assert.Equal("Cancelled", dbCancelled!.Status);
        Assert.Contains("đã hủy", dbCancelled.DiscrepancyNote);
        Assert.Equal("Late_AfterCancelled", (await db.SepayWebhookTransactions.SingleAsync(t => t.SepayTransactionId == 6001)).ProcessingStatus);

        var dbCash = await db.Billings.FindAsync(cashPaidBill.Id);
        Assert.Equal("Paid", dbCash!.Status);
        Assert.Equal("Tiền mặt", dbCash.PaymentMethod);
        Assert.Null(dbCash.TransactionRef); // Không bị ghi đè thành SEPAY-6002
        Assert.Contains("sau khi hóa đơn đã đóng", dbCash.DiscrepancyNote);
        Assert.Equal("Late_AfterPaid", (await db.SepayWebhookTransactions.SingleAsync(t => t.SepayTransactionId == 6002)).ProcessingStatus);
    }

    [Fact]
    public async Task SepayWebhook_WhenDatabaseSaveFails_MustReturn500AndNeverSuccessTrue()
    {
        var dbName = $"SepayDbFail_{Guid.NewGuid()}";
        var billId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        using (var setupDb = new HospitalDbContext(options))
        {
            setupDb.Billings.Add(new Billing
            {
                Id = billId,
                BillingType = "Registration",
                TotalAmount = 150000m,
                Status = "Unpaid",
                PaymentCode = "HAIDBFA1101"
            });
            await setupDb.SaveChangesAsync();
        }

        using var failingDb = new FailingSaveHospitalDbContext(options);
        var fixedNow = new DateTimeOffset(2026, 11, 27, 5, 0, 0, TimeSpan.Zero);
        var config = BuildSepayConfig();
        var controller = new PaymentController(new VNPayService(config), failingDb, config, utcNowProvider: () => fixedNow);

        AttachSignedWebhookRequest(controller, BuildSepayJson(7001, 150000m, "HAIDBFA1101"), fixedNow.ToUnixTimeSeconds());
        var res = Assert.IsType<ObjectResult>(await controller.ReceiveSepayWebhook());
        Assert.Equal(500, res.StatusCode);
        Assert.Contains("\"success\":false", JsonSerializer.Serialize(res.Value));
    }

    [Fact]
    public async Task Booking_Kiosk_Cashier_VnPay_MustShareSingleBillingWithoutDuplicates()
    {
        var dbName = $"SingleBillingLifecycle_{Guid.NewGuid()}";
        using var db = CreateInMemoryDb(dbName);
        var config = BuildSepayConfig();

        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Nội Tổng Hợp", Location = "P102" };
        var staff = new StaffProfile { Id = Guid.NewGuid(), FullName = "BS. Duy", DepartmentId = dept.Id };
        var vnNow = AppointmentsController.GetVietnamNow();
        var schedule = new DoctorSchedule
        {
            Id = Guid.NewGuid(),
            StaffId = staff.Id,
            DepartmentId = dept.Id,
            WorkDate = vnNow.Date,
            TimeSlot = "09:00 - 09:30",
            MaxPatients = 5
        };
        var userId = Guid.NewGuid();
        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PatientCode = "BN-UNIFIED-01",
            FullName = "Lê Thị Hương",
            IdentityCardNumber = "079096001122",
            EmergencyContactPhone = "0909111222"
        };

        db.Departments.Add(dept);
        db.StaffProfiles.Add(staff);
        db.DoctorSchedules.Add(schedule);
        db.Patients.Add(patient);
        await db.SaveChangesAsync();

        var aptController = new AppointmentsController(CreateMockHub(), db, config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Patient", "0909111222", userId.ToString()) } }
        };

        // 1. Bệnh nhân đặt Gói khám / Tái khám Online (đã định giá trước) -> tự tạo duy nhất 1 hóa đơn Registration (HAI...)
        var aptRes = Assert.IsType<OkObjectResult>(await aptController.CreateAppointment(new OnlineAppointmentItem
        {
            PatientCode = patient.PatientCode,
            PatientName = patient.FullName,
            PatientPhone = "0909111222",
            IdentityCardNumber = patient.IdentityCardNumber,
            DepartmentName = dept.DepartmentName,
            DoctorName = staff.FullName,
            AppointmentDate = vnNow.Date.ToString("yyyy-MM-dd"),
            AppointmentTime = "09:00",
            AppointmentType = "Package",
            PackageName = "Gói Khám Tổng Quát",
            RequestedFeeAmount = 150000m
        }));
        var aptDto = Assert.IsType<OnlineAppointmentItem>(aptRes.Value);
        Assert.NotNull(aptDto.BillingId);
        Assert.Matches("^HAI[A-F0-9]{8}$", aptDto.PaymentCode!);
        Assert.Equal("Unpaid", aptDto.PaymentStatus);

        // 2. Bệnh nhân đến Kiosk check-in QR -> không tạo thêm hóa đơn thứ 2
        var kioskController = new KioskController(db, new HospitalAI.Infrastructure.Services.QueueService(db), CreateMockHub(), config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Receptionist", "tieptan01") } }
        };
        var kioskRes = Assert.IsType<OkObjectResult>(await kioskController.CheckIn(new KioskCheckInRequestDto { QrCodeOrCode = aptDto.Id }));
        var kioskPayload = Assert.IsType<KioskCheckInResponseDto>(kioskRes.Value);
        Assert.Equal("SUCCESS", kioskPayload.Outcome);
        Assert.Equal(aptDto.BillingId, kioskPayload.UnpaidBilling!.BillingId);
        Assert.Equal(1, await db.Billings.CountAsync());

        // 3. Tạo URL VNPay với AppointmentId -> tự trỏ về đúng BillingId đó (không tạo giao dịch tách rời)
        var paymentController = new PaymentController(new VNPayService(config), db, config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Patient", "0909111222", userId.ToString()) } }
        };
        var vnpRes = Assert.IsType<OkObjectResult>(await paymentController.CreatePaymentUrl(new PaymentInformationModel
        {
            OrderId = aptDto.Id,
            Amount = 150000
        }));
        Assert.Contains(aptDto.BillingId.Value.ToString(), JsonSerializer.Serialize(vnpRes.Value));

        // 4. Thu ngân xem danh sách hóa đơn thấy đúng mã thanh toán HAI... đó
        var billingCtrl = new BillingController(db, config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Cashier", "thungan01") } }
        };
        var statusRes = Assert.IsType<OkObjectResult>(await billingCtrl.GetBillingStatus(aptDto.BillingId.Value));
        var summary = Assert.IsType<BillingStatusSummaryDto>(statusRes.Value);
        Assert.Equal(aptDto.PaymentCode, summary.PaymentCode);
        Assert.Equal("Unpaid", summary.Status);
    }

    [Fact]
    public async Task Concurrency_SimultaneousSepayAndCashAndManualTransfer_OnlyOneSettles()
    {
        var dbName = $"BillingConcurrency_{Guid.NewGuid()}";
        var billId = Guid.NewGuid();
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        using (var setupDb = new HospitalDbContext(options))
        {
            setupDb.Billings.Add(new Billing
            {
                Id = billId,
                BillingType = "Registration",
                TotalAmount = 150000m,
                Status = "Unpaid",
                PaymentCode = "HAIC00C0001"
            });
            await setupDb.SaveChangesAsync();
        }

        var config = BuildSepayConfig();
        var fixedNow = new DateTimeOffset(2026, 11, 27, 5, 0, 0, TimeSpan.Zero);

        var t1 = Task.Run(async () =>
        {
            using var db1 = new HospitalDbContext(options);
            var ctrl1 = new PaymentController(new VNPayService(config), db1, config, utcNowProvider: () => fixedNow);
            AttachSignedWebhookRequest(ctrl1, BuildSepayJson(8001, 150000m, "HAIC00C0001"), fixedNow.ToUnixTimeSeconds());
            await ctrl1.ReceiveSepayWebhook();
        });

        var t2 = Task.Run(async () =>
        {
            using var db2 = new HospitalDbContext(options);
            var ctrl2 = new BillingController(db2, config)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Cashier") } }
            };
            await ctrl2.PayCash(billId);
        });

        var t3 = Task.Run(async () =>
        {
            using var db3 = new HospitalDbContext(options);
            var ctrl3 = new BillingController(db3, config)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Cashier") } }
            };
            await ctrl3.PayTransfer(billId, "MANUAL-REF-8001");
        });

        var t4 = Task.Run(async () =>
        {
            using var db4 = new HospitalDbContext(options);
            var ctrl4 = new PaymentController(new VNPayService(config), db4, config, utcNowProvider: () => fixedNow);
            AttachSignedWebhookRequest(ctrl4, BuildSepayJson(8001, 150000m, "HAIC00C0001"), fixedNow.ToUnixTimeSeconds());
            await ctrl4.ReceiveSepayWebhook();
        });

        await Task.WhenAll(t1, t2, t3, t4);

        using var verifyDb = new HospitalDbContext(options);
        var finalBill = await verifyDb.Billings.FindAsync(billId);
        Assert.Equal("Paid", finalBill!.Status);
        Assert.NotNull(finalBill.PaymentMethod);

        // Chỉ đúng 1 bản ghi SePay log (hoặc Processed hoặc Late_AfterPaid), không trùng lặp
        var logs = await verifyDb.SepayWebhookTransactions.Where(l => l.SepayTransactionId == 8001).ToListAsync();
        Assert.Single(logs);
    }

    [Fact]
    public async Task Way1_NewVisit_Booking_Kiosk_TriageRoute_CashierSepay_EndToEnd()
    {
        var dbName = $"Way1TriageFirst_{Guid.NewGuid()}";
        using var db = CreateInMemoryDb(dbName);
        var config = BuildSepayConfig();
        var vnNow = AppointmentsController.GetVietnamNow();

        var noiDept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Nội Tổng Hợp", Location = "P102" };
        var cardioDept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Tim Mạch Can Thiệp", Location = "P301" };
        var gastroDept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Tiêu Hóa & Gan Mật", Location = "P201" };
        var staff = new StaffProfile { Id = Guid.NewGuid(), FullName = "BS Sàng Lọc", DepartmentId = noiDept.Id };
        var schedule = new DoctorSchedule
        {
            Id = Guid.NewGuid(),
            StaffId = staff.Id,
            DepartmentId = noiDept.Id,
            WorkDate = vnNow.Date,
            TimeSlot = "10:00",
            MaxPatients = 10
        };
        var userId = Guid.NewGuid();
        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PatientCode = "BN-WAY1-01",
            FullName = "Nguyễn Văn Khám Mới",
            IdentityCardNumber = "079097001122",
            EmergencyContactPhone = "0908333444"
        };

        db.Departments.AddRange(noiDept, cardioDept, gastroDept);
        db.StaffProfiles.Add(staff);
        db.DoctorSchedules.Add(schedule);
        db.Patients.Add(patient);
        await db.SaveChangesAsync();

        // 1. Đặt khám mới (New) Online -> Hoãn tạo hóa đơn tới sau Sàng lọc phân khoa
        var aptController = new AppointmentsController(CreateMockHub(), db, config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Patient", "0908333444", userId.ToString()) } }
        };
        var aptRes = Assert.IsType<OkObjectResult>(await aptController.CreateAppointment(new OnlineAppointmentItem
        {
            PatientCode = patient.PatientCode,
            PatientName = patient.FullName,
            PatientPhone = "0908333444",
            IdentityCardNumber = patient.IdentityCardNumber,
            DepartmentName = noiDept.DepartmentName,
            AppointmentDate = vnNow.Date.ToString("yyyy-MM-dd"),
            AppointmentTime = "10:00",
            AppointmentType = "New",
            SymptomsReason = "Đau tức thượng vị kèm hồi hộp"
        }));
        var aptDto = Assert.IsType<OnlineAppointmentItem>(aptRes.Value);
        Assert.Null(aptDto.BillingId);
        Assert.Equal("PendingTriage", aptDto.PaymentStatus);
        Assert.Equal(0m, aptDto.BillingAmount);
        Assert.Equal(0, await db.Billings.CountAsync());

        // 2. Check-in QR ở Kiosk -> Cấp STT chờ Sàng lọc, không tự sinh hóa đơn trước
        var queueEngine = new HospitalAI.Infrastructure.Services.QueueService(db);
        var kioskController = new KioskController(db, queueEngine, CreateMockHub(), config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Receptionist", "tieptan01") } }
        };
        var checkInRes = Assert.IsType<OkObjectResult>(await kioskController.CheckIn(new KioskCheckInRequestDto { QrCodeOrCode = aptDto.Id }));
        var checkInPayload = Assert.IsType<KioskCheckInResponseDto>(checkInRes.Value);
        Assert.Equal("SUCCESS", checkInPayload.Outcome);
        Assert.NotNull(checkInPayload.Ticket);
        Assert.Null(checkInPayload.UnpaidBilling);
        Assert.Equal("PendingTriage", checkInPayload.Ticket!.PaymentStatus);
        Assert.Equal(0, await db.Billings.CountAsync());

        // 3. Nhân viên Sàng lọc (Triage) phân sang Khoa Tim Mạch (200.000đ) -> Sinh đúng 1 hóa đơn Unpaid 200.000đ
        var queueCtrl = new QueueController(queueEngine, CreateMockHub(), db, config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Triage", "triage01") } }
        };
        var route1Res = Assert.IsType<OkObjectResult>(await queueCtrl.TriageRoute(checkInPayload.Ticket.Id, new TriageRouteTicketDto
        {
            TargetDepartmentId = cardioDept.Id,
            TriageLevel = "Normal",
            InitialSymptoms = "Đau ngực nghi tim mạch"
        }));
        var route1Dto = Assert.IsType<TriageRouteResultDto>(route1Res.Value);
        Assert.Equal("Created", route1Dto.BillingAction);
        Assert.Equal(200000m, route1Dto.BillingAmount);
        Assert.Equal("Unpaid", route1Dto.PaymentStatus);
        Assert.Matches("^HAI[A-F0-9]{8}$", route1Dto.PaymentCode!);
        Assert.Equal(1, await db.Billings.CountAsync());

        // 4. Sàng lọc điều chỉnh sang Khoa Tiêu Hóa (180.000đ) khi chưa thanh toán -> Cập nhật cùng hóa đơn đó, giữ nguyên mã thanh toán
        var route2Res = Assert.IsType<OkObjectResult>(await queueCtrl.TriageRoute(checkInPayload.Ticket.Id, new TriageRouteTicketDto
        {
            TargetDepartmentId = gastroDept.Id,
            TriageLevel = "Priority",
            InitialSymptoms = "Trào ngược dạ dày thực quản"
        }));
        var route2Dto = Assert.IsType<TriageRouteResultDto>(route2Res.Value);
        Assert.Equal("UpdatedUnpaid", route2Dto.BillingAction);
        Assert.Equal(180000m, route2Dto.BillingAmount);
        Assert.Equal(route1Dto.PaymentCode, route2Dto.PaymentCode);
        Assert.Equal(route1Dto.BillingId, route2Dto.BillingId);
        Assert.Equal(1, await db.Billings.CountAsync());

        // 5. Gửi SePay webhook 200.000đ (lệch so với giá khoa đã chốt 180.000đ) -> Ghi nhận thừa tiền, giữ Unpaid
        var fixedNow = new DateTimeOffset(2026, 11, 27, 13, 0, 0, TimeSpan.Zero);
        var payCtrl = new PaymentController(new VNPayService(config), db, config, utcNowProvider: () => fixedNow);
        AttachSignedWebhookRequest(payCtrl, BuildSepayJson(9101, 200000m, route2Dto.PaymentCode!), fixedNow.ToUnixTimeSeconds());
        var overRes = Assert.IsType<OkObjectResult>(await payCtrl.ReceiveSepayWebhook());
        Assert.Contains("Discrepancy_Overpaid", JsonSerializer.Serialize(overRes.Value));
        Assert.Equal("Unpaid", (await db.Billings.FindAsync(route2Dto.BillingId))!.Status);

        // 6. Gửi đúng 180.000đ -> Chốt Paid tự động
        AttachSignedWebhookRequest(payCtrl, BuildSepayJson(9102, 180000m, route2Dto.PaymentCode!), fixedNow.ToUnixTimeSeconds());
        var exactRes = Assert.IsType<OkObjectResult>(await payCtrl.ReceiveSepayWebhook());
        Assert.Contains("Processed", JsonSerializer.Serialize(exactRes.Value));
        Assert.Equal("Paid", (await db.Billings.FindAsync(route2Dto.BillingId))!.Status);
    }

    [Fact]
    public async Task Way1_KioskWalkIn_WaitForTriage_ShouldDeferBillingUntilTriageRoutes()
    {
        var dbName = $"Way1WalkInTriage_{Guid.NewGuid()}";
        using var db = CreateInMemoryDb(dbName);
        var config = BuildSepayConfig();

        var receptionDept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Nội Tổng Hợp", Location = "P102" };
        var entDept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Tai Mũi Họng", Location = "P208" };
        db.Departments.AddRange(receptionDept, entDept);
        await db.SaveChangesAsync();

        var queueEngine = new HospitalAI.Infrastructure.Services.QueueService(db);
        var kioskCtrl = new KioskController(db, queueEngine, CreateMockHub(), config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Receptionist", "tieptan01") } }
        };

        var walkInRes = Assert.IsType<OkObjectResult>(await kioskCtrl.IssueWalkIn(new KioskWalkInRequestDto
        {
            FullName = "Trần Thị Đi Bộ",
            IdentityCardNumber = "079098004455",
            Gender = "Nữ",
            DepartmentId = receptionDept.Id,
            WaitForTriage = true
        }));
        var walkInPayload = Assert.IsType<KioskCheckInResponseDto>(walkInRes.Value);
        Assert.Equal("SUCCESS", walkInPayload.Outcome);
        Assert.Null(walkInPayload.UnpaidBilling);
        Assert.Equal("PendingTriage", walkInPayload.Ticket!.PaymentStatus);
        Assert.Equal(0, await db.Billings.CountAsync());

        // Triage phân vào Tai Mũi Họng -> sinh hóa đơn 170.000đ
        var queueCtrl = new QueueController(queueEngine, CreateMockHub(), db, config)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = BuildPrincipal("Triage", "triage01") } }
        };
        var routeRes = Assert.IsType<OkObjectResult>(await queueCtrl.TriageRoute(walkInPayload.Ticket.Id, new TriageRouteTicketDto
        {
            TargetDepartmentId = entDept.Id,
            TriageLevel = "Normal",
            InitialSymptoms = "Đau họng, nghẹt mũi"
        }));
        var routeDto = Assert.IsType<TriageRouteResultDto>(routeRes.Value);
        Assert.Equal("Created", routeDto.BillingAction);
        Assert.Equal(170000m, routeDto.BillingAmount);
        Assert.Equal("Unpaid", routeDto.PaymentStatus);
        Assert.Equal(1, await db.Billings.CountAsync());
    }
}
