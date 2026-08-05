import React, { useState } from 'react';
import { Table, Button, Space, Input, Tag, Card, Row, Col, Typography, Modal, Form, Select, Switch, Badge } from 'antd';
import { PlusOutlined, SearchOutlined, QrcodeOutlined, PrinterOutlined, UserAddOutlined } from '@ant-design/icons';
import { QueueTicket } from '../types';
import { getStatusTagColor } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showSuccessAlert, showToast } from '../utils/sweetAlert';

const { Title, Text } = Typography;
const { Option } = Select;

export const ReceptionPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { isDarkMode } = useThemeStore();

  const [queueList, setQueueList] = useState<QueueTicket[]>([
    { id: '1', stt: 101, maBenhNhan: 'BN20260001', tenBenhNhan: 'Nguyễn Văn An', soCCCD: '038090001234', phongKham: 'Phòng 102 - Khoa Nội', bacSiKham: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Đang khám', thoiGianCap: '08:15', uuTien: false },
    { id: '2', stt: 102, maBenhNhan: 'BN20260002', tenBenhNhan: 'Trần Thị Bình', soCCCD: '038185005678', phongKham: 'Phòng 102 - Khoa Nội', bacSiKham: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Chờ cận lâm sàng', thoiGianCap: '08:30', uuTien: false },
    { id: '3', stt: 103, maBenhNhan: 'BN20260003', tenBenhNhan: 'Lê Hoàng Nam', soCCCD: '038192009876', phongKham: 'Phòng 105 - Khoa Nhi', bacSiKham: 'BS. CKI. Phạm Minh Đức', trangThai: 'Đang chờ', thoiGianCap: '08:45', uuTien: true },
    { id: '4', stt: 104, maBenhNhan: 'BN20260004', tenBenhNhan: 'Phạm Thu Cúc', soCCCD: '038177003456', phongKham: 'Phòng 102 - Khoa Nội', bacSiKham: 'BS. CKII. Nguyễn Thanh Duy', trangThai: 'Đang chờ', thoiGianCap: '09:00', uuTien: false },
  ]);

  const handleAddTicket = (values: { hoTen: string; soCCCD: string; phongKham: string; uuTien?: boolean }) => {
    const nextStt = queueList.length > 0 ? Math.max(...queueList.map((q) => q.stt)) + 1 : 101;
    const newTicket: QueueTicket = {
      id: Date.now().toString(),
      stt: nextStt,
      maBenhNhan: `BN202600${queueList.length + 5}`,
      tenBenhNhan: values.hoTen,
      soCCCD: values.soCCCD,
      phongKham: values.phongKham,
      bacSiKham: 'BS. CKII. Nguyễn Thanh Duy',
      trangThai: 'Đang chờ',
      thoiGianCap: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      uuTien: !!values.uuTien,
    };

    setQueueList([newTicket, ...queueList]);
    showSuccessAlert(`Cấp số #${nextStt} thành công!`, `Đã cấp số khám cho bệnh nhân ${values.hoTen}`);
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Số STT',
      dataIndex: 'stt',
      key: 'stt',
      render: (stt: number, record: QueueTicket) => (
        <Space>
          <Badge count={record.uuTien ? 'Ưu tiên' : 0} style={{ backgroundColor: '#ef4444' }}>
            <Text strong style={{ fontSize: 20, color: record.uuTien ? '#ef4444' : isDarkMode ? '#38bdf8' : '#0284c7' }}>
              #{stt}
            </Text>
          </Badge>
        </Space>
      ),
    },
    { title: 'Mã BN', dataIndex: 'maBenhNhan', key: 'maBenhNhan', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: 'Họ và Tên', dataIndex: 'tenBenhNhan', key: 'tenBenhNhan', render: (t: string) => <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>{t}</Text> },
    { title: 'Số CCCD', dataIndex: 'soCCCD', key: 'soCCCD' },
    { title: 'Phòng khám', dataIndex: 'phongKham', key: 'phongKham' },
    { title: 'Bác sĩ phân công', dataIndex: 'bacSiKham', key: 'bacSiKham' },
    { title: 'Thời gian cấp', dataIndex: 'thoiGianCap', key: 'thoiGianCap' },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      key: 'trangThai',
      render: (st: string) => <Tag color={getStatusTagColor(st)}>{st}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: () => (
        <Space>
          <Button icon={<PrinterOutlined />} size="small" type="dashed" onClick={() => showToast('Đã gửi lệnh in phiếu khám!', 'info')}>In phiếu</Button>
          <Button icon={<QrcodeOutlined />} size="small" type="link">Quét QR</Button>
        </Space>
      ),
    },
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
            Tiếp nhận Bệnh nhân & Cấp số thứ tự
          </Title>
          <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
            Quản lý luồng tiếp nhận bệnh nhân tại quầy lễ tân bệnh viện
          </Text>
        </div>
        <Space>
          <Input placeholder="Quét CCCD/Mã QR BHYT..." prefix={<SearchOutlined />} style={{ width: 280 }} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => setIsModalOpen(true)}
          >
            Đăng ký & Cấp số mới
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={6}>
          <Card
            style={{
              borderRadius: 12,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#f0f9ff',
              borderColor: isDarkMode ? '#0284c7' : '#bae6fd'
            }}
          >
            <Text type="secondary">Số STT Đang gọi khám</Text>
            <Title level={1} style={{ color: isDarkMode ? '#38bdf8' : '#0284c7', margin: '8px 0' }}>#101</Title>
            <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Phòng 102 - Khoa Nội</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{
              borderRadius: 12,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#fffbeb',
              borderColor: isDarkMode ? '#f59e0b' : '#fef3c7'
            }}
          >
            <Text type="secondary">Bệnh nhân Đang chờ</Text>
            <Title level={1} style={{ color: '#f59e0b', margin: '8px 0' }}>14</Title>
            <Text style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Thời gian chờ TB: ~12 phút</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{
              borderRadius: 12,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#ecfdf5',
              borderColor: isDarkMode ? '#10b981' : '#a7f3d0'
            }}
          >
            <Text type="secondary">Đã khám Hoàn thành</Text>
            <Title level={1} style={{ color: '#10b981', margin: '8px 0' }}>85</Title>
            <Text style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Hôm nay (2026-08-02)</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{
              borderRadius: 12,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#fef2f2',
              borderColor: isDarkMode ? '#ef4444' : '#fecaca'
            }}
          >
            <Text type="secondary">Ưu tiên (Cấp cứu/Người già)</Text>
            <Title level={1} style={{ color: '#ef4444', margin: '8px 0' }}>2</Title>
            <Text style={{ color: '#ef4444', fontWeight: 600 }}>Đang sắp xếp luồng nhanh</Text>
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Danh sách Cấp số Hàng chờ Khám bệnh</span>}
        style={{ borderRadius: 12, border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd' }}
      >
        <Table dataSource={queueList} columns={columns} rowKey="id" />
      </Card>

      {/* Modal Đăng ký tiếp nhận mới */}
      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1' }}>Tiếp nhận & Cấp số Khám Mới</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddTicket} initialValues={{ phongKham: 'Phòng 102 - Khoa Nội' }}>
          <Form.Item label="Họ và Tên Bệnh nhân" name="hoTen" rules={[{ required: true, message: 'Nhập họ tên!' }]}>
            <Input placeholder="Ví dụ: Nguyễn Văn An" size="large" />
          </Form.Item>

          <Form.Item label="Số CCCD / Thẻ BHYT" name="soCCCD" rules={[{ required: true, message: 'Nhập số CCCD!' }]}>
            <Input placeholder="03809000xxxx" size="large" />
          </Form.Item>

          <Form.Item label="Chọn Phòng khám & Chuyên khoa" name="phongKham" rules={[{ required: true }]}>
            <Select size="large">
              <Option value="Phòng 102 - Khoa Nội">Phòng 102 - Khoa Nội Tổng Hợp</Option>
              <Option value="Phòng 105 - Khoa Nhi">Phòng 105 - Khoa Nhi</Option>
              <Option value="Phòng 201 - Khoa Mắt">Phòng 201 - Khoa Mắt</Option>
              <Option value="Phòng 204 - Khoa Sản">Phòng 204 - Khoa Sản</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Đối tượng Ưu tiên (Người cao tuổi / Phụ nữ thai sản / Cấp cứu)" name="uuTien" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" size="large" icon={<PrinterOutlined />} style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}>
                Cấp số & In phiếu
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
