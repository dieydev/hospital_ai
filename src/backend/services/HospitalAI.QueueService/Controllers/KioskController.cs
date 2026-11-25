using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using HospitalAI.Infrastructure.Services;
using HospitalAI.QueueService.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalAI.QueueService.Controllers;

/// <summary>
/// API chuyên biệt cho Trạm Kiosk Tự Phục Vụ tại Sảnh Bệnh viện:
/// - Quét QR Check-in Khám mới & Tái khám (có kiểm tra giờ VN, lịch sử EMR, Cổng viện phí)
/// - Quét QR CCCD gắn chip / nhập tay lấy STT trực tiếp (Walk-in + Luật KBCB 15/2023/QH15)
/// - Quét QR quay lại phòng khám đọc kết quả Cận lâm sàng (CLS)
/// - Theo dõi trạng thái thanh toán hóa đơn VietQR/VNPay theo thời gian thực
/// </summary>
[ApiController]
[Route("api/kiosk")]
public class KioskController : ControllerBase
{
    private readonly HospitalDbContext _dbContext;
    private readonly IQueueService _queueService;
    private readonly IHubContext<QueueHub> _hubContext;
    private readonly IConfiguration? _configuration;

    // Cấu hình tài khoản nhận VietQR Bệnh viện (Minh bạch cho đồ án & thực tế đối soát)
    private const string HospitalBankBin = "970422"; // MB Bank
    private const string HospitalBankAccount = "0336022526";
    private const string HospitalBankAccountName = "BENH VIEN DA KHOA D-MEDICAL";
    private const decimal DefaultExamFee = 150000m;

    public KioskController(
        HospitalDbContext dbContext,
        IQueueService queueService,
        IHubContext<QueueHub> hubContext,
        IConfiguration? configuration = null)
    {
        _dbContext = dbContext;
        _queueService = queueService;
        _hubContext = hubContext;
        _configuration = configuration;
    }

    private (bool Allowed, bool IsStaffSession, KioskTerminalInfoDto? Terminal) ValidateKioskAccess()
    {
        var request = HttpContext?.Request;
        return KioskTerminalValidator.ValidateRequest(request, User, _configuration);
    }

    private UnauthorizedObjectResult BuildUnauthorizedTerminalResult() =>
        Unauthorized(new
        {
            message = "Trạm Kiosk chưa được xác thực hợp lệ. Vui lòng ghép đôi thiết bị Kiosk (X-Kiosk-Terminal-Id / X-Kiosk-Terminal-Secret) hoặc đăng nhập tài khoản Nhân viên Tiếp nhận."
        });

    [HttpGet("terminals")]
    [AllowAnonymous]
    public IActionResult GetTerminals()
    {
        return Ok(KioskTerminalValidator.GetPublicTerminalList(_configuration));
    }

