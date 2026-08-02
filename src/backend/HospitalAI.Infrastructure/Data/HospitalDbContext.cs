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

        // Configuration for User
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Username).IsUnique();
        });

        // Configuration for Role
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Configuration for UserRole (Many-To-Many)
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("UserRoles");
            entity.HasKey(e => new { e.UserId, e.RoleId });

            entity.HasOne(ur => ur.User)
                  .WithMany(u => u.UserRoles)
                  .HasForeignKey(ur => ur.UserId);

            entity.HasOne(ur => ur.Role)
                  .WithMany(r => r.UserRoles)
                  .HasForeignKey(ur => ur.RoleId);
        });

        // Configuration for Patient
        modelBuilder.Entity<Patient>(entity =>
        {
            entity.ToTable("Patients");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PatientCode).IsUnique();
            entity.HasIndex(e => e.IdentityCardNumber);
        });

        // Configuration for Examination
        modelBuilder.Entity<Examination>(entity =>
        {
            entity.ToTable("Examinations");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ExaminationCode).IsUnique();

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
            entity.ToTable("PrescriptionDetails");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
        });

        // Configuration for ServiceOrderDetail
        modelBuilder.Entity<ServiceOrderDetail>(entity =>
        {
            entity.ToTable("ServiceOrderDetails");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Price).HasPrecision(18, 2);
        });
    }
}
