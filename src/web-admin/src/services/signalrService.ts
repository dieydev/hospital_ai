import * as signalR from '@microsoft/signalr';
import { notification } from 'antd';

export type QueueUpdateCallback = (data: any) => void;

/**
 * Phát âm thanh chuông báo y tế (Two-Tone Medical Chime: D5 587.33Hz -> A5 880Hz)
 * Sử dụng Web Audio API không phụ thuộc file MP3 ngoại vi, hoạt động ngay lập tức và mượt mà trên mọi trình duyệt.
 */
export const playMedicalChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (Note D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Tone 2: 880.00 Hz (Note A5) - Chuông ngân cao
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.22);
    gain2.gain.setValueAtTime(0.3, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.95);
  } catch (err) {
    console.warn('Không thể phát chuông báo AudioContext:', err);
  }
};

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private callbacks: QueueUpdateCallback[] = [];
  private isConnecting = false;
  private isSoundEnabled = true;

  public setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }

  public getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  public playChime() {
    if (this.isSoundEnabled) {
      playMedicalChime();
    }
  }

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

    // 1. Nhận sự kiện Bệnh nhân mới từ App hoặc Tiếp tân
    this.connection.on('NewPatientInQueue', (data: any) => {
      console.log('⚡ [SignalR] Bệnh nhân mới vào hàng chờ:', data);
      this.playChime();

      const patientName = data?.patientName || 'Bệnh nhân mới';
      const seq = data?.sequenceNumber ? `#${data.sequenceNumber}` : '';
      const dept = data?.departmentName || 'Phòng khám';

      notification.info({
        message: '🔔 Có Bệnh Nhân Mới Vào Hàng Chờ!',
        description: `${patientName} (${seq}) vừa đăng ký khám tại ${dept}. Danh sách đã được tự động cập nhật.`,
        placement: 'topRight',
        duration: 4.5,
      });

      this.notifySubscribers(data);
    });

    // 2. Nhận sự kiện Lịch hẹn mới từ Mobile App
    this.connection.on('ReceiveNewAppointment', (data: any) => {
      console.log('⚡ [SignalR] Lịch hẹn mới từ Mobile App:', data);
      this.playChime();

      const patientName = data?.patientName || 'Bệnh nhân';
      const doctor = data?.doctorName ? `với ${data.doctorName}` : '';
      const dept = data?.departmentName || '';

      notification.success({
        message: '📅 Bệnh Nhân Đặt Lịch Trực Tuyến Mới!',
        description: `${patientName} vừa đặt khám ${doctor} (${dept}).`,
        placement: 'topRight',
        duration: 5,
      });

      this.notifySubscribers(data);
    });

    // 3. Nhận cập nhật chung hàng chờ
    this.connection.on('ReceiveGlobalQueueUpdate', (data: any) => {
      this.notifySubscribers(data);
    });

    this.connection.on('ReceiveQueueUpdate', (data: any) => {
      this.notifySubscribers(data);
    });

    this.connection.on('ReceiveCallingPatient', (data: any) => {
      this.notifySubscribers(data);
    });

    this.connection.on('ReceiveQueueStatusChanged', (data: any) => {
      this.notifySubscribers(data);
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

  private notifySubscribers(data: any) {
    this.callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Lỗi khi gọi SignalR callback:', err);
      }
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
