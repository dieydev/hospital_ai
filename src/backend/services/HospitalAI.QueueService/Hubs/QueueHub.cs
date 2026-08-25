using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace HospitalAI.QueueService.Hubs;

public class QueueHub : Hub
{
    public async Task JoinDepartmentQueue(string departmentName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, departmentName);
    }

    public async Task LeaveDepartmentQueue(string departmentName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, departmentName);
    }

    public async Task BroadcastQueueUpdate(string departmentName, object queueData)
    {
        await Clients.Group(departmentName).SendAsync("ReceiveQueueUpdate", queueData);
        await Clients.All.SendAsync("ReceiveGlobalQueueUpdate", queueData);
    }
}
