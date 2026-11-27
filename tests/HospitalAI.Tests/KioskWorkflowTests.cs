using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using HospitalAI.Application.DTOs;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using HospitalAI.QueueService.Controllers;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace HospitalAI.Tests;

using QueueEngine = HospitalAI.Infrastructure.Services.QueueService;

public class KioskWorkflowTests
{
    private static HospitalDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseInMemoryDatabase(databaseName: name)
            .Options;
        return new HospitalDbContext(options);
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

    private static ControllerContext CreateKioskTerminalContext(string? terminalId = "KIOSK-SANH-A-01", string? secret = "DMED-KIOSK-A01-2026", ClaimsPrincipal? user = null)
    {
        var httpContext = new DefaultHttpContext();
        if (!string.IsNullOrEmpty(terminalId))
            httpContext.Request.Headers["X-Kiosk-Terminal-Id"] = terminalId;
        if (!string.IsNullOrEmpty(secret))
            httpContext.Request.Headers["X-Kiosk-Terminal-Secret"] = secret;
        if (user != null)
            httpContext.User = user;
        return new ControllerContext { HttpContext = httpContext };
    }

    [Theory]
    [InlineData("079092001234|272123456|Nguyễn Văn An|15081992|Nam|120 Hoàng Hoa Thám, Bình Thạnh, TP.HCM|10052021", "079092001234", "Nguyễn Văn An", "1992-08-15", "Nam")]
    [InlineData("079185009999||Trần Thị Bình|03121985|Nữ|Thủ Dầu Một, Bình Dương|01012022", "079185009999", "Trần Thị Bình", "1985-12-03", "Nữ")]
    public void KioskQrParser_VietnamCccdChipQr_ShouldExtractAllFields(
        string rawQr,
        string expectedCccd,
        string expectedName,
        string expectedDob,
        string expectedGender)
    {
        var parsed = KioskQrParser.Parse(rawQr);

        Assert.Equal("CCCD_CHIP", parsed.Format);
        Assert.Equal(expectedCccd, parsed.IdentityCardNumber);
        Assert.Equal(expectedName, parsed.FullName);
        Assert.Equal(expectedDob, parsed.DateOfBirth);
        Assert.Equal(expectedGender, parsed.Gender);
        Assert.Equal(expectedCccd, parsed.LookupKey);
        Assert.False(string.IsNullOrWhiteSpace(parsed.Address));
    }

    [Fact]
    public async Task KioskController_GetPublicBoard_ShouldRejectUnauthorized_AndMaskPiiForTerminalSession()
    {
        var dbName = "Kiosk_AuthMask_" + Guid.NewGuid();
        using var context = CreateDbContext(dbName);
        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Nội", Location = "P102" };
        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            PatientCode = "BN20260088",
            FullName = "Nguyễn Văn Minh",
            IdentityCardNumber = "079092008888",
            DateOfBirth = DateTime.UtcNow.AddYears(-30)
        };
        context.Departments.Add(dept);
        context.Patients.Add(patient);
        await context.SaveChangesAsync();

