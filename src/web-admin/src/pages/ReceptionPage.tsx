import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Tag,
  Card,
  Row,
  Col,
  Typography,
  Modal,
  Form,
  Select,
  Divider,
  Badge,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  PrinterOutlined,
  UserAddOutlined,
  SoundOutlined,
  ReloadOutlined,
  ForwardOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useThemeStore } from '../store/useThemeStore';
import { queueService, DepartmentItem, QueueTicketItem } from '../services/queueService';
import { patientService, Patient } from '../services/patientService';
import { showSuccessAlert, showToast, showErrorAlert } from '../utils/sweetAlert';

const { Title, Text } = Typography;
const { Option } = Select;

export const ReceptionPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  const [loading, setLoading] = useState(false);
  const [queueList, setQueueList] = useState<QueueTicketItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | undefined>(undefined);
  const [patients, setPatients] = useState<Patient[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Ticket Thermal Print State
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketToPrint, setTicketToPrint] = useState<QueueTicketItem | null>(null);

  // Fetch queue and departments
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [deptRes, queueRes, patientRes] = await Promise.all([
        queueService.getDepartments(),
        queueService.getTodayQueue(selectedDeptId),
        patientService.getPatients(),
      ]);
      setDepartments(deptRes);
      setQueueList(queueRes);
      setPatients(patientRes.items || []);
    } catch {
      showErrorAlert('Lỗi tải dữ liệu', 'Không thể kết nối danh sách hàng chờ từ hệ thống.');
    } finally {
      setLoading(false);
    }
  }, [selectedDeptId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Issue Ticket
  const handleIssueTicket = async (values: any) => {
    setSubmitting(true);
    try {
      let targetPatientId = values.patientId;

      // If typed new patient name instead of selecting existing patient
      if (!targetPatientId && values.hoTen) {
        const newPatient = await patientService.createPatient({
          fullName: values.hoTen,
          identityCardNumber: values.soCCCD || `038090${Date.now().toString().slice(-6)}`,
          gender: values.gioiTinh || 'Nam',
          dateOfBirth: values.ngaySinh || '1990-01-01',
          phoneNumber: values.soDienThoai || '0900000000',
          address: values.diaChi || 'TP.HCM',
        });
        targetPatientId = newPatient.id;
      }

      if (!targetPatientId) {
        showErrorAlert('Thiếu thông tin', 'Vui lòng chọn bệnh nhân hoặc nhập tên bệnh nhân mới.');
        setSubmitting(false);
        return;
      }

      const priorityVal = values.triageLevel || 'Normal';
      const ticket = await queueService.issueQueueTicket({
        patientId: targetPatientId,
        departmentId: values.departmentId || departments[0]?.id || 'dept-01',
        priority: priorityVal === 'Emergency' || priorityVal === 'Elderly' || priorityVal === 'Pregnant' || priorityVal === 'Child' ? 'Emergency' : 'Normal',
      });

      showSuccessAlert(
        `Cấp số #${ticket.sequenceNumber} thành công!`,
        `Đã phát phiếu khám số #${ticket.sequenceNumber} cho bệnh nhân ${ticket.patientName} tại ${ticket.departmentName}.`
      );

      setIsModalOpen(false);
      form.resetFields();
      fetchData();

      // Open print ticket modal
      setTicketToPrint(ticket);
      setIsTicketModalOpen(true);
    } catch {
      showErrorAlert('Không thể cấp số', 'Có lỗi xảy ra trong quá trình tạo phiếu khám.');
    } finally {
      setSubmitting(false);
    }
  };

  // Speaker Call Audio Simulation
  const handleCallSpeaker = async (ticket: QueueTicketItem) => {
    const speechMsg = `Xin mời bệnh nhân ${ticket.patientName}, số thứ tự ${ticket.sequenceNumber}, vào ${ticket.departmentName}, ${ticket.location}.`;
    
    // Web Speech API browser simulation
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechMsg);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }

    try {
      await queueService.updateQueueTicketStatus(ticket.id, 'Calling');
      showToast(`📢 Đang gọi phát loa: Bệnh nhân ${ticket.patientName} (#${ticket.sequenceNumber})`, 'info');
      fetchData();
    } catch {
      showToast('Đã phát loa gọi số!', 'info');
    }
  };

  // Call Next Patient in queue
  const handleCallNext = async () => {
    const deptId = selectedDeptId || (departments.length > 0 ? departments[0].id : '');
    const nextTicket = await queueService.callNextPatient(deptId);
    if (nextTicket) {
      handleCallSpeaker(nextTicket);
    } else {
      showToast('Không có bệnh nhân nào đang chờ trong hàng chờ này!', 'warning');
    }
  };

  // Change Status Action
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await queueService.updateQueueTicketStatus(ticketId, newStatus);
      showToast(`Đã chuyển trạng thái phiếu sang ${newStatus}!`, 'success');
      fetchData();
    } catch {
      showErrorAlert('Lỗi', 'Không thể cập nhật trạng thái phiếu.');
    }
  };

  // Stats calculation
  const callingTicket = queueList.find((q) => q.status === 'Calling');
  const waitingCount = queueList.filter((q) => q.status === 'Waiting').length;
  const finishedCount = queueList.filter((q) => q.status === 'Finished').length;
  const emergencyCount = queueList.filter((q) => q.priority === 'Emergency' || q.priority === 'Priority').length;

  const columns = [
    {
      title: 'Số STT',
      dataIndex: 'sequenceNumber',
      key: 'sequenceNumber',
      render: (stt: number, record: QueueTicketItem) => (
        <Space>
          <Badge count={record.priority === 'Emergency' ? 'ƯU TIÊN' : 0} style={{ backgroundColor: '#ef4444' }}>
            <Text strong style={{ fontSize: 22, color: record.priority !== 'Normal' ? '#ef4444' : isDarkMode ? '#38bdf8' : '#0284c7' }}>
              #{stt}
            </Text>
          </Badge>
        </Space>
      ),
    },
    {
      title: 'Mã BN',
      dataIndex: 'patientCode',
      key: 'patientCode',
      render: (t: string) => <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{t}</Tag>,
    },
    {
      title: 'Họ và Tên Bệnh nhân',
      dataIndex: 'patientName',
      key: 'patientName',
      render: (t: string, record: QueueTicketItem) => (
        <div>
          <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontSize: 14 }}>
            {t}
          </Text>
          <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block' }}>
            {record.patientGender} • {record.patientAge} tuổi • CCCD: {record.identityCardNumber}
          </Text>
        </div>
      ),
    },
    {
      title: 'Phòng khám nhận',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: (t: string, record: QueueTicketItem) => (
        <div>
          <Text style={{ fontWeight: 600, color: isDarkMode ? '#cbd5e1' : '#334155' }}>{t}</Text>
          <Text style={{ fontSize: 11, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block' }}>{record.location}</Text>
        </div>
      ),
    },
    {
      title: 'Thời gian cấp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateStr: string) => new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      title: 'Trạng thái Hàng chờ',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => {
        const colors: Record<string, string> = {
          Waiting: 'gold',
          Calling: 'cyan',
          Processing: 'processing',
          Skipped: 'default',
          Finished: 'green',
        };
        const labels: Record<string, string> = {
          Waiting: 'Đang chờ',
          Calling: 'Đang gọi loa',
          Processing: 'Đang khám',
          Skipped: 'Qua lượt',
          Finished: 'Hoàn thành',
        };
        return <Tag color={colors[st] || 'default'}>{labels[st] || st}</Tag>;
      },
    },
    {
      title: 'Thao tác Tiếp nhận',
      key: 'action',
      render: (_: any, record: QueueTicketItem) => (
        <Space>
          <Tooltip title="Phát loa phát thanh gọi bệnh nhân vào phòng khám">
            <Button
              icon={<SoundOutlined />}
              size="small"
              type="primary"
              style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              onClick={() => handleCallSpeaker(record)}
            >
              Gọi loa
            </Button>
          </Tooltip>
          {record.status === 'Calling' && (
            <Button
              size="small"
              type="dashed"
              style={{ color: '#10b981', borderColor: '#10b981' }}
              onClick={() => handleStatusChange(record.id, 'Processing')}
            >
              Vào khám
            </Button>
          )}
          {record.status === 'Processing' && (
            <Button
              size="small"
              type="dashed"
              icon={<CheckCircleOutlined />}
              style={{ color: '#059669' }}
              onClick={() => handleStatusChange(record.id, 'Finished')}
            >
              Xong
            </Button>
          )}
          <Button
            icon={<PrinterOutlined />}
            size="small"
            type="text"
            onClick={() => {
              setTicketToPrint(record);
              setIsTicketModalOpen(true);
            }}
          >
            In phiếu STT
          </Button>
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
            <Text className="text-xs text-sky-300 font-semibold uppercase tracking-wider">Quầy Lễ Tân • Cấp Số Hàng Chờ Tự Động</Text>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            Tiếp nhận Bệnh nhân & Cấp số Hàng chờ Realtime
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            Điều phối luồng tiếp đón, phát số thứ tự tự động và gọi loa thông minh theo phòng khám
          </p>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} className="rounded-lg font-medium">
            Làm mới
          </Button>
          <Button
            type="primary"
            icon={<ForwardOutlined />}
            size="large"
            className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg font-semibold flex items-center gap-1.5"
            onClick={handleCallNext}
          >
            Gọi loa Số tiếp theo
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="bg-sky-600 hover:bg-sky-700 border-none rounded-lg font-semibold flex items-center gap-1.5"
            onClick={() => setIsModalOpen(true)}
          >
            Đăng ký & Cấp số mới
          </Button>
        </Space>
      </div>

      {/* Realtime Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="rounded-xl border-l-4 border-l-sky-600 bg-white dark:bg-slate-800 hover-lift text-center">
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Số STT Đang gọi phát loa</Text>
            <Title level={1} style={{ color: isDarkMode ? '#38bdf8' : '#0284c7', margin: '6px 0', fontSize: 36, fontWeight: 900 }}>
              #{callingTicket ? callingTicket.sequenceNumber : '---'}
            </Title>
            <Text strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
              {callingTicket ? callingTicket.patientName : 'Chưa có bệnh nhân'}
            </Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#fffbeb',
              borderColor: isDarkMode ? '#f59e0b' : '#fef3c7',
            }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Bệnh nhân Đang chờ</Text>
            <Title level={1} style={{ color: '#f59e0b', margin: '6px 0', fontSize: 36, fontWeight: 900 }}>
              {waitingCount}
            </Title>
            <Text style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Thời gian chờ trung bình: ~8 phút</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#ecfdf5',
              borderColor: isDarkMode ? '#10b981' : '#a7f3d0',
            }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Đã khám Hoàn thành</Text>
            <Title level={1} style={{ color: '#10b981', margin: '6px 0', fontSize: 36, fontWeight: 900 }}>
              {finishedCount}
            </Title>
            <Text style={{ color: isDarkMode ? '#cbd5e1' : '#475569' }}>Hôm nay ({new Date().toLocaleDateString('vi-VN')})</Text>
          </Card>
        </Col>

        <Col span={6}>
          <Card
            style={{
              borderRadius: 16,
              textAlign: 'center',
              background: isDarkMode ? '#0f172a' : '#fef2f2',
              borderColor: isDarkMode ? '#ef4444' : '#fecaca',
            }}
          >
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>Đối tượng Ưu tiên / Cấp cứu</Text>
            <Title level={1} style={{ color: '#ef4444', margin: '6px 0', fontSize: 36, fontWeight: 900 }}>
              {emergencyCount}
            </Title>
            <Text style={{ color: '#ef4444', fontWeight: 600 }}>Tự động đưa lên đầu hàng chờ</Text>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 700 }}>
              Danh sách Cấp số Hàng chờ Khám Realtime
            </span>
            <Space>
              <Select
                placeholder="Lọc theo Khoa / Phòng khám"
                allowClear
                style={{ width: 260 }}
                onChange={(val) => setSelectedDeptId(val)}
              >
                {departments.map((d) => (
                  <Option key={d.id} value={d.id}>
                    {d.departmentName} ({d.location})
                  </Option>
                ))}
              </Select>
            </Space>
          </div>
        }
        style={{ borderRadius: 16, border: isDarkMode ? '1px solid #334155' : '1px solid #bae6fd' }}
      >
        <Table
          dataSource={queueList}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showSizeChanger: false }}
        />
      </Card>

      {/* Modal Đăng ký Tiếp nhận & Cấp số Mới */}
      <Modal
        title={
          <Space>
            <UserAddOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1', fontWeight: 700 }}>
              Đăng ký Tiếp nhận & Phát phiếu Cấp số mới
            </span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleIssueTicket}>
          <Form.Item label="Chọn Bệnh nhân Đã đăng ký hệ thống" name="patientId">
            <Select
              showSearch
              placeholder="Gõ tên, số CCCD hoặc Mã bệnh nhân để chọn..."
              optionFilterProp="children"
              allowClear
              size="large"
            >
              {patients.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.maBenhNhan} - {p.hoTen} (CCCD: {p.soCCCD})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
            * Hoặc nhập thông tin bệnh nhân mới nếu chưa có hồ sơ:
          </Text>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item label="Họ và Tên Bệnh nhân Mới" name="hoTen">
                <Input placeholder="Ví dụ: Nguyễn Văn An" size="large" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="Giới tính" name="gioiTinh" initialValue="Nam">
                <Select size="large">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số CCCD (12 số)" name="soCCCD">
                <Input placeholder="03809000xxxx" size="large" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Số Điện thoại" name="soDienThoai">
                <Input placeholder="0901234567" size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Chọn Phòng khám & Chuyên khoa Nhận khám"
            name="departmentId"
            rules={[{ required: true, message: 'Vui lòng chọn phòng khám!' }]}
            initialValue={departments[0]?.id}
          >
            <Select size="large">
              {departments.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.departmentName} - {d.location}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Phân loại Luồng Ưu tiên (Triage Level)"
            name="triageLevel"
            initialValue="Normal"
          >
            <Select size="large">
              <Option value="Normal">🟢 Thông thường (Khám theo thứ tự)</Option>
              <Option value="Emergency">🚨 Ưu tiên Cấp cứu / Bệnh nặng</Option>
              <Option value="Elderly">👴 Ưu tiên Người cao tuổi (≥ 75 tuổi)</Option>
              <Option value="Child">👶 Ưu tiên Trẻ em dưới 6 tuổi</Option>
              <Option value="Pregnant">🤰 Ưu tiên Phụ nữ mang thai</Option>
            </Select>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<PrinterOutlined />}
                loading={submitting}
                style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
              >
                Cấp số & In phiếu Nhiệt
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Modal In Phiếu STT Nhiệt K80 */}
      <Modal
        title={
          <Space>
            <PrinterOutlined style={{ color: '#0284c7' }} />
            <span>In Phiếu Số Thứ Tự (STT Ticket K80)</span>
          </Space>
        }
        open={isTicketModalOpen}
        onCancel={() => setIsTicketModalOpen(false)}
        width={400}
        footer={[
          <Button key="close" onClick={() => setIsTicketModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#0284c7' }}
            onClick={() => {
              window.print();
              showToast('Đã in phiếu STT K80 nhiệt!', 'success');
            }}
          >
            In Phiếu STT
          </Button>,
        ]}
      >
        {ticketToPrint && (
          <div
            style={{
              padding: 20,
              backgroundColor: '#ffffff',
              color: '#0f172a',
              textAlign: 'center',
              fontFamily: 'monospace',
              border: '2px dashed #94a3b8',
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', color: '#0369a1' }}>
              BV ĐA KHOA HOSPITAL AI
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>PHIẾU KHÁM BỆNH TỰ ĐỘNG</div>
            <Divider style={{ margin: '10px 0' }} />

            <div style={{ fontSize: 12, color: '#475569' }}>SỐ THỨ TỰ CỦA BẠN:</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: ticketToPrint.priority === 'Emergency' ? '#ef4444' : '#0284c7', margin: '4px 0' }}>
              #{ticketToPrint.sequenceNumber}
            </div>

            {ticketToPrint.priority === 'Emergency' && (
              <Tag color="red" style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>
                🚨 LUỒNG ƯU TIÊN / CẤP CỨU
              </Tag>
            )}

            <div style={{ textAlign: 'left', marginTop: 12, fontSize: 12, backgroundColor: '#f0f9ff', padding: 10, borderRadius: 8 }}>
              <div>Bệnh nhân: <strong>{ticketToPrint.patientName}</strong></div>
              <div>Mã BN: <strong>{ticketToPrint.patientCode}</strong></div>
              <div>Phòng khám: <strong>{ticketToPrint.departmentName}</strong></div>
              <div>Vị trí: <strong>{ticketToPrint.location}</strong></div>
              <div>Thời gian cấp: <strong>{new Date().toLocaleTimeString('vi-VN')}</strong></div>
            </div>

            <div style={{ marginTop: 14, fontSize: 10, color: '#94a3b8' }}>
              Vui lòng theo dõi màn hình TV và loa gọi số trước cửa phòng khám.<br />
              Xin cảm ơn Quý bệnh nhân!
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
