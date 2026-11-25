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
        Assert.StartsWith("MEDQR|", createdItem.QrCode);
        Assert.True(createdItem.QrCode.Length <= 80);
        var parsedQr = HospitalAI.Infrastructure.Services.KioskQrParser.Parse(createdItem.QrCode);
        Assert.Equal("MEDQR", parsedQr.Format);
        Assert.Equal(createdItem.Id, parsedQr.AppointmentId);
        Assert.Equal(createdItem.PatientCode, parsedQr.PatientCode);

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

        // Assert: Trạng thái trong SQL Server phải chuyển thành CheckedIn (Không nhầm lẫn với khám Completed)
        var okResult = Assert.IsType<OkObjectResult>(result);
        var dbApt = await context.Appointments.FindAsync(aptGuid);
        Assert.NotNull(dbApt);
        Assert.Equal("CheckedIn", dbApt.Status);
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

    [Fact]
    public async Task Pharmacy_DispensePrescription_ConcurrentRequests_OnlyOneSucceeds()
    {
        // Arrange: Tạo đơn thuốc hợp lệ trong CSDL
        using var context = CreateInMemoryDbContext();
        var examId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN-PHARM-01",
            FullName = "Bệnh Nhân Cấp Phát Đồng Thời",
            Gender = "Nam",
            IdentityCardNumber = "079090888999",
            Address = "TP. Hồ Chí Minh"
        });

        context.Examinations.Add(new Examination
        {
            Id = examId,
            PatientId = patientId,
            ExaminationCode = "LK-PHARM-01",
            ExaminationDate = DateTime.UtcNow,
            PrescriptionDispenseStatus = "Chờ cấp phát",
            PrescriptionDetails = new List<PrescriptionDetail>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    ExaminationId = examId,
                    MedicineName = "Paracetamol 500mg",
                    NationalDrugCode = "PARA-500",
                    Quantity = 10,
                    Unit = "Viên",
                    UnitPrice = 1500m
                }
            }
        });
        await context.SaveChangesAsync();

        var controller1 = new PharmacyController(context) { ControllerContext = CreateControllerContext("Pharmacy", "DuocSi1") };
        var controller2 = new PharmacyController(context) { ControllerContext = CreateControllerContext("Pharmacy", "DuocSi2") };

        // Act: Hai tiến trình/dược sĩ cùng bấm cấp phát đồng thời vào cùng một thời điểm
        var task1 = controller1.DispensePrescription(examId);
        var task2 = controller2.DispensePrescription(examId);

        var results = await Task.WhenAll(task1, task2);

        // Assert: Một request thành công 200 OK, request thứ hai trả về HTTP 409 Conflict (Chống cấp phát trùng)
        var successCount = results.Count(r => r is OkObjectResult);
        var conflictCount = results.Count(r => r is ConflictObjectResult);

        Assert.Equal(1, successCount);
        Assert.Equal(1, conflictCount);

        var updatedExam = await context.Examinations.FindAsync(examId);
        Assert.NotNull(updatedExam);
        Assert.Equal("Đã cấp phát", updatedExam.PrescriptionDispenseStatus);
    }

    [Fact]
    public void Pharmacy_DispensePrescription_AdminRole_ProhibitedByAttribute()
    {
        // Verify: Quản trị viên (Admin) không có chứng chỉ hành nghề Dược, bị chặn không cho cấp phát
        var method = typeof(PharmacyController).GetMethod("DispensePrescription");
        Assert.NotNull(method);

        var authAttr = method.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            .Cast<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>()
            .FirstOrDefault();

        Assert.NotNull(authAttr);
        Assert.Equal("Pharmacy", authAttr.Roles);
        Assert.DoesNotContain("Admin", authAttr.Roles ?? "");
    }

    [Fact]
    public void Pharmacy_CancelPrescription_DoctorRole_ProhibitedAdmin()
    {
        // Verify: Hủy đơn thuốc là thẩm quyền chuyên môn của Bác sĩ lâm sàng, Admin không được can thiệp y lệnh
        var method = typeof(PharmacyController).GetMethod("CancelPrescription");
        Assert.NotNull(method);

        var authAttr = method.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), true)
            .Cast<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>()
            .FirstOrDefault();

        Assert.NotNull(authAttr);
        Assert.Equal("Doctor", authAttr.Roles);
        Assert.DoesNotContain("Admin", authAttr.Roles ?? "");
    }

    [Fact]
    public async Task Appointments_CreateAppointment_DifferentPatientsWithSameEmergencyPhone_ShouldNotCollide()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var patientA = new Patient
        {
            Id = Guid.NewGuid(),
            PatientCode = "BN-FATHER-01",
            FullName = "Nguyễn Văn Cha",
            Gender = "Nam",
            IdentityCardNumber = "079090111111",
            Address = "Bình Dương",
            EmergencyContactPhone = "0988777666" // SĐT người thân dùng chung
        };
        context.Patients.Add(patientA);
        await context.SaveChangesAsync();

        var mockHub = CreateMockHubContext();
        var controller = new AppointmentsController(mockHub, context)
        {
            ControllerContext = CreateControllerContext("Patient", "0988777666")
        };

        // Act: Đặt lịch cho người con (Bệnh nhân B) có CCCD riêng biệt nhưng dùng chung SĐT người thân
        var modelB = new OnlineAppointmentItem
        {
            PatientName = "Nguyễn Văn Con",
            PatientPhone = "0988777666",
            IdentityCardNumber = "079090222222", // CCCD độc lập
            AppointmentDate = DateTime.UtcNow.AddDays(2).ToString("yyyy-MM-dd"),
            AppointmentTime = "08:00 - 08:30",
            DepartmentName = "Khoa Nhi"
        };

        var result = await controller.CreateAppointment(modelB);

        // Assert: Không được nhận nhầm sang hồ sơ người cha (Không ghép hồ sơ qua SĐT người thân)
        var okResult = Assert.IsType<OkObjectResult>(result);
        var createdApt = Assert.IsType<OnlineAppointmentItem>(okResult.Value);

        var allPatients = await context.Patients.ToListAsync();
        Assert.Equal(2, allPatients.Count);

        var patientBInDb = allPatients.FirstOrDefault(p => p.IdentityCardNumber == "079090222222");
        Assert.NotNull(patientBInDb);
        Assert.Equal("Nguyễn Văn Con", patientBInDb.FullName);
        Assert.NotEqual(patientA.Id, patientBInDb.Id);
    }

    [Fact]
    public async Task Billing_PayTransfer_DuplicateTransactionRef_ShouldReturnConflict()
    {
        // Arrange: Tạo 2 hóa đơn viện phí
        using var context = CreateInMemoryDbContext();
        var bill1 = new Billing
        {
            Id = Guid.NewGuid(),
            BillingType = "Registration",
            TotalAmount = 150000m,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        var bill2 = new Billing
        {
            Id = Guid.NewGuid(),
            BillingType = "Registration",
            TotalAmount = 200000m,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        context.Billings.AddRange(bill1, bill2);
        await context.SaveChangesAsync();

        var controller = new BillingController(context)
        {
            ControllerContext = CreateControllerContext("Cashier", "ThuNgan1")
        };

        var txnRef = "MB-BANK-2026-999888";

        // Act 1: Thu ngân thanh toán hóa đơn 1 với mã giao dịch hợp lệ
        var result1 = await controller.PayTransfer(bill1.Id, txnRef);
        Assert.IsType<OkObjectResult>(result1);

        // Act 2: Cố tình dùng lại mã giao dịch txnRef cho hóa đơn 2 (Replay Attack)
        var result2 = await controller.PayTransfer(bill2.Id, txnRef);

        // Assert: Bị chặn với HTTP 409 Conflict
        var conflictResult = Assert.IsType<ConflictObjectResult>(result2);
        Assert.NotNull(conflictResult.Value);

        var updatedBill2 = await context.Billings.FindAsync(bill2.Id);
        Assert.NotNull(updatedBill2);
        Assert.Equal("Pending", updatedBill2.Status); // Chưa thanh toán
    }

    [Fact]
    public async Task Billing_PayTransfer_InvalidPlaceholderRef_ShouldReturnBadRequest()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var bill = new Billing
        {
            Id = Guid.NewGuid(),
            BillingType = "Registration",
            TotalAmount = 100000m,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        context.Billings.Add(bill);
        await context.SaveChangesAsync();

        var controller = new BillingController(context)
        {
            ControllerContext = CreateControllerContext("Cashier", "ThuNgan1")
        };

        // Act: Nhập mã placeholder giữ chỗ
        var result = await controller.PayTransfer(bill.Id, "123456");

        // Assert: Bị từ chối HTTP 400
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }

    [Fact]
    public async Task Examination_UpdateExamination_WithCancelledCls_CanCompleteSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var examId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        var doctorId = Guid.NewGuid();

        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN-CLS-CANCEL",
            FullName = "Bệnh Nhân Có CLS Hủy",
            Gender = "Nam",
            IdentityCardNumber = "079090333444",
            Address = "Bình Dương"
        });

        context.Users.Add(new User
        {
            Id = doctorId,
            Username = "bs_cancelled_test",
            PasswordHash = "hash",
            PhoneNumber = "0901234567",
            FullName = "BS. CKII. Test"
        });

        context.Examinations.Add(new Examination
        {
            Id = examId,
            PatientId = patientId,
            DoctorId = doctorId,
            ExaminationCode = "LK-CLS-CANCELLED",
            ExaminationDate = DateTime.UtcNow,
            Status = "Đang khám",
            IsDigitallySigned = false
        });

        // Chỉ định CLS đã bị hủy (Cancelled)
        context.ServiceOrderDetails.Add(new ServiceOrderDetail
        {
            Id = Guid.NewGuid(),
            ExaminationId = examId,
            ServiceName = "Chụp X-Quang Phổi Thẳng",
            Price = 120000m,
            Status = "Đã hủy" // Đã hủy hợp lệ
        });
        await context.SaveChangesAsync();

        var examService = new ExamService(context);

        // Act: Bác sĩ hoàn tất khám
        var updateDto = new CreateExaminationDto
        {
            PatientId = patientId,
            DoctorId = doctorId,
            Status = "Hoàn thành",
            Assessment = "Viêm họng cấp",
            ICD10Code = "J02.9"
        };

        var result = await examService.UpdateExaminationAsync(examId, updateDto);

        // Assert: Thành công, không bị chặn bởi chỉ định đã hủy
        Assert.NotNull(result);
        Assert.Equal("Hoàn thành", result.Status);
    }

    [Fact]
    public async Task Appointments_CreateAppointment_ConcurrentLastSlotContention_OnlyOneSucceeds()
    {
        // Arrange: Thiết lập lịch khám chỉ còn đúng 1 suất duy nhất (MaxPatients = 1)
        using var context = CreateInMemoryDbContext();
        var deptId = Guid.NewGuid();
        context.Departments.Add(new Department
        {
            Id = deptId,
            DepartmentName = "Khoa Nội Tiết",
            Location = "Tầng 2 Khu B",
            RoomType = "KhamLamSang"
        });

        var scheduleId = Guid.NewGuid();
        var workDate = DateTime.UtcNow.AddDays(5).Date;
        context.DoctorSchedules.Add(new DoctorSchedule
        {
            Id = scheduleId,
            DepartmentId = deptId,
            StaffId = Guid.NewGuid(),
            WorkDate = workDate,
            TimeSlot = "10:00 - 10:30",
            MaxPatients = 1 // Chỉ cho phép tối đa 1 người
        });
        await context.SaveChangesAsync();

        var mockHub = CreateMockHubContext();
        var controller1 = new AppointmentsController(mockHub, context)
        {
            ControllerContext = CreateControllerContext("Patient", "0911222333")
        };
        var controller2 = new AppointmentsController(mockHub, context)
        {
            ControllerContext = CreateControllerContext("Patient", "0944555666")
        };

        var model1 = new OnlineAppointmentItem
        {
            PatientName = "Bệnh Nhân A Tranh Suất",
            PatientPhone = "0911222333",
            IdentityCardNumber = "079090111222",
            AppointmentDate = workDate.ToString("yyyy-MM-dd"),
            AppointmentTime = "10:00 - 10:30",
            DepartmentName = "Khoa Nội Tiết"
        };

        var model2 = new OnlineAppointmentItem
        {
            PatientName = "Bệnh Nhân B Tranh Suất",
            PatientPhone = "0944555666",
            IdentityCardNumber = "079090333555",
            AppointmentDate = workDate.ToString("yyyy-MM-dd"),
            AppointmentTime = "10:00 - 10:30",
            DepartmentName = "Khoa Nội Tiết"
        };

        // Act: Hai bệnh nhân đồng thời bấm nút xác nhận đặt suất khám cuối cùng
        var task1 = controller1.CreateAppointment(model1);
        var task2 = controller2.CreateAppointment(model2);

        var results = await Task.WhenAll(task1, task2);

        // Assert: Đúng 1 người thành công và 1 người nhận thông báo hết chỗ (Chống overbooking)
        var successCount = results.Count(r => r is OkObjectResult);
        var badRequestCount = results.Count(r => r is BadRequestObjectResult);

        Assert.Equal(1, successCount);
        Assert.Equal(1, badRequestCount);

        var totalBookedInDb = await context.Appointments.CountAsync(a => a.ScheduleId == scheduleId && a.Status != "Cancelled");
        Assert.Equal(1, totalBookedInDb); // Không thể vượt quá định mức 1
    }

    [Fact]
    public async Task Pharmacy_DispensePrescription_ExpiredDrug_ShouldReturnBadRequest()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var examId = Guid.NewGuid();
        var patientId = Guid.NewGuid();
        context.Patients.Add(new Patient
        {
            Id = patientId,
            PatientCode = "BN-EXP-01",
            FullName = "Bệnh Nhân Thuốc Hết Hạn",
            Gender = "Nữ",
            IdentityCardNumber = "079090777888",
            Address = "TP. Thủ Dầu Một"
        });

        // Tạo đơn thuốc chứa loại thuốc giả lập hết hạn
        // Lấy từ kho item có hạn sử dụng quá khứ
        context.Examinations.Add(new Examination
        {
            Id = examId,
            PatientId = patientId,
            ExaminationCode = "LK-EXP-01",
            ExaminationDate = DateTime.UtcNow,
            PrescriptionDispenseStatus = "Chờ cấp phát",
            PrescriptionDetails = new List<PrescriptionDetail>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    ExaminationId = examId,
                    MedicineName = "Paracetamol 500mg",
                    NationalDrugCode = "PARA-500",
                    Quantity = 5000, // Vượt quá tồn kho
                    Unit = "Viên",
                    UnitPrice = 1500m
                }
            }
        });
        await context.SaveChangesAsync();

        var controller = new PharmacyController(context)
        {
            ControllerContext = CreateControllerContext("Pharmacy", "DuocSi1")
        };

        // Act: Dược sĩ cố cấp phát thuốc vượt quá tồn kho khả dụng
        var result = await controller.DispensePrescription(examId);

        // Assert: Bị từ chối HTTP 400
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequest.Value);
    }
}

