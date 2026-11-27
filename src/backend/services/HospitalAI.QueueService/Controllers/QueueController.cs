using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace HospitalAI.QueueService.Controllers;

[ApiController]
[Route("api/queue")]
public class QueueController : ControllerBase
{
    private readonly IQueueService _queueService;
    private readonly IHubContext<QueueHub> _hubContext;
    private readonly HospitalDbContext? _dbContext;
    private readonly Microsoft.Extensions.Configuration.IConfiguration? _configuration;

    public QueueController(
        IQueueService queueService,
        IHubContext<QueueHub> hubContext,
        HospitalDbContext? dbContext = null,
        Microsoft.Extensions.Configuration.IConfiguration? configuration = null)
    {
        _queueService = queueService;
        _hubContext = hubContext;
        _dbContext = dbContext;
        _configuration = configuration;
    }

    private bool IsStaff()
    {
        return User.IsInRole("Admin") || User.IsInRole("Doctor") || User.IsInRole("Receptionist") ||
               User.IsInRole("Triage") || User.IsInRole("Pharmacy") || User.IsInRole("Nurse") || User.IsInRole("Cashier");
    }

    /// <summary>
    /// Lấy danh sách các Khoa/Phòng khám (Công khai cho màn hình sảnh và đặt lịch)
    /// </summary>
    [HttpGet("departments")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDepartments()
    {
        var result = await _queueService.GetDepartmentsAsync();
        return Ok(result);
    }

    /// <summary>
    /// Lấy danh sách hàng chờ trong ngày (Yêu cầu xác thực; bệnh nhân chỉ thấy đầy đủ vé của chính mình, vé khác được ẩn danh PII)
    /// </summary>
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetTodayQueue([FromQuery] Guid? departmentId, [FromQuery] string? status)
    {
        var result = await _queueService.GetTodayQueueTicketsAsync(departmentId, status);

        if (!IsStaff())
        {
            Guid? currentPatientId = null;
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (_dbContext != null && Guid.TryParse(currentUserId, out var userGuid))
            {
                var ownPatient = await _dbContext.Patients
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.UserId == userGuid);
                currentPatientId = ownPatient?.Id;
            }

            foreach (var ticket in result)
            {
                if (!currentPatientId.HasValue || ticket.PatientId != currentPatientId.Value)
                {
                    ticket.PatientName = KioskTerminalValidator.MaskPersonName(ticket.PatientName);
                    ticket.PatientCode = string.Empty;
                    ticket.IdentityCardNumber = "***";
                    ticket.HealthInsuranceNumber = null;
                    ticket.UnpaidBillingId = null;
                    ticket.UnpaidAmount = 0;
                }
            }
        }

        return Ok(result);
    }

