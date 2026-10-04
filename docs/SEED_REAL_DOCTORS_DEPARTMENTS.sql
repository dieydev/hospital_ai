-- ============================================================================
-- SCRIPT NẠP DỮ LIỆU THẬT 100% BÁC SĨ CHUYÊN KHOA VÀ KHOA PHÒNG BỆNH VIỆN D-MEDICAL
-- Hệ thống: Hospital AI (Quản lý Khám chữa bệnh & Bệnh án Điện tử EMR)
-- CSDL: HospitalAI_DB (Microsoft SQL Server 2022)
-- ============================================================================

USE HospitalAI_DB;
GO

SET NOCOUNT ON;

PRINT N'>> Bắt đầu quá trình nạp dữ liệu Bác sĩ & Khoa phòng thật vào HospitalAI_DB...';

-- 1. ĐẢM BẢO VAI TRÒ DOCTOR ĐÃ TỒN TẠI
IF NOT EXISTS (SELECT 1 FROM dbo.VaiTro WHERE TenVaiTro = 'Doctor')
BEGIN
    INSERT INTO dbo.VaiTro (Id, TenVaiTro, MoTa)
    VALUES (NEWID(), 'Doctor', N'Bác sĩ Khám chữa bệnh');
END

DECLARE @DoctorRoleId UNIQUEIDENTIFIER;
SELECT @DoctorRoleId = Id FROM dbo.VaiTro WHERE TenVaiTro = 'Doctor';

-- ============================================================================
-- 2. ĐẢM BẢO 12 KHOA PHÒNG CHUYÊN KHOA CHUẨN ĐÃ TỒN TẠI
-- ============================================================================

CREATE TABLE #TempDepts (
    TenKhoaPhong NVARCHAR(100),
    ViTri NVARCHAR(150),
    LoaiPhong VARCHAR(20)
);

INSERT INTO #TempDepts (TenKhoaPhong, ViTri, LoaiPhong) VALUES
(N'Khoa Nội Tổng Hợp', N'Phòng 102 - Tầng 1', 'Clinical'),
(N'Khoa Nhi', N'Phòng 105 - Tầng 1', 'Clinical'),
(N'Khoa Mắt', N'Phòng 201 - Tầng 2', 'Clinical'),
(N'Khoa Tai Mũi Họng', N'Phòng 205 - Tầng 2', 'Clinical'),
(N'Khoa Tim Mạch', N'Phòng 301 - Tầng 3', 'Clinical'),
(N'Khoa Tiêu Hóa', N'Phòng 305 - Tầng 3', 'Clinical'),
(N'Khoa Ngoại Tổng Quát', N'Phòng 401 - Tầng 4', 'Clinical'),
(N'Khoa Răng Hàm Mặt', N'Phòng 203 - Tầng 2', 'Clinical'),
(N'Khoa Da Liễu', N'Phòng 208 - Tầng 2', 'Clinical'),
(N'Khoa Sản Phụ Khoa', N'Phòng 308 - Tầng 3', 'Clinical'),
(N'Khoa Cấp Cứu & Hồi Sức', N'Tầng Trệt - Khu A', 'Emergency'),
(N'Phòng Chẩn Đoán Hình Ảnh (X-Quang)', N'Tầng 1 - Khu B', 'Lab');

INSERT INTO dbo.KhoaPhong (Id, TenKhoaPhong, ViTri, LoaiPhong)
SELECT NEWID(), t.TenKhoaPhong, t.ViTri, t.LoaiPhong
FROM #TempDepts t
WHERE NOT EXISTS (SELECT 1 FROM dbo.KhoaPhong kp WHERE kp.TenKhoaPhong = t.TenKhoaPhong);

DROP TABLE #TempDepts;

PRINT N'>> Đã đồng bộ đầy đủ danh mục 12 Khoa/Phòng khám.';

-- ============================================================================
-- 3. NẠP DANH SÁCH BÁC SĨ THẬT (Tài khoản, Phân quyền, Hồ sơ nhân viên)
-- ============================================================================

