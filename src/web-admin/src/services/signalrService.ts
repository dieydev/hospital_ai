import * as signalR from '@microsoft/signalr';

type QueueUpdateCallback = (data: any) => void;

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacks: QueueUpdateCallback[] = [];
  private isConnecting = false;

  public initConnection() {
    if (this.connection || this.isConnecting) return;

    this.isConnecting = true;
    const hubUrl = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5000/hubs/queue';

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('ReceiveGlobalQueueUpdate', (data: any) => {
      this.callbacks.forEach((cb) => cb(data));
    });

    this.connection.on('ReceiveQueueUpdate', (data: any) => {
      this.callbacks.forEach((cb) => cb(data));
    });

    this.connection
      .start()
      .then(() => {
        this.isConnecting = false;
        console.log('⚡ SignalR QueueHub connected successfully.');
      })
      .catch((err) => {
        this.isConnecting = false;
        console.warn('SignalR QueueHub connection failed, fallback to polling mode:', err);
      });
  }

  public subscribeQueueUpdates(callback: QueueUpdateCallback): () => void {
    this.callbacks.push(callback);
    if (!this.connection) {
      this.initConnection();
    }
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  public async broadcastUpdate(data: any) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke('BroadcastQueueUpdate', 'GLOBAL', data);
      } catch (err) {
        console.warn('Failed to broadcast SignalR event:', err);
      }
    }
  }
}

export const signalrService = new SignalRService();
