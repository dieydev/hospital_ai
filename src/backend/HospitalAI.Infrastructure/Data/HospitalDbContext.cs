using HospitalAI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HospitalAI.Infrastructure.Data;

public class HospitalDbContext : DbContext
{
    public HospitalDbContext(DbContextOptions<HospitalDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Patient> Patients => Set<Patient>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<QueueTicket> QueueTickets => Set<QueueTicket>();
    public DbSet<Examination> Examinations => Set<Examination>();
    public DbSet<PrescriptionDetail> PrescriptionDetails => Set<PrescriptionDetail>();
    public DbSet<ServiceOrderDetail> ServiceOrderDetails => Set<ServiceOrderDetail>();

    // New Entities
    public DbSet<StaffProfile> StaffProfiles => Set<StaffProfile>();
    public DbSet<DoctorSchedule> DoctorSchedules => Set<DoctorSchedule>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<PatientAllergy> PatientAllergies => Set<PatientAllergy>();
    public DbSet<MedicalHistory> MedicalHistories => Set<MedicalHistory>();
    public DbSet<VitalSign> VitalSigns => Set<VitalSign>();
    public DbSet<SoapNote> SoapNotes => Set<SoapNote>();
    public DbSet<Diagnosis> Diagnoses => Set<Diagnosis>();
    public DbSet<Prescription> Prescriptions => Set<Prescription>();
    public DbSet<MedicalAttachment> MedicalAttachments => Set<MedicalAttachment>();
    public DbSet<ServiceOrder> ServiceOrders => Set<ServiceOrder>();
    public DbSet<ServiceResult> ServiceResults => Set<ServiceResult>();
    public DbSet<MedicalGuideline> MedicalGuidelines => Set<MedicalGuideline>();
    public DbSet<AILog> AILogs => Set<AILog>();
    public DbSet<Billing> Billings => Set<Billing>();
    public DbSet<BillingItem> BillingItems => Set<BillingItem>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map to SSMS Table: dbo.KhoaPhong
        modelBuilder.Entity<Department>(entity =>
        {
            entity.ToTable("KhoaPhong", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DepartmentName).HasColumnName("TenKhoaPhong").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Location).HasColumnName("ViTri").HasMaxLength(150).IsRequired();
            entity.Property(e => e.RoomType).HasColumnName("LoaiPhong").HasMaxLength(20).IsRequired();
        });

