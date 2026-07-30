CREATE DATABASE HospitalAI_DB;
GO
USE HospitalAI_DB;
GO

-- ============================================================================
-- PHÂN HỆ 1: TÀI KHOẢN, PHÂN QUYỀN VÀ TỔ CHỨC
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
    TenVaiTro VARCHAR(50) NOT NULL, -- 'Admin', 'Doctor', 'Nurse', 'Patient'...
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
    TenKhoaPhong NVARCHAR(100) NOT NULL, -- Ví dụ: Khoa Noi, Phong Kham Ngoai 1
    ViTri NVARCHAR(150) NOT NULL,       -- Số phòng, tầng
    LoaiPhong VARCHAR(20) NOT NULL,      -- 'Clinical' (Kham), 'Lab' (CLS), 'Reception' (Tiep don)
    CONSTRAINT PK_KhoaPhong PRIMARY KEY (Id)
);

CREATE TABLE dbo.HoSoNhanVien (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TaiKhoanId UNIQUEIDENTIFIER NOT NULL,
    KhoaPhongId UNIQUEIDENTIFIER NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    ChucDanh NVARCHAR(50) NOT NULL,      -- 'ThS.BS', 'BS.CKI', 'DieuDuong'...
    TrangThaiSanSang BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_HoSoNhanVien PRIMARY KEY (Id),
    CONSTRAINT FK_HoSoNhanVien_TaiKhoan FOREIGN KEY (TaiKhoanId) REFERENCES dbo.TaiKhoan(Id),
    CONSTRAINT FK_HoSoNhanVien_KhoaPhong FOREIGN KEY (KhoaPhongId) REFERENCES dbo.KhoaPhong(Id)
);
GO

-- ============================================================================
-- PHÂN HỆ 2: QUẢN LÝ BỆNH NHÂN & DANH MỤC Y TẾ
-- ============================================================================

CREATE TABLE dbo.BenhNhan (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TaiKhoanId UNIQUEIDENTIFIER NULL,    -- Để trống nếu đăng ký trực tiếp không dùng App
    MaBenhNhan VARCHAR(20) NOT NULL,     -- Mã BN duy nhất (Ví dụ: BN20260001)
    HoTen NVARCHAR(100) NOT NULL,
    GioiTinh VARCHAR(10) NOT NULL,       -- 'Male', 'Female', 'Other'
    NgaySinh DATE NOT NULL,
    SoCCCD VARCHAR(20) NOT NULL,         -- Phục vụ quét mã QR thẻ căn cước
    MaTheBHYT VARCHAR(20) NULL,
    SoDienThoai VARCHAR(20) NULL,
    Email VARCHAR(100) NULL,
    DiaChi NVARCHAR(255) NOT NULL,
    NgayTao DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_BenhNhan PRIMARY KEY (Id),
    CONSTRAINT UQ_BenhNhan_MaBenhNhan UNIQUE (MaBenhNhan),
    CONSTRAINT UQ_BenhNhan_SoCCCD UNIQUE (SoCCCD),
    CONSTRAINT FK_BenhNhan_TaiKhoan FOREIGN KEY (TaiKhoanId) REFERENCES dbo.TaiKhoan(Id)
);

