using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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
        public string PatientGender { get; set; } = string.Empty;
        public int PatientAge { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string AppointmentDate { get; set; } = string.Empty;
        public string AppointmentTime { get; set; } = string.Empty;
        public string SymptomsReason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string CreatedAt { get; set; } = string.Empty;
        public string SourceApp { get; set; } = "Flutter Patient App";
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/appointments")]
    public class AppointmentsController : ControllerBase
    {
        private readonly IHubContext<QueueHub> _hubContext;
        private readonly HospitalDbContext _dbContext;
        private static readonly object _lock = new();
        private static readonly string _filePath = Path.Combine(AppContext.BaseDirectory, "appointments_data.json");
        private static List<OnlineAppointmentItem>? _cachedAppointments;

        public AppointmentsController(IHubContext<QueueHub> hubContext, HospitalDbContext dbContext)
        {
            _hubContext = hubContext;
            _dbContext = dbContext;
            EnsureDataLoaded();
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
                            CreatedAt = DateTime.UtcNow.ToString("o")
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
                            CreatedAt = DateTime.UtcNow.AddHours(-1).ToString("o")
                        }
                    };
                    SaveToFile();
                }
            }
        }

        private static void SaveToFile()
        {
            try
            {
                var json = JsonSerializer.Serialize(_cachedAppointments, new JsonSerializerOptions { WriteIndented = true });
                System.IO.File.WriteAllText(_filePath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Appointments Error] Failed to persist appointments: {ex.Message}");
            }
        }

        [HttpGet]
        public IActionResult GetAppointments()
        {
            EnsureDataLoaded();
            lock (_lock)
            {
                var sortedList = _cachedAppointments!.OrderByDescending(a => a.CreatedAt).ToList();
                return Ok(sortedList);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] OnlineAppointmentItem model)
        {
            EnsureDataLoaded();
            model.Id = $"apt-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
            model.Status = "Pending";
            if (string.IsNullOrEmpty(model.CreatedAt))
            {
                model.CreatedAt = DateTime.UtcNow.ToString("o");
            }
            if (string.IsNullOrEmpty(model.SourceApp))
            {
                model.SourceApp = "Flutter Patient App";
            }

            lock (_lock)
            {
                _cachedAppointments!.Add(model);
                SaveToFile();
            }

            // Đồng bộ xuống CSDL EF Core nếu kết nối hoạt động
            try
            {
                var patient = await _dbContext.Patients.FirstOrDefaultAsync(p => p.EmergencyContactPhone == model.PatientPhone || p.PatientCode == model.PatientCode);
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

        [HttpPut("{id}/status")]
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
    }
}
