import React, { useState, useEffect, useCallback } from 'react';
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
import { appointmentService } from '../services/appointmentService';
import { queueService } from '../services/queueService';

const { Text } = Typography;
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



export const AppointmentsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const [appointments, setAppointments] = useState<OnlineAppointmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [prevLength, setPrevLength] = useState<number>(0);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
      if (prevLength > 0 && data.length > prevLength) {
        const latest = data[0];
        showToast(`🔥 Đặt lịch mới từ Flutter App: ${latest.patientName} (${latest.departmentName})`, 'success');
      }
      setPrevLength(data.length);
    } catch {
      // Fallback silent
    }
  }, [prevLength]);

  useEffect(() => {
    setLoading(true);
    fetchAppointments().finally(() => setLoading(false));

    // Real-time polling interval to sync app mobile to web admin
    const interval = setInterval(() => {
      fetchAppointments();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchAppointments]);

  // Actions
  const handleConfirmAppointment = async (item: OnlineAppointmentItem) => {
    await appointmentService.updateStatus(item.id, 'Confirmed');
    fetchAppointments();
    showSuccessAlert(
      'Đã xác nhận Lịch hẹn!',
      `Lịch hẹn của bệnh nhân ${item.patientName} lúc ${item.appointmentTime} ngày ${item.appointmentDate} đã được xác nhận.`
    );
  };

  const handleIssueQueueTicket = async (item: OnlineAppointmentItem) => {
    await appointmentService.updateStatus(item.id, 'Completed');
    const newTicket = await queueService.issueQueueTicket({
      patientId: `pt-${Date.now()}`,
      departmentId: 'dept-01',
      priority: 'Normal',
    });
    fetchAppointments();
    showSuccessAlert(
      'Cấp Số thứ tự thành công!',
      `Đã chuyển lịch hẹn thành Số thứ tự #${newTicket.sequenceNumber} tại ${item.departmentName}.`
    );
  };

  const handleCancelAppointment = (item: OnlineAppointmentItem) => {
    Modal.confirm({
      title: 'Hủy Lịch hẹn khám này?',
      content: `Bạn có chắc chắn muốn hủy lịch hẹn của bệnh nhân ${item.patientName}?`,
      okText: 'Xác nhận Hủy',
      okType: 'danger',
      cancelText: 'Quay lại',
      onOk: async () => {
        await appointmentService.updateStatus(item.id, 'Cancelled');
        fetchAppointments();
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
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 md:p-8 text-white shadow-md border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="status-dot-active" />
            <Text className="text-xs text-sky-300 font-semibold uppercase tracking-wider">Đồng Bộ Flutter Mobile App • Lịch Hẹn Online</Text>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Quản lý Lịch hẹn Đăng ký từ Bệnh nhân (Mobile App)
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Duyệt lịch đặt khám trực tuyến, tự động chuyển số thứ tự hàng chờ (Queue) khi bệnh nhân đến quầy
          </p>
        </div>
        <Space wrap>
          <Badge count={appointments.filter((a) => a.status === 'Pending').length} overflowCount={99}>
            <Tag color="processing" className="px-3 py-1 text-xs rounded-lg font-semibold">
              {appointments.filter((a) => a.status === 'Pending').length} Lịch hẹn chờ xác nhận
            </Tag>
          </Badge>
          <Button icon={<ReloadOutlined />} onClick={fetchAppointments} loading={loading} className="rounded-lg font-medium">
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Filter & Search Bar */}
      <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
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
      <Card bordered={false} className="rounded-xl bg-white dark:bg-slate-800 hover-lift">
        <Table
          dataSource={filteredAppointments}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 6 }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
};

export default AppointmentsPage;
