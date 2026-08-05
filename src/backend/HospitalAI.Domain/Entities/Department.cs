using System;

namespace HospitalAI.Domain.Entities;

public class Department
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string DepartmentName { get; set; } = string.Empty; // TenKhoaPhong
    public string Location { get; set; } = string.Empty; // ViTri (Phòng 102 - Tầng 1)
    public string RoomType { get; set; } = "Clinical"; // Clinical, Lab, Reception
}
