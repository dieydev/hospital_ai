import React from 'react';
import { Tag } from 'antd';

interface StatusChipProps {
  status: 'Examining' | 'WaitingForCLS' | 'Done';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  switch (status) {
    case 'Examining':
      return <Tag color="processing">Đang Khám</Tag>;
    case 'WaitingForCLS':
      return <Tag color="warning">Chờ Chẩn đoán Hình ảnh/Xét nghiệm</Tag>;
    case 'Done':
      return <Tag color="success">Đã Khám Xong</Tag>;
    default:
      return <Tag color="default">{status}</Tag>;
  }
};