CREATE TABLE dbo.LienHeKhanCap (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    TenNguoiThan NVARCHAR(100) NOT NULL,
    QuanHe NVARCHAR(50) NOT NULL,
    SoDienThoai VARCHAR(20) NOT NULL,
    CONSTRAINT PK_LienHeKhanCap PRIMARY KEY (Id),
    CONSTRAINT FK_LienHeKhanCap_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.DiUngBenhNhan (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    LoaiDiUng VARCHAR(20) NOT NULL,      -- 'Drug', 'Food', 'Chemical'
    TenChatDiUng NVARCHAR(100) NOT NULL, -- Ví dụ: Penicillin
    MucDoDiUng VARCHAR(20) NOT NULL,     -- 'Mild' (Nhe), 'Moderate' (Vua), 'Severe' (Nang)
    CONSTRAINT PK_DiUngBenhNhan PRIMARY KEY (Id),
    CONSTRAINT FK_DiUngBenhNhan_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.TienSuBenhLy (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    TenBenhNen NVARCHAR(150) NOT NULL,   -- Ví dụ: Tang huyet ap
    NgayPhatBenh DATE NULL,
    GhiChu NVARCHAR(255) NULL,
    CONSTRAINT PK_TienSuBenhLy PRIMARY KEY (Id),
    CONSTRAINT FK_TienSuBenhLy_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id) ON DELETE CASCADE
);

-- DANH MỤC THUỐC & DỊCH VỤ Y TẾ (Phục vụ kê đơn & tính tiền tự động)
CREATE TABLE dbo.DanhMucThuoc (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    MaThuoc VARCHAR(20) NOT NULL,
    TenThuoc NVARCHAR(150) NOT NULL,
    DonViTinh NVARCHAR(30) NOT NULL,      -- Viên, Vỉ, Hộp, Chai...
    DonGia DECIMAL(18,2) NOT NULL DEFAULT 0,
    HoatChat NVARCHAR(255) NULL,
    CachDungMacDinh NVARCHAR(255) NULL,
    CONSTRAINT PK_DanhMucThuoc PRIMARY KEY (Id),
    CONSTRAINT UQ_DanhMucThuoc_MaThuoc UNIQUE (MaThuoc)
);

CREATE TABLE dbo.DanhMucDichVuYTe (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    MaDichVu VARCHAR(20) NOT NULL,
    TenDichVu NVARCHAR(150) NOT NULL,
    LoaiDichVu VARCHAR(30) NOT NULL,      -- 'KhamLamSang', 'XetNghiem', 'ChananHinhAnh'
    DonGia DECIMAL(18,2) NOT NULL DEFAULT 0,
    MoTa NVARCHAR(255) NULL,
    CONSTRAINT PK_DanhMucDichVuYTe PRIMARY KEY (Id),
    CONSTRAINT UQ_DanhMucDichVuYTe_MaDichVu UNIQUE (MaDichVu)
);
GO

-- ============================================================================
-- PHÂN HỆ 3: ĐẶT LỊCH HẸN & HÀNG CHỜ KHÁM REALTIME
-- ============================================================================

CREATE TABLE dbo.LichLamViecBacSi (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    NhanVienId UNIQUEIDENTIFIER NOT NULL, -- Mã bác sĩ
    KhoaPhongId UNIQUEIDENTIFIER NOT NULL, -- Phòng khám được phân công
    NgayLamViec DATE NOT NULL,
    KhungGioKham VARCHAR(50) NOT NULL,    -- Ví dụ: '08:00 - 09:00'
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
    TrangThaiLichHen VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Confirmed', 'Completed', 'Cancelled'
    CONSTRAINT PK_LichHenKham PRIMARY KEY (Id),
    CONSTRAINT FK_LichHenKham_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id),
    CONSTRAINT FK_LichHenKham_LichLamViec FOREIGN KEY (LichLamViecId) REFERENCES dbo.LichLamViecBacSi(Id)
);

CREATE TABLE dbo.PhieuHangCho (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    KhoaPhongId UNIQUEIDENTIFIER NOT NULL,  -- Phòng khám nhận bệnh
    LichHenId UNIQUEIDENTIFIER NULL,       -- Liên kết lịch hẹn từ App nếu có
    SoThuTu INT NOT NULL,                  -- Số thứ tự (101, 102...)
    TrangThaiHangCho VARCHAR(20) NOT NULL DEFAULT 'Waiting', -- 'Waiting', 'Calling', 'Processing', 'Skipped', 'Finished'
    MucDoUuTien VARCHAR(20) NOT NULL DEFAULT 'Normal', -- 'Normal', 'Priority', 'Emergency'
    NgayTao DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PhieuHangCho PRIMARY KEY (Id),
    CONSTRAINT FK_PhieuHangCho_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id),
    CONSTRAINT FK_PhieuHangCho_KhoaPhong FOREIGN KEY (KhoaPhongId) REFERENCES dbo.KhoaPhong(Id),
    CONSTRAINT FK_PhieuHangCho_LichHen FOREIGN KEY (LichHenId) REFERENCES dbo.LichHenKham(Id)
);
GO

-- ============================================================================
-- PHÂN HỆ 4: QUY TRÌNH KHÁM BỆNH & HỒ SƠ BỆNH ÁN ĐIỆN TỬ (EMR)
-- ============================================================================