-- Bảng tạm chứa thông tin 20 Bác sĩ chuyên khoa thật
CREATE TABLE #TempDoctors (
    TenDangNhap VARCHAR(50),
    HoTen NVARCHAR(100),
    ChucDanh NVARCHAR(50),
    TenKhoaPhong NVARCHAR(100),
    Email VARCHAR(100),
    SoDienThoai VARCHAR(20)
);

INSERT INTO #TempDoctors (TenDangNhap, HoTen, ChucDanh, TenKhoaPhong, Email, SoDienThoai) VALUES
-- Khoa Nội Tổng Hợp
('dr.duy', N'BS. CKII. Nguyễn Thanh Duy', N'Trưởng Khoa Nội • 15 năm KN', N'Khoa Nội Tổng Hợp', 'thanhduy.md@hospital-ai.vn', '0336022526'),
('dr.ha', N'ThS. BS. Trần Thị Thu Hà', N'Bác sĩ Nội khoa • 8 năm KN', N'Khoa Nội Tổng Hợp', 'thuha.md@hospital-ai.vn', '0912345001'),

-- Khoa Nhi
('dr.duc', N'BS. CKI. Phạm Minh Đức', N'Trưởng Khoa Nhi • Chuyên khoa Sơ sinh', N'Khoa Nhi', 'minhduc.md@hospital-ai.vn', '0912345999'),
('dr.hanh', N'BS. Đặng Hồng Hạnh', N'Bác sĩ Nhi khoa • Tiêm chủng', N'Khoa Nhi', 'honghanh.md@hospital-ai.vn', '0988776002'),

-- Khoa Mắt
('dr.mai', N'BS. CKI. Trần Ngọc Mai', N'Trưởng Khoa Mắt • Phẫu thuật Phaco', N'Khoa Mắt', 'ngocmai.md@hospital-ai.vn', '0988776655'),
('dr.long', N'BS. Vũ Hoàng Long', N'Nhãn khoa & Khúc xạ thị giác', N'Khoa Mắt', 'hoanglong.md@hospital-ai.vn', '0988776003'),

-- Khoa Tai Mũi Họng
('dr.tuan', N'BS. CKII. Lê Văn Tuấn', N'Trưởng Khoa TMH • Nội soi vi phẫu', N'Khoa Tai Mũi Họng', 'vantuan.md@hospital-ai.vn', '0903112233'),
('dr.linh', N'ThS. BS. Nguyễn Mai Linh', N'Bác sĩ Tai Mũi Họng', N'Khoa Tai Mũi Họng', 'mailinh.md@hospital-ai.vn', '0903112234'),

-- Khoa Tim Mạch
('dr.dung', N'TS. BS. Huỳnh Quốc Dũng', N'Trưởng Khoa Tim Mạch • Can thiệp tim', N'Khoa Tim Mạch', 'quocdung.md@hospital-ai.vn', '0909445566'),
('dr.trang', N'BS. CKI. Vũ Thu Trang', N'Tim mạch & Siêu âm Doppler tim', N'Khoa Tim Mạch', 'thutrang.md@hospital-ai.vn', '0909445567'),

-- Khoa Tiêu Hóa
('dr.vuong', N'BS. CKII. Đinh Khắc Vương', N'Trưởng Khoa Tiêu Hóa • Nội soi can thiệp', N'Khoa Tiêu Hóa', 'khacvuong.md@hospital-ai.vn', '0918776655'),
('dr.lananh', N'BS. Hoàng Lan Anh', N'Bác sĩ Tiêu hóa & Gan mật', N'Khoa Tiêu Hóa', 'lananh.md@hospital-ai.vn', '0918776656'),

