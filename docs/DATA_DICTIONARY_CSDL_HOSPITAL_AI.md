# TỪ ĐIỂN DỮ LIỆU CƠ SỞ DỮ LIỆU ĐẦY ĐỦ (DATA DICTIONARY)
## HỆ THỐNG QUẢN LÝ KHÁM CHỮA BỆNH & BỆNH ÁN ĐIỆN TỬ TÍCH HỢP AI (HOSPITAL AI)
> **Đề tài:** Báo cáo Khóa luận Tốt nghiệp Kỹ sư Kỹ thuật Phần mềm  
> **Sinh viên thực hiện:** Nguyễn Thanh Duy - MSSV: 2224801030170  
> **Hệ quản trị CSDL:** SQL Server 2022 (RDBMS) & MongoDB 7.0 (NoSQL)  
> **Khung phát triển:** Entity Framework Core 9.0 (.NET 9)

---

### PHÂN HỆ 1: XÁC THỰC, TÀI KHOẢN & PHÂN QUYỀN

#### Bảng 3.1: Bảng TaiKhoan (Tài khoản người dùng) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh tài khoản (PK, mặc định `NEWID()`) |
| TenDangNhap | varchar(50) | Tên đăng nhập hệ thống / Số điện thoại (Unique) |
| MatKhauMaHoa | varchar(255) | Mật khẩu băm an toàn theo giải thuật PBKDF2 / SHA-256 |
| Email | varchar(100) | Địa chỉ email người dùng (cho phép NULL) |
| SoDienThoai | varchar(20) | Số điện thoại chính chủ dùng nhận OTP SMS |
| TrangThaiKichHoat | bit | Trạng thái hoạt động tài khoản (1: Kích hoạt, 0: Khóa) |
| BaoMatHaiLop | bit | Bật/tắt xác thực 2 lớp qua OTP (1: Bật, 0: Tắt) |
| NgayTao | datetime | Thời điểm đăng ký tài khoản (Mặc định `GETDATE()`) |

---

#### Bảng 3.2: Bảng VaiTro (Vai trò người dùng) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh vai trò (PK, mặc định `NEWID()`) |
| TenVaiTro | varchar(50) | Tên mã vai trò (Admin, Doctor, Patient, Receptionist...) (Unique) |
| MoTa | nvarchar(255) | Mô tả chi tiết quyền hạn của vai trò |

---

#### Bảng 3.3: Bảng QuyenTaiKhoan (Phân quyền Tài khoản - Vai trò) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>TaiKhoanId</ins> | uniqueidentifier | Mã tài khoản người dùng (PK, FK tham chiếu `TaiKhoan.Id`) |
| <ins>VaiTroId</ins> | uniqueidentifier | Mã vai trò được gán (PK, FK tham chiếu `VaiTro.Id`) |

---

### PHÂN HỆ 2: CƠ SỞ VẬT CHẤT & HỒ SƠ NHÂN SỰ Y TẾ

#### Bảng 3.4: Bảng KhoaPhong (Danh mục Khoa - Phòng khám) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh phòng khám / khoa (PK, mặc định `NEWID()`) |
| TenKhoaPhong | nvarchar(100) | Tên khoa/phòng (Khoa Nội, Khoa Ngoại, Phòng Cấp Cứu, TMH...) |
| ViTri | nvarchar(150) | Vị trí thực tế (Tầng 1 - Khu A, Tầng 2 - Khu B...) |
| LoaiPhong | varchar(20) | Phân loại phòng (KhamBenh, XetNghiem, ChuanDoanHinhAnh, Duoc...) |

---

