-- ======================================================================
-- BỆNH VIỆN ĐA KHOA QUỐC TẾ D-MEDICAL
-- SCRIPT RESET VÀ KHÔI PHỤC HÀNG CHỜ MẪU SAU KHI LOAD TEST JMETER
-- Cách dùng: Mở trong SSMS hoặc DataGrip -> Bấm Execute (F5)
-- ======================================================================

USE HospitalAI_DB;
GO

-- 1. Xóa sạch toàn bộ phiếu test rác
DELETE FROM PhieuHangCho;
PRINT N'✅ Đã dọn dẹp sạch sẽ toàn bộ phiếu test rác!';

-- 2. Tự động nạp lại 5 ca khám bệnh mẫu đa dạng cho buổi Demo
DECLARE @DeptNoi UNIQUEIDENTIFIER = '2bcb7d9a-516f-4fee-9193-ae23d6b5f18b';
DECLARE @DeptNgoai UNIQUEIDENTIFIER = '4eba02e1-c180-4833-81c6-8ae21630ede9';
DECLARE @DeptNhi UNIQUEIDENTIFIER = 'fa656d64-6e18-42d5-a539-0db61903e637';
DECLARE @DeptCapCuu UNIQUEIDENTIFIER = 'c91bbc0e-b42d-4311-829f-de6d39625c94';

DECLARE @Pat1 UNIQUEIDENTIFIER = '492d1fb9-5ecd-4a04-bd56-4c3c28394b2b'; -- Nguyen Van An
DECLARE @Pat2 UNIQUEIDENTIFIER = 'dd81c98a-9d57-43e6-b9c5-ebeed33cb9e2'; -- Le Hoang Nam
DECLARE @Pat3 UNIQUEIDENTIFIER = '3a8dc8b0-f35b-472a-9113-8bf68017d995'; -- Tran Thi Binh
DECLARE @Pat4 UNIQUEIDENTIFIER = '2576d0da-a550-452e-905a-b4731dc7f3b1'; -- Pham Thu Cuc
DECLARE @Pat5 UNIQUEIDENTIFIER = '65ca0444-b454-43bb-9969-c85debac4381'; -- Nguyen Thanh Duy

INSERT INTO PhieuHangCho (Id, BenhNhanId, KhoaPhongId, SoThuTu, TrangThaiHangCho, MucDoUuTien, NgayTao)
VALUES
(NEWID(), @Pat1, @DeptNoi, 101, 'Calling', 'Normal', GETUTCDATE()),
(NEWID(), @Pat2, @DeptNhi, 102, 'Waiting', 'Normal', GETUTCDATE()),
(NEWID(), @Pat3, @DeptCapCuu, 103, 'Waiting', 'Emergency', GETUTCDATE()),
(NEWID(), @Pat4, @DeptNgoai, 104, 'Waiting', 'Normal', GETUTCDATE()),
(NEWID(), @Pat5, @DeptNoi, 105, 'Finished', 'Normal', DATEADD(MINUTE, -40, GETUTCDATE()));

PRINT N'🏥 Đã khôi phục 5 phiếu khám mẫu chuẩn đẹp mắt trên Web Admin!';
GO
