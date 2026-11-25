import React, { useEffect, useRef, useState } from 'react';
import { Button, Space, Tag } from 'antd';
import {
  ScanOutlined,
  VideoCameraOutlined,
  VideoCameraAddOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import jsQR from 'jsqr';
import { showToast } from '../utils/sweetAlert';

interface KioskQrScannerProps {
  value: string;
  onChange: (val: string) => void;
  onScanSubmit: (decoded: string) => void;
  isProcessing?: boolean;
  placeholder?: string;
  submitText?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

/**
 * Phát âm thanh "Tít" chuẩn máy quét mã vạch Kiosk bằng Web Audio API
 */
export const playScannerBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180, ctx.currentTime);
    osc.frequency.setValueAtTime(1480, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  } catch {
    // ignore audio restrictions
  }
};

/**
 * Bộ quét QR thực tế:
 * 1. Đọc trực tiếp từ Webcam theo thời gian thực qua jsQR (hỗ trợ đa trình duyệt)
 * 2. Tải ảnh QR / ảnh CCCD để giải mã trực tiếp bằng Canvas + jsQR
 * 3. Hỗ trợ súng bắn mã vạch USB (auto-focus + Enter) & nhập tay
 */
export const KioskQrScanner: React.FC<KioskQrScannerProps> = ({
  value,
  onChange,
  onScanSubmit,
  isProcessing = false,
  placeholder = 'Quét QR, CCCD gắn chip hoặc nhập Mã BN / STT / SĐT...',
  submitText = 'Kiểm Tra & Cấp Số',
  inputRef: externalRef,
}) => {
  const internalRef = useRef<HTMLInputElement | null>(null);
  const activeInputRef = externalRef || internalRef;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastDecodedRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const lastScanFrameTimeRef = useRef<number>(0);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanPulse, setScanPulse] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleToggleCamera = async () => {
    if (isCameraActive) {
      stopCamera();
      setCameraError(null);
      return;
    }

    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập camera trực tiếp (cần HTTPS hoặc localhost).');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      showToast('Đã bật Camera quét QR thời gian thực!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể mở camera hoặc quyền bị từ chối.';
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  // Gắn MediaStream vào <video> sau khi DOM render & chạy vòng lặp giải mã jsQR thực tế
  useEffect(() => {
    if (!isCameraActive) return;

    let animationFrameId = 0;
    const videoEl = videoRef.current;
    if (videoEl && streamRef.current) {
      videoEl.srcObject = streamRef.current;
      videoEl.play().catch(() => {});
    }

    const scanLoop = (timestamp: number) => {
      if (!isCameraActive) return;

      // Throttle giải mã ~150ms/lần để mượt mà, không gây quá tải CPU
      if (timestamp - lastScanFrameTimeRef.current >= 150) {
        lastScanFrameTimeRef.current = timestamp;
        const vid = videoRef.current;
        const canvas = canvasRef.current;
        if (vid && canvas && vid.readyState === vid.HAVE_ENOUGH_DATA && vid.videoWidth > 0) {
          canvas.width = vid.videoWidth;
          canvas.height = vid.videoHeight;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code?.data) {
              const now = Date.now();
              const isRepeatCooldown =
                lastDecodedRef.current.text === code.data && now - lastDecodedRef.current.time < 3000;

              if (!isRepeatCooldown) {
                lastDecodedRef.current = { text: code.data, time: now };
                playScannerBeep();
                setScanPulse(true);
                setTimeout(() => setScanPulse(false), 600);
                onChange(code.data);
                onScanSubmit(code.data);
              }
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanLoop);
    };

    animationFrameId = requestAnimationFrame(scanLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isCameraActive, onChange, onScanSubmit]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Giải mã QR từ file ảnh tải lên (hữu ích khi kiểm thử ảnh QR / ảnh CCCD)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (decoded?.data) {
          playScannerBeep();
          onChange(decoded.data);
          onScanSubmit(decoded.data);
          showToast('Đã đọc thành công mã QR từ hình ảnh!', 'success');
        } else {
          showToast('Không phát hiện thấy mã QR rõ nét trong ảnh này.', 'warning');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div>
      {/* Khung quét quang học thực tế */}
      <div
        style={{
          position: 'relative',
          width: 300,
          height: 240,
          margin: '0 auto 14px',
          borderRadius: 18,
          backgroundColor: '#0f172a',
          overflow: 'hidden',
          boxShadow: scanPulse
            ? '0 0 0 4px #10b981, 0 12px 30px rgba(16, 185, 129, 0.35)'
            : '0 10px 28px rgba(2, 132, 199, 0.2)',
          border: `2px solid ${scanPulse ? '#10b981' : '#0284c7'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        {isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              padding: 16,
              textAlign: 'center',
            }}
          >
            <ScanOutlined style={{ fontSize: 58, color: '#38bdf8', marginBottom: 10 }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ffffff', letterSpacing: 1 }}>
              SẴN SÀNG QUÉT QR / CCCD
            </div>
            <div style={{ fontSize: 11, color: '#7dd3fc', marginTop: 4 }}>
              Đưa mã trước đầu đọc hoặc bật Camera Webcam
            </div>
          </div>
        )}

        {/* 4 góc định vị */}
        <div style={{ position: 'absolute', top: 14, left: 14, width: 24, height: 24, borderTop: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
        <div style={{ position: 'absolute', top: 14, right: 14, width: 24, height: 24, borderTop: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />
        <div style={{ position: 'absolute', bottom: 14, left: 14, width: 24, height: 24, borderBottom: '3px solid #38bdf8', borderLeft: '3px solid #38bdf8' }} />
        <div style={{ position: 'absolute', bottom: 14, right: 14, width: 24, height: 24, borderBottom: '3px solid #38bdf8', borderRight: '3px solid #38bdf8' }} />

        {/* Tia laser quét */}
        <div
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            height: 2,
            backgroundColor: scanPulse ? '#10b981' : '#ef4444',
            boxShadow: `0 0 10px ${scanPulse ? '#10b981' : '#ef4444'}`,
            animation: 'scanLaser 2s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Canvas ẩn phục vụ giải mã khung hình video/ảnh */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {/* Thanh điều khiển Camera / Ảnh QR */}
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <Space wrap size={10}>
          <Tag color={isCameraActive ? 'success' : 'processing'} style={{ borderRadius: 12, fontWeight: 600 }}>
            {isCameraActive ? '● Camera đang giải mã QR thật' : '● Đầu đọc USB Barcode: Sẵn sàng'}
          </Tag>
          <Button
            size="small"
            icon={isCameraActive ? <VideoCameraAddOutlined /> : <VideoCameraOutlined />}
            onClick={handleToggleCamera}
            style={{ borderRadius: 8, borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}
          >
            {isCameraActive ? 'Tắt Camera' : 'Bật Camera Quét QR'}
          </Button>
          <Button
            size="small"
            icon={<UploadOutlined />}
            onClick={() => fileInputRef.current?.click()}
            style={{ borderRadius: 8, borderColor: '#bae6fd', color: '#0369a1', fontWeight: 600 }}
          >
            Đọc QR từ Ảnh
          </Button>
        </Space>
        {cameraError && (
          <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>⚠️ {cameraError}</div>
        )}
      </div>

      {/* Ô nhập / Nhận mã từ đầu đọc Barcode */}
      <Space.Compact style={{ width: '100%' }}>
        <input
          ref={activeInputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onScanSubmit(value)}
          style={{
            width: '100%',
            height: 48,
            padding: '0 14px',
            fontSize: 14.5,
            border: '2px solid #bae6fd',
            borderRadius: '10px 0 0 10px',
            outline: 'none',
            fontFamily: 'monospace',
            color: '#0f172a',
            backgroundColor: '#ffffff',
            fontWeight: 600,
          }}
        />
        <Button
          type="primary"
          loading={isProcessing}
          onClick={() => onScanSubmit(value)}
          style={{
            height: 48,
            padding: '0 20px',
            fontSize: 14.5,
            fontWeight: 700,
            backgroundColor: '#0284c7',
            borderColor: '#0284c7',
            borderRadius: '0 10px 10px 0',
          }}
        >
          {submitText}
        </Button>
      </Space.Compact>
    </div>
  );
};
