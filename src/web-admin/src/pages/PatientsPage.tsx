import React from 'react';
import { Table, Button, Space, Input, Tag, Typography } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { Patient } from '../types';

const { Title } = Typography;

export const PatientsPage: React.FC = () => {
  const samplePatients: Patient[] = [
    { id: '1', maBenhNhan: 'BN20260001', hoTen: 'Nguyễn Văn An', gioiTinh: 'Male', ngaySinh: '1990-05-15', soCCCD: '038090001234', maTheBHYT: 'DN40101234567', diaChi: 'TP. Thủ Dầu Một, Bình Dương' },
    { id: '2', maBenhNhan: 'BN20260002', hoTen: 'Trần Thị Bình', gioiTinh: 'Female', ngaySinh: '1985-11-20', soCCCD: '038185005678', maTheBHYT: 'GD40109876543', diaChi: 'TP. Hồ Chí Minh' },
  ];

  const columns = [
    { title: 'Mã BN', dataIndex: 'maBenhNhan', key: 'maBenhNhan' },
    { title: 'Họ và Tên', dataIndex: 'hoTen', key: 'hoTen' },
    { title: 'Giới tính', dataIndex: 'gioiTinh', key: 'gioiTinh', render: (g: string) => <Tag color={g === 'Male' ? 'blue' : 'pink'}>{g === 'Male' ? 'Nam' : 'Nữ'}</Tag> },
    { title: 'Ngày sinh', dataIndex: 'ngaySinh', key: 'ngaySinh' },
    { title: 'Số CCCD', dataIndex: 'soCCCD', key: 'soCCCD' },
    { title: 'Thẻ BHYT', dataIndex: 'maTheBHYT', key: 'maTheBHYT' },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: Patient) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} type="link">Hồ sơ EMR ({record.maBenhNhan})</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3}>Danh sách Bệnh nhân</Title>
        <Space>
          <Input placeholder="Tìm kiếm theo CCCD/Tên/Mã BN..." prefix={<SearchOutlined />} style={{ width: 300 }} />
          <Button type="primary" icon={<PlusOutlined />}>Tiếp nhận Bệnh nhân Mới</Button>
        </Space>
      </div>
      <Table dataSource={samplePatients} columns={columns} rowKey="id" />
    </div>
  );
};
