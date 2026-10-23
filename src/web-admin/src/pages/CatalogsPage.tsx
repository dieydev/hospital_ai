import React, { useState, useEffect } from 'react';
import { Card, Table, Tabs, Button, Tag, Typography, Modal, Form, Input, Select, InputNumber, Progress, Tooltip, Row, Col, Statistic, Space } from 'antd';
import {
  PlusOutlined,
  AppstoreOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  ReadOutlined,
  ApartmentOutlined,
  SettingOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showSuccessAlert } from '../utils/sweetAlert';
import api from '../services/api';

const { Text } = Typography;
const { Option } = Select;

export const CatalogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('departments');
  const { isDarkMode } = useThemeStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // Modal Cấu hình Slot Khoa
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [selectedDeptForSlot, setSelectedDeptForSlot] = useState<any>(null);
  const [slotForm] = Form.useForm();

  const [departmentsData, setDepartmentsData] = useState([
    { id: 'dept-01', maKhoa: 'KNOI', tenKhoa: 'Khoa Nội Tổng Hợp', viTri: 'Phòng 102 - Tầng 1', truongKhoa: 'BS. CKII. Nguyễn Thanh Duy', soBacSi: 6, trangThai: 'Hoạt động', maxSlots: 50, bookedSlots: 32 },
    { id: 'dept-02', maKhoa: 'KNHI', tenKhoa: 'Khoa Nhi', viTri: 'Phòng 108 - Tầng 1', truongKhoa: 'BS. CKI. Phạm Minh Đức', soBacSi: 4, trangThai: 'Hoạt động', maxSlots: 40, bookedSlots: 28 },
    { id: 'dept-03', maKhoa: 'KMAT', tenKhoa: 'Khoa Mắt', viTri: 'Phòng 201 - Tầng 2', truongKhoa: 'BS. CKI. Trần Ngọc Mai', soBacSi: 3, trangThai: 'Hoạt động', maxSlots: 35, bookedSlots: 19 },
    { id: 'dept-04', maKhoa: 'KTMH', tenKhoa: 'Khoa Tai Mũi Họng', viTri: 'Phòng 204 - Tầng 2', truongKhoa: 'BS. CKII. Lê Văn Tuấn', soBacSi: 4, trangThai: 'Hoạt động', maxSlots: 40, bookedSlots: 22 },
    { id: 'dept-05', maKhoa: 'KTIM', tenKhoa: 'Khoa Tim Mạch', viTri: 'Phòng 208 - Tầng 2', truongKhoa: 'TS. BS. Huỳnh Quốc Dũng', soBacSi: 5, trangThai: 'Hoạt động', maxSlots: 45, bookedSlots: 41 },
    { id: 'dept-06', maKhoa: 'KTHOA', tenKhoa: 'Khoa Tiêu Hóa', viTri: 'Phòng 212 - Tầng 2', truongKhoa: 'BS. CKII. Đinh Khắc Vương', soBacSi: 4, trangThai: 'Hoạt động', maxSlots: 40, bookedSlots: 25 },
    { id: 'dept-07', maKhoa: 'KNGOAI', tenKhoa: 'Khoa Ngoại Tổng Quát', viTri: 'Phòng 301 - Tầng 3', truongKhoa: 'BS. CKII. Đỗ Hoàng Giang', soBacSi: 6, trangThai: 'Hoạt động', maxSlots: 50, bookedSlots: 30 },
    { id: 'dept-08', maKhoa: 'KRHM', tenKhoa: 'Khoa Răng Hàm Mặt', viTri: 'Phòng 215 - Tầng 2', truongKhoa: 'BS. CKI. Hoàng Trọng Nghĩa', soBacSi: 3, trangThai: 'Hoạt động', maxSlots: 30, bookedSlots: 18 },
    { id: 'dept-09', maKhoa: 'KDL', tenKhoa: 'Khoa Da Liễu', viTri: 'Phòng 305 - Tầng 3', truongKhoa: 'BS. CKI. Nguyễn Phương Anh', soBacSi: 3, trangThai: 'Hoạt động', maxSlots: 35, bookedSlots: 15 },
    { id: 'dept-10', maKhoa: 'KSAN', tenKhoa: 'Khoa Sản Phụ Khoa', viTri: 'Phòng 308 - Tầng 3', truongKhoa: 'BS. CKII. Lê Thị Kim Phượng', soBacSi: 5, trangThai: 'Hoạt động', maxSlots: 40, bookedSlots: 34 },
    { id: 'dept-11', maKhoa: 'KCC', tenKhoa: 'Khoa Cấp Cứu & Hồi Sức', viTri: 'Tầng Trệt - Khu A', truongKhoa: 'BS. CKI. Trịnh Văn Thành', soBacSi: 8, trangThai: 'Hoạt động 24/7', maxSlots: 100, bookedSlots: 46 },
    { id: 'dept-12', maKhoa: 'KCDHA', tenKhoa: 'Khoa Chẩn Đoán Hình Ảnh', viTri: 'Phòng 110 - Tầng 1', truongKhoa: 'ThS. BS. Phan Hoàng Nam', soBacSi: 4, trangThai: 'Hoạt động', maxSlots: 60, bookedSlots: 45 },
  ]);

  const [doctorsData, setDoctorsData] = useState([
    { id: '1', maNV: 'NV001', hoTen: 'BS. CKII. Nguyễn Thanh Duy', chuyenKhoa: 'Khoa Nội Tổng Hợp', chucVu: 'Trưởng Khoa', soDienThoai: '0336022526', trangThai: 'Hoạt động' },
    { id: '2', maNV: 'NV002', hoTen: 'ThS. BS. Trần Thị Thu Hà', chuyenKhoa: 'Khoa Nội Tổng Hợp', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0912345001', trangThai: 'Hoạt động' },
    { id: '3', maNV: 'NV003', hoTen: 'BS. CKI. Phạm Minh Đức', chuyenKhoa: 'Khoa Nhi', chucVu: 'Trưởng Khoa', soDienThoai: '0912345999', trangThai: 'Hoạt động' },
    { id: '4', maNV: 'NV004', hoTen: 'BS. Đặng Hồng Hạnh', chuyenKhoa: 'Khoa Nhi', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0988776002', trangThai: 'Hoạt động' },
    { id: '5', maNV: 'NV005', hoTen: 'BS. CKI. Trần Ngọc Mai', chuyenKhoa: 'Khoa Mắt', chucVu: 'Trưởng Khoa', soDienThoai: '0988776655', trangThai: 'Hoạt động' },
    { id: '6', maNV: 'NV006', hoTen: 'BS. Vũ Hoàng Long', chuyenKhoa: 'Khoa Mắt', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0988776003', trangThai: 'Hoạt động' },
    { id: '7', maNV: 'NV007', hoTen: 'BS. CKII. Lê Văn Tuấn', chuyenKhoa: 'Khoa Tai Mũi Họng', chucVu: 'Trưởng Khoa', soDienThoai: '0903112233', trangThai: 'Hoạt động' },
    { id: '8', maNV: 'NV008', hoTen: 'ThS. BS. Nguyễn Mai Linh', chuyenKhoa: 'Khoa Tai Mũi Họng', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0903112234', trangThai: 'Hoạt động' },
    { id: '9', maNV: 'NV009', hoTen: 'TS. BS. Huỳnh Quốc Dũng', chuyenKhoa: 'Khoa Tim Mạch', chucVu: 'Trưởng Khoa', soDienThoai: '0909445566', trangThai: 'Hoạt động' },
    { id: '10', maNV: 'NV010', hoTen: 'BS. CKI. Vũ Thu Trang', chuyenKhoa: 'Khoa Tim Mạch', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0909445567', trangThai: 'Hoạt động' },
    { id: '11', maNV: 'NV011', hoTen: 'BS. CKII. Đinh Khắc Vương', chuyenKhoa: 'Khoa Tiêu Hóa', chucVu: 'Trưởng Khoa', soDienThoai: '0918776655', trangThai: 'Hoạt động' },
    { id: '12', maNV: 'NV012', hoTen: 'BS. Hoàng Lan Anh', chuyenKhoa: 'Khoa Tiêu Hóa', chucVu: 'Bác sĩ Điều trị', soDienThoai: '0918776656', trangThai: 'Hoạt động' },
    { id: '13', maNV: 'NV013', hoTen: 'BS. CKII. Đỗ Hoàng Giang', chuyenKhoa: 'Khoa Ngoại Tổng Quát', chucVu: 'Trưởng Khoa', soDienThoai: '0977889900', trangThai: 'Hoạt động' },
    { id: '14', maNV: 'NV014', hoTen: 'BS. CKI. Hoàng Trọng Nghĩa', chuyenKhoa: 'Khoa Răng Hàm Mặt', chucVu: 'Trưởng Khoa', soDienThoai: '0933221100', trangThai: 'Hoạt động' },
    { id: '15', maNV: 'NV015', hoTen: 'BS. CKI. Nguyễn Phương Anh', chuyenKhoa: 'Khoa Da Liễu', chucVu: 'Trưởng Khoa', soDienThoai: '0944556677', trangThai: 'Hoạt động' },
    { id: '16', maNV: 'NV016', hoTen: 'BS. CKII. Lê Thị Kim Phượng', chuyenKhoa: 'Khoa Sản Phụ Khoa', chucVu: 'Trưởng Khoa', soDienThoai: '0966778899', trangThai: 'Hoạt động' },
    { id: '17', maNV: 'NV017', hoTen: 'BS. CKI. Trịnh Văn Thành', chuyenKhoa: 'Khoa Cấp Cứu & Hồi Sức', chucVu: 'Trưởng Kíp', soDienThoai: '0911223344', trangThai: 'Hoạt động' },
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

  useEffect(() => {
    // 1. Đồng bộ bác sĩ từ API
    api
      .get('/auth/doctors')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const apiDocs = res.data.map((doc: any, index: number) => ({
            id: doc.id || String(index + 1),
            maNV: `NV${String(index + 1).padStart(3, '0')}`,
            hoTen: doc.name || doc.hoTen,
            chuyenKhoa: doc.dept || doc.chuyenKhoa || 'Khoa Nội Tổng Hợp',
            chucVu: doc.title || doc.chucVu || 'Bác sĩ Điều trị',
            soDienThoai: doc.phone || doc.soDienThoai || '0901234567',
            trangThai: 'Hoạt động',
          }));
          setDoctorsData(apiDocs);
        }
      })
      .catch(() => {});

    // 2. Đồng bộ danh mục khoa phòng từ Queue Service
    api
      .get('/queue/departments')
      .then((res) => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const apiDepts = res.data.map((d: any, index: number) => ({
            id: d.id || `dept-${String(index + 1).padStart(2, '0')}`,
            maKhoa: d.departmentCode || `K${String(index + 1).padStart(2, '0')}`,
            tenKhoa: d.departmentName || d.tenKhoa,
            viTri: d.location || `Phòng ${101 + index} - Tầng 1`,
            truongKhoa: d.headDoctor || 'Bác sĩ Trưởng Khoa',
            soBacSi: d.doctorCount || 4,
            trangThai: 'Hoạt động',
          }));
          // Giữ các khoa chuẩn nếu API ít hơn
          if (apiDepts.length >= departmentsData.length) {
            setDepartmentsData(apiDepts);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenSlotModal = (dept: any) => {
    setSelectedDeptForSlot(dept);
    slotForm.setFieldsValue({
      maxSlots: dept.maxSlots || 40,
      bookedSlots: dept.bookedSlots || 0,
      trangThai: dept.trangThai || 'Hoạt động',
    });
    setIsSlotModalOpen(true);
  };

  const handleSaveSlotConfig = (values: any) => {
    if (!selectedDeptForSlot) return;
    setDepartmentsData((prev) =>
      prev.map((d) =>
        d.id === selectedDeptForSlot.id
          ? {
              ...d,
              maxSlots: values.maxSlots,
              bookedSlots: values.bookedSlots,
              trangThai: values.trangThai,
            }
          : d
      )
    );
    showSuccessAlert(
      'Cập nhật Slot thành công!',
      `Đã cập nhật hạn mức ${values.maxSlots} suất khám cho ${selectedDeptForSlot.tenKhoa}.`
    );
    setIsSlotModalOpen(false);
  };

  const handleOpenAddModal = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleCreateSubmit = (values: any) => {
    if (activeTab === 'departments') {
      const newDept = {
        id: `dept-${Date.now()}`,
        maKhoa: values.maKhoa || `K${String(departmentsData.length + 1).padStart(2, '0')}`,
        tenKhoa: values.tenKhoa,
        viTri: values.viTri || 'Tầng 1 - Khu Khám bệnh',
        truongKhoa: values.truongKhoa || 'Đang cập nhật',
        soBacSi: values.soBacSi || 3,
        maxSlots: values.maxSlots || 40,
        bookedSlots: 0,
        trangThai: 'Hoạt động',
      };
      setDepartmentsData([newDept, ...departmentsData]);
      showSuccessAlert('Thêm Khoa/Phòng thành công', `Đã thêm ${values.tenKhoa} vào danh mục chuyên khoa`);
    } else if (activeTab === 'doctors') {
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
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="medical-hero-banner relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-md">
              <span className="status-dot-active bg-emerald-400" /> Danh Mục Master Data • Khoa Phòng, Bác Sĩ, Thuốc, CLS & ICD-10
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Quản trị Danh mục Hệ thống (System Catalogs)
          </h1>
          <p className="text-sky-100 text-xs md:text-sm mt-1">
            Danh mục Khoa/Phòng khám, Bác sĩ/Nhân viên, Thuốc dược phẩm, Dịch vụ kỹ thuật y tế và Bộ mã chuẩn đoán quốc tế ICD-10
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="medical-hero-btn-primary rounded-lg font-semibold flex items-center gap-1.5"
          onClick={handleOpenAddModal}
        >
          {activeTab === 'departments' && 'Thêm Khoa / Phòng mới'}
          {activeTab === 'doctors' && 'Thêm Bác sĩ mới'}
          {activeTab === 'medicines' && 'Thêm Thuốc mới'}
          {activeTab === 'services' && 'Thêm Dịch vụ mới'}
          {activeTab === 'icd10' && 'Thêm Mã ICD-10'}
        </Button>
      </div>

      <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'departments',
              label: (<span><ApartmentOutlined /> Khoa / Phòng Khám & Slot</span>),
              children: (
                <div>
                  {/* Dải thống kê Slot toàn viện */}
                  <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    <Col xs={12} sm={6}>
                      <Card size="small" style={{ borderRadius: 10, border: '1px solid #bae6fd', background: isDarkMode ? '#1e293b' : '#f0f9ff' }}>
                        <Statistic
                          title={<span style={{ fontSize: 12, color: '#64748b' }}>Tổng Slot toàn viện</span>}
                          value={departmentsData.reduce((acc, cur) => acc + (cur.maxSlots || 0), 0)}
                          prefix={<CalendarOutlined style={{ color: '#0284c7' }} />}
                          valueStyle={{ fontSize: 18, fontWeight: 700, color: '#0369a1' }}
                          suffix="suất"
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card size="small" style={{ borderRadius: 10, border: '1px solid #fed7aa', background: isDarkMode ? '#1e293b' : '#fffbeb' }}>
                        <Statistic
                          title={<span style={{ fontSize: 12, color: '#64748b' }}>Đã tiếp nhận / Đặt lịch</span>}
                          value={departmentsData.reduce((acc, cur) => acc + (cur.bookedSlots || 0), 0)}
                          prefix={<TeamOutlined style={{ color: '#f59e0b' }} />}
                          valueStyle={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}
                          suffix="lượt"
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card size="small" style={{ borderRadius: 10, border: '1px solid #bbf7d0', background: isDarkMode ? '#1e293b' : '#f0fdf4' }}>
                        <Statistic
                          title={<span style={{ fontSize: 12, color: '#64748b' }}>Slot còn trống hôm nay</span>}
                          value={departmentsData.reduce((acc, cur) => acc + Math.max(0, (cur.maxSlots || 0) - (cur.bookedSlots || 0)), 0)}
                          prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                          valueStyle={{ fontSize: 18, fontWeight: 700, color: '#16a34a' }}
                          suffix="chỗ"
                        />
                      </Card>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Card size="small" style={{ borderRadius: 10, border: '1px solid #e2e8f0', background: isDarkMode ? '#1e293b' : '#f8fafc' }}>
                        <Statistic
                          title={<span style={{ fontSize: 12, color: '#64748b' }}>Công suất phục vụ</span>}
                          value={Math.round(
                            (departmentsData.reduce((acc, cur) => acc + (cur.bookedSlots || 0), 0) /
                              Math.max(1, departmentsData.reduce((acc, cur) => acc + (cur.maxSlots || 0), 0))) *
                              100
                          )}
                          prefix={<MedicineBoxOutlined style={{ color: '#6366f1' }} />}
                          valueStyle={{ fontSize: 18, fontWeight: 700, color: '#4f46e5' }}
                          suffix="%"
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Table
                    dataSource={departmentsData}
                    columns={[
                      { title: 'Mã Khoa', dataIndex: 'maKhoa', key: 'maKhoa', width: 95, render: (c: string) => <Tag color="cyan" style={{ fontWeight: 700 }}>{c}</Tag> },
                      { title: 'Tên Khoa / Phòng', dataIndex: 'tenKhoa', key: 'tenKhoa', width: 190, render: (t: string) => <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{t}</Text> },
                      { title: 'Vị trí phòng khám', dataIndex: 'viTri', key: 'viTri', width: 170 },
                      { title: 'Trưởng Khoa', dataIndex: 'truongKhoa', key: 'truongKhoa', width: 180, render: (tk: string) => <Tag color="blue">{tk}</Tag> },
                      { title: 'Nhân sự', dataIndex: 'soBacSi', key: 'soBacSi', width: 100, render: (cnt: number) => `${cnt} Bác sĩ` },
                      {
                        title: 'Suất khám / Slot trong ngày',
                        key: 'slots',
                        width: 230,
                        render: (_: any, record: any) => {
                          const max = record.maxSlots || 40;
                          const booked = record.bookedSlots || 0;
                          const remain = Math.max(0, max - booked);
                          const percent = Math.min(100, Math.round((booked / max) * 100));
                          const isFull = remain === 0;

                          return (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                                <span>
                                  Đã nhận: <strong style={{ color: '#0369a1' }}>{booked}</strong>/{max}
                                </span>
                                <span style={{ fontWeight: 600, color: isFull ? '#f43f5e' : remain <= 5 ? '#f59e0b' : '#10b981' }}>
                                  {isFull ? 'Hết slot' : `Còn ${remain} slot`}
                                </span>
                              </div>
                              <Progress
                                percent={percent}
                                size="small"
                                showInfo={false}
                                strokeColor={isFull ? '#f43f5e' : percent >= 80 ? '#f59e0b' : '#0284c7'}
                              />
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Trạng thái',
                        dataIndex: 'trangThai',
                        key: 'trangThai',
                        width: 120,
                        render: (s: string) => <Tag color={s.includes('Hoạt động') ? 'green' : 'default'}>{s}</Tag>,
                      },
                      {
                        title: 'Thao tác',
                        key: 'actions',
                        width: 110,
                        align: 'center' as const,
                        render: (_: any, record: any) => (
                          <Tooltip title="Cấu hình số Slot khám của khoa">
                            <Button
                              size="small"
                              type="primary"
                              ghost
                              icon={<SettingOutlined />}
                              onClick={() => handleOpenSlotModal(record)}
                            >
                              Sửa Slot
                            </Button>
                          </Tooltip>
                        ),
                      },
                    ]}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 1000 }}
                  />
                </div>
              ),
            },
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
            {activeTab === 'departments' && 'Thêm Khoa / Phòng Khám Mới'}
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
          {activeTab === 'departments' && (
            <>
              <Form.Item label="Tên Khoa / Phòng" name="tenKhoa" rules={[{ required: true, message: 'Vui lòng nhập tên khoa/phòng' }]}>
                <Input placeholder="Ví dụ: Khoa Phục Hồi Chức Năng" />
              </Form.Item>
              <Form.Item label="Mã Khoa" name="maKhoa" rules={[{ required: true, message: 'Vui lòng nhập mã khoa' }]}>
                <Input placeholder="Ví dụ: KPHCN" />
              </Form.Item>
              <Form.Item label="Vị trí phòng khám" name="viTri" rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}>
                <Input placeholder="Ví dụ: Phòng 205 - Tầng 2" />
              </Form.Item>
              <Form.Item label="Trưởng Khoa phụ trách" name="truongKhoa">
                <Input placeholder="BS. CKII. ..." />
              </Form.Item>
              <Form.Item label="Số lượng Bác sĩ" name="soBacSi" initialValue={4}>
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item
                label="Hạn mức Slot khám tối đa / ngày"
                name="maxSlots"
                initialValue={40}
                rules={[{ required: true, message: 'Vui lòng nhập số slot tối đa' }]}
              >
                <InputNumber min={5} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}

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

      {/* Modal Cấu hình Hạn mức Slot Khoa Phòng */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <SettingOutlined style={{ color: '#0284c7' }} />
            <span>Cấu hình Suất khám & Slot: {selectedDeptForSlot?.tenKhoa}</span>
          </div>
        }
        open={isSlotModalOpen}
        onCancel={() => setIsSlotModalOpen(false)}
        onOk={() => slotForm.submit()}
        okText="Lưu cấu hình"
        cancelText="Hủy"
        destroyOnClose
        width={460}
      >
        <Form form={slotForm} layout="vertical" onFinish={handleSaveSlotConfig} style={{ marginTop: 16 }}>
          <Form.Item
            name="maxSlots"
            label="Hạn mức Slot khám tối đa trong ngày"
            rules={[{ required: true, message: 'Vui lòng nhập số slot tối đa' }]}
            extra="Số lượt bệnh nhân tối đa mà chuyên khoa có thể tiếp nhận trong 1 ngày làm việc"
          >
            <InputNumber min={5} max={300} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="bookedSlots"
            label="Số lượt đã tiếp nhận / Đã đăng ký hôm nay"
            rules={[{ required: true, message: 'Vui lòng nhập số lượt đã nhận' }]}
          >
            <InputNumber min={0} max={300} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="trangThai" label="Trạng thái tiếp nhận">
            <Select>
              <Option value="Hoạt động">Hoạt động (Tiếp nhận bình thường)</Option>
              <Option value="Tạm ngưng nhận bệnh">Tạm ngưng nhận bệnh</Option>
              <Option value="Hoạt động 24/7">Hoạt động 24/7 (Cấp cứu)</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
