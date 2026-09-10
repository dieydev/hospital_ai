using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;

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
        public IActionResult CreateAppointment([FromBody] OnlineAppointmentItem model)
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

            return Ok(model);
        }

        [HttpPut("{id}/status")]
        public IActionResult UpdateStatus(string id, [FromBody] UpdateStatusDto dto)
        {
            var appointment = _appointments.FirstOrDefault(a => a.Id == id);
            if (appointment == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch hẹn" });
            }

            appointment.Status = dto.Status;
            return Ok(appointment);
        }
    }
}
