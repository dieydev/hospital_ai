using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Services;

public class QueueService : IQueueService
{
    private readonly HospitalDbContext _context;
    private readonly IFcmNotificationService? _fcmService;
    private static readonly System.Threading.SemaphoreSlim _ticketLock = new(1, 1);
    private static readonly string _dataDir = Environment.GetEnvironmentVariable("DATA_DIR") ?? AppContext.BaseDirectory;
    private static readonly string _auditFilePath = Path.Combine(_dataDir, "queue_priority_audit.json");
    private static readonly object _auditFileLock = new();
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, PriorityAuditRecord> _auditRecords = LoadAuditRecordsFromFile();

    private static System.Collections.Concurrent.ConcurrentDictionary<Guid, PriorityAuditRecord> LoadAuditRecordsFromFile()
    {
        var dict = new System.Collections.Concurrent.ConcurrentDictionary<Guid, PriorityAuditRecord>();
        try
        {
            if (File.Exists(_auditFilePath))
            {
                var json = File.ReadAllText(_auditFilePath);
                var items = JsonSerializer.Deserialize<Dictionary<Guid, PriorityAuditRecord>>(json);
                if (items != null)
                {
                    foreach (var kvp in items) dict[kvp.Key] = kvp.Value;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[QueueService Warning] Could not load audit log: {ex.Message}");
        }
        return dict;
    }

    private static void SaveAuditRecordsToFile()
    {
        lock (_auditFileLock)
        {
            try
            {
                var dir = Path.GetDirectoryName(_auditFilePath);
                if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
                {
                    Directory.CreateDirectory(dir);
                }
                var json = JsonSerializer.Serialize(_auditRecords);
                File.WriteAllText(_auditFilePath, json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[QueueService Warning] Could not persist audit log: {ex.Message}");
            }
        }
    }

    public record PriorityAuditRecord(
        string? PriorityReason,
        string? ConfirmedBy,
        DateTime? ConfirmedAt,
        string? Reason,
        string? QueueType = null,
        string? PreviousRecordCode = null,
        string? VisitType = null);

    public QueueService(HospitalDbContext context, IFcmNotificationService? fcmService = null)
    {
        _context = context;
        _fcmService = fcmService;
    }

    public async Task<List<DepartmentDto>> GetDepartmentsAsync()
    {
        return await _context.Departments
            .AsNoTracking()
            .OrderBy(d => d.DepartmentName)
            .Select(d => new DepartmentDto
            {
                Id = d.Id,
                DepartmentName = d.DepartmentName,
                Location = d.Location,
                RoomType = d.RoomType
            })
            .ToListAsync();
    }

    public async Task<List<QueueTicketDto>> GetTodayQueueTicketsAsync(Guid? departmentId, string? status)
    {
        var today = DateTime.UtcNow.Date;
        var query = _context.QueueTickets
            .Include(q => q.Patient)
            .Include(q => q.Department)
            .AsNoTracking()
            .Where(q => q.CreatedAt.Date == today);

        if (departmentId.HasValue && departmentId.Value != Guid.Empty)
        {
            query = query.Where(q => q.DepartmentId == departmentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(q => q.Status == status);
        }

        var list = await query
            .OrderBy(q => q.Priority == "Emergency" ? 0 : q.Priority == "Priority" ? 1 : 2)
            .ThenBy(q => q.SequenceNumber)
            .ToListAsync();

        var dtos = list.Select(MapToDto).ToList();
        await HydrateBillingStatusAsync(dtos);
        return dtos;
    }

    public async Task<QueueTicketDto> IssueQueueTicketAsync(IssueQueueTicketDto dto)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);
        if (patient == null)
            throw new KeyNotFoundException($"Không tìm thấy bệnh nhân với ID {dto.PatientId}");

        var department = await _context.Departments.FindAsync(dto.DepartmentId);
        if (department == null)
            throw new KeyNotFoundException($"Không tìm thấy khoa phòng với ID {dto.DepartmentId}");

        // Đồng bộ hóa luồng cấp số (Chống trùng lặp số thứ tự khi nhiều bệnh nhân lấy số cùng tích tắc)
        await _ticketLock.WaitAsync();
        try
        {
            var today = DateTime.UtcNow.Date;

            // NGUYÊN TẮC BẢO MẬT & ĐÚNG LUẬT: Không tin trực tiếp dto.Priority hay dto.PriorityReason từ client
            var priority = "Normal";
            string? priorityReason = null;
            string? confirmedBy = null;
            DateTime? confirmedAt = null;
            string? emergencyReason = null;

            // 1. Chỉ cho phép kích hoạt tình trạng Cấp cứu (Emergency) khi có xác nhận hợp lệ của nhân sự chuyên môn y tế
            if (dto.IsEmergencyConfirmed == true || string.Equals(dto.Priority, "Emergency", StringComparison.OrdinalIgnoreCase))
            {
                if (dto.IsEmergencyConfirmed == true &&
                    !string.IsNullOrWhiteSpace(dto.EmergencyConfirmedBy) &&
                    !string.IsNullOrWhiteSpace(dto.EmergencyReason))
                {
                    priority = "Emergency";
                    confirmedBy = dto.EmergencyConfirmedBy.Trim();
                    confirmedAt = dto.EmergencyConfirmedAt ?? DateTime.UtcNow;
                    emergencyReason = dto.EmergencyReason.Trim();
                    priorityReason = $"Tình trạng cấp cứu - Xác nhận bởi nhân sự chuyên môn ({confirmedBy}) lúc {confirmedAt:yyyy-MM-dd HH:mm:ss}. Lý do: {emergencyReason}";
                }
                else
                {
                    // Client gửi yêu cầu cấp cứu nhưng thiếu xác nhận chuyên môn y tế -> Không cấp quyền khẩn cấp
                    priority = "Normal";
                    priorityReason = null;
                }
            }

            // 2. Nếu không phải cấp cứu, kiểm tra đối tượng ưu tiên luật định theo Khoản 2 Điều 3 Luật Khám bệnh, chữa bệnh số 15/2023/QH15
            if (priority != "Emergency")
            {
                if (patient.DateOfBirth != default)
                {
                    var age = today.Year - patient.DateOfBirth.Year;
                    if (patient.DateOfBirth.Date > today.AddYears(-age)) age--;

                    // Người từ đủ 75 tuổi trở lên (Khoản 2 Điều 3 Luật KBCB 15/2023/QH15)
                    if (age >= 75)
                    {
                        priority = "Priority";
                        priorityReason = $"Người cao tuổi từ đủ 75 tuổi trở lên ({age} tuổi) - Điều 3 Luật KBCB 15/2023/QH15";
                    }
                    // Trẻ em dưới 6 tuổi (Khoản 2 Điều 3 Luật KBCB 15/2023/QH15)
                    else if (age < 6)
                    {
                        priority = "Priority";
                        priorityReason = $"Trẻ em dưới 6 tuổi ({age} tuổi) - Điều 3 Luật KBCB 15/2023/QH15";
                    }
                }

                // Phụ nữ có thai (Khoản 2 Điều 3 Luật KBCB 15/2023/QH15)
                if (dto.IsPregnant == true)
                {
                    priority = "Priority";
                    priorityReason = "Phụ nữ có thai - Khoản 2 Điều 3 Luật KBCB 15/2023/QH15";
                }
                // Người khuyết tật đặc biệt nặng, người khuyết tật nặng (Khoản 2 Điều 3 Luật KBCB 15/2023/QH15)
                else if (dto.IsDisabled == true)
                {
                    priority = "Priority";
                    priorityReason = "Người khuyết tật nặng/đặc biệt nặng - Khoản 2 Điều 3 Luật KBCB 15/2023/QH15";
                }
                // Người có công với cách mạng (Khoản 2 Điều 3 Luật KBCB 15/2023/QH15)
                else if (dto.HasRevolutionaryMerit == true)
                {
                    priority = "Priority";
                    priorityReason = "Người có công với cách mạng - Khoản 2 Điều 3 Luật KBCB 15/2023/QH15";
                }
            }

            // Idempotency: Kiểm tra nếu phiếu đã được cấp cho lịch hẹn này trong ngày (chống duplicate khi quét lại mã)
            if (dto.AppointmentId.HasValue && dto.AppointmentId.Value != Guid.Empty)
            {
                var existingAptTicket = await _context.QueueTickets
                    .Include(q => q.Patient)
                    .Include(q => q.Department)
                    .FirstOrDefaultAsync(q => q.AppointmentId == dto.AppointmentId.Value 
                        && q.CreatedAt.Date == today 
                        && (q.Status == "Waiting" || q.Status == "Calling" || q.Status == "Processing" || q.Status == "WaitingCLS"));

                if (existingAptTicket != null)
                {
                    var dtoItem = MapToDto(existingAptTicket);
                    if (!string.IsNullOrEmpty(dto.VisitType)) dtoItem.VisitType = dto.VisitType;
                    await HydrateBillingStatusAsync(new List<QueueTicketDto> { dtoItem });
                    return dtoItem;
                }
            }

            // Idempotency: Bệnh nhân đã có STT đang chờ hoặc đang gọi tại cùng khoa phòng trong ngày (chống double-click/quét lặp tại Kiosk)
            var existingActiveTicket = await _context.QueueTickets
                .Include(q => q.Patient)
                .Include(q => q.Department)
                .FirstOrDefaultAsync(q => q.PatientId == dto.PatientId 
                    && q.DepartmentId == dto.DepartmentId 
                    && q.CreatedAt.Date == today 
                    && (q.Status == "Waiting" || q.Status == "Calling" || q.Status == "Processing" || q.Status == "WaitingCLS"));

            if (existingActiveTicket != null)
            {
                var dtoItem = MapToDto(existingActiveTicket);
                if (!string.IsNullOrEmpty(dto.VisitType)) dtoItem.VisitType = dto.VisitType;
                await HydrateBillingStatusAsync(new List<QueueTicketDto> { dtoItem });
                return dtoItem;
            }

            // Đồng bộ hóa cấp số thứ tự qua Database Transaction mức Serializable có Retry & Backoff (chống deadlock/trùng lặp trên môi trường multi-instance / multi-container)
            var isRelational = _context.Database.IsRelational();
            int maxRetries = 3;
            int attempt = 0;

            while (attempt < maxRetries)
            {
                attempt++;
                using var tx = isRelational ? await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable) : null;
                try
                {
                    var lastSequence = await _context.QueueTickets
                        .Where(q => q.DepartmentId == dto.DepartmentId && q.CreatedAt.Date == today)
                        .MaxAsync(q => (int?)q.SequenceNumber) ?? 100;

                    var ticket = new QueueTicket
                    {
                        Id = Guid.NewGuid(),
                        PatientId = dto.PatientId,
                        DepartmentId = dto.DepartmentId,
                        AppointmentId = dto.AppointmentId,
                        SequenceNumber = lastSequence + 1,
                        Status = "Waiting",
                        Priority = priority,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.QueueTickets.Add(ticket);
                    await _context.SaveChangesAsync();

                    if (tx != null) await tx.CommitAsync();

                    var resolvedQueueType = string.IsNullOrWhiteSpace(dto.QueueType) ? "Exam" : dto.QueueType.Trim();
                    _auditRecords[ticket.Id] = new PriorityAuditRecord(
                        priorityReason,
                        confirmedBy,
                        confirmedAt,
                        emergencyReason,
                        resolvedQueueType,
                        dto.PreviousRecordCode,
                        dto.VisitType);
                    SaveAuditRecordsToFile();

                    ticket.Patient = patient;
                    ticket.Department = department;

                    var result = MapToDto(ticket);
                    if (!string.IsNullOrEmpty(dto.VisitType)) result.VisitType = dto.VisitType;
                    await HydrateBillingStatusAsync(new List<QueueTicketDto> { result });
                    return result;
                }
                catch (Exception ex) when (attempt < maxRetries && (ex is DbUpdateException || ex.Message.Contains("deadlock") || ex.Message.Contains("1205") || ex.Message.Contains("conflict")))
                {
                    if (tx != null) await tx.RollbackAsync();
                    await Task.Delay(Random.Shared.Next(40, 120));
                }
                catch
                {
                    if (tx != null) await tx.RollbackAsync();
                    throw;
                }
            }

            throw new InvalidOperationException("Không thể cấp số thứ tự do xung đột hệ thống sau 3 lần thử. Vui lòng thử lại!");
        }
        finally
        {
            _ticketLock.Release();
        }
    }

    public async Task<QueueTicketDto> UpdateQueueTicketStatusAsync(Guid ticketId, string status)
    {
        var ticket = await _context.QueueTickets
            .Include(q => q.Patient)
            .Include(q => q.Department)
            .FirstOrDefaultAsync(q => q.Id == ticketId);

        if (ticket == null)
            throw new KeyNotFoundException($"Không tìm thấy phiếu hàng chờ với ID {ticketId}");

        ticket.Status = status;
        await _context.SaveChangesAsync();

        var dto = MapToDto(ticket);
        await HydrateBillingStatusAsync(new List<QueueTicketDto> { dto });
        return dto;
    }

    public async Task<QueueTicketDto> MarkTicketAsParaclinicalReturnAsync(Guid ticketId, string? previousRecordCode = null)
    {
        var ticket = await _context.QueueTickets
            .Include(q => q.Patient)
            .Include(q => q.Department)
            .FirstOrDefaultAsync(q => q.Id == ticketId);

        if (ticket == null)
            throw new KeyNotFoundException($"Không tìm thấy phiếu hàng chờ với ID {ticketId}");

        ticket.Status = "Waiting";
        if (!string.Equals(ticket.Priority, "Emergency", StringComparison.OrdinalIgnoreCase))
        {
            ticket.Priority = "Priority";
        }

        await _context.SaveChangesAsync();

        _auditRecords.TryGetValue(ticket.Id, out var existingAudit);
        _auditRecords[ticket.Id] = new PriorityAuditRecord(
            existingAudit?.PriorityReason ?? "Ưu tiên quay lại phòng khám đọc kết quả Cận lâm sàng (CLS)",
            existingAudit?.ConfirmedBy,
            existingAudit?.ConfirmedAt,
            existingAudit?.Reason,
            "ParaclinicalResult",
            previousRecordCode ?? existingAudit?.PreviousRecordCode,
            existingAudit?.VisitType);
        SaveAuditRecordsToFile();

        var dto = MapToDto(ticket);
        await HydrateBillingStatusAsync(new List<QueueTicketDto> { dto });
        return dto;
    }

    public async Task<QueueTicketDto> RouteTicketAfterTriageAsync(
        Guid ticketId,
        TriageRouteTicketDto dto,
        string? confirmedByStaff,
        bool canConfirmEmergency)
    {
        var ticket = await _context.QueueTickets
            .Include(q => q.Patient)
            .Include(q => q.Department)
            .FirstOrDefaultAsync(q => q.Id == ticketId);

        if (ticket == null)
            throw new KeyNotFoundException($"Không tìm thấy phiếu hàng chờ với ID {ticketId}");

        var targetDept = await _context.Departments.FindAsync(dto.TargetDepartmentId);
        if (targetDept == null)
            throw new KeyNotFoundException($"Không tìm thấy chuyên khoa chỉ định với ID {dto.TargetDepartmentId}");

        var today = DateTime.UtcNow.Date;
        var priority = ticket.Priority;
        string? priorityReason = null;
        string? confirmedBy = null;
        DateTime? confirmedAt = null;
        string? emergencyReason = null;

        if (_auditRecords.TryGetValue(ticket.Id, out var existingAudit))
        {
            priorityReason = existingAudit.PriorityReason;
            confirmedBy = existingAudit.ConfirmedBy;
            confirmedAt = existingAudit.ConfirmedAt;
            emergencyReason = existingAudit.Reason;
        }

        if (string.Equals(dto.TriageLevel, "Emergency", StringComparison.OrdinalIgnoreCase))
        {
            if (canConfirmEmergency || dto.IsEmergencyConfirmed == true)
            {
                priority = "Emergency";
                confirmedBy = string.IsNullOrWhiteSpace(confirmedByStaff) ? "Nhân viên Sàng lọc" : confirmedByStaff.Trim();
                confirmedAt = DateTime.UtcNow;
                emergencyReason = string.IsNullOrWhiteSpace(dto.EmergencyReason)
                    ? (string.IsNullOrWhiteSpace(dto.InitialSymptoms) ? "Xác nhận ưu tiên khẩn tại Bàn Sàng lọc" : dto.InitialSymptoms.Trim())
                    : dto.EmergencyReason.Trim();
                priorityReason = $"Phân luồng Cấp cứu tại Sàng lọc ({confirmedBy})";
            }
        }
        else if (string.Equals(dto.TriageLevel, "Priority", StringComparison.OrdinalIgnoreCase))
        {
            if (priority != "Emergency")
            {
                priority = "Priority";
                priorityReason = priorityReason ?? "Ưu tiên phân luồng từ Bàn Sàng lọc";
            }
        }
        else if (string.Equals(dto.TriageLevel, "Normal", StringComparison.OrdinalIgnoreCase))
        {
            priority = "Normal";
        }

        await _ticketLock.WaitAsync();
        try
        {
            var isRelational = _context.Database.IsRelational();
            using var tx = isRelational ? await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable) : null;
            try
            {
                if (ticket.DepartmentId != targetDept.Id)
                {
                    var lastSeq = await _context.QueueTickets
                        .Where(q => q.DepartmentId == targetDept.Id && q.CreatedAt.Date == today)
                        .MaxAsync(q => (int?)q.SequenceNumber) ?? 100;

                    ticket.DepartmentId = targetDept.Id;
                    ticket.SequenceNumber = lastSeq + 1;
                    ticket.Department = targetDept;
                }

                ticket.Priority = priority;

                if (ticket.AppointmentId.HasValue && ticket.AppointmentId.Value != Guid.Empty)
                {
                    var apt = await _context.Appointments.FirstOrDefaultAsync(a => a.Id == ticket.AppointmentId.Value);
                    if (apt != null && !string.IsNullOrWhiteSpace(dto.InitialSymptoms))
                    {
                        var triageNote = $"[Sàng lọc -> {targetDept.DepartmentName}: {dto.InitialSymptoms.Trim()}]";
                        if (string.IsNullOrWhiteSpace(apt.Symptoms))
                            apt.Symptoms = triageNote;
                        else if (!apt.Symptoms.Contains(triageNote, StringComparison.OrdinalIgnoreCase))
                            apt.Symptoms = $"{apt.Symptoms} | {triageNote}";
                    }
                }

                await _context.SaveChangesAsync();
                if (tx != null) await tx.CommitAsync();
            }
            catch
            {
                if (tx != null) await tx.RollbackAsync();
                throw;
            }
        }
        finally
        {
            _ticketLock.Release();
        }

        var visitType = string.Equals(dto.VisitType, "FollowUp", StringComparison.OrdinalIgnoreCase)
            ? "FollowUp"
            : (string.Equals(dto.VisitType, "New", StringComparison.OrdinalIgnoreCase) ? "New" : existingAudit?.VisitType);

        _auditRecords[ticket.Id] = new PriorityAuditRecord(
            priorityReason,
            confirmedBy,
            confirmedAt,
            emergencyReason ?? dto.InitialSymptoms,
            existingAudit?.QueueType ?? "Exam",
            existingAudit?.PreviousRecordCode,
            visitType);
        SaveAuditRecordsToFile();

        var resultDto = MapToDto(ticket);
        if (!string.IsNullOrEmpty(visitType)) resultDto.VisitType = visitType;
        await HydrateBillingStatusAsync(new List<QueueTicketDto> { resultDto });
        return resultDto;
    }

    public async Task<QueueTicketDto?> CallNextPatientAsync(Guid departmentId)
    {
        var today = DateTime.UtcNow.Date;
        var nextTicket = await _context.QueueTickets
            .Include(q => q.Patient)
            .Include(q => q.Department)
            .Where(q => q.DepartmentId == departmentId && q.CreatedAt.Date == today && q.Status == "Waiting")
            .OrderBy(q => q.Priority == "Emergency" ? 0 : q.Priority == "Priority" ? 1 : 2)
            .ThenBy(q => q.SequenceNumber)
            .FirstOrDefaultAsync();

        if (nextTicket == null) return null;

        nextTicket.Status = "Calling";
        await _context.SaveChangesAsync();

        if (_fcmService != null)
        {
            try
            {
                var patientPhone = nextTicket.Patient?.IdentityCardNumber ?? "";
                var patientName = nextTicket.Patient?.FullName ?? "Bệnh nhân";
                var deptName = nextTicket.Department?.DepartmentName ?? "Phòng khám";

                _ = _fcmService.SendPushNotificationAsync(new PushNotificationDto
                {
                    RecipientPhoneOrId = patientPhone,
                    Title = $"🔔 ĐANG GỌI SỐ KHÁM: #{nextTicket.SequenceNumber}",
                    Body = $"Kính mời bệnh nhân {patientName} vào {deptName} ({nextTicket.Department?.Location}) để thăm khám với Bác sĩ.",
                    Type = "QUEUE_APPROACHING",
                    Priority = "HIGH",
                    Metadata = new Dictionary<string, string>
                    {
                        { "sequenceNumber", nextTicket.SequenceNumber.ToString() },
                        { "status", "Calling" }
                    }
                });

                var upcomingTickets = await _context.QueueTickets
                    .Include(q => q.Patient)
                    .Where(q => q.DepartmentId == departmentId && q.CreatedAt.Date == today && q.Status == "Waiting")
                    .OrderBy(q => q.Priority == "Emergency" ? 0 : q.Priority == "Priority" ? 1 : 2)
                    .ThenBy(q => q.SequenceNumber)
                    .Take(2)
                    .ToListAsync();

                for (int i = 0; i < upcomingTickets.Count; i++)
                {
                    var upTicket = upcomingTickets[i];
                    var upPhone = upTicket.Patient?.IdentityCardNumber ?? "";
                    var upName = upTicket.Patient?.FullName ?? "Bệnh nhân";
                    var remainingAhead = i + 1;
                    _ = _fcmService.SendQueueApproachingAlertAsync(upPhone, upName, upTicket.SequenceNumber, deptName, remainingAhead);
                }
            }
            catch { }
        }

        var dto = MapToDto(nextTicket);
        await HydrateBillingStatusAsync(new List<QueueTicketDto> { dto });
        return dto;
    }

    private async Task HydrateBillingStatusAsync(List<QueueTicketDto> dtos)
    {
        if (dtos.Count == 0) return;
        var patientIds = dtos.Select(d => d.PatientId).Where(id => id != Guid.Empty).Distinct().ToList();
        if (patientIds.Count == 0) return;

        var cutoff = DateTime.UtcNow.Date.AddDays(-1);
        var activeBills = await _context.Billings
            .AsNoTracking()
            .Where(b => patientIds.Contains(b.PatientId)
                && b.BillingType == "Registration"
                && (b.Status == "Unpaid" || b.Status == "Paid")
                && b.CreatedAt >= cutoff)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        var unpaidByApt = activeBills
            .Where(b => b.AppointmentId.HasValue && b.Status == "Unpaid")
            .GroupBy(b => b.AppointmentId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        var paidByApt = activeBills
            .Where(b => b.AppointmentId.HasValue && b.Status == "Paid")
            .GroupBy(b => b.AppointmentId!.Value)
            .ToDictionary(g => g.Key, g => g.First());

        var unpaidByPatient = activeBills
            .Where(b => b.Status == "Unpaid")
            .GroupBy(b => b.PatientId)
            .ToDictionary(g => g.Key, g => g.First());

        var paidByPatient = activeBills
            .Where(b => b.Status == "Paid")
            .GroupBy(b => b.PatientId)
            .ToDictionary(g => g.Key, g => g.First());

        foreach (var dto in dtos)
        {
            Billing? matchedUnpaid = null;
            if (dto.AppointmentId.HasValue && unpaidByApt.TryGetValue(dto.AppointmentId.Value, out var aptUnpaid))
            {
                matchedUnpaid = aptUnpaid;
            }
            else if (unpaidByPatient.TryGetValue(dto.PatientId, out var patUnpaid))
            {
                matchedUnpaid = patUnpaid;
            }

            if (matchedUnpaid != null)
            {
                dto.PaymentStatus = "Unpaid";
                dto.UnpaidBillingId = matchedUnpaid.Id;
                dto.UnpaidAmount = matchedUnpaid.TotalAmount;
                continue;
            }

            var hasPaidBill = (dto.AppointmentId.HasValue && paidByApt.ContainsKey(dto.AppointmentId.Value))
                || paidByPatient.ContainsKey(dto.PatientId);
            if (hasPaidBill)
            {
                dto.PaymentStatus = "Paid";
            }
            else if (!string.IsNullOrWhiteSpace(dto.HealthInsuranceNumber))
            {
                dto.PaymentStatus = "InsuranceWaived";
            }
            else
            {
                // Cách 1: Lượt khám mới chưa phân khoa/chưa phát hành hóa đơn từ Sàng lọc -> PendingTriage
                dto.PaymentStatus = "PendingTriage";
            }
        }
    }

    private static QueueTicketDto MapToDto(QueueTicket q)
    {
        var age = 0;
        if (q.Patient != null && q.Patient.DateOfBirth != default)
        {
            age = DateTime.UtcNow.Year - q.Patient.DateOfBirth.Year;
        }

        var dto = new QueueTicketDto
        {
            Id = q.Id,
            PatientId = q.PatientId,
            PatientCode = q.Patient?.PatientCode ?? string.Empty,
            PatientName = q.Patient?.FullName ?? string.Empty,
            PatientGender = q.Patient?.Gender ?? string.Empty,
            PatientAge = age,
            IdentityCardNumber = KioskTerminalValidator.MaskIdentifier(q.Patient?.IdentityCardNumber, 3, 3),
            HealthInsuranceNumber = string.IsNullOrWhiteSpace(q.Patient?.HealthInsuranceNumber) ? null : KioskTerminalValidator.MaskIdentifier(q.Patient?.HealthInsuranceNumber, 2, 3),
            DepartmentId = q.DepartmentId,
            DepartmentName = q.Department?.DepartmentName ?? string.Empty,
            Location = q.Department?.Location ?? string.Empty,
            SequenceNumber = q.SequenceNumber,
            Status = q.Status,
            Priority = q.Priority,
            AppointmentId = q.AppointmentId,
            VisitType = q.AppointmentId.HasValue ? "FollowUp" : "New",
            QueueType = "Exam",
            CreatedAt = q.CreatedAt
        };

        if (_auditRecords.TryGetValue(q.Id, out var audit))
        {
            dto.PriorityReason = audit.PriorityReason;
            dto.EmergencyConfirmedBy = audit.ConfirmedBy;
            dto.EmergencyConfirmedAt = audit.ConfirmedAt;
            dto.EmergencyReason = audit.Reason;
            if (!string.IsNullOrWhiteSpace(audit.QueueType)) dto.QueueType = audit.QueueType;
            if (!string.IsNullOrWhiteSpace(audit.PreviousRecordCode)) dto.PreviousRecordCode = audit.PreviousRecordCode;
            if (!string.IsNullOrWhiteSpace(audit.VisitType)) dto.VisitType = audit.VisitType;
        }

        return dto;
    }
}
