using HospitalAI.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalAI.Application.Interfaces;

public interface IQueueService
{
    Task<List<DepartmentDto>> GetDepartmentsAsync();
    Task<List<QueueTicketDto>> GetTodayQueueTicketsAsync(Guid? departmentId, string? status);
    Task<QueueTicketDto> IssueQueueTicketAsync(IssueQueueTicketDto dto);
    Task<QueueTicketDto> UpdateQueueTicketStatusAsync(Guid ticketId, string status);
    Task<QueueTicketDto?> CallNextPatientAsync(Guid departmentId);
}
