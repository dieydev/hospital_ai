-- ============================================================================
-- KHỞI TẠO DATABASE
-- ============================================================================
IF DB_ID('HospitalAI_DB') IS NOT NULL
BEGIN
    ALTER DATABASE HospitalAI_DB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE HospitalAI_DB;
END
GO

CREATE DATABASE HospitalAI_DB;
GO
USE HospitalAI_DB;
GO

-- ============================================================================
-- PHẦN 1: KHỞI TẠO CẤU TRÚC CÁC BẢNG (SCHEMA)
-- ============================================================================

CREATE TABLE dbo.TaiKhoan (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TenDangNhap VARCHAR(50) NOT NULL,
    MatKhauMaHoa VARCHAR(255) NOT NULL,
    Email VARCHAR(100) NULL,
    SoDienThoai VARCHAR(20) NOT NULL,
    TrangThaiKichHoat BIT NOT NULL DEFAULT 1,
    BaoMatHaiLop BIT NOT NULL DEFAULT 0,
    NgayTao DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_TaiKhoan PRIMARY KEY (Id),
    CONSTRAINT UQ_TaiKhoan_TenDangNhap UNIQUE (TenDangNhap)
);

CREATE TABLE dbo.VaiTro (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TenVaiTro VARCHAR(50) NOT NULL, 
    MoTa NVARCHAR(255) NULL,
    CONSTRAINT PK_VaiTro PRIMARY KEY (Id),
    CONSTRAINT UQ_VaiTro_TenVaiTro UNIQUE (TenVaiTro)
);

