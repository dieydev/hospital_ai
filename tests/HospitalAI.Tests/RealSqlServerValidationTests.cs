using System;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using HospitalAI.QueueService.Controllers;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;
using Xunit.Abstractions;

namespace HospitalAI.Tests;

public class RealSqlServerValidationTests
{
    private readonly ITestOutputHelper _output;
    private const string WorkingConn = "Server=localhost\\SQLEXPRESS;Database=HospitalAI_DB;Integrated Security=True;TrustServerCertificate=True;MultipleActiveResultSets=true;";
    private static bool _schemaAligned = false;
    private static readonly object _alignLock = new();

    private static void EnsureSchemaAligned()
    {
        if (_schemaAligned) return;
        lock (_alignLock)
        {
            if (_schemaAligned) return;
            try
            {
                using var conn = new SqlConnection(WorkingConn);
                conn.Open();
                using var cmd = conn.CreateCommand();
                cmd.CommandText = @"
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'NgheNghiep')
                        ALTER TABLE dbo.BenhNhan ADD NgheNghiep NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'DiaChiNguoiThan')
                        ALTER TABLE dbo.BenhNhan ADD DiaChiNguoiThan NVARCHAR(255) NULL;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'TenNguoiThan')
                        ALTER TABLE dbo.BenhNhan ADD TenNguoiThan NVARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'QuanHeNguoiThan')
                        ALTER TABLE dbo.BenhNhan ADD QuanHeNguoiThan NVARCHAR(50) NULL;
                    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'SoDienThoaiNguoiThan')
                        ALTER TABLE dbo.BenhNhan ADD SoDienThoaiNguoiThan VARCHAR(20) NULL;

                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HoSoNhanVien') AND name = 'PracticeLicenseNumber')
                    BEGIN
                        ALTER TABLE dbo.HoSoNhanVien ADD
                            PracticeLicenseNumber NVARCHAR(50) NULL,
                            PracticeLicenseDate NVARCHAR(20) NULL,
                            PracticeLicenseIssuer NVARCHAR(150) NULL,
                            ScopeOfPractice NVARCHAR(255) NULL,
                            NationalPractitionerId NVARCHAR(50) NULL,
                            DegreeLevel NVARCHAR(50) NULL,
                            PracticeStatus NVARCHAR(30) NULL DEFAULT 'Active';
                    END;
                ";
                cmd.ExecuteNonQuery();
                _schemaAligned = true;
            }
            catch { }
        }
    }

    public RealSqlServerValidationTests(ITestOutputHelper output)
    {
        _output = output;
        EnsureSchemaAligned();
    }

    [Fact]
    public async Task TestAdoNetSpGetAppLock_InsideEfCoreTransaction()
    {
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseSqlServer(WorkingConn)
            .Options;

        using var dbContext = new HospitalDbContext(options);

        // 1. Begin EF Core Transaction
        using var slotTx = await dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        var lockResource = $"QuotaLock_Test_{Guid.NewGuid()}";

        // 2. Enlist ADO.NET Command in EF Core Transaction
        var connection = dbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync();
        }

        using var cmd = connection.CreateCommand();
        cmd.Transaction = dbContext.Database.CurrentTransaction?.GetDbTransaction();
        cmd.CommandText = "sp_getapplock";
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.CommandTimeout = 15;

        var pResource = cmd.CreateParameter();
        pResource.ParameterName = "@Resource";
        pResource.Value = lockResource;
        pResource.DbType = DbType.String;
        cmd.Parameters.Add(pResource);

        var pMode = cmd.CreateParameter();
        pMode.ParameterName = "@LockMode";
        pMode.Value = "Exclusive";
        pMode.DbType = DbType.String;
        cmd.Parameters.Add(pMode);

        var pOwner = cmd.CreateParameter();
        pOwner.ParameterName = "@LockOwner";
        pOwner.Value = "Transaction";
        pOwner.DbType = DbType.String;
        cmd.Parameters.Add(pOwner);

        var pTimeout = cmd.CreateParameter();
        pTimeout.ParameterName = "@LockTimeout";
        pTimeout.Value = 10000;
        pTimeout.DbType = DbType.Int32;
        cmd.Parameters.Add(pTimeout);

        var pReturn = cmd.CreateParameter();
        pReturn.ParameterName = "@ReturnValue";
        pReturn.Direction = ParameterDirection.ReturnValue;
        cmd.Parameters.Add(pReturn);

        await cmd.ExecuteNonQueryAsync();
        int retCode = Convert.ToInt32(pReturn.Value);

        _output.WriteLine($"sp_getapplock inside EF Core transaction: retCode = {retCode}");
        Assert.True(retCode >= 0, $"Expected retCode >= 0, but got {retCode}");

        await slotTx.CommitAsync();
    }

    [Fact]
    public async Task RealSqlServer_SpGetAppLock_LockContention_ReturnsTimeoutCode()
    {
        var lockResource = $"ContentionTest_{Guid.NewGuid()}";

        using var conn1 = new SqlConnection(WorkingConn);
        await conn1.OpenAsync();
        using var tx1 = conn1.BeginTransaction(IsolationLevel.Serializable);

        // Conn1 acquires Exclusive lock
        using var cmd1 = conn1.CreateCommand();
        cmd1.Transaction = tx1;
        cmd1.CommandText = "sp_getapplock";
        cmd1.CommandType = CommandType.StoredProcedure;
        cmd1.Parameters.Add(new SqlParameter("@Resource", lockResource));
        cmd1.Parameters.Add(new SqlParameter("@LockMode", "Exclusive"));
        cmd1.Parameters.Add(new SqlParameter("@LockOwner", "Transaction"));
        cmd1.Parameters.Add(new SqlParameter("@LockTimeout", 5000));
        var ret1 = cmd1.Parameters.Add(new SqlParameter("@ret", SqlDbType.Int) { Direction = ParameterDirection.ReturnValue });
        await cmd1.ExecuteNonQueryAsync();
        int code1 = (int)ret1.Value;
        Assert.True(code1 >= 0, $"Conn1 failed to acquire lock: code {code1}");

        // Conn2 attempts to acquire same Exclusive lock with 500ms timeout
        using var conn2 = new SqlConnection(WorkingConn);
        await conn2.OpenAsync();
        using var tx2 = conn2.BeginTransaction(IsolationLevel.Serializable);

        using var cmd2 = conn2.CreateCommand();
        cmd2.Transaction = tx2;
        cmd2.CommandText = "sp_getapplock";
        cmd2.CommandType = CommandType.StoredProcedure;
        cmd2.Parameters.Add(new SqlParameter("@Resource", lockResource));
        cmd2.Parameters.Add(new SqlParameter("@LockMode", "Exclusive"));
        cmd2.Parameters.Add(new SqlParameter("@LockOwner", "Transaction"));
        cmd2.Parameters.Add(new SqlParameter("@LockTimeout", 500)); // 500ms timeout
        var ret2 = cmd2.Parameters.Add(new SqlParameter("@ret", SqlDbType.Int) { Direction = ParameterDirection.ReturnValue });
        await cmd2.ExecuteNonQueryAsync();
        int code2 = (int)ret2.Value;

        _output.WriteLine($"Conn1 Lock Result: {code1} (Acquired)");
        _output.WriteLine($"Conn2 Lock Result: {code2} (Expected -1 Timeout)");

        // SQL Server sp_getapplock returns -1 when timeout expires
        Assert.Equal(-1, code2);

        tx1.Rollback();
        tx2.Rollback();
    }

    [Fact]
    public async Task RealSqlServer_TwoConcurrentAppointments_ContendingForLastSlot_MustPreventOverbooking()
    {
        // Align DB schema columns if missing in older DB version
        using (var alignConn = new SqlConnection(WorkingConn))
        {
            await alignConn.OpenAsync();
            using var alignCmd = alignConn.CreateCommand();
            alignCmd.CommandText = @"
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'NgheNghiep')
                    ALTER TABLE dbo.BenhNhan ADD NgheNghiep NVARCHAR(100) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'DiaChiNguoiThan')
                    ALTER TABLE dbo.BenhNhan ADD DiaChiNguoiThan NVARCHAR(255) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'TenNguoiThan')
                    ALTER TABLE dbo.BenhNhan ADD TenNguoiThan NVARCHAR(100) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'QuanHeNguoiThan')
                    ALTER TABLE dbo.BenhNhan ADD QuanHeNguoiThan NVARCHAR(50) NULL;
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BenhNhan') AND name = 'SoDienThoaiNguoiThan')
                    ALTER TABLE dbo.BenhNhan ADD SoDienThoaiNguoiThan VARCHAR(20) NULL;
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HoSoNhanVien') AND name = 'PracticeLicenseNumber')
                BEGIN
                    ALTER TABLE dbo.HoSoNhanVien ADD
                        PracticeLicenseNumber NVARCHAR(50) NULL,
                        PracticeLicenseDate NVARCHAR(20) NULL,
                        PracticeLicenseIssuer NVARCHAR(150) NULL,
                        ScopeOfPractice NVARCHAR(255) NULL,
                        NationalPractitionerId NVARCHAR(50) NULL,
                        DegreeLevel NVARCHAR(50) NULL,
                        PracticeStatus NVARCHAR(30) NULL DEFAULT 'Active';
                END;
            ";
            await alignCmd.ExecuteNonQueryAsync();
        }

        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseSqlServer(WorkingConn)
            .Options;

        // Ensure unique test environment
        using (var setupContext = new HospitalDbContext(options))
        {
            var dept = await setupContext.Departments.FirstOrDefaultAsync() ?? new Department
            {
                Id = Guid.NewGuid(),
                DepartmentName = "Khoa Test Real SQL",
                Location = "Tang 1",
                RoomType = "KhamLamSang"
            };
            if (!await setupContext.Departments.AnyAsync(d => d.Id == dept.Id))
            {
                setupContext.Departments.Add(dept);
                await setupContext.SaveChangesAsync();
            }

            var staff = await setupContext.StaffProfiles.FirstOrDefaultAsync();
            if (staff == null)
            {
                var user = await setupContext.Users.FirstOrDefaultAsync();
                staff = new StaffProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = user?.Id ?? Guid.NewGuid(),
                    DepartmentId = dept.Id,
                    FullName = "Bac Si Test",
                    Title = "Bac Si Chuyen Khoa"
                };
                setupContext.StaffProfiles.Add(staff);
                await setupContext.SaveChangesAsync();
            }

            var targetDate = DateTime.UtcNow.Date.AddDays(Random.Shared.Next(40, 100));
            var testTimeSlot = $"23:{Random.Shared.Next(10, 50)} - 23:59";

            // Create DoctorSchedule with MaxPatients = 1
            var schedule = new DoctorSchedule
            {
                Id = Guid.NewGuid(),
                StaffId = staff.Id,
                DepartmentId = dept.Id,
                WorkDate = targetDate,
                TimeSlot = testTimeSlot,
                MaxPatients = 1 // Only 1 slot available!
            };
            setupContext.DoctorSchedules.Add(schedule);
            await setupContext.SaveChangesAsync();

            var hubMock = new Mock<IHubContext<QueueHub>>();
            var clientsMock = new Mock<IHubClients>();
            var clientProxyMock = new Mock<IClientProxy>();
            clientsMock.Setup(c => c.All).Returns(clientProxyMock.Object);
            hubMock.Setup(h => h.Clients).Returns(clientsMock.Object);

            // Create 2 independent controllers sharing the same Real SQL Server
            var dbContext1 = new HospitalDbContext(options);
            var dbContext2 = new HospitalDbContext(options);

            var controller1 = new AppointmentsController(hubMock.Object, dbContext1);
            var controller2 = new AppointmentsController(hubMock.Object, dbContext2);

            var rnd = Random.Shared;
            var patient1 = new OnlineAppointmentItem
            {
                PatientName = "Bệnh nhân RealSQL 1",
                PatientPhone = $"09{rnd.Next(10000000, 99999999)}",
                IdentityCardNumber = $"001{rnd.Next(100000000, 999999999)}",
                AppointmentDate = targetDate.ToString("yyyy-MM-dd"),
                AppointmentTime = testTimeSlot,
                DepartmentName = dept.DepartmentName,
                SymptomsReason = "Đau đầu tranh suất 1"
            };

            var patient2 = new OnlineAppointmentItem
            {
                PatientName = "Bệnh nhân RealSQL 2",
                PatientPhone = $"09{rnd.Next(10000000, 99999999)}",
                IdentityCardNumber = $"001{rnd.Next(100000000, 999999999)}",
                AppointmentDate = targetDate.ToString("yyyy-MM-dd"),
                AppointmentTime = testTimeSlot,
                DepartmentName = dept.DepartmentName,
                SymptomsReason = "Đau đầu tranh suất 2"
            };

            var task1 = Task.Run(async () =>
            {
                var ts = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
                var res = await controller1.CreateAppointment(patient1);
                return (Pid: Environment.ProcessId, Instance: "Instance-Alpha", Timestamp: ts, Result: res);
            });

            var task2 = Task.Run(async () =>
            {
                var ts = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
                var res = await controller2.CreateAppointment(patient2);
                return (Pid: Environment.ProcessId, Instance: "Instance-Beta", Timestamp: ts, Result: res);
            });

            var results = await Task.WhenAll(task1, task2);

            _output.WriteLine($"Task 1 [{results[0].Instance}, PID: {results[0].Pid}, Time: {results[0].Timestamp}]: Status={results[0].Result.GetType().Name}");
            _output.WriteLine($"Task 2 [{results[1].Instance}, PID: {results[1].Pid}, Time: {results[1].Timestamp}]: Status={results[1].Result.GetType().Name}");

            int okCount = 0;
            int rejectedCount = 0;
            string? createdAppointmentId = null;

            foreach (var r in results)
            {
                if (r.Result is OkObjectResult ok && ok.Value is OnlineAppointmentItem aptItem)
                {
                    okCount++;
                    createdAppointmentId = aptItem.Id;
                }
                else if (r.Result is BadRequestObjectResult || r.Result is ObjectResult)
                {
                    rejectedCount++;
                }
            }

            // Verify in Real SQL Server
            using var verifyContext = new HospitalDbContext(options);
            var savedInDb = await verifyContext.Appointments
                .CountAsync(a => a.ScheduleId == schedule.Id && a.Status != "Cancelled");

            _output.WriteLine($"Final DB Record Count in SQL Server: {savedInDb} (Quota Max: {schedule.MaxPatients})");

            Assert.Equal(1, okCount);
            Assert.Equal(1, rejectedCount);
            Assert.Equal(1, savedInDb);
            Assert.NotNull(createdAppointmentId);
        }
    }

    [Fact]
    public async Task MultiProcess_TwoIndependentBackendProcesses_ContendingForSingleSlot_MustPreventOverbooking()
    {
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseSqlServer(WorkingConn)
            .Options;

        // 1. Setup DoctorSchedule in SQL Server with MaxPatients = 1 on a clean date
        DateTime targetDate = DateTime.UtcNow.Date.AddDays(Random.Shared.Next(200, 1800));
        var testTimeSlot = $"21:{Random.Shared.Next(10, 50)} - 21:59";
        Guid scheduleId;

        using (var setupContext = new HospitalDbContext(options))
        {
            while (await setupContext.Appointments.AnyAsync(a => a.AppointmentDate.Date == targetDate))
            {
                targetDate = targetDate.AddDays(1);
            }
            var dept = await setupContext.Departments.FirstOrDefaultAsync();
            var staff = await setupContext.StaffProfiles.FirstOrDefaultAsync();
            var schedule = new DoctorSchedule
            {
                Id = Guid.NewGuid(),
                StaffId = staff!.Id,
                DepartmentId = dept!.Id,
                WorkDate = targetDate,
                TimeSlot = testTimeSlot,
                MaxPatients = 1
            };
            setupContext.DoctorSchedules.Add(schedule);
            await setupContext.SaveChangesAsync();
            scheduleId = schedule.Id;
        }

        // 2. Launch 2 independent backend processes
        var baseDir = AppContext.BaseDirectory;
        while (!Directory.Exists(Path.Combine(baseDir, "src")) && Directory.GetParent(baseDir) != null)
        {
            baseDir = Directory.GetParent(baseDir)!.FullName;
        }
        var workingDir = Path.Combine(baseDir, "src", "backend", "services", "HospitalAI.QueueService");
        var dllPath = Path.Combine(workingDir, "bin", "Debug", "net9.0", "HospitalAI.QueueService.dll");

        var psi1 = new ProcessStartInfo
        {
            FileName = "dotnet",
            Arguments = $"exec \"{dllPath}\" --urls \"http://127.0.0.1:5110\"",
            WorkingDirectory = workingDir,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        const string multiProcJwtSecret = "TEST_MULTI_PROCESS_JWT_SECRET_KEY_2026_32B";
        psi1.Environment["ConnectionStrings__DefaultConnection"] = WorkingConn;
        psi1.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
        psi1.Environment["JwtSettings__SecretKey"] = multiProcJwtSecret;

        var psi2 = new ProcessStartInfo
        {
            FileName = "dotnet",
            Arguments = $"exec \"{dllPath}\" --urls \"http://127.0.0.1:5111\"",
            WorkingDirectory = workingDir,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        psi2.Environment["ConnectionStrings__DefaultConnection"] = WorkingConn;
        psi2.Environment["ASPNETCORE_ENVIRONMENT"] = "Development";
        psi2.Environment["JwtSettings__SecretKey"] = multiProcJwtSecret;

        using var proc1 = Process.Start(psi1);
        using var proc2 = Process.Start(psi2);

        Assert.NotNull(proc1);
        Assert.NotNull(proc2);

        int pid1 = proc1.Id;
        int pid2 = proc2.Id;
        _output.WriteLine($"Started Instance Alpha: PID {pid1} on port 5110");
        _output.WriteLine($"Started Instance Beta: PID {pid2} on port 5111");

        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };

            // Wait for both instances to be ready
            bool ready1 = false, ready2 = false;
            for (int i = 0; i < 40; i++)
            {
                await Task.Delay(500);
                if (!ready1)
                {
                    try { var r = await http.GetAsync("http://127.0.0.1:5110/api/appointments/slots"); if (r.IsSuccessStatusCode) ready1 = true; } catch { }
                }
                if (!ready2)
                {
                    try { var r = await http.GetAsync("http://127.0.0.1:5111/api/appointments/slots"); if (r.IsSuccessStatusCode) ready2 = true; } catch { }
                }
                if (ready1 && ready2) break;
            }

            Assert.True(ready1, "Instance Alpha (port 5110) failed to become ready.");
            Assert.True(ready2, "Instance Beta (port 5111) failed to become ready.");

            _output.WriteLine("Both backend instances are READY and listening.");

            var rnd = Random.Shared;
            var phone1 = $"09{rnd.Next(10000000, 99999999)}";
            var phone2 = $"09{rnd.Next(10000000, 99999999)}";

            var jwtConfig = new Microsoft.Extensions.Configuration.ConfigurationBuilder()
                .AddInMemoryCollection(new System.Collections.Generic.Dictionary<string, string?>
                {
                    ["JwtSettings:SecretKey"] = multiProcJwtSecret,
                    ["JwtSettings:Issuer"] = "HospitalAI.Backend",
                    ["JwtSettings:Audience"] = "HospitalAI.Clients"
                })
                .Build();
            var jwtGen = new HospitalAI.Infrastructure.Services.JwtTokenGenerator(jwtConfig);
            var (token1, _) = jwtGen.GenerateToken(
                new User { Id = Guid.NewGuid(), Username = phone1, FullName = "Patient Alpha", Email = "alpha@test.local" },
                new[] { "Patient" });
            var (token2, _) = jwtGen.GenerateToken(
                new User { Id = Guid.NewGuid(), Username = phone2, FullName = "Patient Beta", Email = "beta@test.local" },
                new[] { "Patient" });

            var body1 = System.Text.Json.JsonSerializer.Serialize(new
            {
                patientName = "Bệnh nhân Process Alpha",
                patientPhone = phone1,
                identityCardNumber = $"001{rnd.Next(100000000, 999999999)}",
                appointmentDate = targetDate.ToString("yyyy-MM-dd"),
                appointmentTime = testTimeSlot,
                departmentName = "Khoa Test",
                symptomsReason = "Tranh chấp đa tiến trình PID 1"
            });

            var body2 = System.Text.Json.JsonSerializer.Serialize(new
            {
                patientName = "Bệnh nhân Process Beta",
                patientPhone = phone2,
                identityCardNumber = $"001{rnd.Next(100000000, 999999999)}",
                appointmentDate = targetDate.ToString("yyyy-MM-dd"),
                appointmentTime = testTimeSlot,
                departmentName = "Khoa Test",
                symptomsReason = "Tranh chấp đa tiến trình PID 2"
            });

            var t1 = Task.Run(async () =>
            {
                using var client = new HttpClient();
                var req = new HttpRequestMessage(HttpMethod.Post, "http://127.0.0.1:5110/api/appointments")
                {
                    Content = new StringContent(body1, System.Text.Encoding.UTF8, "application/json")
                };
                req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token1);
                var ts = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
                var response = await client.SendAsync(req);
                var content = await response.Content.ReadAsStringAsync();
                return (Pid: pid1, Url: "http://127.0.0.1:5110", Timestamp: ts, StatusCode: (int)response.StatusCode, Content: content);
            });

            var t2 = Task.Run(async () =>
            {
                using var client = new HttpClient();
                var req = new HttpRequestMessage(HttpMethod.Post, "http://127.0.0.1:5111/api/appointments")
                {
                    Content = new StringContent(body2, System.Text.Encoding.UTF8, "application/json")
                };
                req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token2);
                var ts = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
                var response = await client.SendAsync(req);
                var content = await response.Content.ReadAsStringAsync();
                return (Pid: pid2, Url: "http://127.0.0.1:5111", Timestamp: ts, StatusCode: (int)response.StatusCode, Content: content);
            });

            var responses = await Task.WhenAll(t1, t2);

            _output.WriteLine($"Instance Alpha [PID: {responses[0].Pid}, URL: {responses[0].Url}, Time: {responses[0].Timestamp}]: HTTP {responses[0].StatusCode} - {responses[0].Content}");
            _output.WriteLine($"Instance Beta  [PID: {responses[1].Pid}, URL: {responses[1].Url}, Time: {responses[1].Timestamp}]: HTTP {responses[1].StatusCode} - {responses[1].Content}");

            int successCount = 0;
            int conflictOrRejectedCount = 0;

            foreach (var resp in responses)
            {
                if (resp.StatusCode == 200) successCount++;
                else if (resp.StatusCode == 400 || resp.StatusCode == 409) conflictOrRejectedCount++;
            }

            // 4. Verify in Real SQL Server
            using var verifyContext = new HospitalDbContext(options);
            var savedInDb = await verifyContext.Appointments
                .CountAsync(a => (a.ScheduleId == scheduleId || a.AppointmentDate.Date == targetDate) && a.Status != "Cancelled");

            _output.WriteLine($"Multi-Process Final Count in SQL Server: {savedInDb} (Quota: 1)");

            Assert.Equal(1, successCount);
            Assert.Equal(1, conflictOrRejectedCount);
            Assert.Equal(1, savedInDb);
        }
        finally
        {
            try { proc1.Kill(true); } catch { }
            try { proc2.Kill(true); } catch { }
        }
    }

    [Fact]
    public async Task StaffProfile_PracticeLicenseFields_MustBePersistedAndReloadedSuccessfully_WithoutDataLoss()
    {
        // Align DB schema columns for HoSoNhanVien if missing
        using (var alignConn = new SqlConnection(WorkingConn))
        {
            await alignConn.OpenAsync();
            using var alignCmd = alignConn.CreateCommand();
            alignCmd.CommandText = @"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.HoSoNhanVien') AND name = 'PracticeLicenseNumber')
                BEGIN
                    ALTER TABLE dbo.HoSoNhanVien ADD
                        PracticeLicenseNumber NVARCHAR(50) NULL,
                        PracticeLicenseDate NVARCHAR(20) NULL,
                        PracticeLicenseIssuer NVARCHAR(150) NULL,
                        ScopeOfPractice NVARCHAR(255) NULL,
                        NationalPractitionerId NVARCHAR(50) NULL,
                        DegreeLevel NVARCHAR(50) NULL,
                        PracticeStatus NVARCHAR(30) NULL DEFAULT 'Active';
                END;
            ";
            await alignCmd.ExecuteNonQueryAsync();
        }

        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseSqlServer(WorkingConn)
            .Options;

        var staffId = Guid.NewGuid();
        var licenseNumber = $"00{Random.Shared.Next(1000, 9999)}/BD-GPHN";

        // 1. Create and Save StaffProfile with Practice License
        using (var saveContext = new HospitalDbContext(options))
        {
            var dept = await saveContext.Departments.FirstOrDefaultAsync() ?? new Department
            {
                Id = Guid.NewGuid(),
                DepartmentName = "Khoa Test CCHN",
                Location = "Khu B",
                RoomType = "KhamLamSang"
            };
            if (!await saveContext.Departments.AnyAsync(d => d.Id == dept.Id))
            {
                saveContext.Departments.Add(dept);
                await saveContext.SaveChangesAsync();
            }

            var user = await saveContext.Users.FirstOrDefaultAsync() ?? new User
            {
                Id = Guid.NewGuid(),
                Username = $"staff_cchn_{Guid.NewGuid():N}",
                PasswordHash = "hashed",
                PhoneNumber = "0988776655"
            };
            if (!await saveContext.Users.AnyAsync(u => u.Id == user.Id))
            {
                saveContext.Users.Add(user);
                await saveContext.SaveChangesAsync();
            }

            var staff = new StaffProfile
            {
                Id = staffId,
                UserId = user.Id,
                DepartmentId = dept.Id,
                FullName = "BS. CKII Nguyễn Văn Test",
                Title = "Bác sĩ chuyên khoa Tim Mạch",
                IsAvailable = true,
                PracticeLicenseNumber = licenseNumber,
                PracticeLicenseDate = "15/04/2018",
                PracticeLicenseIssuer = "Sở Y tế Tỉnh Bình Dương",
                ScopeOfPractice = "Khám bệnh, chữa bệnh chuyên khoa Tim mạch (TT 32/2023/TT-BYT)",
                NationalPractitionerId = "BYT-CCHN-74001-TEST",
                DegreeLevel = "BS.CKII",
                PracticeStatus = "Active"
            };

            saveContext.StaffProfiles.Add(staff);
            await saveContext.SaveChangesAsync();
        }

        // 2. Reload StaffProfile in a fresh DbContext instance and verify no data is lost
        using (var reloadContext = new HospitalDbContext(options))
        {
            var reloaded = await reloadContext.StaffProfiles.FirstOrDefaultAsync(s => s.Id == staffId);

            Assert.NotNull(reloaded);
            Assert.Equal("BS. CKII Nguyễn Văn Test", reloaded.FullName);
            Assert.Equal(licenseNumber, reloaded.PracticeLicenseNumber);
            Assert.Equal("15/04/2018", reloaded.PracticeLicenseDate);
            Assert.Equal("Sở Y tế Tỉnh Bình Dương", reloaded.PracticeLicenseIssuer);
            Assert.Equal("Khám bệnh, chữa bệnh chuyên khoa Tim mạch (TT 32/2023/TT-BYT)", reloaded.ScopeOfPractice);
            Assert.Equal("BYT-CCHN-74001-TEST", reloaded.NationalPractitionerId);
            Assert.Equal("BS.CKII", reloaded.DegreeLevel);
            Assert.Equal("Active", reloaded.PracticeStatus);
            _output.WriteLine($"Successfully verified staff profile persistence with license {licenseNumber}");
        }
    }
}