    /// <summary>
    /// Tiếp nhận & Cấp số thứ tự hàng chờ mới cho bệnh nhân
    /// </summary>
    [HttpPost("issue")]
    [Authorize]
    public async Task<IActionResult> IssueTicket([FromBody] IssueQueueTicketDto dto)
    {
        try
        {
            // BẢO VỆ CHỐNG GIẢ MẠO CẤP CỨU (Anti-Tampering & Least Privilege):
            // Các trường IsEmergencyConfirmed, EmergencyConfirmedBy, EmergencyConfirmedAt TUYỆT ĐỐI không được tin client.
            // Danh tính người xác nhận bắt buộc phải được kiểm tra từ JWT Claims và quyền Backend (chỉ Triage hoặc Doctor).
            if (dto.IsEmergencyConfirmed == true || string.Equals(dto.Priority, "Emergency", StringComparison.OrdinalIgnoreCase))
            {
                var isClinicalStaff = User.IsInRole("Triage") || User.IsInRole("Doctor");
                if (isClinicalStaff && !string.IsNullOrWhiteSpace(dto.EmergencyReason))
                {
                    var staffRole = User.IsInRole("Doctor") ? "Bác sĩ lâm sàng" : "Nhân viên sàng lọc y tế";
                    var staffName = User.FindFirst("name")?.Value 
                                    ?? User.FindFirst(ClaimTypes.Name)?.Value 
                                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                                    ?? "Cán bộ y tế chuyên môn";

                    dto.IsEmergencyConfirmed = true;
                    dto.EmergencyConfirmedBy = $"{staffRole} - {staffName}";
                    dto.EmergencyConfirmedAt = DateTime.UtcNow; // Server timestamp, không dùng client timestamp
                    dto.Priority = "Emergency";
                }
                else
                {
                    // Người dùng không có vai trò Triage/Doctor hoặc không có lý do chuyên môn -> Thu hồi toàn bộ cờ cấp cứu
                    dto.IsEmergencyConfirmed = false;
                    dto.EmergencyConfirmedBy = null;
                    dto.EmergencyConfirmedAt = null;
                    dto.EmergencyReason = null;
                    dto.Priority = "Normal";
                }
            }
            else
            {
                // Không phải trường hợp cấp cứu: xóa sạch các trường xác nhận để ngăn client gửi giá trị rác
                dto.IsEmergencyConfirmed = false;
                dto.EmergencyConfirmedBy = null;
                dto.EmergencyConfirmedAt = null;
            }

            // Tạo sẵn 1 hóa đơn Registration Unpaid (không tạo trùng) nếu Tiếp nhận đánh dấu Unpaid cho bệnh nhân dịch vụ
            if (_dbContext != null &&
                string.Equals(dto.PaymentStatus, "Unpaid", StringComparison.OrdinalIgnoreCase) &&
                dto.IsEmergencyConfirmed != true)
            {
                var patientEntity = await _dbContext.Patients.AsNoTracking().FirstOrDefaultAsync(p => p.Id == dto.PatientId);
                if (patientEntity != null && string.IsNullOrWhiteSpace(patientEntity.HealthInsuranceNumber))
                {
                    var deptEntity = await _dbContext.Departments.AsNoTracking().FirstOrDefaultAsync(d => d.Id == dto.DepartmentId);
                    var deptFee = DepartmentFeeCatalog.ResolveDepartmentFee(deptEntity?.DepartmentName);
                    await BillingSettlementService.GetOrCreateRegistrationBillingAsync(
                        _dbContext,
                        dto.PatientId,
                        dto.AppointmentId,
                        deptFee,
                        $"Phí khám chuyên khoa - {deptEntity?.DepartmentName ?? "Khám bệnh"}",
                        PaymentQrHelper.ResolveOptions(_configuration));
                }
            }

            var result = await _queueService.IssueQueueTicketAsync(dto);

            // Bắn tín hiệu SignalR thời gian thực đến Web Bác sĩ, Tiếp tân và Mobile App
            try
            {
                await _hubContext.Clients.All.SendAsync("NewPatientInQueue", result);
                await _hubContext.Clients.All.SendAsync("ReceiveQueueUpdate", result);
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", result);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] IssueTicket broadcast failed: {hubEx.Message}");
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Cập nhật trạng thái phiếu hàng chờ (Chỉ dành cho Cán bộ y tế & Quản trị)
    /// </summary>
    [HttpPut("{ticketId:guid}/status")]
    [Authorize(Roles = "Doctor,Receptionist,Triage,Nurse,Cashier,Admin")]
    public async Task<IActionResult> UpdateStatus(Guid ticketId, [FromBody] UpdateQueueStatusDto dto)
    {
        if (ticketId == Guid.Empty)
            return BadRequest(new { message = "Mã phiếu hàng chờ không hợp lệ." });

        try
        {
            var result = await _queueService.UpdateQueueTicketStatusAsync(ticketId, dto.Status);

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveQueueStatusChanged", result);
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", result);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] UpdateStatus broadcast failed: {hubEx.Message}");
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Gọi loa mời bệnh nhân tiếp theo vào khám (Chỉ dành cho Bác sĩ và Quản trị viên)
    /// </summary>
    [HttpPost("departments/{departmentId:guid}/call-next")]
    [Authorize(Roles = "Doctor,Admin")]
    public async Task<IActionResult> CallNext(Guid departmentId)
    {
        if (departmentId == Guid.Empty)
            return BadRequest(new { message = "Mã chuyên khoa không hợp lệ." });

        var result = await _queueService.CallNextPatientAsync(departmentId);
        if (result == null)
            return NotFound(new { message = "Không có bệnh nhân nào đang chờ trong phòng khám này." });

        try
        {
            await _hubContext.Clients.All.SendAsync("ReceiveCallingPatient", result);
            await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", result);
        }
        catch (Exception hubEx)
        {
            Console.WriteLine($"[SignalR Warning] CallNext broadcast failed: {hubEx.Message}");
        }

        return Ok(result);
    }

    /// <summary>
    /// Nhân viên Sàng lọc (Triage) phân chuyên khoa chính thức & tự động chốt hóa đơn công khám theo đúng chuyên khoa (Cách 1).
    /// </summary>
    [HttpPut("{ticketId:guid}/triage-route")]
    [Authorize(Roles = "Triage,Receptionist,Doctor,Nurse,Admin")]
    public async Task<IActionResult> TriageRoute(Guid ticketId, [FromBody] TriageRouteTicketDto dto)
    {
        if (ticketId == Guid.Empty)
            return BadRequest(new { message = "Mã phiếu hàng chờ không hợp lệ." });

        try
        {
            var canConfirmEmergency = User.IsInRole("Triage") || User.IsInRole("Doctor");
            var confirmedByStaff = User.FindFirst("name")?.Value
                ?? User.FindFirst(ClaimTypes.Name)?.Value
                ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? "Nhân viên Sàng lọc";

            var updatedTicket = await _queueService.RouteTicketAfterTriageAsync(
                ticketId,
                dto,
                confirmedByStaff,
                canConfirmEmergency);

            Guid? billingId = updatedTicket.UnpaidBillingId;
            string? paymentCode = null;
            decimal billingAmount = updatedTicket.UnpaidAmount;
            string paymentStatus = updatedTicket.PaymentStatus;
            string billingAction = "WaivedBhytOrEmergency";
            string? warning = null;

            if (_dbContext != null)
            {
                var patientEntity = await _dbContext.Patients
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == updatedTicket.PatientId);

                var hasBhyt = patientEntity != null && !string.IsNullOrWhiteSpace(patientEntity.HealthInsuranceNumber);
                var isEmergency = string.Equals(updatedTicket.Priority, "Emergency", StringComparison.OrdinalIgnoreCase);
                var deptFee = DepartmentFeeCatalog.ResolveDepartmentFee(updatedTicket.DepartmentName);
                var options = PaymentQrHelper.ResolveOptions(_configuration);

                var assignment = await BillingSettlementService.TriageAssignOrUpdateRegistrationBillingAsync(
                    _dbContext,
                    updatedTicket.PatientId,
                    updatedTicket.AppointmentId,
                    deptFee,
                    updatedTicket.DepartmentName,
                    hasBhyt || isEmergency,
                    options);

                billingAction = assignment.Action;
                warning = assignment.DiscrepancyWarning;

                if (assignment.Billing != null)
                {
                    billingId = assignment.Billing.Id;
                    paymentCode = PaymentQrHelper.ResolveFallbackDisplayCode(assignment.Billing, options.PaymentPrefix);
                    billingAmount = assignment.Billing.TotalAmount;
                    paymentStatus = assignment.Billing.Status == "Cancelled"
                        ? (hasBhyt ? "InsuranceWaived" : "PendingTriage")
                        : assignment.Billing.Status;
                    updatedTicket.PaymentStatus = paymentStatus;
                    updatedTicket.UnpaidBillingId = assignment.Billing.Status == "Unpaid" ? assignment.Billing.Id : null;
                    updatedTicket.UnpaidAmount = assignment.Billing.Status == "Unpaid" ? assignment.Billing.TotalAmount : 0m;
                }
            }

            try
            {
                await _hubContext.Clients.All.SendAsync("ReceiveQueueUpdate", updatedTicket);
                await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", updatedTicket);
            }
            catch (Exception hubEx)
            {
                Console.WriteLine($"[SignalR Warning] TriageRoute broadcast failed: {hubEx.Message}");
            }

            var message = billingAction switch
            {
                "Created" => $"Đã phân chuyên khoa {updatedTicket.DepartmentName} (STT #{updatedTicket.SequenceNumber}) và chốt hóa đơn {paymentCode} ({billingAmount:N0} VNĐ) sang Quầy Thu ngân.",
                "UpdatedUnpaid" => $"Đã cập nhật chuyên khoa {updatedTicket.DepartmentName} (STT #{updatedTicket.SequenceNumber}) và điều chỉnh hóa đơn {paymentCode} thành {billingAmount:N0} VNĐ.",
                "KeptExistingPaid" => warning ?? $"Đã phân chuyên khoa {updatedTicket.DepartmentName} (STT #{updatedTicket.SequenceNumber}). Hóa đơn đã thanh toán trước đó được giữ nguyên.",
                _ => $"Đã phân chuyên khoa {updatedTicket.DepartmentName} (STT #{updatedTicket.SequenceNumber}). Miễn thu tạm ứng trước (BHYT/Cấp cứu)."
            };

            return Ok(new TriageRouteResultDto
            {
                Ticket = updatedTicket,
                BillingId = billingId,
                PaymentCode = paymentCode,
                BillingAmount = billingAmount,
                PaymentStatus = paymentStatus,
                BillingAction = billingAction,
                DiscrepancyWarning = warning,
                Message = message
            });
        }
        catch (KeyNotFoundException notFoundEx)
        {
            return NotFound(new { message = notFoundEx.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
