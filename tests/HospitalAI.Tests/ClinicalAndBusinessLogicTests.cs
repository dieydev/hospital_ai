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

public class ClinicalAndBusinessLogicTests
{
    private HospitalDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<HospitalDbContext>()
            .UseInMemoryDatabase(databaseName: $"HospitalTestDb_{Guid.NewGuid()}")
            .Options;

        return new HospitalDbContext(options);
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

        var service = new ExaminationService(context);
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

        var service = new ExaminationService(context);

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

        var service = new ExaminationService(context);
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

        var queueService = new QueueService(context);

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
}
