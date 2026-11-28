import React from 'react';

export type ServiceCardIconId =
  | 'hospital-booking'
  | 'specialty'
  | 'video-consult'
  | 'lab-test'
  | 'after-hours'
  | 'personal-care'
  | 'health-cert'
  | 'doctor-booking'
  | 'health-package'
  | 'home-care'
  | 'vaccine'
  | 'pharmacy'
  | 'corporate'
  | 'imaging';

interface ServiceCardIconProps {
  id: ServiceCardIconId;
  size?: number;
}

/**
 * Bộ icon minh họa đa sắc (Multi-Tone Medical Illustrations) cho 14 thẻ Dịch vụ Trang chủ.
 * Kết hợp bảng màu Y tế Số (#0284c7 / #0369a1) cùng các điểm nhấn màu sắc hài hòa, sắc nét.
 */
export const ServiceCardIcon: React.FC<ServiceCardIconProps> = ({ id, size = 38 }) => {
  const uid = `svc-${id}`;

  switch (id) {
    case 'hospital-booking':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-hdr`} x1="6" y1="8" x2="42" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <rect x="6" y="10" width="36" height="32" rx="7" fill="#ffffff" stroke="#0284c7" strokeWidth="2.2" />
          <path d="M6 17C6 13.134 9.134 10 13 10H35C38.866 10 42 13.134 42 17V20H6V17Z" fill={`url(#${uid}-hdr)`} />
          <rect x="14" y="6" width="4" height="8" rx="2" fill="#14b8a6" />
          <rect x="30" y="6" width="4" height="8" rx="2" fill="#14b8a6" />
          <rect x="13" y="25" width="22" height="12" rx="3" fill="#e0f2fe" />
          <rect x="22" y="27" width="4" height="8" rx="1.2" fill="#ef4444" />
          <rect x="20" y="29" width="8" height="4" rx="1.2" fill="#ef4444" />
        </svg>
      );

    case 'specialty':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-bag`} x1="6" y1="14" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path d="M18 14V11C18 9.343 19.343 8 21 8H27C28.657 8 30 9.343 30 11V14" stroke="#0369a1" strokeWidth="2.6" strokeLinecap="round" />
          <rect x="6" y="14" width="36" height="26" rx="7" fill={`url(#${uid}-bag)`} />
          <path d="M6 21C16 25 32 25 42 21" stroke="#bae6fd" strokeWidth="2" />
          <rect x="21" y="20" width="6" height="4" rx="1.5" fill="#fbbf24" />
          <circle cx="24" cy="31" r="6.5" fill="#ffffff" />
          <path d="M24 27.5V34.5M20.5 31H27.5" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );

    case 'video-consult':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-cam`} x1="5" y1="12" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <rect x="5" y="12" width="28" height="24" rx="6" fill={`url(#${uid}-cam)`} />
          <path d="M33 19.5L42.5 14C43.5 13.4 44.5 14.1 44.5 15.2V32.8C44.5 33.9 43.5 34.6 42.5 34L33 28.5V19.5Z" fill="#14b8a6" />
          <circle cx="19" cy="21" r="4" fill="#ffffff" />
          <path d="M12.5 31C12.5 27.686 15.41 25 19 25C22.59 25 25.5 27.686 25.5 31" fill="#bae6fd" />
          <circle cx="28" cy="17" r="3" fill="#22c55e" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );

    case 'lab-test':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-liq`} x1="12" y1="26" x2="36" y2="41" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
          </defs>
          <path d="M18 8H30M20 8V18L10.5 34.8C9.2 37.1 10.9 40 13.5 40H34.5C37.1 40 38.8 37.1 37.5 34.8L28 18V8" stroke="#0369a1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="#f0f9ff" />
          <path d="M15 27H33L36.2 33.8C36.8 35.4 35.6 37.5 33.8 37.5H14.2C12.4 37.5 11.2 35.4 11.8 33.8L15 27Z" fill={`url(#${uid}-liq)`} />
          <circle cx="20" cy="32" r="2" fill="#ffffff" />
          <circle cx="27.5" cy="30" r="1.6" fill="#fef08a" />
          <circle cx="24" cy="22" r="2.2" fill="#f59e0b" />
        </svg>
      );

    case 'after-hours':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-ring`} x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="25" r="16" fill="#ffffff" stroke={`url(#${uid}-ring)`} strokeWidth="3.2" />
          <circle cx="24" cy="25" r="11.5" fill="#eef2ff" />
          <path d="M24 17V25L29.5 28.5" stroke="#f97316" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="25" r="2.3" fill="#0369a1" />
          <circle cx="37" cy="12" r="6" fill="#fbbf24" />
          <path d="M39.5 8.5C37 9 35.5 11 36 13.5C36.3 15 37.5 16 39 16.5C36.8 17.5 34.2 16.5 33.2 14.3C32.2 12.1 33.2 9.5 35.4 8.5C36.8 7.9 38.3 7.9 39.5 8.5Z" fill="#fffbeb" />
        </svg>
      );

    case 'personal-care':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-rose`} x1="8" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
          <path d="M12 24C12 16.82 17.373 11 24 11C30.627 11 36 16.82 36 24" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
          <rect x="8" y="21" width="7" height="12" rx="3.5" fill={`url(#${uid}-rose)`} />
          <rect x="33" y="21" width="7" height="12" rx="3.5" fill={`url(#${uid}-rose)`} />
          <path d="M36 33C36 36.5 32.5 39 27 39H24" stroke="#0369a1" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="20" y="36.5" width="7" height="4.5" rx="2.2" fill="#14b8a6" />
          <path d="M24 29.5L19.5 25.2C18 23.8 18 21.4 19.5 20C20.9 18.7 23.1 18.8 24 20.4C24.9 18.8 27.1 18.7 28.5 20C30 21.4 30 23.8 28.5 25.2L24 29.5Z" fill="#f43f5e" />
        </svg>
      );

    case 'health-cert':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-doc`} x1="10" y1="8" x2="38" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect x="10" y="9" width="28" height="33" rx="6" fill={`url(#${uid}-doc)`} />
          <rect x="13" y="13" width="22" height="25" rx="3.5" fill="#ffffff" />
          <rect x="18" y="6" width="12" height="6" rx="3" fill="#fbbf24" />
          <circle cx="20" cy="21" r="3" fill="#0284c7" />
          <path d="M16 28.5C16 26.5 17.8 25 20 25C22.2 25 24 26.5 24 28.5" fill="#38bdf8" />
          <path d="M27 20H32M27 25H32M16 33H29" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="34" cy="34" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.6" />
          <path d="M31.5 34L33.2 35.7L36.5 32.3" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'doctor-booking':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-coat`} x1="10" y1="26" x2="38" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <circle cx="22" cy="16" r="7.5" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.6" />
          <path d="M15 14C16 10 19 8.5 22 8.5C25.5 8.5 28.5 10.5 29 14" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
          <path d="M9 39C9 31.82 14.82 26 22 26C29.18 26 35 31.82 35 39" fill={`url(#${uid}-coat)`} />
          <path d="M18 26.5L22 33L26 26.5" fill="#ffffff" />
          <path d="M16 28C16 33 19 36 22 36C25 36 28 33 28 28" stroke="#14b8a6" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="36" cy="14" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1.8" />
          <path d="M33.5 14L35.2 15.7L38.5 12.3" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'health-package':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-sh`} x1="10" y1="6" x2="38" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <path d="M24 6L39 12V23C39 32.5 32.5 39.5 24 42C15.5 39.5 9 32.5 9 23V12L24 6Z" fill={`url(#${uid}-sh)`} />
          <path d="M24 10L35 14.5V22.8C35 29.8 30.2 35.3 24 37.5C17.8 35.3 13 29.8 13 22.8V14.5L24 10Z" fill="#eff6ff" />
          <path d="M24 30.5L18.2 24.9C16.4 23.1 16.4 20.1 18.2 18.3C19.9 16.7 22.6 16.9 24 18.8C25.4 16.9 28.1 16.7 29.8 18.3C31.6 20.1 31.6 23.1 29.8 24.9L24 30.5Z" fill="#f43f5e" />
          <path d="M18 23.5H21L22.5 20.5L24.5 26L26 23.5H29.5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'home-care':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-roof`} x1="6" y1="8" x2="42" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
          <path d="M10 21V39C10 40.657 11.343 42 13 42H35C36.657 42 38 40.657 38 39V21L24 10L10 21Z" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
          <path d="M6 22.5L24 8L42 22.5" stroke={`url(#${uid}-roof)`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="29" r="7.5" fill="#10b981" />
          <path d="M24 25V33M20 29H28" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );

    case 'vaccine':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-syr`} x1="10" y1="36" x2="36" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f472b6" />
              <stop offset="100%" stopColor="#db2777" />
            </linearGradient>
          </defs>
          <path d="M32 8L40 16M36 12L31 17M14 34L8 40" stroke="#0369a1" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M28 14L34 20L20 34L14 28L28 14Z" fill="#fdf2f8" stroke="#db2777" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M24 18L30 24L20 34L14 28L24 18Z" fill={`url(#${uid}-syr)`} />
          <path d="M21 21L23 23M18 24L20 26" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="35" cy="34" r="6.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.6" />
          <path d="M32.5 34L34.2 35.7L37.5 32.3" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'pharmacy':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-ph`} x1="8" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <rect x="8" y="16" width="32" height="24" rx="5" fill="#ffffff" stroke="#059669" strokeWidth="2.2" />
          <path d="M6 17C6 12.5 9 9 13 9H35C39 9 42 12.5 42 17V20H6V17Z" fill={`url(#${uid}-ph)`} />
          <path d="M14 14.5H34" stroke="#d1fae5" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
          <rect x="13" y="25" width="12" height="10" rx="5" transform="rotate(-25 13 25)" fill="#f59e0b" />
          <rect x="18" y="22.8" width="6" height="10" rx="3" transform="rotate(-25 18 22.8)" fill="#ef4444" />
          <circle cx="31.5" cy="30.5" r="5.5" fill="#0284c7" />
          <path d="M31.5 27.5V33.5M28.5 30.5H34.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );

    case 'corporate':
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-bld`} x1="8" y1="8" x2="30" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <rect x="8" y="9" width="19" height="31" rx="4" fill={`url(#${uid}-bld)`} />
          <rect x="27" y="17" width="13" height="23" rx="3.5" fill="#38bdf8" />
          <rect x="12.5" y="14" width="4" height="4" rx="1" fill="#fef08a" />
          <rect x="19" y="14" width="4" height="4" rx="1" fill="#e0f2fe" />
          <rect x="12.5" y="21" width="4" height="4" rx="1" fill="#e0f2fe" />
          <rect x="19" y="21" width="4" height="4" rx="1" fill="#fef08a" />
          <rect x="31" y="22" width="4.5" height="4" rx="1" fill="#ffffff" />
          <rect x="31" y="29" width="4.5" height="4" rx="1" fill="#ffffff" />
          <circle cx="35" cy="14" r="6" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.6" />
          <path d="M35 11V17M32 14H38" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      );

    case 'imaging':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-xr`} x1="10" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          <rect x="9" y="8" width="30" height="32" rx="6" fill={`url(#${uid}-xr)`} />
          <rect x="13" y="12" width="22" height="24" rx="3.5" fill="#0f172a" />
          <path d="M24 15V32" stroke="#38bdf8" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M17.5 18.5C20.5 18.5 22 19.8 24 19.8C26 19.8 27.5 18.5 30.5 18.5" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
          <path d="M16.5 23.5C19.8 23.5 22 24.8 24 24.8C26 24.8 28.2 23.5 31.5 23.5" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <path d="M18 28.5C20.5 28.5 22.2 29.5 24 29.5C25.8 29.5 27.5 28.5 30 28.5" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" />
          <path d="M13 24H35" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
      );
  }
};