#### Bảng 3.5: Bảng HoSoNhanVien (Hồ sơ Cán bộ y tế & Bác sĩ) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh hồ sơ nhân viên (PK, mặc định `NEWID()`) |
| TaiKhoanId | uniqueidentifier | Mã tài khoản liên kết (FK tham chiếu `TaiKhoan.Id`) |
| KhoaPhongId | uniqueidentifier | Mã khoa phòng công tác (FK tham chiếu `KhoaPhong.Id`) |
| HoTen | nvarchar(100) | Họ và tên đầy đủ của cán bộ nhân viên |
| ChucDanh | nvarchar(50) | Chức vụ/học hàm (Bác sĩ chuyên khoa, Điều dưỡng, Dược sĩ, Thu ngân...) |
| TrangThaiSanSang | bit | Trạng thái sẵn sàng nhận bệnh (1: Đang trực/Sẵn sàng, 0: Bận/Nghỉ) |
| PracticeLicenseNumber | nvarchar(50) | Số chứng chỉ hành nghề (CCHN) theo Luật KCB 2023 |
| PracticeLicenseDate | nvarchar(20) | Ngày cấp chứng chỉ hành nghề |
| PracticeLicenseIssuer | nvarchar(150) | Cơ quan cấp chứng chỉ (Sở Y tế / Bộ Y tế) |
| ScopeOfPractice | nvarchar(255) | Phạm vi hoạt động chuyên môn theo giấy phép |
| NationalPractitionerId | nvarchar(50) | Mã định danh người hành nghề trên cổng Y tế Quốc gia |
| DegreeLevel | nvarchar(50) | Trình độ đào tạo (Bác sĩ CKI, CKII, Thạc sĩ, Tiến sĩ...) |
| PracticeStatus | nvarchar(30) | Trạng thái hành nghề y khoa (Active, Suspended, Inactive) |

---

### PHÂN HỆ 3: HỒ SƠ BỆNH NHÂN, DỊ ỨNG & TIỀN SỬ BỆNH

#### Bảng 3.6: Bảng BenhNhan (Hồ sơ Hành chính Bệnh nhân) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh bệnh nhân (PK, mặc định `NEWID()`) |
| TaiKhoanId | uniqueidentifier | Mã tài khoản cổng người bệnh (FK tham chiếu `TaiKhoan.Id`, cho phép NULL) |
| MaBenhNhan | varchar(20) | Mã số bệnh nhân duy nhất (BN2026xxxx - Unique) |
| HoTen | nvarchar(100) | Họ và tên đầy đủ của người bệnh |
| GioiTinh | varchar(10) | Giới tính (Nam, Nu, Khac) |
| NgaySinh | date | Ngày tháng năm sinh của bệnh nhân |
| SoCCCD | varchar(20) | Số Căn cước công dân định danh theo Đề án 06 (Unique) |
| MaTheBHYT | varchar(20) | Mã số thẻ Bảo hiểm Y tế liên thông BHXH |
| DiaChi | nvarchar(255) | Địa chỉ thường trú / liên hệ |
| NgheNghiep | nvarchar(100) | Nghề nghiệp hiện tại |
| TenNguoiThan | nvarchar(100) | Họ tên người liên hệ khẩn cấp |
| QuanHeNguoiThan | nvarchar(50) | Quan hệ với bệnh nhân (Bố, Mẹ, Vợ, Chồng, Con...) |
| SoDienThoaiNguoiThan | varchar(20) | Số điện thoại người thân khi cần báo tin |
| DiaChiNguoiThan | nvarchar(255) | Địa chỉ của người liên hệ khẩn cấp |
| NgayTao | datetime | Thời điểm tạo hồ sơ bệnh nhân (Mặc định `GETDATE()`) |

---

#### Bảng 3.7: Bảng DiUngBenhNhan (Dị ứng thuốc & Thực phẩm) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh bản ghi dị ứng (PK, mặc định `NEWID()`) |
| BenhNhanId | uniqueidentifier | Mã bệnh nhân (FK tham chiếu `BenhNhan.Id`) |
| LoaiDiUng | varchar(20) | Loại dị ứng (Thuoc, ThucPham, ThoiTiet, Khac) |
| TenChatDiUng | nvarchar(100) | Tên hoạt chất/thuốc/thực phẩm gây dị ứng (Penicillin, Aspirin...) |
| MucDoDiUng | varchar(20) | Mức độ cảnh báo (Nhe, TrungBinh, NghiemTrong, SocPhanVe) |

---

#### Bảng 3.8: Bảng TienSuBenhLy (Tiền sử bệnh bản thân & Gia đình) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh tiền sử bệnh (PK, mặc định `NEWID()`) |
| BenhNhanId | uniqueidentifier | Mã bệnh nhân (FK tham chiếu `BenhNhan.Id`) |
| TenBenhNen | nvarchar(150) | Tên bệnh mạn tính / tiền sử phẫu thuật (Tăng huyết áp, Đái tháo đường...) |
| NgayPhatBenh | date | Thời điểm phát hiện bệnh hoặc phẫu thuật |
| GhiChu | nvarchar(255) | Chi tiết quá trình điều trị hoặc ghi chú lâm sàng |