    [HttpGet("board")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicBoard(
        [FromQuery] Guid? departmentId,
        [FromQuery] string? queueType,
        [FromQuery] bool includeMaskedNames = true)
    {
        var (allowed, isStaffSession, _) = ValidateKioskAccess();
        if (!allowed) return BuildUnauthorizedTerminalResult();

        var tickets = await _queueService.GetTodayQueueTicketsAsync(departmentId, null);
        if (!string.IsNullOrWhiteSpace(queueType) && !string.Equals(queueType, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            tickets = tickets
                .Where(t => string.Equals(t.QueueType, queueType, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        // Bảo vệ PII ở màn hình sảnh công cộng: Chỉ Staff có JWT mới xem tên đầy đủ khi cần đối soát; trạm Kiosk công cộng che bớt tên
        if (!isStaffSession && includeMaskedNames)
        {
            foreach (var t in tickets)
            {
                t.PatientName = KioskTerminalValidator.MaskPersonName(t.PatientName);
            }
        }

        return Ok(tickets);
    }

    [HttpPost("parse-scan")]
    [AllowAnonymous]
    public IActionResult ParseScan([FromBody] KioskParseRequestDto dto)
    {
        var (allowed, _, _) = ValidateKioskAccess();
        if (!allowed) return BuildUnauthorizedTerminalResult();

        return Ok(KioskQrParser.Parse(dto?.RawCode));
    }

    [HttpPost("checkin")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckIn([FromBody] KioskCheckInRequestDto request)
    {
        var (allowed, isStaffSession, terminal) = ValidateKioskAccess();
        if (!allowed) return BuildUnauthorizedTerminalResult();

        if (string.IsNullOrWhiteSpace(request.QrCodeOrCode))
        {
            return BadRequest(new { message = "Vui lòng quét mã QR hoặc nhập mã tiếp nhận hợp lệ." });
        }

        var terminalId = request.TerminalId ?? terminal?.TerminalId ?? "KIOSK-LOCAL";
        var parsed = KioskQrParser.Parse(request.QrCodeOrCode);

        // 1. Tìm Lịch hẹn (Appointment) trong SQL Server trước
        var dbApt = await FindAppointmentInSqlAsync(request.QrCodeOrCode.Trim(), parsed);
        if (dbApt != null)
        {
            return await ProcessDbAppointmentCheckInAsync(dbApt, parsed, isStaffSession, terminalId);
        }

        // 2. Fallback: Tìm trong cache lịch hẹn đồng bộ (những lịch hẹn App mẫu)
        var cachedApt = AppointmentsController.LookupCachedAppointment(request.QrCodeOrCode.Trim());
        if (cachedApt != null)
        {
            return await ProcessCachedAppointmentCheckInAsync(cachedApt, parsed, isStaffSession, terminalId);
        }

        // 3. Tra cứu trong danh sách Phiếu hàng chờ (QueueTickets) đã được Quầy tiếp nhận cấp hôm nay
        var existingTicket = await FindTodayTicketInSqlAsync(parsed);
        if (existingTicket != null)
        {
            var unpaidReg = await FindUnpaidBillingAsync(existingTicket.PatientId, "Registration");
            if (unpaidReg != null)
            {
                var billSummary = BuildBillingSummary(unpaidReg, unpaidReg.Patient);
                return Ok(new KioskCheckInResponseDto
                {
                    Outcome = "UNPAID_REQUIRED",
                    Message = $"Bệnh nhân {existingTicket.PatientName} ({existingTicket.PatientCode}) đã có số #{existingTicket.SequenceNumber} nhưng chưa thanh toán hóa đơn {billSummary.BillingCode} ({billSummary.Amount:N0} VNĐ).",
                    VisitType = existingTicket.VisitType ?? "New",
                    Ticket = existingTicket,
                    UnpaidBilling = billSummary,
                    ParsedQr = parsed,
                    TerminalId = terminalId
                });
            }

            return Ok(new KioskCheckInResponseDto
            {
                Outcome = "ALREADY_CHECKED_IN",
                Message = $"Xác nhận số thứ tự #{existingTicket.SequenceNumber} cho {existingTicket.PatientName} tại {existingTicket.DepartmentName}.",
                VisitType = existingTicket.VisitType ?? "New",
                Ticket = existingTicket,
                ParsedQr = parsed,
                TerminalId = terminalId
            });
        }

        // 4. Tra cứu theo Giấy hẹn Tái khám điện tử (FollowUpAppointmentCode: HEN-...) từ bảng Examinations
        var followUpExam = await FindFollowUpExaminationAsync(parsed);
        if (followUpExam?.Patient != null)
        {
            return await ProcessFollowUpExamCheckInAsync(followUpExam, parsed, terminalId);
        }

        // 5. Không tìm thấy bất kỳ hồ sơ/lịch hẹn nào -> Trả 404 rõ ràng, tuyệt đối không tự gán bệnh nhân khác
        return NotFound(new KioskCheckInResponseDto
        {
            Outcome = "NOT_FOUND",
            Message = $"Không tìm thấy thông tin lịch hẹn hoặc phiếu tiếp nhận nào khớp với mã \"{request.QrCodeOrCode.Trim()}\" trong ngày hôm nay.",
            ParsedQr = parsed,
            TerminalId = terminalId
        });
    }

    [HttpPost("walkin-issue")]
    [AllowAnonymous]
    public async Task<IActionResult> IssueWalkIn([FromBody] KioskWalkInRequestDto dto)
    {
        var (allowed, _, terminal) = ValidateKioskAccess();
        if (!allowed) return BuildUnauthorizedTerminalResult();

        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.IdentityCardNumber))
        {
            return BadRequest(new { message = "Vui lòng cung cấp đầy đủ Họ tên và Số CCCD/Định danh." });
        }

        var cleanCccd = dto.IdentityCardNumber.Trim();
        if (!cleanCccd.All(char.IsDigit) || cleanCccd.Length < 9 || cleanCccd.Length > 12)
        {
            return BadRequest(new { message = "Số CCCD/CMND không hợp lệ (phải gồm 9 đến 12 chữ số)." });
        }

        var dept = await _dbContext.Departments.FirstOrDefaultAsync(d => d.Id == dto.DepartmentId)
                   ?? await _dbContext.Departments.FirstOrDefaultAsync();
        if (dept == null)
        {
            return BadRequest(new { message = "Hệ thống chưa cấu hình danh mục Khoa/Phòng khám." });
        }

        // Tìm bệnh nhân hiện hữu theo CCCD (chống trùng hồ sơ)
        var patient = await _dbContext.Patients
            .FirstOrDefaultAsync(p => p.IdentityCardNumber == cleanCccd);

        var isReturningPatient = false;
        if (patient == null)
        {
            var newCode = $"BN{DateTime.UtcNow.Year}{Random.Shared.Next(100000, 999999)}";
            while (await _dbContext.Patients.AnyAsync(p => p.PatientCode == newCode))
            {
                newCode = $"BN{DateTime.UtcNow.Year}{Random.Shared.Next(100000, 999999)}";
            }

            patient = new Patient
            {
                Id = Guid.NewGuid(),
                PatientCode = newCode,
                FullName = dto.FullName.Trim(),
                Gender = string.IsNullOrWhiteSpace(dto.Gender) ? "Nam" : dto.Gender.Trim(),
                DateOfBirth = dto.DateOfBirth ?? DateTime.UtcNow.AddYears(-30),
                IdentityCardNumber = cleanCccd,
                HealthInsuranceNumber = string.IsNullOrWhiteSpace(dto.HealthInsuranceNumber) ? null : dto.HealthInsuranceNumber.Trim().ToUpperInvariant(),
                Address = string.IsNullOrWhiteSpace(dto.Address) ? "Đăng ký trực tiếp tại Kiosk Sảnh" : dto.Address.Trim(),
                EmergencyContactPhone = string.IsNullOrWhiteSpace(dto.PhoneNumber) ? null : dto.PhoneNumber.Trim(),
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Patients.Add(patient);
            await _dbContext.SaveChangesAsync();
        }
        else
        {
            isReturningPatient = await _dbContext.Examinations.AnyAsync(e => e.PatientId == patient.Id);
            var changed = false;
            if (!string.IsNullOrWhiteSpace(dto.HealthInsuranceNumber) && string.IsNullOrWhiteSpace(patient.HealthInsuranceNumber))
            {
                patient.HealthInsuranceNumber = dto.HealthInsuranceNumber.Trim().ToUpperInvariant();
                changed = true;
            }
            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber) && string.IsNullOrWhiteSpace(patient.EmergencyContactPhone))
            {
                patient.EmergencyContactPhone = dto.PhoneNumber.Trim();
                changed = true;
            }
            if (changed) await _dbContext.SaveChangesAsync();
        }

        var visitType = isReturningPatient ? "FollowUp" : "New";

        // Nếu thu phí khám dịch vụ trước tại Kiosk và chưa có BHYT: kiểm tra hóa đơn Registration hôm nay
        if (dto.RequirePrepayment && string.IsNullOrWhiteSpace(patient.HealthInsuranceNumber))
        {
            var cutoff = DateTime.UtcNow.Date.AddDays(-1);
            var hasPaidToday = await _dbContext.Billings.AnyAsync(b =>
                b.PatientId == patient.Id &&
                b.BillingType == "Registration" &&
                b.Status == "Paid" &&
                b.CreatedAt >= cutoff);

            if (!hasPaidToday)
            {
                var unpaidBill = await FindUnpaidBillingAsync(patient.Id, "Registration");
                if (unpaidBill == null)
                {
                    unpaidBill = new Billing
                    {
                        Id = Guid.NewGuid(),
                        PatientId = patient.Id,
                        BillingType = "Registration",
                        TotalAmount = DefaultExamFee,
                        Status = "Unpaid",
                        CreatedAt = DateTime.UtcNow,
                        Items = new List<BillingItem>
                        {
                            new BillingItem
                            {
                                Id = Guid.NewGuid(),
                                ItemName = $"Phí khám chuyên khoa - {dept.DepartmentName}",
                                UnitPrice = DefaultExamFee,
                                Quantity = 1,
                                TotalPrice = DefaultExamFee
                            }
                        }
                    };
                    _dbContext.Billings.Add(unpaidBill);
                    await _dbContext.SaveChangesAsync();
                }

                return Ok(new KioskCheckInResponseDto
                {
                    Outcome = "UNPAID_REQUIRED",
                    Message = $"Hồ sơ {patient.FullName} ({patient.PatientCode}) đã sẵn sàng. Vui lòng thanh toán tạm ứng phí khám {unpaidBill.TotalAmount:N0} VNĐ để Kiosk cấp số thứ tự.",
                    VisitType = visitType,
                    UnpaidBilling = BuildBillingSummary(unpaidBill, patient),
                    TerminalId = dto.TerminalId ?? terminal?.TerminalId ?? "KIOSK-SANH-A-01"
                });
            }
        }

        var issuedTicket = await _queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient.Id,
            DepartmentId = dept.Id,
            VisitType = visitType,
            QueueType = "Exam",
            IsPregnant = dto.IsPregnant,
            IsDisabled = dto.IsDisabled,
            HasRevolutionaryMerit = dto.HasRevolutionaryMerit
        });

        await BroadcastQueueSignalsAsync("NewPatientInQueue", issuedTicket);

        return Ok(new KioskCheckInResponseDto
        {
            Outcome = "SUCCESS",
            Message = $"Cấp số thứ tự thành công #{issuedTicket.SequenceNumber} cho bệnh nhân {issuedTicket.PatientName} tại {issuedTicket.DepartmentName}.",
            VisitType = visitType,
            Ticket = issuedTicket,
            TerminalId = dto.TerminalId ?? terminal?.TerminalId ?? "KIOSK-SANH-A-01"
        });
    }

    [HttpPost("cls-return")]
    [AllowAnonymous]
    public async Task<IActionResult> ProcessClsReturn([FromBody] KioskClsReturnRequestDto request)
    {
        var (allowed, _, terminal) = ValidateKioskAccess();
        if (!allowed) return BuildUnauthorizedTerminalResult();

        if (string.IsNullOrWhiteSpace(request.QrCodeOrCode))
        {
            return BadRequest(new { message = "Vui lòng quét mã QR hoặc nhập mã bệnh nhân / STT." });
        }

        var parsed = KioskQrParser.Parse(request.QrCodeOrCode);
        var patient = await FindPatientByLookupAsync(parsed);
        if (patient == null)
        {
            // Thử tìm theo STT trong ngày
            var ticketBySeq = await FindTodayTicketInSqlAsync(parsed);
            if (ticketBySeq != null)
            {
                patient = await _dbContext.Patients.FirstOrDefaultAsync(p => p.Id == ticketBySeq.PatientId);
            }
        }

        if (patient == null)
        {
            return NotFound(new KioskClsReturnResponseDto
            {
                Outcome = "NOT_FOUND",
                Message = $"Không tìm thấy hồ sơ bệnh nhân với mã \"{request.QrCodeOrCode.Trim()}\"."
            });
        }

        // Kiểm tra hóa đơn Cận lâm sàng chưa thanh toán (nếu có)
        var unpaidClsBill = await FindUnpaidBillingAsync(patient.Id, "ServiceOrder");
        if (unpaidClsBill != null)
        {
            return Ok(new KioskClsReturnResponseDto
            {
                Outcome = "UNPAID_CLS",
                Message = $"Quý khách còn hóa đơn Cận lâm sàng ({unpaidClsBill.TotalAmount:N0} VNĐ) chưa thanh toán.",
                UnpaidBilling = BuildBillingSummary(unpaidClsBill, patient)
            });
        }

        // Tìm lượt khám gần nhất có chỉ định CLS
        var exam = await _dbContext.Examinations
            .Include(e => e.ServiceOrderDetails)
            .Where(e => e.PatientId == patient.Id)
            .OrderByDescending(e => e.ExaminationDate)
            .ThenByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        var serviceOrders = exam != null
            ? await _dbContext.ServiceOrders.Include(s => s.Results).Where(s => s.ExaminationId == exam.Id).ToListAsync()
            : new List<ServiceOrder>();

        var items = new List<KioskClsServiceItemDto>();
        if (exam != null)
        {
            foreach (var d in exam.ServiceOrderDetails)
            {
                items.Add(new KioskClsServiceItemDto
                {
                    ServiceName = d.ServiceName,
                    Category = d.ServiceCategory,
                    Status = d.Status,
                    ResultSummary = d.Result
                });
            }
        }

        foreach (var so in serviceOrders)
        {
            if (items.Any(i => string.Equals(i.ServiceName, so.ServiceName, StringComparison.OrdinalIgnoreCase))) continue;
            var latestResult = so.Results.OrderByDescending(r => r.ApprovalTime).FirstOrDefault();
            items.Add(new KioskClsServiceItemDto
            {
                ServiceName = so.ServiceName,
                Category = "Cận lâm sàng",
                Status = so.Results.Count > 0 ? "Đã có kết quả" : so.Status,
                ResultSummary = latestResult?.ImageConclusion ?? latestResult?.MeasuredValue
            });
        }

        if (items.Count == 0)
        {
            return NotFound(new KioskClsReturnResponseDto
            {
                Outcome = "NOT_FOUND",
                Message = $"Bệnh nhân {patient.FullName} ({patient.PatientCode}) chưa có chỉ định Cận lâm sàng nào cần đọc kết quả.",
                ExaminationCode = exam?.ExaminationCode
            });
        }

        static bool IsCompletedStatus(KioskClsServiceItemDto s)
        {
            var st = (s.Status ?? string.Empty).ToLowerInvariant();
            return st.Contains("đã có") || st.Contains("completed") || st.Contains("hoàn") || !string.IsNullOrWhiteSpace(s.ResultSummary);
        }

        var completedCount = items.Count(IsCompletedStatus);
        var pendingCount = items.Count - completedCount;

        if (completedCount == 0)
        {
            return Ok(new KioskClsReturnResponseDto
            {
                Outcome = "PENDING_RESULTS",
                Message = $"Các dịch vụ Cận lâm sàng của {patient.FullName} đang chờ Kỹ thuật viên thực hiện ({pendingCount} dịch vụ chưa có kết quả).",
                ExaminationCode = exam?.ExaminationCode,
                CompletedCount = 0,
                PendingCount = pendingCount,
                ServiceItems = items
            });
        }

        // Tìm hoặc cấp phiếu hàng chờ hôm nay để chuyển sang Hàng đợi ưu tiên Đọc KQ CLS
        var today = DateTime.UtcNow.Date;
        var todayTicket = await _dbContext.QueueTickets
            .Where(q => q.PatientId == patient.Id && q.CreatedAt.Date == today)
            .OrderByDescending(q => q.CreatedAt)
            .FirstOrDefaultAsync();

        QueueTicketDto updatedTicket;
        if (todayTicket != null)
        {
            updatedTicket = await _queueService.MarkTicketAsParaclinicalReturnAsync(todayTicket.Id, exam?.ExaminationCode);
        }
        else
        {
            var targetDept = await ResolveDepartmentByNameAsync(exam?.DepartmentName);
            var issued = await _queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
            {
                PatientId = patient.Id,
                DepartmentId = targetDept.Id,
                VisitType = string.IsNullOrWhiteSpace(exam?.PreviousRecordCode) ? "New" : "FollowUp",
                QueueType = "ParaclinicalResult",
                PreviousRecordCode = exam?.ExaminationCode
            });
            updatedTicket = await _queueService.MarkTicketAsParaclinicalReturnAsync(issued.Id, exam?.ExaminationCode);
        }

        await BroadcastQueueSignalsAsync("ReceiveGlobalQueueUpdate", updatedTicket);

        return Ok(new KioskClsReturnResponseDto
        {
            Outcome = "SUCCESS",
            Message = $"Đã xác nhận {completedCount}/{items.Count} kết quả CLS cho {patient.FullName}. Xếp vào Hàng đợi Ưu tiên Đọc kết quả #{updatedTicket.SequenceNumber} tại {updatedTicket.DepartmentName}.",
            ExaminationCode = exam?.ExaminationCode,
            Ticket = updatedTicket,
            CompletedCount = completedCount,
            PendingCount = pendingCount,
            ServiceItems = items
        });
    }

