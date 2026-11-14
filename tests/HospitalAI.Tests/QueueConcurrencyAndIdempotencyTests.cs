using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using HospitalAI.Application.DTOs;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HospitalAI.Tests;

public class QueueConcurrencyAndIdempotencyTests
{
    private HospitalDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        return new HospitalDbContext(options);
    }

    [Fact]
    public async Task IssueTicket_SequentialCalls_ShouldIncrementSequenceNumbers()
    {
        // Arrange
        var dbName = "QueueDb_Sequential_" + Guid.NewGuid();
        using var context = CreateInMemoryDbContext(dbName);

        var dept = new Department
        {
            Id = Guid.NewGuid(),
            DepartmentName = "Khoa Nội Tổng Hợp",
            Location = "Phòng 102 - Tầng 1"
        };
        var patient1 = new Patient
        {
            Id = Guid.NewGuid(),
            FullName = "Bệnh nhân A",
            PatientCode = "BN001",
            IdentityCardNumber = "001001001"
        };
        var patient2 = new Patient
        {
            Id = Guid.NewGuid(),
            FullName = "Bệnh nhân B",
            PatientCode = "BN002",
            IdentityCardNumber = "001001002"
        };

        context.Departments.Add(dept);
        context.Patients.AddRange(patient1, patient2);
        await context.SaveChangesAsync();

        var service = new QueueService(context);

        // Act
        var ticket1 = await service.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient1.Id,
            DepartmentId = dept.Id,
            Priority = "Normal"
        });

        var ticket2 = await service.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient2.Id,
            DepartmentId = dept.Id,
            Priority = "Normal"
        });

        // Assert
        Assert.NotNull(ticket1);
        Assert.NotNull(ticket2);
        Assert.Equal(101, ticket1.SequenceNumber);
        Assert.Equal(102, ticket2.SequenceNumber);
        Assert.NotEqual(ticket1.SequenceNumber, ticket2.SequenceNumber);
    }

    [Fact]
    public async Task Concurrency_TwoKiosksIssuingSimultaneously_MustHaveUniqueSequenceNumbers()
    {
        // Arrange: Giả lập 2 Kiosk độc lập cùng phát lệnh cấp số cho 2 bệnh nhân tại cùng 1 khoa
        var dbName = "QueueDb_Concurrency_" + Guid.NewGuid();
        
        var deptId = Guid.NewGuid();
        var patientId1 = Guid.NewGuid();
        var patientId2 = Guid.NewGuid();

        // Seed master data
        using (var setupContext = CreateInMemoryDbContext(dbName))
        {
            setupContext.Departments.Add(new Department
            {
                Id = deptId,
                DepartmentName = "Khoa Cấp Cứu",
                Location = "Tầng Trệt - Khu A"
            });
            setupContext.Patients.Add(new Patient
            {
                Id = patientId1,
                FullName = "Kiosk Patient 1",
                PatientCode = "KP001",
                IdentityCardNumber = "089111222"
            });
            setupContext.Patients.Add(new Patient
            {
                Id = patientId2,
                FullName = "Kiosk Patient 2",
                PatientCode = "KP002",
                IdentityCardNumber = "089333444"
            });
            await setupContext.SaveChangesAsync();
        }

        // Tạo 2 service instances mô phỏng 2 request từ 2 Kiosk khác nhau qua Gateway
        using var contextKiosk1 = CreateInMemoryDbContext(dbName);
        using var contextKiosk2 = CreateInMemoryDbContext(dbName);
        var serviceKiosk1 = new QueueService(contextKiosk1);
        var serviceKiosk2 = new QueueService(contextKiosk2);

        // Act: Kích hoạt đồng thời 2 task
        var task1 = serviceKiosk1.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patientId1,
            DepartmentId = deptId,
            Priority = "Normal"
        });
        var task2 = serviceKiosk2.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patientId2,
            DepartmentId = deptId,
            Priority = "Normal"
        });

        var results = await Task.WhenAll(task1, task2);

        // Assert: Cả 2 số thứ tự cấp ra không được trùng lặp
        var seq1 = results[0].SequenceNumber;
        var seq2 = results[1].SequenceNumber;

        Assert.NotEqual(seq1, seq2);
        var sequenceNumbers = new HashSet<int> { seq1, seq2 };
        Assert.Equal(2, sequenceNumbers.Count);
        Assert.Contains(101, sequenceNumbers);
        Assert.Contains(102, sequenceNumbers);
    }

    [Fact]
    public async Task PriorityQueue_EmergencyPatient_ShouldBePrioritizedOverNormal()
    {
        // Arrange
        var dbName = "QueueDb_Priority_" + Guid.NewGuid();
        using var context = CreateInMemoryDbContext(dbName);

        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Nhi" };
        var pNormal = new Patient { Id = Guid.NewGuid(), FullName = "BN Bình thường", PatientCode = "BN_N" };
        var pEmergency = new Patient { Id = Guid.NewGuid(), FullName = "BN Khẩn cấp", PatientCode = "BN_E" };

        context.Departments.Add(dept);
        context.Patients.AddRange(pNormal, pEmergency);
        await context.SaveChangesAsync();

        var service = new QueueService(context);

        // Act: Bệnh nhân bình thường lấy số trước (STT 101)
        await service.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = pNormal.Id,
            DepartmentId = dept.Id,
            Priority = "Normal"
        });

        // Bệnh nhân cấp cứu lấy số sau (STT 102)
        await service.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = pEmergency.Id,
            DepartmentId = dept.Id,
            Priority = "Emergency"
        });

        // Gọi bác sĩ mời bệnh nhân kế tiếp
        var calledTicket = await service.CallNextPatientAsync(dept.Id);

        // Assert: Bệnh nhân cấp cứu được gọi đầu tiên dù STT cao hơn
        Assert.NotNull(calledTicket);
        Assert.Equal("Emergency", calledTicket.Priority);
        Assert.Equal(pEmergency.Id, calledTicket.PatientId);
    }

    [Fact]
    public async Task IssueTicket_DuplicateRequestForSamePatient_ShouldReturnExistingTicketWithoutDuplicatingSequenceNumber()
    {
        // Arrange
        var dbName = "QueueDb_Idempotency_" + Guid.NewGuid();
        using var context = CreateInMemoryDbContext(dbName);

        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Tai Mũi Họng" };
        var patient = new Patient { Id = Guid.NewGuid(), FullName = "Bệnh nhân Quét Lặp", PatientCode = "BN_REPEAT" };

        context.Departments.Add(dept);
        context.Patients.Add(patient);
        await context.SaveChangesAsync();

        var service = new QueueService(context);

        // Act: Quét QR hoặc ấn cấp số lần 1 tại Kiosk
        var ticket1 = await service.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient.Id,
            DepartmentId = dept.Id,
            Priority = "Normal"
        });

        // Quét QR hoặc ấn cấp số lần 2 trong cùng ngày (Double-click hoặc retry mạng)
        var ticket2 = await service.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient.Id,
            DepartmentId = dept.Id,
            Priority = "Normal"
        });

        // Assert: Trả về cùng một phiếu chờ, STT không bị nhảy lên 102
        Assert.NotNull(ticket1);
        Assert.NotNull(ticket2);
        Assert.Equal(ticket1.Id, ticket2.Id);
        Assert.Equal(ticket1.SequenceNumber, ticket2.SequenceNumber);
        Assert.Equal(101, ticket2.SequenceNumber);

        // Kiểm tra trong DB chỉ có duy nhất 1 bản ghi
        var totalTicketsInDb = await context.QueueTickets.CountAsync();
        Assert.Equal(1, totalTicketsInDb);
    }

    [Fact]
    public async Task IssueTicket_WithAppointmentId_ShouldBeIdempotent()
    {
        // Arrange
        var dbName = "QueueDb_AppointmentIdempotency_" + Guid.NewGuid();
        using var context = CreateInMemoryDbContext(dbName);

        var dept = new Department { Id = Guid.NewGuid(), DepartmentName = "Khoa Tim Mạch" };
        var patient = new Patient { Id = Guid.NewGuid(), FullName = "Bệnh nhân Tái Khám Hẹn", PatientCode = "BN_APPT" };
        var appointmentId = Guid.NewGuid();

        context.Departments.Add(dept);
        context.Patients.Add(patient);
        await context.SaveChangesAsync();

        var service = new QueueService(context);

        // Act: Cấp STT dựa trên lịch hẹn tái khám lần 1
        var ticket1 = await service.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient.Id,
            DepartmentId = dept.Id,
            AppointmentId = appointmentId,
            Priority = "Priority",
            VisitType = "FollowUp"
        });

        // Cấp STT dựa trên lịch hẹn tái khám lần 2 (Quét lại mã QR giấy hẹn tại Kiosk)
        var ticket2 = await service.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient.Id,
            DepartmentId = dept.Id,
            AppointmentId = appointmentId,
            Priority = "Priority",
            VisitType = "FollowUp"
        });

        // Assert
        Assert.NotNull(ticket1);
        Assert.NotNull(ticket2);
        Assert.Equal(ticket1.Id, ticket2.Id);
        Assert.Equal(ticket1.SequenceNumber, ticket2.SequenceNumber);
        Assert.Equal("FollowUp", ticket2.VisitType);
        Assert.Equal(1, await context.QueueTickets.CountAsync());
    }
}