---

### PHÂN HỆ 4: TIẾP NHẬN, ĐIỀU PHỐI HÀNG CHỜ & ĐẶT LỊCH HẸN

#### Bảng 3.9: Bảng LichLamViecBacSi (Lịch làm việc & Ca trực Bác sĩ) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh ca làm việc (PK, mặc định `NEWID()`) |
| NhanVienId | uniqueidentifier | Mã bác sĩ trực (FK tham chiếu `HoSoNhanVien.Id`) |
| KhoaPhongId | uniqueidentifier | Mã phòng khám phục vụ ca (FK tham chiếu `KhoaPhong.Id`) |
| NgayLamViec | date | Ngày làm việc thực tế |
| KhungGioKham | varchar(50) | Ca trực khám (07:30 - 11:30, 13:00 - 17:00...) |
| SoCaToiDa | int | Hạn ngạch (Quota slot) bệnh nhân tối đa trong ca trực (Mặc định 20) |

---

#### Bảng 3.10: Bảng LichHenKham (Lịch hẹn khám bệnh) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh lịch hẹn (PK, mặc định `NEWID()`) |
| BenhNhanId | uniqueidentifier | Mã bệnh nhân đăng ký (FK tham chiếu `BenhNhan.Id`) |
| LichLamViecId | uniqueidentifier | Mã ca trực đăng ký khám (FK tham chiếu `LichLamViecBacSi.Id`) |
| NgayDatHen | datetime | Ngày giờ bệnh nhân đến khám theo lịch |
| GhiChuTrieuChung | nvarchar(500) | Triệu chứng ban đầu do bệnh nhân mô tả |
| TrangThaiLichHen | varchar(20) | Trạng thái lịch (Pending, Confirmed, CheckedIn, Cancelled) |

---

#### Bảng 3.11: Bảng PhieuHangCho (Số thứ tự & Hàng chờ Thông minh) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh phiếu hàng chờ (PK, mặc định `NEWID()`) |
| BenhNhanId | uniqueidentifier | Mã bệnh nhân lấy số (FK tham chiếu `BenhNhan.Id`) |
| KhoaPhongId | uniqueidentifier | Mã phòng khám tiếp nhận (FK tham chiếu `KhoaPhong.Id`) |
| LichHenId | uniqueidentifier | Mã lịch hẹn liên kết (FK tham chiếu `LichHenKham.Id`, cho phép NULL) |
| SoThuTu | int | Số thứ tự khám trong ngày (1, 2, 3...) |
| TrangThaiHangCho | varchar(20) | Trạng thái (Waiting: Đang đợi, Calling: Đang gọi, Examining, Completed) |
| MucDoUuTien | varchar(20) | Ưu tiên y tế (Normal: Thường, Emergency: Cấp cứu, Priority: Người già/Trẻ em) |
| NgayTao | datetime | Thời điểm bấm lấy số thứ tự (Mặc định `GETDATE()`) |

---

### PHÂN HỆ 5: KHÁM BỆNH, SÀNG LỌC & BỆNH ÁN ĐIỆN TỬ (EMR)

