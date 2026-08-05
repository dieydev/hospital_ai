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
    public DbSet<Examination> Examinations => Set<Examination>();
    public DbSet<PrescriptionDetail> PrescriptionDetails => Set<PrescriptionDetail>();
    public DbSet<ServiceOrderDetail> ServiceOrderDetails => Set<ServiceOrderDetail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
            entity.Property(e => e.CreatedAt).HasColumnName("NgayTao");

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
    }
}
