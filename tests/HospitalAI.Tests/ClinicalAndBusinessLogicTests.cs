using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using HospitalAI.Application.DTOs;
using HospitalAI.Domain.Entities;
using HospitalAI.ExaminationService.Controllers;
using HospitalAI.ExaminationService.Security;
using HospitalAI.Infrastructure.Data;
using ExamService = HospitalAI.Infrastructure.Services.ExaminationService;
using QueueEngine = HospitalAI.Infrastructure.Services.QueueService;
using HospitalAI.QueueService.Controllers;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace HospitalAI.Tests;

public class ClinicalAndBusinessLogicTests
{
    private HospitalDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseInMemoryDatabase(databaseName: $"HospitalTestDb_{Guid.NewGuid()}")
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

    [Fact]
    public async Task UpdateExamination_WhenAlreadyDigitallySigned_ShouldThrowInvalidOperationException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientId = Guid.NewGuid();
        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN20269999",
            FullName = "Nguyễn Văn Test",
            Gender = "Nam",
            IdentityCardNumber = "038090123456",
            Address = "TP.HCM"
        });

        var examId = Guid.NewGuid();
        context.Examinations.Add(new Examination
        {
            Id = examId,
            ExaminationCode = "LK20261122-0001",
            PatientId = patientId,
            Subjective = "Đau đầu âm ỉ",
            Assessment = "Viêm mũi xoang cấp",
            ICD10Code = "J01.9",
            ICD10Name = "Viêm xoang cấp tính, không xác định",
            Plan = "Uống thuốc 7 ngày",
            Status = "Hoàn thành",
            IsDigitallySigned = true, // Đã ký số điện tử
            DigitalSignature = "BYT.SMARTCA.MOCK_TEST_SIGNATURE",
            SignedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var service = new ExamService(context);
        var updateDto = new CreateExaminationDto
        {
            PatientId = patientId,
            Subjective = "Cố tình sửa đổi bệnh án sau ký",
            Assessment = "Thay đổi chẩn đoán",
            ICD10Code = "A00.0",
            Plan = "Phác đồ giả mạo"
        };

        // Act & Assert: Phải chặn việc sửa đổi trực tiếp bệnh án đã ký số
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateExaminationAsync(examId, updateDto));

        Assert.Contains("ký số điện tử", ex.Message);
    }

    [Fact]
    public async Task DeleteExamination_WhenAlreadyDigitallySigned_ShouldThrowInvalidOperationException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientId = Guid.NewGuid();
        var examId = Guid.NewGuid();
        context.Examinations.Add(new Examination
        {
            Id = examId,
            ExaminationCode = "LK20261122-0002",
            PatientId = patientId,
            Subjective = "Khám tổng quát",
            Status = "Hoàn thành",
            IsDigitallySigned = true,
            DigitalSignature = "BYT.SMARTCA.SIGNED_EMR"
        });
        await context.SaveChangesAsync();

        var service = new ExamService(context);

        // Act & Assert: Phải chặn việc xóa bệnh án đã ký số
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DeleteExaminationAsync(examId));

        Assert.Contains("ký số", ex.Message);
    }

    [Fact]
    public async Task CreateExamination_ShouldRecordVitalSignHistoryInSeparateTable()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientId = Guid.NewGuid();
        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN20268888",
            FullName = "Trần Thị Test",
            Gender = "Nữ",
            IdentityCardNumber = "079090123456",
            Address = "Hà Nội"
        });
        await context.SaveChangesAsync();

        var service = new ExamService(context);
        var createDto = new CreateExaminationDto
        {
            PatientId = patientId,
            Subjective = "Ho khan, sốt nhẹ",
            PulseRate = 82,
            Temperature = 37.8m,
            BloodPressure = "125/85",
            RespiratoryRate = 19,
            Weight = 55.5m,
            Height = 160m,
            Assessment = "Viêm họng cấp",
            ICD10Code = "J02.9",
            ICD10Name = "Viêm họng cấp, không xác định",
            Plan = "Uống kháng sinh 5 ngày"
        };

        // Act
        var result = await service.CreateExaminationAsync(createDto);

        // Assert: Bảng ChiSoSinhHieu (VitalSigns) phải có dòng lưu vết tương ứng
        var vitalSign = await context.VitalSigns.FirstOrDefaultAsync(v => v.ExaminationId == result.Id);
        Assert.NotNull(vitalSign);
        Assert.Equal(82, vitalSign.PulseRate);
        Assert.Equal(37.8m, vitalSign.Temperature);
        Assert.Equal(125, vitalSign.SystolicBloodPressure);
        Assert.Equal(85, vitalSign.DiastolicBloodPressure);
        Assert.Equal(55.5m, vitalSign.Weight);
        Assert.Equal(160m, vitalSign.Height);
    }

    [Fact]
    public async Task IssueQueueTicket_WhenSamePatientAlreadyWaitingInDepartment_ShouldReturnExistingTicketWithoutDuplicate()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientId = Guid.NewGuid();
        var deptId = Guid.NewGuid();

        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN20261111",
            FullName = "Lê Văn Hàng Chờ",
            Gender = "Nam",
            IdentityCardNumber = "012345678901",
            Address = "Đà Nẵng"
        });

        context.Departments.Add(new Department
        {
            Id = deptId,
            DepartmentName = "Khoa Nội Tổng Hợp",
            Location = "Tầng 1 - Khu A",
            RoomType = "KhamLamSang"
        });
        await context.SaveChangesAsync();

        var queueService = new QueueEngine(context);

        // Act 1: Lấy STT lần đầu
        var ticket1 = await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patientId,
            DepartmentId = deptId,
            Priority = "Normal"
        });

        // Act 2: Bấm lấy STT lần hai cho cùng bệnh nhân tại cùng khoa trong ngày
        var ticket2 = await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patientId,
            DepartmentId = deptId,
            Priority = "Normal"
        });

        // Assert: Không được sinh STT mới, phải trả về chính ticket cũ (Idempotent)
        Assert.Equal(ticket1.Id, ticket2.Id);
        Assert.Equal(ticket1.SequenceNumber, ticket2.SequenceNumber);

        var count = await context.QueueTickets.CountAsync(q => q.PatientId == patientId && q.DepartmentId == deptId);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task IssueQueueTicket_ConcurrentRequests_ShouldProduceStrictlyUniqueSequences()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var deptId = Guid.NewGuid();
        context.Departments.Add(new Department
        {
            Id = deptId,
            DepartmentName = "Khoa Ngoại Tổng Hợp",
            Location = "Tầng 2 - Khu B",
            RoomType = "KhamLamSang"
        });

        var patientIds = new List<Guid>();
        for (int i = 0; i < 10; i++)
        {
            var pId = Guid.NewGuid();
            patientIds.Add(pId);
            context.Patients.Add(new Patient
            {
                Id = pId,
                PatientCode = $"BN2026_{i:D4}",
                FullName = $"Bệnh nhân song song {i}",
                Gender = "Nam",
                IdentityCardNumber = $"0792026{i:D5}",
                Address = "TP.HCM"
            });
        }
        await context.SaveChangesAsync();

        var queueService = new QueueEngine(context);

        // Act: 10 bệnh nhân bấm lấy STT đồng thời (Concurrency check)
        var taskList = new List<Task<QueueTicketDto>>();
        foreach (var pId in patientIds)
        {
            taskList.Add(queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
            {
                PatientId = pId,
                DepartmentId = deptId,
                Priority = "Normal"
            }));
        }

        var tickets = await Task.WhenAll(taskList);

        // Assert: Tất cả số thứ tự STT phải tuyệt đối duy nhất, không được trùng nhau
        var sequences = tickets.Select(t => t.SequenceNumber).ToList();
        Assert.Equal(10, sequences.Distinct().Count());
    }

    [Fact]
    public async Task Examination_CompleteWithPendingCLS_ShouldThrowInvalidOperationException()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientId = Guid.NewGuid();
        var examId = Guid.NewGuid();

        var exam = new Examination
        {
            Id = examId,
            ExaminationCode = "LK20261122-0005",
            PatientId = patientId,
            Subjective = "Đau tức ngực trái",
            Status = "WaitingCLS",
            ServiceOrderDetails = new List<ServiceOrderDetail>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    ExaminationId = examId,
                    ServiceName = "Điện tâm đồ (ECG)",
                    Status = "Chờ thực hiện" // Kết quả chưa có
                }
            }
        };
        context.Examinations.Add(exam);
        await context.SaveChangesAsync();

        var service = new ExamService(context);
        var updateDto = new CreateExaminationDto
        {
            PatientId = patientId,
            Subjective = "Đau tức ngực",
            Status = "Hoàn thành" // Cố hoàn thành khi CLS chưa có kết quả
        };

        // Act & Assert: Phải chặn việc hoàn thành lượt khám khi CLS chưa hoàn tất
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateExaminationAsync(examId, updateDto));

        Assert.Contains("cận lâm sàng (CLS) chưa có kết quả", ex.Message);
    }

    [Fact]
    public async Task Pharmacy_DispensePrescription_WhenAlreadyDispensed_ShouldReturn409Conflict()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientId = Guid.NewGuid();
        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN2026PHARM1",
            FullName = "Bệnh nhân Nhà thuốc 1",
            Gender = "Nam",
            IdentityCardNumber = "079090111222",
            Address = "TP.HCM"
        });

        var examId = Guid.NewGuid();
        context.Examinations.Add(new Examination
        {
            Id = examId,
            PatientId = patientId,
            ExaminationCode = "LK20261122-PHARM1",
            PrescriptionDispenseStatus = "Đã cấp phát", // Đã cấp phát trước đó
            PrescriptionDispensedAt = DateTime.UtcNow.AddMinutes(-30),
            PrescriptionDispensedBy = "Nhà thuốc (D-Medical)",
            PrescriptionDetails = new List<PrescriptionDetail>
            {
                new() { ExaminationId = examId, MedicineName = "Paracetamol 500mg", Quantity = 20, UnitPrice = 1500m }
            }
        });
        await context.SaveChangesAsync();

        var controller = new PharmacyController(context)
        {
            ControllerContext = CreateControllerContext("Pharmacy", "DuocSiNguyen")
        };

        // Act: Cố cấp phát lại đơn thuốc đã phát
        var result = await controller.DispensePrescription(examId);

        // Assert: Phải trả về HTTP 409 Conflict chống cấp phát trùng lặp
        var conflictResult = Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal(409, conflictResult.StatusCode);
    }

    [Fact]
    public async Task Pharmacy_DispensePrescription_WhenCancelled_ShouldReturn400BadRequest()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientId = Guid.NewGuid();
        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN2026PHARM2",
            FullName = "Bệnh nhân Nhà thuốc 2",
            Gender = "Nữ",
            IdentityCardNumber = "079090333444",
            Address = "TP.HCM"
        });

        var examId = Guid.NewGuid();
        context.Examinations.Add(new Examination
        {
            Id = examId,
            PatientId = patientId,
            ExaminationCode = "LK20261122-PHARM2",
            PrescriptionDispenseStatus = "Đã hủy", // Bác sĩ đã hủy đơn
            PrescriptionDetails = new List<PrescriptionDetail>
            {
                new() { ExaminationId = examId, MedicineName = "Amoxicillin 500mg", Quantity = 14, UnitPrice = 3000m }
            }
        });
        await context.SaveChangesAsync();

        var controller = new PharmacyController(context)
        {
            ControllerContext = CreateControllerContext("Pharmacy", "DuocSiNguyen")
        };

        // Act: Cố cấp phát đơn thuốc đã hủy
        var result = await controller.DispensePrescription(examId);

        // Assert: Phải trả về HTTP 400 BadRequest
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequestResult.StatusCode);
    }

    [Fact]
    public async Task Billing_PayTransfer_WhenTransactionRefAlreadyExists_ShouldReturn409Conflict()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var existingTxnRef = "FT26322998811";

        // Hóa đơn 1 đã thanh toán với mã tham chiếu này
        context.Billings.Add(new Billing
        {
            Id = Guid.NewGuid(),
            TotalAmount = 250000m,
            Status = "Paid",
            BillingType = "Registration",
            TransactionRef = existingTxnRef
        });

        // Hóa đơn 2 chưa thanh toán
        var bill2Id = Guid.NewGuid();
        context.Billings.Add(new Billing
        {
            Id = bill2Id,
            TotalAmount = 500000m,
            Status = "Pending",
            BillingType = "ServiceOrder"
        });
        await context.SaveChangesAsync();

        var controller = new BillingController(context)
        {
            ControllerContext = CreateControllerContext("Cashier", "ThuNganChi")
        };

        // Act: Hóa đơn 2 cố tái sử dụng mã giao dịch của Hóa đơn 1 (Replay / Duplicate Fraud)
        var result = await controller.PayTransfer(bill2Id, existingTxnRef);

        // Assert: Phải trả về 409 Conflict chặn gian lận giao dịch trùng
        var conflictResult = Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal(409, conflictResult.StatusCode);
    }

    [Fact]
    public void ClinicalGuardrails_SanitizePII_ShouldScrubPhoneCccdEmailAndBhyt()
    {
        // Arrange
        var rawPrompt = "Bệnh nhân có số điện thoại 0987654321, số CCCD 038090123456, email benhnhan@gmail.com và mã thẻ BHYT TE4010123450013 bị sốt cao 39 độ.";

        // Act
        var sanitized = ClinicalGuardrails.SanitizePII(rawPrompt);

        // Assert: Tất cả các trường PII nhạy cảm phải được che mờ theo HIPAA & Nghị định 13/2023
        Assert.DoesNotContain("0987654321", sanitized);
        Assert.DoesNotContain("038090123456", sanitized);
        Assert.DoesNotContain("benhnhan@gmail.com", sanitized);
        Assert.DoesNotContain("TE4010123450013", sanitized);

        Assert.Contains("[SĐT_ĐÃ_MÃ_HÓA]", sanitized);
        Assert.Contains("[CCCD_ĐÃ_MÃ_HÓA]", sanitized);
        Assert.Contains("[EMAIL_ĐÃ_MÃ_HÓA]", sanitized);
        Assert.Contains("[BHYT_ĐÃ_MÃ_HÓA]", sanitized);
    }

    [Fact]
    public async Task Appointments_CreateAppointmentForNewPatient_ShouldPersistPatientAndAppointmentInSql()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var mockHub = CreateMockHubContext();
        var controller = new AppointmentsController(mockHub, context)
        {
            ControllerContext = CreateControllerContext("Patient", "0933888999")
        };

        var model = new OnlineAppointmentItem
        {
            PatientName = "Lê Hoàng Yến",
            PatientPhone = "0933888999",
            IdentityCardNumber = "079195000123",
            PatientGender = "Nữ",
            PatientAge = 28,
            DepartmentName = "Khoa Nội Tổng Hợp",
            AppointmentDate = DateTime.UtcNow.AddDays(2).ToString("yyyy-MM-dd"),
            AppointmentTime = "08:30 - 09:00",
            SymptomsReason = "Đau tức ngực, khó thở nhẹ"
        };

        // Act: Đặt lịch khám trực tuyến khi chưa hề có hồ sơ bệnh nhân trước đó
        var result = await controller.CreateAppointment(model);

        // Assert 1: Controller trả về kết quả thành công OkObjectResult
        var okResult = Assert.IsType<OkObjectResult>(result);
        var createdItem = Assert.IsType<OnlineAppointmentItem>(okResult.Value);
        Assert.False(string.IsNullOrWhiteSpace(createdItem.Id));
        Assert.False(string.IsNullOrWhiteSpace(createdItem.PatientCode));
        Assert.Contains("D_MEDICAL_EXAM_PASS", createdItem.QrCode);

        // Assert 2: Hồ sơ bệnh nhân thực tế ĐÃ ĐƯỢC TẠO LƯU trong Database SQL Server
        var dbPatient = await context.Patients.FirstOrDefaultAsync(p => p.EmergencyContactPhone == "0933888999");
        Assert.NotNull(dbPatient);
        Assert.Equal("Lê Hoàng Yến", dbPatient.FullName);
        Assert.Equal("079195000123", dbPatient.IdentityCardNumber);

        // Assert 3: Bản ghi Appointment thực tế ĐÃ ĐƯỢC TẠO LƯU trong Database SQL Server
        if (Guid.TryParse(createdItem.Id, out var aptGuid))
        {
            var dbAppointment = await context.Appointments.FirstOrDefaultAsync(a => a.Id == aptGuid);
            Assert.NotNull(dbAppointment);
            Assert.Equal(dbPatient.Id, dbAppointment.PatientId);
            Assert.Equal("Pending", dbAppointment.Status);
        }
    }

    [Fact]
    public async Task Appointments_CheckInWithQr_ShouldUpdateStatusToCompletedInSql()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientId = Guid.NewGuid();
        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN20267777",
            FullName = "Ngô Văn CheckIn",
            Gender = "Nam",
            IdentityCardNumber = "079090777777",
            Address = "Bình Dương"
        });

        var deptId = Guid.NewGuid();
        context.Departments.Add(new Department { Id = deptId, DepartmentName = "Khoa Nội", RoomType = "Kham" });
        var schedId = Guid.NewGuid();
        context.DoctorSchedules.Add(new DoctorSchedule { Id = schedId, DepartmentId = deptId, TimeSlot = "08:00 - 08:30" });

        var aptGuid = Guid.NewGuid();
        context.Appointments.Add(new Appointment
        {
            Id = aptGuid,
            PatientId = patientId,
            ScheduleId = schedId,
            AppointmentDate = DateTime.UtcNow.Date.AddHours(9),
            Symptoms = "Tái khám theo lịch hẹn",
            Status = "Pending"
        });
        await context.SaveChangesAsync();

        var mockHub = CreateMockHubContext();
        var controller = new AppointmentsController(mockHub, context)
        {
            ControllerContext = CreateControllerContext("Receptionist", "TiepNhan1")
        };

        // Act: Quét QR Check-in tiếp nhận
        var result = await controller.CheckInWithQr(new CheckInQrDto { QrCodeOrId = aptGuid.ToString() });

        // Assert: Trạng thái trong SQL Server phải chuyển thành Completed
        var okResult = Assert.IsType<OkObjectResult>(result);
        var dbApt = await context.Appointments.FindAsync(aptGuid);
        Assert.NotNull(dbApt);
        Assert.Equal("Completed", dbApt.Status);
    }

    [Fact]
    public async Task Appointments_CancelAppointment_ShouldUpdateStatusToCancelledInSql()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientId = Guid.NewGuid();
        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN20266666",
            FullName = "Võ Văn Hủy",
            Gender = "Nam",
            IdentityCardNumber = "079090666666",
            Address = "Đồng Nai",
            EmergencyContactPhone = "0944555666"
        });

        var aptGuid = Guid.NewGuid();
        context.Appointments.Add(new Appointment
        {
            Id = aptGuid,
            PatientId = patientId,
            AppointmentDate = DateTime.UtcNow.AddDays(3),
            Symptoms = "Khám dạ dày",
            Status = "Pending"
        });
        await context.SaveChangesAsync();

        var mockHub = CreateMockHubContext();
        var controller = new AppointmentsController(mockHub, context)
        {
            ControllerContext = CreateControllerContext("Patient", "0944555666")
        };

        // Act: Bệnh nhân hủy lịch khám
        var result = await controller.CancelAppointment(aptGuid.ToString(), new CancelAppointmentDto { Reason = "Bận việc đột xuất" });

        // Assert: Trạng thái trong SQL Server phải được cập nhật Cancelled
        var okResult = Assert.IsType<OkObjectResult>(result);
        var dbApt = await context.Appointments.FindAsync(aptGuid);
        Assert.NotNull(dbApt);
        Assert.Equal("Cancelled", dbApt.Status);
    }
}