CREATE TABLE dbo.QuyenTaiKhoan (
    TaiKhoanId UNIQUEIDENTIFIER NOT NULL,
    VaiTroId UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT PK_QuyenTaiKhoan PRIMARY KEY (TaiKhoanId, VaiTroId),
    CONSTRAINT FK_QuyenTaiKhoan_TaiKhoan FOREIGN KEY (TaiKhoanId) REFERENCES dbo.TaiKhoan(Id) ON DELETE CASCADE,
    CONSTRAINT FK_QuyenTaiKhoan_VaiTro FOREIGN KEY (VaiTroId) REFERENCES dbo.VaiTro(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.KhoaPhong (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TenKhoaPhong NVARCHAR(100) NOT NULL, 
    ViTri NVARCHAR(150) NOT NULL,        
    LoaiPhong VARCHAR(20) NOT NULL,      
    CONSTRAINT PK_KhoaPhong PRIMARY KEY (Id)
);

CREATE TABLE dbo.HoSoNhanVien (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TaiKhoanId UNIQUEIDENTIFIER NOT NULL,
    KhoaPhongId UNIQUEIDENTIFIER NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    ChucDanh NVARCHAR(50) NOT NULL,      
    TrangThaiSanSang BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_HoSoNhanVien PRIMARY KEY (Id),
    CONSTRAINT FK_HoSoNhanVien_TaiKhoan FOREIGN KEY (TaiKhoanId) REFERENCES dbo.TaiKhoan(Id),
    CONSTRAINT FK_HoSoNhanVien_KhoaPhong FOREIGN KEY (KhoaPhongId) REFERENCES dbo.KhoaPhong(Id)
);

CREATE TABLE dbo.BenhNhan (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TaiKhoanId UNIQUEIDENTIFIER NULL,    
    MaBenhNhan VARCHAR(20) NOT NULL,     
    HoTen NVARCHAR(100) NOT NULL,
    GioiTinh VARCHAR(10) NOT NULL,       
    NgaySinh DATE NOT NULL,
    SoCCCD VARCHAR(20) NOT NULL,         
    MaTheBHYT VARCHAR(20) NULL,
    DiaChi NVARCHAR(255) NOT NULL,
    
    TenNguoiThan NVARCHAR(100) NULL,
    QuanHeNguoiThan NVARCHAR(50) NULL,
    SoDienThoaiNguoiThan VARCHAR(20) NULL,
    
    NgayTao DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_BenhNhan PRIMARY KEY (Id),
    CONSTRAINT UQ_BenhNhan_MaBenhNhan UNIQUE (MaBenhNhan),
    CONSTRAINT UQ_BenhNhan_SoCCCD UNIQUE (SoCCCD),
    CONSTRAINT FK_BenhNhan_TaiKhoan FOREIGN KEY (TaiKhoanId) REFERENCES dbo.TaiKhoan(Id)
);

CREATE TABLE dbo.DiUngBenhNhan (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    LoaiDiUng VARCHAR(20) NOT NULL,      
    TenChatDiUng NVARCHAR(100) NOT NULL, 
    MucDoDiUng VARCHAR(20) NOT NULL,     
    CONSTRAINT PK_DiUngBenhNhan PRIMARY KEY (Id),
    CONSTRAINT FK_DiUngBenhNhan_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.TienSuBenhLy (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    TenBenhNen NVARCHAR(150) NOT NULL,   
    NgayPhatBenh DATE NULL,
    GhiChu NVARCHAR(255) NULL,
    CONSTRAINT PK_TienSuBenhLy PRIMARY KEY (Id),
    CONSTRAINT FK_TienSuBenhLy_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.LichLamViecBacSi (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    NhanVienId UNIQUEIDENTIFIER NOT NULL, 
    KhoaPhongId UNIQUEIDENTIFIER NOT NULL, 
    NgayLamViec DATE NOT NULL,
    KhungGioKham VARCHAR(50) NOT NULL,    
    SoCaToiDa INT NOT NULL DEFAULT 20,
    CONSTRAINT PK_LichLamViecBacSi PRIMARY KEY (Id),
    CONSTRAINT FK_LichLamViecBacSi_NhanVien FOREIGN KEY (NhanVienId) REFERENCES dbo.HoSoNhanVien(Id),
    CONSTRAINT FK_LichLamViecBacSi_KhoaPhong FOREIGN KEY (KhoaPhongId) REFERENCES dbo.KhoaPhong(Id)
);

CREATE TABLE dbo.LichHenKham (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    LichLamViecId UNIQUEIDENTIFIER NOT NULL,
    NgayDatHen DATETIME NOT NULL,
    GhiChuTrieuChung NVARCHAR(500) NULL,
    TrangThaiLichHen VARCHAR(20) NOT NULL DEFAULT 'Pending', 
    CONSTRAINT PK_LichHenKham PRIMARY KEY (Id),
    CONSTRAINT FK_LichHenKham_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id),
    CONSTRAINT FK_LichHenKham_LichLamViec FOREIGN KEY (LichLamViecId) REFERENCES dbo.LichLamViecBacSi(Id)
);

CREATE TABLE dbo.PhieuHangCho (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    KhoaPhongId UNIQUEIDENTIFIER NOT NULL,  
    LichHenId UNIQUEIDENTIFIER NULL,       
    SoThuTu INT NOT NULL,                  
    TrangThaiHangCho VARCHAR(20) NOT NULL DEFAULT 'Waiting', 
    MucDoUuTien VARCHAR(20) NOT NULL DEFAULT 'Normal', 
    NgayTao DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PhieuHangCho PRIMARY KEY (Id),
    CONSTRAINT FK_PhieuHangCho_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id),
    CONSTRAINT FK_PhieuHangCho_KhoaPhong FOREIGN KEY (KhoaPhongId) REFERENCES dbo.KhoaPhong(Id),
    CONSTRAINT FK_PhieuHangCho_LichHen FOREIGN KEY (LichHenId) REFERENCES dbo.LichHenKham(Id)
);

CREATE TABLE dbo.LuotKhamBenh (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    BacSiId UNIQUEIDENTIFIER NOT NULL,
    PhieuHangChoId UNIQUEIDENTIFIER NOT NULL,
    NgayKham DATETIME NOT NULL DEFAULT GETDATE(),
    TrangThaiLuotKham VARCHAR(20) NOT NULL DEFAULT 'Examining', 
    CONSTRAINT PK_LuotKhamBenh PRIMARY KEY (Id),
    CONSTRAINT FK_LuotKhamBenh_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id),
    CONSTRAINT FK_LuotKhamBenh_BacSi FOREIGN KEY (BacSiId) REFERENCES dbo.HoSoNhanVien(Id),
    CONSTRAINT FK_LuotKhamBenh_PhieuHangCho FOREIGN KEY (PhieuHangChoId) REFERENCES dbo.PhieuHangCho(Id)
);

CREATE TABLE dbo.ChiSoSinhHieu (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    Mach INT NULL,                 
    NhietDo DECIMAL(4,2) NULL,     
    HuyetApTamThu INT NULL,
    HuyetApTamTruong INT NULL,
    CanNang DECIMAL(5,2) NULL,     
    ChieuCao DECIMAL(5,2) NULL,     
    ThoiDiemDo DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ChiSoSinhHieu PRIMARY KEY (Id),
    CONSTRAINT FK_ChiSoSinhHieu_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.GhiChuSOAP (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    TrieuChungChuQuan NVARCHAR(MAX) NULL,  
    KhamKhachQuan NVARCHAR(MAX) NULL,      
    DanhGiaLamSang NVARCHAR(MAX) NULL,      
    KeHoachXuTri NVARCHAR(MAX) NULL,        
    CONSTRAINT PK_GhiChuSOAP PRIMARY KEY (Id),
    CONSTRAINT FK_GhiChuSOAP_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.ChanDoanBenh (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    MaICD10 VARCHAR(10) NOT NULL,        
    TenBenhICD10 NVARCHAR(255) NOT NULL, 
    LaBenhChinh BIT NOT NULL DEFAULT 1,  
    GhiChuChiTiet NVARCHAR(500) NULL,
    CONSTRAINT PK_ChanDoanBenh PRIMARY KEY (Id),
    CONSTRAINT FK_ChanDoanBenh_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.DonThuoc (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    BacSiId UNIQUEIDENTIFIER NOT NULL,
    ThoiGianKy DATETIME NOT NULL DEFAULT GETDATE(),
    ChuKySoBacSi VARCHAR(MAX) NULL,      
    LoiDanBacSi NVARCHAR(500) NULL,
    CONSTRAINT PK_DonThuoc PRIMARY KEY (Id),
    CONSTRAINT FK_DonThuoc_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE,
    CONSTRAINT FK_DonThuoc_BacSi FOREIGN KEY (BacSiId) REFERENCES dbo.HoSoNhanVien(Id)
);

CREATE TABLE dbo.ChiTietDonThuoc (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    DonThuocId UNIQUEIDENTIFIER NOT NULL,
    TenThuoc NVARCHAR(150) NOT NULL,
    SoLuong INT NOT NULL,
    LieuLuongDung NVARCHAR(100) NOT NULL,  
    HuongDanCachUong NVARCHAR(255) NOT NULL, 
    CONSTRAINT PK_ChiTietDonThuoc PRIMARY KEY (Id),
    CONSTRAINT FK_ChiTietDonThuoc_DonThuoc FOREIGN KEY (DonThuocId) REFERENCES dbo.DonThuoc(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.DinhKemBenhAn (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    DinhDangFile VARCHAR(10) NOT NULL,   
    DuongDanFile VARCHAR(500) NOT NULL,  
    MoTaFile NVARCHAR(255) NULL,         
    ThoiGianTaiLen DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DinhKemBenhAn PRIMARY KEY (Id),
    CONSTRAINT FK_DinhKemBenhAn_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.ChiDinhCanLamSang (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    BacSiChiDinhId UNIQUEIDENTIFIER NOT NULL,
    MaDichVu VARCHAR(20) NOT NULL,        
    TenDichVu NVARCHAR(150) NOT NULL,    
    TrangThaiChiDinh VARCHAR(20) NOT NULL DEFAULT 'Ordered', 
    ThoiGianChiDinh DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ChiDinhCanLamSang PRIMARY KEY (Id),
    CONSTRAINT FK_ChiDinhCanLamSang_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ChiDinhCanLamSang_BacSi FOREIGN KEY (BacSiChiDinhId) REFERENCES dbo.HoSoNhanVien(Id)
);

CREATE TABLE dbo.KetQuaCanLamSang (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    ChiDinhId UNIQUEIDENTIFIER NOT NULL,
    KyThuatVienId UNIQUEIDENTIFIER NOT NULL, 
    TenChiSo NVARCHAR(100) NULL,      
    GiaTriDo VARCHAR(50) NULL,            
    KhoangThamChieu VARCHAR(50) NULL,    
    CoBatThuong BIT NOT NULL DEFAULT 0,  
    KetLuanHinhAnh NVARCHAR(MAX) NULL,   
    ThoiGianKyDuyet DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_KetQuaCanLamSang PRIMARY KEY (Id),
    CONSTRAINT FK_KetQuaCanLamSang_ChiDinh FOREIGN KEY (ChiDinhId) REFERENCES dbo.ChiDinhCanLamSang(Id) ON DELETE CASCADE,
    CONSTRAINT FK_KetQuaCanLamSang_KyThuatVien FOREIGN KEY (KyThuatVienId) REFERENCES dbo.HoSoNhanVien(Id)
);

CREATE TABLE dbo.TaiLieuPhacDo (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TieuDe NVARCHAR(255) NOT NULL,       
    NoiDungTho NVARCHAR(MAX) NOT NULL,   
    ChuyenKhoa VARCHAR(50) NOT NULL,     
    NgayCapNhat DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_TaiLieuPhacDo PRIMARY KEY (Id)
);

CREATE TABLE dbo.NhatKyGoiYAI (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    LoaiTroLyAI VARCHAR(30) NOT NULL,    
    DuLieuDauVao NVARCHAR(MAX) NOT NULL,  
    KetQuaGoiYAI NVARCHAR(MAX) NOT NULL,  
    PhanHoiBacSi VARCHAR(20) NOT NULL DEFAULT 'Accepted', 
    ThoiGianTao DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_NhatKyGoiYAI PRIMARY KEY (Id),
    CONSTRAINT FK_NhatKyGoiYAI_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- PHẦN 2: CHÈN DỮ LIỆU MẪU (CHẠY TRONG 1 BATCH ĐỂ GIỮ LIÊN KẾT BIẾN)
-- ============================================================================
PRINT N'BẮT ĐẦU CHÈN DỮ LIỆU MẪU...';

-- Khai báo biến ID dùng chung
DECLARE @RoleIdAdmin UNIQUEIDENTIFIER = NEWID();
DECLARE @RoleIdDoctor UNIQUEIDENTIFIER = NEWID();
DECLARE @RoleIdNurse UNIQUEIDENTIFIER = NEWID();

-- 1. THÊM VAI TRÒ
INSERT INTO dbo.VaiTro (Id, TenVaiTro, MoTa) VALUES 
(@RoleIdAdmin, 'Admin', N'Quản trị viên Hệ thống'),
(@RoleIdDoctor, 'Doctor', N'Bác sĩ Khám chữa bệnh'),
(@RoleIdNurse, 'Nurse', N'Điều dưỡng, Lễ tân tiếp nhận');

-- 2. THÊM KHOA PHÒNG
DECLARE @DeptNoi1Id UNIQUEIDENTIFIER = NEWID();
DECLARE @DeptNoiTongHopId UNIQUEIDENTIFIER = NEWID();
DECLARE @DeptXNId UNIQUEIDENTIFIER = NEWID();
DECLARE @DeptXQId UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.KhoaPhong (Id, TenKhoaPhong, ViTri, LoaiPhong) VALUES 
(@DeptNoi1Id, N'Phòng Khám Nội 1', N'Tầng 1, Khu A', 'Clinical'),
(@DeptNoiTongHopId, N'Khoa Nội Tổng Hợp', N'Phòng 102 - Tầng 1', 'Clinical'),
(@DeptXNId, N'Phòng Xét Nghiệm Huyết Học', N'Tầng 2, Khu B', 'Lab'),
(@DeptXQId, N'Phòng Chụp X-Quang', N'Tầng 1, Khu B', 'Lab');

-- 3. THÊM TÀI KHOẢN VÀ NHÂN VIÊN
-- Bác sĩ Nguyễn Văn A
DECLARE @AccBsA_Id UNIQUEIDENTIFIER = NEWID();
DECLARE @StaffBsA_Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO dbo.TaiKhoan (Id, TenDangNhap, MatKhauMaHoa, Email, SoDienThoai) 
VALUES (@AccBsA_Id, 'bs.nguyenvana', 'hashed_password_123', 'bsca@hospital.vn', '0901234567');
INSERT INTO dbo.QuyenTaiKhoan (TaiKhoanId, VaiTroId) VALUES (@AccBsA_Id, @RoleIdDoctor);
INSERT INTO dbo.HoSoNhanVien (Id, TaiKhoanId, KhoaPhongId, HoTen, ChucDanh) 
VALUES (@StaffBsA_Id, @AccBsA_Id, @DeptNoi1Id, N'Nguyễn Văn A', N'BS.CKI Nội khoa');

-- Lễ tân Trần Thị B
DECLARE @AccLtB_Id UNIQUEIDENTIFIER = NEWID();
DECLARE @StaffLtB_Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO dbo.TaiKhoan (Id, TenDangNhap, MatKhauMaHoa, Email, SoDienThoai) 
VALUES (@AccLtB_Id, 'lt.tranthib', 'hashed_password_456', 'letan@hospital.vn', '0912345678');
INSERT INTO dbo.QuyenTaiKhoan (TaiKhoanId, VaiTroId) VALUES (@AccLtB_Id, @RoleIdNurse);
INSERT INTO dbo.HoSoNhanVien (Id, TaiKhoanId, KhoaPhongId, HoTen, ChucDanh) 
VALUES (@StaffLtB_Id, @AccLtB_Id, @DeptNoi1Id, N'Trần Thị B', N'Điều dưỡng');

-- Bác sĩ Nguyễn Thanh Duy
DECLARE @AccBsDuy_Id UNIQUEIDENTIFIER = NEWID();
DECLARE @StaffBsDuy_Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO dbo.TaiKhoan (Id, TenDangNhap, MatKhauMaHoa, Email, SoDienThoai) 
VALUES (@AccBsDuy_Id, 'dr.duy', '$2a$11$qRz4cQk2...', 'thanhduy.md@hospital.vn', '0336022526');
INSERT INTO dbo.QuyenTaiKhoan (TaiKhoanId, VaiTroId) VALUES (@AccBsDuy_Id, @RoleIdDoctor);
INSERT INTO dbo.HoSoNhanVien (Id, TaiKhoanId, KhoaPhongId, HoTen, ChucDanh) 
VALUES (@StaffBsDuy_Id, @AccBsDuy_Id, @DeptNoiTongHopId, N'BS. CKII. Nguyễn Thanh Duy', N'Trưởng Khoa Nội');

-- 4. THÊM 21 BỆNH NHÂN (Bao gồm BN20260001 Nguyễn Văn An và 20 BN khác)
DECLARE @PatientAnId UNIQUEIDENTIFIER = NEWID();
DECLARE @PatientThuId UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.BenhNhan (Id, MaBenhNhan, HoTen, GioiTinh, NgaySinh, SoCCCD, MaTheBHYT, DiaChi, TenNguoiThan, QuanHeNguoiThan, SoDienThoaiNguoiThan) VALUES 
(@PatientAnId, 'BN20260001', N'Nguyễn Văn An', 'Male', '1990-05-15', '038090001234', 'DN40101234567', N'TP. Thủ Dầu Một, Bình Dương', N'Nguyễn Thị Mai', N'Vợ', '0901112233'),
(@PatientThuId, 'BN20260002', N'Nguyễn Thị Thu', 'Female', '1985-10-20', '079185000002', 'DN4010123450002', N'12 Nguyễn Huệ, Quận 1, TP.HCM', NULL, NULL, NULL);

-- Thêm 19 BN còn lại (Id tự động sinh)
INSERT INTO dbo.BenhNhan (Id, MaBenhNhan, HoTen, GioiTinh, NgaySinh, SoCCCD, MaTheBHYT, DiaChi) VALUES 
(NEWID(), 'BN20260003', N'Lê Hoàng Minh', 'Male', '1992-03-15', '079092000003', 'DN4010123450003', N'34 Lê Lợi, Quận Hải Châu, Đà Nẵng'),
(NEWID(), 'BN20260004', N'Phạm Quang Dũng', 'Male', '1978-11-05', '079078000004', 'GD4010123450004', N'56 Trần Phú, Quận Ba Đình, Hà Nội'),
(NEWID(), 'BN20260005', N'Trần Mỹ Hạnh', 'Female', '2000-12-12', '079100000005', 'SV4010123450005', N'78 Nguyễn Văn Linh, Quận 7, TP.HCM'),
(NEWID(), 'BN20260006', N'Vũ Đình Tùng', 'Male', '1988-07-25', '079088000006', 'DN4010123450006', N'90 Hùng Vương, Ninh Kiều, Cần Thơ'),
(NEWID(), 'BN20260007', N'Hoàng Thanh Trúc', 'Female', '1995-09-09', '079195000007', 'DN4010123450007', N'123 3/2, Quận 10, TP.HCM'),
(NEWID(), 'BN20260008', N'Đỗ Hữu Phước', 'Male', '1965-02-28', '079065000008', 'HT4010123450008', N'45 Hai Bà Trưng, Quận Hoàn Kiếm, Hà Nội'),
(NEWID(), 'BN20260009', N'Bùi Thị Lan', 'Female', '1970-04-14', '079170000009', 'HT4010123450009', N'67 Phan Đăng Lưu, Phú Nhuận, TP.HCM'),
(NEWID(), 'BN20260010', N'Ngô Bá Kiến', 'Male', '1980-08-08', '079080000010', NULL, N'89 Võ Văn Ngân, TP. Thủ Đức, TP.HCM'),
(NEWID(), 'BN20260011', N'Lý Nhã Kỳ', 'Female', '1982-06-19', '079182000011', 'DN4010123450011', N'11 Đồng Khởi, Quận 1, TP.HCM'),
(NEWID(), 'BN20260012', N'Đặng Lê Nguyên', 'Male', '1999-01-31', '079099000012', 'SV4010123450012', N'22 Tôn Đức Thắng, Quận 1, TP.HCM'),
(NEWID(), 'BN20260013', N'Phan Thu Thảo', 'Female', '2010-05-24', '079110000013', 'TE4010123450013', N'33 Cách Mạng Tháng 8, Quận Tân Bình, TP.HCM'),
(NEWID(), 'BN20260014', N'Đinh Tấn Beo', 'Male', '1955-12-01', '079055000014', 'HT4010123450014', N'44 Lê Hồng Phong, Quận 5, TP.HCM'),
(NEWID(), 'BN20260015', N'Trương Mỹ Lan', 'Female', '1956-10-13', '079156000015', NULL, N'55 Nguyễn Thị Minh Khai, Quận 3, TP.HCM'),
(NEWID(), 'BN20260016', N'Võ Trung Trực', 'Male', '1991-03-03', '079091000016', 'DN4010123450016', N'66 Nguyễn Đình Chiểu, Quận 3, TP.HCM'),
(NEWID(), 'BN20260017', N'Hồ Bảo Ngọc', 'Female', '2005-08-15', '079105000017', 'SV4010123450017', N'77 Điện Biên Phủ, Bình Thạnh, TP.HCM'),
(NEWID(), 'BN20260018', N'Mai Trọng Nhân', 'Male', '1987-11-20', '079087000018', 'DN4010123450018', N'88 Phạm Văn Đồng, Gò Vấp, TP.HCM'),
(NEWID(), 'BN20260019', N'Dương Thúy Quỳnh', 'Female', '1998-02-14', '079198000019', 'DN4010123450019', N'99 Nguyễn Trãi, Quận 5, TP.HCM'),
(NEWID(), 'BN20260020', N'Tạ Quang Bửu', 'Male', '1945-07-22', '079045000020', 'HT4010123450020', N'111 Trần Não, Quận 2, TP.HCM'),
(NEWID(), 'BN20260021', N'Cao Thu Trang', 'Female', '1993-09-30', '079193000021', 'DN4010123450021', N'222 Cộng Hòa, Tân Bình, TP.HCM');

-- 5. MÔ PHỎNG LUỒNG KHÁM 1: BN NGUYỄN THỊ THU (Khám với Bác sĩ A - Kèm Cận Lâm Sàng)
INSERT INTO dbo.TienSuBenhLy (BenhNhanId, TenBenhNen, NgayPhatBenh, GhiChu)
VALUES (@PatientThuId, N'Tăng huyết áp vô căn', '2020-05-15', N'Đang dùng thuốc duy trì hàng ngày');
INSERT INTO dbo.DiUngBenhNhan (BenhNhanId, LoaiDiUng, TenChatDiUng, MucDoDiUng)
VALUES (@PatientThuId, 'Drug', N'Kháng sinh Penicillin', 'Severe');

DECLARE @PhieuHC1_Id UNIQUEIDENTIFIER = NEWID();
DECLARE @LuotKham1_Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.PhieuHangCho (Id, BenhNhanId, KhoaPhongId, SoThuTu, TrangThaiHangCho)
VALUES (@PhieuHC1_Id, @PatientThuId, @DeptNoi1Id, 100, 'Processing');

INSERT INTO dbo.LuotKhamBenh (Id, BenhNhanId, BacSiId, PhieuHangChoId, TrangThaiLuotKham)
VALUES (@LuotKham1_Id, @PatientThuId, @StaffBsA_Id, @PhieuHC1_Id, 'Done');

INSERT INTO dbo.ChiSoSinhHieu (LuotKhamId, Mach, NhietDo, HuyetApTamThu, HuyetApTamTruong, CanNang, ChieuCao)
VALUES (@LuotKham1_Id, 85, 37.2, 145, 90, 65.5, 160);

INSERT INTO dbo.GhiChuSOAP (LuotKhamId, TrieuChungChuQuan, KhamKhachQuan, DanhGiaLamSang, KeHoachXuTri)
VALUES (@LuotKham1_Id, N'Đau đầu nhẹ, ho khan', N'Tim phổi trong, họng hơi đỏ.', N'Theo dõi THA / Viêm họng', N'Xét nghiệm máu và XQ.');

INSERT INTO dbo.ChanDoanBenh (LuotKhamId, MaICD10, TenBenhICD10, LaBenhChinh) VALUES 
(@LuotKham1_Id, 'I10', N'Tăng huyết áp vô căn', 1),
(@LuotKham1_Id, 'J02.9', N'Viêm họng cấp', 0);

DECLARE @ChiDinhXN_Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO dbo.ChiDinhCanLamSang (Id, LuotKhamId, BacSiChiDinhId, MaDichVu, TenDichVu, TrangThaiChiDinh)
VALUES (@ChiDinhXN_Id, @LuotKham1_Id, @StaffBsA_Id, 'XN01', N'Xét nghiệm máu', 'Completed');

INSERT INTO dbo.KetQuaCanLamSang (ChiDinhId, KyThuatVienId, TenChiSo, GiaTriDo, KhoangThamChieu, CoBatThuong) VALUES 
(@ChiDinhXN_Id, @StaffLtB_Id, 'WBC (Bạch cầu)', '11.5', '4.0 - 10.0', 1);

DECLARE @DonThuoc1_Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO dbo.DonThuoc (Id, LuotKhamId, BacSiId, LoiDanBacSi)
VALUES (@DonThuoc1_Id, @LuotKham1_Id, @StaffBsA_Id, N'Hạn chế ăn mặn, tập thể dục nhẹ nhàng.');

INSERT INTO dbo.ChiTietDonThuoc (DonThuocId, TenThuoc, SoLuong, LieuLuongDung, HuongDanCachUong) VALUES 
(@DonThuoc1_Id, N'Amlodipine 5mg', 7, N'1 viên/ngày', N'Sáng sau ăn'),
(@DonThuoc1_Id, N'Paracetamol 500mg', 10, N'2 viên/ngày', N'Uống khi đau đầu');

-- 6. MÔ PHỎNG LUỒNG KHÁM 2: BN NGUYỄN VĂN AN (Khám với Bác sĩ Duy)
DECLARE @PhieuHC2_Id UNIQUEIDENTIFIER = NEWID();
DECLARE @LuotKham2_Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.PhieuHangCho (Id, BenhNhanId, KhoaPhongId, SoThuTu, TrangThaiHangCho)
VALUES (@PhieuHC2_Id, @PatientAnId, @DeptNoiTongHopId, 101, 'Finished');

INSERT INTO dbo.LuotKhamBenh (Id, BenhNhanId, BacSiId, PhieuHangChoId, TrangThaiLuotKham)
VALUES (@LuotKham2_Id, @PatientAnId, @StaffBsDuy_Id, @PhieuHC2_Id, 'Done');

INSERT INTO dbo.ChiSoSinhHieu (LuotKhamId, Mach, NhietDo, HuyetApTamThu, HuyetApTamTruong, CanNang, ChieuCao)
VALUES (@LuotKham2_Id, 78, 38.0, 125, 80, 68.5, 172.0);

INSERT INTO dbo.GhiChuSOAP (LuotKhamId, TrieuChungChuQuan, KhamKhachQuan, DanhGiaLamSang, KeHoachXuTri)
VALUES (@LuotKham2_Id, N'Đau họng 3 ngày, sốt 38.0°C, ho khan', N'Niêm mạc họng đỏ, tim phổi bình thường', N'Viêm họng cấp tính', N'Nghỉ ngơi, uống thuốc 7 ngày');

INSERT INTO dbo.ChanDoanBenh (LuotKhamId, MaICD10, TenBenhICD10, LaBenhChinh)
VALUES (@LuotKham2_Id, 'J02.9', N'Viêm họng cấp tính, không đặc hiệu', 1);

DECLARE @DonThuoc2_Id UNIQUEIDENTIFIER = NEWID();
INSERT INTO dbo.DonThuoc (Id, LuotKhamId, BacSiId, LoiDanBacSi)
VALUES (@DonThuoc2_Id, @LuotKham2_Id, @StaffBsDuy_Id, N'Uống thuốc đúng giờ sau khi ăn');

INSERT INTO dbo.ChiTietDonThuoc (DonThuocId, TenThuoc, SoLuong, LieuLuongDung, HuongDanCachUong) VALUES 
(@DonThuoc2_Id, N'Paracetamol 500mg', 20, N'Sáng 1v, Tối 1v', N'Uống khi sốt > 38.5°C'),
(@DonThuoc2_Id, N'Augmentin 1g', 14, N'Sáng 1v, Tối 1v', N'Uống sau ăn no 30 phút');

-- 7. THÊM TÀI LIỆU PHÁC ĐỒ Y TẾ CHO AI GEMINI
INSERT INTO dbo.TaiLieuPhacDo (TieuDe, NoiDungTho, ChuyenKhoa) VALUES 
(N'Hướng dẫn Chẩn đoán và Điều trị Viêm đường Hô hấp Trên', N'Bệnh nhân viêm họng cấp cần sử dụng kháng sinh Amoxicillin/Clavulanic acid khi có nhiễm khuẩn. Sử dụng Paracetamol hạ sốt.', 'Khoa Nội');

PRINT N'✅ ĐÃ KHỞI TẠO VÀ THÊM DỮ LIỆU THÀNH CÔNG!';
GO


-- ============================================================================
-- PHẦN 3: TẠO INDEX TỐI ƯU TRUY VẤN
-- ============================================================================
CREATE NONCLUSTERED INDEX IX_PhieuHangCho_KhoaPhong_NgayTao 
ON dbo.PhieuHangCho (KhoaPhongId, NgayTao, TrangThaiHangCho)
INCLUDE (SoThuTu, MucDoUuTien, BenhNhanId);

CREATE NONCLUSTERED INDEX IX_LichLamViecBacSi_NhanVien_Ngay 
ON dbo.LichLamViecBacSi (NhanVienId, NgayLamViec);

CREATE NONCLUSTERED INDEX IX_LuotKhamBenh_BenhNhan_NgayKham 
ON dbo.LuotKhamBenh (BenhNhanId, NgayKham DESC);

CREATE NONCLUSTERED INDEX IX_ChanDoanBenh_LuotKham 
ON dbo.ChanDoanBenh (LuotKhamId);
GO