using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
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
        private static readonly string _dataDir = Environment.GetEnvironmentVariable("DATA_DIR") ?? AppContext.BaseDirectory;
        private static readonly string _filePath = Path.Combine(_dataDir, "appointments_data.json");
        private static readonly string _slotFilePath = Path.Combine(_dataDir, "time_slots_quota.json");
        
        private static List<OnlineAppointmentItem>? _cachedAppointments;
        private static List<TimeSlotQuotaItem>? _cachedSlots;

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
            return User.IsInRole("Admin") || User.IsInRole("Doctor") || User.IsInRole("Nurse") || User.IsInRole("Receptionist");
        }

        [HttpGet]
        [Authorize]
        public IActionResult GetAppointments()
        {
            EnsureDataLoaded();
            lock (_lock)
            {
                var sortedList = _cachedAppointments!.OrderByDescending(a => a.CreatedAt).AsEnumerable();
                if (!IsStaff())
                {
                    var currentPhone = User.FindFirstValue(ClaimTypes.Name) ?? "";
                    sortedList = sortedList.Where(a => a.PatientPhone == currentPhone || a.PatientCode == currentPhone);
                }
                return Ok(sortedList.ToList());
            }
        }

        /// <summary>
        /// Lấy danh sách lịch hẹn tái khám của bệnh nhân (Bảo vệ chống IDOR)
        /// </summary>
        [HttpGet("followups/{patientCodeOrPhone}")]
        [Authorize]
        public IActionResult GetPatientFollowUps(string patientCodeOrPhone)
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
        /// Admin cấu hình số lượng tối đa / ghi chú cho khung giờ (Chỉ dành cho Admin & Tiếp tân)
        /// </summary>
        [HttpPut("slots/{id}")]
        [Authorize(Roles = "Admin,Receptionist")]
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
        /// Admin Khóa / Mở khóa nhanh khung giờ (Chỉ dành cho Admin & Tiếp tân)
        /// </summary>
        [HttpPut("slots/{id}/toggle-lock")]
        [Authorize(Roles = "Admin,Receptionist")]
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

            // IDOR Protection: Bệnh nhân chỉ được đặt lịch cho chính mình
            if (!IsStaff())
            {
                var currentPhone = User.FindFirstValue(ClaimTypes.Name);
                if (!string.IsNullOrWhiteSpace(currentPhone))
                {
                    model.PatientPhone = currentPhone;
                }
            }

            EnsureDataLoaded();
            EnsureSlotsLoaded();

            // 1. Kiểm tra khung giờ có bị khóa hoặc hết chỗ không
            var slotStartTime = model.AppointmentTime.Split('-')[0].Trim();
            lock (_lock)
            {
                var matchedSlot = _cachedSlots!.FirstOrDefault(s =>
                    s.TimeSlot == model.AppointmentTime ||
                    s.TimeSlot.StartsWith(slotStartTime) ||
                    slotStartTime.StartsWith(s.TimeSlot.Split('-')[0].Trim()));

                if (matchedSlot != null)
                {
                    if (matchedSlot.IsLocked)
                    {
                        return BadRequest(new { message = $"Khung giờ {matchedSlot.TimeSlot} hiện đang bị tạm khóa bởi Bệnh viện. Quý khách vui lòng chọn khung giờ khác!" });
                    }

                    var count = _cachedAppointments!
                        .Where(a => a.AppointmentDate == model.AppointmentDate &&
                                    a.Status != "Cancelled" &&
                                    (a.AppointmentTime == slotStartTime || a.AppointmentTime == matchedSlot.TimeSlot || a.AppointmentTime.StartsWith(slotStartTime)))
                        .Count();

                    if (count >= matchedSlot.MaxCapacity)
                    {
                        return BadRequest(new { message = $"Khung giờ {matchedSlot.TimeSlot} vào ngày {model.AppointmentDate} đã đủ số lượng khám ({count}/{matchedSlot.MaxCapacity}). Quý khách vui lòng chọn khung giờ khác!" });
                    }
                }
            }

            model.Id = $"apt-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
            model.Status = "Pending";
            var qrPayload = new
            {
                type = "D_MEDICAL_EXAM_PASS",
                version = "2.0",
                appointmentId = model.Id,
                patientCode = model.PatientCode,
                patientName = model.PatientName,
                phoneNumber = model.PatientPhone,
                identityCard = model.IdentityCardNumber ?? "",
                department = model.DepartmentName,
                doctor = model.DoctorName,
                roomNumber = model.RoomNumber ?? "Phòng Khám Chuyên Khoa",
                appointmentDate = model.AppointmentDate,
                appointmentTime = model.AppointmentTime,
                appointmentType = model.AppointmentType ?? "New",
                previousRecordCode = model.PreviousRecordCode,
                followUpNotes = model.FollowUpNotes,
                symptoms = model.SymptomsReason,
                checkInNotice = "Xuất trình mã QR tại phòng khám để vào khám (Không cần lấy STT)"
            };
            model.QrCode = System.Text.Json.JsonSerializer.Serialize(qrPayload);

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

            lock (_lock)
            {
                _cachedAppointments!.Add(model);
                SaveToFile();
            }

            // Đồng bộ xuống CSDL EF Core nếu kết nối hoạt động
            try
            {
                var patient = await _dbContext.Patients
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p =>
                        p.PatientCode == model.PatientCode ||
                        (p.User != null && p.User.PhoneNumber == model.PatientPhone) ||
                        p.EmergencyContactPhone == model.PatientPhone ||
                        (!string.IsNullOrEmpty(model.IdentityCardNumber) && p.IdentityCardNumber == model.IdentityCardNumber));
                var schedule = await _dbContext.DoctorSchedules.FirstOrDefaultAsync();

                if (patient != null && schedule != null)
                {
                    DateTime appointmentDate;
                    if (!DateTime.TryParse($"{model.AppointmentDate} {model.AppointmentTime}", out appointmentDate))
                    {
                        appointmentDate = DateTime.UtcNow;
                    }

                    var appointmentEntity = new Appointment
                    {
                        Id = Guid.NewGuid(),
                        PatientId = patient.Id,
                        ScheduleId = schedule.Id,
                        AppointmentDate = appointmentDate,
                        Symptoms = model.SymptomsReason,
                        Status = model.Status
                    };
                    _dbContext.Appointments.Add(appointmentEntity);
                    await _dbContext.SaveChangesAsync();
                }
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"[Appointments Warning] DB sync skipped: {dbEx.Message}");
            }

            // Bắn tín hiệu SignalR thời gian thực đến Web Bác sĩ & Tiếp tân
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
        /// Check-in Tiếp nhận Điện tử bằng Mã QR (Dành cho Lễ tân, Điều dưỡng, Bác sĩ, Admin)
        /// </summary>
        [HttpPost("checkin-qr")]
        [Authorize(Roles = "Receptionist,Nurse,Doctor,Admin")]
        public async Task<IActionResult> CheckInWithQr([FromBody] CheckInQrDto dto)
        {
            EnsureDataLoaded();
            if (string.IsNullOrWhiteSpace(dto.QrCodeOrId))
            {
                return BadRequest(new { message = "Vui lòng quét hoặc nhập mã QR tiếp nhận hợp lệ." });
            }

            var input = dto.QrCodeOrId.Trim();
            OnlineAppointmentItem? appointment = null;

            lock (_lock)
            {
                // Tìm theo Id hoặc theo QrCode hoặc parse chuỗi JSON / MEDQR
                appointment = _cachedAppointments!.FirstOrDefault(a =>
                    a.Id.Equals(input, StringComparison.OrdinalIgnoreCase) ||
                    (!string.IsNullOrEmpty(a.QrCode) && a.QrCode.Equals(input, StringComparison.OrdinalIgnoreCase)) ||
                    (!string.IsNullOrEmpty(a.PatientCode) && a.PatientCode.Equals(input, StringComparison.OrdinalIgnoreCase)));

                if (appointment == null && input.StartsWith("{") && input.EndsWith("}"))
                {
                    try
                    {
                        using var doc = System.Text.Json.JsonDocument.Parse(input);
                        string? aptId = null;
                        if (doc.RootElement.TryGetProperty("appointmentId", out var idProp)) aptId = idProp.GetString();
                        else if (doc.RootElement.TryGetProperty("id", out var id2Prop)) aptId = id2Prop.GetString();

                        if (!string.IsNullOrEmpty(aptId))
                        {
                            appointment = _cachedAppointments!.FirstOrDefault(a => a.Id.Equals(aptId, StringComparison.OrdinalIgnoreCase));
                        }

                        if (appointment == null && doc.RootElement.TryGetProperty("patientCode", out var pCodeProp))
                        {
                            var pCode = pCodeProp.GetString();
                            if (!string.IsNullOrEmpty(pCode))
                            {
                                appointment = _cachedAppointments!.FirstOrDefault(a => a.PatientCode.Equals(pCode, StringComparison.OrdinalIgnoreCase));
                            }
                        }
                    }
                    catch { }
                }

                if (appointment == null && input.StartsWith("MEDQR|"))
                {
                    var parts = input.Split('|');
                    if (parts.Length >= 2)
                    {
                        var aptId = parts[1];
                        appointment = _cachedAppointments!.FirstOrDefault(a => a.Id == aptId);
                    }
                }

                if (appointment == null)
                {
                    return NotFound(new { message = "Không tìm thấy thông tin lịch hẹn với Mã QR này." });
                }

                if (appointment.Status == "Cancelled")
                {
                    return BadRequest(new { message = "Lịch hẹn này đã bị hủy trước đó." });
                }

                appointment.Status = "Completed"; // Đã tiếp nhận điện tử
                appointment.CheckInStatus = "CheckedInQR";
                appointment.CheckedInAt = DateTime.UtcNow.ToString("o");
                SaveToFile();
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
        [Authorize(Roles = "Receptionist,Nurse,Doctor,Admin")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusDto dto)
        {
            EnsureDataLoaded();
            OnlineAppointmentItem? appointment;
            lock (_lock)
            {
                appointment = _cachedAppointments!.FirstOrDefault(a => a.Id == id);
                if (appointment == null)
                {
                    return NotFound(new { message = "Không tìm thấy lịch hẹn" });
                }

                appointment.Status = dto.Status;
                if (dto.Status == "Completed")
                {
                    appointment.CheckInStatus = "CheckedInQR";
                    appointment.CheckedInAt = DateTime.UtcNow.ToString("o");
                }
                SaveToFile();
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
            OnlineAppointmentItem? appointment;
            lock (_lock)
            {
                appointment = _cachedAppointments!.FirstOrDefault(a => a.Id == id);
                if (appointment == null)
                {
                    return NotFound(new { message = "Không tìm thấy lịch hẹn cần hủy." });
                }

                if (!IsStaff())
                {
                    var currentPhone = (User.FindFirstValue(ClaimTypes.Name) ?? "").ToLower();
                    if (!appointment.PatientPhone.Contains(currentPhone) && !appointment.PatientCode.ToLower().Contains(currentPhone))
                    {
                        return Forbid();
                    }
                }

                if (appointment.Status == "Completed")
                {
                    return BadRequest(new { message = "Lịch hẹn đã được check-in khám tại bệnh viện, không thể hủy." });
                }

                appointment.Status = "Cancelled";
                appointment.CancelReason = dto?.Reason ?? "Bệnh nhân chủ động hủy lịch";
                SaveToFile();
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

            OnlineAppointmentItem? appointment;
            lock (_lock)
            {
                appointment = _cachedAppointments!.FirstOrDefault(a => a.Id == id);
                if (appointment == null)
                {
                    return NotFound(new { message = "Không tìm thấy lịch hẹn cần đổi." });
                }

                if (!IsStaff())
                {
                    var currentPhone = (User.FindFirstValue(ClaimTypes.Name) ?? "").ToLower();
                    if (!appointment.PatientPhone.Contains(currentPhone) && !appointment.PatientCode.ToLower().Contains(currentPhone))
                    {
                        return Forbid();
                    }
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
                var rescheduleQrPayload = new
                {
                    type = "D_MEDICAL_EXAM_PASS",
                    version = "2.0",
                    appointmentId = appointment.Id,
                    patientCode = appointment.PatientCode,
                    patientName = appointment.PatientName,
                    phoneNumber = appointment.PatientPhone,
                    identityCard = appointment.IdentityCardNumber ?? "",
                    department = appointment.DepartmentName,
                    doctor = appointment.DoctorName,
                    roomNumber = appointment.RoomNumber ?? "Phòng Khám Chuyên Khoa",
                    appointmentDate = newDate,
                    appointmentTime = newTime,
                    appointmentType = appointment.AppointmentType ?? "New",
                    previousRecordCode = appointment.PreviousRecordCode,
                    followUpNotes = appointment.FollowUpNotes,
                    symptoms = appointment.SymptomsReason,
                    checkInNotice = "Xuất trình mã QR tại phòng khám để vào khám (Không cần lấy STT)"
                };
                appointment.QrCode = System.Text.Json.JsonSerializer.Serialize(rescheduleQrPayload);
                if (!string.IsNullOrWhiteSpace(dto.Reason))
                {
                    appointment.SymptomsReason += $" [Đổi lịch từ {oldTime} {oldDate}: {dto.Reason}]";
                }

                SaveToFile();
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
