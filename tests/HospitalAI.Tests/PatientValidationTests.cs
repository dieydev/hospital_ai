using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using HospitalAI.Application.DTOs;
using Xunit;

namespace HospitalAI.Tests;

public class PatientValidationTests
{
    private IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var ctx = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, ctx, validationResults, true);
        return validationResults;
    }

    [Fact]
    public void ValidPatientDto_ShouldPassValidation()
    {
        // Arrange
        var dto = new CreatePatientDto
        {
            FullName = "Nguyễn Văn Hùng",
            Gender = "Nam",
            DateOfBirth = new DateTime(1995, 5, 20),
            IdentityCardNumber = "001202612345",
            HealthInsuranceNumber = "DN4010123456789",
            PhoneNumber = "0912345678",
            Email = "hung.nguyen@test.vn",
            Address = "Số 123 Đường Cầu Giấy, Hà Nội"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        Assert.Empty(results);
    }

    [Theory]
    [InlineData("")]
    [InlineData("123")] // Quá ngắn (< 9)
    [InlineData("0012026123456789")] // Quá dài (> 12)
    [InlineData("0012026ABC45")] // Chứa ký tự chữ
    public void InvalidIdentityCard_ShouldFailValidation(string invalidCccd)
    {
        // Arrange
        var dto = new CreatePatientDto
        {
            FullName = "Nguyễn Văn Hùng",
            Gender = "Nam",
            DateOfBirth = new DateTime(1995, 5, 20),
            IdentityCardNumber = invalidCccd,
            PhoneNumber = "0912345678",
            Address = "Hà Nội"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        Assert.NotEmpty(results);
        Assert.Contains(results, r => r.MemberNames.Contains("IdentityCardNumber"));
    }

    [Theory]
    [InlineData("12345")]
    [InlineData("091234")]
    [InlineData("abc0912345678")]
    public void InvalidPhoneNumber_ShouldFailValidation(string invalidPhone)
    {
        // Arrange
        var dto = new CreatePatientDto
        {
            FullName = "Nguyễn Văn Hùng",
            Gender = "Nam",
            DateOfBirth = new DateTime(1995, 5, 20),
            IdentityCardNumber = "001202612345",
            PhoneNumber = invalidPhone,
            Address = "Hà Nội"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        Assert.NotEmpty(results);
        Assert.Contains(results, r => r.MemberNames.Contains("PhoneNumber"));
    }

    [Fact]
    public void EmptyFullName_ShouldFailValidation()
    {
        // Arrange
        var dto = new CreatePatientDto
        {
            FullName = "",
            Gender = "Nam",
            DateOfBirth = new DateTime(1995, 5, 20),
            IdentityCardNumber = "001202612345",
            PhoneNumber = "0912345678",
            Address = "Hà Nội"
        };

        // Act
        var results = ValidateModel(dto);

        // Assert
        Assert.NotEmpty(results);
        Assert.Contains(results, r => r.MemberNames.Contains("FullName"));
    }
}