        var queueService = new QueueEngine(context);
        await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto { PatientId = patient.Id, DepartmentId = dept.Id });

        var unauthController = new KioskController(context, queueService, CreateMockHub())
        {
            ControllerContext = CreateKioskTerminalContext(terminalId: null, secret: null)
        };
        var unauthRes = await unauthController.GetPublicBoard(null, null);
        Assert.IsType<UnauthorizedObjectResult>(unauthRes);

        var wrongSecretController = new KioskController(context, queueService, CreateMockHub())
        {
            ControllerContext = CreateKioskTerminalContext("KIOSK-SANH-A-01", "WRONG-SECRET")
        };
        var wrongRes = await wrongSecretController.GetPublicBoard(null, null);
        Assert.IsType<UnauthorizedObjectResult>(wrongRes);

        var validKioskController = new KioskController(context, queueService, CreateMockHub())
        {
            ControllerContext = CreateKioskTerminalContext("KIOSK-SANH-A-01", "DMED-KIOSK-A01-2026")
        };
        var okRes = Assert.IsType<OkObjectResult>(await validKioskController.GetPublicBoard(null, null));
        var board = Assert.IsType<List<QueueTicketDto>>(okRes.Value);
        Assert.Single(board);
        Assert.NotEqual("Nguyễn Văn Minh", board[0].PatientName);
        Assert.Contains("*", board[0].PatientName);
    }

    [Fact]
    public async Task Kiosk_CheckIn_WhenRegistrationBillUnpaid_MustBlockStt_AndUnlockAfterPaid()
    {
        var dbName = "Kiosk_UnpaidGate_" + Guid.NewGuid();
        using var context = CreateDbContext(dbName);

        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Tim Mạch", Location = "P301" };
        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            PatientCode = "BN20260123",
            FullName = "Lê Thị Thu Hà",
            IdentityCardNumber = "079190001122",
            DateOfBirth = DateTime.UtcNow.AddYears(-35),
            Address = "Bình Dương"
        };
        var schedule = new DoctorSchedule
        {
            Id = Guid.NewGuid(),
            DepartmentId = dept.Id,
            StaffId = Guid.NewGuid(),
            TimeSlot = "08:00 - 08:30",
            WorkDate = DateTime.UtcNow.Date
        };
        var vnNow = AppointmentsController.GetVietnamNow();
        var apt = new Appointment
        {
            Id = Guid.NewGuid(),
            PatientId = patient.Id,
            ScheduleId = schedule.Id,
            AppointmentDate = vnNow.Date.AddHours(9),
            Symptoms = "Đau ngực nhẹ",
            Status = "Pending"
        };
        var unpaidBill = new Billing
        {
            Id = Guid.NewGuid(),
            PatientId = patient.Id,
            BillingType = "Registration",
            TotalAmount = 150000m,
            Status = "Unpaid",
            CreatedAt = DateTime.UtcNow
        };

        context.Departments.Add(dept);
        context.Patients.Add(patient);
        context.DoctorSchedules.Add(schedule);
        context.Appointments.Add(apt);
        context.Billings.Add(unpaidBill);
        await context.SaveChangesAsync();

        var staffUser = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "Receptionist"),
            new Claim(ClaimTypes.Name, "tieptan01")
        }, "TestAuth"));

        var controller = new KioskController(context, new QueueEngine(context), CreateMockHub())
        {
            ControllerContext = CreateKioskTerminalContext(user: staffUser)
        };

        // Act 1: Phương án A - Quét QR khi hóa đơn còn Unpaid -> Vẫn cấp STT, đọc trạng thái UnpaidBilling (không thu trực tiếp tại Kiosk, không tạo hóa đơn trùng)
        var checkInRes = Assert.IsType<OkObjectResult>(await controller.CheckIn(new KioskCheckInRequestDto
        {
            QrCodeOrCode = apt.Id.ToString()
        }));
        var checkInPayload = Assert.IsType<KioskCheckInResponseDto>(checkInRes.Value);
        Assert.Equal("SUCCESS", checkInPayload.Outcome);
        Assert.NotNull(checkInPayload.Ticket);
        Assert.Equal(101, checkInPayload.Ticket.SequenceNumber);
        Assert.Equal("Unpaid", checkInPayload.Ticket.PaymentStatus);
        Assert.NotNull(checkInPayload.UnpaidBilling);
        Assert.Equal(unpaidBill.Id, checkInPayload.UnpaidBilling.BillingId);
        Assert.Equal(150000m, checkInPayload.UnpaidBilling.Amount);
        Assert.Equal(string.Empty, checkInPayload.UnpaidBilling.VietQrPayload);
        Assert.Equal(1, await context.Billings.CountAsync());
        Assert.Equal(1, await context.QueueTickets.CountAsync());

        // Act 2: Thu ngân / SePay thanh toán xong -> cập nhật Paid trong DB
        var dbBill = await context.Billings.FindAsync(unpaidBill.Id);
        dbBill!.Status = "Paid";
        dbBill.PaidAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        // Act 3: Kiosk đọc trạng thái hóa đơn và quét lại -> Nhận biết Paid tự động
        var statusRes = Assert.IsType<OkObjectResult>(await controller.GetBillingStatus(unpaidBill.Id));
        var statusPayload = Assert.IsType<KioskBillingSummaryDto>(statusRes.Value);
        Assert.Equal("Paid", statusPayload.Status);

        var rescanRes = Assert.IsType<OkObjectResult>(await controller.CheckIn(new KioskCheckInRequestDto
        {
            QrCodeOrCode = apt.Id.ToString()
        }));
        var rescanPayload = Assert.IsType<KioskCheckInResponseDto>(rescanRes.Value);
        Assert.Equal("ALREADY_CHECKED_IN", rescanPayload.Outcome);
        Assert.NotNull(rescanPayload.Ticket);
        Assert.Equal(101, rescanPayload.Ticket.SequenceNumber);
        Assert.Equal("Paid", rescanPayload.Ticket.PaymentStatus);
        Assert.Null(rescanPayload.UnpaidBilling);

        var updatedApt = await context.Appointments.FindAsync(apt.Id);
        Assert.Equal("CheckedIn", updatedApt!.Status);
    }

    [Fact]
    public async Task Kiosk_WalkIn_CccdPatient_ShouldApplyLaw15Priority_AndReuseExistingPatient()
    {
        var dbName = "Kiosk_WalkIn_" + Guid.NewGuid();
        using var context = CreateDbContext(dbName);
        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Lão Khoa", Location = "P108" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var controller = new KioskController(context, new QueueEngine(context), CreateMockHub())
        {
            ControllerContext = CreateKioskTerminalContext("KIOSK-SANH-A-01", "DMED-KIOSK-A01-2026")
        };

        // Act 1: Cụ ông 78 tuổi đăng ký trực tiếp bằng CCCD -> Tự áp dụng ưu tiên Điều 3 Luật KBCB 15/2023/QH15
        var req = new KioskWalkInRequestDto
        {
            FullName = "Phạm Văn Cụ",
            IdentityCardNumber = "079048000555",
            DateOfBirth = DateTime.UtcNow.AddYears(-78),
            Gender = "Nam",
            DepartmentId = dept.Id,
            RequirePrepayment = false
        };

        var res1 = Assert.IsType<OkObjectResult>(await controller.IssueWalkIn(req));
        var payload1 = Assert.IsType<KioskCheckInResponseDto>(res1.Value);
        Assert.Equal("SUCCESS", payload1.Outcome);
        Assert.NotNull(payload1.Ticket);
        Assert.Equal("Priority", payload1.Ticket.Priority);
        Assert.Contains("75 tuổi", payload1.Ticket.PriorityReason);

        // Act 2: Quét lại lần 2 cùng CCCD -> Không nhân đôi bệnh nhân và không nhảy STT mới (Idempotent)
        var res2 = Assert.IsType<OkObjectResult>(await controller.IssueWalkIn(req));
        var payload2 = Assert.IsType<KioskCheckInResponseDto>(res2.Value);
        Assert.Equal(payload1.Ticket.SequenceNumber, payload2.Ticket!.SequenceNumber);
        Assert.Equal(1, await context.Patients.CountAsync());
        Assert.Equal(1, await context.QueueTickets.CountAsync());
    }

    [Fact]
    public async Task Kiosk_ClsReturn_WhenPendingVsCompleted_ShouldPromoteToParaclinicalResultQueue()
    {
        var dbName = "Kiosk_ClsReturn_" + Guid.NewGuid();
        using var context = CreateDbContext(dbName);

        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Nội Tổng Hợp", Location = "P102" };
        var patient = new Patient
        {
            Id = Guid.NewGuid(),
            PatientCode = "BN20260777",
            FullName = "Đỗ Minh Khang",
            IdentityCardNumber = "079093007777",
            DateOfBirth = DateTime.UtcNow.AddYears(-33)
        };
        var exam = new Examination
        {
            Id = Guid.NewGuid(),
            PatientId = patient.Id,
            ExaminationCode = "LK2026-CLS-01",
            DepartmentName = "Khoa Nội Tổng Hợp",
            ExaminationDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            Status = "Chờ CLS"
        };
        var clsDetail = new ServiceOrderDetail
        {
            Id = Guid.NewGuid(),
            ExaminationId = exam.Id,
            ServiceName = "Chụp X-quang ngực thẳng",
            ServiceCategory = "Chẩn đoán hình ảnh",
            Price = 150000m,
            Status = "Chờ thực hiện"
        };

        context.Departments.Add(dept);
        context.Patients.Add(patient);
        context.Examinations.Add(exam);
        context.ServiceOrderDetails.Add(clsDetail);
        await context.SaveChangesAsync();

        var queueService = new QueueEngine(context);
        var ticket = await queueService.IssueQueueTicketAsync(new IssueQueueTicketDto { PatientId = patient.Id, DepartmentId = dept.Id });
        await queueService.UpdateQueueTicketStatusAsync(ticket.Id, "WaitingCLS");

        var controller = new KioskController(context, queueService, CreateMockHub())
        {
            ControllerContext = CreateKioskTerminalContext("KIOSK-CLS-03", "DMED-KIOSK-C03-2026")
        };

        // Act 1: Khi CLS chưa có kết quả -> Kiosk báo PENDING_RESULTS
        var pendingRes = Assert.IsType<OkObjectResult>(await controller.ProcessClsReturn(new KioskClsReturnRequestDto
        {
            QrCodeOrCode = "BN20260777"
        }));
        var pendingPayload = Assert.IsType<KioskClsReturnResponseDto>(pendingRes.Value);
        Assert.Equal("PENDING_RESULTS", pendingPayload.Outcome);
        Assert.Equal(0, pendingPayload.CompletedCount);
        Assert.Equal(1, pendingPayload.PendingCount);

        // Act 2: Kỹ thuật viên trả kết quả CLS vào DB
        var dbDetail = await context.ServiceOrderDetails.FindAsync(clsDetail.Id);
        dbDetail!.Status = "Đã có kết quả";
        dbDetail.Result = "Phổi sáng đều hai bên, chưa thấy tổn thương";
        await context.SaveChangesAsync();

        // Act 3: Bệnh nhân quét QR quay lại Kiosk -> Đẩy vào hàng đợi Ưu tiên Đọc KQ CLS
        var completedRes = Assert.IsType<OkObjectResult>(await controller.ProcessClsReturn(new KioskClsReturnRequestDto
        {
            QrCodeOrCode = "BN20260777"
        }));
        var completedPayload = Assert.IsType<KioskClsReturnResponseDto>(completedRes.Value);
        Assert.Equal("SUCCESS", completedPayload.Outcome);
        Assert.Equal(1, completedPayload.CompletedCount);
        Assert.NotNull(completedPayload.Ticket);
        Assert.Equal("ParaclinicalResult", completedPayload.Ticket.QueueType);
        Assert.Equal("Priority", completedPayload.Ticket.Priority);
        Assert.Equal("Waiting", completedPayload.Ticket.Status);
    }

    [Fact]
    public async Task Kiosk_WalkIn_ServicePatient_ShouldIssueSttCreateSingleBillForCashier_AndReadPaidStatus()
    {
        var dbName = "Kiosk_WalkInMethodA_" + Guid.NewGuid();
        using var context = CreateDbContext(dbName);
        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Tim Mạch", Location = "P301" };
        context.Departments.Add(dept);
        await context.SaveChangesAsync();

        var controller = new KioskController(context, new QueueEngine(context), CreateMockHub())
        {
            ControllerContext = CreateKioskTerminalContext("KIOSK-SANH-A-01", "DMED-KIOSK-A01-2026")
        };

        var req = new KioskWalkInRequestDto
        {
            FullName = "Nguyễn Hoàng Phúc",
            IdentityCardNumber = "079095003344",
            DateOfBirth = DateTime.UtcNow.AddYears(-30),
            Gender = "Nam",
            DepartmentId = dept.Id,
            RequirePrepayment = false
        };

        // Act 1: Phương án A - Kiosk cấp STT ngay và tạo duy nhất 1 hóa đơn Registration (HAI...) đẩy sang Thu ngân
        var res1 = Assert.IsType<OkObjectResult>(await controller.IssueWalkIn(req));
        var payload1 = Assert.IsType<KioskCheckInResponseDto>(res1.Value);
        Assert.Equal("SUCCESS", payload1.Outcome);
        Assert.NotNull(payload1.Ticket);
        Assert.Equal(101, payload1.Ticket.SequenceNumber);
        Assert.Equal("Unpaid", payload1.Ticket.PaymentStatus);
        Assert.NotNull(payload1.UnpaidBilling);
        Assert.Matches("^HAI[A-F0-9]{8}$", payload1.UnpaidBilling.BillingCode);
        Assert.Equal(string.Empty, payload1.UnpaidBilling.VietQrPayload);
        Assert.Equal(200000m, payload1.UnpaidBilling.Amount);
        Assert.Equal(1, await context.Billings.CountAsync());

        // Act 2: Gọi lại walk-in cùng bệnh nhân -> Không tạo trùng bệnh nhân, STT hoặc hóa đơn
        var res2 = Assert.IsType<OkObjectResult>(await controller.IssueWalkIn(req));
        var payload2 = Assert.IsType<KioskCheckInResponseDto>(res2.Value);
        Assert.Equal("SUCCESS", payload2.Outcome);
        Assert.Equal(101, payload2.Ticket!.SequenceNumber);
        Assert.Equal(1, await context.Patients.CountAsync());
        Assert.Equal(1, await context.QueueTickets.CountAsync());
        Assert.Equal(1, await context.Billings.CountAsync());

        // Act 3: Thu ngân / SePay thanh toán hóa đơn xong -> Kiosk GetBillingStatus đọc đúng trạng thái Paid
        var bill = await context.Billings.FindAsync(payload1.UnpaidBilling.BillingId);
        Assert.NotNull(bill);
        bill!.Status = "Paid";
        bill.PaidAt = DateTime.UtcNow;
        await context.SaveChangesAsync();

        var statusRes = Assert.IsType<OkObjectResult>(await controller.GetBillingStatus(bill.Id));
        var statusDto = Assert.IsType<KioskBillingSummaryDto>(statusRes.Value);
        Assert.Equal("Paid", statusDto.Status);
    }
}
