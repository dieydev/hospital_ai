import React, { useState } from 'react';
import { Card, Table, Tabs, Button, Tag, Typography, Modal, Form, Input, Select, InputNumber } from 'antd';
import { PlusOutlined, AppstoreOutlined, MedicineBoxOutlined, TeamOutlined, ReadOutlined } from '@ant-design/icons';
import { formatCurrency } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showSuccessAlert } from '../utils/sweetAlert';

const { Title, Text } = Typography;
const { Option } = Select;

export const CatalogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('doctors');
  const { isDarkMode } = useThemeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [doctorsData, setDoctorsData] = useState([
    { id: '1', maNV: 'NV001', hoTen: 'BS. CKII. Nguyễn Thanh Duy', chuyenKhoa: 'Khoa Nội Tổng Hợp', chucVu: 'Trưởng Khoa', soDienThoai: '0336022526', trangThai: 'Hoạt động' },
    { id: '2', maNV: 'NV002', hoTen: 'BS. CKI. Phạm Minh Đức', chuyenKhoa: 'Khoa Nhi', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0912345999', trangThai: 'Hoạt động' },
    { id: '3', maNV: 'NV003', hoTen: 'BS. Trần Ngọc Mai', chuyenKhoa: 'Khoa Mắt', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0988776655', trangThai: 'Hoạt động' },
  ]);

  const [medicinesData, setMedicinesData] = useState([
    { id: '1', maThuoc: 'TH001', tenThuoc: 'Paracetamol 500mg', hoatChat: 'Paracetamol', donViTinh: 'Viên', donGia: 1200, nhaSanXuat: 'Hasan - Dermapharm', trangThai: 'Đang kinh doanh' },
    { id: '2', maThuoc: 'TH002', tenThuoc: 'Augmentin 1g', hoatChat: 'Amoxicillin + Clavulanic Acid', donViTinh: 'Viên', donGia: 18500, nhaSanXuat: 'GSK', trangThai: 'Đang kinh doanh' },
    { id: '3', maThuoc: 'TH003', tenThuoc: 'Esomeprazole 40mg', hoatChat: 'Esomeprazole', donViTinh: 'Viên', donGia: 8500, nhaSanXuat: 'AstraZeneca', trangThai: 'Đang kinh doanh' },
  ]);

  const [servicesData, setServicesData] = useState([
    { id: '1', maDV: 'DV001', tenDichVu: 'Khám Nội tổng hợp', loai: 'Khám bệnh', donGia: 150000, donGiaBHYT: 42100, khoa: 'Khoa Nội' },
    { id: '2', maDV: 'DV002', tenDichVu: 'Công thức máu toàn phần (CBC)', loai: 'Xét nghiệm', donGia: 85000, donGiaBHYT: 45000, khoa: 'Khoa Xét nghiệm' },
    { id: '3', maDV: 'DV003', tenDichVu: 'X-Quang Kỹ thuật số Phổi thẳng', loai: 'Chẩn đoán hình ảnh', donGia: 150000, donGiaBHYT: 68000, khoa: 'Khoa CĐHA' },
  ]);

  const [icd10Data, setIcd10Data] = useState([
    { code: 'J02.9', name: 'Viêm họng cấp tính, không đặc hiệu', category: 'Bệnh hệ hô hấp (J00-J99)' },
    { code: 'J03.9', name: 'Viêm amydal cấp tính, không đặc hiệu', category: 'Bệnh hệ hô hấp (J00-J99)' },
    { code: 'K29.7', name: 'Viêm dạ dày, không đặc hiệu', category: 'Bệnh hệ tiêu hóa (K00-K93)' },
    { code: 'I10', name: 'Bệnh cao huyết áp vô căn (nguyên phát)', category: 'Bệnh hệ tuần hoàn (I00-I99)' },
    { code: 'E11.9', name: 'Bệnh đái tháo đường tuýp 2 không có biến chứng', category: 'Bệnh nội tiết & chuyển hóa (E00-E90)' },
  ]);

  const handleOpenAddModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (values: any) => {
    if (activeTab === 'doctors') {
      const newDoc = {
        id: String(Date.now()),
        maNV: `NV${String(doctorsData.length + 1).padStart(3, '0')}`,
        hoTen: values.hoTen,
        chuyenKhoa: values.chuyenKhoa,
        chucVu: values.chucVu || 'Bác sĩ',
        soDienThoai: values.soDienThoai || '0901234567',
        trangThai: 'Hoạt động',
      };
      setDoctorsData([newDoc, ...doctorsData]);
      showSuccessAlert('Thêm Bác sĩ thành công', `Đã tạo hồ sơ cho bác sĩ ${values.hoTen}`);
    } else if (activeTab === 'medicines') {
      const newMed = {
        id: String(Date.now()),
        maThuoc: `TH${String(medicinesData.length + 1).padStart(3, '0')}`,
        tenThuoc: values.tenThuoc,
        hoatChat: values.hoatChat,
        donViTinh: values.donViTinh || 'Viên',
        donGia: values.donGia || 10000,
        nhaSanXuat: values.nhaSanXuat || 'Dược Việt Nam',
        trangThai: 'Đang kinh doanh',
      };
      setMedicinesData([newMed, ...medicinesData]);
      showSuccessAlert('Thêm Thuốc mới thành công', `Đã thêm thuốc ${values.tenThuoc} vào danh mục`);
    } else if (activeTab === 'services') {
      const newSvc = {
        id: String(Date.now()),
        maDV: `DV${String(servicesData.length + 1).padStart(3, '0')}`,
        tenDichVu: values.tenDichVu,
        loai: values.loai || 'Khám bệnh',
        donGia: values.donGia || 100000,
        donGiaBHYT: values.donGiaBHYT || 40000,
        khoa: values.khoa || 'Khoa Nội',
      };
      setServicesData([newSvc, ...servicesData]);
      showSuccessAlert('Thêm Dịch vụ thành công', `Đã thêm dịch vụ ${values.tenDichVu}`);
    } else if (activeTab === 'icd10') {
      const newIcd = {
        code: values.code,
        name: values.name,
        category: values.category || 'Bệnh khác',
      };
      setIcd10Data([newIcd, ...icd10Data]);
      showSuccessAlert('Thêm mã ICD-10 thành công', `Đã thêm mã ICD-10 ${values.code} - ${values.name}`);
    }
    setIsModalOpen(false);
  };

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
          onClick={handleOpenAddModal}
        >
          {activeTab === 'doctors' && 'Thêm Bác sĩ mới'}
          {activeTab === 'medicines' && 'Thêm Thuốc mới'}
          {activeTab === 'services' && 'Thêm Dịch vụ mới'}
          {activeTab === 'icd10' && 'Thêm Mã ICD-10'}
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

      {/* Modal Thêm Mục Mới */}
      <Modal
        title={
          <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
            {activeTab === 'doctors' && 'Thêm Bác sĩ / Nhân viên mới'}
            {activeTab === 'medicines' && 'Thêm Thuốc mới vào Danh mục'}
            {activeTab === 'services' && 'Thêm Dịch vụ Y tế mới'}
            {activeTab === 'icd10' && 'Thêm Mã ICD-10 Tiêu chuẩn'}
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Thêm mới"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateSubmit} style={{ marginTop: 16 }}>
          {activeTab === 'doctors' && (
            <>
              <Form.Item label="Họ và Tên Bác sĩ" name="hoTen" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                <Input placeholder="BS. Nguyễn Văn A" />
              </Form.Item>
              <Form.Item label="Chuyên khoa" name="chuyenKhoa" rules={[{ required: true, message: 'Vui lòng nhập chuyên khoa' }]}>
                <Select placeholder="Chọn khoa">
                  <Option value="Khoa Nội Tổng Hợp">Khoa Nội Tổng Hợp</Option>
                  <Option value="Khoa Nhi">Khoa Nhi</Option>
                  <Option value="Khoa Mắt">Khoa Mắt</Option>
                  <Option value="Khoa Ngoại">Khoa Ngoại</Option>
                  <Option value="Khoa Cấp Cứu">Khoa Cấp Cứu</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Chức vụ" name="chucVu" initialValue="Bác sĩ Điều trị">
                <Input placeholder="Bác sĩ Điều trị / Trưởng Khoa" />
              </Form.Item>
              <Form.Item label="Số điện thoại" name="soDienThoai">
                <Input placeholder="0901234567" />
              </Form.Item>
            </>
          )}

          {activeTab === 'medicines' && (
            <>
              <Form.Item label="Tên Thuốc" name="tenThuoc" rules={[{ required: true, message: 'Vui lòng nhập tên thuốc' }]}>
                <Input placeholder="Paracetamol 500mg" />
              </Form.Item>
              <Form.Item label="Hoạt chất chính" name="hoatChat" rules={[{ required: true, message: 'Vui lòng nhập hoạt chất' }]}>
                <Input placeholder="Paracetamol" />
              </Form.Item>
              <Form.Item label="Đơn vị tính" name="donViTinh" initialValue="Viên">
                <Select>
                  <Option value="Viên">Viên</Option>
                  <Option value="Vỉ">Vỉ</Option>
                  <Option value="Hộp">Hộp</Option>
                  <Option value="Chai">Chai</Option>
                  <Option value="Ống">Ống</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Đơn giá (VNĐ)" name="donGia" rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}>
                <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
              <Form.Item label="Nhà sản xuất" name="nhaSanXuat">
                <Input placeholder="Dược Hậu Giang / Sanofi / GSK" />
              </Form.Item>
            </>
          )}

          {activeTab === 'services' && (
            <>
              <Form.Item label="Tên Dịch vụ Y tế" name="tenDichVu" rules={[{ required: true, message: 'Vui lòng nhập tên dịch vụ' }]}>
                <Input placeholder="Siêu âm ổ bụng tổng quát" />
              </Form.Item>
              <Form.Item label="Phân loại" name="loai" initialValue="Khám bệnh">
                <Select>
                  <Option value="Khám bệnh">Khám bệnh</Option>
                  <Option value="Xét nghiệm">Xét nghiệm</Option>
                  <Option value="Chẩn đoán hình ảnh">Chẩn đoán hình ảnh</Option>
                  <Option value="Thủ thuật - Phẫu thuật">Thủ thuật - Phẫu thuật</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Đơn giá Viện phí (VNĐ)" name="donGia" rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}>
                <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
              <Form.Item label="Đơn giá BHYT Chi trả (VNĐ)" name="donGiaBHYT">
                <InputNumber style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </>
          )}

          {activeTab === 'icd10' && (
            <>
              <Form.Item label="Mã ICD-10" name="code" rules={[{ required: true, message: 'Vui lòng nhập mã ICD-10' }]}>
                <Input placeholder="Ví dụ: J02.9" />
              </Form.Item>
              <Form.Item label="Tên Bệnh lý Tiêu chuẩn" name="name" rules={[{ required: true, message: 'Vui lòng nhập tên bệnh' }]}>
                <Input placeholder="Viêm họng cấp tính, không đặc hiệu" />
              </Form.Item>
              <Form.Item label="Chương / Nhóm bệnh" name="category" initialValue="Bệnh hệ hô hấp (J00-J99)">
                <Input placeholder="Bệnh hệ hô hấp (J00-J99)" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
};
