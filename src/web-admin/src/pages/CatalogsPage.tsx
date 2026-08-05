import React, { useState } from 'react';
import { Card, Table, Tabs, Button, Tag, Typography } from 'antd';
import { PlusOutlined, AppstoreOutlined, MedicineBoxOutlined, TeamOutlined, ReadOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showToast } from '../utils/sweetAlert';

const { Title, Text } = Typography;

export const CatalogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('doctors');
  const { isDarkMode } = useThemeStore();

  const doctorsData = [
    { id: '1', maNV: 'NV001', hoTen: 'BS. CKII. Nguyễn Thanh Duy', chuyenKhoa: 'Khoa Nội Tổng Hợp', chucVu: 'Trưởng Khoa', soDienThoai: '0336022526', trangThai: 'Hoạt động' },
    { id: '2', maNV: 'NV002', hoTen: 'BS. CKI. Phạm Minh Đức', chuyenKhoa: 'Khoa Nhi', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0912345999', trangThai: 'Hoạt động' },
    { id: '3', maNV: 'NV003', hoTen: 'BS. Trần Ngọc Mai', chuyenKhoa: 'Khoa Mắt', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0988776655', trangThai: 'Hoạt động' },
  ];

  const medicinesData = [
    { id: '1', maThuoc: 'TH001', tenThuoc: 'Paracetamol 500mg', hoatChat: 'Paracetamol', donViTinh: 'Viên', donGia: 1200, nhaSanXuat: 'Hasan - Dermapharm', trangThai: 'Đang kinh doanh' },
    { id: '2', maThuoc: 'TH002', tenThuoc: 'Augmentin 1g', hoatChat: 'Amoxicillin + Clavulanic Acid', donViTinh: 'Viên', donGia: 18500, nhaSanXuat: 'GSK', trangThai: 'Đang kinh doanh' },
    { id: '3', maThuoc: 'TH003', tenThuoc: 'Esomeprazole 40mg', hoatChat: 'Esomeprazole', donViTinh: 'Viên', donGia: 8500, nhaSanXuat: 'AstraZeneca', trangThai: 'Đang kinh doanh' },
  ];

  const servicesData = [
    { id: '1', maDV: 'DV001', tenDichVu: 'Khám Nội tổng hợp', loai: 'Khám bệnh', donGia: 150000, donGiaBHYT: 42100, khoa: 'Khoa Nội' },
    { id: '2', maDV: 'DV002', tenDichVu: 'Công thức máu toàn phần (CBC)', loai: 'Xét nghiệm', donGia: 85000, donGiaBHYT: 45000, khoa: 'Khoa Xét nghiệm' },
    { id: '3', maDV: 'DV003', tenDichVu: 'X-Quang Kỹ thuật số Phổi thẳng', loai: 'Chẩn đoán hình ảnh', donGia: 150000, donGiaBHYT: 68000, khoa: 'Khoa CĐHA' },
  ];

  const icd10Data = [
    { code: 'J02.9', name: 'Viêm họng cấp tính, không đặc hiệu', category: 'Bệnh hệ hô hấp (J00-J99)' },
    { code: 'J03.9', name: 'Viêm amydal cấp tính, không đặc hiệu', category: 'Bệnh hệ hô hấp (J00-J99)' },
    { code: 'K29.7', name: 'Viêm dạ dày, không đặc hiệu', category: 'Bệnh hệ tiêu hóa (K00-K93)' },
    { code: 'I10', name: 'Bệnh cao huyết áp vô căn (nguyên phát)', category: 'Bệnh hệ tuần hoàn (I00-I99)' },
    { code: 'E11.9', name: 'Bệnh đái tháo đường tuýp 2 không có biến chứng', category: 'Bệnh nội tiết & chuyển hóa (E00-E90)' },
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
            Quản trị Danh mục Hệ thống
          </Title>
          <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
            Quản lý Bác sĩ/Nhân viên, Thuốc, Dịch vụ y tế & Bộ mã chuẩn ICD-10
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
          onClick={() => showToast('Chức năng thêm mới danh mục đang được cập nhật!', 'info')}
        >
          Thêm Mục mới
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: isDarkMode ? '1px solid #334155' : undefined }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'doctors',
              label: (<span><TeamOutlined /> Đội ngũ Y bác sĩ</span>),
              children: (
                <Table
                  dataSource={doctorsData}
                  columns={[
                    { title: 'Mã NV', dataIndex: 'maNV', key: 'maNV', render: (c: string) => <Tag color="blue">{c}</Tag> },
                    { title: 'Họ và Tên', dataIndex: 'hoTen', key: 'hoTen', render: (t: string) => <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{t}</Text> },
                    { title: 'Chuyên Khoa', dataIndex: 'chuyenKhoa', key: 'chuyenKhoa' },
                    { title: 'Chức vụ', dataIndex: 'chucVu', key: 'chucVu' },
                    { title: 'Số điện thoại', dataIndex: 'soDienThoai', key: 'soDienThoai' },
                    { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai', render: (s: string) => <Tag color="green">{s}</Tag> },
                  ]}
                  rowKey="id"
                />
              ),
            },
            {
              key: 'medicines',
              label: (<span><MedicineBoxOutlined /> Danh mục Thuốc</span>),
              children: (
                <Table
                  dataSource={medicinesData}
                  columns={[
                    { title: 'Mã Thuốc', dataIndex: 'maThuoc', key: 'maThuoc', render: (c: string) => <Tag color="cyan">{c}</Tag> },
                    { title: 'Tên Thuốc', dataIndex: 'tenThuoc', key: 'tenThuoc', render: (t: string) => <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{t}</Text> },
                    { title: 'Hoạt chất', dataIndex: 'hoatChat', key: 'hoatChat' },
                    { title: 'ĐVT', dataIndex: 'donViTinh', key: 'donViTinh' },
                    { title: 'Đơn giá', dataIndex: 'donGia', key: 'donGia', render: (v: number) => formatCurrency(v) },
                    { title: 'Nhà sản xuất', dataIndex: 'nhaSanXuat', key: 'nhaSanXuat' },
                  ]}
                  rowKey="id"
                />
              ),
            },
            {
              key: 'services',
              label: (<span><AppstoreOutlined /> Dịch vụ & Bảng giá</span>),
              children: (
                <Table
                  dataSource={servicesData}
                  columns={[
                    { title: 'Mã DV', dataIndex: 'maDV', key: 'maDV', render: (c: string) => <Tag color="geekblue">{c}</Tag> },
                    { title: 'Tên Dịch vụ', dataIndex: 'tenDichVu', key: 'tenDichVu', render: (t: string) => <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{t}</Text> },
                    { title: 'Phân loại', dataIndex: 'loai', key: 'loai', render: (l: string) => <Tag color="blue">{l}</Tag> },
                    { title: 'Đơn giá Viện phí', dataIndex: 'donGia', key: 'donGia', render: (v: number) => formatCurrency(v) },
                    { title: 'BHYT Thanh toán', dataIndex: 'donGiaBHYT', key: 'donGiaBHYT', render: (v: number) => <Text style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(v)}</Text> },
                  ]}
                  rowKey="id"
                />
              ),
            },
            {
              key: 'icd10',
              label: (<span><ReadOutlined /> Danh mục ICD-10</span>),
              children: (
                <Table
                  dataSource={icd10Data}
                  columns={[
                    { title: 'Mã ICD-10', dataIndex: 'code', key: 'code', render: (c: string) => <Tag color="purple" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c}</Tag> },
                    { title: 'Tên Bệnh lý Tiêu chuẩn', dataIndex: 'name', key: 'name', render: (t: string) => <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{t}</Text> },
                    { title: 'Chương / Nhóm bệnh', dataIndex: 'category', key: 'category' },
                  ]}
                  rowKey="code"
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};