#### Bảng 3.12: Bảng LuotKhamBenh (Phiên Khám Chữa Bệnh Lâm Sàng) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã phiên khám bệnh (PK, mặc định `NEWID()`) |
| BenhNhanId | uniqueidentifier | Mã bệnh nhân (FK tham chiếu `BenhNhan.Id`) |
| BacSiId | uniqueidentifier | Bác sĩ phụ trách chính (FK tham chiếu `HoSoNhanVien.Id`) |
| PhieuHangChoId | uniqueidentifier | Số thứ tự tương ứng (FK tham chiếu `PhieuHangCho.Id`) |
| NgayKham | datetime | Thời điểm bắt đầu khám (Mặc định `GETDATE()`) |
| TrangThaiLuotKham | varchar(20) | Trạng thái phiên khám (Examining, WaitingResults, Completed, Cancelled) |
| LyDoVaoVien | nvarchar(500) | Lý do khám bệnh / Triệu chứng chính |
| QuaTrinhBenhLy | nvarchar(max) | Bệnh sử, quá trình diễn biến bệnh trước khi khám |
| KhamToanThan | nvarchar(max) | Khám lâm sàng từng cơ quan, thể trạng toàn thân |
| ChanDoanVaoVien | nvarchar(255) | Chẩn đoán sơ bộ lúc ban đầu |
| ChanDoanSoBo | nvarchar(255) | Chẩn đoán định hướng của bác sĩ |
| ChanDoanPhanBiet | nvarchar(255) | Các bệnh lý cần phân biệt |
| TinhTrangRaVien | nvarchar(255) | Tình trạng người bệnh khi kết thúc buổi khám (Khỏi, Đỡ, Chuyển viện...) |
| HuongDieuTri | nvarchar(500) | Phương pháp điều trị tiếp theo |
| CheDoDinhDuong | nvarchar(500) | Lời dặn chế độ ăn uống, tập luyện |
| LichTaiKham | nvarchar(255) | Hướng dẫn tái khám nếu có |
| ChuKySo | nvarchar(255) | Chữ ký điện tử / Hash xác thực EMR của bác sĩ |
| ICD10ChapterCode | nvarchar(50) | Mã chương ICD-10 theo Thông tư 06/2026/TT-BYT |
| ICD10ChapterName | nvarchar(255) | Tên chương bệnh ICD-10 |
| SecondaryDiagnosesJson | nvarchar(max) | Danh sách bệnh kèm theo dạng JSON |
| DiseaseStage | nvarchar(50) | Giai đoạn bệnh (Cấp tính, Mạn tính...) |
| DiagnosisType | nvarchar(50) | Phân loại chẩn đoán (Xác định, Nghi ngờ, Sơ bộ) |
| IsEpidemicAlert | bit | Cảnh báo bệnh truyền nhiễm/dịch tễ (1: Có, 0: Không) |
| NationalPrescriptionCode | nvarchar(50) | Mã đơn thuốc liên thông cổng quốc gia |
| FacilityCode | nvarchar(50) | Mã cơ sở khám chữa bệnh liên thông (Ví dụ: 74001) |
| FacilityName | nvarchar(255) | Tên cơ sở y tế |
| NationalSyncStatus | nvarchar(50) | Trạng thái đồng bộ đơn thuốc quốc gia |
| NationalTransactionId | nvarchar(100) | Mã giao dịch liên thông quốc gia |
| NationalSyncTimestamp | datetime2 | Thời gian đồng bộ dữ liệu quốc gia |
| NationalSyncMessage | nvarchar(500) | Thông điệp phản hồi từ cổng liên thông |
| NationalLookupQR | nvarchar(500) | Đường dẫn mã QR tra cứu đơn thuốc quốc gia |
| DoctorScopeOfPractice | nvarchar(500) | Phạm vi hành nghề của bác sĩ khám |
| DoctorDegreeLevel | nvarchar(50) | Học vị chuyên môn của bác sĩ khám |
| DoctorIssuer | nvarchar(255) | Cơ quan cấp CCHN của bác sĩ khám |
| IsPracticeScopeCompliant | bit | Tuân thủ phạm vi hoạt động chuyên môn (1: Đúng, 0: Sai) |

---

#### Bảng 3.13: Bảng ChiSoSinhHieu (Dấu hiệu sinh tồn / Sàng lọc Y tế) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã chỉ số sinh hiệu (PK, mặc định `NEWID()`) |
| LuotKhamId | uniqueidentifier | Mã lượt khám liên kết (FK tham chiếu `LuotKhamBenh.Id`) |
| Mach | int | Nhịp tim / Mạch đập (lần/phút) |
| NhietDo | decimal(4,2) | Thân nhiệt (°C, ví dụ: 37.00) |
| HuyetApTamThu | int | Huyết áp tâm thu (mmHg, ví dụ: 120) |
| HuyetApTamTruong | int | Huyết áp tâm trương (mmHg, ví dụ: 80) |
| CanNang | decimal(5,2) | Cân nặng người bệnh (kg, ví dụ: 65.50) |
| ChieuCao | decimal(5,2) | Chiều cao người bệnh (cm, ví dụ: 170.00) |
| ThoiDiemDo | datetime | Thời điểm đo chỉ số (Mặc định `GETDATE()`) |

