using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using HospitalAI.Application.DTOs;
using HospitalAI.Domain.Entities;
using HospitalAI.ExaminationService.Controllers;
using HospitalAI.Infrastructure.Data;
using HospitalAI.QueueService.Controllers;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;
using Xunit.Abstractions;
using QueueEngine = HospitalAI.Infrastructure.Services.QueueService;

namespace HospitalAI.Tests;

public class TrueConcurrencyStressTests
{
    private readonly ITestOutputHelper _output;

    public TrueConcurrencyStressTests(ITestOutputHelper output)
    {
        _output = output;
    }

    private static HospitalDbContext CreateSharedInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new HospitalDbContext(options);
    }

    private static ControllerContext CreateControllerContext(string role, string name = "testuser")
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, name),
            new(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        return new ControllerContext { HttpContext = new DefaultHttpContext { User = principal } };
    }

    private static IHubContext<QueueHub> CreateMockHubContext()
    {
        var mockClients = new Mock<IHubClients>();
        var mockClientProxy = new Mock<IClientProxy>();
        mockClients.Setup(c => c.All).Returns(mockClientProxy.Object);

        var mockHubContext = new Mock<IHubContext<QueueHub>>();
        mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);
        return mockHubContext.Object;
    }

    public class ConcurrencyExecutionLog
    {
        public int WorkerId { get; set; }
        public int ThreadId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public long DurationMs { get; set; }
        public int StatusCode { get; set; }
        public string ResultMessage { get; set; } = string.Empty;
    }

    [Fact]
    public async Task Concurrency_FiveSimultaneousRequests_ForLastRemainingSlot_MustPreventOverbooking()
    {
        // ARRANGE: Thiết lập phòng khám chỉ còn đúng 1 suất khám cuối cùng (MaxCapacity = 1)
        var dbName = "StressDb_Quota_" + Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var deptId = Guid.NewGuid();
        var scheduleId = Guid.NewGuid();
        var targetDate = DateTime.UtcNow.Date;

        using (var setupContext = CreateSharedInMemoryDbContext(dbName))
        {
            var dept = new Department { Id = deptId, DepartmentName = "Khoa Tim Mạch" };
            var staff = new StaffProfile { Id = doctorId, FullName = "BS. CKII. Nguyễn Thanh Duy", DepartmentId = deptId };
            var schedule = new DoctorSchedule
            {
                Id = scheduleId,
                StaffId = doctorId,
                DepartmentId = deptId,
                WorkDate = targetDate,
                TimeSlot = "08:00 - 08:30",
                MaxPatients = 1 // CHỈ DUY NHẤT 1 SUẤT
            };
            setupContext.Departments.Add(dept);
            setupContext.StaffProfiles.Add(staff);
            setupContext.DoctorSchedules.Add(schedule);
            await setupContext.SaveChangesAsync();
        }

        const int workerCount = 5;
        var startGate = new ManualResetEventSlim(false);
        var readyGate = new CountdownEvent(workerCount);
        var logs = new ConcurrentBag<ConcurrencyExecutionLog>();

        // ACT: 5 Worker đồng thời gửi yêu cầu tranh giành 1 suất duy nhất
        var tasks = Enumerable.Range(1, workerCount).Select(workerId => Task.Run(async () =>
        {
            using var workerContext = CreateSharedInMemoryDbContext(dbName);
            var hubContext = CreateMockHubContext();
            var controller = new AppointmentsController(hubContext, workerContext)
            {
                ControllerContext = CreateControllerContext("Patient", $"090900000{workerId}")
            };

            var appointmentItem = new OnlineAppointmentItem
            {
                PatientName = $"Bệnh nhân Đồng Thời {workerId}",
                PatientPhone = $"090900000{workerId}",
                IdentityCardNumber = $"07909000000{workerId}",
                AppointmentDate = targetDate.ToString("yyyy-MM-dd"),
                AppointmentTime = "08:00 - 08:30",
                DepartmentName = "Khoa Tim Mạch",
                SymptomsReason = "Đau tức ngực khảo sát tranh chấp Quota"
            };

            // Báo hiệu Worker đã sẵn sàng tại vạch xuất phát
            readyGate.Signal();
            startGate.Wait(); // Chờ mở cổng đồng thời

            var sw = Stopwatch.StartNew();
            var startTime = DateTime.UtcNow;

            var actionResult = await controller.CreateAppointment(appointmentItem);

            sw.Stop();
            var endTime = DateTime.UtcNow;

            int statusCode;
            string message = "";
            if (actionResult is OkObjectResult)
            {
                statusCode = 200;
                message = "Đặt lịch thành công";
            }
            else if (actionResult is BadRequestObjectResult br)
            {
                statusCode = 400;
                message = br.Value?.ToString() ?? "BadRequest";
            }
            else if (actionResult is ConflictObjectResult cr)
            {
                statusCode = 409;
                message = cr.Value?.ToString() ?? "Conflict";
            }
            else
            {
                statusCode = 500;
                message = "Unknown";
            }

            logs.Add(new ConcurrencyExecutionLog
            {
                WorkerId = workerId,
                ThreadId = Environment.CurrentManagedThreadId,
                StartTime = startTime,
                EndTime = endTime,
                DurationMs = sw.ElapsedMilliseconds,
                StatusCode = statusCode,
                ResultMessage = message
            });
        })).ToArray();

        // Chờ tất cả 5 thread tập hợp đầy đủ trước cổng
        readyGate.Wait();
        // MỞ CỔNG: 5 Worker xuất phát tại cùng một tích tắc
        startGate.Set();
        await Task.WhenAll(tasks);

        // ASSERT & BẰNG CHỨNG ĐỐI SOÁT
        var logList = logs.OrderBy(l => l.StartTime).ToList();
        _output.WriteLine("=================================================================");
        _output.WriteLine(" KẾT QUẢ ĐỐI SOÁT TRANH CHẤP SUẤT KHÁM CUỐI CÙNG (QUOTA = 1):");
        _output.WriteLine("=================================================================");

        foreach (var l in logList)
        {
            _output.WriteLine($"Worker {l.WorkerId} [Thread {l.ThreadId}]: Bắt đầu={l.StartTime:HH:mm:ss.fff} | Kết thúc={l.EndTime:HH:mm:ss.fff} | Thời lượng={l.DurationMs}ms | HTTP={l.StatusCode} | {l.ResultMessage}");
        }

        // 1. Kiểm tra sự chồng lấn thời gian thực tế (True Overlap)
        var minEndTime = logList.Min(l => l.EndTime);
        var maxStartTime = logList.Max(l => l.StartTime);
        var overlapMs = (minEndTime - maxStartTime).TotalMilliseconds;
        _output.WriteLine($"-> Độ chồng lấn thời gian giữa các Request: {overlapMs:F2}ms");

        // 2. Kiểm tra chỉ có duy nhất 1 suất thành công
        var successCount = logList.Count(l => l.StatusCode == 200);
        var rejectedCount = logList.Count(l => l.StatusCode == 400);

        _output.WriteLine($"-> Tổng request: 5 | Thành công (200): {successCount} | Bị từ chối (400): {rejectedCount}");

        Assert.Equal(1, successCount);
        Assert.Equal(4, rejectedCount);

        // 3. Kiểm tra tính toàn vẹn trong CSDL
        using (var verifyContext = CreateSharedInMemoryDbContext(dbName))
        {
            var dbCount = await verifyContext.Appointments
                .CountAsync(a => a.ScheduleId == scheduleId && a.AppointmentDate.Date == targetDate && a.Status != "Cancelled");
            _output.WriteLine($"-> Số bản ghi lịch hẹn lưu trong CSDL: {dbCount} (Kỳ vọng: 1)");
            Assert.Equal(1, dbCount);
        }
    }

    [Fact]
    public async Task Concurrency_TwoKiosksIssuingTicketsSimultaneously_MustHaveStrictTimeOverlap_AndUniqueSequenceNumbers()
    {
        // ARRANGE: Thiết lập 2 Kiosk độc lập cùng phát lệnh cấp số cho 2 bệnh nhân
        var dbName = "StressDb_Queue_" + Guid.NewGuid();
        var deptId = Guid.NewGuid();
        var patientId1 = Guid.NewGuid();
        var patientId2 = Guid.NewGuid();

        using (var setupContext = CreateSharedInMemoryDbContext(dbName))
        {
            setupContext.Departments.Add(new Department { Id = deptId, DepartmentName = "Khoa Cấp Cứu" });
            setupContext.Patients.AddRange(
                new Patient { Id = patientId1, FullName = "BN Kiosk Alpha", PatientCode = "BN_ALPHA" },
                new Patient { Id = patientId2, FullName = "BN Kiosk Beta", PatientCode = "BN_BETA" }
            );
            await setupContext.SaveChangesAsync();
        }

        var startGate = new ManualResetEventSlim(false);
        var readyGate = new CountdownEvent(2);
        var logs = new ConcurrentBag<ConcurrencyExecutionLog>();
        var sequenceNumbers = new ConcurrentBag<int>();

        // ACT
        var task1 = Task.Run(async () =>
        {
            using var ctx1 = CreateSharedInMemoryDbContext(dbName);
            var service1 = new QueueEngine(ctx1);
            readyGate.Signal();
            startGate.Wait();

            var sw = Stopwatch.StartNew();
            var startTime = DateTime.UtcNow;

            var ticket = await service1.IssueQueueTicketAsync(new IssueQueueTicketDto
            {
                PatientId = patientId1,
                DepartmentId = deptId,
                Priority = "Normal"
            });

            sw.Stop();
            sequenceNumbers.Add(ticket.SequenceNumber);
            logs.Add(new ConcurrencyExecutionLog
            {
                WorkerId = 1,
                ThreadId = Environment.CurrentManagedThreadId,
                StartTime = startTime,
                EndTime = DateTime.UtcNow,
                DurationMs = sw.ElapsedMilliseconds,
                StatusCode = 200,
                ResultMessage = $"STT: {ticket.SequenceNumber}"
            });
        });

        var task2 = Task.Run(async () =>
        {
            using var ctx2 = CreateSharedInMemoryDbContext(dbName);
            var service2 = new QueueEngine(ctx2);
            readyGate.Signal();
            startGate.Wait();

            var sw = Stopwatch.StartNew();
            var startTime = DateTime.UtcNow;

            var ticket = await service2.IssueQueueTicketAsync(new IssueQueueTicketDto
            {
                PatientId = patientId2,
                DepartmentId = deptId,
                Priority = "Normal"
            });

            sw.Stop();
            sequenceNumbers.Add(ticket.SequenceNumber);
            logs.Add(new ConcurrencyExecutionLog
            {
                WorkerId = 2,
                ThreadId = Environment.CurrentManagedThreadId,
                StartTime = startTime,
                EndTime = DateTime.UtcNow,
                DurationMs = sw.ElapsedMilliseconds,
                StatusCode = 200,
                ResultMessage = $"STT: {ticket.SequenceNumber}"
            });
        });

        readyGate.Wait();
        startGate.Set();
        await Task.WhenAll(task1, task2);

        // ASSERT
        var logList = logs.OrderBy(l => l.StartTime).ToList();
        _output.WriteLine("=================================================================");
        _output.WriteLine(" KẾT QUẢ CẤP SỐ THỨ TỰ TẠI 2 KIOSK ĐỒNG THỜI:");
        _output.WriteLine("=================================================================");
        foreach (var l in logList)
        {
            _output.WriteLine($"Kiosk {l.WorkerId} [Thread {l.ThreadId}]: Bắt đầu={l.StartTime:HH:mm:ss.fff} | Kết thúc={l.EndTime:HH:mm:ss.fff} | {l.ResultMessage}");
        }

        Assert.Equal(2, sequenceNumbers.Distinct().Count());
        Assert.Contains(101, sequenceNumbers);
        Assert.Contains(102, sequenceNumbers);
    }

    [Fact]
    public async Task CheckInQr_WhenAppointmentIsForTomorrow_MustRejectWithBadRequest()
    {
        // ARRANGE: Bệnh nhân đặt lịch cho ngày mai theo giờ Việt Nam
        var dbName = "StressDb_CheckInRule_" + Guid.NewGuid();
        var tomorrowVn = AppointmentsController.GetVietnamNow().AddDays(1).ToString("yyyy-MM-dd");

        using var context = CreateSharedInMemoryDbContext(dbName);
        var hubContext = CreateMockHubContext();
        var controller = new AppointmentsController(hubContext, context)
        {
            ControllerContext = CreateControllerContext("Receptionist")
        };

        var aptItem = new OnlineAppointmentItem
        {
            PatientName = "Bệnh nhân Đặt Ngày Mai",
            PatientPhone = "0933112233",
            IdentityCardNumber = "079090888999",
            AppointmentDate = tomorrowVn,
            AppointmentTime = "09:00 - 09:30",
            DepartmentName = "Khoa Tim Mạch",
            SymptomsReason = "Khám định kỳ ngày mai"
        };
        var createResult = await controller.CreateAppointment(aptItem) as OkObjectResult;
        Assert.NotNull(createResult);
        var createdApt = createResult.Value as OnlineAppointmentItem;
        Assert.NotNull(createdApt);

        // ACT: Cố tình Check-in tại Kiosk vào ngày hôm nay (trước 1 ngày)
        var checkinResult = await controller.CheckInWithQr(new CheckInQrDto
        {
            QrCodeOrId = createdApt.Id
        });

        // ASSERT: Hệ thống phải từ chối với HTTP 400 Bad Request
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(checkinResult);
        _output.WriteLine($"-> Kết quả chặn Check-in trước ngày: {badRequestResult.Value}");
        Assert.Contains("Chưa đến ngày khám hẹn", badRequestResult.Value?.ToString());
    }

    [Fact]
    public async Task CheckInQr_WhenPatientAttemptsToCheckInAnotherPatientsAppointment_MustBeForbidden_403()
    {
        // ARRANGE: Bệnh nhân A (SĐT: 0911000111) đặt lịch
        var dbName = "StressDb_CheckInIDOR_" + Guid.NewGuid();
        var todayVn = AppointmentsController.GetVietnamNow().ToString("yyyy-MM-dd");

        using var context = CreateSharedInMemoryDbContext(dbName);
        var hubContext = CreateMockHubContext();
        var controllerA = new AppointmentsController(hubContext, context)
        {
            ControllerContext = CreateControllerContext("Patient", "0911000111")
        };

        var aptItem = new OnlineAppointmentItem
        {
            PatientName = "Bệnh nhân Nguyễn Văn A",
            PatientPhone = "0911000111",
            IdentityCardNumber = "079090111222",
            AppointmentDate = todayVn,
            AppointmentTime = "08:00 - 08:30",
            DepartmentName = "Khoa Nội",
            SymptomsReason = "Khám sức khỏe tổng quát"
        };
        var createResult = await controllerA.CreateAppointment(aptItem) as OkObjectResult;
        Assert.NotNull(createResult);
        var createdApt = createResult.Value as OnlineAppointmentItem;
        Assert.NotNull(createdApt);

        // ACT: Bệnh nhân B (SĐT: 0988777666) dùng tài khoản của mình để quét mã Check-in lịch của bệnh nhân A
        var controllerB = new AppointmentsController(hubContext, context)
        {
            ControllerContext = CreateControllerContext("Patient", "0988777666")
        };

        var checkinResult = await controllerB.CheckInWithQr(new CheckInQrDto
        {
            QrCodeOrId = createdApt.Id
        });

        // ASSERT: Hệ thống phải từ chối truy cập với HTTP 403 Forbidden
        var objectResult = Assert.IsType<ObjectResult>(checkinResult);
        Assert.Equal(403, objectResult.StatusCode);
        _output.WriteLine($"-> Kết quả chặn IDOR Check-in lịch của người khác: {objectResult.Value}");
        Assert.Contains("không có quyền check-in lịch hẹn của bệnh nhân khác", objectResult.Value?.ToString());
    }

    [Fact]
    public async Task QueuePriority_ElderlyFrom75AndChildrenUnder6_MustHavePriority_UnderLaw15_2023()
    {
        // ARRANGE: Kiểm tra quy tắc ưu tiên theo Khoản 2 Điều 3 Luật Khám bệnh, chữa bệnh số 15/2023/QH15
        var dbName = "StressDb_Law15Queue_" + Guid.NewGuid();
        var deptId = Guid.NewGuid();
        var elderlyPatientId = Guid.NewGuid();
        var childPatientId = Guid.NewGuid();
        var normalPatientId = Guid.NewGuid();

        using (var setupContext = CreateSharedInMemoryDbContext(dbName))
        {
            var dept = new Department { Id = deptId, DepartmentName = "Khoa Lão & Nhi" };
            var elderly = new Patient
            {
                Id = elderlyPatientId,
                FullName = "Cụ Bùi Văn Cao (76 tuổi)",
                PatientCode = "BN_ELDERLY",
                DateOfBirth = DateTime.UtcNow.AddYears(-76), // 76 tuổi (>= 75 tuổi)
                IdentityCardNumber = "001048000111"
            };
            var child = new Patient
            {
                Id = childPatientId,
                FullName = "Bé Trần Minh Khôi (4 tuổi)",
                PatientCode = "BN_CHILD",
                DateOfBirth = DateTime.UtcNow.AddYears(-4), // 4 tuổi (< 6 tuổi)
                IdentityCardNumber = "001220000222"
            };
            var normal = new Patient
            {
                Id = normalPatientId,
                FullName = "Anh Lê Văn Hải (30 tuổi)",
                PatientCode = "BN_NORMAL",
                DateOfBirth = DateTime.UtcNow.AddYears(-30), // 30 tuổi
                IdentityCardNumber = "001194000333"
            };

            setupContext.Departments.Add(dept);
            setupContext.Patients.AddRange(elderly, child, normal);
            await setupContext.SaveChangesAsync();
        }

        using var context = CreateSharedInMemoryDbContext(dbName);
        var queueService = new QueueEngine(context);

        // ACT: Tiếp nhận cấp STT cho cả 3 bệnh nhân
        var ticketElderly = await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = elderlyPatientId,
            DepartmentId = deptId,
            Priority = "Normal" // Gửi Normal nhưng hệ thống tự đánh giá theo Luật KBCB
        });

        var ticketChild = await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = childPatientId,
            DepartmentId = deptId,
            Priority = "Normal"
        });

        var ticketNormal = await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = normalPatientId,
            DepartmentId = deptId,
            Priority = "Normal"
        });

        // ASSERT:
        _output.WriteLine($"-> Bệnh nhân 76 tuổi: Priority={ticketElderly.Priority} | Lý do: {ticketElderly.PriorityReason}");
        _output.WriteLine($"-> Bệnh nhân 4 tuổi: Priority={ticketChild.Priority} | Lý do: {ticketChild.PriorityReason}");
        _output.WriteLine($"-> Bệnh nhân 30 tuổi: Priority={ticketNormal.Priority}");

        Assert.Equal("Priority", ticketElderly.Priority);
        Assert.Contains("75 tuổi", ticketElderly.PriorityReason);

        Assert.Equal("Priority", ticketChild.Priority);
        Assert.Contains("dưới 6 tuổi", ticketChild.PriorityReason);

        Assert.Equal("Normal", ticketNormal.Priority);
    }

    [Fact]
    public async Task VerifySignature_PublicEndpoint_MustMaskPatientPII()
    {
        // ARRANGE: Thiết lập lượt khám đã được ký số
        var dbName = "StressDb_VerifyPII_" + Guid.NewGuid();
        var examId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();

        using (var setupContext = CreateSharedInMemoryDbContext(dbName))
        {
            var doctor = new User
            {
                Id = doctorId,
                FullName = "BS. CKII. Nguyễn Thanh Duy",
                Username = "dr.duy"
            };
            var patient = new Patient
            {
                Id = Guid.NewGuid(),
                FullName = "Đặng Hoàng Yến",
                PatientCode = "BN_SECRET_01",
                IdentityCardNumber = "079199000888",
                DateOfBirth = DateTime.UtcNow.AddYears(-28)
            };
            var exam = new Examination
            {
                Id = examId,
                ExaminationCode = "EXAM2026-9999",
                Patient = patient,
                Doctor = doctor,
                DoctorId = doctorId,
                ExaminationDate = DateTime.UtcNow,
                IsDigitallySigned = true,
                DigitalSignature = "BYT.SMARTCA.TEST_SIGNATURE_DATA",
                SignatureHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                DoctorLicenseNumber = "029831/BYT-CCHN",
                SignatureCertificateSerial = "5404-B7A1-99887766",
                SignedAt = DateTime.UtcNow
            };

            setupContext.Users.Add(doctor);
            setupContext.Patients.Add(patient);
            setupContext.Examinations.Add(exam);
            await setupContext.SaveChangesAsync();
        }

        using var context = CreateSharedInMemoryDbContext(dbName);
        var examService = new HospitalAI.Infrastructure.Services.ExaminationService(context);

        // ACT: Gọi hàm tra cứu xác thực công khai
        var verifyResult = await examService.VerifySignatureAsync(examId);

        // ASSERT: Xác nhận họ tên bệnh nhân, mã bệnh án đầy đủ và CCHN đã được che mặt nạ PII
        _output.WriteLine($"-> Verify Result: IsValid={verifyResult.IsValid} | PatientName={verifyResult.PatientName} | ExamCode={verifyResult.ExaminationCode} | Doctor={verifyResult.DoctorName}");

        Assert.Contains("***", verifyResult.PatientName);
        Assert.DoesNotContain("Đặng Hoàng Yến", verifyResult.PatientName);
        Assert.Contains("***", verifyResult.ExaminationCode);
        Assert.DoesNotContain("EXAM2026-9999", verifyResult.ExaminationCode);
        Assert.Contains("Mô phỏng Toàn vẹn Dữ liệu HMAC-SHA256", verifyResult.CertificateIssuer);
    }

    [Fact]
    public async Task Billing_WhenAdminAttemptsToPayCashOrTransfer_MustBeForbidden()
    {
        // ARRANGE: Thiết lập hóa đơn chưa thanh toán
        var dbName = "StressDb_AdminBilling_" + Guid.NewGuid();
        var billingId = Guid.NewGuid();

        using (var setupContext = CreateSharedInMemoryDbContext(dbName))
        {
            var billing = new Billing
            {
                Id = billingId,
                BillingType = "Prescription",
                TotalAmount = 250000,
                Status = "Unpaid",
                CreatedAt = DateTime.UtcNow
            };
            setupContext.Billings.Add(billing);
            await setupContext.SaveChangesAsync();
        }

        using var context = CreateSharedInMemoryDbContext(dbName);
        var controller = new BillingController(context)
        {
            ControllerContext = CreateControllerContext("Admin", "admin_user")
        };

        // ACT & ASSERT: Kiểm tra thuộc tính Authorize trên PayCash và PayTransfer đã loại trừ Admin
        var payCashAttrs = typeof(BillingController)
            .GetMethod("PayCash")!
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            as Microsoft.AspNetCore.Authorization.AuthorizeAttribute[];

        var payTransferAttrs = typeof(BillingController)
            .GetMethod("PayTransfer")!
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            as Microsoft.AspNetCore.Authorization.AuthorizeAttribute[];

        Assert.NotNull(payCashAttrs);
        Assert.NotNull(payTransferAttrs);

        var cashRoles = payCashAttrs[0].Roles ?? "";
        var transferRoles = payTransferAttrs[0].Roles ?? "";

        _output.WriteLine($"-> Quyền hạn PayCash: '{cashRoles}'");
        _output.WriteLine($"-> Quyền hạn PayTransfer: '{transferRoles}'");

        Assert.DoesNotContain("Admin", cashRoles.Split(','));
        Assert.DoesNotContain("Admin", transferRoles.Split(','));
        Assert.Contains("Cashier", cashRoles.Split(','));
        Assert.Contains("Cashier", transferRoles.Split(','));
    }

    [Fact]
    public async Task Concurrency_TwoIndependentBackendInstances_ContendingForSingleSlot_MustPreventOverbooking()
    {
        // ARRANGE: Mô phỏng 2 Instance Backend độc lập (Instance Alpha & Instance Beta) cùng chia sẻ CSDL
        // Thiết lập khung giờ chỉ còn đúng 1 suất khám (Capacity = 1)
        var dbName = "StressDb_MultiInstanceQuota_" + Guid.NewGuid();
        var doctorId = Guid.NewGuid();
        var deptId = Guid.NewGuid();
        var scheduleId = Guid.NewGuid();
        var targetDate = AppointmentsController.GetVietnamNow().Date;

        using (var setupContext = CreateSharedInMemoryDbContext(dbName))
        {
            var dept = new Department { Id = deptId, DepartmentName = "Khoa Tai Mũi Họng" };
            var staff = new StaffProfile { Id = doctorId, FullName = "BS. CKII. Nguyễn Thanh Duy", DepartmentId = deptId };
            var schedule = new DoctorSchedule
            {
                Id = scheduleId,
                StaffId = doctorId,
                DepartmentId = deptId,
                WorkDate = targetDate,
                TimeSlot = "10:00 - 10:30",
                MaxPatients = 1 // DUY NHẤT 1 SUẤT KHÁM
            };
            setupContext.Departments.Add(dept);
            setupContext.StaffProfiles.Add(staff);
            setupContext.DoctorSchedules.Add(schedule);
            await setupContext.SaveChangesAsync();
        }

        var startGate = new ManualResetEventSlim(false);
        var readyGate = new CountdownEvent(2);
        var results = new ConcurrentBag<(string InstanceName, int StatusCode, string Message)>();

        // ACT: 2 Instance Backend độc lập gửi request cùng một thời điểm
        var taskInstanceAlpha = Task.Run(async () =>
        {
            using var ctxAlpha = CreateSharedInMemoryDbContext(dbName);
            var hubAlpha = CreateMockHubContext();
            var controllerAlpha = new AppointmentsController(hubAlpha, ctxAlpha)
            {
                ControllerContext = CreateControllerContext("Patient", "0901000111")
            };

            readyGate.Signal();
            startGate.Wait();

            var res = await controllerAlpha.CreateAppointment(new OnlineAppointmentItem
            {
                PatientName = "Bệnh nhân Alpha",
                PatientPhone = "0901000111",
                IdentityCardNumber = "079090111111",
                AppointmentDate = targetDate.ToString("yyyy-MM-dd"),
                AppointmentTime = "10:00 - 10:30",
                DepartmentName = "Khoa Tai Mũi Họng",
                SymptomsReason = "Đau họng cấp (Instance Alpha)"
            });

            if (res is OkObjectResult)
            {
                results.Add(("Backend Instance Alpha", 200, "Đặt lịch thành công"));
            }
            else if (res is BadRequestObjectResult bad)
            {
                results.Add(("Backend Instance Alpha", 400, bad.Value?.ToString() ?? ""));
            }
            else if (res is ObjectResult obj)
            {
                results.Add(("Backend Instance Alpha", obj.StatusCode ?? 500, obj.Value?.ToString() ?? ""));
            }
        });

        var taskInstanceBeta = Task.Run(async () =>
        {
            using var ctxBeta = CreateSharedInMemoryDbContext(dbName);
            var hubBeta = CreateMockHubContext();
            var controllerBeta = new AppointmentsController(hubBeta, ctxBeta)
            {
                ControllerContext = CreateControllerContext("Patient", "0902000222")
            };

            readyGate.Signal();
            startGate.Wait();

            var res = await controllerBeta.CreateAppointment(new OnlineAppointmentItem
            {
                PatientName = "Bệnh nhân Beta",
                PatientPhone = "0902000222",
                IdentityCardNumber = "079090222222",
                AppointmentDate = targetDate.ToString("yyyy-MM-dd"),
                AppointmentTime = "10:00 - 10:30",
                DepartmentName = "Khoa Tai Mũi Họng",
                SymptomsReason = "Nghẹt mũi cấp (Instance Beta)"
            });

            if (res is OkObjectResult)
            {
                results.Add(("Backend Instance Beta", 200, "Đặt lịch thành công"));
            }
            else if (res is BadRequestObjectResult bad)
            {
                results.Add(("Backend Instance Beta", 400, bad.Value?.ToString() ?? ""));
            }
            else if (res is ObjectResult obj)
            {
                results.Add(("Backend Instance Beta", obj.StatusCode ?? 500, obj.Value?.ToString() ?? ""));
            }
        });

        readyGate.Wait();
        startGate.Set();
        await Task.WhenAll(taskInstanceAlpha, taskInstanceBeta);

        // ASSERT:
        _output.WriteLine("=================================================================");
        _output.WriteLine(" KẾT QUẢ ĐỐI SOÁT TRANH CHẤP 2 BACKEND INSTANCE ĐỘC LẬP (QUOTA = 1):");
        _output.WriteLine("=================================================================");
        foreach (var r in results)
        {
            _output.WriteLine($"-> {r.InstanceName}: HTTP {r.StatusCode} | {r.Message}");
        }

        var successCount = results.Count(r => r.StatusCode == 200);
        var rejectCount = results.Count(r => r.StatusCode == 400);

        _output.WriteLine($"-> Tổng instance tranh chấp: 2 | Thành công: {successCount} | Bị từ chối: {rejectCount}");

        using (var verifyContext = CreateSharedInMemoryDbContext(dbName))
        {
            var dbAppointmentCount = await verifyContext.Appointments
                .CountAsync(a => a.ScheduleId == scheduleId && a.AppointmentDate.Date == targetDate && a.Status != "Cancelled");
            _output.WriteLine($"-> Số bản ghi lịch hẹn thực tế trong CSDL: {dbAppointmentCount} (Kỳ vọng: 1)");

            Assert.Equal(1, successCount);
            Assert.Equal(1, rejectCount);
            Assert.Equal(1, dbAppointmentCount);
        }
    }

    [Fact]
    public void RolePolicy_TriageAndNurse_MustNotHaveCrossOverUnauthorizedAccess()
    {
        // 1. Kiểm tra endpoint Cập nhật Kết quả Cận lâm sàng (CLS):
        // Chỉ dành cho 'Nurse,Doctor'. Tuyệt đối KHÔNG cấp quyền cho 'Triage'
        var clsAttrs = typeof(ExaminationsController)
            .GetMethod("UpdateClsResult")!
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            as Microsoft.AspNetCore.Authorization.AuthorizeAttribute[];

        Assert.NotNull(clsAttrs);
        var clsRoles = clsAttrs[0].Roles?.Split(',') ?? Array.Empty<string>();
        _output.WriteLine($"-> Quyền hạn UpdateClsResult: '{clsAttrs[0].Roles}'");
        Assert.Contains("Nurse", clsRoles);
        Assert.Contains("Doctor", clsRoles);
        Assert.DoesNotContain("Triage", clsRoles); // Triage không được can thiệp CLS

        // 2. Kiểm tra endpoint Ghi nhận Chỉ số Sinh tồn (VitalSigns):
        // Cho phép 'Triage,Nurse,Doctor'
        var vitalAttrs = typeof(ExaminationsController)
            .GetMethod("RecordVitalSigns")!
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            as Microsoft.AspNetCore.Authorization.AuthorizeAttribute[];

        Assert.NotNull(vitalAttrs);
        var vitalRoles = vitalAttrs[0].Roles?.Split(',') ?? Array.Empty<string>();
        _output.WriteLine($"-> Quyền hạn RecordVitalSigns: '{vitalAttrs[0].Roles}'");
        Assert.Contains("Triage", vitalRoles);
        Assert.Contains("Nurse", vitalRoles);
        Assert.Contains("Doctor", vitalRoles);

        // 3. Kiểm tra endpoint Check-in Kiosk:
        // Cho phép 'Receptionist,Triage,Patient'. Tuyệt đối KHÔNG cấp cho 'Nurse'
        var checkinAttrs = typeof(AppointmentsController)
            .GetMethod("CheckInWithQr")!
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            as Microsoft.AspNetCore.Authorization.AuthorizeAttribute[];

        Assert.NotNull(checkinAttrs);
        var checkinRoles = checkinAttrs[0].Roles?.Split(',') ?? Array.Empty<string>();
        _output.WriteLine($"-> Quyền hạn CheckInWithQr: '{checkinAttrs[0].Roles}'");
        Assert.Contains("Receptionist", checkinRoles);
        Assert.Contains("Triage", checkinRoles);
        Assert.Contains("Patient", checkinRoles);
        Assert.DoesNotContain("Nurse", checkinRoles); // Nurse không làm tiếp nhận Kiosk

        // 4. Kiểm tra endpoint Cấu hình Khung giờ khám (Slots):
        // Cho phép 'Admin,Receptionist,Triage'. Tuyệt đối KHÔNG cấp cho 'Nurse'
        var slotAttrs = typeof(AppointmentsController)
            .GetMethod("UpdateSlot")!
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            as Microsoft.AspNetCore.Authorization.AuthorizeAttribute[];

        Assert.NotNull(slotAttrs);
        var slotRoles = slotAttrs[0].Roles?.Split(',') ?? Array.Empty<string>();
        _output.WriteLine($"-> Quyền hạn UpdateSlot: '{slotAttrs[0].Roles}'");
        Assert.Contains("Triage", slotRoles);
        Assert.DoesNotContain("Nurse", slotRoles); // Nurse không cấu hình quota phòng khám
    }

    [Fact]
    public async Task QueuePriority_FullCategoriesUnderArticle3_Law15_2023_MustBeRespected()
    {
        // ARRANGE: Kiểm chứng đầy đủ 5 nhóm đối tượng ưu tiên theo Khoản 2 Điều 3 Luật Khám bệnh, chữa bệnh 15/2023/QH15
        var dbName = "StressDb_Article3Full_" + Guid.NewGuid();
        var deptId = Guid.NewGuid();
        var pregnantId = Guid.NewGuid();
        var disabledId = Guid.NewGuid();
        var meritId = Guid.NewGuid();

        using (var setupContext = CreateSharedInMemoryDbContext(dbName))
        {
            var dept = new Department { Id = deptId, DepartmentName = "Khoa Sản - Ngoại" };
            var pPregnant = new Patient { Id = pregnantId, FullName = "Sản phụ Nguyễn Thị Loan (Thai 32 tuần)", DateOfBirth = DateTime.UtcNow.AddYears(-28) };
            var pDisabled = new Patient { Id = disabledId, FullName = "Bệnh nhân Đặng Văn Hùng (Khuyết tật nặng)", DateOfBirth = DateTime.UtcNow.AddYears(-45) };
            var pMerit = new Patient { Id = meritId, FullName = "Bác Hoàng Văn Thắng (Thương binh 1/4)", DateOfBirth = DateTime.UtcNow.AddYears(-68) };

            setupContext.Departments.Add(dept);
            setupContext.Patients.AddRange(pPregnant, pDisabled, pMerit);
            await setupContext.SaveChangesAsync();
        }

        using var context = CreateSharedInMemoryDbContext(dbName);
        var queueService = new QueueEngine(context);

        // ACT: Cấp số thứ tự cho từng nhóm
        var tPregnant = await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = pregnantId,
            DepartmentId = deptId,
            IsPregnant = true
        });

        var tDisabled = await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = disabledId,
            DepartmentId = deptId,
            IsDisabled = true
        });

        var tMerit = await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = meritId,
            DepartmentId = deptId,
            HasRevolutionaryMerit = true
        });

        // ASSERT:
        _output.WriteLine($"-> Sản phụ: Priority={tPregnant.Priority} | {tPregnant.PriorityReason}");
        _output.WriteLine($"-> Người khuyết tật: Priority={tDisabled.Priority} | {tDisabled.PriorityReason}");
        _output.WriteLine($"-> Người có công: Priority={tMerit.Priority} | {tMerit.PriorityReason}");

        Assert.Equal("Priority", tPregnant.Priority);
        Assert.Contains("Phụ nữ có thai", tPregnant.PriorityReason);

        Assert.Equal("Priority", tDisabled.Priority);
        Assert.Contains("Người khuyết tật", tDisabled.PriorityReason);

        Assert.Equal("Priority", tMerit.Priority);
        Assert.Contains("Người có công", tMerit.PriorityReason);
    }
}