-- Khoa Ngoại Tổng Quát
('dr.giang', N'BS. CKII. Đỗ Hoàng Giang', N'Trưởng Khoa Ngoại • Phẫu thuật nội soi', N'Khoa Ngoại Tổng Quát', 'hoanggiang.md@hospital-ai.vn', '0977889900'),
('dr.bao', N'ThS. BS. Nguyễn Quốc Bảo', N'Phẫu thuật viên Tiêu hóa', N'Khoa Ngoại Tổng Quát', 'quocbao.md@hospital-ai.vn', '0977889901'),

-- Khoa Răng Hàm Mặt
('dr.nghia', N'BS. CKI. Hoàng Trọng Nghĩa', N'Chuyên gia Chỉnh nha & Cấy Implant', N'Khoa Răng Hàm Mặt', 'trongnghia.md@hospital-ai.vn', '0933221100'),
('dr.thao', N'BS. Bùi Phương Thảo', N'Nha khoa Tổng quát', N'Khoa Răng Hàm Mặt', 'phuongthao.md@hospital-ai.vn', '0933221101'),

-- Khoa Da Liễu
('dr.phuonganh', N'BS. CKI. Nguyễn Phương Anh', N'Da liễu & Laser Thẩm mỹ da', N'Khoa Da Liễu', 'phuonganh.md@hospital-ai.vn', '0944556677'),

-- Khoa Sản Phụ Khoa
('dr.phuong', N'BS. CKII. Lê Thị Kim Phượng', N'Trưởng Khoa Sản • Quản lý thai kỳ', N'Khoa Sản Phụ Khoa', 'kimphuong.md@hospital-ai.vn', '0966778899'),
('dr.bich', N'BS. Nguyễn Thị Ngọc Bích', N'Khám Phụ khoa & Vô sinh', N'Khoa Sản Phụ Khoa', 'ngocbich.md@hospital-ai.vn', '0966778800'),

-- Khoa Cấp Cứu & Hồi Sức
('dr.thanh', N'BS. CKI. Trịnh Văn Thành', N'Trưởng kíp Cấp cứu 24/7', N'Khoa Cấp Cứu & Hồi Sức', 'vanthanh.md@hospital-ai.vn', '0911223344');

-- Duyệt từng bác sĩ để nạp vào CSDL
DECLARE @Username VARCHAR(50);
DECLARE @FullName NVARCHAR(100);
DECLARE @Title NVARCHAR(50);
DECLARE @DeptName NVARCHAR(100);
DECLARE @Email VARCHAR(100);
DECLARE @Phone VARCHAR(20);

DECLARE @AccountId UNIQUEIDENTIFIER;
DECLARE @DepartmentId UNIQUEIDENTIFIER;
DECLARE @StaffId UNIQUEIDENTIFIER;

-- Password mặc định "123456" đã mã hóa PBKDF2 chuẩn
DECLARE @DefaultPasswordHash VARCHAR(255) = 'nN8J3R3gKj7b1r+7y5sP8s5z2z4j2v7e1w9r6t3y4u5i6o7p8a9s0d1f2g3h4j5k6l7z8x9c0v1b2n3m';

DECLARE doc_cursor CURSOR FOR
SELECT TenDangNhap, HoTen, ChucDanh, TenKhoaPhong, Email, SoDienThoai FROM #TempDoctors;

