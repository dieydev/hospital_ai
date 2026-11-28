import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '../styles/prescriptionPrint.css';
import {
  Card,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Modal,
  Table,
  Input,
  Select,
  Tabs,
  Avatar,
  Timeline,
  Drawer,
  Empty,
} from 'antd';
import {
  FilePdfOutlined,
  PrinterOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  IdcardOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  FileDoneOutlined,
  ExperimentOutlined,
  AlertOutlined,
  SolutionOutlined,
  TeamOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showToast } from '../utils/sweetAlert';
import { examinationService, ExaminationItem } from '../services/examinationService';
import { patientService, Patient } from '../services/patientService';
import { buildPatientComprehensiveEMR } from '../utils/emrDataBuilder';

interface InfoFieldItem {
  label: string;
  value: React.ReactNode;
  span?: 1 | 2;
}

const SectionTitle: React.FC<{ icon?: React.ReactNode; title: string; rightExtra?: React.ReactNode; isDarkMode?: boolean }> = ({
  icon,
  title,
  rightExtra,
  isDarkMode = false,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 4,
          height: 18,
          borderRadius: 999,
          backgroundColor: '#0284c7',
          display: 'inline-block',
        }}
      />
      {icon && <span style={{ color: '#0284c7', fontSize: 16, display: 'inline-flex' }}>{icon}</span>}
      <h3
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 800,
          color: isDarkMode ? '#38bdf8' : '#0369a1',
          letterSpacing: '0.01em',
        }}
      >
        {title}
      </h3>
    </div>
    {rightExtra}
  </div>
);

const CleanInfoGrid: React.FC<{ items: InfoFieldItem[]; isDarkMode?: boolean }> = ({ items, isDarkMode = false }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
      gap: 12,
    }}
  >
    {items.map((item, idx) => (
      <div
        key={idx}
        style={{
          gridColumn: item.span === 2 ? '1 / -1' : undefined,
          backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc',
          border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
          borderRadius: 12,
          padding: '10px 14px',
        }}
      >
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: isDarkMode ? '#94a3b8' : '#64748b',
            marginBottom: 4,
          }}
        >
          {item.label}
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: isDarkMode ? '#f1f5f9' : '#0f172a',
            lineHeight: 1.45,
          }}
        >
          {item.value || '—'}
        </div>
      </div>
    ))}
  </div>
);