---

#### Bảng 3.14: Bảng GhiChuSOAP (Bệnh án Điện tử chuẩn Quốc tế SOAP) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã ghi chú SOAP (PK, mặc định `NEWID()`) |
| LuotKhamId | uniqueidentifier | Mã lượt khám bệnh (FK tham chiếu `LuotKhamBenh.Id`) |
| TrieuChungChuQuan | nvarchar(max) | **S (Subjective):** Triệu chứng cơ năng do bệnh nhân tự khai |
| KhamKhachQuan | nvarchar(max) | **O (Objective):** Triệu chứng thực thể qua thăm khám của bác sĩ |
| DanhGiaLamSang | nvarchar(max) | **A (Assessment):** Đánh giá tình trạng, nhận định lâm sàng |
| KeHoachXuTri | nvarchar(max) | **P (Plan):** Kế hoạch xét nghiệm, phác đồ điều trị, chăm sóc |

---

#### Bảng 3.15: Bảng ChanDoanBenh (Mã bệnh Chẩn đoán Quốc tế ICD-10) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh bản ghi chẩn đoán (PK, mặc định `NEWID()`) |
| LuotKhamId | uniqueidentifier | Mã lượt khám bệnh (FK tham chiếu `LuotKhamBenh.Id`) |
| MaICD10 | varchar(10) | Mã bệnh chuẩn quốc tế ICD-10 (J00, I10, E11...) |
| TenBenhICD10 | nvarchar(255) | Tên bệnh chính thức tương ứng với mã ICD-10 |
| LaBenhChinh | bit | Đánh dấu bệnh chính hay bệnh kèm theo (1: Bệnh chính, 0: Bệnh kèm theo) |
| GhiChuChiTiet | nvarchar(500) | Ghi chú thêm về diễn biến hoặc thể bệnh |
| MaChuongICD10 | varchar(20) | Mã phân loại chương bệnh |
| TenChuongICD10 | nvarchar(150) | Tên chương bệnh (Bệnh hệ hô hấp, tuần hoàn...) |
| GiaiDoanBenh | nvarchar(50) | Giai đoạn tiến triển của bệnh |
| DanhSachBenhKemTheo | nvarchar(max) | Danh sách JSON các mã bệnh phụ |
| LoaiChanDoan | varchar(30) | Loại chẩn đoán (XacDinh, PhanBiet, NghiNgo) |
| CanhBaoDichTe | bit | Cảnh báo bệnh dịch tễ truyền nhiễm (1: Có, 0: Không) |

---

### PHÂN HỆ 6: ĐƠN THUỐC, KÝ SỐ & DƯỢC LÂM SÀNG

#### Bảng 3.16: Bảng DonThuoc (Toa thuốc Điện tử Liên thông Quốc gia) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh toa thuốc (PK, mặc định `NEWID()`) |
| LuotKhamId | uniqueidentifier | Mã lượt khám chỉ định toa (FK tham chiếu `LuotKhamBenh.Id`) |
| BacSiId | uniqueidentifier | Bác sĩ kê đơn (FK tham chiếu `HoSoNhanVien.Id`) |
| ThoiGianKy | datetime | Thời điểm bác sĩ ký đơn thuốc (Mặc định `GETDATE()`) |
| ChuKySoBacSi | varchar(max) | Chuỗi chữ ký số điện tử RSA / SHA-256 của bác sĩ |
| LoiDanBacSi | nvarchar(500) | Lời dặn dò bác sĩ về cách sinh hoạt, chế độ ăn |
| MaDonThuocQuocGia | varchar(50) | Mã đơn thuốc liên thông cổng quốc gia TT 26/2025/TT-BYT |
| MaCoSoKhamChuaBenh | varchar(20) | Mã định danh bệnh viện trên cổng ERX (Mặc định: 74001) |
| TenCoSoKhamChuaBenh | nvarchar(150) | Tên cơ sở y tế (Bệnh viện Đa khoa Thủ Dầu Một - Hospital AI) |
| TrangThaiLienThong | varchar(30) | Trạng thái gửi cổng ERX (ChuaGui, DaLienThong, LoiLienThong) |
| ThoiGianLienThong | datetime | Thời điểm đẩy đơn lên Cổng Đơn thuốc Quốc gia |
| MaLienThongQuocGia | varchar(100) | Mã giao dịch nhận từ cổng quốc gia (Transaction ID) |
| ThongDiepPhanHoi | nvarchar(500) | Thông báo xác nhận trả về từ cổng quốc gia |
| QRCodeLienThong | varchar(500) | Chuỗi QR tra cứu đơn thuốc điện tử quốc gia |
| HinhThucDieuTri | varchar(30) | Hình thức điều trị (NgoaiTru, NoiTru, BanNgay) |
| NgayTaiKham | date | Ngày hẹn tái khám của người bệnh |

