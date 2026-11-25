using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;

namespace HospitalAI.QueueService.Controllers
{
    public class OnlineAppointmentItem
    {
        public string Id { get; set; } = string.Empty;
        public string PatientCode { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string PatientPhone { get; set; } = string.Empty;
        public string? IdentityCardNumber { get; set; }
        public string PatientGender { get; set; } = string.Empty;
        public int PatientAge { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string? RoomNumber { get; set; } = "Phòng Khám Chuyên Khoa";
        public string AppointmentDate { get; set; } = string.Empty;
        public string AppointmentTime { get; set; } = string.Empty;
        public string SymptomsReason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string CreatedAt { get; set; } = string.Empty;
        public string SourceApp { get; set; } = "Flutter Patient App";
        
        // QR Code Check-in thay thế STT
        public string QrCode { get; set; } = string.Empty;
        public string CheckInStatus { get; set; } = "PendingQR"; // PendingQR, CheckedInQR
        public string? CheckedInAt { get; set; }
        public string? CancelReason { get; set; }
        public string? RescheduledAt { get; set; }

        // Phân loại Lịch khám: "New" (Khám mới) | "FollowUp" (Tái khám)
        public string AppointmentType { get; set; } = "New";
        public string? PreviousRecordCode { get; set; } // Mã bệnh án EMR / Mã phiếu khám trước
        public string? FollowUpNotes { get; set; } // Lời dặn hoặc chỉ định tái khám của Bác sĩ
    }

    public class TimeSlotQuotaItem
    {
        public string Id { get; set; } = string.Empty;
        public string TimeSlot { get; set; } = string.Empty;
        public string Period { get; set; } = "Morning"; // Morning / Afternoon
        public int MaxCapacity { get; set; } = 5;
        public int BookedCount { get; set; } = 0;
        public bool IsLocked { get; set; } = false;
        public bool IsFull => BookedCount >= MaxCapacity;
        public bool IsAvailable => !IsLocked && !IsFull;
        public string? Note { get; set; }
    }

    public class UpdateSlotDto
    {
        public int? MaxCapacity { get; set; }
        public bool? IsLocked { get; set; }
        public string? Note { get; set; }
    }

    public class CheckInQrDto
    {
        public string QrCodeOrId { get; set; } = string.Empty;
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class CancelAppointmentDto
    {
        public string? Reason { get; set; }
    }

    public class RescheduleAppointmentDto
    {
        public string NewDate { get; set; } = string.Empty;
        public string NewTime { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }

    [ApiController]
    [Route("api/appointments")]
    public class AppointmentsController : ControllerBase
    {
        private readonly IHubContext<QueueHub> _hubContext;
        private readonly HospitalDbContext _dbContext;
        private static readonly object _lock = new();
        private static readonly SemaphoreSlim _bookingLock = new(1, 1);
        private static readonly TimeZoneInfo _vietnamTimeZone = GetVietnamTimeZone();
        private static readonly string _dataDir = Environment.GetEnvironmentVariable("DATA_DIR") ?? AppContext.BaseDirectory;
        private static readonly string _filePath = Path.Combine(_dataDir, "appointments_data.json");
        private static readonly string _slotFilePath = Path.Combine(_dataDir, "time_slots_quota.json");
        
        private static List<OnlineAppointmentItem>? _cachedAppointments;
        private static List<TimeSlotQuotaItem>? _cachedSlots;

        private static TimeZoneInfo GetVietnamTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                }
                catch
                {
                    return TimeZoneInfo.CreateCustomTimeZone("Asia/Ho_Chi_Minh", TimeSpan.FromHours(7), "Giờ Việt Nam (UTC+7)", "Giờ Việt Nam (UTC+7)");
                }
            }
        }

        private static string BuildCompactQrCode(string id, string? patientCode, string? appointmentType, string? symptomsReason)
        {
            var isFollowUp = string.Equals(appointmentType, "FollowUp", StringComparison.OrdinalIgnoreCase)
                || (!string.IsNullOrWhiteSpace(symptomsReason) && symptomsReason.Contains("tái khám", StringComparison.OrdinalIgnoreCase));
            var cleanCode = string.IsNullOrWhiteSpace(patientCode) ? string.Empty : patientCode.Trim();
            return isFollowUp
                ? $"MEDQR|{id}|{cleanCode}|FOLLOWUP"
                : $"MEDQR|{id}|{cleanCode}";
        }

        internal static OnlineAppointmentItem? LookupCachedAppointment(string rawInput)
        {
            EnsureDataLoaded();
            var input = (rawInput ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(input)) return null;

            var parsed = KioskQrParser.Parse(input);
            lock (_lock)
            {
                return _cachedAppointments!.FirstOrDefault(a =>
                    a.Id.Equals(input, StringComparison.OrdinalIgnoreCase) ||
                    (!string.IsNullOrEmpty(a.QrCode) && a.QrCode.Equals(input, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(a.PatientCode) && a.PatientCode.Equals(input, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(a.PatientPhone) && a.PatientPhone.Equals(input, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(parsed.AppointmentId) && a.Id.Equals(parsed.AppointmentId, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(parsed.PreviousRecordCode) && !string.IsNullOrEmpty(a.PreviousRecordCode) && a.PreviousRecordCode.Equals(parsed.PreviousRecordCode, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(parsed.PatientCode) && a.PatientCode.Equals(parsed.PatientCode, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(parsed.LookupKey) && (
                        a.Id.Equals(parsed.LookupKey, StringComparison.OrdinalIgnoreCase) ||
                        a.PatientCode.Equals(parsed.LookupKey, StringComparison.OrdinalIgnoreCase) ||
                        a.PatientPhone.Equals(parsed.LookupKey, StringComparison.OrdinalIgnoreCase) ||
                        (!string.IsNullOrEmpty(a.IdentityCardNumber) && a.IdentityCardNumber.Equals(parsed.LookupKey, StringComparison.OrdinalIgnoreCase))
                    )));
            }
        }

        internal static void MarkCachedAppointmentCheckedIn(string appointmentId)
        {
            EnsureDataLoaded();
            lock (_lock)
            {
                var found = _cachedAppointments!.FirstOrDefault(a => a.Id.Equals(appointmentId, StringComparison.OrdinalIgnoreCase));
                if (found != null)
                {
                    found.Status = "CheckedIn";
                    found.CheckInStatus = "CheckedInQR";
                    found.CheckedInAt = DateTime.UtcNow.ToString("o");
                    SaveToFile();
                }
            }
        }

        public static DateTime GetVietnamNow()
        {
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, _vietnamTimeZone);
        }

        public AppointmentsController(IHubContext<QueueHub> hubContext, HospitalDbContext dbContext)
        {
            _hubContext = hubContext;
            _dbContext = dbContext;
            EnsureDataLoaded();
            EnsureSlotsLoaded();
        }

        private static void EnsureDataLoaded()
        {
            if (_cachedAppointments != null) return;
            lock (_lock)
            {
                if (_cachedAppointments != null) return;

                if (System.IO.File.Exists(_filePath))
                {
                    try
                    {
                        var json = System.IO.File.ReadAllText(_filePath);
                        _cachedAppointments = JsonSerializer.Deserialize<List<OnlineAppointmentItem>>(json) ?? new();
                    }
                    catch
                    {
                        _cachedAppointments = new();
                    }
                }

                if (_cachedAppointments == null || _cachedAppointments.Count == 0)
                {
                    _cachedAppointments = new List<OnlineAppointmentItem>
                    {
                        new OnlineAppointmentItem
                        {
                            Id = "apt-001",
                            PatientCode = "BN20260015",
                            PatientName = "Trần Văn Nam",
                            PatientPhone = "0987654321",
                            PatientGender = "Nam",
                            PatientAge = 29,
                            DepartmentName = "Khoa Nội Tổng Hợp",
                            DoctorName = "BS. CKII. Nguyễn Thanh Duy",
                            AppointmentDate = "2026-08-12",
                            AppointmentTime = "08:30",
                            SymptomsReason = "Đau đầu âm ỉ kéo dài 2 ngày, kèm sốt nhẹ về chiều",
                            Status = "Pending",
                            CreatedAt = DateTime.UtcNow.ToString("o"),
                            QrCode = "MEDQR|apt-001|BN20260015|2026-08-12|08:30",
                            CheckInStatus = "PendingQR"
                        },
                        new OnlineAppointmentItem
                        {
                            Id = "apt-002",
                            PatientCode = "BN20260016",
                            PatientName = "Nguyễn Thị Mai",
                            PatientPhone = "0912345678",
                            PatientGender = "Nữ",
                            PatientAge = 42,
                            DepartmentName = "Khoa Tiêu Hóa",
                            DoctorName = "BS. CKI. Lê Văn Tuấn",
                            AppointmentDate = "2026-08-12",
                            AppointmentTime = "09:15",
                            SymptomsReason = "Đau tức vùng thượng vị sau khi ăn no, có ợ chua",
                            Status = "Pending",
                            CreatedAt = DateTime.UtcNow.AddHours(-1).ToString("o"),
                            QrCode = "MEDQR|apt-002|BN20260016|2026-08-12|09:15",
                            CheckInStatus = "PendingQR",
                            AppointmentType = "New"
                        },
                        new OnlineAppointmentItem
                        {
                            Id = "apt-003",
                            PatientCode = "BN20260015",
                            PatientName = "Trần Văn Nam",
                            PatientPhone = "0987654321",
                            PatientGender = "Nam",
                            PatientAge = 29,
                            DepartmentName = "Khoa Nội Tổng Hợp",
                            DoctorName = "BS. CKII. Nguyễn Thanh Duy",
                            AppointmentDate = DateTime.UtcNow.AddDays(7).ToString("yyyy-MM-dd"),
                            AppointmentTime = "08:00 - 08:30",
                            SymptomsReason = "Tái khám sau 7 ngày điều trị viêm amidan theo lời dặn Bác sĩ",
                            Status = "Confirmed",
                            CreatedAt = DateTime.UtcNow.ToString("o"),
                            QrCode = "MEDQR|apt-003|BN20260015|FOLLOWUP",
                            CheckInStatus = "PendingQR",
                            AppointmentType = "FollowUp",
                            PreviousRecordCode = "EMR2026-0015",
                            FollowUpNotes = "Kiểm tra lại vùng amidan, nội soi họng và đánh giá đáp ứng kháng sinh"
                        }
                    };
                    SaveToFile();
                }
            }
        }

        private static void EnsureSlotsLoaded()
        {
            if (_cachedSlots != null) return;
            lock (_lock)
            {
                if (_cachedSlots != null) return;

                if (System.IO.File.Exists(_slotFilePath))
                {
                    try
                    {
                        var json = System.IO.File.ReadAllText(_slotFilePath);
                        _cachedSlots = JsonSerializer.Deserialize<List<TimeSlotQuotaItem>>(json) ?? new();
                    }
                    catch
                    {
                        _cachedSlots = new();
                    }
                }

                if (_cachedSlots == null || _cachedSlots.Count == 0)
                {
                    _cachedSlots = new List<TimeSlotQuotaItem>
                    {
                        new() { Id = "slot-01", TimeSlot = "07:30 - 08:00", Period = "Morning", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-02", TimeSlot = "08:00 - 08:30", Period = "Morning", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-03", TimeSlot = "08:30 - 09:00", Period = "Morning", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-04", TimeSlot = "09:00 - 09:30", Period = "Morning", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-05", TimeSlot = "09:30 - 10:00", Period = "Morning", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-06", TimeSlot = "10:00 - 10:30", Period = "Morning", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-07", TimeSlot = "13:30 - 14:00", Period = "Afternoon", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-08", TimeSlot = "14:00 - 14:30", Period = "Afternoon", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-09", TimeSlot = "14:30 - 15:00", Period = "Afternoon", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-10", TimeSlot = "15:00 - 15:30", Period = "Afternoon", MaxCapacity = 5, IsLocked = false },
                        new() { Id = "slot-11", TimeSlot = "15:30 - 16:00", Period = "Afternoon", MaxCapacity = 5, IsLocked = false }
                    };
                    SaveSlotsToFile();
                }
            }
        }

        private static void SaveToFile()
        {
            try
            {
                if (!Directory.Exists(_dataDir)) Directory.CreateDirectory(_dataDir);
                var json = JsonSerializer.Serialize(_cachedAppointments, new JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(_filePath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Appointments Error] Failed to persist appointments: {ex.Message}");
            }
        }

        private static void SaveSlotsToFile()
        {
            try
            {
                if (!Directory.Exists(_dataDir)) Directory.CreateDirectory(_dataDir);
                var json = JsonSerializer.Serialize(_cachedSlots, new JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(_slotFilePath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Slots Error] Failed to persist slots: {ex.Message}");
            }
        }

        private bool IsStaff()
        {
            if (User == null) return false;
            return User.IsInRole("Admin") || User.IsInRole("Doctor") || User.IsInRole("Receptionist") ||
                   User.IsInRole("Triage") || User.IsInRole("Pharmacy") || User.IsInRole("Nurse") || User.IsInRole("Cashier");
        }

        private sealed class CallerAppointmentScope
        {
            public Guid? UserId { get; init; }
            public HashSet<string> Identifiers { get; } = new(StringComparer.OrdinalIgnoreCase);
            public HashSet<Guid> PatientIds { get; } = new();
        }

        private static bool LooksLikePhone(string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return false;
            var trimmed = raw.Trim();
            if (trimmed.Contains('@')) return false;
            var stripped = trimmed.Replace("+", "").Replace(" ", "").Replace("-", "").Replace(".", "");
            return stripped.Length >= 9 && stripped.Length <= 15 && stripped.All(char.IsDigit);
        }

        private static void AddIdentifierWithVariants(HashSet<string> target, string? raw)
        {
            if (string.IsNullOrWhiteSpace(raw)) return;
            var trimmed = raw.Trim();
            target.Add(trimmed);
            target.Add(trimmed.ToLowerInvariant());
            target.Add(trimmed.ToUpperInvariant());

            if (LooksLikePhone(trimmed))
            {
                var digits = new string(trimmed.Where(char.IsDigit).ToArray());
                target.Add(digits);
                if (digits.StartsWith("84") && digits.Length >= 11)
                {
                    var local = "0" + digits.Substring(2);
                    target.Add(local);
                    target.Add("+" + digits);
                }
                else if (digits.StartsWith("0") && digits.Length >= 9)
                {
                    var intl = "84" + digits.Substring(1);
                    target.Add(intl);
                    target.Add("+" + intl);
                }
            }
        }

        private async Task<CallerAppointmentScope> ResolveCallerScopeAsync()
        {
            Guid? callerGuid = null;
            var userIdStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
            if (Guid.TryParse(userIdStr, out var parsedGuid) && parsedGuid != Guid.Empty)
            {
                callerGuid = parsedGuid;
            }

            var scope = new CallerAppointmentScope { UserId = callerGuid };
            AddIdentifierWithVariants(scope.Identifiers, User?.FindFirstValue(ClaimTypes.Name));
            AddIdentifierWithVariants(scope.Identifiers, User?.FindFirstValue(ClaimTypes.MobilePhone));

            try
            {
                if (callerGuid.HasValue)
                {
                    var callerUser = await _dbContext.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Id == callerGuid.Value);
                    if (callerUser != null)
                    {
                        AddIdentifierWithVariants(scope.Identifiers, callerUser.Username);
                        AddIdentifierWithVariants(scope.Identifiers, callerUser.PhoneNumber);
                    }
                }

                var tokenList = scope.Identifiers
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Distinct()
                    .ToList();

                var linkedPatients = await _dbContext.Patients
                    .AsNoTracking()
                    .Where(p =>
                        (callerGuid.HasValue && p.UserId == callerGuid.Value) ||
                        tokenList.Contains(p.PatientCode) ||
                        (p.EmergencyContactPhone != null && tokenList.Contains(p.EmergencyContactPhone)))
                    .ToListAsync();

                foreach (var p in linkedPatients)
                {
                    scope.PatientIds.Add(p.Id);
                    AddIdentifierWithVariants(scope.Identifiers, p.PatientCode);
                    AddIdentifierWithVariants(scope.Identifiers, p.EmergencyContactPhone);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Appointments Warning] ResolveCallerScope DB lookup fallback: {ex.Message}");
            }

            return scope;
        }

        private static bool CallerMatchesAppointment(CallerAppointmentScope scope, OnlineAppointmentItem item, Patient? dbPatient = null)
        {
            if (dbPatient != null)
            {
                if (scope.UserId.HasValue && dbPatient.UserId == scope.UserId.Value) return true;
                if (scope.PatientIds.Contains(dbPatient.Id)) return true;
                if (!string.IsNullOrWhiteSpace(dbPatient.PatientCode) && scope.Identifiers.Contains(dbPatient.PatientCode.Trim())) return true;
                if (!string.IsNullOrWhiteSpace(dbPatient.EmergencyContactPhone))
                {
                    var dbPhone = dbPatient.EmergencyContactPhone.Trim();
                    var dbDigits = new string(dbPhone.Where(char.IsDigit).ToArray());
                    if (scope.Identifiers.Contains(dbPhone) || (!string.IsNullOrEmpty(dbDigits) && scope.Identifiers.Contains(dbDigits)))
                    {
                        return true;
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(item.PatientCode) && scope.Identifiers.Contains(item.PatientCode.Trim()))
            {
                return true;
            }

            if (!string.IsNullOrWhiteSpace(item.PatientPhone))
            {
                var itemPhone = item.PatientPhone.Trim();
                var itemDigits = new string(itemPhone.Where(char.IsDigit).ToArray());
                if (scope.Identifiers.Contains(itemPhone) || (!string.IsNullOrEmpty(itemDigits) && scope.Identifiers.Contains(itemDigits)))
                {
                    return true;
                }
            }

            return false;
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAppointments()
        {
            EnsureDataLoaded();
            CallerAppointmentScope? callerScope = IsStaff() ? null : await ResolveCallerScopeAsync();
            try
            {
                // SQL Server là nguồn dữ liệu chính thống (Source of Truth)
                var query = _dbContext.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Schedule)
                    .ThenInclude(s => s!.Department)
                    .AsNoTracking();

                if (callerScope != null)
                {
                    var scopedTokens = callerScope.Identifiers.Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().ToList();
                    var scopedPatientIds = callerScope.PatientIds.ToList();
                    var callerUserId = callerScope.UserId;
                    query = query.Where(a => a.Patient != null && (
                        (callerUserId.HasValue && a.Patient.UserId == callerUserId.Value) ||
                        scopedPatientIds.Contains(a.Patient.Id) ||
                        scopedTokens.Contains(a.Patient.PatientCode) ||
                        (a.Patient.EmergencyContactPhone != null && scopedTokens.Contains(a.Patient.EmergencyContactPhone))
                    ));
                }

                var dbList = await query.OrderByDescending(a => a.AppointmentDate).ToListAsync();
                if (dbList.Count > 0)
                {
                    var items = dbList.Select(a =>
                    {
                        var idStr = a.Id.ToString();
                        lock (_lock)
                        {
                            var cached = _cachedAppointments?.FirstOrDefault(c => c.Id.Equals(idStr, StringComparison.OrdinalIgnoreCase) || c.Id == $"apt-{idStr}");
                            if (cached != null)
                            {
                                return cached;
                            }
                        }
                        return new OnlineAppointmentItem
                        {
                            Id = a.Id.ToString(),
                            PatientCode = a.Patient?.PatientCode ?? "",
                            PatientName = a.Patient?.FullName ?? "",
                            PatientPhone = a.Patient?.EmergencyContactPhone ?? "",
                            IdentityCardNumber = a.Patient?.IdentityCardNumber,
                            PatientGender = a.Patient?.Gender ?? "Nam",
                            PatientAge = a.Patient != null ? Math.Max(1, DateTime.UtcNow.Year - a.Patient.DateOfBirth.Year) : 30,
                            DepartmentName = a.Schedule?.Department?.DepartmentName ?? "Khoa Khám Bệnh",
                            DoctorName = "BS. CKII. Nguyễn Thanh Duy",
                            AppointmentDate = a.AppointmentDate.ToString("yyyy-MM-dd"),
                            AppointmentTime = a.AppointmentDate.ToString("HH:mm"),
                            SymptomsReason = a.Symptoms ?? "",
                            Status = a.Status,
                            CreatedAt = a.AppointmentDate.ToString("o"),
                            QrCode = BuildCompactQrCode(a.Id.ToString(), a.Patient?.PatientCode, null, a.Symptoms),
                            CheckInStatus = a.Status == "Completed" ? "CheckedInQR" : "PendingQR"
                        };
                    }).ToList();

                    return Ok(items);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB Query Warning] GetAppointments SQL fallback: {ex.Message}");
            }

            lock (_lock)
            {
                var sortedList = _cachedAppointments!.OrderByDescending(a => a.CreatedAt).AsEnumerable();
                if (callerScope != null)
                {
                    sortedList = sortedList.Where(a => CallerMatchesAppointment(callerScope, a));
                }
                return Ok(sortedList.ToList());
            }
        }

        /// <summary>
        /// Lấy danh sách lịch hẹn tái khám của bệnh nhân (Bảo vệ chống IDOR)
        /// </summary>
        [HttpGet("followups/{patientCodeOrPhone}")]
        [Authorize]
        public async Task<IActionResult> GetPatientFollowUps(string patientCodeOrPhone)
        {
            EnsureDataLoaded();
            if (string.IsNullOrWhiteSpace(patientCodeOrPhone))
            {
                return Ok(new List<OnlineAppointmentItem>());
            }

            var query = patientCodeOrPhone.Trim().ToLower();
            if (!IsStaff())
            {
                var currentPhone = (User.FindFirstValue(ClaimTypes.Name) ?? "").ToLower();
                if (!query.Contains(currentPhone) && !currentPhone.Contains(query))
                {
                    return Forbid();
                }
            }

            try
            {
                var dbAppointments = await _dbContext.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Schedule)
                    .ThenInclude(s => s!.Department)
                    .AsNoTracking()
                    .Where(a => a.Patient != null && (a.Patient.PatientCode.ToLower().Contains(query) || (a.Patient.EmergencyContactPhone != null && a.Patient.EmergencyContactPhone.Contains(query))))
                    .Where(a => a.Symptoms != null && a.Symptoms.Contains("tái khám"))
                    .OrderByDescending(a => a.AppointmentDate)
                    .ToListAsync();

                if (dbAppointments.Count > 0)
                {
                    var followUps = dbAppointments.Select(a => new OnlineAppointmentItem
                    {
                        Id = a.Id.ToString(),
                        PatientCode = a.Patient?.PatientCode ?? "",
                        PatientName = a.Patient?.FullName ?? "",
                        PatientPhone = a.Patient?.EmergencyContactPhone ?? "",
                        IdentityCardNumber = a.Patient?.IdentityCardNumber,
                        PatientGender = a.Patient?.Gender ?? "Nam",
                        PatientAge = a.Patient != null ? Math.Max(1, DateTime.UtcNow.Year - a.Patient.DateOfBirth.Year) : 30,
                        DepartmentName = a.Schedule?.Department?.DepartmentName ?? "Khoa Khám Bệnh",
                        DoctorName = "BS. CKII. Nguyễn Thanh Duy",
                        AppointmentDate = a.AppointmentDate.ToString("yyyy-MM-dd"),
                        AppointmentTime = a.AppointmentDate.ToString("HH:mm"),
                        SymptomsReason = a.Symptoms ?? "",
                        Status = a.Status,
                        CreatedAt = a.AppointmentDate.ToString("o"),
                        QrCode = $"MEDQR|{a.Id}|{a.Patient?.PatientCode}|FOLLOWUP",
                        CheckInStatus = a.Status == "Completed" ? "CheckedInQR" : "PendingQR",
                        AppointmentType = "FollowUp"
                    }).ToList();

                    return Ok(followUps);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB Query Warning] GetPatientFollowUps SQL fallback: {ex.Message}");
            }

            lock (_lock)
            {
                var list = _cachedAppointments!
                    .Where(a => (a.PatientCode.ToLower().Contains(query) || a.PatientPhone.Contains(query)) &&
                                (a.AppointmentType == "FollowUp" || a.SymptomsReason.ToLower().Contains("tái khám")))
                    .OrderByDescending(a => a.AppointmentDate)
                    .ToList();
                return Ok(list);
            }
        }

        /// <summary>
        /// Lấy danh sách khung giờ và số lượng đặt khám theo ngày
        /// </summary>
        [HttpGet("slots")]
        public IActionResult GetTimeSlots([FromQuery] string? date, [FromQuery] string? departmentName)
        {
            EnsureDataLoaded();
            EnsureSlotsLoaded();

            var targetDate = string.IsNullOrWhiteSpace(date)
                ? DateTime.UtcNow.ToString("yyyy-MM-dd")
                : date.Trim();

            lock (_lock)
            {
                var result = _cachedSlots!.Select(s =>
                {
                    // Đếm số lượng bệnh nhân đã đặt trong khung giờ này vào ngày chỉ định
                    var slotStartTime = s.TimeSlot.Split('-')[0].Trim();
                    var count = _cachedAppointments!
                        .Where(a => a.AppointmentDate == targetDate &&
                                    a.Status != "Cancelled" &&
                                    (a.AppointmentTime == slotStartTime || a.AppointmentTime == s.TimeSlot || a.AppointmentTime.StartsWith(slotStartTime)))
                        .Count();

                    return new TimeSlotQuotaItem
                    {
                        Id = s.Id,
                        TimeSlot = s.TimeSlot,
                        Period = s.Period,
                        MaxCapacity = s.MaxCapacity,
                        BookedCount = count,
                        IsLocked = s.IsLocked,
                        Note = s.Note
                    };
                }).ToList();

                return Ok(result);
            }
        }

        /// <summary>
        /// Admin cấu hình số lượng tối đa / ghi chú cho khung giờ (Chỉ dành cho Admin, Tiếp tân, Sàng lọc)
        /// </summary>
        [HttpPut("slots/{id}")]
        [Authorize(Roles = "Admin,Receptionist,Triage")]
        public async Task<IActionResult> UpdateSlot(string id, [FromBody] UpdateSlotDto dto)
        {
            EnsureSlotsLoaded();
            TimeSlotQuotaItem? slot;
            lock (_lock)
            {
                slot = _cachedSlots!.FirstOrDefault(s => s.Id == id);
                if (slot == null)
                {
                    return NotFound(new { message = "Không tìm thấy khung giờ này." });
                }

                if (dto.MaxCapacity.HasValue && dto.MaxCapacity.Value > 0)
                {
                    slot.MaxCapacity = dto.MaxCapacity.Value;
                }
                if (dto.IsLocked.HasValue)
                {
                    slot.IsLocked = dto.IsLocked.Value;
                }
                if (dto.Note != null)
                {
                    slot.Note = dto.Note;
                }
                SaveSlotsToFile();
            }

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveTimeSlotUpdated", slot);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SignalR Warning] ReceiveTimeSlotUpdated failed: {ex.Message}");
            }

            return Ok(slot);
        }

        /// <summary>
        /// Admin Khóa / Mở khóa nhanh khung giờ (Chỉ dành cho Admin, Tiếp tân, Sàng lọc)
        /// </summary>
        [HttpPut("slots/{id}/toggle-lock")]
        [Authorize(Roles = "Admin,Receptionist,Triage")]
        public async Task<IActionResult> ToggleSlotLock(string id)
        {
            EnsureSlotsLoaded();
            TimeSlotQuotaItem? slot;
            lock (_lock)
            {
                slot = _cachedSlots!.FirstOrDefault(s => s.Id == id);
                if (slot == null)
                {
                    return NotFound(new { message = "Không tìm thấy khung giờ này." });
                }

                slot.IsLocked = !slot.IsLocked;
                SaveSlotsToFile();
            }

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveTimeSlotUpdated", slot);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SignalR Warning] ToggleSlotLock broadcast failed: {ex.Message}");
            }

            return Ok(slot);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateAppointment([FromBody] OnlineAppointmentItem model)
        {
            if (string.IsNullOrWhiteSpace(model.PatientName) || string.IsNullOrWhiteSpace(model.PatientPhone) ||
                string.IsNullOrWhiteSpace(model.AppointmentDate) || string.IsNullOrWhiteSpace(model.AppointmentTime))
            {
                return BadRequest(new { message = "Vui lòng điền đầy đủ họ tên, số điện thoại, ngày khám và khung giờ khám." });
            }

            User? callerUser = null;
            if (!IsStaff())
            {
                var callerUserIdStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
                if (Guid.TryParse(callerUserIdStr, out var callerGuid) && callerGuid != Guid.Empty)
                {
                    try
                    {
                        callerUser = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == callerGuid);
                    }
                    catch { }
                }

                // IDOR Protection: Chỉ khóa PatientPhone theo SĐT xác thực của tài khoản (tránh ghi đè bằng username/email không phải SĐT)
                var verifiedPhone = !string.IsNullOrWhiteSpace(callerUser?.PhoneNumber)
                    ? callerUser.PhoneNumber.Trim()
                    : (!string.IsNullOrWhiteSpace(User?.FindFirstValue(ClaimTypes.MobilePhone))
                        ? User!.FindFirstValue(ClaimTypes.MobilePhone)!.Trim()
                        : (LooksLikePhone(User?.FindFirstValue(ClaimTypes.Name))
                            ? User!.FindFirstValue(ClaimTypes.Name)!.Trim()
                            : null));

                if (!string.IsNullOrWhiteSpace(verifiedPhone))
                {
                    model.PatientPhone = verifiedPhone;
                }
            }

            EnsureDataLoaded();
            EnsureSlotsLoaded();

            var aptGuid = Guid.NewGuid();
            model.Id = aptGuid.ToString();
            model.Status = "Pending";

            if (string.IsNullOrEmpty(model.CreatedAt))
            {
                model.CreatedAt = DateTime.UtcNow.ToString("o");
            }
            if (string.IsNullOrEmpty(model.SourceApp))
            {
                model.SourceApp = "Flutter Patient App";
            }
            if (string.IsNullOrEmpty(model.AppointmentType))
            {
                model.AppointmentType = "New";
            }

            var slotStartTime = model.AppointmentTime.Split('-')[0].Trim();

            // 1. Lưu trữ và kiểm tra nguồn dữ liệu chính thống SQL Server
            Patient? patient = null;
            Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? slotTx = null;
            try
            {
                // Ưu tiên 1: Tra cứu theo Số CCCD/Căn cước - Định danh công dân duy nhất theo Luật Căn cước
                if (!string.IsNullOrWhiteSpace(model.IdentityCardNumber))
                {
                    var cleanCccd = model.IdentityCardNumber.Trim();
                    patient = await _dbContext.Patients
                        .Include(p => p.User)
                        .FirstOrDefaultAsync(p => p.IdentityCardNumber == cleanCccd);
                }

                // Ưu tiên 2: Tra cứu theo Mã bệnh nhân (PatientCode)
                if (patient == null && !string.IsNullOrWhiteSpace(model.PatientCode))
                {
                    var cleanCode = model.PatientCode.Trim();
                    patient = await _dbContext.Patients
                        .Include(p => p.User)
                        .FirstOrDefaultAsync(p => p.PatientCode == cleanCode);
                }

                // Ưu tiên 3: Tra cứu theo tài khoản đã đăng nhập có số điện thoại chính chủ
                if (patient == null && !string.IsNullOrWhiteSpace(model.PatientPhone))
                {
                    var cleanPhone = model.PatientPhone.Trim();
                    patient = await _dbContext.Patients
                        .Include(p => p.User)
                        .FirstOrDefaultAsync(p => p.User != null && p.User.PhoneNumber == cleanPhone);
                }

                // Ưu tiên 4: Tra cứu theo UserId của tài khoản đang đăng nhập (trừ khi nhập CCCD/Mã BN riêng cho người thân)
                if (patient == null && !IsStaff() && callerUser != null &&
                    string.IsNullOrWhiteSpace(model.IdentityCardNumber) &&
                    string.IsNullOrWhiteSpace(model.PatientCode))
                {
                    patient = await _dbContext.Patients
                        .Include(p => p.User)
                        .FirstOrDefaultAsync(p => p.UserId == callerUser.Id);
                }

                // Bệnh nhân chưa có hồ sơ: Tự động khởi tạo hồ sơ chuẩn Bộ Y tế trong SQL Server
                if (patient == null)
                {
                    var newCode = $"BN{DateTime.UtcNow.Year}{Random.Shared.Next(100000, 999999)}";
                    var cccd = !string.IsNullOrWhiteSpace(model.IdentityCardNumber)
                        ? model.IdentityCardNumber.Trim()
                        : $"CD{Random.Shared.Next(100000000, 999999999)}";

                    // Chống trùng CCCD nếu đã tồn tại
                    if (await _dbContext.Patients.AnyAsync(p => p.IdentityCardNumber == cccd))
                    {
                        cccd = $"P{DateTime.UtcNow.Ticks % 1000000000000:D12}";
                    }

                    patient = new Patient
                    {
                        Id = Guid.NewGuid(),
                        PatientCode = !string.IsNullOrWhiteSpace(model.PatientCode) ? model.PatientCode : newCode,
                        FullName = model.PatientName,
                        Gender = !string.IsNullOrWhiteSpace(model.PatientGender) ? model.PatientGender : "Nam",
                        DateOfBirth = DateTime.UtcNow.AddYears(-25),
                        IdentityCardNumber = cccd,
                        Address = "Đặt khám trực tuyến qua App/Web",
                        EmergencyContactPhone = model.PatientPhone,
                        UserId = !IsStaff() ? callerUser?.Id : null,
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.Patients.Add(patient);
                    await _dbContext.SaveChangesAsync();
                }

                model.PatientCode = patient.PatientCode;

                DateTime appointmentDate;
                if (!DateTime.TryParse($"{model.AppointmentDate} {slotStartTime}", out appointmentDate))
                {
                    appointmentDate = DateTime.UtcNow;
                }
                var targetDay = appointmentDate.Date;

                var schedule = await _dbContext.DoctorSchedules
                    .FirstOrDefaultAsync(s => s.TimeSlot == model.AppointmentTime && s.WorkDate.Date == targetDay)
                    ?? await _dbContext.DoctorSchedules
                        .OrderByDescending(s => s.WorkDate)
                        .FirstOrDefaultAsync(s => s.TimeSlot == model.AppointmentTime)
                    ?? await _dbContext.DoctorSchedules.FirstOrDefaultAsync();
                if (schedule == null)
                {
                    var dept = await _dbContext.Departments.FirstOrDefaultAsync();
                    if (dept == null)
                    {
                        dept = new Department
                        {
                            Id = Guid.NewGuid(),
                            DepartmentName = model.DepartmentName ?? "Khoa Khám Bệnh",
                            Location = "Khu A - Tầng 1",
                            RoomType = "KhamLamSang"
                        };
                        _dbContext.Departments.Add(dept);
                        await _dbContext.SaveChangesAsync();
                    }

                    var staff = await _dbContext.StaffProfiles.FirstOrDefaultAsync();
                    schedule = new DoctorSchedule
                    {
                        Id = Guid.NewGuid(),
                        StaffId = staff?.Id ?? Guid.NewGuid(),
                        DepartmentId = dept.Id,
                        WorkDate = DateTime.UtcNow.Date,
                        TimeSlot = model.AppointmentTime,
                        MaxPatients = 20
                    };
                    _dbContext.DoctorSchedules.Add(schedule);
                    await _dbContext.SaveChangesAsync();
                }

                // Bắt đầu khóa đồng bộ 2 lớp (SemaphoreSlim + Serializable Transaction + Distributed App Lock) chống Overbooking
                await _bookingLock.WaitAsync();
                try
                {
                    if (_dbContext.Database.IsRelational())
                    {
                        slotTx = await _dbContext.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);
                        // Khóa ứng dụng phân tán cấp SQL Server (Distributed Application Lock)
                        // Đồng bộ hạn ngạch (Quota) trên toàn bộ các container / instance backend độc lập
                        try
                        {
                            var lockResource = $"QuotaLock_{schedule.Id}_{appointmentDate:yyyyMMdd}_{slotStartTime}";
                            var connection = _dbContext.Database.GetDbConnection();
                            if (connection.State != System.Data.ConnectionState.Open)
                            {
                                await connection.OpenAsync();
                            }

                            using var cmd = connection.CreateCommand();
                            cmd.Transaction = _dbContext.Database.CurrentTransaction?.GetDbTransaction();
                            cmd.CommandText = "sp_getapplock";
                            cmd.CommandType = System.Data.CommandType.StoredProcedure;
                            cmd.CommandTimeout = 15;

                            var pResource = cmd.CreateParameter();
                            pResource.ParameterName = "@Resource";
                            pResource.Value = lockResource;
                            pResource.DbType = System.Data.DbType.String;
                            cmd.Parameters.Add(pResource);

                            var pMode = cmd.CreateParameter();
                            pMode.ParameterName = "@LockMode";
                            pMode.Value = "Exclusive";
                            pMode.DbType = System.Data.DbType.String;
                            cmd.Parameters.Add(pMode);

                            var pOwner = cmd.CreateParameter();
                            pOwner.ParameterName = "@LockOwner";
                            pOwner.Value = "Transaction";
                            pOwner.DbType = System.Data.DbType.String;
                            cmd.Parameters.Add(pOwner);

                            var pTimeout = cmd.CreateParameter();
                            pTimeout.ParameterName = "@LockTimeout";
                            pTimeout.Value = 10000;
                            pTimeout.DbType = System.Data.DbType.Int32;
                            cmd.Parameters.Add(pTimeout);

                            var pReturn = cmd.CreateParameter();
                            pReturn.ParameterName = "@ReturnValue";
                            pReturn.Direction = System.Data.ParameterDirection.ReturnValue;
                            cmd.Parameters.Add(pReturn);

                            await cmd.ExecuteNonQueryAsync();
                            int retCode = Convert.ToInt32(pReturn.Value);

                            if (retCode < 0)
                            {
                                if (slotTx != null) await slotTx.RollbackAsync();
                                return StatusCode(409, new { message = $"Không thể xác lập khóa Quota phân tán tại SQL Server (Mã lỗi: {retCode}). Khung giờ đang bận hoặc có xung đột, vui lòng thử lại!" });
                            }
                        }
                        catch (Microsoft.Data.SqlClient.SqlException sqlEx) when (sqlEx.Number == 1205)
                        {
                            if (slotTx != null) await slotTx.RollbackAsync();
                            return StatusCode(409, new { message = "Giao dịch bị xung đột khóa (Deadlock victim) tại SQL Server. Vui lòng thử lại!" });
                        }
                        catch (Exception appLockEx)
                        {
                            if (slotTx != null) await slotTx.RollbackAsync();
                            Console.WriteLine($"[Appointments Error] sp_getapplock failed: {appLockEx.Message}");
                            return StatusCode(500, new { message = $"Lỗi khi thiết lập khóa đồng bộ hạn ngạch (Quota Lock) tại cơ sở dữ liệu: {appLockEx.Message}" });
                        }
                    }

                    // Idempotency: Kiểm tra nếu bệnh nhân đã đặt lịch cùng ngày và giờ trước đó
                    var existingDbDuplicate = await _dbContext.Appointments.FirstOrDefaultAsync(a =>
                        a.PatientId == patient.Id &&
                        a.AppointmentDate.Date == appointmentDate.Date &&
                        a.Status != "Cancelled");

                    if (existingDbDuplicate != null)
                    {
                        if (slotTx != null) await slotTx.CommitAsync();
                        model.Id = existingDbDuplicate.Id.ToString();
                        return Ok(model);
                    }

                    // Kiểm tra định mức Quota trong SQL Server với khóa cô lập giao dịch
                    var currentBookedCount = await _dbContext.Appointments.CountAsync(a =>
                        a.ScheduleId == schedule.Id &&
                        a.AppointmentDate.Date == appointmentDate.Date &&
                        a.Status != "Cancelled");

                    if (currentBookedCount >= schedule.MaxPatients)
                    {
                        if (slotTx != null) await slotTx.RollbackAsync();
                        return BadRequest(new { message = $"Khung giờ {model.AppointmentTime} vào ngày {model.AppointmentDate} đã đủ số lượng khám ({currentBookedCount}/{schedule.MaxPatients}). Quý khách vui lòng chọn khung giờ khác!" });
                    }

                    var appointmentEntity = new Appointment
                    {
                        Id = aptGuid,
                        PatientId = patient.Id,
                        ScheduleId = schedule.Id,
                        AppointmentDate = appointmentDate,
                        Symptoms = model.SymptomsReason,
                        Status = model.Status
                    };
                    _dbContext.Appointments.Add(appointmentEntity);
                    await _dbContext.SaveChangesAsync();

                    if (slotTx != null)
                    {
                        await slotTx.CommitAsync();
                    }
                }
                finally
                {
                    _bookingLock.Release();
                }
            }
            catch (Exception dbEx)
            {
                if (slotTx != null)
                {
                    try { await slotTx.RollbackAsync(); } catch { }
                }
                Console.WriteLine($"[Appointments Warning] DB persistence error: {dbEx.Message}");
                return StatusCode(500, new { message = "Lỗi xung đột đồng thời hoặc lỗi CSDL khi lưu lịch hẹn. Vui lòng thử lại!" });
            }

            // 2. Tạo QR Code Check-in dạng gọn MEDQR (ít ô vuông, máy quét Kiosk & camera đọc nhanh dưới 200ms)
            model.QrCode = BuildCompactQrCode(model.Id, model.PatientCode, model.AppointmentType, model.SymptomsReason);

            // 3. Đồng bộ bộ đệm in-memory và tệp JSON
            lock (_lock)
            {
                _cachedAppointments!.Add(model);
                SaveToFile();
            }

            // 4. Bắn tín hiệu SignalR thời gian thực đến Web Bác sĩ & Tiếp tân
            try
            {
                await _hubContext.Clients.All.SendAsync("NewPatientInQueue", model);
                await _hubContext.Clients.All.SendAsync("ReceiveNewAppointment", model);
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", model);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] CreateAppointment broadcast failed: {hubEx.Message}");
            }

            return Ok(model);
        }

        /// <summary>
        /// Check-in Tiếp nhận Điện tử bằng Mã QR (Hỗ trợ Kiosk tự phục vụ, Bệnh nhân tự quét hoặc Nhân viên tiếp nhận / Sàng lọc)
        /// Áp dụng Nguyên tắc Quyền tối thiểu (Least Privilege): Chỉ Receptionist, Triage, Patient
        /// </summary>
        [HttpPost("checkin-qr")]
        [Authorize(Roles = "Receptionist,Triage,Patient")]
        public async Task<IActionResult> CheckInWithQr([FromBody] CheckInQrDto dto)
        {
            EnsureDataLoaded();
            if (string.IsNullOrWhiteSpace(dto.QrCodeOrId))
            {
                return BadRequest(new { message = "Vui lòng quét hoặc nhập mã QR tiếp nhận hợp lệ." });
            }

            var input = dto.QrCodeOrId.Trim();
            var appointment = LookupCachedAppointment(input);

            // Nếu chưa có trong Cache: Tìm kiếm trực tiếp trong CSDL SQL Server (Source of Truth)
            if (appointment == null)
            {
                try
                {
                    Appointment? dbApt = null;
                    if (Guid.TryParse(input, out var parsedGuid))
                    {
                        dbApt = await _dbContext.Appointments
                            .Include(a => a.Patient)
                            .Include(a => a.Schedule)
                            .FirstOrDefaultAsync(a => a.Id == parsedGuid);
                    }
                    else
                    {
                        dbApt = await _dbContext.Appointments
                            .Include(a => a.Patient)
                            .Include(a => a.Schedule)
                            .FirstOrDefaultAsync(a => a.Patient != null && (a.Patient.PatientCode == input || a.Patient.EmergencyContactPhone == input));
                    }

                    if (dbApt != null)
                    {
                        appointment = new OnlineAppointmentItem
                        {
                            Id = dbApt.Id.ToString(),
                            PatientCode = dbApt.Patient?.PatientCode ?? "",
                            PatientName = dbApt.Patient?.FullName ?? "",
                            PatientPhone = dbApt.Patient?.EmergencyContactPhone ?? "",
                            IdentityCardNumber = dbApt.Patient?.IdentityCardNumber,
                            PatientGender = dbApt.Patient?.Gender ?? "Nam",
                            PatientAge = dbApt.Patient != null ? Math.Max(1, DateTime.UtcNow.Year - dbApt.Patient.DateOfBirth.Year) : 30,
                            DepartmentName = dbApt.Schedule?.Department?.DepartmentName ?? "Khoa Khám Bệnh",
                            DoctorName = "BS. CKII. Nguyễn Thanh Duy",
                            AppointmentDate = dbApt.AppointmentDate.ToString("yyyy-MM-dd"),
                            AppointmentTime = dbApt.AppointmentDate.ToString("HH:mm"),
                            SymptomsReason = dbApt.Symptoms ?? "",
                            Status = dbApt.Status,
                            CreatedAt = dbApt.AppointmentDate.ToString("o"),
                            QrCode = BuildCompactQrCode(dbApt.Id.ToString(), dbApt.Patient?.PatientCode, null, dbApt.Symptoms),
                            CheckInStatus = (dbApt.Status == "CheckedIn" || dbApt.Status == "Completed") ? "CheckedInQR" : "PendingQR"
                        };

                        lock (_lock)
                        {
                            _cachedAppointments!.Add(appointment);
                        }
                    }
                }
                catch (Exception dbEx)
                {
                    Console.WriteLine($"[Appointments Warning] Check-in SQL lookup error: {dbEx.Message}");
                }
            }

            if (appointment == null)
            {
                return NotFound(new { message = "Không tìm thấy thông tin lịch hẹn với Mã QR này." });
            }

            // Bảo mật chống IDOR: Nếu người gọi là tài khoản Bệnh nhân (Patient), bắt buộc kiểm tra quyền sở hữu lịch hẹn
            var isStaff = User.IsInRole("Receptionist") || User.IsInRole("Triage") || User.IsInRole("Admin");
            if (!isStaff)
            {
                var scope = await ResolveCallerScopeAsync();
                var isOwner = CallerMatchesAppointment(scope, appointment);

                if (!isOwner && Guid.TryParse(appointment.Id, out var parsedAptId))
                {
                    try
                    {
                        var dbApt = await _dbContext.Appointments.Include(a => a.Patient).FirstOrDefaultAsync(a => a.Id == parsedAptId);
                        if (dbApt?.Patient != null)
                        {
                            isOwner = CallerMatchesAppointment(scope, appointment, dbApt.Patient);
                        }
                    }
                    catch { }
                }

                if (!isOwner)
                {
                    return StatusCode(403, new { message = "Từ chối quyền truy cập: Bạn không có quyền check-in lịch hẹn của bệnh nhân khác!" });
                }
            }

            // Ghi nhận xác thực thiết bị Kiosk nếu có Header X-Kiosk-Device-Id
            var kioskDeviceId = Request.Headers["X-Kiosk-Device-Id"].FirstOrDefault();
            if (!string.IsNullOrEmpty(kioskDeviceId))
            {
                Console.WriteLine($"[Kiosk Terminal] Thiết bị {kioskDeviceId} đang xử lý check-in lịch hẹn {appointment.Id}");
            }

            // Kiểm tra trạng thái lịch hẹn
            if (appointment.Status == "Cancelled")
            {
                return BadRequest(new { message = "Lịch hẹn này đã bị hủy trước đó." });
            }

            if (appointment.Status == "Completed")
            {
                return BadRequest(new { message = "Lịch hẹn này đã hoàn tất khám bệnh, không thể check-in lại." });
            }

            // Idempotency: Nếu lịch hẹn đã check-in QR trước đó, trả về ngay thông tin hiện tại không duplicate xử lý
            if (appointment.CheckInStatus == "CheckedInQR" || appointment.Status == "CheckedIn")
            {
                return Ok(appointment);
            }

            // Kiểm soát quy tắc ngày khám & thời gian theo giờ địa phương Việt Nam (Asia/Ho_Chi_Minh)
            var vnNow = GetVietnamNow();
            var todayVn = vnNow.Date;

            if (DateTime.TryParse(appointment.AppointmentDate, out var aptDate))
            {
                // A. Chặn check-in trước ngày khám
                if (aptDate.Date > todayVn)
                {
                    return BadRequest(new { message = $"Chưa đến ngày khám hẹn ({appointment.AppointmentDate}). Quý khách chỉ có thể check-in tại Kiosk vào đúng ngày khám đã đăng ký theo giờ Việt Nam!" });
                }

                // B. Chặn check-in khi đã quá ngày khám
                if (aptDate.Date < todayVn)
                {
                    return BadRequest(new { message = $"Lịch hẹn ngày {appointment.AppointmentDate} đã quá hạn tiếp nhận (hết ngày khám). Quý khách vui lòng liên hệ quầy tiếp nhận để được hỗ trợ!" });
                }

                // C. Kiểm tra khung giờ trong ngày: Tại Kiosk tự động, nếu đã hết giờ tiếp nhận hành chính (> 17:30), chuyển tiếp đến quầy tiếp nhận
                if (!isStaff && (vnNow.Hour > 17 || (vnNow.Hour == 17 && vnNow.Minute > 30)))
                {
                    return BadRequest(new { message = "Kiosk đã hết giờ tiếp nhận tự động trong ngày (sau 17:30). Quý khách vui lòng đến quầy Tiếp nhận trực tiếp để được hỗ trợ!" });
                }
            }

            // Idempotency: Nếu lịch hẹn đã check-in QR trước đó, trả về ngay thông tin hiện tại không duplicate xử lý
            if (appointment.CheckInStatus == "CheckedInQR")
            {
                return Ok(appointment);
            }

            lock (_lock)
            {
                appointment.Status = "CheckedIn"; // Đã tiếp nhận điện tử thành công, chờ Bác sĩ gọi khám
                appointment.CheckInStatus = "CheckedInQR";
                appointment.CheckedInAt = DateTime.UtcNow.ToString("o");
                SaveToFile();
            }

            // Đồng bộ trạng thái Check-in xuống CSDL SQL Server (Không nhầm lẫn Check-in với Khám hoàn tất)
            try
            {
                if (Guid.TryParse(appointment.Id, out var aptGuid))
                {
                    var dbApt = await _dbContext.Appointments.FirstOrDefaultAsync(a => a.Id == aptGuid);
                    if (dbApt != null)
                    {
                        dbApt.Status = "CheckedIn";
                        await _dbContext.SaveChangesAsync();
                    }
                }
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"[Appointments Warning] Check-in DB sync failed: {dbEx.Message}");
            }

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveAppointmentCheckedIn", appointment);
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", appointment);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] Check-in broadcast failed: {hubEx.Message}");
            }

            return Ok(appointment);
        }

        /// <summary>
        /// Cập nhật trạng thái lịch hẹn (Chỉ dành cho Cán bộ y tế & Quản trị)
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Receptionist,Triage,Nurse,Doctor,Cashier,Admin")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusDto dto)
        {
            EnsureDataLoaded();
            OnlineAppointmentItem? appointment = null;
            lock (_lock)
            {
                appointment = _cachedAppointments!.FirstOrDefault(a => a.Id == id);
            }

            if (appointment == null)
            {
                if (Guid.TryParse(id, out var parsedGuid))
                {
                    var dbApt = await _dbContext.Appointments.Include(a => a.Patient).FirstOrDefaultAsync(a => a.Id == parsedGuid);
                    if (dbApt != null)
                    {
                        appointment = new OnlineAppointmentItem
                        {
                            Id = dbApt.Id.ToString(),
                            PatientCode = dbApt.Patient?.PatientCode ?? "",
                            PatientName = dbApt.Patient?.FullName ?? "",
                            PatientPhone = dbApt.Patient?.EmergencyContactPhone ?? "",
                            Status = dbApt.Status
                        };
                        lock (_lock) { _cachedAppointments!.Add(appointment); }
                    }
                }
            }

            if (appointment == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch hẹn" });
            }

            lock (_lock)
            {
                appointment.Status = dto.Status;
                if (dto.Status == "Completed")
                {
                    appointment.CheckInStatus = "CheckedInQR";
                    appointment.CheckedInAt = DateTime.UtcNow.ToString("o");
                }
                SaveToFile();
            }

            // Đồng bộ trạng thái xuống CSDL SQL Server
            try
            {
                if (Guid.TryParse(id, out var aptGuid))
                {
                    var dbApt = await _dbContext.Appointments.FirstOrDefaultAsync(a => a.Id == aptGuid);
                    if (dbApt != null)
                    {
                        dbApt.Status = dto.Status;
                        await _dbContext.SaveChangesAsync();
                    }
                }
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"[Appointments Warning] UpdateStatus DB sync failed: {dbEx.Message}");
            }

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", appointment);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] Appointment status broadcast failed: {hubEx.Message}");
            }

