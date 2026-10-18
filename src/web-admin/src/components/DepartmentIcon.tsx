import React from 'react';

interface DepartmentIconProps {
  deptId?: string;
  deptName?: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Standard Medical Specialty Icons (Biểu tượng chuyên khoa y tế chuẩn)
 * Chuẩn hóa bộ icon chuyên khoa y khoa trực quan, hiện đại, sắc nét
 */
export const DepartmentIcon: React.FC<DepartmentIconProps> = ({
  deptId = '',
  deptName = '',
  size = 22,
  color = 'currentColor',
  className = '',
  style = {},
}) => {
  // Chuẩn hóa ID hoặc tên để nhận diện khoa
  const key = (deptId || deptName).toLowerCase();

  const svgProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style },
  };

  // 1. Khoa Tim Mạch Can Thiệp
  if (key.includes('tim') || key.includes('cardio')) {
    return (
      <svg {...svgProps}>
        {/* Heart shape with ECG pulse line */}
        <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
        <path d="M5.5 13h3.5l1.5 -3l2.5 6l1.5 -3h4" strokeWidth={2.2} />
      </svg>
    );
  }

  // 2. Khoa Tiêu Hóa & Gan Mật
  if (key.includes('tieu-hoa') || key.includes('tieu hoa') || key.includes('gan') || key.includes('da day')) {
    return (
      <svg {...svgProps}>
        {/* Anatomical stomach / gastro silhouette */}
        <path d="M7 4c1 1 2 2.5 2 4.5c0 1.5-.5 3-1.5 4c-1.5 1.5-2 3.5-1.5 5.5c.8 3 4 5 7.5 5c4.5 0 7.5-3.5 7.5-7.5c0-4-3-6-5-6.5c-1-.25-2-1.5-2-3c0-1.5.5-2 1.5-2.5" />
        <path d="M10 13c1.5 1.5 3.5 1.5 5 0" strokeWidth={1.8} />
        <circle cx="14" cy="9.5" r="1" fill={color} stroke="none" />
      </svg>
    );
  }

  // 3. Khoa Nhi & Tiêm Chủng
  if (key.includes('nhi') || key.includes('tiem') || key.includes('pediatric')) {
    return (
      <svg {...svgProps}>
        {/* Baby face with lock of hair and smile */}
        <circle cx="12" cy="13" r="8" />
        <path d="M9.5 12a.5.5 0 1 0 0-.01" strokeWidth={3} strokeLinecap="round" />
        <path d="M14.5 12a.5.5 0 1 0 0-.01" strokeWidth={3} strokeLinecap="round" />
        <path d="M9.5 15.5c.8 1 1.7 1.5 2.5 1.5s1.7-.5 2.5-1.5" />
        {/* Cute hair curl on top */}
        <path d="M12 5c-1-1.5 0-3 1.5-2s.5 2-1.5 2" />
        {/* Baby cheek pacifier / blush marks */}
        <path d="M4 13a1 1 0 0 1-1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1-1 1z" fill={color} />
        <path d="M20 13a1 1 0 0 1-1-1v-1a1 1 0 0 1 2 0v1a1 1 0 0 1-1 1z" fill={color} />
      </svg>
    );
  }

  // 4. Khoa Mắt (Nhãn Khoa)
  if (key.includes('mat') || key.includes('nhan khoa') || key.includes('eye')) {
    return (
      <svg {...svgProps}>
        {/* Eye contour */}
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
        {/* Iris */}
        <circle cx="12" cy="12" r="3.5" />
        {/* Pupil light reflection */}
        <circle cx="13" cy="11" r="1.2" fill={color} stroke="none" />
      </svg>
    );
  }

  // 5. Khoa Tai Mũi Họng (TMH)
  if (key.includes('tai') || key.includes('mui') || key.includes('hong') || key.includes('tmh') || key.includes('ent')) {
    return (
      <svg {...svgProps}>
        {/* Anatomical ear and sound resonance wave */}
        <path d="M6 8.5a6.5 6.5 0 1 1 11.5 4c-.8 1-1.5 2-1.5 3.5a3.5 3.5 0 0 1-3.5 3.5c-2.5 0-4-1.8-4-4.5" />
        <path d="M10 11.5c.5-.8 1.5-1 2.2-.5s1 1.5.5 2.5c-.8 1.5-1.7 1.8-1.7 2.5" strokeWidth={1.8} />
        {/* Sound waves emitted */}
        <path d="M18.5 7a6 6 0 0 1 0 7" strokeWidth={1.8} />
        <path d="M21 5a9.5 9.5 0 0 1 0 11" strokeWidth={1.8} />
      </svg>
    );
  }

  // 6. Khoa Răng Hàm Mặt
  if (key.includes('rang') || key.includes('ham') || key.includes('nha khoa') || key.includes('dental')) {
    return (
      <svg {...svgProps}>
        {/* Anatomical tooth / molar */}
        <path d="M7 4.5c2.5-1.5 7.5-1.5 10 0c2 1.2 2.5 4 2 7c-.6 3.5-2 9-4 9c-1.5 0-2-3-3-3s-1.5 3-3 3c-2 0-3.4-5.5-4-9c-.5-3 0-5.8 2-7z" />
        {/* Tooth crown highlight shine */}
        <path d="M9 7.5c1.5-.7 4.5-.7 6 0" strokeWidth={1.8} />
      </svg>
    );
  }

  // 7. Khoa Ngoại Tổng Quát & Chấn Thương Chỉnh Hình
  if (key.includes('ngoai') || key.includes('chan thuong') || key.includes('chinh hinh') || key.includes('ortho')) {
    return (
      <svg {...svgProps}>
        {/* Orthopedic bone / joint and surgical cross */}
        <path d="M17 3.5a2.5 2.5 0 0 1 2.5 2.5c0 .7-.3 1.3-.8 1.8l-1.4 1.4c-.2.2-.3.5-.3.8v.1c.4 1 .1 2.2-.8 3.1l-6.5 6.5a2.8 2.8 0 0 1-3.9 0a2.8 2.8 0 0 1 0-3.9l6.5-6.5c.9-.9 2.1-1.2 3.1-.8h.1c.3 0 .6-.1.8-.3l1.4-1.4c.5-.5 1.1-.8 1.8-.8a2.5 2.5 0 0 1 .5.05" />
        {/* Scalpel / surgical cross line */}
        <path d="M4 20l4-4" strokeWidth={2.5} />
        <path d="M15 7l2 2" strokeWidth={2} />
      </svg>
    );
  }

  // 8. Khoa Da Liễu & Thẩm Mỹ Y Khoa
  if (key.includes('da') || key.includes('lieu') || key.includes('tham my') || key.includes('derma')) {
    return (
      <svg {...svgProps}>
        {/* Moisture drop of pure clinical serum on delicate skin */}
        <path d="M12 2.5c0 0-6 7-6 11.5a6 6 0 0 0 12 0c0-4.5-6-11.5-6-11.5z" />
        {/* Skin radiance sparkle */}
        <path d="M12 8a3.5 3.5 0 0 0-3.5 3.5" strokeWidth={1.8} />
        <circle cx="19" cy="5" r="1.5" fill={color} stroke="none" />
        <circle cx="5" cy="18" r="1" fill={color} stroke="none" />
      </svg>
    );
  }

  // 9. Khoa Nội Tổng Hợp & Mặc định (Stethoscope - Ống nghe y khoa chuẩn)
  return (
    <svg {...svgProps}>
      {/* Clinical Stethoscope */}
      <path d="M4.5 4v5a4.5 4.5 0 0 0 9 0v-5" />
      <path d="M3 4h3" />
      <path d="M12 4h3" />
      <path d="M9 13.5v3a4.5 4.5 0 0 0 9 0v-2.5" />
      <circle cx="18" cy="11.5" r="2.5" />
      <circle cx="18" cy="11.5" r="0.8" fill={color} stroke="none" />
    </svg>
  );
};

export default DepartmentIcon;