---

#### Bảng 3.17: Bảng ChiTietDonThuoc (Chi tiết Thuốc trong Toa) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã chi tiết dòng thuốc (PK, mặc định `NEWID()`) |
| DonThuocId | uniqueidentifier | Mã toa thuốc (FK tham chiếu `DonThuoc.Id`) |
| TenThuoc | nvarchar(150) | Tên thương mại / tên biệt dược của thuốc |
| SoLuong | int | Tổng số lượng cấp phát |
| LieuLuongDung | nvarchar(100) | Liều lượng dùng (Ví dụ: 1 viên/lần) |
| HuongDanCachUong | nvarchar(255) | Hướng dẫn uống (Uống sau ăn no, uống nhiều nước...) |
| NationalDrugCode | nvarchar(50) | Mã thuốc theo Danh mục Dược Quốc gia |
| BrandName | nvarchar(150) | Tên biệt dược gốc |
| ActiveIngredient | nvarchar(150) | Tên hoạt chất chính |
| Concentration | nvarchar(100) | Hàm lượng hoạt chất (500mg, 10mg/5ml...) |
| DosageForm | nvarchar(100) | Dạng bào chế (Viên nén, Viên nang, Hỗn dịch...) |
| AdministrationRoute | nvarchar(100) | Đường dùng (Đường uống, Tiêm bắp, Tiêm tĩnh mạch...) |
| DurationDays | int | Số ngày chỉ định dùng thuốc (Mặc định 5 ngày) |
| MorningDose | nvarchar(50) | Liều dùng buổi sáng |
| NoonDose | nvarchar(50) | Liều dùng buổi trưa |
| AfternoonDose | nvarchar(50) | Liều dùng buổi chiều |
| EveningDose | nvarchar(50) | Liều dùng buổi tối |

---

#### Bảng 3.18: Bảng DinhKemBenhAn (Tập tin Đính kèm Hồ sơ EMR) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh tệp đính kèm (PK, mặc định `NEWID()`) |
| LuotKhamId | uniqueidentifier | Mã lượt khám liên kết (FK tham chiếu `LuotKhamBenh.Id`) |
| DinhDangFile | varchar(10) | Định dạng tệp tin (PNG, JPG, PDF, DICOM...) |
| DuongDanFile | varchar(500) | Đường dẫn lưu trữ vật lý / URL tệp đính kèm |
| MoTaFile | nvarchar(255) | Mô tả nội dung file (Ảnh chụp tổn thương da, Giấy chuyển viện...) |
| ThoiGianTaiLen | datetime | Thời điểm tải lên hệ thống (Mặc định `GETDATE()`) |

---

### PHÂN HỆ 7: CẬN LÂM SÀNG, XÉT NGHIỆM & CHẨN ĐOÁN HÌNH ẢNH

#### Bảng 3.19: Bảng ChiDinhCanLamSang (Phiếu Chỉ định Dịch vụ Cận lâm sàng) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã phiếu chỉ định (PK, mặc định `NEWID()`) |
| LuotKhamId | uniqueidentifier | Mã phiên khám bệnh (FK tham chiếu `LuotKhamBenh.Id`) |
| BacSiChiDinhId | uniqueidentifier | Bác sĩ ra y lệnh cận lâm sàng (FK tham chiếu `HoSoNhanVien.Id`) |
| MaDichVu | varchar(20) | Mã dịch vụ kỹ thuật y tế theo Bộ Y tế |
| TenDichVu | nvarchar(150) | Tên kỹ thuật chỉ định (Chụp X-Quang lồng ngực, Xét nghiệm máu...) |
| TrangThaiChiDinh | varchar(20) | Trạng thái (Ordered: Đã chỉ định, InProgress, Completed: Đã có kết quả) |
| ThoiGianChiDinh | datetime | Thời điểm bác sĩ tạo phiếu chỉ định (Mặc định `GETDATE()`) |