    [HttpGet("billing/{billingId:guid}/status")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBillingStatus(Guid billingId)
    {
        var (allowed, _, _) = ValidateKioskAccess();
        if (!allowed) return BuildUnauthorizedTerminalResult();

        if (billingId == Guid.Empty) return BadRequest(new { message = "Mã hóa đơn không hợp lệ." });

        var billing = await _dbContext.Billings
            .Include(b => b.Patient)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == billingId);

        if (billing == null) return NotFound(new { message = "Không tìm thấy hóa đơn." });

        return Ok(BuildBillingSummary(billing, billing.Patient));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Private Single-Purpose Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    private async Task<IActionResult> ProcessDbAppointmentCheckInAsync(
        Appointment dbApt,
        KioskQrParseResultDto parsed,
        bool isStaffSession,
        string terminalId)
    {
        var aptDateStr = dbApt.AppointmentDate.ToString("yyyy-MM-dd");
        if (string.Equals(dbApt.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new KioskCheckInResponseDto
            {
                Outcome = "REJECTED",
                Message = "Lịch hẹn này đã bị hủy trước đó, không thể check-in.",
                ParsedQr = parsed,
                TerminalId = terminalId
            });
        }

        var dateCheckError = ValidateAppointmentWindow(dbApt.AppointmentDate, aptDateStr, isStaffSession);
        if (dateCheckError != null)
        {
            return BadRequest(new KioskCheckInResponseDto
            {
                Outcome = "REJECTED",
                Message = dateCheckError,
                ParsedQr = parsed,
                TerminalId = terminalId
            });
        }

        var patient = dbApt.Patient;
        if (patient == null)
        {
            return NotFound(new KioskCheckInResponseDto
            {
                Outcome = "NOT_FOUND",
                Message = "Lịch hẹn không gắn với hồ sơ bệnh nhân hợp lệ.",
                ParsedQr = parsed,
                TerminalId = terminalId
            });
        }

        var unpaidBill = await FindUnpaidBillingAsync(patient.Id, "Registration");
        if (unpaidBill != null)
        {
            return Ok(new KioskCheckInResponseDto
            {
                Outcome = "UNPAID_REQUIRED",
                Message = $"Lịch hẹn của {patient.FullName} chưa hoàn tất đóng phí khám ({unpaidBill.TotalAmount:N0} VNĐ).",
                VisitType = DetectVisitType(dbApt.Symptoms, parsed),
                UnpaidBilling = BuildBillingSummary(unpaidBill, patient),
                ParsedQr = parsed,
                TerminalId = terminalId
            });
        }

        var isAlreadyCheckedIn = string.Equals(dbApt.Status, "CheckedIn", StringComparison.OrdinalIgnoreCase);
        var visitType = DetectVisitType(dbApt.Symptoms, parsed);
        var prevExam = visitType == "FollowUp" ? await GetLatestExamSummaryAsync(patient.Id) : null;

        var dept = dbApt.Schedule?.Department
                   ?? await ResolveDepartmentByNameAsync(prevExam?.DepartmentName);

        var ticket = await _queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient.Id,
            DepartmentId = dept.Id,
            AppointmentId = dbApt.Id,
            VisitType = visitType,
            QueueType = "Exam",
            PreviousRecordCode = prevExam?.ExaminationCode ?? parsed.PreviousRecordCode
        });

