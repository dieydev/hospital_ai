using HospitalAI.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace HospitalAI.Application.Interfaces;

public interface IFcmNotificationService
{
    Task RegisterDeviceTokenAsync(DeviceTokenRegisterDto dto);
    Task<bool> SendPushNotificationAsync(PushNotificationDto notification);
    Task SendQueueApproachingAlertAsync(string phone, string patientName, int sequenceNumber, string departmentName, int remainingAhead);
    Task SendPrescriptionCompletedAlertAsync(string phone, string patientName, string doctorName, string examCode);
    Task<List<PushNotificationDto>> GetNotificationsByUserAsync(string userIdentifier);
    Task<bool> MarkAsReadAsync(string notificationId);
}

