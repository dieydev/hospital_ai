import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Input,
  Select,
  Badge,
  Modal,
  Avatar,
  Tooltip,
} from 'antd';
import {
  ScheduleOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  PhoneOutlined,
  IdcardOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../store/useThemeStore';
import { showSuccessAlert, showToast } from '../utils/sweetAlert';

const { Title, Text } = Typography;
const { Option } = Select;

export interface OnlineAppointmentItem {
  id: string;
  patientCode: string;
  patientName: string;
  patientPhone: string;
  patientGender: string;
  patientAge: number;
  departmentName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  symptomsReason: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

const MOCK_APPOINTMENTS: OnlineAppointmentItem[] = [
  {
    id: 'apt-001',
    patientCode: 'BN20260015',
    patientName: 'Trần Văn Nam',
    patientPhone: '0987654321',
    patientGender: 'Nam',
    patientAge: 29,
    departmentName: 'Khoa Nội Tổng Hợp',
    doctorName: 'BS. CKII. Nguyễn Thanh Duy',
    appointmentDate: '2026-08-09',
    appointmentTime: '08:30',
    symptomsReason: 'Đau đầu âm ỉ kéo dài 2 ngày, kèm sốt nhẹ về chiều',
    status: 'Pending',
    createdAt: '2026-08-08 14:15',
  },
  {
    id: 'apt-002',
    patientCode: 'BN20260016',
    patientName: 'Nguyễn Thị Mai',
    patientPhone: '0912345678',
    patientGender: 'Nữ',
    patientAge: 42,
    departmentName: 'Khoa Tiêu Hóa',
    doctorName: 'BS. CKI. Lê Văn Tuấn',
    appointmentDate: '2026-08-09',
    appointmentTime: '09:15',
    symptomsReason: 'Đau tức vùng thượng vị sau khi ăn no, có ợ chua',
    status: 'Pending',
    createdAt: '2026-08-08 13:40',
  },
  {
    id: 'apt-003',
    patientCode: 'BN20260017',
    patientName: 'Phạm Hồng Sơn',
    patientPhone: '0934567890',
    patientGender: 'Nam',
    patientAge: 55,
    departmentName: 'Khoa Tim Mạch',
    doctorName: 'BS. CKII. Võ Minh Trí',
    appointmentDate: '2026-08-08',
    appointmentTime: '10:00',
    symptomsReason: 'Tái khám huyết áp định kỳ, ho nhẹ về đêm',
    status: 'Confirmed',
    createdAt: '2026-08-07 16:20',
  },
  {
    id: 'apt-004',
    patientCode: 'BN20260018',
    patientName: 'Lê Thu Hà',
    patientPhone: '0978123456',
    patientGender: 'Nữ',
    patientAge: 24,
    departmentName: 'Khoa Mắt',
    doctorName: 'BS. Trần Ngọc Mai',
    appointmentDate: '2026-08-08',
    appointmentTime: '14:00',
    symptomsReason: 'Khám kiểm tra tật khúc xạ thị lực',
    status: 'Completed',
    createdAt: '2026-08-06 09:30',
  },
  {
    id: 'apt-005',
    patientCode: 'BN20260019',
    patientName: 'Hoàng Văn Bách',
    patientPhone: '0905112233',
    patientGender: 'Nam',
    patientAge: 36,
    departmentName: 'Khoa Ngoại',
    doctorName: 'BS. CKII. Nguyễn Thanh Duy',
    appointmentDate: '2026-08-07',
    appointmentTime: '11:00',
    symptomsReason: 'Bệnh nhân xin hủy do bận công tác đột xuất',
    status: 'Cancelled',
    createdAt: '2026-08-05 15:10',
  },
];

export const AppointmentsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const [appointments, setAppointments] = useState<OnlineAppointmentItem[]>(MOCK_APPOINTMENTS);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Actions
  const handleConfirmAppointment = (item: OnlineAppointmentItem) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, status: 'Confirmed' } : a))
    );
    showSuccessAlert(
      'Đã xác nhận Lịch hẹn!',
      `Lịch hẹn của bệnh nhân ${item.patientName} lúc ${item.appointmentTime} ngày ${item.appointmentDate} đã được xác nhận.`
    );
  };

  const handleIssueQueueTicket = (item: OnlineAppointmentItem) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, status: 'Completed' } : a))
    );
    showSuccessAlert(
      'Cấp Số thứ tự thành công!',
      `Đã chuyển lịch hẹn thành Số thứ tự #${Math.floor(100 + Math.random() * 900)} tại ${item.departmentName}.`
    );
  };

  const handleCancelAppointment = (item: OnlineAppointmentItem) => {
    Modal.confirm({
      title: 'Hủy Lịch hẹn khám này?',
      content: `Bạn có chắc chắn muốn hủy lịch hẹn của bệnh nhân ${item.patientName}?`,
      okText: 'Xác nhận Hủy',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: () => {
        setAppointments((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, status: 'Cancelled' } : a))
        );
        showToast('Đã hủy lịch hẹn khám thành công!', 'info');
      },
    });
  };

  const filteredAppointments = appointments.filter((item) => {
    const matchSearch =
      item.patientName.toLowerCase().includes(searchText.toLowerCase()) ||
      item.patientCode.toLowerCase().includes(searchText.toLowerCase()) ||
      item.patientPhone.includes(searchText);
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchDept = selectedDept === 'ALL' || item.departmentName === selectedDept;
    return matchSearch && matchStatus && matchDept;
  });

  const columns = [
    {
      title: 'Bệnh nhân',
      key: 'patientName',
      width: 220,
      render: (record: OnlineAppointmentItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            style={{
              backgroundColor: record.patientGender === 'Nam' ? '#0284c7' : '#ec4899',
              fontWeight: 'bold',
              flexShrink: 0,
            }}
            icon={<UserOutlined />}
          >
            {record.patientName.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
              {record.patientName}
            </div>
            <div style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
              {record.patientGender} • {record.patientAge} tuổi
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Mã BN & SĐT',
      key: 'contactInfo',
      width: 200,
      render: (record: OnlineAppointmentItem) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <IdcardOutlined style={{ color: '#0284c7', fontSize: 13 }} />
            <Tag color="blue" style={{ margin: 0, fontFamily: 'monospace', fontWeight: 600 }}>
              {record.patientCode}
            </Tag>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDarkMode ? '#cbd5e1' : '#334155', fontSize: 13, fontWeight: 500 }}>
            <PhoneOutlined style={{ color: '#10b981', fontSize: 13 }} />
            <span style={{ fontFamily: 'monospace' }}>{record.patientPhone}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Chuyên khoa & Bác sĩ',
      key: 'dept',
      width: 220,
      render: (record: OnlineAppointmentItem) => (
        <div>
          <div style={{ fontWeight: 600, color: isDarkMode ? '#38bdf8' : '#0284c7', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MedicineBoxOutlined /> {record.departmentName}
          </div>
          <Text style={{ fontSize: 12, color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
            {record.doctorName}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ngày & Giờ hẹn',
      key: 'time',
      width: 170,
      render: (record: OnlineAppointmentItem) => (
        <div style={{ whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 13 }}>
            <CalendarOutlined style={{ color: '#0284c7' }} />
            <span>{record.appointmentDate}</span>
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClockCircleOutlined style={{ color: '#f59e0b' }} />
            <Tag color="warning" style={{ margin: 0, fontFamily: 'monospace', fontWeight: 'bold' }}>
              {record.appointmentTime}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Lý do / Triệu chứng',
      dataIndex: 'symptomsReason',
      key: 'symptomsReason',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ fontSize: 13, color: isDarkMode ? '#cbd5e1' : '#334155' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status: OnlineAppointmentItem['status']) => {
        let color = 'default';
        let text = 'Chờ xử lý';
        if (status === 'Pending') {
          color = 'processing';
          text = 'Chờ xác nhận';
        } else if (status === 'Confirmed') {
          color = 'success';
          text = 'Đã xác nhận';
        } else if (status === 'Completed') {
          color = 'cyan';
          text = 'Đã tiếp nhận (STT)';
        } else if (status === 'Cancelled') {
          color = 'error';
          text = 'Đã hủy';
        }
        return <Tag color={color} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>{text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (record: OnlineAppointmentItem) => (
        <Space size={6} wrap={false}>
          {record.status === 'Pending' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleConfirmAppointment(record)}
            >
              Xác nhận
            </Button>
          )}

          {record.status === 'Confirmed' && (
            <Button
              type="primary"
              size="small"
              style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
              icon={<ThunderboltOutlined />}
              onClick={() => handleIssueQueueTicket(record)}
            >
              Cấp STT
            </Button>
          )}

          {record.status !== 'Cancelled' && record.status !== 'Completed' && (
            <Button
              type="text"
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancelAppointment(record)}
            >
              Hủy
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Banner */}
      <Card
        style={{
          borderRadius: 16,
          background: isDarkMode
            ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 50%, #e2e8f0 100%)',
          border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd',
          boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(2, 132, 199, 0.1)',
        }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Space size={14} align="center">
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 24,
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                }}
              >
                <ScheduleOutlined />
              </div>
              <div>
                <Title level={3} style={{ margin: 0, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
                  Quản lý Lịch hẹn Khám Trực tuyến
                </Title>
                <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                  Tiếp nhận, xác nhận và tự động cấp số hàng chờ cho bệnh nhân đăng ký từ Mobile Patient App
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Badge count={appointments.filter((a) => a.status === 'Pending').length} overflowCount={99}>
                <Tag color="processing" style={{ padding: '6px 14px', fontSize: 14, borderRadius: 10 }}>
                  {appointments.filter((a) => a.status === 'Pending').length} Lịch hẹn chờ xác nhận
                </Tag>
              </Badge>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Filter & Search Bar */}
      <Card style={{ borderRadius: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm theo tên bệnh nhân, Mã BN hoặc SĐT..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
            >
              <Option value="ALL">Tất cả trạng thái</Option>
              <Option value="Pending">Chờ xác nhận</Option>
              <Option value="Confirmed">Đã xác nhận</Option>
              <Option value="Completed">Đã tiếp nhận (STT)</Option>
              <Option value="Cancelled">Đã hủy</Option>
            </Select>
          </Col>

          <Col xs={12} sm={6} md={5}>
            <Select
              style={{ width: '100%' }}
              value={selectedDept}
              onChange={(val) => setSelectedDept(val)}
            >
              <Option value="ALL">Tất cả Chuyên khoa</Option>
              <Option value="Khoa Nội Tổng Hợp">Khoa Nội Tổng Hợp</Option>
              <Option value="Khoa Tiêu Hóa">Khoa Tiêu Hóa</Option>
              <Option value="Khoa Tim Mạch">Khoa Tim Mạch</Option>
              <Option value="Khoa Mắt">Khoa Mắt</Option>
              <Option value="Khoa Ngoại">Khoa Ngoại</Option>
            </Select>
          </Col>

          <Col xs={24} sm={24} md={6} style={{ textAlign: 'right' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchText('');
                setStatusFilter('ALL');
                setSelectedDept('ALL');
              }}
            >
              Làm mới bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Main Appointments Table */}
      <Card style={{ borderRadius: 16 }}>
        <Table
          dataSource={filteredAppointments}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 6 }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
};

export default AppointmentsPage;
