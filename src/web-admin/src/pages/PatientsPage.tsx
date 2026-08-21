import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Typography,
  Card,
  Modal,
  Form,
  Select,
  DatePicker,
  Row,
  Col,
  Descriptions,
  Alert,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SafetyOutlined,
  WarningOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Patient } from '../types';
import { patientService, PatientCreateParams } from '../services/patientService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { showSuccessAlert, showErrorAlert, showConfirmDelete, showToast } from '../utils/sweetAlert';

import { useThemeStore } from '../store/useThemeStore';

const { Text } = Typography;
const { Option } = Select;

export const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const { isDarkMode } = useThemeStore();

  const [loading, setLoading] = useState<boolean>(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const [searchText, setSearchText] = useState<string>('');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await patientService.getPatients(searchText, pageIndex, pageSize);
      setPatients(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'Không thể tải danh sách bệnh nhân!', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchText, pageIndex, pageSize]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPageIndex(1);
  };

  // Create Patient
  const handleCreatePatient = async (values: any) => {
    setSubmitting(true);
    try {
      const params: PatientCreateParams = {
        fullName: values.fullName,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
        identityCardNumber: values.identityCardNumber,
        healthInsuranceNumber: values.healthInsuranceNumber || undefined,
        phoneNumber: values.phoneNumber,
        email: values.email || undefined,
        address: values.address,
        medicalHistory: values.medicalHistory || undefined,
        drugAllergies: values.drugAllergies || undefined,
        bloodType: values.bloodType || undefined,
        emergencyContactName: values.emergencyContactName || undefined,
        emergencyContactPhone: values.emergencyContactPhone || undefined,
        emergencyContactRelation: values.emergencyContactRelation || undefined,
      };

      const newPatient = await patientService.createPatient(params);
      showSuccessAlert(
        'Tiếp nhận Bệnh nhân Thành công!',
        `Hồ sơ bệnh nhân ${newPatient.hoTen} đã được khởi tạo thành công với Mã BN: ${newPatient.maBenhNhan}`
      );
      setIsCreateModalOpen(false);
      form.resetFields();
      fetchPatients();
    } catch (err: any) {
      showErrorAlert('Tạo hồ sơ thất bại', err.response?.data?.message || 'Không thể thêm mới bệnh nhân.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (patient: Patient) => {
    setSelectedPatient(patient);
    editForm.setFieldsValue({
      fullName: patient.hoTen,
      gender: patient.gioiTinh,
      dateOfBirth: patient.ngaySinh ? dayjs(patient.ngaySinh) : null,
      identityCardNumber: patient.soCCCD,
      healthInsuranceNumber: patient.maTheBHYT,
      phoneNumber: patient.soDienThoai,
      email: patient.email,
      address: patient.diaChi,
      medicalHistory: patient.tienSuBenh,
      drugAllergies: patient.diUngThuoc,
      bloodType: patient.nhomMau,
      emergencyContactName: patient.tenNguoiThan,
      emergencyContactPhone: patient.soDienThoaiNguoiThan,
      emergencyContactRelation: patient.quanHeNguoiThan,
    });
    setIsEditModalOpen(true);
  };

  // Update Patient
  const handleUpdatePatient = async (values: any) => {
    if (!selectedPatient) return;
    setSubmitting(true);
    try {
      const params: PatientCreateParams = {
        fullName: values.fullName,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
        identityCardNumber: values.identityCardNumber,
        healthInsuranceNumber: values.healthInsuranceNumber || undefined,
        phoneNumber: values.phoneNumber,
        email: values.email || undefined,
        address: values.address,
        medicalHistory: values.medicalHistory || undefined,
        drugAllergies: values.drugAllergies || undefined,
        bloodType: values.bloodType || undefined,
        emergencyContactName: values.emergencyContactName || undefined,
        emergencyContactPhone: values.emergencyContactPhone || undefined,
        emergencyContactRelation: values.emergencyContactRelation || undefined,
      };

      await patientService.updatePatient(selectedPatient.id, params);
      showSuccessAlert(
        'Cập nhật Thành công!',
        `Thông tin bệnh nhân ${values.fullName} đã được lưu vào hệ thống.`
      );
      setIsEditModalOpen(false);
      setSelectedPatient(null);
      fetchPatients();
    } catch (err: any) {
      showErrorAlert('Cập nhật thất bại', err.response?.data?.message || 'Không thể lưu thay đổi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Patient with SweetAlert2 confirm
  const handleDeletePatient = async (id: string, name: string) => {
    const res = await showConfirmDelete(
      'Xóa Hồ sơ Bệnh nhân',
      `Bạn có chắc chắn muốn xóa hồ sơ của bệnh nhân ${name}? Hành động này sẽ loại bỏ dữ liệu khỏi hệ thống.`
    );
    if (res.isConfirmed) {
      try {
        await patientService.deletePatient(id);
        showToast(`Đã xóa thành công bệnh nhân ${name}`, 'success');
        fetchPatients();
      } catch (err: any) {
        showErrorAlert('Xóa không thành công', err.response?.data?.message || 'Lỗi khi xóa dữ liệu.');
      }
    }
  };

  // View Detail Modal
  const openDetailModal = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDetailModalOpen(true);
  };

  const columns = [
    {
      title: 'Mã Bệnh Nhân',
      dataIndex: 'maBenhNhan',
      key: 'maBenhNhan',
      render: (text: string) => (
        <Text strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontFamily: 'monospace', fontSize: '14px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Họ và Tên',
      dataIndex: 'hoTen',
      key: 'hoTen',
      render: (text: string, record: Patient) => (
        <div>
          <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{text}</Text>
          {record.tuoi !== undefined && (
            <Tag color="cyan" style={{ marginLeft: 6 }}>{record.tuoi} tuổi</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gioiTinh',
      key: 'gioiTinh',
      width: 90,
      render: (g: string) => <Tag color={g === 'Nam' ? 'blue' : g === 'Nữ' ? 'magenta' : 'purple'}>{g}</Tag>,
    },
    {
      title: 'Số CCCD',
      dataIndex: 'soCCCD',
      key: 'soCCCD',
      render: (text: string) => <Text style={{ fontFamily: 'monospace', color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{text}</Text>,
    },
    {
      title: 'Thẻ BHYT',
      dataIndex: 'maTheBHYT',
      key: 'maTheBHYT',
      render: (bhyt: string) =>
        bhyt ? (
          <Tag color="green" icon={<SafetyOutlined />}>
            {bhyt}
          </Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>Không có</Text>
        ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'soDienThoai',
      key: 'soDienThoai',
      render: (t: string) => (
        <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
          {t}
        </Text>
      ),
    },
    {
      title: 'Cảnh báo Dị ứng',
      dataIndex: 'diUngThuoc',
      key: 'diUngThuoc',
      render: (allergies: string) => {
        if (!allergies || allergies.toLowerCase().includes('không')) {
          return <Tag color="default">Không dị ứng</Tag>;
        }
        return (
          <Tooltip title={allergies}>
            <Tag color="red" icon={<WarningOutlined />}>
              {allergies.length > 20 ? allergies.substring(0, 20) + '...' : allergies}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 220,
      render: (_: unknown, record: Patient) => (
        <Space size="small">
          <Button
            icon={<FileTextOutlined />}
            type="primary"
            ghost
            size="small"
            style={{ borderColor: '#0284c7', color: '#0284c7' }}
            onClick={() => navigate('/emr', { state: { patientId: record.id, patientCode: record.maBenhNhan } })}
          >
            EMR
          </Button>
          <Button
            icon={<EyeOutlined />}
            type="text"
            size="small"
            style={{ color: '#0369a1' }}
            onClick={() => openDetailModal(record)}
          >
            Xem
          </Button>
          <Button
            icon={<EditOutlined />}
            type="text"
            size="small"
            onClick={() => openEditModal(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            type="text"
            danger
            size="small"
            onClick={() => handleDeletePatient(record.id, record.hoTen)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 md:p-8 text-white shadow-md border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <UserOutlined className="text-sky-400" />
            <Text className="text-xs text-sky-300 font-semibold uppercase tracking-wider">Bệnh Viện Đa Khoa • Quản Lý Bệnh Nhân</Text>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Quản lý Hồ sơ Bệnh nhân (Patient Management)
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Tra cứu, cập nhật thông tin hành chính, thẻ BHYT, tiền sử bệnh và lịch sử khám chữa bệnh
          </p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchPatients} loading={loading} className="rounded-lg font-medium">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              form.resetFields();
              setIsCreateModalOpen(true);
            }}
          >
            Tiếp nhận Bệnh nhân Mới
          </Button>
        </Space>
      </div>

      {/* Filter & Table Card */}
      <Card
        style={{
          borderRadius: 12,
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.2)' : '0 10px 30px rgba(2, 132, 199, 0.05)'
        }}
      >
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Input.Search
            placeholder="Tìm kiếm theo Mã BN (BN2026...), Họ tên, CCCD, SĐT hoặc BHYT..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ maxWidth: 480 }}
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) handleSearch('');
            }}
          />
          <Text type="secondary">
            Tổng cộng: <Text strong style={{ color: '#0284c7' }}>{totalCount}</Text> bệnh nhân
          </Text>
        </div>

        <Table
          dataSource={patients}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pageIndex,
            pageSize: pageSize,
            total: totalCount,
            onChange: (page, pSize) => {
              setPageIndex(page);
              setPageSize(pSize);
            },
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
        />
      </Card>

      {/* Modal 1: Tiếp nhận Bệnh Nhân Mới */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: '#0369a1', fontWeight: 600 }}>Tiếp nhận & Tạo Hồ sơ Bệnh nhân Mới</span>
          </Space>
        }
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
        width={760}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePatient} style={{ marginTop: 12 }}>
          <Alert
            message="Yêu cầu chính xác dữ liệu Y tế"
            description="Mã Bệnh nhân sẽ tự động tạo theo định dạng BN{NĂM}xxxxxx. Vui lòng nhập đúng 12 số CCCD để đảm bảo định danh người bệnh."
            type="info"
            showIcon
            style={{ marginBottom: 16, borderColor: '#bae6fd', backgroundColor: '#f0f9ff' }}
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<Text strong>Họ và Tên Bệnh nhân</Text>}
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên bệnh nhân!' }]}
              >
                <Input placeholder="Ví dụ: Nguyễn Văn An" size="large" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={<Text strong>Giới tính</Text>}
                name="gender"
                initialValue="Nam"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                label={<Text strong>Ngày sinh</Text>}
                name="dateOfBirth"
                rules={[{ required: true, message: 'Chọn ngày sinh!' }]}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} size="large" placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={<Text strong>Số CCCD / Định danh (12 số)</Text>}
                name="identityCardNumber"
                rules={[
                  { required: true, message: 'Nhập số CCCD!' },
                  { pattern: /^\d{12}$/, message: 'CCCD phải đủ 12 chữ số!' }
                ]}
              >
                <Input placeholder="03809000xxxx" size="large" maxLength={12} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<Text strong>Mã thẻ BHYT (nếu có)</Text>} name="healthInsuranceNumber">
                <Input placeholder="DN4010xxxxxxx" size="large" maxLength={20} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<Text strong>Nhóm máu</Text>} name="bloodType">
                <Select placeholder="Chọn nhóm máu" size="large" allowClear>
                  <Option value="A+">A+</Option>
                  <Option value="A-">A-</Option>
                  <Option value="B+">B+</Option>
                  <Option value="B-">B-</Option>
                  <Option value="AB+">AB+</Option>
                  <Option value="AB-">AB-</Option>
                  <Option value="O+">O+</Option>
                  <Option value="O-">O-</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={<Text strong>Số điện thoại liên hệ</Text>}
                name="phoneNumber"
                rules={[
                  { required: true, message: 'Nhập SĐT!' },
                  { pattern: /^(0[3|5|7|8|9])+([0-9]{8})$/, message: 'Số điện thoại không hợp lệ!' }
                ]}
              >
                <Input placeholder="09xxxxxxxx" size="large" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<Text strong>Địa chỉ Email</Text>} name="email" rules={[{ type: 'email', message: 'Email không đúng định dạng!' }]}>
                <Input placeholder="an.nguyen@gmail.com" size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<Text strong>Địa chỉ nơi cư trú</Text>} name="address" rules={[{ required: true, message: 'Nhập địa chỉ!' }]}>
                <Input placeholder="Số nhà, đường, phường/xã, tỉnh thành" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong>Tiền sử bệnh nền</Text>} name="medicalHistory">
                <Input.TextArea rows={2} placeholder="Ví dụ: Tăng huyết áp, Đái tháo đường Tuýp 2..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ color: '#dc2626' }}>Cảnh báo Dị ứng thuốc</Text>} name="drugAllergies">
                <Input.TextArea rows={2} placeholder="Ví dụ: Penicillin, Aspirin... (Để trống nếu không có)" />
              </Form.Item>
            </Col>
          </Row>

          {/* Emergency Contact */}
          <Divider title="Người liên hệ khẩn cấp (Thân nhân)" />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Họ tên người thân" name="emergencyContactName">
                <Input placeholder="Nguyễn Văn B" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Mối quan hệ" name="emergencyContactRelation">
                <Input placeholder="Ví dụ: Vợ/Chồng, Cha, Mẹ, Con..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Số điện thoại khẩn cấp" name="emergencyContactPhone">
                <Input placeholder="090xxxxxxx" maxLength={10} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsCreateModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                Lưu & Cấp Mã Bệnh Nhân
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal 2: Chỉnh sửa Hồ sơ Bệnh nhân */}
      <Modal
        title={
          <Space>
            <EditOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: '#0369a1', fontWeight: 600 }}>Cập nhật Hồ sơ Bệnh nhân [{selectedPatient?.maBenhNhan}]</span>
          </Space>
        }
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={760}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdatePatient} style={{ marginTop: 12 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={<Text strong>Họ và Tên Bệnh nhân</Text>}
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
              >
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={<Text strong>Giới tính</Text>} name="gender" rules={[{ required: true }]}>
                <Select size="large">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label={<Text strong>Ngày sinh</Text>} name="dateOfBirth" rules={[{ required: true }]}>
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label={<Text strong>Số CCCD / Định danh</Text>}
                name="identityCardNumber"
                rules={[{ required: true }]}
              >
                <Input size="large" maxLength={12} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<Text strong>Mã thẻ BHYT</Text>} name="healthInsuranceNumber">
                <Input size="large" maxLength={20} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<Text strong>Nhóm máu</Text>} name="bloodType">
                <Select size="large" allowClear>
                  <Option value="A+">A+</Option>
                  <Option value="A-">A-</Option>
                  <Option value="B+">B+</Option>
                  <Option value="B-">B-</Option>
                  <Option value="AB+">AB+</Option>
                  <Option value="AB-">AB-</Option>
                  <Option value="O+">O+</Option>
                  <Option value="O-">O-</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label={<Text strong>Số điện thoại</Text>} name="phoneNumber" rules={[{ required: true }]}>
                <Input size="large" maxLength={10} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<Text strong>Email</Text>} name="email">
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<Text strong>Địa chỉ</Text>} name="address" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label={<Text strong>Tiền sử bệnh lý</Text>} name="medicalHistory">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label={<Text strong style={{ color: '#dc2626' }}>Cảnh báo Dị ứng thuốc</Text>} name="drugAllergies">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Divider title="Người liên hệ khẩn cấp" />
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Họ tên người thân" name="emergencyContactName">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Mối quan hệ" name="emergencyContactRelation">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="SĐT khẩn cấp" name="emergencyContactPhone">
                <Input maxLength={10} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                Cập nhật Hồ sơ
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal 3: Chi tiết Hồ sơ Bệnh nhân (Detail View) */}
      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: '#0369a1', fontWeight: 600 }}>Chi tiết Hồ sơ Bệnh nhân</span>
          </Space>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>Đóng</Button>,
          <Button
            key="emr"
            type="primary"
            icon={<FileTextOutlined />}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              setIsDetailModalOpen(false);
              navigate('/emr', { state: { patientId: selectedPatient?.id, patientCode: selectedPatient?.maBenhNhan } });
            }}
          >
            Xem Hồ Sơ Bệnh Án (EMR)
          </Button>
        ]}
        width={720}
      >
        {selectedPatient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            {/* Warning banner if drug allergy */}
            {selectedPatient.diUngThuoc && !selectedPatient.diUngThuoc.toLowerCase().includes('không') && (
              <Alert
                message="CẢNH BÁO DỊ ỨNG THUỐC BỆNH NHÂN"
                description={selectedPatient.diUngThuoc}
                type="warning"
                showIcon
                icon={<WarningOutlined style={{ fontSize: 20 }} />}
                style={{ borderLeft: '4px solid #dc2626' }}
              />
            )}

            <Descriptions bordered size="middle" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Mã Bệnh Nhân">
                <Text strong style={{ color: '#0284c7', fontFamily: 'monospace', fontSize: 16 }}>
                  {selectedPatient.maBenhNhan}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Họ và Tên">
                <Text strong style={{ fontSize: 15 }}>{selectedPatient.hoTen}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                <Tag color={selectedPatient.gioiTinh === 'Nam' ? 'blue' : 'magenta'}>{selectedPatient.gioiTinh}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh (Tuổi)">
                {selectedPatient.ngaySinh} {selectedPatient.tuoi !== undefined && `(${selectedPatient.tuoi} tuổi)`}
              </Descriptions.Item>
              <Descriptions.Item label="Số CCCD">{selectedPatient.soCCCD}</Descriptions.Item>
              <Descriptions.Item label="Mã Thẻ BHYT">
                {selectedPatient.maTheBHYT ? (
                  <Tag color="green" icon={<SafetyOutlined />}>{selectedPatient.maTheBHYT}</Tag>
                ) : (
                  <Text type="secondary">Chưa đăng ký BHYT</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedPatient.soDienThoai}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedPatient.email || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ cư trú" span={2}>{selectedPatient.diaChi}</Descriptions.Item>
              <Descriptions.Item label="Nhóm máu">
                {selectedPatient.nhomMau ? <Tag color="red">{selectedPatient.nhomMau}</Tag> : 'Chưa xác định'}
              </Descriptions.Item>
              <Descriptions.Item label="Tiền sử bệnh">{selectedPatient.tienSuBenh || 'Chưa ghi nhận'}</Descriptions.Item>
              <Descriptions.Item label="Dị ứng thuốc" span={2}>
                <Text type={selectedPatient.diUngThuoc && !selectedPatient.diUngThuoc.toLowerCase().includes('không') ? 'danger' : 'secondary'} strong>
                  {selectedPatient.diUngThuoc || 'Không ghi nhận'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Người thân liên hệ khẩn cấp" span={2}>
                {selectedPatient.tenNguoiThan ? (
                  <span>
                    <Text strong>{selectedPatient.tenNguoiThan}</Text> ({selectedPatient.quanHeNguoiThan || 'Thân nhân'}) - SĐT: <Text code>{selectedPatient.soDienThoaiNguoiThan}</Text>
                  </span>
                ) : (
                  <Text type="secondary">Chưa cập nhật</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày khởi tạo hồ sơ" span={2}>
                {selectedPatient.ngayTao ? dayjs(selectedPatient.ngayTao).format('DD/MM/YYYY HH:mm') : 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

const Divider: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 8px 0' }}>
    <div style={{ flex: 1, height: 1, backgroundColor: '#bae6fd' }} />
    <span style={{ padding: '0 12px', fontSize: 12, fontWeight: 600, color: '#0369a1', textTransform: 'uppercase' }}>
      {title}
    </span>
    <div style={{ flex: 1, height: 1, backgroundColor: '#bae6fd' }} />
  </div>
);
