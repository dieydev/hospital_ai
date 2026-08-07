import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Space, Input } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import { AuditLog } from '../types';
import { useThemeStore } from '../store/useThemeStore';

const { Title, Text } = Typography;

export const AuditLogPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const [searchKeyword, setSearchKeyword] = useState('');

  const [auditLogs] = useState<AuditLog[]>([
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
  ]);

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchKeyword) return true;
    const q = searchKeyword.toLowerCase();
    return (
      log.nguoiThucHien.toLowerCase().includes(q) ||
      log.hanhDong.toLowerCase().includes(q) ||
      log.module.toLowerCase().includes(q) ||
      log.chiTiet.toLowerCase().includes(q) ||
      log.ipAddress.includes(q)
    );
  });

  const columns = [
    { title: 'Thời gian', dataIndex: 'thoiGian', key: 'thoiGian', width: 170, render: (t: string) => <Text style={{ fontSize: 13, color: isDarkMode ? '#cbd5e1' : undefined }}>{t}</Text> },
    {
      title: 'Người thực hiện',
      dataIndex: 'nguoiThucHien',
      key: 'nguoiThucHien',
      render: (n: string, r: AuditLog) => (
        <Space>
          <UserOutlined style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }} />
          <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{n}</Text>
          <Tag color="blue">{r.vaiTro}</Tag>
        </Space>
      )
    },
    { title: 'Hành động', dataIndex: 'hanhDong', key: 'hanhDong', render: (h: string, r: AuditLog) => <Tag color={r.isAiAction ? 'purple' : 'green'}>{h}</Tag> },
    { title: 'Phân hệ', dataIndex: 'module', key: 'module' },
    { title: 'Chi tiết thao tác', dataIndex: 'chiTiet', key: 'chiTiet', render: (c: string) => <Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>{c}</Text> },
    { title: 'IP Address', dataIndex: 'ipAddress', key: 'ipAddress', width: 120, render: (ip: string) => <Text type="secondary" style={{ fontFamily: 'monospace' }}>{ip}</Text> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: isDarkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
          padding: '20px 24px',
          borderRadius: '12px',
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(2, 132, 199, 0.08)'
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
            Nhật ký & Kiểm toán Hệ thống (Audit Log)
          </Title>
          <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
            Ghi nhận toàn bộ lịch sử thao tác người dùng, truy vết dữ liệu y tế & Nhật ký AI Gemini
          </Text>
        </div>
        <Input
          placeholder="Tìm kiếm nhật ký theo Tên / Thao tác / IP..."
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          style={{ width: 340 }}
        />
      </div>

      <Card style={{ borderRadius: 12, border: isDarkMode ? '1px solid #334155' : undefined }}>
        <Table dataSource={filteredLogs} columns={columns} rowKey="id" />
      </Card>
    </div>
  );
};
