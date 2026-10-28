using Google.Apis.Auth;
using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
    private readonly IConfiguration _configuration;
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string Code, DateTime ExpiresAt, int FailedAttempts)> _otpStore = new();

    public AuthService(HospitalDbContext context, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator, IConfiguration configuration)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
        _configuration = configuration;
    }

    private static bool IsDevelopmentEnvironment()
    {
        var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
        return string.IsNullOrEmpty(env) || env.Equals("Development", StringComparison.OrdinalIgnoreCase);
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
        if (patient == null && roles.Contains("Patient"))
        {
            var newPatientCode = await GeneratePatientCodeAsync();
            var cccd = !string.IsNullOrWhiteSpace(user.PhoneNumber) ? user.PhoneNumber.Trim() : $"CD{newPatientCode.Substring(2):D9}";
            if (await _context.Patients.AnyAsync(p => p.IdentityCardNumber == cccd))
            {
                cccd = $"P{DateTime.UtcNow.Ticks % 1000000000000:D12}";
            }

            patient = new Patient
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                PatientCode = newPatientCode,
                FullName = !string.IsNullOrWhiteSpace(user.FullName) ? user.FullName : ("Bệnh nhân " + (user.PhoneNumber ?? "mới")),
                Gender = "Nam",
                DateOfBirth = DateTime.UtcNow.AddYears(-20),
                IdentityCardNumber = cccd,
                Address = "Chưa cập nhật",
                CreatedAt = DateTime.UtcNow
            };
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();
        }

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = await BuildUserProfileDtoAsync(user, roles, patient)
        };
    }

    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken) && string.IsNullOrWhiteSpace(request.Email))
        {
            throw new Exception("Thông tin xác thực Google không được để trống.");
        }

        string verifiedEmail = string.Empty;
        string verifiedName = request.FullName;
        string? verifiedPhoto = request.PhotoUrl;

        // 1. Thử xác thực nếu IdToken là Google JWT ID Token
        if (!string.IsNullOrWhiteSpace(request.IdToken))
        {
            try
            {
                var googleClientId = _configuration["Authentication:Google:ClientId"];
                GoogleJsonWebSignature.ValidationSettings? settings = null;
                if (!string.IsNullOrWhiteSpace(googleClientId) && googleClientId != "YOUR_GOOGLE_CLIENT_ID")
                {
                    settings = new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { googleClientId }
                    };
                }
                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);
                if (payload != null && !string.IsNullOrWhiteSpace(payload.Email))
                {
                    verifiedEmail = payload.Email.Trim().ToLower();
                    if (!string.IsNullOrWhiteSpace(payload.Name)) verifiedName = payload.Name;
                    if (!string.IsNullOrWhiteSpace(payload.Picture)) verifiedPhoto = payload.Picture;
                }
            }
            catch
            {
                // Nếu không phải định dạng JWT ID Token (thường là OAuth2 Access Token), chuyển sang kiểm tra qua Google Userinfo API
            }
        }

        // 2. Nếu chưa lấy được Email từ ID Token, thử kiểm tra IdToken như là OAuth2 Access Token
        if (string.IsNullOrWhiteSpace(verifiedEmail) && !string.IsNullOrWhiteSpace(request.IdToken))
        {
            try
            {
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", request.IdToken);
                var response = await httpClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    using var jsonDoc = System.Text.Json.JsonDocument.Parse(content);
                    var root = jsonDoc.RootElement;
                    if (root.TryGetProperty("email", out var emailProp))
                    {
                        verifiedEmail = emailProp.GetString()?.Trim().ToLower() ?? string.Empty;
                    }
                    if (root.TryGetProperty("name", out var nameProp))
                    {
                        var name = nameProp.GetString();
                        if (!string.IsNullOrWhiteSpace(name)) verifiedName = name;
                    }
                    if (root.TryGetProperty("picture", out var picProp))
                    {
                        var pic = picProp.GetString();
                        if (!string.IsNullOrWhiteSpace(pic)) verifiedPhoto = pic;
                    }
                }
            }
            catch
            {
                // Fallback nếu có gián đoạn kết nối tới Google Userinfo
            }
        }

        // Bắt buộc Email phải được xác thực từ Google ID Token hoặc Google Userinfo API (Chống giả mạo danh tính)
        if (string.IsNullOrWhiteSpace(verifiedEmail))
        {
            throw new Exception("Không thể xác thực thông tin tài khoản Google hoặc token không hợp lệ.");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == verifiedEmail);

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
                Username = verifiedEmail.Split('@')[0] + "_" + DateTime.UtcNow.Ticks.ToString().Substring(12),
                PasswordHash = _passwordHasher.HashPassword(Guid.NewGuid().ToString()),
                FullName = string.IsNullOrWhiteSpace(verifiedName) ? verifiedEmail : verifiedName,
                Email = verifiedEmail,
                PhoneNumber = "0900000000",
                IsActive = true,
                AvatarUrl = string.IsNullOrWhiteSpace(verifiedPhoto) ? $"https://lh3.googleusercontent.com/a/default-user" : verifiedPhoto,
                CreatedAt = DateTime.UtcNow
            };

            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        if (!user.IsActive)
        {
            throw new Exception("Tài khoản của bạn đã bị khóa.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        if (!roles.Any()) roles.Add("Patient");

        var (token, expiresAt) = _tokenGenerator.GenerateToken(user, roles);
        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = await BuildUserProfileDtoAsync(user, roles, patient)
        };
    }

    public async Task<UserProfileDto> RegisterAsync(RegisterRequestDto request)
    {
        ValidatePasswordStrong(request.Password);

        var normalizedPhone = string.IsNullOrWhiteSpace(request.PhoneNumber)
            ? request.Username.Trim().Replace(" ", "").Replace("-", "")
            : request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "");

        var existingUser = await _context.Users.AnyAsync(u =>
            u.PhoneNumber == normalizedPhone ||
            u.Username.ToLower() == request.Username.ToLower() ||
            u.Username.ToLower() == normalizedPhone.ToLower() ||
            (normalizedPhone.StartsWith("0") && u.PhoneNumber == "+84" + normalizedPhone.Substring(1)) ||
            (normalizedPhone.StartsWith("+84") && u.PhoneNumber == "0" + normalizedPhone.Substring(3)));

        if (existingUser)
        {
            throw new Exception($"Số điện thoại {normalizedPhone} đã tồn tại trong hệ thống. Vui lòng đăng nhập.");
        }

        // Xác thực mã OTP nếu có yêu cầu đăng ký qua OTP hoặc OTP được gửi lên
        if (!string.IsNullOrWhiteSpace(request.OtpCode))
        {
            if (!_otpStore.TryGetValue(normalizedPhone, out var storedOtp) || storedOtp.ExpiresAt < DateTime.UtcNow)
            {
                _otpStore.TryRemove(normalizedPhone, out _);
                throw new Exception("Mã OTP không chính xác hoặc đã hết hạn. Vui lòng xác thực lại.");
            }

            if (storedOtp.FailedAttempts >= 5)
            {
                _otpStore.TryRemove(normalizedPhone, out _);
                throw new Exception("Bạn đã nhập sai OTP quá 5 lần. Mã OTP đã bị hủy để đảm bảo an toàn. Vui lòng yêu cầu mã mới.");
            }

            if (storedOtp.Code != request.OtpCode.Trim())
            {
                var nextAttempts = storedOtp.FailedAttempts + 1;
                if (nextAttempts >= 5)
                {
                    _otpStore.TryRemove(normalizedPhone, out _);
                    throw new Exception("Bạn đã nhập sai OTP quá 5 lần. Mã OTP đã bị hủy để đảm bảo an toàn. Vui lòng yêu cầu mã mới.");
                }
                _otpStore[normalizedPhone] = (storedOtp.Code, storedOtp.ExpiresAt, nextAttempts);
                throw new Exception($"Mã OTP không chính xác. Bạn còn {5 - nextAttempts} lần thử.");
            }

            _otpStore.TryRemove(normalizedPhone, out _);
        }
        else if (_otpStore.ContainsKey(normalizedPhone))
        {
            // Số điện thoại đã kích hoạt gửi OTP nhưng không cung cấp OTP khi hoàn tất đăng ký
            throw new Exception("Vui lòng nhập mã OTP để xác thực số điện thoại đăng ký.");
        }

        // Đăng ký tài khoản công khai luôn cố định vai trò là 'Patient' (Bệnh nhân)
        // Quyền 'Admin', 'Doctor', 'Receptionist' phải do Bệnh viện tự cấp phát nội bộ
        var roleName = "Patient";
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role == null)
        {
            role = new Role { Name = roleName, Description = $"Vai trò {roleName} hệ thống" };
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
        string? savedCccd = null;

        if (roleName == "Patient")
        {
            patientCode = await GeneratePatientCodeAsync();

            var cccd = !string.IsNullOrWhiteSpace(request.IdentityCardNumber)
                ? request.IdentityCardNumber.Trim()
                : (!string.IsNullOrWhiteSpace(newUser.PhoneNumber) ? newUser.PhoneNumber.Trim() : $"CD{patientCode.Substring(2):D9}");

            if (!string.IsNullOrWhiteSpace(request.IdentityCardNumber))
            {
                var existingCCCD = await _context.Patients.AnyAsync(p => p.IdentityCardNumber == cccd);
                if (existingCCCD)
                {
                    throw new Exception($"Số CCCD {cccd} đã tồn tại trong hệ thống!");
                }
            }
            else
            {
                // Nếu cccd tạm bằng SĐT đã có trong bảng Patients (do sync trước đó), sinh mã unique
                var existingCCCD = await _context.Patients.AnyAsync(p => p.IdentityCardNumber == cccd);
                if (existingCCCD)
                {
                    cccd = $"P{DateTime.UtcNow.Ticks % 1000000000000:D12}";
                }
            }
            savedCccd = cccd;

            var fullName = !string.IsNullOrWhiteSpace(request.FullName) && request.FullName.Trim() != "Bệnh nhân mới"
                ? request.FullName.Trim()
                : (!string.IsNullOrWhiteSpace(newUser.PhoneNumber) ? $"Bệnh nhân {newUser.PhoneNumber}" : "Bệnh nhân mới");

            var patient = new Patient
            {
                Id = Guid.NewGuid(),
                UserId = newUser.Id,
                PatientCode = patientCode,
                FullName = fullName,
                Gender = request.Gender ?? "Nam",
                DateOfBirth = request.DateOfBirth ?? DateTime.UtcNow.AddYears(-20),
                IdentityCardNumber = cccd,
                Address = !string.IsNullOrWhiteSpace(request.Address) ? request.Address.Trim() : "Chưa cập nhật",
                CreatedAt = DateTime.UtcNow
            };
            _context.Patients.Add(patient);
            newUser.FullName = fullName;
        }

        await _context.SaveChangesAsync();

        var (token, _) = _tokenGenerator.GenerateToken(newUser, new List<string> { role.Name });

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
            IdentityCardNumber = request.IdentityCardNumber?.Trim() ?? savedCccd,
            Gender = request.Gender ?? "Nam",
            DateOfBirth = request.DateOfBirth ?? DateTime.UtcNow.AddYears(-20),
            Address = request.Address ?? "Chưa cập nhật",
            IsProfileComplete = !string.IsNullOrWhiteSpace(request.IdentityCardNumber) && !string.IsNullOrWhiteSpace(request.FullName),
            Token = token
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

        // Kiểm tra xem Số điện thoại đã được đăng ký tài khoản chưa
        var isExistingPhone = await CheckPhoneExistsAsync(normalizedPhone);
        if (isExistingPhone)
        {
            throw new Exception($"Số điện thoại {normalizedPhone} đã tồn tại trong hệ thống. Vui lòng đăng nhập.");
        }

        // Tạo mã OTP ngẫu nhiên 6 chữ số
        var otpCode = Random.Shared.Next(100000, 999999).ToString();
        _otpStore[normalizedPhone] = (otpCode, DateTime.UtcNow.AddMinutes(5), 0);

        return new SendOtpResponseDto
        {
            Success = true,
            Message = $"Mã xác thực OTP đã được gửi đến số điện thoại {normalizedPhone}",
            OtpCode = null
        };
    }

    public async Task<bool> CheckPhoneExistsAsync(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return false;

        var normalizedPhone = phoneNumber.Trim().Replace(" ", "").Replace("-", "");
        return await _context.Users.AnyAsync(u =>
            u.PhoneNumber == normalizedPhone ||
            u.Username.ToLower() == normalizedPhone.ToLower() ||
            (normalizedPhone.StartsWith("0") && u.PhoneNumber == "+84" + normalizedPhone.Substring(1)) ||
            (normalizedPhone.StartsWith("+84") && u.PhoneNumber == "0" + normalizedPhone.Substring(3)));
    }

    /// <summary>
    /// Gửi OTP để đặt lại mật khẩu - dành cho bệnh nhân đã đăng ký (quên mật khẩu).
    /// Ngược với SendOtpAsync: SĐT phải tồn tại mới được gửi OTP.
    /// </summary>
    public async Task<SendOtpResponseDto> ForgotPasswordOtpAsync(ForgotPasswordOtpRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
            throw new Exception("Số điện thoại không được để trống.");

        var normalizedPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "");
        if (!Regex.IsMatch(normalizedPhone, @"^(0|\+84)[3|5|7|8|9][0-9]{8}$"))
            throw new Exception("Số điện thoại không đúng định dạng Việt Nam hợp lệ (10 chữ số).");

        // Kiểm tra SĐT phải ĐÃ TỒN TẠI mới được khôi phục mật khẩu
        var user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone);
        if (user == null)
            throw new Exception($"Số điện thoại {normalizedPhone} chưa được đăng ký tài khoản nào.");

        // Tạo mã OTP đặt lại mật khẩu, lưu vào store dùng key riêng "forgot_"
        var otpCode = Random.Shared.Next(100000, 999999).ToString();
        var storeKey = $"forgot_{normalizedPhone}";
        _otpStore[storeKey] = (otpCode, DateTime.UtcNow.AddMinutes(5), 0);

        return new SendOtpResponseDto
        {
            Success = true,
            Message = $"Mã OTP đặt lại mật khẩu đã được gửi đến số {normalizedPhone}",
            OtpCode = null
        };
    }

    /// <summary>
    /// Xác thực OTP quên mật khẩu và đặt lại mật khẩu mới.
    /// </summary>
    public async Task<bool> ResetPasswordOtpAsync(ResetPasswordOtpRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) ||
            string.IsNullOrWhiteSpace(request.OtpCode) ||
            string.IsNullOrWhiteSpace(request.NewPassword))
            throw new Exception("Vui lòng nhập đầy đủ thông tin số điện thoại, mã OTP và mật khẩu mới.");

        var normalizedPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "");
        var storeKey = $"forgot_{normalizedPhone}";

        if (!_otpStore.TryGetValue(storeKey, out var storedOtp) || storedOtp.ExpiresAt < DateTime.UtcNow)
        {
            _otpStore.TryRemove(storeKey, out _);
            throw new Exception("Mã OTP không chính xác hoặc đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        // Chống Brute-Force: Giới hạn tối đa 5 lần thử sai
        if (storedOtp.FailedAttempts >= 5)
        {
            _otpStore.TryRemove(storeKey, out _);
            throw new Exception("Bạn đã nhập sai OTP quá 5 lần. Mã OTP đã bị hủy để đảm bảo an toàn. Vui lòng yêu cầu mã mới.");
        }

        if (storedOtp.Code != request.OtpCode.Trim())
        {
            var nextAttempts = storedOtp.FailedAttempts + 1;
            if (nextAttempts >= 5)
            {
                _otpStore.TryRemove(storeKey, out _);
                throw new Exception("Bạn đã nhập sai OTP quá 5 lần. Mã OTP đã bị hủy để đảm bảo an toàn. Vui lòng yêu cầu mã mới.");
            }
            _otpStore[storeKey] = (storedOtp.Code, storedOtp.ExpiresAt, nextAttempts);
            throw new Exception($"Mã OTP không chính xác. Bạn còn {5 - nextAttempts} lần thử.");
        }

        _otpStore.TryRemove(storeKey, out _);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == normalizedPhone);
        if (user == null)
            throw new Exception("Không tìm thấy tài khoản với số điện thoại này.");

        // Validate độ mạnh mật khẩu
        if (request.NewPassword.Length < 8)
            throw new Exception("Mật khẩu mới phải có ít nhất 8 ký tự.");
        if (!Regex.IsMatch(request.NewPassword, @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"))
            throw new Exception("Mật khẩu cần gồm chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&).");

        user.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        Console.WriteLine($"[RESET-PWD] SĐT: {normalizedPhone} đã đặt lại mật khẩu thành công.");
        return true;
    }

    public async Task<AuthResponseDto> VerifyOtpAndLoginAsync(VerifyOtpRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || string.IsNullOrWhiteSpace(request.OtpCode))
        {
            throw new Exception("Vui lòng nhập đầy đủ số điện thoại và mã OTP.");
        }

        var normalizedPhone = request.PhoneNumber.Trim().Replace(" ", "").Replace("-", "");

        if (!_otpStore.TryGetValue(normalizedPhone, out var storedOtp) || storedOtp.ExpiresAt < DateTime.UtcNow)
        {
            _otpStore.TryRemove(normalizedPhone, out _);
            throw new Exception("Mã OTP không chính xác hoặc đã hết hạn. Vui lòng thử lại.");
        }

        // Chống Brute-Force: Giới hạn tối đa 5 lần thử sai
        if (storedOtp.FailedAttempts >= 5)
        {
            _otpStore.TryRemove(normalizedPhone, out _);
            throw new Exception("Bạn đã nhập sai OTP quá 5 lần. Mã OTP đã bị hủy để đảm bảo an toàn. Vui lòng yêu cầu mã mới.");
        }

        if (storedOtp.Code != request.OtpCode.Trim())
        {
            var nextAttempts = storedOtp.FailedAttempts + 1;
            if (nextAttempts >= 5)
            {
                _otpStore.TryRemove(normalizedPhone, out _);
                throw new Exception("Bạn đã nhập sai OTP quá 5 lần. Mã OTP đã bị hủy để đảm bảo an toàn. Vui lòng yêu cầu mã mới.");
            }
            _otpStore[normalizedPhone] = (storedOtp.Code, storedOtp.ExpiresAt, nextAttempts);
            throw new Exception($"Mã OTP không chính xác. Bạn còn {5 - nextAttempts} lần thử.");
        }

        _otpStore.TryRemove(normalizedPhone, out _);

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

    public async Task<UserProfileDto> CompleteProfileAsync(string userIdOrUsernameOrPhone, CompleteProfileRequestDto request)
    {
        var phone = !string.IsNullOrWhiteSpace(request.PhoneNumber) ? request.PhoneNumber.Trim() : userIdOrUsernameOrPhone.Trim();

        User? user = null;
        if (Guid.TryParse(userIdOrUsernameOrPhone, out var userIdGuid))
        {
            user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userIdGuid);
        }

        if (user == null)
        {
            user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == userIdOrUsernameOrPhone.ToLower() || u.PhoneNumber == phone || u.Username == phone);
        }

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

        // 1. Tìm hồ sơ bệnh nhân theo CCCD trong CSDL (nếu đã có sẵn)
        var existingPatientWithCccd = await _context.Patients
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.IdentityCardNumber == cccd);

        // 2. Tìm hồ sơ bệnh nhân hiện đang gán cho tài khoản này
        Patient? patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);

        if (existingPatientWithCccd != null && (patient == null || existingPatientWithCccd.Id != patient.Id))
        {
            // CCCD này đã tồn tại trong CSDL. Kiểm tra quyền sở hữu hồ sơ:
            if (existingPatientWithCccd.UserId == null)
            {
                // Hồ sơ chưa liên kết tài khoản nào -> Gán trực tiếp cho tài khoản này
                if (patient != null && patient.Id != existingPatientWithCccd.Id)
                {
                    _context.Patients.Remove(patient);
                }
                patient = existingPatientWithCccd;
                patient.UserId = user.Id;
            }
            else if (existingPatientWithCccd.UserId != user.Id)
            {
                // Hồ sơ đang được gán cho một UserId khác. Kiểm tra xem tài khoản đó là ai:
                var previousOwner = await _context.Users
                    .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .FirstOrDefaultAsync(u => u.Id == existingPatientWithCccd.UserId);

                bool isStaffOrAdmin = previousOwner?.UserRoles.Any(ur => ur.Role != null && (ur.Role.Name == "Doctor" || ur.Role.Name == "Admin" || ur.Role.Name == "Receptionist")) ?? false;
                bool isSamePerson = previousOwner != null && (
                    (!string.IsNullOrEmpty(previousOwner.Email) && previousOwner.Email.ToLower() == user.Email?.ToLower()) ||
                    (!string.IsNullOrEmpty(previousOwner.PhoneNumber) && previousOwner.PhoneNumber == request.PhoneNumber?.Trim()) ||
                    previousOwner.PhoneNumber == "0900000000" ||
                    previousOwner.Username.StartsWith("pat-")
                );

                if (isStaffOrAdmin || isSamePerson)
                {
                    // Tài khoản trước là tài khoản cán bộ y tế (như dr.duy) hoặc tài khoản thử nghiệm của cùng một người
                    // -> Chuyển liên kết hồ sơ Bệnh nhân sang đúng tài khoản Bệnh nhân thực tế hiện tại
                    if (patient != null && patient.Id != existingPatientWithCccd.Id)
                    {
                        _context.Patients.Remove(patient);
                    }
                    patient = existingPatientWithCccd;
                    patient.UserId = user.Id;
                }
                else
                {
                    throw new Exception($"Số CCCD {cccd} đã được đăng ký bởi bệnh nhân khác trên hệ thống.");
                }
            }
        }

        if (patient == null)
        {
            var patientCode = await GeneratePatientCodeAsync();

            patient = new Patient
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                PatientCode = patientCode,
                FullName = request.FullName.Trim(),
                Gender = request.Gender ?? "Nam",
                DateOfBirth = (request.DateOfBirth == null || request.DateOfBirth == default) ? DateTime.UtcNow.AddYears(-25) : request.DateOfBirth.Value,
                IdentityCardNumber = cccd,
                Address = request.Address.Trim(),
                HealthInsuranceNumber = request.HealthInsuranceNumber?.Trim(),
                EmergencyContactName = request.EmergencyContactName?.Trim(),
                EmergencyContactPhone = request.EmergencyContactPhone?.Trim() ?? request.PhoneNumber?.Trim(),
                EmergencyContactRelation = request.EmergencyContactRelation?.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _context.Patients.Add(patient);
        }
        else
        {
            patient.UserId = user.Id;
            patient.FullName = request.FullName.Trim();
            patient.Gender = request.Gender ?? "Nam";
            if (request.DateOfBirth != null && request.DateOfBirth != default)
            {
                patient.DateOfBirth = request.DateOfBirth.Value;
            }
            patient.IdentityCardNumber = cccd;
            patient.Address = request.Address.Trim();
            patient.HealthInsuranceNumber = request.HealthInsuranceNumber?.Trim();
            patient.EmergencyContactName = request.EmergencyContactName?.Trim();
            patient.EmergencyContactPhone = request.EmergencyContactPhone?.Trim() ?? request.PhoneNumber?.Trim();
            patient.EmergencyContactRelation = request.EmergencyContactRelation?.Trim();
            _context.Patients.Update(patient);
        }

        user.FullName = request.FullName.Trim();
        if (!string.IsNullOrWhiteSpace(request.PhoneNumber) && request.PhoneNumber.Trim() != "0900000000")
        {
            user.PhoneNumber = request.PhoneNumber.Trim();
        }
        if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
        {
            user.AvatarUrl = request.AvatarUrl.Trim();
        }
        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        if (!roles.Any()) roles.Add("Patient");

        return await BuildUserProfileDtoAsync(user, roles, patient);
    }

    public async Task<UserProfileDto> GetUserProfileAsync(string username)
    {
        User? user = null;
        if (Guid.TryParse(username, out var parsedGuid))
        {
            user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == parsedGuid);
        }

        if (user == null)
        {
            var phone = username.Trim().Replace(" ", "").Replace("-", "");
            user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower() || u.PhoneNumber == phone || u.Username == phone);
        }

        if (user == null)
        {
            throw new Exception("Không tìm thấy thông tin người dùng.");
        }

        var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);
        var roles = user.UserRoles.Select(ur => ur.Role!.Name).ToList();
        if (!roles.Any()) roles.Add("Patient");

        return await BuildUserProfileDtoAsync(user, roles, patient);
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

    public async Task<bool> UpdateAvatarAsync(string userIdOrUsername, string avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl)) return false;

        User? user = null;
        if (Guid.TryParse(userIdOrUsername, out var parsedGuid))
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Id == parsedGuid);
        }

        if (user == null)
        {
            var phone = userIdOrUsername.Trim().Replace(" ", "").Replace("-", "");
            user = await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == userIdOrUsername.ToLower() || u.PhoneNumber == phone || u.Username == phone);
        }

        if (user == null) return false;

        user.AvatarUrl = avatarUrl.Trim();
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<DoctorDto>> GetDoctorsAsync()
    {
        // 1. Ưu tiên lấy danh sách Bác sĩ thực tế từ bảng Hồ sơ Nhân viên (HoSoNhanVien) kết nối Khoa Phòng trong CSDL SQL Server
        var staffProfiles = await _context.StaffProfiles
            .Include(s => s.Department)
            .Include(s => s.User)
            .Where(s => s.IsAvailable)
            .AsNoTracking()
            .ToListAsync();

        if (staffProfiles.Any())
        {
            return staffProfiles.Select(s => new DoctorDto
            {
                Id = s.UserId != Guid.Empty ? s.UserId : s.Id,
                Name = s.FullName,
                Dept = s.Department != null ? s.Department.DepartmentName : "Khoa Khám Bệnh",
                Title = s.Title,
                Avatar = $"https://api.dicebear.com/7.x/avataaars/svg?seed={s.FullName.Replace(" ", "")}"
            }).ToList();
        }

        // 2. Dự phòng: Lấy danh sách bác sĩ thực từ DB nếu có
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
        if (string.IsNullOrWhiteSpace(password) || password.Length < 6)
        {
            throw new Exception("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
        }
    }

    public async Task<List<UserAccountItemDto>> GetUsersAsync()
    {
        var users = await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var userIds = users.Select(u => u.Id).ToList();
        var staffList = await _context.StaffProfiles
            .Include(s => s.Department)
            .Where(s => userIds.Contains(s.UserId))
            .AsNoTracking()
            .ToListAsync();
        var staffMap = staffList.ToDictionary(s => s.UserId, s => s);

        var patientList = await _context.Patients
            .Where(p => p.UserId.HasValue && userIds.Contains(p.UserId.Value))
            .AsNoTracking()
            .ToListAsync();
        var patientMap = patientList.ToDictionary(p => p.UserId!.Value, p => p);

        var result = new List<UserAccountItemDto>();
        foreach (var u in users)
        {
            var roles = u.UserRoles.Select(ur => ur.Role?.Name ?? "").Where(r => !string.IsNullOrEmpty(r)).ToList();
            staffMap.TryGetValue(u.Id, out var staff);
            patientMap.TryGetValue(u.Id, out var patient);

            var fullName = staff?.FullName
                ?? (patient != null && !string.IsNullOrWhiteSpace(patient.FullName) ? patient.FullName : u.FullName);
            if (string.IsNullOrWhiteSpace(fullName)) fullName = u.Username;

            var dept = staff?.Department?.DepartmentName ?? u.Specialty;
            var title = staff?.Title ?? u.Title;

            result.Add(new UserAccountItemDto
            {
                Id = u.Id.ToString(),
                Username = u.Username,
                FullName = fullName,
                Email = u.Email ?? "",
                PhoneNumber = u.PhoneNumber ?? "",
                Roles = roles.Any() ? roles : new List<string> { "Patient" },
                Department = dept,
                Title = title,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                AvatarUrl = u.AvatarUrl ?? $"https://api.dicebear.com/7.x/avataaars/svg?seed={Uri.EscapeDataString(u.Username)}"
            });
        }
        return result;
    }

    public async Task<UserAccountItemDto> CreateUserAccountAsync(CreateAccountPayloadDto payload)
    {
        var username = payload.Username.Trim();
        if (await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
        {
            throw new Exception($"Tên đăng nhập '{username}' đã tồn tại trong hệ thống.");
        }

        var rawPassword = !string.IsNullOrWhiteSpace(payload.Password) ? payload.Password : "HospitalAI@2026";
        ValidatePasswordStrong(rawPassword);

        var roleName = string.IsNullOrWhiteSpace(payload.Role) ? "Doctor" : payload.Role;
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
        if (role == null)
        {
            role = new Role { Name = roleName, Description = $"Vai trò {roleName}" };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
        }

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            PasswordHash = _passwordHasher.HashPassword(rawPassword),
            FullName = payload.FullName.Trim(),
            Email = payload.Email.Trim(),
            PhoneNumber = payload.PhoneNumber.Trim(),
            Specialty = payload.Department,
            Title = payload.Title,
            IsActive = true,
            AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={Uri.EscapeDataString(username)}",
            CreatedAt = DateTime.UtcNow
        };

        newUser.UserRoles.Add(new UserRole { UserId = newUser.Id, RoleId = role.Id });
        _context.Users.Add(newUser);

        Department? dept = null;
        if (!string.IsNullOrWhiteSpace(payload.Department))
        {
            dept = await _context.Departments.FirstOrDefaultAsync(d => d.DepartmentName == payload.Department);
        }

        if (roleName == "Doctor" || roleName == "Nurse" || roleName == "Receptionist")
        {
            if (dept == null)
            {
                dept = await _context.Departments.FirstOrDefaultAsync();
            }

            if (dept != null)
            {
                var staffProfile = new StaffProfile
                {
                    Id = Guid.NewGuid(),
                    UserId = newUser.Id,
                    DepartmentId = dept.Id,
                    FullName = payload.FullName.Trim(),
                    Title = payload.Title ?? (roleName == "Doctor" ? "Bác sĩ Điều trị" : "Nhân viên"),
                    IsAvailable = true
                };
                _context.StaffProfiles.Add(staffProfile);
            }
        }

        await _context.SaveChangesAsync();

        return new UserAccountItemDto
        {
            Id = newUser.Id.ToString(),
            Username = newUser.Username,
            FullName = newUser.FullName,
            Email = newUser.Email,
            PhoneNumber = newUser.PhoneNumber,
            Roles = new List<string> { roleName },
            Department = dept?.DepartmentName ?? payload.Department,
            Title = payload.Title,
            IsActive = newUser.IsActive,
            CreatedAt = newUser.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            AvatarUrl = newUser.AvatarUrl
        };
    }

    public async Task<bool> ToggleUserStatusAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new Exception("Không tìm thấy tài khoản người dùng.");
        user.IsActive = !user.IsActive;
        await _context.SaveChangesAsync();
        return user.IsActive;
    }

    public async Task<bool> AdminResetPasswordAsync(Guid userId, string newPassword)
    {
        ValidatePasswordStrong(newPassword);
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new Exception("Không tìm thấy tài khoản người dùng.");
        user.PasswordHash = _passwordHasher.HashPassword(newPassword);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<UserProfileDto> BuildUserProfileDtoAsync(User user, List<string> roles, Patient? patient = null)
    {
        patient ??= await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);
        var staff = await _context.StaffProfiles.Include(s => s.Department).FirstOrDefaultAsync(s => s.UserId == user.Id);

        string resolvedFullName;
        string? resolvedSpecialty = staff?.Department?.DepartmentName ?? user.Specialty;
        string? resolvedTitle = staff?.Title ?? user.Title;

        if (staff != null && !string.IsNullOrWhiteSpace(staff.FullName))
        {
            resolvedFullName = staff.FullName;
        }
        else if (roles.Contains("Admin"))
        {
            resolvedFullName = "Quản trị viên Hệ thống";
            resolvedTitle ??= "Quản trị viên Cấp cao";
        }
        else if (roles.Contains("Receptionist"))
        {
            resolvedFullName = "Lễ tân Bệnh viện";
            resolvedTitle ??= "Nhân viên Lễ tân";
        }
        else if (roles.Contains("Doctor"))
        {
            resolvedFullName = "BS. CKII. Nguyễn Thanh Duy";
            resolvedTitle ??= "Bác sĩ Điều trị";
        }
        else if (patient != null && !string.IsNullOrWhiteSpace(patient.FullName) && patient.FullName != "Bệnh nhân mới" && !patient.FullName.StartsWith("Bệnh nhân 09"))
        {
            resolvedFullName = patient.FullName;
        }
        else if (!string.IsNullOrWhiteSpace(user.FullName) && user.FullName != "Bệnh nhân")
        {
            resolvedFullName = user.FullName;
        }
        else
        {
            resolvedFullName = "Bệnh nhân";
        }

        // Lọc bỏ mã CCCD tạm thời sinh tự động để không hiển thị số rác cho người dùng
        bool isDummyCccd = string.IsNullOrWhiteSpace(patient?.IdentityCardNumber) || 
                           patient.IdentityCardNumber.StartsWith("P") || 
                           patient.IdentityCardNumber.StartsWith("CD") || 
                           patient.IdentityCardNumber == user.PhoneNumber ||
                           patient.IdentityCardNumber == "0900000000";

        string? validCccd = isDummyCccd ? null : patient?.IdentityCardNumber;

        bool isDummyPhone = string.IsNullOrWhiteSpace(user.PhoneNumber) || user.PhoneNumber == "0900000000";
        string validPhone = !isDummyPhone ? user.PhoneNumber : (patient?.EmergencyContactPhone ?? string.Empty);

        bool isAddressValid = !string.IsNullOrWhiteSpace(patient?.Address) && patient.Address != "Chưa cập nhật";

        bool isComplete = roles.Any(r => r == "Admin" || r == "Doctor" || r == "Receptionist" || r == "Nurse") ||
            (patient != null &&
            !isDummyCccd &&
            !string.IsNullOrWhiteSpace(validCccd) &&
            !string.IsNullOrWhiteSpace(resolvedFullName) &&
            resolvedFullName != "Bệnh nhân" &&
            resolvedFullName != "Bệnh nhân mới" &&
            !resolvedFullName.StartsWith("Bệnh nhân 09") &&
            isAddressValid);

        return new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            FullName = resolvedFullName,
            Email = user.Email,
            PhoneNumber = validPhone,
            Specialty = resolvedSpecialty,
            Title = resolvedTitle,
            Roles = roles,
            AvatarUrl = !string.IsNullOrWhiteSpace(user.AvatarUrl) ? user.AvatarUrl : $"https://api.dicebear.com/7.x/avataaars/svg?seed={Uri.EscapeDataString(resolvedFullName)}",
            PatientCode = patient?.PatientCode,
            IdentityCardNumber = validCccd,
            Gender = patient?.Gender ?? "Nam",
            DateOfBirth = patient?.DateOfBirth,
            Address = isAddressValid ? patient?.Address : null,
            HealthInsuranceNumber = patient?.HealthInsuranceNumber,
            IsProfileComplete = isComplete
        };
    }

    private async Task<string> GeneratePatientCodeAsync()
    {
        var currentYear = DateTime.Now.Year;
        var prefix = $"BN{currentYear}";

        var maxCode = await _context.Patients
            .Where(p => p.PatientCode.StartsWith(prefix))
            .OrderByDescending(p => p.PatientCode)
            .Select(p => p.PatientCode)
            .FirstOrDefaultAsync();

        int nextNumber = 1;
        if (!string.IsNullOrEmpty(maxCode) && maxCode.Length >= prefix.Length + 6)
        {
            var suffix = maxCode.Substring(prefix.Length);
            if (int.TryParse(suffix, out int currentMax))
            {
                nextNumber = currentMax + 1;
            }
        }
        return $"{prefix}{nextNumber:D6}";
    }
}