        if (!isAlreadyCheckedIn && !string.Equals(dbApt.Status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            dbApt.Status = "CheckedIn";
            await _dbContext.SaveChangesAsync();
            AppointmentsController.MarkCachedAppointmentCheckedIn(dbApt.Id.ToString());
        }

        await BroadcastQueueSignalsAsync("ReceiveAppointmentCheckedIn", ticket);

        return Ok(new KioskCheckInResponseDto
        {
            Outcome = isAlreadyCheckedIn ? "ALREADY_CHECKED_IN" : "SUCCESS",
            Message = isAlreadyCheckedIn
                ? $"Bệnh nhân {ticket.PatientName} đã check-in trước đó. Số thứ tự hiện tại: #{ticket.SequenceNumber}."
                : $"Check-in thành công! Số thứ tự của {ticket.PatientName} là #{ticket.SequenceNumber} tại {ticket.DepartmentName}.",
            VisitType = visitType,
            Ticket = ticket,
            PreviousExam = prevExam,
            ParsedQr = parsed,
            TerminalId = terminalId
        });
    }

    private async Task<IActionResult> ProcessCachedAppointmentCheckInAsync(
        OnlineAppointmentItem cachedApt,
        KioskQrParseResultDto parsed,
        bool isStaffSession,
        string terminalId)
    {
        if (string.Equals(cachedApt.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Lịch hẹn này đã bị hủy trước đó." });
        }

        if (DateTime.TryParse(cachedApt.AppointmentDate, out var aptDate))
        {
            var err = ValidateAppointmentWindow(aptDate, cachedApt.AppointmentDate, isStaffSession);
            if (err != null) return BadRequest(new { message = err });
        }

        var patient = await FindOrCreatePatientFromCachedAppointmentAsync(cachedApt);
        var dept = await ResolveDepartmentByNameAsync(cachedApt.DepartmentName);

        var unpaidBill = await FindUnpaidBillingAsync(patient.Id, "Registration");
        var visitType = string.Equals(cachedApt.AppointmentType, "FollowUp", StringComparison.OrdinalIgnoreCase)
            ? "FollowUp"
            : DetectVisitType(cachedApt.SymptomsReason, parsed);

        if (unpaidBill != null)
        {
            return Ok(new KioskCheckInResponseDto
            {
                Outcome = "UNPAID_REQUIRED",
                Message = $"Lịch hẹn của {patient.FullName} chưa thanh toán tạm ứng phí khám ({unpaidBill.TotalAmount:N0} VNĐ).",
                VisitType = visitType,
                UnpaidBilling = BuildBillingSummary(unpaidBill, patient),
                ParsedQr = parsed,
                TerminalId = terminalId
            });
        }

        Guid? aptGuid = Guid.TryParse(cachedApt.Id, out var g) ? g : null;
        var prevExam = visitType == "FollowUp" ? await GetLatestExamSummaryAsync(patient.Id) : null;

        var ticket = await _queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient.Id,
            DepartmentId = dept.Id,
            AppointmentId = aptGuid,
            VisitType = visitType,
            QueueType = "Exam",
            PreviousRecordCode = cachedApt.PreviousRecordCode ?? prevExam?.ExaminationCode
        });

