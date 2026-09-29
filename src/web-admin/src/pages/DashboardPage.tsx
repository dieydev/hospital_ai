import React, { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Button,
  Progress,
  Tabs,
  Badge,
  Space,
  Select,
} from 'antd';
import {
  UserOutlined,
  ScheduleOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  PieChartOutlined,
  BarChartOutlined,
  AlertOutlined,
  SoundOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  HeartOutlined,
  ExperimentOutlined,
  RightOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/useThemeStore';
import { signalrService } from '../services/signalrService';
import { showToast, showSuccessAlert } from '../utils/sweetAlert';

const { Option } = Select;

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useThemeStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedFloor, setSelectedFloor] = useState('ALL');

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // SignalR subscription
  useEffect(() => {
    const unsubscribe = signalrService.subscribeQueueUpdates(() => {
      console.log('⚡ Dashboard live queue real-time event received');
    });
    return () => unsubscribe();
  }, []);

  // Department Clinical Stats
  const chartData = [
    { name: 'Khoa Nội', lutKham: 142, revenue: 28500000, cls: 64 },
    { name: 'Khoa Ngoại', lutKham: 98, revenue: 45000000, cls: 82 },
    { name: 'Khoa Nhi', lutKham: 115, revenue: 19800000, cls: 48 },
    { name: 'Khoa Sản', lutKham: 86, revenue: 32400000, cls: 72 },
    { name: 'Khoa Mắt', lutKham: 64, revenue: 14200000, cls: 36 },
    { name: 'Khoa RHM', lutKham: 52, revenue: 18900000, cls: 24 },
    { name: 'Tai Mũi Họng', lutKham: 78, revenue: 21500000, cls: 52 },
    { name: 'Tim Mạch', lutKham: 68, revenue: 38200000, cls: 60 },
  ];

  const receptionSourceData = [
    { name: 'Flutter Mobile App', value: 45, color: '#0284c7', count: 71 },
    { name: 'Quầy Lễ Tân Trực Tiếp', value: 35, color: '#10b981', count: 55 },
    { name: 'Cấp Cứu & Ưu Tiên', value: 12, color: '#f43f5e', count: 19 },
    { name: 'Đặt Qua Hotline / Web', value: 8, color: '#f59e0b', count: 13 },
  ];

  // Clinical Rooms Real-time Monitoring Grid
  const clinicRooms = [
    {
      id: 'P101',
      name: 'Phòng 101 - Khám Nội 1',
      floor: 'Tầng 1',
      doctor: 'BS. CKII. Nguyễn Thanh Duy',
      patientNow: 'BN20260001 (Nguyễn Văn An)',
      waitingCount: 4,
      status: 'active',
      statusText: 'Đang khám',
      duration: '12 phút',
      specialty: 'Khoa Nội Tổng Hợp',
    },
    {
      id: 'P102',
      name: 'Phòng 102 - Khám Nội 2',
      floor: 'Tầng 1',
      doctor: 'BS. CKI. Đỗ Hoàng Giang',
      patientNow: 'BN20260004 (Phạm Thu Cúc)',
      waitingCount: 3,
      status: 'active',
      statusText: 'Đang khám',
      duration: '8 phút',
      specialty: 'Khoa Nội Tổng Hợp',
    },
    {
      id: 'P105',
      name: 'Phòng 105 - Khám Nhi',
      floor: 'Tầng 1',
      doctor: 'BS. CKI. Phạm Minh Đức',
      patientNow: 'BN20260003 (Lê Hoàng Nam)',
      waitingCount: 7,
      status: 'busy',
      statusText: 'Đông bệnh nhân',
      duration: '15 phút',
      specialty: 'Khoa Nhi',
    },
    {
      id: 'P201',
      name: 'Phòng 201 - Khám Mắt',
      floor: 'Tầng 2',
      doctor: 'BS. CKI. Trần Ngọc Mai',
      patientNow: 'BN20260005 (Vũ Đức Đạt)',
      waitingCount: 1,
      status: 'active',
      statusText: 'Đang khám',
      duration: '6 phút',
      specialty: 'Khoa Mắt',
    },
    {
      id: 'P205',
      name: 'Phòng 205 - Tai Mũi Họng',
      floor: 'Tầng 2',
      doctor: 'BS. CKII. Lê Văn Tuấn',
      patientNow: 'Đang chuẩn bị nội soi',
      waitingCount: 3,
      status: 'preparing',
      statusText: 'Chuẩn bị ca mới',
      duration: '--',
      specialty: 'Khoa TMH',
    },
    {
      id: 'P301',
      name: 'Phòng 301 - Tim Mạch',
      floor: 'Tầng 3',
      doctor: 'TS. BS. Huỳnh Quốc Dũng',
      patientNow: 'BN20260009 (Đoạn Văn C)',
      waitingCount: 2,
      status: 'active',
      statusText: 'Đang đo ECG',
      duration: '18 phút',
      specialty: 'Khoa Tim Mạch',
    },
    {
      id: 'P308',
      name: 'Phòng 308 - Sản Phụ Khoa',
      floor: 'Tầng 3',
      doctor: 'BS. CKII. Lê Thị Kim Phượng',
      patientNow: 'BN20260002 (Trần Thị Bình)',
      waitingCount: 5,
      status: 'active',
      statusText: 'Đang siêu âm 4D',
      duration: '14 phút',
      specialty: 'Khoa Sản',
    },
    {
      id: 'PER',
      name: 'Khu Cấp Cứu & Hồi Sức',
      floor: 'Tầng Trệt',
      doctor: 'BS. CKI. Trịnh Văn Thành',
      patientNow: '3 ca đa chấn thương & suy hô hấp',
      waitingCount: 0,
      status: 'emergency',
      statusText: 'Cấp cứu ưu tiên',
      duration: 'Trực 24/7',
      specialty: 'Cấp Cứu (ICU)',
    },
  ];

  const filteredRooms = useMemo(() => {
    if (selectedFloor === 'ALL') return clinicRooms;
    return clinicRooms.filter((r) => r.floor.includes(selectedFloor));
  }, [selectedFloor, clinicRooms]);

  // Live Queue Data
  const recentQueue = [
    {
      stt: 101,
      maBN: 'BN20260001',
      hoTen: 'Nguyễn Văn An',
      gioiTinh: 'Nam',
      namSinh: 1990,
      bhyt: 'DN40101234567',
      phong: 'Phòng 101 - Khoa Nội',
      bacSi: 'BS. CKII. Nguyễn Thanh Duy',
      triage: 'Bình thường',
      trangThai: 'Đang khám',
      thoiGianCho: '4 phút',
      time: '08:30',
    },
    {
      stt: 102,
      maBN: 'BN20260002',
      hoTen: 'Trần Thị Bình',
      gioiTinh: 'Nữ',
      namSinh: 1994,
      bhyt: 'DN40101234588',
      phong: 'Phòng 308 - Sản Phụ Khoa',
      bacSi: 'BS. CKII. Lê Thị Kim Phượng',
      triage: 'Ưu tiên thai sản',
      trangThai: 'Chờ cận lâm sàng',
      thoiGianCho: '12 phút',
      time: '08:45',
    },
    {
      stt: 103,
      maBN: 'BN20260003',
      hoTen: 'Lê Hoàng Nam',
      gioiTinh: 'Nam',
      namSinh: 2018,
      bhyt: 'TE10101234999',
      phong: 'Phòng 105 - Khoa Nhi',
      bacSi: 'BS. CKI. Phạm Minh Đức',
      triage: 'Trẻ em dưới 6 tuổi',
      trangThai: 'Đang chờ',
      thoiGianCho: '18 phút',
      time: '09:00',
    },
    {
      stt: 104,
      maBN: 'BN20260004',
      hoTen: 'Phạm Thu Cúc',
      gioiTinh: 'Nữ',
      namSinh: 1965,
      bhyt: 'HT20101234123',
      phong: 'Phòng 102 - Khoa Nội',
      bacSi: 'BS. CKI. Đỗ Hoàng Giang',
      triage: 'Người cao tuổi',
      trangThai: 'Đang chờ',
      thoiGianCho: '22 phút',
      time: '09:15',
    },
    {
      stt: 105,
      maBN: 'BN20260005',
      hoTen: 'Vũ Đức Đạt',
      gioiTinh: 'Nam',
      namSinh: 2001,
      bhyt: 'SV40101239988',
      phong: 'Phòng 201 - Khoa Mắt',
      bacSi: 'BS. CKI. Trần Ngọc Mai',
      triage: 'Bình thường',
      trangThai: 'Hoàn thành',
      thoiGianCho: '8 phút',
      time: '08:15',
    },
  ];

  // Mobile App Appointments List
  const mobileAppointments = [
    {
      id: 'APP-9021',
      maBN: 'BN20260012',
      hoTen: 'Hoàng Minh Khang',
      sdt: '0912 345 678',
      gioHen: '09:30',
      chuyenKhoa: 'Khoa Tim Mạch',
      bacSi: 'TS. BS. Huỳnh Quốc Dũng',
      trangThai: 'Đã đến quầy',
    },
    {
      id: 'APP-9022',
      maBN: 'BN20260015',
      hoTen: 'Đỗ Thúy Hằng',
      sdt: '0988 765 432',
      gioHen: '10:00',
      chuyenKhoa: 'Khoa Nhi',
      bacSi: 'BS. CKI. Phạm Minh Đức',
      trangThai: 'Đang trên đường đến',
    },
    {
      id: 'APP-9023',
      maBN: 'BN20260018',
      hoTen: 'Nguyễn Văn Hùng',
      sdt: '0903 112 233',
      gioHen: '10:15',
      chuyenKhoa: 'Khoa Nội Tổng Hợp',
      bacSi: 'BS. CKII. Nguyễn Thanh Duy',
      trangThai: 'Chờ check-in',
    },
  ];

  // Clinical Alerts / AI Drug Safety Warnings
  const clinicalAlerts = [
    {
      id: 'ALT-01',
      maBN: 'BN20260001',
      hoTen: 'Nguyễn Văn An',
      loai: 'Tương tác thuốc nghiêm trọng',
      chiTiet: 'Phát hiện kê đồng thời Clopidogrel + Omeprazole (Giảm tác dụng chống đông)',
      mucDo: 'Cao (High)',
      bacSi: 'BS. CKII. Nguyễn Thanh Duy',
      thoiGian: '5 phút trước',
    },
    {
      id: 'ALT-02',
      maBN: 'BN20260004',
      hoTen: 'Phạm Thu Cúc',
      loai: 'Cảnh báo Dị ứng Thuốc',
      chiTiet: 'Bệnh nhân có tiền sử sốc phản vệ với nhóm Kháng sinh Beta-lactam (Penicillin)',
      mucDo: 'Nghiêm trọng (Critical)',
      bacSi: 'BS. CKI. Đỗ Hoàng Giang',
      thoiGian: '12 phút trước',
    },
    {
      id: 'ALT-03',
      maBN: 'BN20260008',
      hoTen: 'Trương Quốc Cường',
      loai: 'Chỉ số sinh tồn bất thường',
      chiTiet: 'Huyết áp tâm thu: 185/110 mmHg • Cần xử trí hạ áp khẩn cấp',
      mucDo: 'Cảnh báo đỏ (Red Alert)',
      bacSi: 'BS. CKI. Trịnh Văn Thành',
      thoiGian: '25 phút trước',
    },
  ];

  const columns = [
    {
      title: 'Số STT',
      dataIndex: 'stt',
      key: 'stt',
      width: 85,
      render: (val: number) => (
        <span className="font-bold text-lg text-sky-600 dark:text-sky-400 font-mono">
          #{val}
        </span>
      ),
    },
    {
      title: 'Mã Bệnh Nhân',
      dataIndex: 'maBN',
      key: 'maBN',
      width: 125,
      render: (code: string) => (
        <Tag color="blue" className="font-mono text-xs px-2 py-0.5 rounded-md font-semibold">
          {code}
        </Tag>
      ),
    },
    {
      title: 'Họ và Tên Bệnh Nhân',
      dataIndex: 'hoTen',
      key: 'hoTen',
      render: (text: string, row: any) => (
        <div>
          <span className="text-slate-900 dark:text-slate-100 font-bold block">{text}</span>
          <span className="text-slate-500 text-xs">
            {row.gioiTinh} • {2026 - row.namSinh} tuổi • BHYT: {row.bhyt}
          </span>
        </div>
      ),
    },
    {
      title: 'Phân Loại Triage',
      dataIndex: 'triage',
      key: 'triage',
      render: (t: string) => {
        let color = 'default';
        if (t.includes('Cấp cứu')) color = 'error';
        else if (t.includes('Ưu tiên') || t.includes('Trẻ em')) color = 'warning';
        else if (t.includes('Người cao tuổi')) color = 'purple';
        return <Tag color={color} className="font-semibold">{t}</Tag>;
      },
    },
    {
      title: 'Phòng Khám & Bác Sĩ',
      dataIndex: 'phong',
      key: 'phong',
      render: (phong: string, row: any) => (
        <div>
          <span className="text-slate-800 dark:text-slate-200 font-semibold block">{phong}</span>
          <span className="text-slate-500 text-xs">{row.bacSi}</span>
        </div>
      ),
    },
    {
      title: 'Thời Gian Chờ',
      dataIndex: 'thoiGianCho',
      key: 'thoiGianCho',
      render: (tg: string, row: any) => (
        <div>
          <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono text-xs block">
            ⏳ {tg}
          </span>
          <span className="text-slate-400 text-xs">Cấp lúc: {row.time}</span>
        </div>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (st: string) => {
        let color = 'default';
        if (st === 'Đang khám') color = 'processing';
        if (st === 'Chờ cận lâm sàng') color = 'purple';
        if (st === 'Đang chờ') color = 'warning';
        if (st === 'Hoàn thành') color = 'success';
        return <Tag color={color} className="font-semibold px-2 py-0.5">{st}</Tag>;
      },
    },
    {
      title: 'Thao Tác Nhanh',
      key: 'action',
      render: (_: any, row: any) => (
        <Space size="small">
          <Button
            size="small"
            icon={<SoundOutlined />}
            type="primary"
            style={{ backgroundColor: '#0284c7' }}
            onClick={() => showToast(`Đang phát loa gọi bệnh nhân: ${row.hoTen} vào ${row.phong}`, 'info')}
          >
            Gọi loa
          </Button>
          <Button
            size="small"
            icon={<RightOutlined />}
            onClick={() => navigate('/examinations')}
          >
            Vào khám
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Realtime Medical Operations Ticker Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl px-4 py-2.5 shadow-sm border border-sky-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900">
            <span className="status-dot-pulse bg-rose-500 w-2 h-2 rounded-full inline-block" />
            CẤP CỨU (ICU): 3 CA KHẨN
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-medium">
            <HeartOutlined className="text-sky-600" /> Giường bệnh: <strong>428/480 (89.2%)</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-medium">
            <TeamOutlined className="text-emerald-600" /> Kíp trực: <strong>38 Bác sĩ • 62 Điều dưỡng</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-medium">
            <ClockCircleOutlined className="text-amber-500" /> Chờ khám TB: <strong>12.4 phút</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-medium">
            <ExperimentOutlined className="text-purple-600" /> Cơ số Dược: <strong className="text-emerald-600">98.5% Sẵn sàng</strong>
          </span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-emerald-600 flex items-center gap-1 font-semibold">
            <CheckCircleFilled /> PACS/LIS/EMR Online
          </span>
        </div>

        <div className="font-mono text-sky-700 dark:text-sky-300 font-bold bg-sky-50 dark:bg-slate-900/60 px-3 py-1 rounded-md border border-sky-200 dark:border-slate-700">
          🕒 {currentTime.toLocaleDateString('vi-VN')} — {currentTime.toLocaleTimeString('vi-VN')}
        </div>
      </div>

      {/* 2. Professional Medical Command Center Banner (Well-proportioned 2-column distribution) */}
      <div className="medical-hero-banner relative overflow-hidden rounded-2xl p-7 md:p-8 text-white shadow-md border border-teal-500/30">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" /> Ca trực Lâm sàng • Khoa Nội & Cấp Cứu
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-teal-100 font-medium bg-black/15 px-2.5 py-1 rounded-full">
                <ThunderboltOutlined className="text-amber-300" /> Trung Tâm Điều Phối Y Tế Thông Minh Hospital AI
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2 leading-tight">
              Bảng Điều Khiển Trung Tâm Bệnh Viện & Hồ Sơ Bệnh Án Điện Tử (EMR)
            </h1>
            <p className="text-teal-50/90 text-sm leading-relaxed max-w-xl">
              Trưởng kíp trực: <strong className="text-white font-bold">BS. CKII. Nguyễn Thanh Duy</strong> • Giám sát <strong className="text-white font-bold">12 phòng khám</strong> và <strong className="text-white font-bold">42 ca bệnh</strong> đang tiếp nhận trong phiên trực.
            </p>
          </div>

          {/* Action Toolbar (Solid white with teal text for primary, transparent with 1px border for secondary) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="medical-hero-btn-primary h-10 px-5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm"
              onClick={() => navigate('/reception')}
            >
              Tiếp nhận & Cấp số
            </Button>
            <Button
              icon={<MedicineBoxOutlined />}
              className="medical-hero-btn-secondary h-10 px-4 rounded-xl font-medium text-sm flex items-center gap-2"
              onClick={() => navigate('/examinations')}
            >
              Phòng Khám SOAP
            </Button>
            <Button
              icon={<SoundOutlined />}
              className="medical-hero-btn-secondary h-10 px-3.5 rounded-xl font-medium text-sm flex items-center gap-2"
              onClick={() => showSuccessAlert('Phát thanh Y tế', 'Đã gửi thông báo điều phối tới toàn bộ loa sảnh chờ các tầng.')}
            >
              Loa Viện
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Sơ Đồ & Biểu Đồ Phân Tích Điều Hành Trung Tâm (Main Analytics Charts Grid) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <BarChartOutlined className="text-sky-600 text-lg" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-base block">
                      Sơ Đồ Lượt Khám & Chỉ Định Cận Lâm Sàng (CLS) Theo Khoa
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      Phân tích lưu lượng bệnh nhân và chỉ định xét nghiệm/X-Quang thời gian thực
                    </span>
                  </div>
                </div>
                <Tag color="cyan" className="font-semibold">Hôm nay</Tag>
              </div>
            }
            bordered={false}
            className="rounded-2xl bg-white dark:bg-slate-800 hover-lift shadow-sm border border-sky-100 dark:border-slate-700"
          >
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} stroke={isDarkMode ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} stroke="#10b981" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      name.includes('CLS') ? `${val} ca xét nghiệm` : `${val} lượt khám`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: 10,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#bae6fd',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: 12,
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.15)',
                    }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} wrapperStyle={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="lutKham" fill="#0284c7" name="Lượt khám lâm sàng (Ca)" radius={[6, 6, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="cls" stroke="#10b981" strokeWidth={3} name="Chỉ định CLS (Xét nghiệm/X-Quang)" dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <PieChartOutlined className="text-emerald-600 text-lg" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-base block">
                      Sơ Đồ Phân Bổ Kênh Tiếp Nhận
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      Tỷ trọng đăng ký qua App, Quầy lễ tân & Cấp cứu
                    </span>
                  </div>
                </div>
                <Tag color="blue" className="font-semibold font-mono">158 Ca</Tag>
              </div>
            }
            bordered={false}
            className="rounded-2xl bg-white dark:bg-slate-800 hover-lift shadow-sm border border-sky-100 dark:border-slate-700"
          >
            <div className="w-full h-80 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={receptionSourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {receptionSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${val}% tổng tiếp nhận`, 'Tỷ lệ']}
                    contentStyle={{
                      borderRadius: 10,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      borderColor: isDarkMode ? '#334155' : '#bae6fd',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Data Breakdown Table */}
              <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                {receptionSourceData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-2 py-1 rounded bg-slate-50 dark:bg-slate-900/60">
                    <span className="flex items-center gap-1.5 truncate">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                    </span>
                    <strong className="text-slate-900 dark:text-white font-mono ml-1">{item.count} ca</strong>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 4. Comprehensive 8 KPI Cards Grid (Minimum 24px inner padding & generous whitespace) */}
      <Row gutter={[16, 16]}>
        {/* Card 1: Tổng tiếp nhận */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover-lift shadow-sm" bodyStyle={{ padding: '24px' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">TỔNG TIẾP NHẬN HÔM NAY</span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white my-2 tracking-tight">158 <span className="text-sm font-normal text-slate-400">ca</span></h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-slate-900 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl shrink-0">
                <UserOutlined />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <ArrowUpOutlined /> +12.5% so hôm qua
              </span>
              <span className="text-slate-400">BHYT: 68% • VP: 32%</span>
            </div>
          </Card>
        </Col>

        {/* Card 2: Đặt lịch Mobile App */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover-lift shadow-sm" bodyStyle={{ padding: '24px' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">ĐẶT LỊCH FLUTTER APP</span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white my-2 tracking-tight">
                  45 <span className="text-sm font-normal text-slate-400">/ 50 ca</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-slate-900 text-amber-500 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                <ScheduleOutlined />
              </div>
            </div>
            <Progress percent={90} size="small" strokeColor="#f59e0b" className="my-1.5" />
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex justify-between text-xs text-slate-400">
              <span>Đã check-in: 38</span>
              <span>Đang đến: 7 ca</span>
            </div>
          </Card>
        </Col>

        {/* Card 3: Ca khám hoàn thành */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover-lift shadow-sm" bodyStyle={{ padding: '24px' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">CA KHÁM HOÀN THÀNH</span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white my-2 tracking-tight">92 <span className="text-sm font-normal text-slate-400">ca</span></h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-slate-900 text-emerald-500 dark:text-emerald-400 flex items-center justify-center text-xl shrink-0">
                <CheckCircleFilled />
              </div>
            </div>
            <Progress percent={58} size="small" strokeColor="#10b981" className="my-1.5" />
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex justify-between text-xs text-slate-400">
              <span>Đang khám: 24 ca</span>
              <span>Chờ CLS: 42 ca</span>
            </div>
          </Card>
        </Col>

        {/* Card 4: Doanh thu viện phí */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover-lift shadow-sm" bodyStyle={{ padding: '24px' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">DOANH THU VIỆN PHÍ</span>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white my-2 tracking-tight">{formatCurrency(158800000)}</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-slate-900 text-indigo-500 dark:text-indigo-400 flex items-center justify-center text-xl shrink-0">
                <DollarOutlined />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <ArrowUpOutlined /> +8.4% tuần này
              </span>
              <span className="text-slate-400">BHYT: 62% • VietQR: 38%</span>
            </div>
          </Card>
        </Col>

        {/* Card 5: Giường nội trú */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover-lift shadow-sm" bodyStyle={{ padding: '24px' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">LẤP ĐẦY GIƯỜNG NỘI TRÚ</span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white my-2 tracking-tight">
                  89.2% <span className="text-sm font-normal text-slate-400">(428/480)</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-slate-900 text-rose-500 dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
                <HeartOutlined />
              </div>
            </div>
            <Progress percent={89.2} size="small" strokeColor="#ef4444" className="my-1.5" />
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex justify-between text-xs text-slate-400">
              <span className="text-rose-500 font-medium">Hồi sức ICU: 18/20</span>
              <span>Ngoại trú: Ổn định</span>
            </div>
          </Card>
        </Col>

        {/* Card 6: Thời gian chờ trung bình */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover-lift shadow-sm" bodyStyle={{ padding: '24px' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">THỜI GIAN CHỜ TRUNG BÌNH</span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white my-2 tracking-tight">
                  12.4 <span className="text-sm font-normal text-slate-400">phút/ca</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-slate-900 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl shrink-0">
                <ClockCircleOutlined />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <ArrowDownOutlined /> Giảm 3.2 phút
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">Chuẩn BYT &lt;15p</span>
            </div>
          </Card>
        </Col>

        {/* Card 7: Dịch vụ Cận lâm sàng */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover-lift shadow-sm" bodyStyle={{ padding: '24px' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">DỊCH VỤ CẬN LÂM SÀNG (CLS)</span>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white my-2 tracking-tight">
                  178 <span className="text-sm font-normal text-slate-400">chỉ định</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-slate-900 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xl shrink-0">
                <ExperimentOutlined />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
              <span>Đã có kết quả: 146 ca</span>
              <span className="text-teal-600 font-semibold">Tự động đẩy EMR</span>
            </div>
          </Card>
        </Col>

        {/* Card 8: Cảnh báo AI Triage */}
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="rounded-2xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover-lift shadow-sm" bodyStyle={{ padding: '24px' }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">CẢNH BÁO AN TOÀN AI</span>
                <h2 className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 my-2 tracking-tight">
                  06 <span className="text-sm font-normal text-slate-400">cảnh báo</span>
                </h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-slate-900 text-rose-500 dark:text-rose-400 flex items-center justify-center text-xl shrink-0">
                <AlertOutlined />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-rose-500 font-medium">2 Dị ứng • 4 Tương tác</span>
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-medium border border-rose-200">Đã xử lý 100%</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 5. Sơ Đồ Giám Sát Vận Hành Phòng Khám Thời Gian Thực (Live Clinic Rooms Monitor) */}
      <Card
        title={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full py-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <ThunderboltOutlined />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-base block">
                  Sơ Đồ Giám Sát Vận Hành Phòng Khám Thời Gian Thực (Live Clinic Rooms Layout)
                </span>
                <span className="text-xs text-slate-500 font-normal">
                  Theo dõi trực quan bác sĩ đang trực, ca bệnh hiện tại và số lượng hàng chờ từng phòng
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Lọc theo tầng:</span>
              <Select value={selectedFloor} onChange={setSelectedFloor} style={{ width: 140 }} size="middle">
                <Option value="ALL">Tất cả các tầng</Option>
                <Option value="Tầng 1">Tầng 1 (Khoa Nội/Nhi)</Option>
                <Option value="Tầng 2">Tầng 2 (Mắt/TMH)</Option>
                <Option value="Tầng 3">Tầng 3 (Tim Mạch/Sản)</Option>
                <Option value="Tầng Trệt">Tầng Trệt (Cấp Cứu)</Option>
              </Select>
            </div>
          </div>
        }
        bordered={false}
        className="rounded-2xl shadow-sm bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700/80 hover-lift"
        bodyStyle={{ padding: '24px' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const isEmergency = room.status === 'emergency';
            const isBusy = room.status === 'busy';
            const isPreparing = room.status === 'preparing';

            return (
              <div
                key={room.id}
                className={`p-4 rounded-xl bg-white dark:bg-slate-800 border transition-all duration-200 shadow-sm hover:shadow-md ${
                  isEmergency
                    ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
                    : isBusy
                    ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/20'
                    : isPreparing
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-slate-200 hover:border-teal-400 dark:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-base block font-mono">
                      {room.name}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{room.floor} • {room.specialty}</span>
                  </div>
                  <Tag
                    color={isEmergency ? 'red' : isBusy ? 'warning' : isPreparing ? 'default' : 'processing'}
                    className="m-0 text-xs font-semibold px-2 py-0.5 rounded-md"
                  >
                    {room.statusText}
                  </Tag>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 mb-2.5">
                  <span className="text-slate-400 block text-[11px]">Bác sĩ phụ trách:</span>
                  <strong className="text-slate-800 dark:text-slate-100 text-xs">{room.doctor}</strong>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 mb-3 text-xs">
                  <span className="text-slate-400 block text-[10.5px]">Bệnh nhân đang khám:</span>
                  <span className="font-semibold text-teal-700 dark:text-teal-300 truncate block text-xs mt-0.5">
                    {room.patientNow}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-500 font-medium">
                    Hàng chờ: <strong className="text-teal-600 font-mono text-sm font-bold">{room.waitingCount}</strong> ca
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {room.duration !== '--' ? `⏱️ ${room.duration}` : 'Sẵn sàng'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 6. Multi-tab Hospital Operational Command Data */}
      <Card
        bordered={false}
        className="rounded-2xl shadow-sm bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700 hover-lift"
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarExtraContent={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={() => showToast('Đang đồng bộ dữ liệu hàng chờ và lịch hẹn...', 'info')}
              >
                Làm mới Realtime
              </Button>
              <Button
                type="primary"
                size="small"
                style={{ backgroundColor: '#0284c7' }}
                onClick={() => navigate('/reception')}
              >
                Quản lý Tiếp Nhận
              </Button>
            </Space>
          }
          items={[
            {
              key: 'queue',
              label: (
                <span className="flex items-center gap-2 font-bold text-sm">
                  <ClockCircleOutlined className="text-sky-600" />
                  Hàng Chờ Khám Lâm Sàng Realtime ({recentQueue.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={recentQueue}
                  columns={columns}
                  rowKey="stt"
                  pagination={false}
                  size="middle"
                />
              ),
            },
            {
              key: 'appointments',
              label: (
                <span className="flex items-center gap-2 font-bold text-sm">
                  <ScheduleOutlined className="text-amber-500" />
                  Lịch Hẹn Khám Từ Mobile App Hôm Nay
                  <Badge count={mobileAppointments.length} style={{ backgroundColor: '#f59e0b' }} />
                </span>
              ),
              children: (
                <Table
                  dataSource={mobileAppointments}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  columns={[
                    {
                      title: 'Mã Lịch Hẹn',
                      dataIndex: 'id',
                      key: 'id',
                      render: (id: string) => <Tag color="orange" className="font-mono font-bold">{id}</Tag>,
                    },
                    {
                      title: 'Mã BN',
                      dataIndex: 'maBN',
                      key: 'maBN',
                      render: (code: string) => <Tag color="blue" className="font-mono">{code}</Tag>,
                    },
                    {
                      title: 'Bệnh Nhân',
                      dataIndex: 'hoTen',
                      key: 'hoTen',
                      render: (name: string, row: any) => (
                        <div>
                          <strong className="text-slate-800 dark:text-slate-200 block">{name}</strong>
                          <span className="text-slate-500 text-xs">SĐT: {row.sdt}</span>
                        </div>
                      ),
                    },
                    {
                      title: 'Giờ Hẹn Khám',
                      dataIndex: 'gioHen',
                      key: 'gioHen',
                      render: (gh: string) => (
                        <span className="font-mono text-sky-600 font-bold bg-sky-50 dark:bg-slate-900 px-2.5 py-1 rounded-md">
                          ⏰ {gh}
                        </span>
                      ),
                    },
                    {
                      title: 'Chuyên Khoa Đăng Ký',
                      dataIndex: 'chuyenKhoa',
                      key: 'chuyenKhoa',
                      render: (ck: string, row: any) => (
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{ck}</span>
                          <span className="text-slate-400 text-xs">{row.bacSi}</span>
                        </div>
                      ),
                    },
                    {
                      title: 'Trạng Thái',
                      dataIndex: 'trangThai',
                      key: 'trangThai',
                      render: (st: string) => (
                        <Tag color={st === 'Đã đến quầy' ? 'success' : 'processing'} className="font-semibold">
                          {st}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Thao Tác',
                      key: 'act',
                      render: (_: any, row: any) => (
                        <Button
                          type="primary"
                          size="small"
                          style={{ backgroundColor: '#10b981' }}
                          onClick={() => showSuccessAlert('Cấp số thành công', `Đã chuyển lịch hẹn ${row.id} sang Hàng chờ khám phòng chuyên khoa.`)}
                        >
                          Check-in Cấp số
                        </Button>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'alerts',
              label: (
                <span className="flex items-center gap-2 font-bold text-sm">
                  <AlertOutlined className="text-rose-500" />
                  Cảnh Báo Lâm Sàng & Dị Ứng Thuốc AI
                  <Badge count={clinicalAlerts.length} style={{ backgroundColor: '#f43f5e' }} />
                </span>
              ),
              children: (
                <Table
                  dataSource={clinicalAlerts}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  columns={[
                    {
                      title: 'Mã Cảnh Báo',
                      dataIndex: 'id',
                      key: 'id',
                      render: (id: string) => <Tag color="error" className="font-mono font-bold">{id}</Tag>,
                    },
                    {
                      title: 'Bệnh Nhân',
                      dataIndex: 'hoTen',
                      key: 'hoTen',
                      render: (name: string, row: any) => (
                        <div>
                          <strong className="text-slate-900 dark:text-white block">{name}</strong>
                          <span className="text-slate-500 text-xs font-mono">{row.maBN}</span>
                        </div>
                      ),
                    },
                    {
                      title: 'Loại Cảnh Báo',
                      dataIndex: 'loai',
                      key: 'loai',
                      render: (loai: string) => <Tag color="warning" className="font-semibold">{loai}</Tag>,
                    },
                    {
                      title: 'Chi Tiết Cảnh Báo An Toàn',
                      dataIndex: 'chiTiet',
                      key: 'chiTiet',
                      render: (ct: string) => (
                        <span className="text-rose-600 dark:text-rose-400 font-medium text-xs block">
                          ⚠️ {ct}
                        </span>
                      ),
                    },
                    {
                      title: 'Mức Độ Rủi Ro',
                      dataIndex: 'mucDo',
                      key: 'mucDo',
                      render: (md: string) => (
                        <Tag color="red" className="font-bold">
                          {md}
                        </Tag>
                      ),
                    },
                    {
                      title: 'Bác Sĩ Trực',
                      dataIndex: 'bacSi',
                      key: 'bacSi',
                      render: (bs: string, row: any) => (
                        <div>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold block text-xs">{bs}</span>
                          <span className="text-slate-400 text-[11px]">{row.thoiGian}</span>
                        </div>
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
