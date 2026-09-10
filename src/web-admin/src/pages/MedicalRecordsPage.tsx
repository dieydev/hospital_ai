import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '../styles/prescriptionPrint.css';
import { Card, Timeline, Typography, Tag, Button, Space, Row, Col, Modal, Table, Divider } from 'antd';
import {
  FilePdfOutlined,
  PrinterOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showToast } from '../utils/sweetAlert';
import { examinationService, ExaminationItem } from '../services/examinationService';

const { Title, Text } = Typography;

export const MedicalRecordsPage: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<ExaminationItem | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<ExaminationItem[]>([]);
  const { isDarkMode } = useThemeStore();

  React.useEffect(() => {
    fetchExaminations();
  }, []);

  const fetchExaminations = async () => {
    try {
      const data = await examinationService.getExaminations();
      // Calculate chiPhi (total cost) for UI if needed, or we just map it.
      setHistoryItems(data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      showToast('Lỗi khi tải dữ liệu khám bệnh', 'error');
    }
  };

  const handleOpenPdf = (record: ExaminationItem) => {
    setSelectedRecord(record);
    setIsPdfModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Modern Medical Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 p-6 md:p-8 text-white shadow-md border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="status-dot-active" />
            <Text className="text-xs text-sky-300 font-semibold uppercase tracking-wider">Lịch Sử Khám Bệnh Toàn Diện • Hồ Sơ EMR</Text>
            <Tag color="blue" className="m-0 font-mono text-xs">Mã BN: BN20260001</Tag>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight margin-0">
            HỒ SƠ BỆNH ÁN ĐIỆN TỬ (EMR) - NGUYỄN VĂN AN
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1">
            CCCD: <strong>038090001234</strong> • Ngày sinh: <strong>1990-05-15 (36 tuổi)</strong> • BHYT: <strong>DN40101234567</strong>
          </p>
        </div>
        <Space wrap>
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            size="large"
            className="bg-sky-600 hover:bg-sky-700 border-none rounded-lg font-semibold flex items-center gap-1.5"
            onClick={() => handleOpenPdf(historyItems[0])}
          >
            Xuất Bệnh án EMR (PDF)
          </Button>
        </Space>
      </div>

      {/* Timeline view */}
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card
            bordered={false}
            className="rounded-xl bg-white dark:bg-slate-800 hover-lift"
            title={
              <Space>
                <HistoryOutlined style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }} />
                <span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Dòng thời gian Diễn biến Lịch sử Khám bệnh</span>
              </Space>
            }
          >
            <Timeline
              mode="left"
              items={historyItems.map((item) => ({
                color: item.id === 'emr-001' ? 'green' : 'blue',
                children: (
                  <Card
                    size="small"
                    style={{
                      marginBottom: 16,
                      borderRadius: 8,
                      borderColor: isDarkMode ? '#334155' : '#e8e8e8',
                      background: isDarkMode ? '#0f172a' : '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 16, color: isDarkMode ? '#38bdf8' : '#0284c7' }}>
                        {formatDate(item.examinationDate)} - {item.departmentName}
                      </Text>
                      <Tag color="purple">Mã ICD-10: {item.icd10Code}</Tag>
                    </div>

                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                      <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Bác sĩ khám:</strong> {item.doctorName}
                    </p>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                      <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Triệu chứng:</strong> {item.subjective}
                    </p>
                    <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                      <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Chẩn đoán:</strong>{' '}
                      <Text strong style={{ color: isDarkMode ? '#f59e0b' : '#d97706' }}>{item.icd10Name}</Text>
                    </p>

                    <Divider style={{ margin: '8px 0', borderColor: isDarkMode ? '#334155' : undefined }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ color: isDarkMode ? '#94a3b8' : undefined }}>
                        Tổng chi phí lượt khám: <strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }}>
                          {formatCurrency((item.prescriptionDetails?.reduce((sum, p) => sum + (p.unitPrice * p.quantity), 0) || 0) + (item.serviceOrderDetails?.reduce((sum, s) => sum + s.price, 0) || 0))}
                        </strong>
                      </Text>
                      <Button type="link" icon={<FilePdfOutlined />} onClick={() => handleOpenPdf(item)}>
                        Xem PDF Chi tiết
                      </Button>
                    </div>
                  </Card>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card
            title={<span style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Tóm tắt Tiền sử & Dị ứng</span>}
            style={{ borderRadius: 12, borderColor: isDarkMode ? '#334155' : undefined }}
          >
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
              <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Nhóm máu:</strong> <Tag color="red">O+</Tag>
            </p>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
              <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Tiền sử bệnh nội khoa:</strong> Tăng huyết áp độ 1
            </p>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
              <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Tiền sử dị ứng thuốc:</strong> Không ghi nhận
            </p>
            <p style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
              <strong style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}>Tổng số lượt khám đã thực hiện:</strong> 12 lượt
            </p>
          </Card>
        </Col>
      </Row>

      {/* PDF EMR Preview Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1' }}>HỒ SƠ BỆNH ÁN ĐIỆN TỬ - ELECTRONIC MEDICAL RECORD (PDF PREVIEW)</span>
          </Space>
        }
        open={isPdfModalOpen}
        onCancel={() => setIsPdfModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsPdfModalOpen(false)}>Đóng</Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              window.print();
              showToast('Đã xuất file PDF / In Hồ sơ Bệnh án EMR!', 'success');
            }}
          >
            In File PDF (A4)
          </Button>,
        ]}
      >
        {selectedRecord && (
          <div
            style={{
              padding: 20,
              border: isDarkMode ? '1px solid #334155' : '1px solid #d9d9d9',
              borderRadius: 8,
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#f8fafc' : '#0f172a'
            }}
          >
            <div style={{ textAlign: 'center', borderBottom: isDarkMode ? '2px solid #38bdf8' : '2px solid #001529', paddingBottom: 12, marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>BỆNH VIỆN ĐA KHOA HOSPITAL AI</Title>
              <Text type="secondary" style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Địa chỉ: Đường Lê Hồng Phong, TP. Thủ Dầu Một, Bình Dương</Text>
              <Title level={3} style={{ color: isDarkMode ? '#f8fafc' : '#001529', marginTop: 12, marginBottom: 0 }}>PHIẾU KHÁM BỆNH & HỒ SƠ EMR</Title>
              <Text type="secondary" style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Mã lượt khám: {selectedRecord.examinationCode}</Text>
            </div>

            <Row gutter={[16, 8]}>
              <Col span={12}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Họ tên: <strong style={{ color: isDarkMode ? '#f8fafc' : undefined }}>{selectedRecord.patientName.toUpperCase()}</strong></Text></Col>
              <Col span={12}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Tuổi / Giới tính: <strong style={{ color: isDarkMode ? '#f8fafc' : undefined }}>{selectedRecord.patientAge} tuổi ({selectedRecord.patientGender})</strong></Text></Col>
              <Col span={12}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Mã BN: <strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }}>{selectedRecord.patientCode}</strong></Text></Col>
              <Col span={12}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Mã thẻ BHYT: <strong style={{ color: isDarkMode ? '#f8fafc' : undefined }}>{selectedRecord.healthInsuranceNumber || 'Không có'}</strong></Text></Col>
              <Col span={24}><Text style={{ color: isDarkMode ? '#cbd5e1' : undefined }}>Căn cước công dân: <strong style={{ color: isDarkMode ? '#f8fafc' : undefined }}>{selectedRecord.identityCardNumber}</strong></Text></Col>
            </Row>

            <Divider style={{ margin: '12px 0', borderColor: isDarkMode ? '#334155' : undefined }} />

            <Title level={5} style={{ color: isDarkMode ? '#38bdf8' : '#0369a1' }}>I. KẾT QUẢ KHÁM LÂM SÀNG (SOAP)</Title>
            <p><strong>1. Triệu chứng cơ năng (Subjective):</strong> {selectedRecord.subjective}</p>
            <p><strong>2. Sinh hiệu (Objective):</strong> Mạch: {selectedRecord.pulseRate} bpm | HA: {selectedRecord.bloodPressure} mmHg | Nhiệt độ: {selectedRecord.temperature}°C | BMI: {selectedRecord.bmi}</p>
            <p><strong>3. Chẩn đoán xác định (Assessment):</strong> {selectedRecord.icd10Name} (Mã ICD-10: <strong style={{ color: isDarkMode ? '#38bdf8' : '#0284c7' }}>{selectedRecord.icd10Code}</strong>)</p>

            <Title level={5} style={{ marginTop: 16, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>II. ĐƠN THUỐC ĐIỆN TỬ (PLAN)</Title>
            <Table
              dataSource={selectedRecord.prescriptionDetails}
              rowKey="id"
              columns={[
                { title: 'STT', key: 'stt', render: (_: any, __: any, index: number) => index + 1 },
                { title: 'Tên Thuốc', dataIndex: 'medicineName', key: 'medicineName' },
                { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', render: (val: number, record: any) => `${val} ${record.unit}` },
                { title: 'Liều dùng', dataIndex: 'dosageInstruction', key: 'dosageInstruction' },
              ]}
              pagination={false}
              size="small"
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: isDarkMode ? '1px dashed #334155' : '1px dashed #cbd5e1' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ background: '#ffffff', padding: 8, borderRadius: 8, display: 'inline-block', border: '1px solid #bae6fd' }}>
                  <QRCodeSVG
                    value={`https://hospital-ai.vn/verify-emr?code=${selectedRecord.examinationCode}`}
                    size={90}
                    level="H"
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 10, display: 'block', marginTop: 4, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  Mã QR Tra cứu EMR Điện tử
                </Text>
              </div>

              <div style={{ textAlign: 'center' }}>
                <Text type="secondary" style={{ color: isDarkMode ? '#94a3b8' : undefined, display: 'block', fontSize: 12 }}>Bác sĩ Khám & Ký số</Text>
                <Tag color="green" style={{ marginTop: 4, marginBottom: 8, fontWeight: 700 }}>
                  <SafetyCertificateOutlined /> Đã ký số SHA-256
                </Tag>
                <Text strong style={{ color: isDarkMode ? '#f8fafc' : undefined, display: 'block' }}>{selectedRecord.doctorName}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
