import { API_BASE_URL } from '../services/api';
import { playMedicalChime } from '../services/signalrService';

export interface SpeakVietnameseOptions {
  /** Phát tiếng chuông gọi số bệnh viện trước khi đọc lời thoại (mặc định: true) */
  chime?: boolean;
  /** Tốc độ đọc fallback Web Speech API */
  rate?: number;
  /** Cao độ giọng fallback Web Speech API */
  pitch?: number;
  /** Header bổ sung (VD: header xác thực Kiosk khi chưa đăng nhập Staff JWT) */
  headers?: Record<string, string>;
}

const MAX_TTS_CHARS = 340;
const MAX_CACHED_BLOBS = 40;
const CHIME_LEAD_MS = 460;
const TTS_FETCH_TIMEOUT_MS = 4000;

const audioUrlCache = new Map<string, string>();
let activeAudio: HTMLAudioElement | null = null;
let activeTimer: ReturnType<typeof setTimeout> | null = null;
let speechGeneration = 0;

const normalizeSpeechText = (raw: string): string => {
  const collapsed = (raw || '').replace(/\s+/g, ' ').trim();
  if (collapsed.length <= MAX_TTS_CHARS) return collapsed;
  return collapsed.slice(0, MAX_TTS_CHARS).trim();
};

const clearActiveTimersAndAudio = () => {
  if (activeTimer !== null) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore cleanup error
    }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore cleanup error
    }
  }
};

export const stopVietnameseSpeech = () => {
  speechGeneration += 1;
  clearActiveTimersAndAudio();
};

const pickBestVietnameseVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  if (!voices.length) return null;
  const viVoices = voices.filter((v) => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return lang.startsWith('vi') || name.includes('viet') || name.includes('tiếng việt') || name.includes('hoaimy') || name.includes('namminh');
  });
  if (!viVoices.length) return null;

  const preferred = viVoices.find((v) =>
    /hoaimy|namminh|natural|online|google|linh|an\b/i.test(v.name || '')
  );
  return preferred || viVoices[0];
};

const loadVoicesAsync = async (timeoutMs = 350): Promise<SpeechSynthesisVoice[]> => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length > 0) return immediate;

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', finish);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', finish);
    setTimeout(finish, timeoutMs);
  });
};

const speakWithBrowserFallback = async (
  text: string,
  rate: number,
  pitch: number,
  expectedGen: number
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const voices = await loadVoicesAsync();
  if (expectedGen !== speechGeneration) return;

  const viVoice = pickBestVietnameseVoice(voices);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = rate;
  utterance.pitch = pitch;
  if (viVoice) {
    utterance.voice = viVoice;
  }

  // Khoảng trễ nhỏ sau cancel() để tránh lỗi Chromium tự nuốt utterance mới
  activeTimer = setTimeout(() => {
    activeTimer = null;
    if (expectedGen !== speechGeneration) return;
    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore speech errors
    }
  }, 60);
};

const getCachedOrFetchTtsBlobUrl = async (
  normalizedText: string,
  extraHeaders?: Record<string, string>
): Promise<string | null> => {
  const cached = audioUrlCache.get(normalizedText);
  if (cached) return cached;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { ...(extraHeaders || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), TTS_FETCH_TIMEOUT_MS);

  try {
    const base = API_BASE_URL.replace(/\/+$/, '');
    const resp = await fetch(`${base}/queue/tts?text=${encodeURIComponent(normalizedText)}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    if (!resp.ok) return null;

    const blob = await resp.blob();
    if (!blob || blob.size < 64) return null;

    const objectUrl = URL.createObjectURL(blob);
    if (audioUrlCache.size >= MAX_CACHED_BLOBS) {
      const oldestKey = audioUrlCache.keys().next().value;
      if (oldestKey) {
        const oldUrl = audioUrlCache.get(oldestKey);
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        audioUrlCache.delete(oldestKey);
      }
    }
    audioUrlCache.set(normalizedText, objectUrl);
    return objectUrl;
  } catch {
    return null;
  } finally {
    clearTimeout(abortTimer);
  }
};

/**
 * Phát loa thông báo Tiếng Việt ổn định trên mọi trình duyệt (Chrome/Edge/Kiosk):
 * 1) Phát chuông báo y tế nhẹ nhàng ngay khi thao tác (Web Audio).
 * 2) Tải luồng MP3 Tiếng Việt qua endpoint /api/queue/tts (đồng bộ không phụ thuộc voice Windows).
 * 3) Tự động dự phòng bằng Web Speech API chọn đúng voice vi-VN nếu ngoại tuyến hoặc không đủ quyền.
 */
export const speakVietnamese = async (
  rawText: string,
  options: SpeakVietnameseOptions = {}
): Promise<void> => {
  if (typeof window === 'undefined') return;
  const normalized = normalizeSpeechText(rawText);
  if (!normalized) return;

  const currentGen = ++speechGeneration;
  clearActiveTimersAndAudio();

  const shouldChime = options.chime !== false;
  const chimeEndTime = shouldChime ? Date.now() + CHIME_LEAD_MS : Date.now();
  if (shouldChime) {
    playMedicalChime();
  }

  const blobUrl = await getCachedOrFetchTtsBlobUrl(normalized, options.headers);
  if (currentGen !== speechGeneration) return;

  const remainingChimeMs = Math.max(0, chimeEndTime - Date.now());
  if (remainingChimeMs > 0) {
    await new Promise<void>((resolve) => {
      activeTimer = setTimeout(() => {
        activeTimer = null;
        resolve();
      }, remainingChimeMs);
    });
  }
  if (currentGen !== speechGeneration) return;

  if (blobUrl) {
    try {
      const audio = new Audio(blobUrl);
      activeAudio = audio;
      audio.onended = () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }
      };
      audio.onerror = () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }
      };
      await audio.play();
      return;
    } catch {
      if (currentGen !== speechGeneration) return;
      activeAudio = null;
    }
  }

  await speakWithBrowserFallback(
    normalized,
    options.rate ?? 0.95,
    options.pitch ?? 1.0,
    currentGen
  );
};