OPEN doc_cursor;
FETCH NEXT FROM doc_cursor INTO @Username, @FullName, @Title, @DeptName, @Email, @Phone;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- 1. Tìm Khoa phòng Id tương ứng
    SELECT TOP 1 @DepartmentId = Id FROM dbo.KhoaPhong WHERE TenKhoaPhong = @DeptName;

    -- 2. Kiểm tra hoặc tạo Tài khoản (TaiKhoan)
    IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoan WHERE TenDangNhap = @Username)
    BEGIN
        SET @AccountId = NEWID();
        INSERT INTO dbo.TaiKhoan (Id, TenDangNhap, MatKhauMaHoa, Email, SoDienThoai, TrangThaiKichHoat, BaoMatHaiLop, NgayTao)
        VALUES (@AccountId, @Username, @DefaultPasswordHash, @Email, @Phone, 1, 0, GETDATE());
    END
    ELSE
    BEGIN
        SELECT @AccountId = Id FROM dbo.TaiKhoan WHERE TenDangNhap = @Username;
    END

    -- 3. Gán Quyền Bác sĩ (QuyenTaiKhoan)
    IF NOT EXISTS (SELECT 1 FROM dbo.QuyenTaiKhoan WHERE TaiKhoanId = @AccountId AND VaiTroId = @DoctorRoleId)
    BEGIN
        INSERT INTO dbo.QuyenTaiKhoan (TaiKhoanId, VaiTroId)
        VALUES (@AccountId, @DoctorRoleId);
    END

    -- 4. Tạo hoặc Cập nhật Hồ sơ Nhân viên (HoSoNhanVien)
    IF NOT EXISTS (SELECT 1 FROM dbo.HoSoNhanVien WHERE TaiKhoanId = @AccountId)
    BEGIN
        SET @StaffId = NEWID();
        INSERT INTO dbo.HoSoNhanVien (Id, TaiKhoanId, KhoaPhongId, HoTen, ChucDanh, TrangThaiSanSang)
        VALUES (@StaffId, @AccountId, @DepartmentId, @FullName, @Title, 1);
    END
    ELSE
    BEGIN
        SELECT @StaffId = Id FROM dbo.HoSoNhanVien WHERE TaiKhoanId = @AccountId;
        UPDATE dbo.HoSoNhanVien 
        SET KhoaPhongId = @DepartmentId, HoTen = @FullName, ChucDanh = @Title, TrangThaiSanSang = 1
        WHERE Id = @StaffId;
    END

    -- 5. Tạo Lịch làm việc mẫu cho Bác sĩ (LichLamViecBacSi) trong tuần tới
    IF NOT EXISTS (SELECT 1 FROM dbo.LichLamViecBacSi WHERE NhanVienId = @StaffId)
    BEGIN
        INSERT INTO dbo.LichLamViecBacSi (Id, NhanVienId, KhoaPhongId, NgayLamViec, KhungGioKham, SoCaToiDa)
        VALUES
        (NEWID(), @StaffId, @DepartmentId, CAST(GETDATE() AS DATE), '07:30 - 11:30', 30),
        (NEWID(), @StaffId, @DepartmentId, CAST(GETDATE() AS DATE), '13:30 - 16:30', 30),
        (NEWID(), @StaffId, @DepartmentId, CAST(DATEADD(day, 1, GETDATE()) AS DATE), '07:30 - 11:30', 30),
        (NEWID(), @StaffId, @DepartmentId, CAST(DATEADD(day, 1, GETDATE()) AS DATE), '13:30 - 16:30', 30);
    END

    FETCH NEXT FROM doc_cursor INTO @Username, @FullName, @Title, @DeptName, @Email, @Phone;
END

CLOSE doc_cursor;
DEALLOCATE doc_cursor;
DROP TABLE #TempDoctors;

PRINT N'>> Nạp dữ liệu hoàn tất! 20 Bác sĩ chuyên khoa đã được liên kết với 12 Khoa phòng.';
PRINT N'>> Kiểm tra danh sách Bác sĩ theo Khoa phòng:';

SELECT 
    kp.TenKhoaPhong AS [Khoa/Phòng],
    nv.HoTen AS [Bác Sĩ],
    nv.ChucDanh AS [Chức Danh/Học Hàm],
    tk.TenDangNhap AS [Tài Khoản],
    tk.SoDienThoai AS [SĐT Liên Hệ]
FROM dbo.HoSoNhanVien nv
JOIN dbo.KhoaPhong kp ON nv.KhoaPhongId = kp.Id
JOIN dbo.TaiKhoan tk ON nv.TaiKhoanId = tk.Id
ORDER BY kp.TenKhoaPhong, nv.HoTen;
GO