CREATE TABLE dbo.LuotKhamBenh (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    BacSiId UNIQUEIDENTIFIER NOT NULL,
    PhieuHangChoId UNIQUEIDENTIFIER NOT NULL,
    NgayKham DATETIME NOT NULL DEFAULT GETDATE(),
    TrangThaiLuotKham VARCHAR(20) NOT NULL DEFAULT 'Examining', -- 'Examining', 'WaitingForCLS', 'Done'
    CONSTRAINT PK_LuotKhamBenh PRIMARY KEY (Id),
    CONSTRAINT FK_LuotKhamBenh_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id),
    CONSTRAINT FK_LuotKhamBenh_BacSi FOREIGN KEY (BacSiId) REFERENCES dbo.HoSoNhanVien(Id),
    CONSTRAINT FK_LuotKhamBenh_PhieuHangCho FOREIGN KEY (PhieuHangChoId) REFERENCES dbo.PhieuHangCho(Id)
);

CREATE TABLE dbo.ChiSoSinhHieu (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    Mach INT NULL,                 -- Mạch (lần/phút)
    NhietDo DECIMAL(4,2) NULL,     -- Nhiệt độ (°C)
    HuyetApTamThu INT NULL,
    HuyetApTamTruong INT NULL,
    CanNang DECIMAL(5,2) NULL,     -- kg
    ChieuCao DECIMAL(5,2) NULL,     -- cm
    ThoiDiemDo DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ChiSoSinhHieu PRIMARY KEY (Id),
    CONSTRAINT FK_ChiSoSinhHieu_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.GhiChuSOAP (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    TrieuChungChuQuan NVARCHAR(MAX) NULL,  -- S (Subjective)
    KhamKhachQuan NVARCHAR(MAX) NULL,      -- O (Objective)
    DanhGiaLamSang NVARCHAR(MAX) NULL,      -- A (Assessment)
    KeHoachXuTri NVARCHAR(MAX) NULL,        -- P (Plan)
    CONSTRAINT PK_GhiChuSOAP PRIMARY KEY (Id),
    CONSTRAINT FK_GhiChuSOAP_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.ChanDoanBenh (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    MaICD10 VARCHAR(10) NOT NULL,        -- Ví dụ: J02
    TenBenhICD10 NVARCHAR(255) NOT NULL, -- Tên bệnh theo Bộ Y Tế
    LaBenhChinh BIT NOT NULL DEFAULT 1,  -- 1: Bệnh chính, 0: Bệnh kèm theo
    GhiChuChiTiet NVARCHAR(500) NULL,
    CONSTRAINT PK_ChanDoanBenh PRIMARY KEY (Id),
    CONSTRAINT FK_ChanDoanBenh_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.DonThuoc (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    BacSiId UNIQUEIDENTIFIER NOT NULL,
    ThoiGianKy DATETIME NOT NULL DEFAULT GETDATE(),
    ChuKySoBacSi VARCHAR(MAX) NULL,      -- Chuỗi băm chữ ký điện tử
    LoiDanBacSi NVARCHAR(500) NULL,
    CONSTRAINT PK_DonThuoc PRIMARY KEY (Id),
    CONSTRAINT FK_DonThuoc_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE,
    CONSTRAINT FK_DonThuoc_BacSi FOREIGN KEY (BacSiId) REFERENCES dbo.HoSoNhanVien(Id)
);

CREATE TABLE dbo.ChiTietDonThuoc (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    DonThuocId UNIQUEIDENTIFIER NOT NULL,
    ThuocId UNIQUEIDENTIFIER NULL,        -- Liên kết DanhMucThuoc
    TenThuoc NVARCHAR(150) NOT NULL,
    SoLuong INT NOT NULL,
    DonGia DECIMAL(18,2) NOT NULL DEFAULT 0,
    ThanhTien DECIMAL(18,2) NOT NULL DEFAULT 0,
    LieuLuongDung NVARCHAR(100) NOT NULL,  -- Ví dụ: Ngay 2 vien
    HuongDanCachUong NVARCHAR(255) NOT NULL, -- Ví dụ: Sang 1, Toi 1 sau an
    CONSTRAINT PK_ChiTietDonThuoc PRIMARY KEY (Id),
    CONSTRAINT FK_ChiTietDonThuoc_DonThuoc FOREIGN KEY (DonThuocId) REFERENCES dbo.DonThuoc(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ChiTietDonThuoc_DanhMucThuoc FOREIGN KEY (ThuocId) REFERENCES dbo.DanhMucThuoc(Id)
);

CREATE TABLE dbo.HoSoBenhAn (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    LoaiBenhAn VARCHAR(20) NOT NULL,     -- 'NgoaiTru', 'CapCuu'
    ThoiGianDongGoi DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_HoSoBenhAn PRIMARY KEY (Id),
    CONSTRAINT FK_HoSoBenhAn_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id),
    CONSTRAINT FK_HoSoBenhAn_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id)
);

CREATE TABLE dbo.DinhKemBenhAn (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhAnId UNIQUEIDENTIFIER NOT NULL,
    DinhDangFile VARCHAR(10) NOT NULL,   -- 'PDF', 'Image', 'DICOM'
    DuongDanFile VARCHAR(500) NOT NULL,  -- Đường dẫn lưu trên Cloud MinIO/S3
    MoTaFile NVARCHAR(255) NULL,         -- Ví dụ: Anh chup X-Quang phoi
    ThoiGianTaiLen DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DinhKemBenhAn PRIMARY KEY (Id),
    CONSTRAINT FK_DinhKemBenhAn_BenhAn FOREIGN KEY (BenhAnId) REFERENCES dbo.HoSoBenhAn(Id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- PHÂN HỆ 5: CHỈ ĐỊNH & KẾT QUẢ CẬN LÂM SÀNG
-- ============================================================================

CREATE TABLE dbo.ChiDinhCanLamSang (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    BacSiChiDinhId UNIQUEIDENTIFIER NOT NULL,
    DichVuId UNIQUEIDENTIFIER NULL,      -- Liên kết DanhMucDichVuYTe
    MaDichVu VARCHAR(20) NOT NULL,        -- Ví dụ: XN01, XQ02
    TenDichVu NVARCHAR(150) NOT NULL,    -- Ví dụ: Xet nghiem mau, Chup X-Quang
    DonGia DECIMAL(18,2) NOT NULL DEFAULT 0,
    TrangThaiChiDinh VARCHAR(20) NOT NULL DEFAULT 'Ordered', -- 'Ordered', 'Processing', 'Completed'
    ThoiGianChiDinh DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ChiDinhCanLamSang PRIMARY KEY (Id),
    CONSTRAINT FK_ChiDinhCanLamSang_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE,
    CONSTRAINT FK_ChiDinhCanLamSang_BacSi FOREIGN KEY (BacSiChiDinhId) REFERENCES dbo.HoSoNhanVien(Id),
    CONSTRAINT FK_ChiDinhCanLamSang_DanhMucDichVu FOREIGN KEY (DichVuId) REFERENCES dbo.DanhMucDichVuYTe(Id)
);

CREATE TABLE dbo.KetQuaCanLamSang (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    ChiDinhId UNIQUEIDENTIFIER NOT NULL,
    KyThuatVienId UNIQUEIDENTIFIER NOT NULL, -- Người thực hiện duyệt
    TenChiSo NVARCHAR(100) NULL,      -- Tên chỉ số (Dùng cho Xét nghiệm như Glucose, WBC...)
    GiaTriDo VARCHAR(50) NULL,           -- Trị số kết quả
    KhoangThamChieu VARCHAR(50) NULL,    -- Chỉ số bình thường để đối chiếu
    CoBatThuong BIT NOT NULL DEFAULT 0,  -- 1: Bất thường (báo đỏ), 0: Bình thường
    KetLuanHinhAnh NVARCHAR(MAX) NULL,   -- Văn bản mô tả đọc ảnh X-Quang/CT
    ThoiGianKyDuyet DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_KetQuaCanLamSang PRIMARY KEY (Id),
    CONSTRAINT FK_KetQuaCanLamSang_ChiDinh FOREIGN KEY (ChiDinhId) REFERENCES dbo.ChiDinhCanLamSang(Id) ON DELETE CASCADE,
    CONSTRAINT FK_KetQuaCanLamSang_KyThuatVien FOREIGN KEY (KyThuatVienId) REFERENCES dbo.HoSoNhanVien(Id)
);
GO

-- ============================================================================
-- PHÂN HỆ 6: HÓA ĐƠN, VIỆN PHÍ & VNPAY QR CODE
-- ============================================================================

CREATE TABLE dbo.HoaDonVienPhi (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    MaHoaDon VARCHAR(30) NOT NULL,        -- Ví dụ: HD20260730001
    TienKham DECIMAL(18,2) NOT NULL DEFAULT 0,
    TienThuoc DECIMAL(18,2) NOT NULL DEFAULT 0,
    TienDichVuCLS DECIMAL(18,2) NOT NULL DEFAULT 0,
    TongTien DECIMAL(18,2) NOT NULL DEFAULT 0,
    TrangThaiThanhToan VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Paid', 'Cancelled'
    NgayTao DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_HoaDonVienPhi PRIMARY KEY (Id),
    CONSTRAINT UQ_HoaDonVienPhi_MaHoaDon UNIQUE (MaHoaDon),
    CONSTRAINT FK_HoaDonVienPhi_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id),
    CONSTRAINT FK_HoaDonVienPhi_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id)
);

CREATE TABLE dbo.GiaoDichVNPay (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    HoaDonId UNIQUEIDENTIFIER NOT NULL,
    MaGiaoDichVNP VARCHAR(50) NULL,      -- vnp_TransactionNo từ VNPay
    MaThamChieuTxnRef VARCHAR(50) NOT NULL, -- vnp_TxnRef
    SoTien DECIMAL(18,2) NOT NULL,
    MaNganHang VARCHAR(20) NULL,          -- NCB, VNPAYQR, VISA...
    NoiDungThanhToan NVARCHAR(255) NULL,
    MaLoiVNP VARCHAR(10) NULL,            -- '00' là thành công
    TrangThaiGiaoDich VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Success', 'Failed'
    ThoiGianTao DATETIME NOT NULL DEFAULT GETDATE(),
    ThoiGianThanhToan DATETIME NULL,
    CONSTRAINT PK_GiaoDichVNPay PRIMARY KEY (Id),
    CONSTRAINT UQ_GiaoDichVNPay_TxnRef UNIQUE (MaThamChieuTxnRef),
    CONSTRAINT FK_GiaoDichVNPay_HoaDon FOREIGN KEY (HoaDonId) REFERENCES dbo.HoaDonVienPhi(Id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- PHÂN HỆ 7: TRỢ LÝ TRÍ TUỆ NHÂN TẠO (AI ASSISTANT & RAG KNOWLEDGE)
-- ============================================================================

CREATE TABLE dbo.TaiLieuPhacDo (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TieuDe NVARCHAR(255) NOT NULL,       -- Tên phác đồ Bộ Y Tế
    NoiDungTho NVARCHAR(MAX) NOT NULL,   -- Văn bản thô của tài liệu hướng dẫn
    ChuyenKhoa VARCHAR(50) NOT NULL,     -- Khoa áp dụng
    NgayCapNhat DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_TaiLieuPhacDo PRIMARY KEY (Id)
);

CREATE TABLE dbo.VectorPhacDo (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    TaiLieuId UNIQUEIDENTIFIER NOT NULL,
    DoanVanBanNho NVARCHAR(MAX) NOT NULL, -- Đoạn text ngắn sau khi chia nhỏ (Chunking)
    ChuoiDuLieuVector NVARCHAR(MAX) NOT NULL, -- Mảng số thực lưu dạng chuỗi JSON để tính toán Cosine
    CONSTRAINT PK_VectorPhacDo PRIMARY KEY (Id),
    CONSTRAINT FK_VectorPhacDo_TaiLieu FOREIGN KEY (TaiLieuId) REFERENCES dbo.TaiLieuPhacDo(Id) ON DELETE CASCADE
);

CREATE TABLE dbo.NhatKyGoiYAI (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    LuotKhamId UNIQUEIDENTIFIER NOT NULL,
    LoaiTroLyAI VARCHAR(30) NOT NULL,    -- 'SearchBNCache', 'ICD10Prompt', 'InteractionAlert', 'SummaryRecord'
    DuLieuDauVao NVARCHAR(MAX) NOT NULL,  -- Câu hỏi bác sĩ gõ hoặc đơn thuốc đẩy lên AI
    KetQuaGoiYAI NVARCHAR(MAX) NOT NULL,  -- Phản hồi cảnh báo/gợi ý của AI
    PhanHoiBacSi VARCHAR(20) NOT NULL DEFAULT 'Accepted', -- 'Accepted' (Đồng ý), 'Rejected' (Bỏ qua)
    ThoiGianTao DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_NhatKyGoiYAI PRIMARY KEY (Id),
    CONSTRAINT FK_NhatKyGoiYAI_LuotKham FOREIGN KEY (LuotKhamId) REFERENCES dbo.LuotKhamBenh(Id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- PHÂN HỆ 8: THÔNG BÁO CHO BỆNH NHÂN (FLUTTER APP)
-- ============================================================================

CREATE TABLE dbo.ThongBaoBenhNhan (
    Id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    BenhNhanId UNIQUEIDENTIFIER NOT NULL,
    TieuDe NVARCHAR(150) NOT NULL,
    NoiDung NVARCHAR(500) NOT NULL,
    LoaiThongBao VARCHAR(30) NOT NULL DEFAULT 'Appointment', -- 'Appointment', 'Result', 'Payment', 'System'
    DaDoc BIT NOT NULL DEFAULT 0,
    NgayTao DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ThongBaoBenhNhan PRIMARY KEY (Id),
    CONSTRAINT FK_ThongBaoBenhNhan_BenhNhan FOREIGN KEY (BenhNhanId) REFERENCES dbo.BenhNhan(Id) ON DELETE CASCADE
);
GO

-- ============================================================================
-- TỐI ƯU TRUY VẤN: INDEXING (CHỈ MỤC NON-CLUSTERED)
-- ============================================================================

-- 1. Tra cứu thông tin Bệnh nhân (Thường xuyên tìm kiếm khi Lễ tân tiếp nhận)
CREATE NONCLUSTERED INDEX IX_BenhNhan_MaBenhNhan ON dbo.BenhNhan (MaBenhNhan);
CREATE NONCLUSTERED INDEX IX_BenhNhan_SoCCCD ON dbo.BenhNhan (SoCCCD);

-- 2. Tải danh sách Hàng chờ Khám Realtime theo từng Phòng và Ngày
CREATE NONCLUSTERED INDEX IX_PhieuHangCho_KhoaPhong_NgayTao 
ON dbo.PhieuHangCho (KhoaPhongId, NgayTao, TrangThaiHangCho)
INCLUDE (SoThuTu, MucDoUuTien, BenhNhanId);

-- 3. Kiểm tra Lịch làm việc & Đặt lịch khám của Bác sĩ
CREATE NONCLUSTERED INDEX IX_LichLamViecBacSi_NhanVien_Ngay 
ON dbo.LichLamViecBacSi (NhanVienId, NgayLamViec);

-- 4. Tra cứu Lịch sử Lượt khám / Hồ sơ EMR theo Bệnh nhân
CREATE NONCLUSTERED INDEX IX_LuotKhamBenh_BenhNhan_NgayKham 
ON dbo.LuotKhamBenh (BenhNhanId, NgayKham DESC);

CREATE NONCLUSTERED INDEX IX_HoSoBenhAn_BenhNhan 
ON dbo.HoSoBenhAn (BenhNhanId, ThoiGianDongGoi DESC);

-- 5. Tra cứu Chẩn đoán ICD-10 theo Lượt khám
CREATE NONCLUSTERED INDEX IX_ChanDoanBenh_LuotKham 
ON dbo.ChanDoanBenh (LuotKhamId);

-- 6. Tra cứu Hóa đơn viện phí & Giao dịch VNPay
CREATE NONCLUSTERED INDEX IX_HoaDonVienPhi_BenhNhan ON dbo.HoaDonVienPhi (BenhNhanId, NgayTao DESC);
CREATE NONCLUSTERED INDEX IX_GiaoDichVNPay_TxnRef ON dbo.GiaoDichVNPay (MaThamChieuTxnRef);

GO