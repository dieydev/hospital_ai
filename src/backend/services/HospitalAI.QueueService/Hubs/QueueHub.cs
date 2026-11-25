using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace HospitalAI.QueueService.Hubs;

[Authorize]
public class QueueHub : Hub
{
    public async Task JoinDepartmentQueue(string departmentName)
    {
        if (string.IsNullOrWhiteSpace(departmentName) || departmentName.Length > 120)
            return;

        await Groups.AddToGroupAsync(Context.ConnectionId, departmentName.Trim());
    }

    public async Task LeaveDepartmentQueue(string departmentName)
    {
        if (string.IsNullOrWhiteSpace(departmentName) || departmentName.Length > 120)
            return;

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, departmentName.Trim());
    }
}