---

#### Bảng 3.20: Bảng ChiTietChiDinhDV (Chi tiết Danh mục Dịch vụ Kỹ thuật) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã dòng dịch vụ cận lâm sàng (PK, mặc định `NEWID()`) |
| ExaminationId | uniqueidentifier | Mã phiên khám liên kết (FK tham chiếu `LuotKhamBenh.Id`) |
| ServiceName | nvarchar(150) | Tên dịch vụ kỹ thuật |
| ServiceCategory | nvarchar(100) | Nhóm danh mục dịch vụ (Xét nghiệm, CĐHA, Thăm dò chức năng...) |
| Price | decimal(18,2) | Đơn giá viện phí niêm yết của dịch vụ |
| Result | nvarchar(max) | Kết quả chi tiết bằng văn bản / kết luận |
| Status | nvarchar(50) | Tình trạng thực hiện dịch vụ |

---

#### Bảng 3.21: Bảng KetQuaCanLamSang (Kết quả Xét nghiệm & CĐHA) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh kết quả cận lâm sàng (PK, mặc định `NEWID()`) |
| ChiDinhId | uniqueidentifier | Mã phiếu chỉ định (FK tham chiếu `ChiDinhCanLamSang.Id`) |
| KyThuatVienId | uniqueidentifier | Kỹ thuật viên / Bác sĩ CĐHA thực hiện (FK tham chiếu `HoSoNhanVien.Id`) |
| TenChiSo | nvarchar(100) | Tên chỉ số xét nghiệm (RBC, WBC, Glucose, Creatinine...) |
| GiaTriDo | varchar(50) | Giá trị định lượng đo được trong xét nghiệm |
| KhoangThamChieu | varchar(50) | Khoảng tham chiếu sinh lý bình thường (4.0 - 5.5 mmol/L...) |
| CoBatThuong | bit | Cờ cảnh báo kết quả bất thường (1: Bất thường, 0: Bình thường) |
| KetLuanHinhAnh | nvarchar(max) | Kết luận hình ảnh X-quang, Siêu âm, CT |
| ThoiGianKyDuyet | datetime | Thời điểm duyệt trả kết quả (Mặc định `GETDATE()`) |

---

### PHÂN HỆ 8: TRỢ LÝ Y TẾ AI & PHÁC ĐỒ ĐIỀU TRỊ

#### Bảng 3.22: Bảng TaiLieuPhacDo (Kho Dữ liệu Phác đồ Điều trị Chuẩn) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã tài liệu phác đồ (PK, mặc định `NEWID()`) |
| TieuDe | nvarchar(255) | Tên phác đồ điều trị theo hướng dẫn Bộ Y tế |
| NoiDungTho | nvarchar(max) | Toàn văn hướng dẫn lâm sàng, tiêu chuẩn chẩn đoán |
| ChuyenKhoa | varchar(50) | Chuyên khoa áp dụng (NoiKhoa, NgoaiKhoa, NhiKhoa...) |
| NgayCapNhat | datetime | Ngày cập nhật phiên bản tài liệu phác đồ (Mặc định `GETDATE()`) |

---

#### Bảng 3.23: Bảng NhatKyGoiYAI (Nhật ký Khuyến nghị Lâm sàng từ AI) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã định danh nhật ký AI (PK, mặc định `NEWID()`) |
| LuotKhamId | uniqueidentifier | Mã lượt khám bệnh đang xử lý (FK tham chiếu `LuotKhamBenh.Id`) |
| LoaiTroLyAI | varchar(30) | Năng lực AI (SuggestICD10, DrugInteractionCheck, ChestXRayAnalysis) |
| DuLieuDauVao | nvarchar(max) | Dữ liệu prompt/triệu chứng/ảnh gửi lên Gemini AI |
| KetQuaGoiYAI | nvarchar(max) | Phản hồi tư vấn, cảnh báo tương tác thuốc từ AI |
| PhanHoiBacSi | varchar(20) | Đánh giá của Bác sĩ (Accepted: Đồng ý dùng, Modified: Đã sửa, Rejected: Bỏ qua) |
| ThoiGianTao | datetime | Thời điểm AI xử lý tư vấn (Mặc định `GETDATE()`) |

