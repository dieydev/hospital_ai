using HospitalAI.Application.DTOs;
using HospitalAI.Domain.Entities;
using HospitalAI.ExaminationService.Controllers;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;

namespace HospitalAI.Tests;

/// <summary>
/// Kiểm thử tích hợp SePay & khóa giao dịch đa kết nối trực tiếp trên CSDL cô lập HospitalAI_TestDB (.\SQLEXPRESS01).
/// Không tự ý nối về HospitalAI_DB trên .\SQLEXPRESS.
/// </summary>
public class SepaySqlServerValidationTests
{
    private readonly ITestOutputHelper _output;

    public SepaySqlServerValidationTests(ITestOutputHelper output)
    {
        _output = output;
    }

    private static string EnsureIsolatedSchemaReady()
    {
        var connStr = IsolatedSqlTestConnectionGuard.ResolveAndValidate();
        using var verifyConn = new SqlConnection(connStr);
        verifyConn.Open();
        IsolatedSqlTestConnectionGuard.VerifyConnectedTargetBeforeWrite(verifyConn);

        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseSqlServer(connStr)
            .Options;

        using var db = new HospitalDbContext(options);
        db.Database.EnsureCreated();
        DataSeeder.EnsureSchemaUpdatedAsync(db).GetAwaiter().GetResult();
        return connStr;
    }