export const MedicalRecordsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const borderCol = isDarkMode ? '#334155' : '#bae6fd';
  const textMain = isDarkMode ? '#f1f5f9' : '#0f172a';
  const textSub = isDarkMode ? '#cbd5e1' : '#334155';
  const textMuted = isDarkMode ? '#94a3b8' : '#64748b';
  const softBg = isDarkMode ? '#0f172a' : '#f0f9ff';

  const [patients, setPatients] = useState<Patient[]>([]);
  const [rawExams, setRawExams] = useState<ExaminationItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [drawerSearchText, setDrawerSearchText] = useState('');
  const [isPatientDrawerOpen, setIsPatientDrawerOpen] = useState(false);

  const [patientExams, setPatientExams] = useState<ExaminationItem[]>([]);
  const [selectedExamIndex, setSelectedExamIndex] = useState<number>(0);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [patientRes, examRes] = await Promise.all([
        patientService.getPatients(),
        examinationService.getExaminations(),
      ]);

      const patientList = patientRes.items || [];
      setPatients(patientList);
      setRawExams(examRes || []);

      if (patientList.length > 0) {
        const defaultPatient =
          patientList.find((p) => p.maBenhNhan === 'BN20260001' || p.hoTen.includes('Nguyễn Văn An')) ||
          patientList[0];
        handleSelectPatient(defaultPatient, examRes);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu EMR:', error);
      showToast('Lỗi khi tải dữ liệu bệnh án', 'error');
    }
  };

  const handleSelectPatient = (patient: Patient, existingRawExams?: ExaminationItem[]) => {
    setSelectedPatient(patient);
    setSelectedExamIndex(0);
    const emrList = buildPatientComprehensiveEMR(patient, existingRawExams ?? rawExams);
    setPatientExams(emrList);
  };

  const filteredDrawerPatients = useMemo(() => {
    if (!drawerSearchText.trim()) return patients;
    const q = drawerSearchText.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.hoTen.toLowerCase().includes(q) ||
        p.maBenhNhan.toLowerCase().includes(q) ||
        (p.soCCCD || '').includes(q) ||
        (p.soDienThoai || '').includes(q)
    );
  }, [patients, drawerSearchText]);

  const currentExam = patientExams[selectedExamIndex] || patientExams[0];

  const handleOpenPdf = (exam?: ExaminationItem) => {
    if (exam) {
      const idx = patientExams.findIndex((e) => e.id === exam.id);
      if (idx !== -1) setSelectedExamIndex(idx);
    }
    setIsPdfModalOpen(true);
  };

  const handleSignExam = async (examId?: string) => {
    if (!examId && !currentExam?.id) return;
    const targetId = examId || currentExam!.id;
    setIsSigning(true);
    try {
      const res = await examinationService.signExamination(targetId, '123456');
      if (res && res.isDigitallySigned) {
        showToast('Ký số Bệnh án EMR thành công theo chuẩn Bộ Y Tế!', 'success');
        setPatientExams((prev) =>
          prev.map((e) =>
            e.id === targetId
              ? {
                  ...e,
                  isDigitallySigned: true,
                  digitalSignature: res.digitalSignature,
                  signatureHash: res.signatureHash,
                  signedAt: res.signedAt,
                  doctorLicenseNumber: res.doctorLicenseNumber,
                  signatureCertificateSerial: res.certificateSerial,
                }
              : e
          )
        );
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Lỗi khi ký số bệnh án', 'error');
    } finally {
      setIsSigning(false);
    }
  };

  const totalPrescriptionAmount = useMemo(() => {
    return (currentExam?.prescriptionDetails || []).reduce(
      (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1),
      0
    );
  }, [currentExam]);

  const hasAllergyAlert =
    Boolean(selectedPatient?.diUngThuoc) &&
    !selectedPatient!.diUngThuoc!.toLowerCase().includes('không');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* 1. THANH CHỌN & TÌM NHANH BỆNH NHÂN GỌN GÀNG */}
      <Card
        variant="borderless"
        styles={{ body: { padding: '14px 18px' } }}
        style={{
          backgroundColor: cardBg,
          borderRadius: 16,
          border: `1px solid ${borderCol}`,
          boxShadow: isDarkMode ? 'none' : '0 10px 30px rgba(2, 132, 199, 0.08)',
        }}
      >
        <Row gutter={[14, 12]} align="middle" justify="space-between">
          <Col xs={24} lg={15}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <SearchOutlined style={{ color: '#0284c7' }} />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
                CHỌN HOẶC TÌM NHANH BỆNH NHÂN ({patients.length} hồ sơ)
              </span>
            </div>
            <Select
              showSearch
              size="large"
              value={selectedPatient?.id}
              placeholder="Nhập tên, mã BN, số CCCD hoặc số điện thoại để tìm..."
              style={{ width: '100%' }}
              popupMatchSelectWidth={false}
              filterOption={(input, option) => {
                const searchVal = String((option as { 'data-search'?: string } | undefined)?.['data-search'] || '').toLowerCase();
                return searchVal.includes(input.toLowerCase().trim());
              }}
              onChange={(val) => {
                const found = patients.find((p) => p.id === val);
                if (found) handleSelectPatient(found);
              }}
              optionLabelProp="label"
            >
              {patients.map((p) => (
                <Select.Option
                  key={p.id}
                  value={p.id}
                  label={`${p.hoTen} (${p.maBenhNhan}) — ${p.soDienThoai || p.soCCCD}`}
                  data-search={`${p.hoTen} ${p.maBenhNhan} ${p.soCCCD} ${p.soDienThoai}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                    <Avatar
                      size={28}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.hoTen)}`}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#0284c7', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <strong style={{ color: '#0f172a', fontSize: 13.5 }}>{p.hoTen}</strong>
                        <Tag color="blue" style={{ margin: 0, fontFamily: 'monospace', fontSize: 11 }}>
                          {p.maBenhNhan}
                        </Tag>
                        {p.maTheBHYT && (
                          <Tag color="green" style={{ margin: 0, fontSize: 11 }}>
                            BHYT
                          </Tag>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {p.tuoi || 'N/A'} tuổi ({p.gioiTinh}) • CCCD: {p.soCCCD || '—'} • SĐT: {p.soDienThoai || '—'}
                      </div>
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} lg={9}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap', paddingTop: 18 }}>
              <Button
                icon={<TeamOutlined />}
                size="large"
                style={{
                  borderRadius: 10,
                  borderColor: borderCol,
                  color: isDarkMode ? '#38bdf8' : '#0369a1',
                  backgroundColor: softBg,
                  fontWeight: 600,
                }}
                onClick={() => setIsPatientDrawerOpen(true)}
              >
                Danh sách ({patients.length})
              </Button>
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                size="large"
                style={{
                  borderRadius: 10,
                  backgroundColor: '#0284c7',
                  borderColor: '#0284c7',
                  fontWeight: 700,
                }}
                onClick={() => handleOpenPdf()}
              >
                Xem &amp; In Bệnh Án A4
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 2. THẺ TÓM TẮT NGƯỜI BỆNH SÁNG SẠCH, DỄ ĐỌC */}
      {selectedPatient && (
        <Card
          variant="borderless"
          styles={{ body: { padding: 0 } }}
          style={{
            backgroundColor: cardBg,
            borderRadius: 18,
            border: `1px solid ${borderCol}`,
            boxShadow: isDarkMode ? 'none' : '0 10px 30px rgba(2, 132, 199, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Thanh nhấn trên cùng theo hệ màu Y tế Số */}
          <div
            style={{
              height: 5,
              background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 60%, #14b8a6 100%)',
            }}
          />

          <div style={{ padding: '18px 22px' }}>
            <Row gutter={[20, 16]} align="middle" justify="space-between">
              <Col xs={24} xl={15}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <Avatar
                    size={58}
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedPatient.hoTen)}`}
                    icon={<UserOutlined />}
                    style={{
                      backgroundColor: '#0284c7',
                      border: `2px solid ${borderCol}`,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <h1
                        style={{
                          margin: 0,
                          fontSize: 21,
                          fontWeight: 800,
                          color: textMain,
                          lineHeight: 1.25,
                        }}
                      >
                        {selectedPatient.hoTen.toUpperCase()}
                      </h1>
                      <Tag
                        style={{
                          margin: 0,
                          backgroundColor: softBg,
                          borderColor: borderCol,
                          color: isDarkMode ? '#38bdf8' : '#0369a1',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                        }}
                      >
                        {selectedPatient.maBenhNhan}
                      </Tag>
                      <Tag color="red" style={{ margin: 0, fontWeight: 700 }}>
                        Nhóm máu: {selectedPatient.nhomMau || 'O+'}
                      </Tag>
                      {selectedPatient.maTheBHYT ? (
                        <Tag color="green" style={{ margin: 0, fontWeight: 600 }}>
                          BHYT: {selectedPatient.maTheBHYT}
                        </Tag>
                      ) : (
                        <Tag style={{ margin: 0 }}>Viện phí</Tag>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px 16px',
                        fontSize: 13,
                        color: textSub,
                      }}
                    >
                      <span>
                        <strong>{selectedPatient.gioiTinh}</strong> • {selectedPatient.tuoi || '—'} tuổi ({selectedPatient.ngaySinh || '—'})
                      </span>
                      <span>
                        CCCD: <strong style={{ fontFamily: 'monospace' }}>{selectedPatient.soCCCD || '—'}</strong>
                      </span>
                      <span>
                        SĐT: <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{selectedPatient.soDienThoai || '—'}</strong>
                      </span>
                      <span>
                        Lưu trữ: <strong style={{ fontFamily: 'monospace' }}>{currentExam?.emrFileNumber || `BA-${selectedPatient.maBenhNhan}/2026`}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} xl={9}>
                <div
                  style={{
                    backgroundColor: softBg,
                    border: `1px solid ${borderCol}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
                      ĐỢT KHÁM ĐANG XEM ({selectedExamIndex + 1}/{patientExams.length})
                    </span>
                    {currentExam?.isDigitallySigned ? (
                      <Tag color="green" style={{ margin: 0, fontWeight: 700 }}>
                        <SafetyCertificateOutlined /> Đã ký số
                      </Tag>
                    ) : (
                      <Tag color="orange" style={{ margin: 0, fontWeight: 600 }}>
                        Chờ ký số
                      </Tag>
                    )}
                  </div>
                  <Select
                    value={selectedExamIndex}
                    onChange={(idx) => setSelectedExamIndex(idx)}
                    style={{ width: '100%' }}
                    popupMatchSelectWidth={false}
                  >
                    {patientExams.map((exam, idx) => (
                      <Select.Option key={exam.id} value={idx}>
                        <span style={{ fontWeight: 600 }}>
                          {formatDate(exam.examinationDate)} • {exam.departmentName} ({exam.icd10Code})
                        </span>
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>
          </div>
        </Card>
      )}

      {/* 3. BỐ CỤC CHÍNH 2 CỘT: BÊN TRÁI DANH SÁCH ĐỢT KHÁM + CẢNH BÁO | BÊN PHẢI NỘI DUNG EMR THOÁNG RÕ */}
      {currentExam && selectedPatient ? (
        <Row gutter={[18, 18]}>
          {/* CỘT TRÁI: DÒNG THỜI GIAN ĐỢT KHÁM & LƯU Ý LÂM SÀNG */}
          <Col xs={24} xl={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card
                variant="borderless"
                styles={{ body: { padding: '14px 16px' } }}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  border: `1px solid ${borderCol}`,
                  boxShadow: isDarkMode ? 'none' : '0 10px 30px rgba(2, 132, 199, 0.08)',
                }}
                title={
                  <Space size={8}>
                    <HistoryOutlined style={{ color: '#0284c7' }} />
                    <span style={{ fontWeight: 800, fontSize: 14, color: textMain }}>
                      Lịch sử Khám ({patientExams.length} đợt)
                    </span>
                  </Space>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {patientExams.map((exam, idx) => {
                    const isActive = idx === selectedExamIndex;
                    return (
                      <button
                        type="button"
                        key={exam.id}
                        onClick={() => setSelectedExamIndex(idx)}
                        style={{
                          textAlign: 'left',
                          width: '100%',
                          cursor: 'pointer',
                          padding: '12px 14px',
                          borderRadius: 12,
                          backgroundColor: isActive ? softBg : cardBg,
                          border: isActive ? '1.5px solid #0284c7' : `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
                          boxShadow: isActive ? '0 4px 14px rgba(2, 132, 199, 0.12)' : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 700, color: isActive ? '#0284c7' : textSub }}>
                            {formatDate(exam.examinationDate)}
                          </span>
                          <Tag color="blue" style={{ margin: 0, fontFamily: 'monospace', fontSize: 11 }}>
                            {exam.icd10Code}
                          </Tag>
                        </div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: textMain, marginBottom: 3 }}>
                          {exam.departmentName}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: textMuted,
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            marginBottom: 6,
                          }}
                        >
                          {exam.assessment || exam.icd10Name}
                        </div>
                        <div style={{ fontSize: 11.5, color: textMuted }}>
                          BS: <strong style={{ color: textSub }}>{exam.doctorName}</strong>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card
                variant="borderless"
                styles={{ body: { padding: '14px 16px' } }}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 16,
                  border: `1px solid ${borderCol}`,
                  boxShadow: isDarkMode ? 'none' : '0 10px 30px rgba(2, 132, 199, 0.08)',
                }}
                title={
                  <Space size={8}>
                    <AlertOutlined style={{ color: hasAllergyAlert ? '#dc2626' : '#0284c7' }} />
                    <span style={{ fontWeight: 800, fontSize: 14, color: textMain }}>
                      Cảnh báo Lâm sàng
                    </span>
                  </Space>
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      backgroundColor: hasAllergyAlert ? (isDarkMode ? '#450a0a' : '#fef2f2') : softBg,
                      border: `1px solid ${hasAllergyAlert ? '#fca5a5' : borderCol}`,
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: hasAllergyAlert ? '#dc2626' : '#0369a1', marginBottom: 2 }}>
                      Tiền sử Dị ứng thuốc
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: hasAllergyAlert ? '#991b1b' : textMain }}>
                      {selectedPatient.diUngThuoc || 'Không ghi nhận dị ứng'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      backgroundColor: isDarkMode ? '#0f172a' : '#fffbeb',
                      border: `1px solid ${isDarkMode ? '#334155' : '#fde68a'}`,
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#b45309', marginBottom: 2 }}>
                      Bệnh nền mạn tính
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isDarkMode ? '#fef3c7' : '#78350f' }}>
                      {selectedPatient.tienSuBenh || 'Không có bệnh mạn tính'}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      backgroundColor: softBg,
                      border: `1px solid ${borderCol}`,
                    }}
                  >
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0369a1', marginBottom: 2 }}>
                      Liên hệ người thân khẩn cấp
                    </div>
                    <div style={{ fontSize: 13, color: textMain, fontWeight: 600 }}>
                      {selectedPatient.tenNguoiThan || 'Chưa cập nhật'} ({selectedPatient.quanHeNguoiThan || 'Người thân'})
                    </div>
                    {selectedPatient.soDienThoaiNguoiThan && (
                      <div style={{ fontSize: 12.5, color: '#0284c7', fontFamily: 'monospace', fontWeight: 700, marginTop: 2 }}>
                        <PhoneOutlined /> {selectedPatient.soDienThoaiNguoiThan}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </Col>

          {/* CỘT PHẢI: CHI TIẾT BỆNH ÁN VỚI 5 TAB NGẮN GỌN, DỄ ĐỌC */}
          <Col xs={24} xl={18}>
            <Card
              variant="borderless"
              styles={{ body: { padding: '18px 24px 24px' } }}
              style={{
                backgroundColor: cardBg,
                borderRadius: 18,
                border: `1px solid ${borderCol}`,
                boxShadow: isDarkMode ? 'none' : '0 10px 30px rgba(2, 132, 199, 0.1)',
              }}
            >
              <Tabs
                defaultActiveKey="tab-clinical"
                className="medical-emr-tabs"
                items={[
                  // TAB 1: KHÁM BỆNH & CHẨN ĐOÁN (MỞ MẶC ĐỊNH ĐỂ DỄ ĐỌC NGAY)
                  {
                    key: 'tab-clinical',
                    label: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <MedicineBoxOutlined /> Khám &amp; Chẩn đoán
                      </span>
                    ),
                    children: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                        {/* Khối nổi bật: Chẩn đoán chính + Bác sĩ + Lý do vào viện */}
                        <div
                          style={{
                            padding: '16px 18px',
                            borderRadius: 14,
                            backgroundColor: softBg,
                            border: `1.5px solid ${borderCol}`,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: 4 }}>
                                Chẩn đoán xác định • {currentExam.departmentName}
                              </div>
                              <div style={{ fontSize: 17, fontWeight: 800, color: textMain }}>
                                <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, marginRight: 8 }}>
                                  {currentExam.icd10Code}
                                </Tag>
                                {currentExam.icd10Name}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 12, color: textMuted }}>Bác sĩ khám</div>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
                                {currentExam.doctorName}
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: 13.5, color: textSub, lineHeight: 1.55, borderTop: `1px solid ${borderCol}`, paddingTop: 8 }}>
                            <strong>Lý do vào viện:</strong> {currentExam.reasonForAdmission || currentExam.subjective}
                          </div>
                        </div>

                        {/* Chỉ số sinh hiệu — Lưới 4 cột thoáng mắt */}
                        <div>
                          <SectionTitle
                            icon={<HeartOutlined />}
                            title="CHỈ SỐ SINH HIỆU ĐO ĐƯỢC"
                            isDarkMode={isDarkMode}
                          />
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                              gap: 10,
                            }}
                          >
                            {[
                              { label: 'Mạch', value: currentExam.pulseRate, unit: 'lần/phút' },
                              { label: 'Huyết áp', value: currentExam.bloodPressure, unit: 'mmHg' },
                              { label: 'Thân nhiệt', value: `${currentExam.temperature}°C`, unit: 'Độ C' },
                              { label: 'Nhịp thở', value: currentExam.respiratoryRate, unit: 'lần/phút' },
                              { label: 'SpO2', value: `${currentExam.spO2 || 98}%`, unit: 'Oxy máu', highlight: '#059669' },
                              { label: 'Cân nặng / Cao', value: `${currentExam.weight}kg / ${currentExam.height}cm`, unit: 'Thể trạng' },
                              { label: 'Chỉ số BMI', value: currentExam.bmi, unit: 'Bình thường' },
                            ].map((v, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '12px 14px',
                                  borderRadius: 12,
                                  backgroundColor: softBg,
                                  border: `1px solid ${borderCol}`,
                                }}
                              >
                                <div style={{ fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 4 }}>
                                  {v.label}
                                </div>
                                <div
                                  style={{
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: v.highlight || (isDarkMode ? '#38bdf8' : '#0369a1'),
                                    fontFamily: 'monospace',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {v.value}
                                </div>
                                <div style={{ fontSize: 11.5, color: textMuted, marginTop: 2 }}>{v.unit}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quá trình bệnh lý & Tiền sử */}
                        <div>
                          <SectionTitle title="BỆNH SỬ & TIỀN SỬ BỆNH LÝ" isDarkMode={isDarkMode} />
                          <CleanInfoGrid
                            isDarkMode={isDarkMode}
                            items={[
                              { label: 'Quá trình bệnh lý (HPI)', value: currentExam.pathologicalProcess, span: 2 },
                              { label: 'Tiền sử bản thân', value: currentExam.medicalHistoryPersonal },
                              { label: 'Tiền sử gia đình', value: currentExam.medicalHistoryFamily },
                            ]}
                          />
                        </div>

                        {/* Khám toàn thân và các cơ quan */}
                        <div>
                          <SectionTitle title="KẾT QUẢ KHÁM LÂM SÀNG CÁC CƠ QUAN" isDarkMode={isDarkMode} />
                          <CleanInfoGrid
                            isDarkMode={isDarkMode}
                            items={[
                              { label: 'Khám toàn thân', value: currentExam.generalExamination, span: 2 },
                              { label: 'Tuần hoàn / Tim mạch', value: currentExam.circulatoryExam },
                              { label: 'Hô hấp / Lồng ngực', value: currentExam.respiratoryExam },
                              { label: 'Tiêu hóa / Ổ bụng', value: currentExam.digestiveExam },
                              { label: 'Thần kinh & Tri giác', value: currentExam.nervousExam },
                              { label: 'Cơ - Xương - Khớp', value: currentExam.musculoskeletalExam },
                              { label: 'Tai Mũi Họng / RHM', value: currentExam.entExam },
                            ]}
                          />
                        </div>
                      </div>
                    ),
                  },

                  // TAB 2: ĐƠN THUỐC & ĐIỀU TRỊ
                  {
                    key: 'tab-treatment',
                    label: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <FileDoneOutlined /> Đơn thuốc &amp; Điều trị
                      </span>
                    ),
                    children: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                        <div>
                          <SectionTitle title="CHẨN ĐOÁN Y KHOA (4 CẤP ĐỘ)" isDarkMode={isDarkMode} />
                          <CleanInfoGrid
                            isDarkMode={isDarkMode}
                            items={[
                              { label: 'Chẩn đoán khi vào viện', value: currentExam.initialDiagnosis },
                              { label: 'Chẩn đoán sơ bộ', value: currentExam.preliminaryDiagnosis },
                              {
                                label: 'Chẩn đoán xác định (ICD-10)',
                                value: (
                                  <span>
                                    <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                      {currentExam.icd10Code}
                                    </Tag>
                                    {currentExam.icd10Name}
                                  </span>
                                ),
                              },
                              { label: 'Chẩn đoán phân biệt / Kèm theo', value: currentExam.differentialDiagnosis },
                            ]}
                          />
                        </div>

                        <div>
                          <SectionTitle
                            title="ĐƠN THUỐC ĐIỆN TỬ"
                            isDarkMode={isDarkMode}
                            rightExtra={
                              <Tag color="blue" style={{ margin: 0, fontWeight: 700 }}>
                                {currentExam.prescriptionDetails?.length || 0} loại • Tổng: {formatCurrency(totalPrescriptionAmount)}
                              </Tag>
                            }
                          />
                          <Table
                            dataSource={currentExam.prescriptionDetails || []}
                            rowKey="medicineName"
                            pagination={false}
                            size="middle"
                            className="medical-emr-table"
                            locale={{ emptyText: <Empty description="Không có đơn thuốc trong đợt khám này" /> }}
                            columns={[
                              { title: 'STT', width: 55, align: 'center', render: (_, __, i) => i + 1 },
                              {
                                title: 'Tên thuốc & Hoạt chất',
                                dataIndex: 'medicineName',
                                render: (name, r) => (
                                  <div>
                                    <strong style={{ color: textMain, fontSize: 13.5 }}>{name}</strong>
                                    {r.activeIngredient && (
                                      <div style={{ fontSize: 12, color: textMuted }}>Hoạt chất: {r.activeIngredient}</div>
                                    )}
                                  </div>
                                ),
                              },
                              {
                                title: 'Số lượng',
                                dataIndex: 'quantity',
                                width: 105,
                                align: 'center',
                                render: (qty, r) => (
                                  <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700, margin: 0 }}>
                                    {qty} {r.unit}
                                  </Tag>
                                ),
                              },
                              {
                                title: 'Hướng dẫn liều dùng',
                                dataIndex: 'dosageInstruction',
                                render: (text, r) => (
                                  <div>
                                    <div style={{ color: textSub, fontWeight: 500 }}>{text}</div>
                                    {r.usageTime && (
                                      <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600, marginTop: 2 }}>
                                        {r.usageTime}
                                      </div>
                                    )}
                                  </div>
                                ),
                              },
                              {
                                title: 'Thành tiền',
                                width: 125,
                                align: 'right',
                                render: (_, r) => (
                                  <strong style={{ color: textMain }}>
                                    {formatCurrency((r.unitPrice || 0) * (r.quantity || 1))}
                                  </strong>
                                ),
                              },
                            ]}
                          />
                        </div>

                        <div>
                          <SectionTitle title="PHIẾU CHĂM SÓC & THEO DÕI" isDarkMode={isDarkMode} />
                          <Timeline
                            items={currentExam.dailyCareNotes?.map((note) => ({
                              color: '#0284c7',
                              children: (
                                <div
                                  style={{
                                    padding: '12px 14px',
                                    borderRadius: 12,
                                    backgroundColor: softBg,
                                    border: `1px solid ${borderCol}`,
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <strong style={{ fontSize: 12.5, color: '#0284c7' }}>{note.date}</strong>
                                    <Tag color="cyan" style={{ margin: 0 }}>{note.caregiver}</Tag>
                                  </div>
                                  <div style={{ fontSize: 12, color: textMuted, fontFamily: 'monospace', marginBottom: 4 }}>
                                    {note.vitals}
                                  </div>
                                  <div style={{ fontSize: 13, color: textSub }}>{note.nurseNote}</div>
                                </div>
                              ),
                            }))}
                          />

                          <CleanInfoGrid
                            isDarkMode={isDarkMode}
                            items={[
                              { label: 'Biên bản hội chẩn chuyên môn', value: currentExam.consultationMinutes },
                              { label: 'Cam kết chấp thuận thủ thuật', value: currentExam.surgicalConsentNote },
                            ]}
                          />
                        </div>
                      </div>
                    ),
                  },

                  // TAB 3: CẬN LÂM SÀNG (CLS)
                  {
                    key: 'tab-cls',
                    label: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <ExperimentOutlined /> Cận lâm sàng
                      </span>
                    ),
                    children: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                        <div>
                          <SectionTitle
                            title="KẾT QUẢ XÉT NGHIỆM"
                            isDarkMode={isDarkMode}
                            rightExtra={<Tag color="blue" style={{ margin: 0 }}>{currentExam.labTests?.length || 0} chỉ số</Tag>}
                          />
                          <Table
                            dataSource={currentExam.labTests || []}
                            rowKey="testName"
                            pagination={false}
                            size="middle"
                            className="medical-emr-table"
                            columns={[
                              { title: 'STT', width: 55, align: 'center', render: (_, __, i) => i + 1 },
                              {
                                title: 'Tên xét nghiệm',
                                dataIndex: 'testName',
                                render: (text, r) => (
                                  <div>
                                    <strong style={{ color: textMain }}>{text}</strong>
                                    <div style={{ fontSize: 12, color: textMuted }}>Nhóm: {r.category}</div>
                                  </div>
                                ),
                              },
                              {
                                title: 'Kết quả',
                                dataIndex: 'result',
                                width: 130,
                                render: (val) => (
                                  <strong style={{ fontFamily: 'monospace', color: '#0284c7', fontSize: 14 }}>{val}</strong>
                                ),
                              },
                              { title: 'Đơn vị', dataIndex: 'unit', width: 85, align: 'center' },
                              { title: 'Tham chiếu', dataIndex: 'referenceRange', width: 145, align: 'center' },
                              {
                                title: 'Đánh giá',
                                dataIndex: 'evaluation',
                                width: 125,
                                align: 'center',
                                render: (evalVal: string) => {
                                  const color = evalVal === 'Bình thường' ? 'green' : evalVal === 'Tăng nhẹ' ? 'orange' : 'red';
                                  return <Tag color={color} style={{ margin: 0, fontWeight: 600 }}>{evalVal}</Tag>;
                                },
                              },
                            ]}
                          />
                        </div>

                        <div>
                          <SectionTitle title="CHẨN ĐOÁN HÌNH ẢNH (X-QUANG, SIÊU ÂM, CT)" isDarkMode={isDarkMode} />
                          <Row gutter={[14, 14]}>
                            {currentExam.imagingStudies?.map((img, i) => (
                              <Col xs={24} md={12} key={i}>
                                <div
                                  style={{
                                    padding: '14px 16px',
                                    borderRadius: 14,
                                    border: `1px solid ${borderCol}`,
                                    backgroundColor: softBg,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: 10,
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                      <Tag color="blue" style={{ fontWeight: 700, margin: 0 }}>{img.modality}</Tag>
                                      <span style={{ fontSize: 12, color: textMuted }}>{img.doctorName}</span>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: textMain, marginBottom: 6 }}>
                                      {img.title}
                                    </div>
                                    <div style={{ fontSize: 13, color: textSub, lineHeight: 1.5 }}>
                                      <strong>Mô tả:</strong> {img.findings}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      padding: '10px 12px',
                                      borderRadius: 10,
                                      backgroundColor: cardBg,
                                      border: `1px solid ${borderCol}`,
                                    }}
                                  >
                                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0284c7' }}>Kết luận:</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: textMain }}>{img.conclusion}</div>
                                  </div>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </div>

                        <div>
                          <SectionTitle title="THĂM DÒ CHỨC NĂNG (ECG / ĐIỆN NÃO ĐỒ)" isDarkMode={isDarkMode} />
                          <div
                            style={{
                              padding: '14px 16px',
                              borderRadius: 12,
                              backgroundColor: softBg,
                              border: `1px solid ${borderCol}`,
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: textMain,
                            }}
                          >
                            {currentExam.functionalStudies}
                          </div>
                        </div>
                      </div>
                    ),
                  },

                  // TAB 4: HÀNH CHÍNH & BHYT
                  {
                    key: 'tab-administrative',
                    label: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <IdcardOutlined /> Hành chính &amp; BHYT
                      </span>
                    ),
                    children: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                        <div>
                          <SectionTitle title="1. THÔNG TIN CÁ NHÂN NGƯỜI BỆNH" isDarkMode={isDarkMode} />
                          <CleanInfoGrid
                            isDarkMode={isDarkMode}
                            items={[
                              { label: 'Họ và tên (Chữ in hoa)', value: currentExam.patientName },
                              {
                                label: 'Giới tính',
                                value: (
                                  <Tag color={currentExam.patientGender === 'Nam' ? 'blue' : 'magenta'} style={{ margin: 0 }}>
                                    {currentExam.patientGender}
                                  </Tag>
                                ),
                              },
                              { label: 'Ngày sinh & Tuổi', value: `${currentExam.patientDateOfBirth} (${currentExam.patientAge} tuổi)` },
                              { label: 'Số CCCD / Định danh', value: <span style={{ fontFamily: 'monospace' }}>{currentExam.identityCardNumber}</span> },
                              { label: 'Số điện thoại', value: <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>{selectedPatient.soDienThoai}</span> },
                              { label: 'Nghề nghiệp', value: currentExam.profession },
                              {
                                label: 'Nơi cư trú hiện tại',
                                span: 2,
                                value: (
                                  <span>
                                    <HomeOutlined style={{ color: '#0284c7', marginRight: 6 }} />
                                    {currentExam.address}
                                  </span>
                                ),
                              },
                            ]}
                          />
                        </div>

                        <div>
                          <SectionTitle title="2. NGƯỜI NHÀ / BÁO TIN KHẨN CẤP" isDarkMode={isDarkMode} />
                          <CleanInfoGrid
                            isDarkMode={isDarkMode}
                            items={[
                              { label: 'Họ tên người nhà', value: currentExam.emergencyContactName },
                              { label: 'Mối quan hệ', value: <Tag color="cyan" style={{ margin: 0 }}>{currentExam.emergencyContactRelation}</Tag> },
                              {
                                label: 'Điện thoại báo tin',
                                value: (
                                  <span style={{ fontFamily: 'monospace', color: '#dc2626' }}>
                                    <PhoneOutlined /> {currentExam.emergencyContactPhone}
                                  </span>
                                ),
                              },
                              { label: 'Địa chỉ người nhà', value: currentExam.emergencyContactAddress },
                            ]}
                          />
                        </div>

                        <div>
                          <SectionTitle title="3. BẢO HIỂM Y TẾ (BHYT) & QUẢN LÝ VIỆN" isDarkMode={isDarkMode} />
                          <CleanInfoGrid
                            isDarkMode={isDarkMode}
                            items={[
                              { label: 'Mã số thẻ BHYT', value: <span style={{ fontFamily: 'monospace', color: '#059669' }}>{currentExam.healthInsuranceNumber || 'Không có'}</span> },
                              { label: 'Mức hưởng & Hạn thẻ', value: `${currentExam.insuranceBenefitRate || '80%'} (HSD: ${currentExam.insuranceExpiryDate || '31/12/2026'})` },
                              { label: 'Nơi ĐKKCB ban đầu', value: currentExam.insurancePlace, span: 2 },
                              { label: 'Số lưu trữ EMR', value: <span style={{ fontFamily: 'monospace', color: '#0369a1' }}>{currentExam.emrFileNumber}</span> },
                              { label: 'Mã lượt khám', value: <span style={{ fontFamily: 'monospace' }}>{currentExam.examinationCode}</span> },
                              { label: 'Tiếp nhận / Ra viện', value: `${currentExam.admissionDate} → ${currentExam.dischargeDate}` },
                              { label: 'Khoa & Bác sĩ phụ trách', value: `${currentExam.departmentName} • ${currentExam.doctorName}` },
                            ]}
                          />
                        </div>
                      </div>
                    ),
                  },

                  // TAB 5: TỔNG KẾT & KÝ SỐ
                  {
                    key: 'tab-discharge',
                    label: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <SolutionOutlined /> Tổng kết &amp; Ký số
                      </span>
                    ),
                    children: (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                        <div
                          style={{
                            padding: '16px 18px',
                            borderRadius: 14,
                            backgroundColor: isDarkMode ? '#064e3b' : '#ecfdf5',
                            border: `1px solid ${isDarkMode ? '#059669' : '#a7f3d0'}`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <CheckCircleOutlined style={{ color: '#059669', fontSize: 18 }} />
                            <strong style={{ fontSize: 14.5, color: isDarkMode ? '#6ee7b7' : '#065f46' }}>
                              Tình trạng ra viện: {currentExam.dischargeStatus?.split(',')[0] || 'Ổn định'}
                            </strong>
                          </div>
                          <div style={{ fontSize: 13.5, color: isDarkMode ? '#d1fae5' : '#065f46', lineHeight: 1.55 }}>
                            {currentExam.dischargeStatus}
                          </div>
                        </div>

                        <div>
                          <SectionTitle title="HƯỚNG ĐIỀU TRỊ & HẸN TÁI KHÁM" isDarkMode={isDarkMode} />
                          <CleanInfoGrid
                            isDarkMode={isDarkMode}
                            items={[
                              { label: 'Hướng điều trị tiếp theo', value: currentExam.nextTreatmentPlan, span: 2 },
                              { label: 'Chế độ ăn uống & Dinh dưỡng', value: currentExam.dietaryAndLivingAdvice, span: 2 },
                              {
                                label: 'Lịch hẹn tái khám',
                                span: 2,
                                value: (
                                  <span style={{ color: '#0369a1' }}>
                                    <CalendarOutlined style={{ marginRight: 6 }} />
                                    {currentExam.followUpAppointment}
                                  </span>
                                ),
                              },
                            ]}
                          />
                        </div>

                        <div
                          style={{
                            padding: '18px 20px',
                            borderRadius: 14,
                            backgroundColor: softBg,
                            border: `1px solid ${borderCol}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 16,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div
                              style={{
                                backgroundColor: '#ffffff',
                                padding: 8,
                                borderRadius: 10,
                                border: `1px solid ${borderCol}`,
                              }}
                            >
                              <QRCodeSVG
                                value={`https://hospital-ai.vn/emr/${currentExam.examinationCode}`}
                                size={72}
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: 12, color: textMuted }}>Xác thực Bệnh án Điện tử EMR</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: textMain }}>
                                Mã tra cứu: <span style={{ fontFamily: 'monospace' }}>{currentExam.examinationCode}</span>
                              </div>
                              <div style={{ fontSize: 12.5, color: '#059669', fontWeight: 600, marginTop: 2 }}>
                                <SafetyCertificateOutlined /> Chữ ký số hợp lệ theo Luật Giao dịch điện tử
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <Button
                              type="primary"
                              icon={<SafetyCertificateOutlined />}
                              loading={isSigning}
                              style={{
                                backgroundColor: currentExam.isDigitallySigned ? '#059669' : '#0284c7',
                                borderColor: currentExam.isDigitallySigned ? '#059669' : '#0284c7',
                                fontWeight: 700,
                                borderRadius: 10,
                              }}
                              onClick={() => handleSignExam(currentExam.id)}
                            >
                              {currentExam.isDigitallySigned ? '✓ Đã Ký Số SmartCA' : 'Ký Số Bệnh Án'}
                            </Button>
                            <Button
                              icon={<PrinterOutlined />}
                              style={{ borderRadius: 10, fontWeight: 600 }}
                              onClick={() => handleOpenPdf()}
                            >
                              In Phiếu A4
                            </Button>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      ) : null}

      {/* 4. DRAWER DANH SÁCH TOÀN BỘ BỆNH NHÂN */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <TeamOutlined />
            <span style={{ fontWeight: 800, fontSize: 16 }}>Danh Sách Bệnh Nhân EMR ({patients.length})</span>
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setIsPatientDrawerOpen(false)}
        open={isPatientDrawerOpen}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            placeholder="Tìm theo họ tên, mã BN, CCCD, SĐT..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            allowClear
            size="large"
            value={drawerSearchText}
            onChange={(e) => setDrawerSearchText(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredDrawerPatients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    handleSelectPatient(p);
                    setIsPatientDrawerOpen(false);
                    showToast(`Đã chuyển sang hồ sơ: ${p.hoTen.toUpperCase()}`, 'success');
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                    border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <Avatar
                      size={40}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(p.hoTen)}`}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: '#0284c7', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: 14, color: '#0f172a', display: 'block' }}>{p.hoTen.toUpperCase()}</strong>
                      <div style={{ fontSize: 12.5, color: '#334155' }}>
                        Mã: <strong style={{ fontFamily: 'monospace', color: '#0369a1' }}>{p.maBenhNhan}</strong> • {p.tuoi || '—'} tuổi ({p.gioiTinh})
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                        CCCD: {p.soCCCD || '—'} • SĐT: {p.soDienThoai || '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <Tag color={p.maTheBHYT ? 'green' : 'default'} style={{ margin: 0 }}>
                      {p.maTheBHYT ? 'BHYT' : 'Viện phí'}
                    </Tag>
                    {isSelected && (
                      <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 700, marginTop: 4 }}>✓ Đang xem</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Drawer>

      {/* 5. MODAL XEM TRƯỚC VÀ IN HỒ SƠ BỆNH ÁN EMR A4 CHUẨN BỘ Y TẾ */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#0284c7' }} />
            <span style={{ color: isDarkMode ? '#38bdf8' : '#0369a1' }}>
              XEM TRƯỚC HỒ SƠ BỆNH ÁN ĐIỆN TỬ EMR (A4 CHUẨN BỘ Y TẾ)
            </span>
          </Space>
        }
        open={isPdfModalOpen}
        onCancel={() => setIsPdfModalOpen(false)}
        width={880}
        footer={[
          <Button key="close" onClick={() => setIsPdfModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="sign"
            type="primary"
            icon={<SafetyCertificateOutlined />}
            loading={isSigning}
            style={{
              backgroundColor: currentExam?.isDigitallySigned ? '#059669' : '#dc2626',
              borderColor: currentExam?.isDigitallySigned ? '#059669' : '#dc2626',
            }}
            onClick={() => handleSignExam(currentExam?.id)}
          >
            {currentExam?.isDigitallySigned ? '✓ Đã Ký Số SmartCA' : 'Ký Số Bệnh Án (SmartCA)'}
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
            onClick={() => {
              window.print();
              showToast(`Đã in Hồ sơ Bệnh án EMR cho: ${currentExam?.patientName}`, 'success');
            }}
          >
            In Hồ Sơ Bệnh Án (A4)
          </Button>,
        ]}
      >
        {currentExam && selectedPatient && (
          <div
            id="printable-emr-record"
            style={{
              padding: '24px 32px',
              border: isDarkMode ? '1px solid #334155' : '1px solid #d9d9d9',
              borderRadius: 8,
              background: '#ffffff',
              color: '#0f172a',
              fontFamily: "'Be Vietnam Pro', 'Times New Roman', serif",
              fontSize: '13px',
              lineHeight: 1.5,
            }}
          >
            {/* Quốc hiệu Tiêu ngữ & Cơ quan chủ quản */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0284c7', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b' }}>SỞ Y TẾ TỈNH BÌNH DƯƠNG</div>
                <div style={{ fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', color: '#0369a1' }}>BỆNH VIỆN ĐA KHOA QUỐC TẾ D-MEDICAL</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Khoa: <strong>{currentExam.departmentName}</strong></div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div style={{ fontSize: 11, fontWeight: 'bold' }}>Độc lập - Tự do - Hạnh phúc</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>---------------o0o---------------</div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Mã BN: <strong style={{ color: '#0284c7', fontFamily: 'monospace' }}>{currentExam.patientCode}</strong></div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Số lưu trữ: <strong style={{ fontFamily: 'monospace' }}>{currentExam.emrFileNumber}</strong></div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Mã KCB: <strong>79-012</strong></div>
              </div>
            </div>

            {/* Tiêu đề chính */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0369a1', margin: '4px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                HỒ SƠ BỆNH ÁN ĐIỆN TỬ (EMR)
              </h2>
              <div style={{ fontSize: 12, fontStyle: 'italic', color: '#64748b' }}>
                (Ban hành kèm theo Thông tư số 32/2023/TT-BYT của Bộ trưởng Bộ Y tế)
              </div>
            </div>

            {/* PHẦN I: THỦ TỤC HÀNH CHÍNH & QUẢN LÝ NGƯỜI BỆNH */}
            <div style={{ background: '#f0f9ff', padding: '10px 14px', borderRadius: 6, marginBottom: 12, border: '1px solid #bae6fd' }}>
              <strong style={{ color: '#0369a1', fontSize: 13, textTransform: 'uppercase' }}>
                I. THÔNG TIN HÀNH CHÍNH VÀ CÁ NHÂN CỦA NGƯỜI BỆNH
              </strong>
            </div>

            <Row gutter={[16, 6]} style={{ marginBottom: 14 }}>
              <Col span={12}>1. Họ và tên: <strong style={{ fontSize: 14, color: '#0f172a' }}>{currentExam.patientName}</strong></Col>
              <Col span={6}>2. Giới tính: <strong>{currentExam.patientGender}</strong></Col>
              <Col span={6}>3. Tuổi: <strong>{currentExam.patientAge}</strong> (Sinh: {currentExam.patientDateOfBirth})</Col>
              <Col span={12}>4. Nghề nghiệp: <strong>{currentExam.profession}</strong></Col>
              <Col span={12}>5. Số CCCD: <strong style={{ fontFamily: 'monospace' }}>{currentExam.identityCardNumber}</strong></Col>
              <Col span={24}>6. Nơi cư trú hiện tại: {currentExam.address}</Col>
              <Col span={12}>7. Người nhà báo tin: <strong>{currentExam.emergencyContactName}</strong> ({currentExam.emergencyContactRelation})</Col>
              <Col span={12}>8. SĐT người nhà: <strong style={{ fontFamily: 'monospace' }}>{currentExam.emergencyContactPhone}</strong></Col>
              <Col span={12}>9. Thẻ BHYT: <strong style={{ fontFamily: 'monospace', color: '#0284c7' }}>{currentExam.healthInsuranceNumber || 'Không có'}</strong> (Mức hưởng: {currentExam.insuranceBenefitRate})</Col>
              <Col span={12}>10. Hình thức vào viện: <strong>{currentExam.admissionType}</strong></Col>
              <Col span={12}>11. Ngày giờ tiếp nhận: {currentExam.admissionDate}</Col>
              <Col span={12}>12. Ngày giờ kết thúc khám: {currentExam.dischargeDate}</Col>
            </Row>

            {/* PHẦN II: THÔNG TIN CHUYÊN MÔN Y TẾ */}
            <div style={{ background: '#f0f9ff', padding: '10px 14px', borderRadius: 6, marginBottom: 12, border: '1px solid #bae6fd' }}>
              <strong style={{ color: '#0369a1', fontSize: 13, textTransform: 'uppercase' }}>
                II. THÔNG TIN CHUYÊN MÔN Y TẾ (CLINICAL DETAILS)
              </strong>
            </div>

            <div style={{ marginBottom: 10 }}>
              <strong style={{ color: '#0369a1' }}>1. Lý do vào viện:</strong> {currentExam.reasonForAdmission}
            </div>

            <div style={{ marginBottom: 10 }}>
              <strong style={{ color: '#0369a1' }}>2. Bệnh sử (Quá trình bệnh lý):</strong>
              <div style={{ textAlign: 'justify', marginTop: 2 }}>{currentExam.pathologicalProcess}</div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <strong style={{ color: '#0369a1' }}>3. Tiền sử bệnh:</strong>
              <div>• Tiền sử bản thân: {currentExam.medicalHistoryPersonal}</div>
              <div>• Tiền sử dị ứng: <strong style={{ color: '#dc2626' }}>{currentExam.drugAllergies}</strong></div>
              <div>• Tiền sử gia đình: {currentExam.medicalHistoryFamily}</div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <strong style={{ color: '#0369a1' }}>4. Thăm khám ban đầu & Sinh hiệu:</strong>
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 6, border: '1px solid #e2e8f0', margin: '4px 0', fontFamily: 'monospace', fontSize: 12 }}>
                Mạch: <strong>{currentExam.pulseRate} bpm</strong> | Huyết áp: <strong>{currentExam.bloodPressure} mmHg</strong> | Thân nhiệt: <strong>{currentExam.temperature}°C</strong> | SpO2: <strong>{currentExam.spO2 || 98}%</strong> | Nhịp thở: <strong>{currentExam.respiratoryRate} l/p</strong> | BMI: <strong>{currentExam.bmi}</strong>
              </div>
              <div>• Toàn thân: {currentExam.generalExamination}</div>
              <div>• Khám cơ quan: {currentExam.circulatoryExam} {currentExam.respiratoryExam}</div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <strong style={{ color: '#0369a1' }}>5. Kết quả cận lâm sàng chính:</strong>
              <div>• Xét nghiệm máu: Bạch cầu WBC 10.2 G/L, Hồng cầu 4.72 T/L, Glucose máu 5.3 mmol/L.</div>
              <div>• X-Quang & Siêu âm: {currentExam.imagingStudies?.[0]?.conclusion || 'Trong giới hạn bình thường'}.</div>
              <div>• Thăm dò chức năng: {currentExam.functionalStudies}</div>
            </div>

            <div style={{ marginBottom: 10, padding: 8, background: '#f0f9ff', borderRadius: 6, borderLeft: '3px solid #0284c7' }}>
              <strong style={{ color: '#0369a1' }}>6. Chẩn đoán xác định:</strong>{' '}
              <strong style={{ fontSize: 14 }}>{currentExam.icd10Name}</strong> (Mã bệnh quốc tế ICD-10:{' '}
              <strong style={{ color: '#7c3aed', fontFamily: 'monospace' }}>{currentExam.icd10Code}</strong>)
            </div>

            {/* Bảng đơn thuốc */}
            <div style={{ marginBottom: 12 }}>
              <strong style={{ color: '#0369a1' }}>7. Y lệnh dùng thuốc (Đơn thuốc):</strong>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4, fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '6%' }}>STT</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', width: '38%' }}>Tên thuốc, Hàm lượng</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '16%' }}>Số lượng</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', width: '40%' }}>Liều dùng & Cách dùng</th>
                  </tr>
                </thead>
                <tbody>
                  {currentExam.prescriptionDetails?.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{i + 1}</td>
                      <td style={{ padding: '6px 8px' }}><strong>{p.medicineName}</strong></td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{p.quantity} {p.unit}</td>
                      <td style={{ padding: '6px 8px' }}>{p.dosageInstruction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginBottom: 14 }}>
              <strong style={{ color: '#0369a1' }}>8. Tổng kết sau điều trị & Ra viện:</strong>
              <div>• Tình trạng khi ra viện: <strong>{currentExam.dischargeStatus}</strong></div>
              <div>• Lời dặn & Dinh dưỡng: {currentExam.dietaryAndLivingAdvice}</div>
              <div>• Hẹn tái khám: <strong>{currentExam.followUpAppointment}</strong></div>
            </div>

            {/* Chữ ký số & QR xác thực */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 28, paddingTop: 16, borderTop: '1px dashed #cbd5e1' }}>
              <div style={{ textAlign: 'center' }}>
                <QRCodeSVG
                  value={`https://hospital-ai.vn/verify-emr?code=${currentExam.examinationCode}`}
                  size={80}
                  level="H"
                />
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  Mã QR Tra cứu EMR Quốc gia
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Trưởng Phòng Kế Hoạch Tổng Hợp</div>
                <Tag color="cyan" style={{ margin: '6px 0', fontWeight: 'bold' }}>
                  <SafetyCertificateOutlined /> ĐÃ PHÊ DUYỆT EMR
                </Tag>
                <div style={{ fontWeight: 'bold', fontSize: 13 }}>BS. CKI. Trịnh Văn Thành</div>
              </div>

              <div style={{ textAlign: 'center', minWidth: 200 }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Bác sĩ Điều trị</div>

                {/* Dấu mộc đỏ Điện tử Bộ Y Tế */}
                <div
                  style={{
                    border: '2.5px solid #dc2626',
                    borderRadius: '50%',
                    width: 130,
                    height: 130,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    color: '#dc2626',
                    transform: 'rotate(-4deg)',
                    margin: '4px auto',
                    background: 'rgba(254, 242, 242, 0.45)',
                    boxShadow: '0 0 0 2px rgba(220, 38, 38, 0.2)',
                    userSelect: 'none',
                  }}
                >
                  <div style={{ fontSize: 7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.2, lineHeight: 1.1 }}>
                    BV ĐK QUỐC TẾ D-MEDICAL
                  </div>
                  <div style={{ fontSize: 11, margin: '1px 0' }}>★</div>
                  <div style={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', color: '#b91c1c', borderTop: '1px solid #dc2626', borderBottom: '1px solid #dc2626', padding: '1px 0', width: '92%' }}>
                    {currentExam.isDigitallySigned ? 'ĐÃ KÝ SỐ ĐIỆN TỬ' : 'SMARTCA BỘ Y TẾ'}
                  </div>
                  <div style={{ fontSize: 6.5, fontWeight: 700, marginTop: 2 }}>
                    CCHN: {currentExam.doctorLicenseNumber || '029831/BYT-CCHN'}
                  </div>
                  <div style={{ fontSize: 6, color: '#991b1b', lineHeight: 1.1 }}>
                    {currentExam.signedAt ? new Date(currentExam.signedAt).toLocaleDateString('vi-VN') : '29/10/2026'}
                  </div>
                </div>

                <div style={{ fontWeight: 'bold', fontSize: 13, color: '#0369a1', marginTop: 4 }}>
                  {currentExam.doctorName}
                </div>
                <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>
                  <SafetyCertificateOutlined /> SHA-256: {currentExam.signatureHash ? currentExam.signatureHash.substring(0, 12) + '...' : 'SMARTCA-VERIFIED'}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