---

### PHÂN HỆ 9: VIỆN PHÍ, HÓA ĐƠN & THANH TOÁN TRỰC TUYẾN

#### Bảng 3.24: Bảng HoaDon (Hóa đơn Viện phí & Giao dịch) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã hóa đơn viện phí (PK, mặc định `NEWID()`) |
| BenhNhanId | uniqueidentifier | Mã bệnh nhân thanh toán (FK tham chiếu `BenhNhan.Id`) |
| LuotKhamId | uniqueidentifier | Mã lượt khám bệnh (FK tham chiếu `LuotKhamBenh.Id`, cho phép NULL) |
| LoaiHoaDon | varchar(50) | Phân loại hóa đơn (TienKham, ChiDinhCanLamSang, TienThuoc) |
| TongTien | decimal(18,2) | Tổng số tiền viện phí phải thanh toán (VNĐ) |
| TrangThai | varchar(20) | Trạng thái thanh toán (Unpaid: Chưa trả, Paid: Đã thu, Cancelled: Hủy) |
| NgayTao | datetime | Thời điểm phát sinh hóa đơn (Mặc định `GETDATE()`) |
| NgayThanhToan | datetime | Thời điểm người bệnh đóng tiền (cho phép NULL) |
| PhuongThucThanhToan | varchar(50) | Phương thức thanh toán (VNPay, VietQR, TienMat, ChuyenKhoan) |
| MaGiaoDich | varchar(100) | Mã giao dịch tham chiếu từ cổng VNPAY / VietQR (`vnp_TxnRef`) |
| NguoiThuTienId | uniqueidentifier | Thu ngân tiếp nhận thu tiền (FK tham chiếu `HoSoNhanVien.Id`) |

---

#### Bảng 3.25: Bảng ChiTietHoaDon (Chi tiết Dòng Dịch vụ trên Hóa đơn) [Mô hình CSDL SQL Server 2022 / EF Core]
| Tên cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| <ins>Id</ins> | uniqueidentifier | Mã dòng chi tiết hóa đơn (PK, mặc định `NEWID()`) |
| HoaDonId | uniqueidentifier | Mã hóa đơn liên kết (FK tham chiếu `HoaDon.Id`) |
| TenDichVu | nvarchar(255) | Tên mục thu viện phí (Khám chuyên khoa, X-quang tim phổi...) |
| DonGia | decimal(18,2) | Đơn giá của dịch vụ / thuốc (VNĐ) |
| SoLuong | int | Số lượng sử dụng (Mặc định 1) |
| ThanhTien | decimal(18,2) | Thành tiền = Đơn giá × Số lượng (VNĐ) |
| ThamChieuId | uniqueidentifier | ID liên kết đến bảng nguồn (`ChiDinhCanLamSang.Id`, `DonThuoc.Id`) |

---

### PHÂN HỆ 10: DỮ LIỆU PHI CẤU TRÚC (MONGODB NOSQL)

#### Bảng 3.26: Collection ai_prompt_logs (Nhật ký Kiểm toán AI phi cấu trúc - MongoDB NoSQL)
| Tên thuộc tính (Field) | Kiểu BSON | Mô tả |
| :--- | :--- | :--- |
| <ins>_id</ins> | ObjectId | Khóa định danh tài liệu NoSQL (PK do MongoDB tự sinh) |
| conversation_id | string | Mã phiên hội thoại giữa người dùng và Trợ lý ảo y tế |
| user_id | string | Mã định danh người dùng tương tác |
| role | string | Vai trò người dùng tại thời điểm trò chuyện (Patient / Doctor) |
| model_name | string | Tên mô hình AI (`gemini-3.6-flash`, `gemini-1.5-pro`...) |
| prompt_content | string | Toàn văn câu hỏi hoặc ngữ cảnh lâm sàng gửi cho AI |
| response_content | string | Phản hồi đầy đủ từ AI đã lọc qua bộ Clinical Guardrail |
| latency_ms | int32 | Độ trễ xử lý phản hồi từ AI (mili-giây) |
| tokens_used | int32 | Tổng số lượng tokens tiêu thụ trong lượt gọi API |
| timestamp | date | Thời gian ghi nhận phiên tương tác |
