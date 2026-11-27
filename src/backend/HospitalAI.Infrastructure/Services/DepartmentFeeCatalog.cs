using System;

namespace HospitalAI.Infrastructure.Services;

/// <summary>
/// Bảng giá khám chuyên khoa thống nhất phía máy chủ (đồng bộ danh mục bệnh viện)
/// và quy tắc xác định lượt khám nào được định giá trước khi qua Nhân viên Sàng lọc (Cách 1).
/// </summary>
public static class DepartmentFeeCatalog
{
    public const decimal DefaultExaminationFee = 150000m;

    public static decimal ResolveDepartmentFee(string? departmentName)
    {
        if (string.IsNullOrWhiteSpace(departmentName))
        {
            return DefaultExaminationFee;
        }

        var normalized = departmentName.Trim();

        if (normalized.Contains("Tim Mạch", StringComparison.OrdinalIgnoreCase))
            return 200000m;
        if (normalized.Contains("Tiêu Hóa", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("Gan Mật", StringComparison.OrdinalIgnoreCase))
            return 180000m;
        if (normalized.Contains("Ngoại", StringComparison.OrdinalIgnoreCase))
            return 180000m;
        if (normalized.Contains("Tai Mũi Họng", StringComparison.OrdinalIgnoreCase))
            return 170000m;
        if (normalized.Contains("Nhi", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("Răng Hàm Mặt", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("Da Liễu", StringComparison.OrdinalIgnoreCase))
            return 160000m;
        if (normalized.Contains("Mắt", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("Nhãn Khoa", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("Nội", StringComparison.OrdinalIgnoreCase))
            return 150000m;

        return DefaultExaminationFee;
    }

    /// <summary>
    /// Theo Cách 1: Chỉ Gói khám cố định và Tái khám đúng chuyên khoa đã xác định từ trước
    /// mới chốt hóa đơn thanh toán Online ngay khi đặt lịch.
    /// Khám lần đầu (New) phải chờ Nhân viên Sàng lọc (Triage) phân đúng khoa rồi mới chốt hóa đơn.
    /// </summary>
    public static bool IsPreBilledOnlineVisit(string? appointmentType, string? packageName, string? symptomsReason)
    {
        if (string.Equals(appointmentType, "FollowUp", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(appointmentType, "Package", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(packageName))
        {
            return true;
        }

        if (!string.IsNullOrWhiteSpace(symptomsReason) &&
            (symptomsReason.Contains("[Tái khám", StringComparison.OrdinalIgnoreCase) ||
             symptomsReason.Contains("[Gói ", StringComparison.OrdinalIgnoreCase)))
        {
            return true;
        }

        return false;
    }
}