    private static IConfiguration BuildConfig()
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Sepay:Environment"] = "Sandbox",
                ["Sepay:BankCode"] = "MB",
                ["Sepay:BankBin"] = "970422",
                ["Sepay:AccountNumber"] = "0000000001",
                ["Sepay:AccountName"] = "HOSPITAL AI DEMO",
                ["Sepay:PaymentPrefix"] = "HAI",
                ["Sepay:WebhookSecret"] = "isolated-sql-test-secret-key-2026",
                ["Sepay:TimestampToleranceSeconds"] = "3600"
            })
            .Build();
    }

    [Fact]
    public async Task SqlServer_SchemaConstraints_MustExist_AndPreventDuplicatePaymentCodesAndSepayTransactions()
    {
        var connStr = EnsureIsolatedSchemaReady();
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseSqlServer(connStr)
            .Options;

        // 1. Kiểm tra metadata Unique Index trong SQL Server HospitalAI_TestDB
        using (var conn = new SqlConnection(connStr))
        {
            await conn.OpenAsync();
            IsolatedSqlTestConnectionGuard.VerifyConnectedTargetBeforeWrite(conn);

            using var cmd = conn.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(*) FROM sys.indexes
                WHERE name IN ('IX_HoaDon_MaThanhToan', 'IX_HoaDon_MaGiaoDich', 'IX_HoaDon_LichHenId_Registration')
                  AND object_id = OBJECT_ID('dbo.HoaDon');";
            var hoaDonIdxCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            Assert.Equal(3, hoaDonIdxCount);

            cmd.CommandText = @"
                SELECT COUNT(*) FROM sys.indexes
                WHERE name = 'IX_NhatKyGiaoDichSePay_SepayTransactionId'
                  AND object_id = OBJECT_ID('dbo.NhatKyGiaoDichSePay');";
            var logIdxCount = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            Assert.Equal(1, logIdxCount);
        }

        // 2. Kiểm tra thực nghiệm Unique Constraint & Concurrency trên SQL Server thật (dọn sạch dữ liệu test cuối hàm)
        var testPatientId = Guid.NewGuid();
        var testScheduleId = Guid.NewGuid();
        var testAptId = Guid.NewGuid();
        var testUserId = Guid.NewGuid();
        var testStaffId = Guid.NewGuid();
        var testDeptId = Guid.NewGuid();
        var testSepayTxnId = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var duplicateCode = PaymentQrHelper.GeneratePaymentCode("HAI");

        try
        {
            using (var seedDb = new HospitalDbContext(options))
            {
                seedDb.Users.Add(new User
                {
                    Id = testUserId,
                    Username = $"bs_test_{testUserId:N}",
                    PasswordHash = "test_hash_only",
                    FullName = "BS Test SePay",
                    Email = $"bs_{testUserId:N}@test.local",
                    PhoneNumber = "0900000000"
                });
                seedDb.Departments.Add(new Department { Id = testDeptId, DepartmentName = "Khoa Test SePay", Location = "T1" });
                seedDb.StaffProfiles.Add(new StaffProfile { Id = testStaffId, UserId = testUserId, FullName = "BS Test SePay", DepartmentId = testDeptId });
                seedDb.DoctorSchedules.Add(new DoctorSchedule { Id = testScheduleId, StaffId = testStaffId, DepartmentId = testDeptId, WorkDate = DateTime.UtcNow.Date, TimeSlot = "08:00 - 08:30", MaxPatients = 5 });
                seedDb.Patients.Add(new Patient
                {
                    Id = testPatientId,
                    PatientCode = $"BNTEST{Random.Shared.Next(100000, 999999)}",
                    FullName = "BN Test SQL SePay",
                    IdentityCardNumber = $"099{DateTime.UtcNow.Ticks % 1000000000L:D9}"
                });
                seedDb.Appointments.Add(new Appointment
                {
                    Id = testAptId,
                    PatientId = testPatientId,
                    ScheduleId = testScheduleId,
                    AppointmentDate = DateTime.UtcNow.Date.AddHours(8),
                    Status = "Pending"
                });
                await seedDb.SaveChangesAsync();
            }

            // Tạo song song 3 luồng cùng đặt hóa đơn Registration cho cùng Appointment -> SQL Filtered Index giữ duy nhất 1 hóa đơn
            var creationTasks = Enumerable.Range(0, 3).Select(async _ =>
            {
                using var ctx = new HospitalDbContext(options);
                return await BillingSettlementService.GetOrCreateRegistrationBillingAsync(
                    ctx, testPatientId, testAptId, 150000m, "Phí khám SQL Test");
            }).ToArray();

            var createdBills = await Task.WhenAll(creationTasks);
            var distinctBillIds = createdBills.Select(b => b.Id).Distinct().ToList();
            Assert.Single(distinctBillIds);

            var targetBillId = distinctBillIds[0];

            // Ép PaymentCode xác định để test webhook thật trên SQL Server
            using (var updateDb = new HospitalDbContext(options))
            {
                var b = await updateDb.Billings.FindAsync(targetBillId);
                b!.PaymentCode = duplicateCode;
                await updateDb.SaveChangesAsync();
            }

            // Đua song song giữa SePay Webhook và PayCash trên 2 kết nối SQL Server thật
            var config = BuildConfig();
            var sepayTask = Task.Run(async () =>
            {
                using var db1 = new HospitalDbContext(options);
                var now = DateTimeOffset.UtcNow;
                var ctrl1 = new PaymentController(new VNPayService(config), db1, config, utcNowProvider: () => now);
                var rawBody = JsonSerializer.Serialize(new
                {
                    id = testSepayTxnId,
                    gateway = "MBBank",
                    transactionDate = "2026-11-27 12:30:00",
                    accountNumber = "0000000001",
                    subAccount = "",
                    code = duplicateCode,
                    content = $"THANH TOAN {duplicateCode}",
                    transferType = "in",
                    description = "SQL CONCURRENCY TEST",
                    transferAmount = 150000m,
                    referenceCode = $"FT{testSepayTxnId}"
                });
                var ts = now.ToUnixTimeSeconds();
                var sigBytes = HMACSHA256.HashData(
                    Encoding.UTF8.GetBytes("isolated-sql-test-secret-key-2026"),
                    Encoding.UTF8.GetBytes($"{ts}.{rawBody}"));
                var http = new DefaultHttpContext();
                http.Request.Body = new MemoryStream(Encoding.UTF8.GetBytes(rawBody));
                http.Request.Headers["X-SePay-Timestamp"] = ts.ToString();
                http.Request.Headers["X-SePay-Signature"] = $"sha256={Convert.ToHexString(sigBytes).ToLowerInvariant()}";
                ctrl1.ControllerContext = new ControllerContext { HttpContext = http };
                return await ctrl1.ReceiveSepayWebhook();
            });

            var cashTask = Task.Run(async () =>
            {
                using var db2 = new HospitalDbContext(options);
                var ctrl2 = new BillingController(db2, config)
                {
                    ControllerContext = new ControllerContext
                    {
                        HttpContext = new DefaultHttpContext
                        {
                            User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Cashier") }, "TestAuth"))
                        }
                    }
                };
                return await ctrl2.PayCash(targetBillId);
            });

            await Task.WhenAll(sepayTask, cashTask);

            using var verifyDb = new HospitalDbContext(options);
            var finalBill = await verifyDb.Billings.AsNoTracking().FirstAsync(b => b.Id == targetBillId);
            Assert.Equal("Paid", finalBill.Status);

            var sepayLogs = await verifyDb.SepayWebhookTransactions
                .AsNoTracking()
                .Where(t => t.SepayTransactionId == testSepayTxnId)
                .ToListAsync();
            Assert.Single(sepayLogs);
            Assert.Contains(sepayLogs[0].ProcessingStatus, new[] { "Processed", "Late_AfterPaid" });

            _output.WriteLine($"SQL Server concurrency winner method={finalBill.PaymentMethod}, logStatus={sepayLogs[0].ProcessingStatus}");
        }
        finally
        {
            using var cleanDb = new HospitalDbContext(options);
            await cleanDb.SepayWebhookTransactions.Where(t => t.SepayTransactionId == testSepayTxnId).ExecuteDeleteAsync();
            await cleanDb.BillingItems.Where(i => i.Billing!.PatientId == testPatientId).ExecuteDeleteAsync();
            await cleanDb.Billings.Where(b => b.PatientId == testPatientId).ExecuteDeleteAsync();
            await cleanDb.Appointments.Where(a => a.Id == testAptId).ExecuteDeleteAsync();
            await cleanDb.DoctorSchedules.Where(s => s.Id == testScheduleId).ExecuteDeleteAsync();
            await cleanDb.StaffProfiles.Where(s => s.Id == testStaffId).ExecuteDeleteAsync();
            await cleanDb.Departments.Where(d => d.Id == testDeptId).ExecuteDeleteAsync();
            await cleanDb.Users.Where(u => u.Id == testUserId).ExecuteDeleteAsync();
            await cleanDb.Patients.Where(p => p.Id == testPatientId).ExecuteDeleteAsync();
        }
    }
}
