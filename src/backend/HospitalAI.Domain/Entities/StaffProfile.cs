using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace HospitalAI.Domain.Entities;

public class StaffProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }

    public string FullName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool IsAvailable { get; set; } = true;

    // Chứng chỉ & Giấy phép hành nghề theo Thông tư 32/2023/TT-BYT & Luật Khám bệnh, chữa bệnh số 15/2023/QH15
    public string? PracticeLicenseNumber { get; set; } // Số CCHN / Giấy phép hành nghề (vd: 004568/BD-GPHN)
    public string? PracticeLicenseDate { get; set; } // Ngày cấp chứng chỉ (dd/MM/yyyy)
    public string? PracticeLicenseIssuer { get; set; } // Cơ quan cấp (Sở Y tế / Bộ Y Tế)
    public string? ScopeOfPractice { get; set; } // Phạm vi hoạt động chuyên môn theo TT 32/2023
    public string? NationalPractitionerId { get; set; } // Mã định danh người hành nghề toàn quốc
    public string? DegreeLevel { get; set; } // Học hàm học vị: BS.CKII, BS.CKI, ThS, TS, BS
    public string? PracticeStatus { get; set; } = "Active"; // Active, Suspended, Revoked
}
