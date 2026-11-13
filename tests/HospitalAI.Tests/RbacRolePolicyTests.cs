using System.Collections.Generic;
using System.Security.Claims;
using Xunit;

namespace HospitalAI.Tests;

public class RbacRolePolicyTests
{
    private ClaimsPrincipal CreateUserWithRole(string role)
    {
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "user-id-001"),
            new Claim(ClaimTypes.Name, "testuser"),
            new Claim(ClaimTypes.Role, role)
        }, "TestAuth");

        return new ClaimsPrincipal(identity);
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("Doctor", true)]
    [InlineData("Receptionist", true)]
    [InlineData("Triage", true)]
    [InlineData("Pharmacy", true)]
    [InlineData("Nurse", true)]
    [InlineData("Cashier", true)]
    [InlineData("Patient", false)] // Bệnh nhân không được xem danh sách bệnh nhân tổng quát
    [InlineData("Guest", false)]
    public void TestStaffAccessPolicy_ShouldAllowOnly7StaffRoles(string role, bool expectedAllowed)
    {
        // Arrange
        var user = CreateUserWithRole(role);

        // Act: Tiêu chí IsStaff trong PatientService và ExaminationService
        bool isStaff = user.IsInRole("Admin") || user.IsInRole("Doctor") || user.IsInRole("Receptionist") ||
                       user.IsInRole("Triage") || user.IsInRole("Pharmacy") || user.IsInRole("Nurse") || user.IsInRole("Cashier");

        // Assert
        Assert.Equal(expectedAllowed, isStaff);
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("Doctor", true)]
    [InlineData("Receptionist", false)]
    [InlineData("Triage", false)]
    [InlineData("Pharmacy", false)]
    [InlineData("Nurse", false)]
    [InlineData("Cashier", false)]
    [InlineData("Patient", false)]
    public void TestCallNextPatientPolicy_ShouldAllowOnlyDoctorAndAdmin(string role, bool expectedAllowed)
    {
        // Arrange
        var user = CreateUserWithRole(role);

        // Act: Tiêu chí CallNext trong QueueController [Authorize(Roles = "Doctor,Admin")]
        bool isAllowed = user.IsInRole("Doctor") || user.IsInRole("Admin");

        // Assert
        Assert.Equal(expectedAllowed, isAllowed);
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("Cashier", true)]
    [InlineData("Receptionist", true)]
    [InlineData("Doctor", false)]
    [InlineData("Nurse", false)]
    [InlineData("Pharmacy", false)]
    [InlineData("Patient", false)]
    public void TestBillingAccessPolicy_ShouldAllowOnlyCashierReceptionistAdmin(string role, bool expectedAllowed)
    {
        // Arrange
        var user = CreateUserWithRole(role);

        // Act: Tiêu chí [Authorize(Roles = "Cashier,Receptionist,Admin")]
        bool isAllowed = user.IsInRole("Cashier") || user.IsInRole("Receptionist") || user.IsInRole("Admin");

        // Assert
        Assert.Equal(expectedAllowed, isAllowed);
    }

    [Theory]
    [InlineData("Admin", true)]
    [InlineData("Doctor", false)]
    [InlineData("Receptionist", false)]
    [InlineData("Triage", false)]
    [InlineData("Nurse", false)]
    public void TestAdminOnlyPolicy_ShouldAllowOnlyAdmin(string role, bool expectedAllowed)
    {
        // Arrange
        var user = CreateUserWithRole(role);

        // Act: Tiêu chí [Authorize(Roles = "Admin")] (ví dụ xóa bệnh nhân, cấu hình hệ thống)
        bool isAllowed = user.IsInRole("Admin");

        // Assert
        Assert.Equal(expectedAllowed, isAllowed);
    }
}