        AppointmentsController.MarkCachedAppointmentCheckedIn(cachedApt.Id);
        await BroadcastQueueSignalsAsync("ReceiveAppointmentCheckedIn", ticket);

        return Ok(new KioskCheckInResponseDto
        {
            Outcome = "SUCCESS",
            Message = $"Check-in thành công cho {ticket.PatientName}! STT #{ticket.SequenceNumber} - {ticket.DepartmentName}.",
            VisitType = visitType,
            Ticket = ticket,
            PreviousExam = prevExam,
            ParsedQr = parsed,
            TerminalId = terminalId
        });
    }

    private async Task<IActionResult> ProcessFollowUpExamCheckInAsync(
        Examination followUpExam,
        KioskQrParseResultDto parsed,
        string terminalId)
    {
        var patient = followUpExam.Patient!;
        var unpaidBill = await FindUnpaidBillingAsync(patient.Id, "Registration");
        var prevSummary = new KioskPreviousExamSummaryDto
        {
            ExaminationCode = followUpExam.ExaminationCode,
            ExaminationDate = followUpExam.ExaminationDate.ToString("yyyy-MM-dd"),
            DepartmentName = followUpExam.DepartmentName,
            ICD10Code = followUpExam.ICD10Code,
            ICD10Name = followUpExam.ICD10Name,
            Assessment = followUpExam.Assessment,
            FollowUpAppointmentCode = followUpExam.FollowUpAppointmentCode
        };

        if (unpaidBill != null)
        {
            return Ok(new KioskCheckInResponseDto
            {
                Outcome = "UNPAID_REQUIRED",
                Message = $"Lượt tái khám theo giấy hẹn {followUpExam.FollowUpAppointmentCode} cần hoàn tất phí khám ({unpaidBill.TotalAmount:N0} VNĐ).",
                VisitType = "FollowUp",
                UnpaidBilling = BuildBillingSummary(unpaidBill, patient),
                PreviousExam = prevSummary,
                ParsedQr = parsed,
                TerminalId = terminalId
            });
        }

        var dept = await ResolveDepartmentByNameAsync(followUpExam.DepartmentName);
        var ticket = await _queueService.IssueQueueTicketAsync(new IssueQueueTicketDto
        {
            PatientId = patient.Id,
            DepartmentId = dept.Id,
            VisitType = "FollowUp",
            QueueType = "Exam",
            PreviousRecordCode = followUpExam.ExaminationCode
        });

        await BroadcastQueueSignalsAsync("NewPatientInQueue", ticket);

        return Ok(new KioskCheckInResponseDto
        {
            Outcome = "SUCCESS",
            Message = $"Tiếp nhận Tái khám thành công theo giấy hẹn {followUpExam.FollowUpAppointmentCode}! STT #{ticket.SequenceNumber} tại {ticket.DepartmentName}.",
            VisitType = "FollowUp",
            Ticket = ticket,
            PreviousExam = prevSummary,
            ParsedQr = parsed,
            TerminalId = terminalId
        });
    }

    private static string? ValidateAppointmentWindow(DateTime aptDate, string aptDateLabel, bool isStaffSession)
    {
        var vnNow = AppointmentsController.GetVietnamNow();
        var todayVn = vnNow.Date;

        if (aptDate.Date > todayVn)
        {
            return $"Chưa đến ngày khám hẹn ({aptDateLabel}). Quý khách chỉ có thể check-in tại Kiosk vào đúng ngày khám đã đăng ký!";
        }

        if (aptDate.Date < todayVn)
        {
            return $"Lịch hẹn ngày {aptDateLabel} đã quá hạn tiếp nhận. Quý khách vui lòng liên hệ Quầy Tiếp nhận để được cấp lại lịch.";
        }

        if (!isStaffSession && (vnNow.Hour > 17 || (vnNow.Hour == 17 && vnNow.Minute > 30)))
        {
            return "Kiosk đã hết giờ tiếp nhận tự động trong ngày (sau 17:30). Quý khách vui lòng đến quầy Tiếp nhận trực tiếp để được hỗ trợ!";
        }

        return null;
    }

    private async Task<Appointment?> FindAppointmentInSqlAsync(string rawInput, KioskQrParseResultDto parsed)
    {
        var keys = new[] { parsed.AppointmentId, parsed.LookupKey, rawInput }
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k!.Trim())
            .Distinct()
            .ToList();

        foreach (var key in keys)
        {
            if (Guid.TryParse(key, out var guid))
            {
                var byId = await _dbContext.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Schedule)
                    .ThenInclude(s => s!.Department)
                    .FirstOrDefaultAsync(a => a.Id == guid);
                if (byId != null) return byId;
            }
        }

        var todayVn = AppointmentsController.GetVietnamNow().Date;
        var patient = await FindPatientByLookupAsync(parsed);
        if (patient == null) return null;

        return await _dbContext.Appointments
            .Include(a => a.Patient)
            .Include(a => a.Schedule)
            .ThenInclude(s => s!.Department)
            .Where(a => a.PatientId == patient.Id && a.Status != "Cancelled")
            .OrderByDescending(a => a.AppointmentDate.Date == todayVn)
            .ThenByDescending(a => a.AppointmentDate)
            .FirstOrDefaultAsync();
    }

    private async Task<Patient?> FindPatientByLookupAsync(KioskQrParseResultDto parsed)
    {
        var keys = new[] { parsed.PatientCode, parsed.IdentityCardNumber, parsed.LookupKey }
            .Where(k => !string.IsNullOrWhiteSpace(k))
            .Select(k => k!.Trim())
            .Distinct()
            .ToList();

        foreach (var k in keys)
        {
            var p = await _dbContext.Patients
                .Include(pt => pt.User)
                .FirstOrDefaultAsync(pt =>
                    pt.PatientCode == k ||
                    pt.IdentityCardNumber == k ||
                    pt.HealthInsuranceNumber == k ||
                    pt.EmergencyContactPhone == k ||
                    (pt.User != null && pt.User.PhoneNumber == k));
            if (p != null) return p;
        }

        return null;
    }

    private async Task<QueueTicketDto?> FindTodayTicketInSqlAsync(KioskQrParseResultDto parsed)
    {
        var todayTickets = await _queueService.GetTodayQueueTicketsAsync(null, null);
        var key = (parsed.PatientCode ?? parsed.LookupKey ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(key)) return null;

        if (Guid.TryParse(key, out var ticketGuid))
        {
            var byGuid = todayTickets.FirstOrDefault(t => t.Id == ticketGuid);
            if (byGuid != null) return byGuid;
        }

        var byCodeOrSeq = todayTickets.FirstOrDefault(t =>
            string.Equals(t.PatientCode, key, StringComparison.OrdinalIgnoreCase) ||
            (int.TryParse(key, out var seq) && key.Length <= 4 && t.SequenceNumber == seq));

        if (byCodeOrSeq != null) return byCodeOrSeq;

        var patient = await FindPatientByLookupAsync(parsed);
        if (patient != null)
        {
            return todayTickets.FirstOrDefault(t => t.PatientId == patient.Id);
        }

        return null;
    }

    private async Task<Examination?> FindFollowUpExaminationAsync(KioskQrParseResultDto parsed)
    {
        var followCode = parsed.PreviousRecordCode ?? (parsed.LookupKey.StartsWith("HEN-", StringComparison.OrdinalIgnoreCase) ? parsed.LookupKey.ToUpperInvariant() : null);
        if (!string.IsNullOrWhiteSpace(followCode))
        {
            var byCode = await _dbContext.Examinations
                .Include(e => e.Patient)
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.FollowUpAppointmentCode == followCode);
            if (byCode != null) return byCode;
        }
        return null;
    }

    private async Task<Patient> FindOrCreatePatientFromCachedAppointmentAsync(OnlineAppointmentItem cached)
    {
        var existing = await _dbContext.Patients.FirstOrDefaultAsync(p =>
            (!string.IsNullOrEmpty(cached.PatientCode) && p.PatientCode == cached.PatientCode) ||
            (!string.IsNullOrEmpty(cached.IdentityCardNumber) && p.IdentityCardNumber == cached.IdentityCardNumber) ||
            (!string.IsNullOrEmpty(cached.PatientPhone) && p.EmergencyContactPhone == cached.PatientPhone));

        if (existing != null) return existing;

        var cccd = !string.IsNullOrWhiteSpace(cached.IdentityCardNumber)
            ? cached.IdentityCardNumber.Trim()
            : $"KS{DateTime.UtcNow.Ticks % 10000000000L:D10}";

        var pNew = new Patient
        {
            Id = Guid.NewGuid(),
            PatientCode = string.IsNullOrWhiteSpace(cached.PatientCode) ? $"BN{DateTime.UtcNow.Year}{Random.Shared.Next(100000, 999999)}" : cached.PatientCode,
            FullName = cached.PatientName,
            Gender = string.IsNullOrWhiteSpace(cached.PatientGender) ? "Nam" : cached.PatientGender,
            DateOfBirth = DateTime.UtcNow.AddYears(-Math.Max(1, cached.PatientAge)),
            IdentityCardNumber = cccd,
            Address = "Đặt lịch trực tuyến App",
            EmergencyContactPhone = cached.PatientPhone,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.Patients.Add(pNew);
        await _dbContext.SaveChangesAsync();
        return pNew;
    }

    private async Task<Billing?> FindUnpaidBillingAsync(Guid patientId, string billingType)
    {
        var cutoff = DateTime.UtcNow.Date.AddDays(-1);
        return await _dbContext.Billings
            .Include(b => b.Patient)
            .Where(b => b.PatientId == patientId
                && b.BillingType == billingType
                && b.Status == "Unpaid"
                && b.CreatedAt >= cutoff)
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync();
    }

    private async Task<KioskPreviousExamSummaryDto?> GetLatestExamSummaryAsync(Guid patientId)
    {
        var exam = await _dbContext.Examinations
            .AsNoTracking()
            .Where(e => e.PatientId == patientId)
            .OrderByDescending(e => e.ExaminationDate)
            .FirstOrDefaultAsync();

        if (exam == null) return null;

        return new KioskPreviousExamSummaryDto
        {
            ExaminationCode = exam.ExaminationCode,
            ExaminationDate = exam.ExaminationDate.ToString("yyyy-MM-dd"),
            DepartmentName = exam.DepartmentName,
            ICD10Code = exam.ICD10Code,
            ICD10Name = exam.ICD10Name,
            Assessment = exam.Assessment,
            FollowUpAppointmentCode = exam.FollowUpAppointmentCode
        };
    }

    private async Task<Department> ResolveDepartmentByNameAsync(string? deptName)
    {
        var departments = await _dbContext.Departments.ToListAsync();
        if (!string.IsNullOrWhiteSpace(deptName))
        {
            var matched = departments.FirstOrDefault(d =>
                d.DepartmentName.Contains(deptName.Trim(), StringComparison.OrdinalIgnoreCase) ||
                deptName.Contains(d.DepartmentName, StringComparison.OrdinalIgnoreCase));
            if (matched != null) return matched;
        }

        if (departments.Count > 0) return departments[0];

        var fallback = new Department
        {
            Id = Guid.NewGuid(),
            DepartmentName = string.IsNullOrWhiteSpace(deptName) ? "Khoa Nội Tổng Hợp" : deptName.Trim(),
            Location = "Phòng 102 - Tầng 1",
            RoomType = "Clinical"
        };
        _dbContext.Departments.Add(fallback);
        await _dbContext.SaveChangesAsync();
        return fallback;
    }

    private static string DetectVisitType(string? symptoms, KioskQrParseResultDto parsed)
    {
        if (string.Equals(parsed.AppointmentType, "FollowUp", StringComparison.OrdinalIgnoreCase)) return "FollowUp";
        if (!string.IsNullOrWhiteSpace(symptoms) && symptoms.Contains("tái khám", StringComparison.OrdinalIgnoreCase)) return "FollowUp";
        return "New";
    }

    private static KioskBillingSummaryDto BuildBillingSummary(Billing billing, Patient? patient)
    {
        var shortCode = $"HD-{billing.Id.ToString()[..8].ToUpperInvariant()}";
        var transferDesc = $"VIENPHI {shortCode} {patient?.PatientCode ?? ""}".Trim();
        return new KioskBillingSummaryDto
        {
            BillingId = billing.Id,
            BillingCode = shortCode,
            BillingType = billing.BillingType,
            Amount = billing.TotalAmount,
            Status = billing.Status,
            PatientName = patient?.FullName ?? string.Empty,
            PatientCode = patient?.PatientCode ?? string.Empty,
            Description = billing.BillingType == "ServiceOrder" ? "Thanh toán chỉ định Cận lâm sàng" : "Tạm ứng phí khám ban đầu",
            VietQrPayload = KioskQrParser.BuildVietQrImageUrl(
                HospitalBankBin,
                HospitalBankAccount,
                HospitalBankAccountName,
                billing.TotalAmount,
                transferDesc),
            CreatedAt = billing.CreatedAt
        };
    }

    private async Task BroadcastQueueSignalsAsync(string primaryEvent, object payload)
    {
        try
        {
            await _hubContext.Clients.All.SendAsync(primaryEvent, payload);
            await _hubContext.Clients.All.SendAsync("ReceiveQueueUpdate", payload);
            await _hubContext.Clients.All.SendAsync("ReceiveGlobalQueueUpdate", payload);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Kiosk SignalR Warning] {ex.Message}");
        }
    }
}
