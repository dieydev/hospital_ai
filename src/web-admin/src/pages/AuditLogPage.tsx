import React from 'react';
import { Card, Table, Tag, Typography, Space, Input } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { AuditLog } from '../types';

const { Title, Text } = Typography;

export const AuditLogPage: React.FC = () => {
  const auditLogs: AuditLog[] = [
    {
      id: 'log-001',
      thoiGian: '2026-08-02 09:30:15',
      nguoiThucHien: 'BS. CKII. Nguyễn Thanh Duy',
      vaiTro: 'Doctor',
      hanhDong: 'HOÀN TẤT KHÁM & TẠO ĐƠN THUỐC',
      module: 'Khám bệnh (SOAP)',
      chiTiet: 'Tạo EMR lượt khám LK20260802-01 cho BN Nguyễn Văn An (BN20260001). Gắn mã ICD-10 J02.9.',
      ipAddress: '192.168.1.45',
      isAiAction: false,
    },
    {
      id: 'log-002',
      thoiGian: '2026-08-02 09:25:40',
      nguoiThucHien: 'BS. CKII. Nguyễn Thanh Duy',
      vaiTro: 'Doctor',
      hanhDong: 'GỌI TRỢ LÝ AI GEMINI',
      module: 'Trợ lý AI Y tế',
      chiTiet: 'AI gợi ý mã bệnh ICD-10 dựa trên triệu chứng [Đau họng, sốt 38°C, ho khan]. Kết quả: J02.9 (98%).',
      ipAddress: '192.168.1.45',
      isAiAction: true,
    },
    {
      id: 'log-003',
      thoiGian: '2026-08-02 09:15:02',
      nguoiThucHien: 'Lễ tân Trần Thị Hương',
      vaiTro: 'Receptionist',
      hanhDong: 'CẤP SỐ THỨ TỰ KHÁM',
      module: 'Tiếp nhận bệnh nhân',
      chiTiet: 'Cấp số STT #101 cho bệnh nhân Nguyễn Văn An (Phòng 102 - Khoa Nội).',
      ipAddress: '192.168.1.12',
      isAiAction: false,
    },
    {
      id: 'log-004',
      thoiGian: '2026-08-02 08:50:11',
      nguoiThucHien: 'Bệnh nhân Nguyễn Văn An',
      vaiTro: 'Patient (Mobile App)',
      hanhDong: 'ĐẶT LỊCH KHÁM TRỰC TUYẾN',
      module: 'Mobile App Flutter',
      chiTiet: 'Đặt lịch khám thành công ngày 02/08/2026 khung giờ 09:00 - 09:30 tại Khoa Nội.',
      ipAddress: '14.226.12.89',
      isAiAction: false,
    },
  ];

  const columns = [
    { title: 'Thời gian', dataIndex: 'thoiGian', key: 'thoiGian', width: 170, render: (t: string) => <Text style={{ fontSize: 13 }}>{t}</Text> },
    { title: 'Người thực hiện', dataIndex: 'nguoiThucHien', key: 'nguoiThucHien', render: (n: string, r: AuditLog) => <Space><UserOutlined /><Text strong>{n}</Text><Tag color="blue">{r.vaiTro}</Tag></Space> },
    { title: 'Hành động', dataIndex: 'hanhDong', key: 'hanhDong', render: (h: string, r: AuditLog) => <Tag color={r.isAiAction ? 'purple' : 'green'}>{h}</Tag> },
    { title: 'Phân hệ', dataIndex: 'module', key: 'module' },
    { title: 'Chi tiết thao tác', dataIndex: 'chiTiet', key: 'chiTiet' },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 120, render: (ip: string) => <Text type="secondary">{ip}</Text> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Nhật ký & Kiểm toán Hệ thống (Audit Log)</Title>
          <Text type="secondary">Ghi nhận toàn bộ lịch sử thao tác người dùng, truy vết dữ liệu y tế & Nhật ký AI Gemini</Text>
        </div>
        <Input placeholder="Tìm kiếm nhật ký theo Tên / Thao tác / IP..." prefix={<SearchOutlined />} style={{ width: 340 }} />
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={auditLogs} columns={columns} rowKey="id" />
      </Card>
    </div>
  );
};