            return Ok(appointment);
        }

        /// <summary>
        /// Bệnh nhân hoặc nhân viên hủy lịch hẹn (Tự động hoàn trả Quota chỗ trống, có kiểm tra quyền sở hữu)
        /// </summary>
        [HttpPut("{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelAppointment(string id, [FromBody] CancelAppointmentDto? dto)
        {
            EnsureDataLoaded();
            EnsureSlotsLoaded();
            OnlineAppointmentItem? appointment = null;
            lock (_lock)
            {
                appointment = _cachedAppointments!.FirstOrDefault(a => a.Id == id);
            }

            if (appointment == null)
            {
                if (Guid.TryParse(id, out var parsedGuid))
                {
                    var dbApt = await _dbContext.Appointments.Include(a => a.Patient).FirstOrDefaultAsync(a => a.Id == parsedGuid);
                    if (dbApt != null)
                    {
                        appointment = new OnlineAppointmentItem
                        {
                            Id = dbApt.Id.ToString(),
                            PatientCode = dbApt.Patient?.PatientCode ?? "",
                            PatientName = dbApt.Patient?.FullName ?? "",
                            PatientPhone = dbApt.Patient?.EmergencyContactPhone ?? "",
                            Status = dbApt.Status
                        };
                        lock (_lock) { _cachedAppointments!.Add(appointment); }
                    }
                }
            }

            if (appointment == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch hẹn cần hủy." });
            }

            if (!IsStaff())
            {
                var scope = await ResolveCallerScopeAsync();
                Patient? dbPatient = null;
                if (Guid.TryParse(appointment.Id, out var parsedAptGuid))
                {
                    dbPatient = await _dbContext.Appointments
                        .AsNoTracking()
                        .Where(a => a.Id == parsedAptGuid)
                        .Select(a => a.Patient)
                        .FirstOrDefaultAsync();
                }

                if (!CallerMatchesAppointment(scope, appointment, dbPatient))
                {
                    return Forbid();
                }
            }

            if (appointment.Status == "Completed")
            {
                return BadRequest(new { message = "Lịch hẹn đã được check-in khám tại bệnh viện, không thể hủy." });
            }

            lock (_lock)
            {
                appointment.Status = "Cancelled";
                appointment.CancelReason = dto?.Reason ?? "Bệnh nhân chủ động hủy lịch";
                SaveToFile();
            }

            // Đồng bộ hủy lịch xuống CSDL SQL Server (Giải phóng định mức Quota chính thức)
            try
            {
                if (Guid.TryParse(id, out var aptGuid))
                {
                    var dbApt = await _dbContext.Appointments.FirstOrDefaultAsync(a => a.Id == aptGuid);
                    if (dbApt != null)
                    {
                        dbApt.Status = "Cancelled";
                        await _dbContext.SaveChangesAsync();
                    }
                }
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"[Appointments Warning] Cancel DB sync failed: {dbEx.Message}");
            }

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", appointment);
                await _hubContext.Clients.All.SendAsync("ReceiveAppointmentCancelled", appointment);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] Cancel appointment broadcast failed: {hubEx.Message}");
            }

            return Ok(appointment);
        }

        /// <summary>
        /// Bệnh nhân đổi lịch khám sang ngày/giờ khác (Tự động kiểm tra quyền sở hữu & cập nhật Quota chỗ trống)
        /// </summary>
        [HttpPut("{id}/reschedule")]
        [Authorize]
        public async Task<IActionResult> RescheduleAppointment(string id, [FromBody] RescheduleAppointmentDto dto)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(new { message = "Mã lịch hẹn không hợp lệ." });
            }

            EnsureDataLoaded();
            EnsureSlotsLoaded();

            if (string.IsNullOrWhiteSpace(dto.NewDate) || string.IsNullOrWhiteSpace(dto.NewTime))
            {
                return BadRequest(new { message = "Vui lòng chọn ngày và khung giờ khám mới hợp lệ." });
            }

            var newDate = dto.NewDate.Trim();
            var newTime = dto.NewTime.Trim();
            var slotStartTime = newTime.Split('-')[0].Trim();

            var callerScope = IsStaff() ? null : await ResolveCallerScopeAsync();
            Patient? rescheduleDbPatient = null;
            if (callerScope != null && Guid.TryParse(id, out var rescheduleGuid))
            {
                rescheduleDbPatient = await _dbContext.Appointments
                    .AsNoTracking()
                    .Where(a => a.Id == rescheduleGuid)
                    .Select(a => a.Patient)
                    .FirstOrDefaultAsync();
            }

            OnlineAppointmentItem? appointment;
            lock (_lock)
            {
                appointment = _cachedAppointments!.FirstOrDefault(a => a.Id == id);
                if (appointment == null)
                {
                    return NotFound(new { message = "Không tìm thấy lịch hẹn cần đổi." });
                }

                if (callerScope != null && !CallerMatchesAppointment(callerScope, appointment, rescheduleDbPatient))
                {
                    return Forbid();
                }

                if (appointment.Status == "Completed")
                {
                    return BadRequest(new { message = "Lịch hẹn đã được tiếp nhận tại quầy khám, không thể đổi lịch." });
                }

                // Kiểm tra khung giờ mới có bị khóa hoặc hết chỗ không
                var matchedSlot = _cachedSlots!.FirstOrDefault(s =>
                    s.TimeSlot == newTime ||
                    s.TimeSlot.StartsWith(slotStartTime) ||
                    slotStartTime.StartsWith(s.TimeSlot.Split('-')[0].Trim()));

                if (matchedSlot != null)
                {
                    if (matchedSlot.IsLocked)
                    {
                        return BadRequest(new { message = $"Khung giờ {matchedSlot.TimeSlot} hiện đang bị tạm khóa bởi Bệnh viện. Quý khách vui lòng chọn giờ khác!" });
                    }

                    var count = _cachedAppointments!
                        .Where(a => a.Id != id &&
                                    a.AppointmentDate == newDate &&
                                    a.Status != "Cancelled" &&
                                    (a.AppointmentTime == slotStartTime || a.AppointmentTime == matchedSlot.TimeSlot || a.AppointmentTime.StartsWith(slotStartTime)))
                        .Count();

                    if (count >= matchedSlot.MaxCapacity)
                    {
                        return BadRequest(new { message = $"Khung giờ {matchedSlot.TimeSlot} vào ngày {newDate} đã hết chỗ ({count}/{matchedSlot.MaxCapacity}). Vui lòng chọn khung giờ khác!" });
                    }
                }

                var oldDate = appointment.AppointmentDate;
                var oldTime = appointment.AppointmentTime;

                appointment.AppointmentDate = newDate;
                appointment.AppointmentTime = newTime;
                appointment.Status = "Pending";
                appointment.RescheduledAt = DateTime.UtcNow.ToString("o");
                appointment.QrCode = BuildCompactQrCode(appointment.Id, appointment.PatientCode, appointment.AppointmentType, appointment.SymptomsReason);
                if (!string.IsNullOrWhiteSpace(dto.Reason))
                {
                    appointment.SymptomsReason += $" [Đổi lịch từ {oldTime} {oldDate}: {dto.Reason}]";
                }

                SaveToFile();
            }

            // Đồng bộ ngày hẹn mới xuống CSDL SQL Server
            try
            {
                if (Guid.TryParse(id, out var aptGuid))
                {
                    var dbApt = await _dbContext.Appointments.FirstOrDefaultAsync(a => a.Id == aptGuid);
                    if (dbApt != null)
                    {
                        if (DateTime.TryParse($"{newDate} {slotStartTime}", out var newDt))
                        {
                            dbApt.AppointmentDate = newDt;
                            dbApt.Status = "Pending";
                            await _dbContext.SaveChangesAsync();
                        }
                    }
                }
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"[Appointments Warning] Reschedule DB sync failed: {dbEx.Message}");
            }

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", appointment);
                await _hubContext.Clients.All.SendAsync("ReceiveAppointmentRescheduled", appointment);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] Reschedule broadcast failed: {hubEx.Message}");
            }

            return Ok(appointment);
        }
    }
}
