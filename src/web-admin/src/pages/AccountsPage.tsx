import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Space,
  Avatar,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Divider,
} from 'antd';
import {
  UserOutlined,
  UserAddOutlined,
  SearchOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  MedicineBoxOutlined,
  CrownOutlined,
  ScheduleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { accountService, UserAccountItem, CreateAccountPayload } from '../services/accountService';
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '../utils/sweetAlert';
import { useThemeStore } from '../store/useThemeStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export const AccountsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<UserAccountItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal tạo tài khoản
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [createLoading, setCreateLoading] = useState(false);

  // Modal đổi mật khẩu
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserAccountItem | null>(null);
  const [resetPassForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch {
      showErrorAlert('Lỗi', 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAccount = async (values: any) => {
    setCreateLoading(true);
    try {
      const payload: CreateAccountPayload = {
        username: values.username,
        password: values.password || 'DMedical@2026',
        fullName: values.fullName,
        email: values.email || `${values.username}@hospitalai.vn`,
        phoneNumber: values.phoneNumber,
        role: values.role,
        department: values.department,
        title: values.title,
      };

      await accountService.createAccount(payload);
      showSuccessAlert(
        'Tạo tài khoản thành công!',
        `Tài khoản ${values.fullName} (${values.role}) đã được kích hoạt thành công.`
      );
      setIsCreateModalOpen(false);
      createForm.resetFields();
      loadData();
    } catch (err: any) {
      showErrorAlert('Lỗi tạo tài khoản', err?.message || 'Không thể tạo tài khoản.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = (record: UserAccountItem) => {
    const actionText = record.isActive ? 'Khóa' : 'Mở khóa';
    showConfirmAlert(
      `Xác nhận ${actionText} tài khoản?`,
      `Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản "${record.fullName}" (${record.username})?`,
      async () => {
        const success = await accountService.toggleAccountStatus(record.id);
        if (success) {
          showSuccessAlert('Thành công', `Đã ${actionText.toLowerCase()} tài khoản thành công.`);
          loadData();
        } else {
          showErrorAlert('Thất bại', 'Không thể thay đổi trạng thái tài khoản.');
        }
      }
    );
  };

  const handleResetPassword = async (values: any) => {
    if (!selectedUser) return;
    try {
      await accountService.resetPassword(selectedUser.id, values.newPassword);
      showSuccessAlert(
        'Đổi mật khẩu thành công!',
        `Mật khẩu mới cho tài khoản "${selectedUser.username}" đã được cập nhật.`
      );
      setIsResetPassModalOpen(false);
      resetPassForm.resetFields();
      setSelectedUser(null);
    } catch {
      showErrorAlert('Lỗi', 'Không thể đặt lại mật khẩu.');
    }
  };

  // Lọc tài khoản theo keyword, role, status
  const filteredAccounts = accounts.filter((acc) => {
    const matchKeyword =
      acc.fullName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      acc.phoneNumber.includes(searchKeyword) ||
      (acc.email && acc.email.toLowerCase().includes(searchKeyword.toLowerCase()));

    const matchRole =
      roleFilter === 'all' ? true : acc.roles.some((r) => r.toLowerCase() === roleFilter.toLowerCase());

    const matchStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? acc.isActive
        : !acc.isActive;

    return matchKeyword && matchRole && matchStatus;
  });

  // Thống kê nhanh
  const totalAccounts = accounts.length;
  const doctorCount = accounts.filter((a) => a.roles.includes('Doctor')).length;
  const staffCount = accounts.filter((a) => a.roles.includes('Receptionist') || a.roles.includes('Nurse')).length;
  const activeCount = accounts.filter((a) => a.isActive).length;

  const getRoleTag = (roles: string[]) => {
    if (roles.includes('Admin')) {
      return (
        <Tag color="purple" icon={<CrownOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
          Quản trị viên
        </Tag>
      );
    }
    if (roles.includes('Doctor')) {
      return (
        <Tag color="blue" icon={<MedicineBoxOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
          Bác sĩ
        </Tag>
      );
    }
    if (roles.includes('Receptionist') || roles.includes('Nurse')) {
      return (
        <Tag color="orange" icon={<ScheduleOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
          Tiếp đón / Thu ngân
        </Tag>
      );
    }
    return (
      <Tag color="green" icon={<UserOutlined />} style={{ borderRadius: 6 }}>
        Bệnh nhân
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Họ tên & Tài khoản',
      key: 'user',
      render: (_: any, record: UserAccountItem) => (
        <Space size={12}>
          <Avatar
            size={42}
            src={record.avatarUrl}
            icon={<UserOutlined />}
            style={{
              backgroundColor: record.roles.includes('Doctor')
                ? '#0284c7'
                : record.roles.includes('Admin')
                ? '#7c3aed'
                : '#10b981',
              border: '2px solid #bae6fd',
            }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
              {record.fullName}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <span>@{record.username}</span>
              {record.title && <span style={{ marginLeft: 6, color: '#0284c7' }}>• {record.title}</span>}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Vai trò',
      key: 'roles',
      width: 170,
      render: (_: any, record: UserAccountItem) => getRoleTag(record.roles),
    },
    {
      title: 'Khoa phòng / Chuyên khoa',
      dataIndex: 'department',
      key: 'department',
      width: 180,
      render: (dept: string) =>
        dept ? (
          <span style={{ fontWeight: 500, color: '#0369a1' }}>{dept}</span>
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        ),
    },
    {
      title: 'Liên hệ',
      key: 'contact',
      width: 220,
      render: (_: any, record: UserAccountItem) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{record.phoneNumber}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{record.email || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 140,
      render: (_: any, record: UserAccountItem) =>
        record.isActive ? (
          <Tag icon={<CheckCircleOutlined />} color="success" style={{ borderRadius: 6, fontWeight: 500 }}>
            Hoạt động
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error" style={{ borderRadius: 6, fontWeight: 500 }}>
            Bị khóa
          </Tag>
        ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (val: string) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>
          {val ? dayjs(val).format('DD/MM/YYYY') : '—'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      align: 'center' as const,
      render: (_: any, record: UserAccountItem) => (
        <Space size={8}>
          <Tooltip title={record.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
            <Button
              size="small"
              type={record.isActive ? 'default' : 'primary'}
              danger={record.isActive}
              icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>

          <Tooltip title="Đặt lại mật khẩu">
            <Button
              size="small"
              icon={<KeyOutlined />}
              onClick={() => {
                setSelectedUser(record);
                setIsResetPassModalOpen(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header & Tiêu đề trang */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#0369a1', fontWeight: 700 }}>
            <CrownOutlined style={{ marginRight: 8, color: '#0284c7' }} />
            Quản trị & Phân quyền Tài khoản
          </Title>
          <Text style={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 13 }}>
            Phân quyền tài khoản Bác sĩ, Nhân viên tiếp đón, Quản trị viên và Bệnh nhân trên hệ thống D-Medical
          </Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              backgroundColor: '#0284c7',
              borderColor: '#0284c7',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
            }}
          >
            Thêm tài khoản mới
          </Button>
        </Space>
      </div>

      {/* KPI Cards Thống kê tài khoản */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
              border: '1px solid #bae6fd',
              background: isDarkMode ? '#1e293b' : '#ffffff',
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 13, color: '#64748b' }}>Tổng tài khoản</span>}
              value={totalAccounts}
              prefix={<UserOutlined style={{ color: '#0284c7', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#0f172a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
              border: '1px solid #bae6fd',
              background: isDarkMode ? '#1e293b' : '#ffffff',
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 13, color: '#64748b' }}>Bác sĩ & Lâm sàng</span>}
              value={doctorCount}
              prefix={<MedicineBoxOutlined style={{ color: '#0284c7', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#0284c7' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
              border: '1px solid #bae6fd',
              background: isDarkMode ? '#1e293b' : '#ffffff',
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 13, color: '#64748b' }}>Tiếp đón & Nhân sự</span>}
              value={staffCount}
              prefix={<ScheduleOutlined style={{ color: '#f59e0b', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#f59e0b' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
              border: '1px solid #bae6fd',
              background: isDarkMode ? '#1e293b' : '#ffffff',
            }}
          >
            <Statistic
              title={<span style={{ fontSize: 13, color: '#64748b' }}>Đang hoạt động</span>}
              value={activeCount}
              suffix={`/ ${totalAccounts}`}
              prefix={<CheckCircleOutlined style={{ color: '#10b981', marginRight: 6 }} />}
              valueStyle={{ fontWeight: 700, color: '#10b981' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bộ lọc & Bảng tài khoản */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
          border: '1px solid #bae6fd',
          background: isDarkMode ? '#1e293b' : '#ffffff',
        }}
      >
        {/* Thanh công cụ tìm kiếm & bộ lọc */}
        <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
          <Col xs={24} sm={10} md={10}>
            <Input
              placeholder="Tìm kiếm theo họ tên, tên đăng nhập, số điện thoại..."
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>

          <Col xs={12} sm={7} md={7}>
            <Select
              style={{ width: '100%' }}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Lọc vai trò"
            >
              <Option value="all">Tất cả vai trò</Option>
              <Option value="Admin">Quản trị viên (Admin)</Option>
              <Option value="Doctor">Bác sĩ (Doctor)</Option>
              <Option value="Receptionist">Tiếp tân / Lễ tân (Receptionist)</Option>
              <Option value="Patient">Bệnh nhân (Patient)</Option>
            </Select>
          </Col>

          <Col xs={12} sm={7} md={7}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Trạng thái"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="active">Đang hoạt động</Option>
              <Option value="locked">Bị khóa</Option>
            </Select>
          </Col>
        </Row>

        {/* Bảng dữ liệu */}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredAccounts}
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} tài khoản` }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Modal Thêm tài khoản mới */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <UserAddOutlined style={{ color: '#0284c7' }} />
            <span>Thêm tài khoản nhân sự mới</span>
          </div>
        }
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateAccount}
          initialValues={{ role: 'Doctor' }}
          style={{ marginTop: 16 }}
        >
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
              >
                <Input placeholder="vd: bs_hoanganh" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Mật khẩu khởi tạo"
                rules={[{ min: 6, message: 'Tối thiểu 6 ký tự' }]}
              >
                <Input.Password placeholder="Mặc định: DMedical@2026" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="fullName"
            label="Họ và tên đầy đủ"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input placeholder="vd: BS. CKI. Nguyễn Hoàng Anh" />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^[0-9+]{9,12}$/, message: 'Số điện thoại không hợp lệ' },
                ]}
              >
                <Input placeholder="09xxxxxxxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email cơ quan / liên hệ">
                <Input placeholder="hoanganh@hospitalai.vn" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="Vai trò hệ thống"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="Doctor">Bác sĩ (Doctor)</Option>
                  <Option value="Receptionist">Tiếp đón / Thu ngân</Option>
                  <Option value="Admin">Quản trị viên (Admin)</Option>
                  <Option value="Nurse">Điều dưỡng / Y tá</Option>
                  <Option value="Patient">Bệnh nhân</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.role !== curr.role}
              >
                {({ getFieldValue }) =>
                  getFieldValue('role') === 'Doctor' ? (
                    <Form.Item name="department" label="Khoa phòng công tác">
                      <Select placeholder="Chọn khoa phòng">
                        <Option value="Khoa Tim Mạch">Khoa Tim Mạch</Option>
                        <Option value="Khoa Nội Tổng Quát">Khoa Nội Tổng Quát</Option>
                        <Option value="Khoa Ngoại Tiêu Hóa">Khoa Ngoại Tiêu Hóa</Option>
                        <Option value="Khoa Nhi">Khoa Nhi</Option>
                        <Option value="Khoa Chẩn Đoán Hình Ảnh">Khoa Chẩn Đoán Hình Ảnh</Option>
                        <Option value="Khoa Mắt">Khoa Mắt</Option>
                        <Option value="Khoa Răng Hàm Mặt">Khoa Răng Hàm Mặt</Option>
                        <Option value="Khoa Tai Mũi Họng">Khoa Tai Mũi Họng</Option>
                      </Select>
                    </Form.Item>
                  ) : (
                    <Form.Item name="title" label="Chức danh / Chức vụ">
                      <Input placeholder="vd: Nhân viên Lễ tân quầy 1" />
                    </Form.Item>
                  )
                }
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '14px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setIsCreateModalOpen(false)}>Hủy bỏ</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={createLoading}
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
            >
              Lưu & Kích hoạt
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Đặt lại mật khẩu */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <KeyOutlined style={{ color: '#0284c7' }} />
            <span>Đặt lại mật khẩu: {selectedUser?.fullName}</span>
          </div>
        }
        open={isResetPassModalOpen}
        onCancel={() => {
          setIsResetPassModalOpen(false);
          resetPassForm.resetFields();
          setSelectedUser(null);
        }}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form form={resetPassForm} layout="vertical" onFinish={handleResetPassword} style={{ marginTop: 16 }}>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Tối thiểu 6 ký tự' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button onClick={() => setIsResetPassModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
              Xác nhận đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
export default AccountsPage;