        // Map to SSMS Table: dbo.PhieuHangCho
        modelBuilder.Entity<QueueTicket>(entity =>
        {
            entity.ToTable("PhieuHangCho", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PatientId).HasColumnName("BenhNhanId").IsRequired();
            entity.Property(e => e.DepartmentId).HasColumnName("KhoaPhongId").IsRequired();
            entity.Property(e => e.AppointmentId).HasColumnName("LichHenId");
            entity.Property(e => e.SequenceNumber).HasColumnName("SoThuTu").IsRequired();
            entity.Property(e => e.Status).HasColumnName("TrangThaiHangCho").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Priority).HasColumnName("MucDoUuTien").HasMaxLength(20).IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("NgayTao");

            entity.HasOne(q => q.Patient)
                  .WithMany()
                  .HasForeignKey(q => q.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(q => q.Department)
                  .WithMany()
                  .HasForeignKey(q => q.DepartmentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Map to SSMS Table: dbo.TaiKhoan
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("TaiKhoan", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.Username).HasColumnName("TenDangNhap").HasMaxLength(50).IsRequired();
            entity.Property(e => e.PasswordHash).HasColumnName("MatKhauMaHoa").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Email).HasColumnName("Email").HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).HasColumnName("SoDienThoai").HasMaxLength(20).IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("TrangThaiKichHoat");
            entity.Property(e => e.TwoFactorEnabled).HasColumnName("BaoMatHaiLop");
            entity.Property(e => e.CreatedAt).HasColumnName("NgayTao");

            // Ignore properties not in TaiKhoan table
            entity.Ignore(e => e.FullName);
            entity.Ignore(e => e.Specialty);
            entity.Ignore(e => e.Title);
            entity.Ignore(e => e.AvatarUrl);

            entity.HasIndex(e => e.Username).IsUnique();
        });

        // Map to SSMS Table: dbo.VaiTro
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("VaiTro", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("Id");
            entity.Property(e => e.Name).HasColumnName("TenVaiTro").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Description).HasColumnName("MoTa").HasMaxLength(255);

            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Map to SSMS Table: dbo.QuyenTaiKhoan (Many-To-Many)
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("QuyenTaiKhoan", "dbo");
            entity.HasKey(e => new { e.UserId, e.RoleId });

            entity.Property(e => e.UserId).HasColumnName("TaiKhoanId");
            entity.Property(e => e.RoleId).HasColumnName("VaiTroId");

            entity.HasOne(ur => ur.User)
                  .WithMany(u => u.UserRoles)
                  .HasForeignKey(ur => ur.UserId);

            entity.HasOne(ur => ur.Role)
                  .WithMany(r => r.UserRoles)
                  .HasForeignKey(ur => ur.RoleId);
        });

        // Map to SSMS Table: dbo.BenhNhan
        modelBuilder.Entity<Patient>(entity =>
        {
            entity.ToTable("BenhNhan", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PatientCode).HasColumnName("MaBenhNhan").HasMaxLength(20).IsRequired();
            entity.Property(e => e.FullName).HasColumnName("HoTen").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Gender).HasColumnName("GioiTinh").HasMaxLength(10).IsRequired();
            entity.Property(e => e.DateOfBirth).HasColumnName("NgaySinh").IsRequired();
            entity.Property(e => e.IdentityCardNumber).HasColumnName("SoCCCD").HasMaxLength(20).IsRequired();
            entity.Property(e => e.HealthInsuranceNumber).HasColumnName("MaTheBHYT").HasMaxLength(20);
            entity.Property(e => e.Address).HasColumnName("DiaChi").HasMaxLength(255).IsRequired();
            entity.Property(e => e.EmergencyContactName).HasColumnName("TenNguoiThan").HasMaxLength(100);
            entity.Property(e => e.EmergencyContactRelation).HasColumnName("QuanHeNguoiThan").HasMaxLength(50);
            entity.Property(e => e.EmergencyContactPhone).HasColumnName("SoDienThoaiNguoiThan").HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasColumnName("NgayTao");

            entity.Property(e => e.UserId).HasColumnName("TaiKhoanId");

            entity.HasOne(p => p.User)
                  .WithMany()
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.PatientCode).IsUnique();
            entity.HasIndex(e => e.IdentityCardNumber).IsUnique();
        });

        // Map to SSMS Table: dbo.LuotKhamBenh
        modelBuilder.Entity<Examination>(entity =>
        {
            entity.ToTable("LuotKhamBenh", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExaminationCode).HasColumnName("MaLuotKham");
            entity.Property(e => e.ExaminationDate).HasColumnName("ThoiGianTiepNhan");

            entity.HasOne(e => e.Patient)
                  .WithMany(p => p.Examinations)
                  .HasForeignKey(e => e.PatientId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Doctor)
                  .WithMany()
                  .HasForeignKey(e => e.DoctorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Configuration for PrescriptionDetail
        modelBuilder.Entity<PrescriptionDetail>(entity =>
        {
            entity.ToTable("ChiTietDonThuoc", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
        });

        // Configuration for ServiceOrderDetail
        modelBuilder.Entity<ServiceOrderDetail>(entity =>
        {
            entity.ToTable("ChiTietChiDinhDV", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Price).HasPrecision(18, 2);
        });

        // Configurations for New Entities
        modelBuilder.Entity<StaffProfile>(entity =>
        {
            entity.ToTable("HoSoNhanVien", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UserId).HasColumnName("TaiKhoanId");
            entity.Property(e => e.DepartmentId).HasColumnName("KhoaPhongId");
            entity.Property(e => e.FullName).HasColumnName("HoTen").HasMaxLength(100);
            entity.Property(e => e.Title).HasColumnName("ChucDanh").HasMaxLength(50);
            entity.Property(e => e.IsAvailable).HasColumnName("TrangThaiSanSang");
        });

        modelBuilder.Entity<PatientAllergy>(entity =>
        {
            entity.ToTable("DiUngBenhNhan", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PatientId).HasColumnName("BenhNhanId");
            entity.Property(e => e.AllergyType).HasColumnName("LoaiDiUng").HasMaxLength(20);
            entity.Property(e => e.Allergen).HasColumnName("TenChatDiUng").HasMaxLength(100);
            entity.Property(e => e.Severity).HasColumnName("MucDoDiUng").HasMaxLength(20);
        });

        modelBuilder.Entity<MedicalHistory>(entity =>
        {
            entity.ToTable("TienSuBenhLy", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PatientId).HasColumnName("BenhNhanId");
            entity.Property(e => e.DiseaseName).HasColumnName("TenBenhNen").HasMaxLength(150);
            entity.Property(e => e.OnsetDate).HasColumnName("NgayPhatBenh");
            entity.Property(e => e.Notes).HasColumnName("GhiChu").HasMaxLength(255);
        });

        modelBuilder.Entity<DoctorSchedule>(entity =>
        {
            entity.ToTable("LichLamViecBacSi", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StaffId).HasColumnName("NhanVienId");
            entity.Property(e => e.DepartmentId).HasColumnName("KhoaPhongId");
            entity.Property(e => e.WorkDate).HasColumnName("NgayLamViec");
            entity.Property(e => e.TimeSlot).HasColumnName("KhungGioKham").HasMaxLength(50);
            entity.Property(e => e.MaxPatients).HasColumnName("SoCaToiDa");
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.ToTable("LichHenKham", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PatientId).HasColumnName("BenhNhanId");
            entity.Property(e => e.ScheduleId).HasColumnName("LichLamViecId");
            entity.Property(e => e.AppointmentDate).HasColumnName("NgayDatHen");
            entity.Property(e => e.Symptoms).HasColumnName("GhiChuTrieuChung").HasMaxLength(500);
            entity.Property(e => e.Status).HasColumnName("TrangThaiLichHen").HasMaxLength(20);
        });

        modelBuilder.Entity<VitalSign>(entity =>
        {
            entity.ToTable("ChiSoSinhHieu", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExaminationId).HasColumnName("LuotKhamId");
            entity.Property(e => e.PulseRate).HasColumnName("Mach");
            entity.Property(e => e.Temperature).HasColumnName("NhietDo").HasColumnType("decimal(4,2)");
            entity.Property(e => e.SystolicBloodPressure).HasColumnName("HuyetApTamThu");
            entity.Property(e => e.DiastolicBloodPressure).HasColumnName("HuyetApTamTruong");
            entity.Property(e => e.Weight).HasColumnName("CanNang").HasColumnType("decimal(5,2)");
            entity.Property(e => e.Height).HasColumnName("ChieuCao").HasColumnType("decimal(5,2)");
            entity.Property(e => e.MeasurementTime).HasColumnName("ThoiDiemDo");
        });

        modelBuilder.Entity<SoapNote>(entity =>
        {
            entity.ToTable("GhiChuSOAP", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExaminationId).HasColumnName("LuotKhamId");
            entity.Property(e => e.Subjective).HasColumnName("TrieuChungChuQuan");
            entity.Property(e => e.Objective).HasColumnName("KhamKhachQuan");
            entity.Property(e => e.Assessment).HasColumnName("DanhGiaLamSang");
            entity.Property(e => e.Plan).HasColumnName("KeHoachXuTri");
        });

        modelBuilder.Entity<Diagnosis>(entity =>
        {
            entity.ToTable("ChanDoanBenh", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExaminationId).HasColumnName("LuotKhamId");
            entity.Property(e => e.ICD10Code).HasColumnName("MaICD10").HasMaxLength(10);
            entity.Property(e => e.ICD10Name).HasColumnName("TenBenhICD10").HasMaxLength(255);
            entity.Property(e => e.IsPrimary).HasColumnName("LaBenhChinh");
            entity.Property(e => e.Notes).HasColumnName("GhiChuChiTiet").HasMaxLength(500);
        });

        modelBuilder.Entity<Prescription>(entity =>
        {
            entity.ToTable("DonThuoc", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExaminationId).HasColumnName("LuotKhamId");
            entity.Property(e => e.DoctorId).HasColumnName("BacSiId");
            entity.Property(e => e.PrescribedTime).HasColumnName("ThoiGianKy");
            entity.Property(e => e.DigitalSignature).HasColumnName("ChuKySoBacSi");
            entity.Property(e => e.DoctorAdvice).HasColumnName("LoiDanBacSi").HasMaxLength(500);
        });

        modelBuilder.Entity<MedicalAttachment>(entity =>
        {
            entity.ToTable("DinhKemBenhAn", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExaminationId).HasColumnName("LuotKhamId");
            entity.Property(e => e.FileFormat).HasColumnName("DinhDangFile").HasMaxLength(10);
            entity.Property(e => e.FileUrl).HasColumnName("DuongDanFile").HasMaxLength(500);
            entity.Property(e => e.Description).HasColumnName("MoTaFile").HasMaxLength(255);
            entity.Property(e => e.UploadTime).HasColumnName("ThoiGianTaiLen");
        });

        modelBuilder.Entity<ServiceOrder>(entity =>
        {
            entity.ToTable("ChiDinhCanLamSang", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExaminationId).HasColumnName("LuotKhamId");
            entity.Property(e => e.DoctorId).HasColumnName("BacSiChiDinhId");
            entity.Property(e => e.ServiceCode).HasColumnName("MaDichVu").HasMaxLength(20);
            entity.Property(e => e.ServiceName).HasColumnName("TenDichVu").HasMaxLength(150);
            entity.Property(e => e.Status).HasColumnName("TrangThaiChiDinh").HasMaxLength(20);
            entity.Property(e => e.OrderTime).HasColumnName("ThoiGianChiDinh");
        });

        modelBuilder.Entity<ServiceResult>(entity =>
        {
            entity.ToTable("KetQuaCanLamSang", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ServiceOrderId).HasColumnName("ChiDinhId");
            entity.Property(e => e.TechnicianId).HasColumnName("KyThuatVienId");
            entity.Property(e => e.MetricName).HasColumnName("TenChiSo").HasMaxLength(100);
            entity.Property(e => e.MeasuredValue).HasColumnName("GiaTriDo").HasMaxLength(50);
            entity.Property(e => e.ReferenceRange).HasColumnName("KhoangThamChieu").HasMaxLength(50);
            entity.Property(e => e.IsAbnormal).HasColumnName("CoBatThuong");
            entity.Property(e => e.ImageConclusion).HasColumnName("KetLuanHinhAnh");
            entity.Property(e => e.ApprovalTime).HasColumnName("ThoiGianKyDuyet");
        });

        modelBuilder.Entity<MedicalGuideline>(entity =>
        {
            entity.ToTable("TaiLieuPhacDo", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasColumnName("TieuDe").HasMaxLength(255);
            entity.Property(e => e.Content).HasColumnName("NoiDungTho");
            entity.Property(e => e.Specialty).HasColumnName("ChuyenKhoa").HasMaxLength(50);
            entity.Property(e => e.UpdatedAt).HasColumnName("NgayCapNhat");
        });

        modelBuilder.Entity<AILog>(entity =>
        {
            entity.ToTable("NhatKyGoiYAI", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExaminationId).HasColumnName("LuotKhamId");
            entity.Property(e => e.AIType).HasColumnName("LoaiTroLyAI").HasMaxLength(30);
            entity.Property(e => e.InputData).HasColumnName("DuLieuDauVao");
            entity.Property(e => e.OutputResult).HasColumnName("KetQuaGoiYAI");
            entity.Property(e => e.DoctorFeedback).HasColumnName("PhanHoiBacSi").HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasColumnName("ThoiGianTao");
        });

        modelBuilder.Entity<Billing>(entity =>
        {
            entity.ToTable("HoaDon", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PatientId).HasColumnName("BenhNhanId");
            entity.Property(e => e.ExaminationId).HasColumnName("LuotKhamId");
            entity.Property(e => e.BillingType).HasColumnName("LoaiHoaDon").HasMaxLength(50);
            entity.Property(e => e.TotalAmount).HasColumnName("TongTien").HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasColumnName("TrangThai").HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasColumnName("NgayTao");
            entity.Property(e => e.PaidAt).HasColumnName("NgayThanhToan");
            entity.Property(e => e.PaymentMethod).HasColumnName("PhuongThucThanhToan").HasMaxLength(50);
            entity.Property(e => e.TransactionRef).HasColumnName("MaGiaoDich").HasMaxLength(100);
            entity.Property(e => e.CashierId).HasColumnName("NguoiThuTienId");

            entity.HasMany(e => e.Items)
                  .WithOne(e => e.Billing)
                  .HasForeignKey(e => e.BillingId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BillingItem>(entity =>
        {
            entity.ToTable("ChiTietHoaDon", "dbo");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.BillingId).HasColumnName("HoaDonId");
            entity.Property(e => e.ItemName).HasColumnName("TenDichVu").HasMaxLength(255);
            entity.Property(e => e.UnitPrice).HasColumnName("DonGia").HasColumnType("decimal(18,2)");
            entity.Property(e => e.Quantity).HasColumnName("SoLuong");
            entity.Property(e => e.TotalPrice).HasColumnName("ThanhTien").HasColumnType("decimal(18,2)");
            entity.Property(e => e.ReferenceId).HasColumnName("ThamChieuId");
        });

        foreach (var relationship in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetForeignKeys()))
        {
            relationship.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }
}
