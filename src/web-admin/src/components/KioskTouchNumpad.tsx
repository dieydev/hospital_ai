import React from 'react';
import { Button, Space } from 'antd';
import { ArrowLeftOutlined, ClearOutlined, EnterOutlined } from '@ant-design/icons';

interface KioskTouchNumpadProps {
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  showPrefixes?: boolean;
}

const DIGIT_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

/**
 * Bàn phím số cảm ứng chuyên dụng cho màn hình chạm Kiosk Sảnh Bệnh viện
 */
export const KioskTouchNumpad: React.FC<KioskTouchNumpadProps> = ({
  onKeyPress,
  onBackspace,
  onClear,
  onSubmit,
  submitLabel = 'Xác Nhận',
  showPrefixes = true,
}) => {
  const keyStyle: React.CSSProperties = {
    height: 46,
    fontSize: 17,
    fontWeight: 700,
    borderRadius: 10,
    border: '1px solid #bae6fd',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 2px 6px rgba(2, 132, 199, 0.08)',
  };

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 14,
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
      }}
    >
      {showPrefixes && (
        <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['BN2026', 'HEN-', '0'].map((prefix) => (
            <Button
              key={prefix}
              size="small"
              onClick={() => onKeyPress(prefix)}
              style={{
                borderRadius: 8,
                borderColor: '#7dd3fc',
                color: '#0369a1',
                fontWeight: 700,
                backgroundColor: '#ffffff',
              }}
            >
              + {prefix}
            </Button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {DIGIT_ROWS.flat().map((digit) => (
          <Button key={digit} onClick={() => onKeyPress(digit)} style={keyStyle}>
            {digit}
          </Button>
        ))}

        <Button
          onClick={onClear}
          icon={<ClearOutlined />}
          style={{ ...keyStyle, color: '#dc2626', borderColor: '#fecaca', backgroundColor: '#fef2f2', fontSize: 13 }}
        >
          Xóa hết
        </Button>

        <Button onClick={() => onKeyPress('0')} style={keyStyle}>
          0
        </Button>

        <Button
          onClick={onBackspace}
          icon={<ArrowLeftOutlined />}
          style={{ ...keyStyle, color: '#0369a1', backgroundColor: '#e0f2fe', fontSize: 13 }}
        >
          Lùi
        </Button>
      </div>

      {onSubmit && (
        <Space style={{ width: '100%', marginTop: 10 }} direction="vertical">
          <Button
            type="primary"
            block
            icon={<EnterOutlined />}
            onClick={onSubmit}
            style={{
              height: 44,
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 15,
              backgroundColor: '#0284c7',
            }}
          >
            {submitLabel}
          </Button>
        </Space>
      )}
    </div>
  );
};
