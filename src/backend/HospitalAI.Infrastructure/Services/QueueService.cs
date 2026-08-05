using HospitalAI.Application.DTOs;
using HospitalAI.Application.Interfaces;
using HospitalAI.Domain.Entities;
using HospitalAI.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace HospitalAI.Infrastructure.Services;

public class QueueService : IQueueService
{
    private readonly HospitalDbContext _context;

    public QueueService(HospitalDbContext context)
    {
        _context = context;
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

        return list.Select(MapToDto).ToList();
    }

    public async Task<QueueTicketDto> IssueQueueTicketAsync(IssueQueueTicketDto dto)
    {
        var patient = await _context.Patients.FindAsync(dto.PatientId);
        if (patient == null)
            throw new KeyNotFoundException($"Không tìm thấy bệnh nhân với ID {dto.PatientId}");

        var department = await _context.Departments.FindAsync(dto.DepartmentId);
        if (department == null)
            throw new KeyNotFoundException($"Không tìm thấy khoa phòng với ID {dto.DepartmentId}");

        var today = DateTime.UtcNow.Date;
        var lastSequence = await _context.QueueTickets
            .Where(q => q.DepartmentId == dto.DepartmentId && q.CreatedAt.Date == today)
            .MaxAsync(q => (int?)q.SequenceNumber) ?? 100;

        var ticket = new QueueTicket
        {
            Id = Guid.NewGuid(),
            PatientId = dto.PatientId,
            DepartmentId = dto.DepartmentId,
            SequenceNumber = lastSequence + 1,
            Status = "Waiting",
            Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Normal" : dto.Priority,
            CreatedAt = DateTime.UtcNow
        };

        _context.QueueTickets.Add(ticket);
        await _context.SaveChangesAsync();

        ticket.Patient = patient;
        ticket.Department = department;

        return MapToDto(ticket);
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

        return MapToDto(ticket);
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

        return MapToDto(nextTicket);
    }

    private static QueueTicketDto MapToDto(QueueTicket q)
    {
        var age = 0;
        if (q.Patient != null && q.Patient.DateOfBirth != default)
        {
            age = DateTime.UtcNow.Year - q.Patient.DateOfBirth.Year;
        }

        return new QueueTicketDto
        {
            Id = q.Id,
            PatientId = q.PatientId,
            PatientCode = q.Patient?.PatientCode ?? string.Empty,
            PatientName = q.Patient?.FullName ?? string.Empty,
            PatientGender = q.Patient?.Gender ?? string.Empty,
            PatientAge = age,
            IdentityCardNumber = q.Patient?.IdentityCardNumber ?? string.Empty,
            HealthInsuranceNumber = q.Patient?.HealthInsuranceNumber,
            DepartmentId = q.DepartmentId,
            DepartmentName = q.Department?.DepartmentName ?? string.Empty,
            Location = q.Department?.Location ?? string.Empty,
            SequenceNumber = q.SequenceNumber,
            Status = q.Status,
            Priority = q.Priority,
            CreatedAt = q.CreatedAt
        };
    }
}
