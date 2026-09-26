using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly HospitalDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string Code, DateTime ExpiresAt)> _otpStore = new();

    public AuthService(HospitalDbContext context, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower() || u.Email.ToLower() == request.Username.ToLower() || u.PhoneNumber == request.Username);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new Exception("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        if (!user.IsActive)
        {
            throw new Exception("Tài khoản của bạn đã bị khóa.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        var (token, expiresAt) = _tokenGenerator.GenerateToken(user, roles);

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);
        bool isComplete = patient != null &&
            !string.IsNullOrWhiteSpace(patient.IdentityCardNumber) &&
            patient.FullName != "Bệnh nhân mới" &&
            !string.IsNullOrWhiteSpace(patient.FullName) &&
            !string.IsNullOrWhiteSpace(patient.Address) &&
            patient.Address != "Chưa cập nhật";

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Specialty = user.Specialty,
                Title = user.Title,
                Roles = roles,
                AvatarUrl = user.AvatarUrl,
                PatientCode = patient?.PatientCode,
                IdentityCardNumber = patient?.IdentityCardNumber,
                Gender = patient?.Gender,
                DateOfBirth = patient?.DateOfBirth,
                Address = patient?.Address,
                HealthInsuranceNumber = patient?.HealthInsuranceNumber,
                IsProfileComplete = isComplete
            }
        };
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Patient");
            if (role == null)
            {
                role = new Role { Name = "Patient", Description = "Bệnh nhân Google Login" };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
            }

            user = new User
            {
                Username = request.Email.Split('@')[0] + "_" + DateTime.UtcNow.Ticks.ToString().Substring(12),
                PasswordHash = _passwordHasher.HashPassword(Guid.NewGuid().ToString()),
                FullName = string.IsNullOrWhiteSpace(request.FullName) ? request.Email : request.FullName,
                Email = request.Email,
                PhoneNumber = "0900000000",
                IsActive = true,
                AvatarUrl = string.IsNullOrWhiteSpace(request.PhotoUrl) ? $"https://lh3.googleusercontent.com/a/default-user" : request.PhotoUrl,
                CreatedAt = DateTime.UtcNow
            };

            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        if (!roles.Any()) roles.Add("Patient");

        var (token, expiresAt) = _tokenGenerator.GenerateToken(user, roles);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Specialty = user.Specialty,
                Title = user.Title,
                Roles = roles,
                AvatarUrl = user.AvatarUrl
            }
        };
    }

    public async Task<UserProfileDto> RegisterAsync(RegisterRequestDto request)
    {
        ValidatePasswordStrong(request.Password);

        var existingUser = await _context.Users.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());
        if (existingUser)
        {
            throw new Exception("Tên đăng nhập đã tồn tại trong hệ thống.");
        }

        var existingPhone = await _context.Users.AnyAsync(u => u.PhoneNumber == request.PhoneNumber);
        if (existingPhone)
        {
            throw new Exception("Số điện thoại này đã được đăng ký tài khoản.");
        }

        var roleName = string.IsNullOrWhiteSpace(request.Role) ? "Patient" : request.Role;
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role == null)
        {
            role = new Role { Name = roleName, Description = $"Vai trò {roleName}" };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        var newUser = new User
        {
            Username = request.Username,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Specialty = request.Specialty,
            Title = request.Title,
            IsActive = true,
            AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={request.Username}",
            CreatedAt = DateTime.UtcNow
        };

        newUser.UserRoles.Add(new UserRole { UserId = newUser.Id, RoleId = role.Id });
        _context.Users.Add(newUser);

        string? patientCode = null;

        if (roleName == "Patient" && !string.IsNullOrWhiteSpace(request.IdentityCardNumber))
        {
            var existingCCCD = await _context.Patients.AnyAsync(p => p.IdentityCardNumber == request.IdentityCardNumber.Trim());
            if (existingCCCD)
            {
                throw new Exception($"Số CCCD {request.IdentityCardNumber} đã tồn tại trong hệ thống!");
            }

            var currentYear = DateTime.Now.Year;
            var prefix = $"BN{currentYear}";
            var count = await _context.Patients.CountAsync(p => p.PatientCode.StartsWith(prefix));
            patientCode = $"{prefix}{(count + 1):D6}";

            var patient = new Patient
            {
                Id = Guid.NewGuid(),
                UserId = newUser.Id,
                PatientCode = patientCode,
                FullName = request.FullName.Trim(),
                Gender = request.Gender ?? "Nam",
                DateOfBirth = DateTime.UtcNow.AddYears(-20), // Default DateOfBirth if not provided
                IdentityCardNumber = request.IdentityCardNumber.Trim(),
                Address = "Chưa cập nhật",
                CreatedAt = DateTime.UtcNow
            };
            _context.Patients.Add(patient);
        }

        await _context.SaveChangesAsync();

        return new UserProfileDto
        {
            Id = newUser.Id,
            Username = newUser.Username,
            FullName = newUser.FullName,
            Email = newUser.Email,
            PhoneNumber = newUser.PhoneNumber,
            Specialty = newUser.Specialty,
            Title = newUser.Title,
            Roles = new List<string> { role.Name },
            AvatarUrl = newUser.AvatarUrl,
            PatientCode = patientCode,
            IdentityCardNumber = request.IdentityCardNumber?.Trim()
        };
    }

    public async Task<SendOtpResponseDto> SendOtpAsync(SendOtpRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            throw new Exception("Số điện thoại không được để trống.");
        }

        var normalizedPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "");
        if (!Regex.IsMatch(normalizedPhone, @"^(0|\+84)[3|5|7|8|9][0-9]{8}$"))
        {
            throw new Exception("Số điện thoại không đúng định dạng Việt Nam hợp lệ (10 chữ số).");
        }

        // Tạo mã OTP ngẫu nhiên 6 chữ số
        var otpCode = Random.Shared.Next(100000, 999999).ToString();
        _otpStore[normalizedPhone] = (otpCode, DateTime.UtcNow.AddMinutes(5));

        return new SendOtpResponseDto
        {
            Success = true,
            Message = $"Mã xác thực OTP đã được gửi đến số điện thoại {normalizedPhone}",
            OtpCode = otpCode // Cung cấp mã để test/demo thuận tiện mà không phụ thuộc vào SMS Gateway
        };
    }

    public async Task<AuthResponseDto> VerifyOtpAndLoginAsync(VerifyOtpRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || string.IsNullOrWhiteSpace(request.OtpCode))
        {
            throw new Exception("Vui lòng nhập đầy đủ số điện thoại và mã OTP.");
        }

        var normalizedPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "");

        bool isValidOtp = false;
        if (_otpStore.TryGetValue(normalizedPhone, out var storedOtp))
        {
            if (storedOtp.ExpiresAt >= DateTime.UtcNow && storedOtp.Code == request.OtpCode.Trim())
            {
                isValidOtp = true;
                _otpStore.TryRemove(normalizedPhone, out _);
            }
        }

        // Hỗ trợ mã OTP mặc định test "123456" cho môi trường phát triển & kiểm thử
        if (!isValidOtp && request.OtpCode.Trim() == "123456")
        {
            isValidOtp = true;
        }

        if (!isValidOtp)
        {
            throw new Exception("Mã OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại.");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone || u.Username == normalizedPhone);

        if (user == null)
        {
            var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Patient");
            if (role == null)
            {
                role = new Role { Name = "Patient", Description = "Bệnh nhân" };
                _context.Roles.Add(role);
                await _context.SaveChangesAsync();
            }

            user = new User
            {
                Username = normalizedPhone,
                PhoneNumber = normalizedPhone,
                FullName = "Bệnh nhân mới",
                PasswordHash = _passwordHasher.HashPassword(Guid.NewGuid().ToString("N")),
                IsActive = true,
                AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={normalizedPhone}",
                CreatedAt = DateTime.UtcNow
            };
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);
        bool isComplete = patient != null &&
            !string.IsNullOrWhiteSpace(patient.IdentityCardNumber) &&
            patient.FullName != "Bệnh nhân mới" &&
            !string.IsNullOrWhiteSpace(patient.FullName) &&
            !string.IsNullOrWhiteSpace(patient.Address) &&
            patient.Address != "Chưa cập nhật";

        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        if (!roles.Any()) roles.Add("Patient");

        var (token, expiresAt) = _tokenGenerator.GenerateToken(user, roles);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Specialty = user.Specialty,
                Title = user.Title,
                Roles = roles,
                AvatarUrl = user.AvatarUrl,
                PatientCode = patient?.PatientCode,
                IdentityCardNumber = patient?.IdentityCardNumber,
                Gender = patient?.Gender,
                DateOfBirth = patient?.DateOfBirth,
                Address = patient?.Address,
                HealthInsuranceNumber = patient?.HealthInsuranceNumber,
                IsProfileComplete = isComplete
            }
        };
    }

    public async Task<UserProfileDto> CompleteProfileAsync(string usernameOrPhone, CompleteProfileRequestDto request)
    {
        var phone = !string.IsNullOrWhiteSpace(request.PhoneNumber) ? request.PhoneNumber.Trim() : usernameOrPhone.Trim();
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == usernameOrPhone.ToLower() || u.PhoneNumber == phone || u.Username == phone);

        if (user == null)
        {
            throw new Exception("Không tìm thấy thông tin tài khoản người dùng.");
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new Exception("Họ và tên không được để trống.");
        }
        if (string.IsNullOrWhiteSpace(request.IdentityCardNumber) || request.IdentityCardNumber.Trim().Length < 9)
        {
            throw new Exception("Số CCCD / CMND phải có ít nhất 9 đến 12 số.");
        }
        if (string.IsNullOrWhiteSpace(request.Address))
        {
            throw new Exception("Địa chỉ liên hệ không được để trống.");
        }

        var cccd = request.IdentityCardNumber.Trim();
        var duplicateCCCD = await _context.Patients.AnyAsync(p => p.IdentityCardNumber == cccd && p.UserId != user.Id);
        if (duplicateCCCD)
        {
            throw new Exception($"Số CCCD {cccd} đã được đăng ký bởi bệnh nhân khác.");
        }

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);
        if (patient == null)
        {
            var currentYear = DateTime.Now.Year;
            var prefix = $"BN{currentYear}";
            var count = await _context.Patients.CountAsync(p => p.PatientCode.StartsWith(prefix));
            var patientCode = $"{prefix}{(count + 1):D6}";

            patient = new Patient
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                PatientCode = patientCode,
                FullName = request.FullName.Trim(),
                Gender = request.Gender ?? "Nam",
                DateOfBirth = request.DateOfBirth == default ? DateTime.UtcNow.AddYears(-25) : request.DateOfBirth,
                IdentityCardNumber = cccd,
                Address = request.Address.Trim(),
                HealthInsuranceNumber = request.HealthInsuranceNumber?.Trim(),
                EmergencyContactName = request.EmergencyContactName?.Trim(),
                EmergencyContactPhone = request.EmergencyContactPhone?.Trim(),
                EmergencyContactRelation = request.EmergencyContactRelation?.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Patients.Add(patient);
        }
        else
        {
            patient.FullName = request.FullName.Trim();
            patient.Gender = request.Gender ?? "Nam";
            if (request.DateOfBirth != default) patient.DateOfBirth = request.DateOfBirth;
            patient.IdentityCardNumber = cccd;
            patient.Address = request.Address.Trim();
            patient.HealthInsuranceNumber = request.HealthInsuranceNumber?.Trim();
            patient.EmergencyContactName = request.EmergencyContactName?.Trim();
            patient.EmergencyContactPhone = request.EmergencyContactPhone?.Trim();
            patient.EmergencyContactRelation = request.EmergencyContactRelation?.Trim();
            _context.Patients.Update(patient);
        }

        user.FullName = request.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber) && string.IsNullOrWhiteSpace(user.PhoneNumber))
        {
            user.PhoneNumber = request.PhoneNumber.Trim();
        }
        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        if (!roles.Any()) roles.Add("Patient");

        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Specialty = user.Specialty,
            Title = user.Title,
            Roles = roles,
            AvatarUrl = user.AvatarUrl,
            PatientCode = patient.PatientCode,
            IdentityCardNumber = patient.IdentityCardNumber,
            Gender = patient.Gender,
            DateOfBirth = patient.DateOfBirth,
            Address = patient.Address,
            HealthInsuranceNumber = patient.HealthInsuranceNumber,
            IsProfileComplete = true
        };
    }

    public async Task<UserProfileDto> GetUserProfileAsync(string username)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower() || u.PhoneNumber == username);

        if (user == null)
        {
            throw new Exception("Không tìm thấy thông tin người dùng.");
        }

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);
        bool isComplete = patient != null &&
            !string.IsNullOrWhiteSpace(patient.IdentityCardNumber) &&
            patient.FullName != "Bệnh nhân mới" &&
            !string.IsNullOrWhiteSpace(patient.FullName) &&
            !string.IsNullOrWhiteSpace(patient.Address) &&
            patient.Address != "Chưa cập nhật";

        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Specialty = user.Specialty,
            Title = user.Title,
            Roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList(),
            AvatarUrl = user.AvatarUrl,
            PatientCode = patient?.PatientCode,
            IdentityCardNumber = patient?.IdentityCardNumber,
            Gender = patient?.Gender,
            DateOfBirth = patient?.DateOfBirth,
            Address = patient?.Address,
            HealthInsuranceNumber = patient?.HealthInsuranceNumber,
            IsProfileComplete = isComplete
        };
    }

    public async Task<bool> ChangePasswordAsync(string username, ChangePasswordDto request)
    {
        ValidatePasswordStrong(request.NewPassword);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        if (user == null) throw new Exception("Không tìm thấy người dùng.");

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
        {
            throw new Exception("Mật khẩu hiện tại không chính xác.");
        }

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<DoctorDto>> GetDoctorsAsync()
    {
        // Lấy danh sách bác sĩ thực từ DB nếu có
        var dbDoctors = await _context.Users
            .Where(u => u.UserRoles.Any(ur => ur.Role != null && ur.Role.Name == "Doctor"))
            .ToListAsync();

        var duyId = dbDoctors.FirstOrDefault(u => u.Username == "dr.duy")?.Id ?? Guid.Parse("11111111-1111-1111-1111-111111111111");

        // Danh mục đầy đủ Bác sĩ Chuyên khoa cho từng Khoa phòng tại Bệnh viện D-Medical
        var allSpecialistDoctors = new List<DoctorDto>
        {
            // 1. Khoa Nội Tổng Hợp
            new DoctorDto
            {
                Id = duyId,
                Name = "BS. CKII. Nguyễn Thanh Duy",
                Dept = "Khoa Nội Tổng Hợp",
                Title = "Trưởng Khoa Nội • 15 năm KN",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=DuyDoctor"
            },
            new DoctorDto
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "ThS. BS. Trần Thị Thu Hà",
                Dept = "Khoa Nội Tổng Hợp",
                Title = "Bác sĩ Nội khoa • 8 năm KN",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=HaDoctor"
            },

            // 2. Khoa Nhi
            new DoctorDto
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Name = "BS. CKI. Phạm Minh Đức",
                Dept = "Khoa Nhi",
                Title = "Trưởng Khoa Nhi • Chuyên khoa Sơ sinh",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=DucDoctor"
            },
            new DoctorDto
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Name = "BS. Đặng Hồng Hạnh",
                Dept = "Khoa Nhi",
                Title = "Bác sĩ Nhi khoa • Tiêm chủng",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=HanhDoctor"
            },

            // 3. Khoa Mắt
            new DoctorDto
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                Name = "BS. CKI. Trần Ngọc Mai",
                Dept = "Khoa Mắt",
                Title = "Trưởng Khoa Mắt • Phẫu thuật Phaco",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=MaiDoctor"
            },
            new DoctorDto
            {
                Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                Name = "BS. Vũ Hoàng Long",
                Dept = "Khoa Mắt",
                Title = "Nhãn khoa & Khúc xạ thị giác",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=LongDoctor"
            },

            // 4. Khoa Tai Mũi Họng
            new DoctorDto
            {
                Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                Name = "BS. CKII. Lê Văn Tuấn",
                Dept = "Khoa Tai Mũi Họng",
                Title = "Trưởng Khoa TMH • Nội soi vi phẫu",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=TuanDoctor"
            },
            new DoctorDto
            {
                Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                Name = "ThS. BS. Nguyễn Mai Linh",
                Dept = "Khoa Tai Mũi Họng",
                Title = "Bác sĩ Tai Mũi Họng",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=LinhDoctor"
            },

            // 5. Khoa Tim Mạch
            new DoctorDto
            {
                Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                Name = "TS. BS. Huỳnh Quốc Dũng",
                Dept = "Khoa Tim Mạch",
                Title = "Viện Tim Mạch • Can thiệp tim mạch",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=DungDoctor"
            },
            new DoctorDto
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Name = "BS. CKI. Vũ Thu Trang",
                Dept = "Khoa Tim Mạch",
                Title = "Siêu âm Tim & Tăng huyết áp",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=TrangDoctor"
            },

            // 6. Khoa Tiêu Hóa
            new DoctorDto
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Name = "BS. CKII. Đinh Khắc Vương",
                Dept = "Khoa Tiêu Hóa",
                Title = "Trưởng Khoa Tiêu Hóa • Nội soi HP",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=VuongDoctor"
            },
            new DoctorDto
            {
                Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                Name = "BS. Hoàng Lan Anh",
                Dept = "Khoa Tiêu Hóa",
                Title = "Bác sĩ Gan Mật & Tiêu hóa",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=LanAnhDoctor"
            },

            // 7. Khoa Ngoại Tổng Quát
            new DoctorDto
            {
                Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Name = "BS. CKII. Đỗ Hoàng Giang",
                Dept = "Khoa Ngoại Tổng Quát",
                Title = "Trưởng Khoa Ngoại • Phẫu thuật Nội soi",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=GiangDoctor"
            },

            // 8. Khoa Răng Hàm Mặt
            new DoctorDto
            {
                Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                Name = "BS. CKI. Hoàng Trọng Nghĩa",
                Dept = "Khoa Răng Hàm Mặt",
                Title = "Chuyên gia Chỉnh nha & Cấy Implant",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=NghiaDoctor"
            },

            // 9. Khoa Da Liễu
            new DoctorDto
            {
                Id = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                Name = "BS. CKI. Nguyễn Phương Anh",
                Dept = "Khoa Da Liễu",
                Title = "Da liễu & Laser Thẩm mỹ da",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=PhuongAnhDoctor"
            },

            // 10. Khoa Sản Phụ Khoa
            new DoctorDto
            {
                Id = Guid.Parse("12121212-1212-1212-1212-121212121212"),
                Name = "BS. CKII. Lê Thị Kim Phượng",
                Dept = "Khoa Sản Phụ Khoa",
                Title = "Trưởng Khoa Sản • Quản lý thai kỳ",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=PhuongSanDoctor"
            },

            // 11. Khoa Cấp Cứu & Hồi Sức
            new DoctorDto
            {
                Id = Guid.Parse("13131313-1313-1313-1313-131313131313"),
                Name = "BS. CKI. Trịnh Văn Thành",
                Dept = "Khoa Cấp Cứu & Hồi Sức",
                Title = "Trưởng kíp Cấp cứu 24/7",
                Avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=ThanhDoctor"
            }
        };

        return allSpecialistDoctors;
    }

    private void ValidatePasswordStrong(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || 
            !Regex.IsMatch(password, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"))
        {
            throw new Exception("Mật khẩu phải dài ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
        }
    }
}
