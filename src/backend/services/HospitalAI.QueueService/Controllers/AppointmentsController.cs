using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
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

        public AppointmentsController(IHubContext<QueueHub> hubContext)
        {
            _hubContext = hubContext;
        }

        // Static In-Memory list to sync between Mobile App and Web Admin for Demo
        private static readonly List<OnlineAppointmentItem> _appointments = new()
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

        [HttpGet]
        public IActionResult GetAppointments()
        {
            var sortedList = _appointments.OrderByDescending(a => a.CreatedAt).ToList();
            return Ok(sortedList);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAppointment([FromBody] OnlineAppointmentItem model)
        {
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

            _appointments.Add(model);

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
            var appointment = _appointments.FirstOrDefault(a => a.Id == id);
            if (appointment == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch hẹn" });
            }

            appointment.Status = dto.Status;

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
