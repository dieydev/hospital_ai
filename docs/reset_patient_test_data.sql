-- ======================================================================
-- BỆNH VIỆN ĐA KHOA QUỐC TẾ D-MEDICAL
-- SCRIPT RESET DỮ LIỆU BỆNH NHÂN & TÀI KHOẢN PHỤC VỤ TEST TỪ ĐẦU
-- Cách dùng: Chạy trong SQL Server Management Studio (SSMS) hoặc qua docker exec
-- ======================================================================

USE HospitalAI_DB;
GO

BEGIN TRANSACTION;

-- 1. Xóa các bảng con liên quan đến Khám bệnh & Cận lâm sàng & Đơn thuốc
DELETE FROM dbo.ChiTietDonThuoc;
DELETE FROM dbo.DonThuoc;
DELETE FROM dbo.ChiTietChiDinhDV;
DELETE FROM dbo.KetQuaCanLamSang;
DELETE FROM dbo.ChiDinhCanLamSang;
DELETE FROM dbo.ChiSoSinhHieu;
DELETE FROM dbo.GhiChuSOAP;
DELETE FROM dbo.ChanDoanBenh;
DELETE FROM dbo.DinhKemBenhAn;
DELETE FROM dbo.NhatKyGoiYAI;

-- 2. Xóa Hóa đơn & Chi tiết hóa đơn
DELETE FROM dbo.ChiTietHoaDon;
DELETE FROM dbo.HoaDon;

-- 3. Xóa Phiếu hàng chờ và Lịch hẹn khám
DELETE FROM dbo.PhieuHangCho;
DELETE FROM dbo.LichHenKham;

-- 4. Xóa Lượt khám bệnh
DELETE FROM dbo.LuotKhamBenh;

-- 5. Xóa Dị ứng & Tiền sử bệnh lý của bệnh nhân
DELETE FROM dbo.DiUngBenhNhan;
DELETE FROM dbo.TienSuBenhLy;

-- 6. XÓA TOÀN BỘ BẢNG BỆNH NHÂN (Trở về 0 bản ghi)
DELETE FROM dbo.BenhNhan;

-- 7. Xóa phân quyền tài khoản Bệnh nhân trong QuyenTaiKhoan
DELETE q
FROM dbo.QuyenTaiKhoan q
JOIN dbo.TaiKhoan t ON q.TaiKhoanId = t.Id
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.HoSoNhanVien nv WHERE nv.TaiKhoanId = t.Id
)
AND t.TenDangNhap NOT IN ('admin', 'receptionist');

-- 8. XÓA TOÀN BỘ TÀI KHOẢN BỆNH NHÂN (Chỉ giữ lại Admin, Bác sĩ, Lễ tân)
DELETE t
FROM dbo.TaiKhoan t
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.HoSoNhanVien nv WHERE nv.TaiKhoanId = t.Id
)
AND t.TenDangNhap NOT IN ('admin', 'receptionist');

-- 9. Đặt lại mật khẩu mặc định "123456" cho tất cả tài khoản Cán bộ / Bác sĩ / Lễ tân / Admin
UPDATE dbo.TaiKhoan
SET MatKhauMaHoa = 'MFMiWu2259wdv3WUd9SKtYZnB4gZZtUU8dp1VEP8DcIKiSoxV+NLu5xqgJ9a7azp';

COMMIT TRANSACTION;
GO

-- Kiểm tra lại số lượng sau khi reset
SELECT COUNT(*) AS SoLuongBenhNhan FROM dbo.BenhNhan;
SELECT COUNT(*) AS SoLuongPhieuHangCho FROM dbo.PhieuHangCho;
SELECT COUNT(*) AS SoLuongLuotKham FROM dbo.LuotKhamBenh;
SELECT COUNT(*) AS SoLuongTaiKhoan FROM dbo.TaiKhoan;
GO
