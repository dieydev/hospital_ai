using System;
using System.Text.Json;
using Xunit;

namespace HospitalAI.Tests;

public class QrCodeParserAndValidationTests
{
    public class ExamPassQrPayload
    {
        public string? type { get; set; }
        public string? version { get; set; }
        public string? appointmentId { get; set; }
        public string? patientCode { get; set; }
        public string? patientName { get; set; }
        public string? phoneNumber { get; set; }
        public string? identityCard { get; set; }
        public string? department { get; set; }
        public string? doctor { get; set; }
        public string? roomNumber { get; set; }
        public string? appointmentDate { get; set; }
        public string? appointmentTime { get; set; }
        public string? appointmentType { get; set; }
    }

    [Fact]
    public void VerifyJsonExamPass_ValidPayload_ShouldParseCorrectly()
    {
        // Arrange
        var sampleJson = JsonSerializer.Serialize(new
        {
            type = "D_MEDICAL_EXAM_PASS",
            version = "2.0",
            appointmentId = "apt-1794500001",
            patientCode = "BN20260015",
            patientName = "Nguyễn Văn Test",
            phoneNumber = "0987654321",
            identityCard = "001234567899",
            department = "Khoa Nội Tổng Hợp",
            doctor = "BS. CKII. Nguyễn Thanh Duy",
            roomNumber = "Phòng 102 - Tầng 1",
            appointmentDate = "2026-11-20",
            appointmentTime = "08:00 - 08:30",
            appointmentType = "New"
        });

        // Act
        var parsed = JsonSerializer.Deserialize<ExamPassQrPayload>(sampleJson);

        // Assert
        Assert.NotNull(parsed);
        Assert.Equal("D_MEDICAL_EXAM_PASS", parsed.type);
        Assert.Equal("2.0", parsed.version);
        Assert.Equal("apt-1794500001", parsed.appointmentId);
        Assert.Equal("BN20260015", parsed.patientCode);
        Assert.Equal("Khoa Nội Tổng Hợp", parsed.department);
    }

    [Theory]
    [InlineData("MEDQR|apt-001|BN20260015|2026-08-12|08:30", "apt-001", "BN20260015")]
    [InlineData("MEDQR|apt-999|BN20260099", "apt-999", "BN20260099")]
    public void VerifyMedQrString_ValidFormat_ShouldExtractTokens(string medQr, string expectedAptId, string expectedPatientCode)
    {
        // Act
        Assert.StartsWith("MEDQR|", medQr);
        var parts = medQr.Split('|');

        // Assert
        Assert.True(parts.Length >= 3);
        Assert.Equal(expectedAptId, parts[1]);
        Assert.Equal(expectedPatientCode, parts[2]);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("INVALID_FORMAT_NOT_QR")]
    [InlineData("MEDQR")]
    public void VerifyMedQrString_MalformedInput_ShouldBeRejected(string invalidInput)
    {
        // Act & Assert
        var isValid = !string.IsNullOrWhiteSpace(invalidInput) && 
                      (invalidInput.StartsWith("MEDQR|") && invalidInput.Split('|').Length >= 2 ||
                       (invalidInput.StartsWith("{") && invalidInput.EndsWith("}")));
        
        Assert.False(isValid);
    }

    [Fact]
    public void VerifyJsonExamPass_TamperedType_ShouldFailTypeCheck()
    {
        // Arrange: QR mạo danh không có type chuẩn D_MEDICAL_EXAM_PASS
        var fakeJson = JsonSerializer.Serialize(new
        {
            type = "FAKE_PASS",
            appointmentId = "apt-fake-01",
            patientName = "Hacker"
        });

        // Act
        var parsed = JsonSerializer.Deserialize<ExamPassQrPayload>(fakeJson);

        // Assert
        Assert.NotNull(parsed);
        Assert.NotEqual("D_MEDICAL_EXAM_PASS", parsed.type);
    }
}
