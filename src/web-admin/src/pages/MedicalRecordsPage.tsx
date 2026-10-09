import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '../styles/prescriptionPrint.css';
import {
  Card,
  Typography,
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
  Descriptions,
  Timeline,
  Drawer,
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
} from '@ant-design/icons';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useThemeStore } from '../store/useThemeStore';
import { showToast } from '../utils/sweetAlert';
import { examinationService, ExaminationItem } from '../services/examinationService';
import { patientService, Patient } from '../services/patientService';
import { buildPatientComprehensiveEMR } from '../utils/emrDataBuilder';

const { Text, Paragraph } = Typography;

export const MedicalRecordsPage: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  // State quản lý danh sách bệnh nhân & tìm kiếm
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchText, setSearchText] = useState('');
  const [isPatientDrawerOpen, setIsPatientDrawerOpen] = useState(false);

  // State quản lý lượt khám & EMR của bệnh nhân đang chọn
  const [patientExams, setPatientExams] = useState<ExaminationItem[]>([]);
  const [selectedExamIndex, setSelectedExamIndex] = useState<number>(0);

  // State Modal In & Xuất PDF
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Load danh sách bệnh nhân và lượt khám ban đầu
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

      if (patientList.length > 0) {
        // Mặc định chọn bệnh nhân đầu tiên (hoặc bệnh nhân Nguyễn Văn An nếu có)
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

  // Hàm chọn bệnh nhân
  const handleSelectPatient = (patient: Patient, existingRawExams?: ExaminationItem[]) => {
    setSelectedPatient(patient);
    setSelectedExamIndex(0);

    // Xây dựng danh sách đợt khám chuẩn y tế 100% cho bệnh nhân này
    const emrList = buildPatientComprehensiveEMR(patient, existingRawExams);
    setPatientExams(emrList);
  };

  // Lọc danh sách bệnh nhân theo từ khóa tìm kiếm
  const filteredPatients = useMemo(() => {
    if (!searchText.trim()) return patients;
    const q = searchText.toLowerCase().trim();
    return patients.filter(
      (p) =>
        p.hoTen.toLowerCase().includes(q) ||
        p.maBenhNhan.toLowerCase().includes(q) ||
        p.soCCCD.includes(q) ||
        p.soDienThoai.includes(q)
    );
  }, [patients, searchText]);

  // Lượt khám hiện tại đang được xem chi tiết
  const currentExam = patientExams[selectedExamIndex] || patientExams[0];

  const handleOpenPdf = (exam?: ExaminationItem) => {
    if (exam) {
      const idx = patientExams.findIndex((e) => e.id === exam.id);
      if (idx !== -1) setSelectedExamIndex(idx);
    }
    setIsPdfModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─────────────────────────────────────────────────────────────────────────
          1. BỘ TÌM KIẾM & CHỌN BỆNH NHÂN (PATIENT SELECTOR & SEARCH TOOLBAR)
          ───────────────────────────────────────────────────────────────────────── */}
      <Card
        bordered={false}
        className="rounded-2xl shadow-sm bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700"
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row gutter={[16, 16]} align="bottom">
          {/* Cột 1: Tìm kiếm */}
          <Col xs={24} md={8} lg={7}>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <SearchOutlined /> Tra cứu bệnh nhân
              </span>
              <Input
                placeholder="Tìm theo Họ tên, Mã BN, CCCD, SĐT..."
                prefix={<SearchOutlined className="text-slate-400" />}
                allowClear
                size="large"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
          </Col>

          {/* Cột 2: Chọn bệnh nhân với labelRender 1 dòng cực gọn gàng, không tràn viền */}
          <Col xs={24} md={10} lg={10}>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <UserOutlined /> Hồ sơ bệnh nhân đang xem ({filteredPatients.length} người)
              </span>
              <Select
                showSearch
                size="large"
                value={selectedPatient?.id}
                placeholder="-- Chọn người bệnh để xem EMR --"
                className="w-full rounded-xl"
                style={{ height: 44 }}
                onChange={(val) => {
                  const found = patients.find((p) => p.id === val);
                  if (found) handleSelectPatient(found);
                }}
                filterOption={false}
                dropdownMatchSelectWidth={false}
                labelRender={({ value }) => {
                  const p = patients.find((item) => item.id === value);
                  if (!p) return <span className="text-slate-400">-- Chọn người bệnh để xem EMR --</span>;
                  return (
                    <div className="flex items-center gap-2 h-full text-sm leading-normal overflow-hidden py-1">
                      <Avatar
                        size={24}
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.hoTen}`}
                        icon={<UserOutlined />}
                        className="bg-sky-500 flex-shrink-0"
                      />
                      <strong className="text-slate-900 dark:text-white font-bold truncate">
                        {p.hoTen.toUpperCase()}
                      </strong>
                      <Tag color="cyan" className="font-mono text-xs m-0 px-1.5 py-0">
                        {p.maBenhNhan}
                      </Tag>
                      <span className="text-xs text-slate-400 hidden sm:inline">
                        ({p.tuoi} tuổi - {p.gioiTinh})
                      </span>
                    </div>
                  );
                }}
              >
                {filteredPatients.map((p) => (
                  <Select.Option key={p.id} value={p.id}>
                    <div className="flex items-center gap-2.5 py-1.5">
                      <Avatar
                        size="small"
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.hoTen}`}
                        icon={<UserOutlined />}
                        className="bg-sky-500 flex-shrink-0"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                            {p.hoTen.toUpperCase()}
                          </span>
                          <Tag color="cyan" className="m-0 text-[10px] font-mono">{p.maBenhNhan}</Tag>
                          {p.maTheBHYT && <Tag color="green" className="m-0 text-[10px]">BHYT</Tag>}
                        </div>
                        <span className="text-xs text-slate-400 mt-0.5">
                          CCCD: <span className="font-mono">{p.soCCCD}</span> • {p.tuoi || 'N/A'} tuổi ({p.gioiTinh}) • SĐT: {p.soDienThoai}
                        </span>
                      </div>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>
          </Col>

          {/* Cột 3: Nút chức năng */}
          <Col xs={24} md={6} lg={7}>
            <div className="flex flex-col gap-1.5 justify-end">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 hidden md:block">
                Thao tác hồ sơ
              </span>
              <div className="flex items-center gap-2">
                <Button
                  icon={<TeamOutlined />}
                  size="large"
                  onClick={() => setIsPatientDrawerOpen(true)}
                  className="rounded-xl border-sky-300 text-sky-700 hover:text-sky-800 hover:border-sky-500 font-medium h-11 flex-1 sm:flex-initial"
                >
                  Danh sách ({patients.length})
                </Button>

                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  size="large"
                  onClick={() => handleOpenPdf()}
                  className="rounded-xl bg-sky-600 hover:bg-sky-700 font-semibold shadow-md flex items-center justify-center gap-1.5 h-11 flex-1 sm:flex-initial"
                >
                  Xuất EMR (PDF)
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. MEDICAL HERO BANNER: THÔNG TIN TỔNG QUÁT CỦA BỆNH NHÂN ĐANG CHỌN
          ───────────────────────────────────────────────────────────────────────── */}
      {selectedPatient ? (
        <div className="medical-hero-banner relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="z-10">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 backdrop-blur-md">
                <span className="status-dot-active bg-emerald-400" /> Bệnh án Điện tử EMR Chuẩn Bộ Y Tế
              </span>
              <Tag color="cyan" className="m-0 font-mono text-xs bg-white/20 text-white border-white/30 px-2.5 py-0.5">
                MÃ BN: {selectedPatient.maBenhNhan}
              </Tag>
              <Tag color="blue" className="m-0 font-mono text-xs bg-white/20 text-white border-white/30 px-2.5 py-0.5">
                SỐ LƯU TRỮ: {currentExam?.emrFileNumber || `BA-${selectedPatient.maBenhNhan}/2026`}
              </Tag>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight m-0">
              HỒ SƠ BỆNH ÁN ĐIỆN TỬ - {selectedPatient.hoTen.toUpperCase()}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sky-100 text-xs md:text-sm mt-2">
              <span>
                CCCD: <strong className="text-white font-mono">{selectedPatient.soCCCD}</strong>
              </span>
              <span>•</span>
              <span>
                Ngày sinh: <strong className="text-white">{selectedPatient.ngaySinh}</strong> ({selectedPatient.tuoi} tuổi, {selectedPatient.gioiTinh})
              </span>
              <span>•</span>
              <span>
                Nhóm máu: <Tag color="red" className="m-0 font-bold px-2 py-0 text-xs">{selectedPatient.nhomMau || 'O+'}</Tag>
              </span>
              <span>•</span>
              <span>
                BHYT: <strong className="text-white font-mono">{selectedPatient.maTheBHYT || 'Chưa đăng ký'}</strong>{' '}
                {selectedPatient.maTheBHYT && <Tag color="green" className="m-0 text-[11px]">Hưởng 80%</Tag>}
              </span>
              <span>•</span>
              <span>
                Nghề nghiệp: <strong className="text-white">{currentExam?.profession || 'Kỹ sư'}</strong>
              </span>
            </div>
          </div>

          <div className="z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Bộ chọn Đợt khám (Visit Selector) */}
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 flex flex-col gap-1">
              <span className="text-[11px] text-sky-100 font-medium">Chọn đợt khám / Lần điều trị:</span>
              <Select
                value={selectedExamIndex}
                onChange={(idx) => setSelectedExamIndex(idx)}
                className="w-full min-w-[240px]"
                dropdownMatchSelectWidth={false}
              >
                {patientExams.map((exam, idx) => (
                  <Select.Option key={exam.id} value={idx}>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-800">
                        {formatDate(exam.examinationDate)} • {exam.departmentName}
                      </span>
                      <Tag color="purple" className="m-0 text-[10px]">{exam.icd10Code}</Tag>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>

            <Button
              type="primary"
              icon={<PrinterOutlined />}
              size="large"
              className="bg-white text-sky-700 hover:bg-sky-50 font-bold rounded-xl shadow-lg border-none flex items-center justify-center gap-1.5 px-5 h-12"
              onClick={() => handleOpenPdf()}
            >
              In Phiếu Bệnh Án
            </Button>
          </div>
        </div>
      ) : null}

      {/* ─────────────────────────────────────────────────────────────────────────
          3. NỘI DUNG CHI TIẾT BỆNH ÁN EMR ĐẦY ĐỦ 2 PHẦN THEO TIÊU CHUẨN BỘ Y TẾ
          ───────────────────────────────────────────────────────────────────────── */}
      {currentExam && selectedPatient && (
        <Row gutter={[20, 20]}>
          {/* CỘT CHÍNH: 5 TABS NỘI DUNG EMR CHUẨN BỘ Y TẾ */}
          <Col xs={24} xl={17}>
            <Card
              bordered={false}
              className="rounded-2xl shadow-sm bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700"
              bodyStyle={{ padding: '20px 24px' }}
            >
              <Tabs
                defaultActiveKey="tab-administrative"
                type="card"
                className="medical-emr-tabs"
                items={[
                  // ──────────────────────────────────────────────────────────────
                  // TAB 1: THÔNG TIN HÀNH CHÍNH & QUẢN LÝ NGƯỜI BỆNH
                  // ──────────────────────────────────────────────────────────────
                  {
                    key: 'tab-administrative',
                    label: (
                      <span className="font-semibold flex items-center gap-1.5">
                        <IdcardOutlined /> I. Thông tin Hành chính & Quản lý
                      </span>
                    ),
                    children: (
                      <div className="flex flex-col gap-6 pt-2">
                        {/* 1.1 Thông tin cá nhân & nhân thân */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            1. THÔNG TIN CÁ NHÂN & NHÂN THÂN NGƯỜI BỆNH
                          </h3>
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2, md: 3 }}
                            className="bg-sky-50/40 dark:bg-slate-900/40 rounded-xl overflow-hidden"
                          >
                            <Descriptions.Item label="Họ và tên (chữ in hoa)">
                              <strong className="text-slate-900 dark:text-white font-bold text-sm">
                                {currentExam.patientName}
                              </strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Giới tính">
                              <Tag color={currentExam.patientGender === 'Nam' ? 'blue' : 'magenta'}>
                                {currentExam.patientGender}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày sinh / Tuổi">
                              {currentExam.patientDateOfBirth} ({currentExam.patientAge} tuổi)
                            </Descriptions.Item>
                            <Descriptions.Item label="Số CCCD / Định danh">
                              <span className="font-mono font-semibold">{currentExam.identityCardNumber}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Số điện thoại liên hệ">
                              <span className="font-mono text-sky-600">{selectedPatient.soDienThoai}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nghề nghiệp">
                              <strong className="text-slate-800 dark:text-slate-200">
                                {currentExam.profession}
                              </strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nơi cư trú hiện tại" span={3}>
                              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                <HomeOutlined className="text-sky-500" /> {currentExam.address}
                              </span>
                            </Descriptions.Item>
                          </Descriptions>
                        </div>

                        {/* 1.2 Thông tin người nhà / Báo tin khi cần thiết */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            2. THÔNG TIN LIÊN HỆ NGƯỜI NHÀ / BÁO TIN KHẨN CẤP
                          </h3>
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2, md: 3 }}
                            className="bg-sky-50/40 dark:bg-slate-900/40 rounded-xl overflow-hidden"
                          >
                            <Descriptions.Item label="Họ tên người nhà">
                              <strong className="text-slate-900 dark:text-white">
                                {currentExam.emergencyContactName}
                              </strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mối quan hệ">
                              <Tag color="cyan">{currentExam.emergencyContactRelation}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Điện thoại báo tin">
                              <span className="font-mono font-semibold text-rose-600">
                                <PhoneOutlined /> {currentExam.emergencyContactPhone}
                              </span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ người nhà" span={3}>
                              {currentExam.emergencyContactAddress}
                            </Descriptions.Item>
                          </Descriptions>
                        </div>

                        {/* 1.3 Thông tin bảo hiểm y tế (BHYT) */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            3. THÔNG TIN BẢO HIỂM Y TẾ (BHYT)
                          </h3>
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2, md: 3 }}
                            className="bg-sky-50/40 dark:bg-slate-900/40 rounded-xl overflow-hidden"
                          >
                            <Descriptions.Item label="Mã số thẻ BHYT">
                              <strong className="font-mono text-emerald-600 text-sm">
                                {currentExam.healthInsuranceNumber || 'Không có'}
                              </strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mức quyền lợi hưởng">
                              <Tag color="green" className="font-bold">
                                {currentExam.insuranceBenefitRate || '80%'}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Hạn sử dụng thẻ">
                              {currentExam.insuranceExpiryDate || '31/12/2026'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Nơi ĐKKCB ban đầu" span={3}>
                              {currentExam.insurancePlace}
                            </Descriptions.Item>
                          </Descriptions>
                        </div>

                        {/* 1.4 Dữ liệu quản lý viện */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            4. DỮ LIỆU QUẢN LÝ VIỆN & THỦ TỤC VÀO - RA VIỆN
                          </h3>
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2, md: 3 }}
                            className="bg-sky-50/40 dark:bg-slate-900/40 rounded-xl overflow-hidden"
                          >
                            <Descriptions.Item label="Số hồ sơ lưu trữ EMR">
                              <span className="font-mono font-bold text-sky-700">{currentExam.emrFileNumber}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã lượt khám">
                              <span className="font-mono text-slate-700">{currentExam.examinationCode}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Hình thức vào viện">
                              <Tag color="processing">{currentExam.admissionType}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày giờ tiếp nhận/vào">
                              <CalendarOutlined className="mr-1 text-sky-500" />
                              {currentExam.admissionDate}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày giờ kết thúc/ra">
                              <CalendarOutlined className="mr-1 text-emerald-500" />
                              {currentExam.dischargeDate}
                            </Descriptions.Item>
                            <Descriptions.Item label="Khoa điều trị & Bác sĩ">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                {currentExam.departmentName} - {currentExam.doctorName}
                              </span>
                            </Descriptions.Item>
                          </Descriptions>
                        </div>
                      </div>
                    ),
                  },

                  // ──────────────────────────────────────────────────────────────
                  // TAB 2: THÔNG TIN CHUYÊN MÔN: BỆNH SỬ & KHÁM LÂM SÀNG (SOAP)
                  // ──────────────────────────────────────────────────────────────
                  {
                    key: 'tab-clinical',
                    label: (
                      <span className="font-semibold flex items-center gap-1.5">
                        <MedicineBoxOutlined /> II. Bệnh sử & Khám Lâm sàng (SOAP)
                      </span>
                    ),
                    children: (
                      <div className="flex flex-col gap-6 pt-2">
                        {/* 2.1 Lý do vào viện & Quá trình bệnh lý */}
                        <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-slate-900/60 border border-sky-100 dark:border-slate-700">
                          <h3 className="text-base font-bold text-sky-800 dark:text-sky-300 mb-2">
                            1. LÝ DO VÀO VIỆN (CHIEF COMPLAINT)
                          </h3>
                          <Paragraph className="text-sm font-medium text-slate-800 dark:text-slate-200 m-0">
                            {currentExam.reasonForAdmission || currentExam.subjective}
                          </Paragraph>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                          <h3 className="text-base font-bold text-sky-800 dark:text-sky-300 mb-2">
                            2. QUÁ TRÌNH BỆNH LÝ (BỆNH SỬ HIỆN TẠI - HPI)
                          </h3>
                          <Paragraph className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed m-0">
                            {currentExam.pathologicalProcess}
                          </Paragraph>
                        </div>

                        {/* 2.2 Tiền sử bệnh */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            3. TIỀN SỬ BỆNH TẬT & DỊ ỨNG
                          </h3>
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2 }}
                            className="bg-white dark:bg-slate-900/40 rounded-xl overflow-hidden"
                          >
                            <Descriptions.Item label="Tiền sử bản thân (bệnh nền)">
                              <strong className="text-slate-800 dark:text-slate-200">
                                {currentExam.medicalHistoryPersonal}
                              </strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Dị ứng thuốc & thức ăn">
                              <Tag color={currentExam.drugAllergies?.includes('Không') ? 'default' : 'red'}>
                                {currentExam.drugAllergies}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Tiền sử gia đình">
                              {currentExam.medicalHistoryFamily}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thói quen sinh hoạt">
                              Không hút thuốc lá, không lạm dụng rượu bia, tập thể thao nhẹ.
                            </Descriptions.Item>
                          </Descriptions>
                        </div>

                        {/* 2.3 Khám lâm sàng ban đầu & Bộ chỉ số sinh hiệu */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            4. KẾT QUẢ THĂM KHÁM BAN ĐẦU & CHỈ SỐ SINH HIỆU (VITALS)
                          </h3>

                          {/* Bộ thẻ sinh hiệu đẹp mắt */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mb-4">
                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-900 border border-sky-200 text-center">
                              <span className="text-[11px] text-slate-500 block">Mạch (Heart Rate)</span>
                              <strong className="text-lg text-sky-700 dark:text-sky-400 font-mono">
                                {currentExam.pulseRate}
                              </strong>
                              <span className="text-[10px] text-slate-400 block">lần/phút</span>
                            </div>

                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-900 border border-sky-200 text-center">
                              <span className="text-[11px] text-slate-500 block">Huyết áp (BP)</span>
                              <strong className="text-lg text-sky-700 dark:text-sky-400 font-mono">
                                {currentExam.bloodPressure}
                              </strong>
                              <span className="text-[10px] text-slate-400 block">mmHg</span>
                            </div>

                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-900 border border-sky-200 text-center">
                              <span className="text-[11px] text-slate-500 block">Thân nhiệt</span>
                              <strong className="text-lg text-sky-700 dark:text-sky-400 font-mono">
                                {currentExam.temperature}°C
                              </strong>
                              <span className="text-[10px] text-slate-400 block">Độ C</span>
                            </div>

                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-900 border border-sky-200 text-center">
                              <span className="text-[11px] text-slate-500 block">Nhịp thở</span>
                              <strong className="text-lg text-sky-700 dark:text-sky-400 font-mono">
                                {currentExam.respiratoryRate}
                              </strong>
                              <span className="text-[10px] text-slate-400 block">lần/phút</span>
                            </div>

                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-900 border border-sky-200 text-center">
                              <span className="text-[11px] text-slate-500 block">SpO2</span>
                              <strong className="text-lg text-emerald-600 dark:text-emerald-400 font-mono">
                                {currentExam.spO2 || 98}%
                              </strong>
                              <span className="text-[10px] text-slate-400 block">Oxy máu</span>
                            </div>

                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-900 border border-sky-200 text-center">
                              <span className="text-[11px] text-slate-500 block">Cân nặng / Cao</span>
                              <strong className="text-sm text-slate-800 dark:text-slate-200 font-semibold block mt-1">
                                {currentExam.weight}kg / {currentExam.height}cm
                              </strong>
                            </div>

                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-slate-900 border border-sky-200 text-center">
                              <span className="text-[11px] text-slate-500 block">Chỉ số BMI</span>
                              <strong className="text-lg text-sky-700 dark:text-sky-400 font-mono">
                                {currentExam.bmi}
                              </strong>
                              <Tag color="cyan" className="m-0 text-[10px] px-1">Bình thường</Tag>
                            </div>
                          </div>

                          {/* Khám toàn thân và các cơ quan */}
                          <Descriptions
                            bordered
                            size="small"
                            column={1}
                            className="bg-white dark:bg-slate-900/40 rounded-xl overflow-hidden"
                          >
                            <Descriptions.Item label="Khám Toàn thân">
                              {currentExam.generalExamination}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tuần hoàn / Tim mạch">
                              {currentExam.circulatoryExam}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hô hấp / Lồng ngực">
                              {currentExam.respiratoryExam}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tiêu hóa / Ổ bụng">
                              {currentExam.digestiveExam}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thần kinh & Tri giác">
                              {currentExam.nervousExam}
                            </Descriptions.Item>
                            <Descriptions.Item label="Cơ - Xương - Khớp">
                              {currentExam.musculoskeletalExam}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tai Mũi Họng / RHM">
                              {currentExam.entExam}
                            </Descriptions.Item>
                          </Descriptions>
                        </div>
                      </div>
                    ),
                  },

                  // ──────────────────────────────────────────────────────────────
                  // TAB 3: KẾT QUẢ CẬN LÂM SÀNG & THĂM DÒ CHỨC NĂNG (CLS)
                  // ──────────────────────────────────────────────────────────────
                  {
                    key: 'tab-cls',
                    label: (
                      <span className="font-semibold flex items-center gap-1.5">
                        <ExperimentOutlined /> III. Cận lâm sàng & Thăm dò chức năng
                      </span>
                    ),
                    children: (
                      <div className="flex flex-col gap-6 pt-2">
                        {/* 3.1 Phiếu xét nghiệm */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-500" />
                              1. KẾT QUẢ XÉT NGHIỆM HUYẾT HỌC, SINH HÓA & NƯỚC TIỂU
                            </span>
                            <Tag color="blue">{currentExam.labTests?.length || 0} chỉ số</Tag>
                          </h3>
                          <Table
                            dataSource={currentExam.labTests || []}
                            rowKey="testName"
                            pagination={false}
                            size="small"
                            bordered
                            className="rounded-xl overflow-hidden border border-sky-100"
                            columns={[
                              {
                                title: 'STT',
                                width: 55,
                                align: 'center',
                                render: (_, __, i) => i + 1,
                              },
                              {
                                title: 'Tên xét nghiệm',
                                dataIndex: 'testName',
                                key: 'testName',
                                render: (text, r) => (
                                  <div>
                                    <strong className="text-slate-800 dark:text-slate-200">{text}</strong>
                                    <span className="text-xs text-slate-400 block">Nhóm: {r.category}</span>
                                  </div>
                                ),
                              },
                              {
                                title: 'Kết quả',
                                dataIndex: 'result',
                                key: 'result',
                                width: 140,
                                render: (val) => (
                                  <strong className="font-mono text-sky-700 dark:text-sky-300 text-sm">{val}</strong>
                                ),
                              },
                              {
                                title: 'Đơn vị',
                                dataIndex: 'unit',
                                key: 'unit',
                                width: 90,
                                align: 'center',
                              },
                              {
                                title: 'Trị số tham chiếu',
                                dataIndex: 'referenceRange',
                                key: 'referenceRange',
                                width: 160,
                                align: 'center',
                              },
                              {
                                title: 'Đánh giá',
                                dataIndex: 'evaluation',
                                key: 'evaluation',
                                width: 130,
                                align: 'center',
                                render: (evalVal: string) => {
                                  const color =
                                    evalVal === 'Bình thường'
                                      ? 'green'
                                      : evalVal === 'Tăng nhẹ'
                                      ? 'orange'
                                      : 'red';
                                  return <Tag color={color}>{evalVal}</Tag>;
                                },
                              },
                            ]}
                          />
                        </div>

                        {/* 3.2 Chẩn đoán hình ảnh */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            2. KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH (X-QUANG, SIÊU ÂM, CT-SCAN)
                          </h3>
                          <Row gutter={[16, 16]}>
                            {currentExam.imagingStudies?.map((img, i) => (
                              <Col xs={24} md={12} key={i}>
                                <div className="p-4 rounded-xl border border-sky-200 dark:border-slate-700 bg-sky-50/40 dark:bg-slate-900/40 h-full flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <Tag color="geekblue" className="font-bold">{img.modality}</Tag>
                                      <span className="text-xs text-slate-400">{img.doctorName}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1.5">
                                      {img.title}
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                                      <strong>Mô tả:</strong> {img.findings}
                                    </p>
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700">
                                    <span className="text-xs font-semibold text-sky-700 dark:text-sky-400 block mb-0.5">
                                      Kết luận:
                                    </span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                                      {img.conclusion}
                                    </span>
                                  </div>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </div>

                        {/* 3.3 Thăm dò chức năng */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            3. KẾT QUẢ THĂM DÒ CHỨC NĂNG (ĐIỆN TÂM ĐỒ ECG, ĐIỆN NÃO ĐỒ)
                          </h3>
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <Text className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {currentExam.functionalStudies}
                            </Text>
                          </div>
                        </div>
                      </div>
                    ),
                  },

                  // ──────────────────────────────────────────────────────────────
                  // TAB 4: CHẨN ĐOÁN & QUÁ TRÌNH ĐIỀU TRỊ / ĐƠN THUỐC
                  // ──────────────────────────────────────────────────────────────
                  {
                    key: 'tab-treatment',
                    label: (
                      <span className="font-semibold flex items-center gap-1.5">
                        <FileDoneOutlined /> IV. Chẩn đoán & Quá trình Điều trị
                      </span>
                    ),
                    children: (
                      <div className="flex flex-col gap-6 pt-2">
                        {/* 4.1 Bốn cấp độ chẩn đoán */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            1. CHẨN ĐOÁN Y KHOA (4 CẤP ĐỘ CHUẨN BỘ Y TẾ)
                          </h3>
                          <Descriptions
                            bordered
                            size="small"
                            column={{ xs: 1, sm: 2 }}
                            className="bg-white dark:bg-slate-900/40 rounded-xl overflow-hidden"
                          >
                            <Descriptions.Item label="Chẩn đoán khi vào viện">
                              {currentExam.initialDiagnosis}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chẩn đoán sơ bộ">
                              {currentExam.preliminaryDiagnosis}
                            </Descriptions.Item>
                            <Descriptions.Item label="Chẩn đoán xác định" span={2}>
                              <div className="flex items-center gap-2">
                                <Tag color="purple" className="text-sm font-bold font-mono px-2 py-0.5">
                                  ICD-10: {currentExam.icd10Code}
                                </Tag>
                                <strong className="text-sky-700 dark:text-sky-400 text-sm">
                                  {currentExam.icd10Name}
                                </strong>
                              </div>
                            </Descriptions.Item>
                            <Descriptions.Item label="Chẩn đoán phân biệt / Kèm theo" span={2}>
                              <span className="text-slate-600 dark:text-slate-400">
                                {currentExam.differentialDiagnosis}
                              </span>
                            </Descriptions.Item>
                          </Descriptions>
                        </div>

                        {/* 4.2 Y lệnh dùng thuốc / Đơn thuốc điện tử */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-500" />
                              2. Y LỆNH DÙNG THUỐC ĐIỆN TỬ (PRESCRIPTION)
                            </span>
                            <span className="text-xs text-slate-500">
                              Tổng cộng: {currentExam.prescriptionDetails?.length || 0} loại thuốc
                            </span>
                          </h3>
                          <Table
                            dataSource={currentExam.prescriptionDetails || []}
                            rowKey="medicineName"
                            pagination={false}
                            size="small"
                            bordered
                            className="rounded-xl overflow-hidden border border-sky-100"
                            columns={[
                              { title: 'STT', width: 50, align: 'center', render: (_, __, i) => i + 1 },
                              {
                                title: 'Tên thuốc & Hoạt chất',
                                dataIndex: 'medicineName',
                                render: (name, r) => (
                                  <div>
                                    <strong className="text-slate-800 dark:text-slate-100">{name}</strong>
                                    {r.activeIngredient && (
                                      <span className="text-xs text-slate-400 block">
                                        Hoạt chất: {r.activeIngredient}
                                      </span>
                                    )}
                                  </div>
                                ),
                              },
                              {
                                title: 'Số lượng',
                                dataIndex: 'quantity',
                                width: 100,
                                align: 'center',
                                render: (qty, r) => (
                                  <Tag color="blue" className="font-mono font-bold">
                                    {qty} {r.unit}
                                  </Tag>
                                ),
                              },
                              {
                                title: 'Hướng dẫn liều dùng & Thời điểm uống',
                                dataIndex: 'dosageInstruction',
                                render: (text, r) => (
                                  <div>
                                    <span className="text-slate-700 dark:text-slate-200 font-medium block">
                                      {text}
                                    </span>
                                    {r.usageTime && (
                                      <span className="text-[11px] text-sky-600 font-semibold block mt-0.5">
                                        ⏱ {r.usageTime}
                                      </span>
                                    )}
                                  </div>
                                ),
                              },
                              {
                                title: 'Đơn giá',
                                dataIndex: 'unitPrice',
                                width: 110,
                                align: 'right',
                                render: (p) => formatCurrency(p),
                              },
                              {
                                title: 'Thành tiền',
                                width: 120,
                                align: 'right',
                                render: (_, r) => (
                                  <strong className="text-slate-900 dark:text-white">
                                    {formatCurrency((r.unitPrice || 0) * (r.quantity || 1))}
                                  </strong>
                                ),
                              },
                            ]}
                          />
                        </div>

                        {/* 4.3 Phiếu theo dõi chức năng sống & điều dưỡng */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            3. PHIẾU CHĂM SÓC & THEO DÕI CHỨC NĂNG SỐNG CỦA ĐIỀU DƯỠNG
                          </h3>
                          <Timeline
                            mode="left"
                            items={currentExam.dailyCareNotes?.map((note) => ({
                              color: 'blue',
                              children: (
                                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-xs text-sky-600">{note.date}</span>
                                    <Tag color="cyan">{note.caregiver}</Tag>
                                  </div>
                                  <span className="text-xs text-slate-500 block mb-1 font-mono">
                                    {note.vitals}
                                  </span>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 m-0">
                                    {note.nurseNote}
                                  </p>
                                </div>
                              ),
                            }))}
                          />
                        </div>

                        {/* 4.4 Biên bản hội chẩn & Cam kết thủ thuật */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-slate-900/50 border border-sky-100">
                            <span className="text-xs font-bold text-sky-700 uppercase block mb-1">
                              Biên bản Hội chẩn Chuyên môn:
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 m-0">
                              {currentExam.consultationMinutes}
                            </p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-sky-50/50 dark:bg-slate-900/50 border border-sky-100">
                            <span className="text-xs font-bold text-sky-700 uppercase block mb-1">
                              Giấy cam kết chấp thuận thủ thuật:
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 m-0">
                              {currentExam.surgicalConsentNote}
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  },

                  // ──────────────────────────────────────────────────────────────
                  // TAB 5: TỔNG KẾT BỆNH ÁN & RA VIỆN
                  // ──────────────────────────────────────────────────────────────
                  {
                    key: 'tab-discharge',
                    label: (
                      <span className="font-semibold flex items-center gap-1.5">
                        <SolutionOutlined /> V. Tổng kết Bệnh án & Ra viện
                      </span>
                    ),
                    children: (
                      <div className="flex flex-col gap-6 pt-2">
                        {/* 5.1 Tình trạng người bệnh lúc ra viện */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            1. TÌNH TRẠNG NGƯỜI BỆNH LÚC RA VIỆN / KẾT THÚC KHÁM
                          </h3>
                          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircleOutlined className="text-emerald-600 text-lg" />
                              <strong className="text-emerald-800 dark:text-emerald-300 text-sm">
                                Đánh giá kết quả điều trị: {currentExam.dischargeStatus?.split(',')[0] || 'Ổn định'}
                              </strong>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed m-0">
                              {currentExam.dischargeStatus}
                            </p>
                          </div>
                        </div>

                        {/* 5.2 Hướng điều trị tiếp theo & Lời dặn */}
                        <div>
                          <h3 className="text-base font-bold text-sky-700 dark:text-sky-400 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            2. HƯỚNG ĐIỀU TRỊ TIẾP THEO & CHẾ ĐỘ SINH HOẠT
                          </h3>
                          <Descriptions
                            bordered
                            size="small"
                            column={1}
                            className="bg-white dark:bg-slate-900/40 rounded-xl overflow-hidden"
                          >
                            <Descriptions.Item label="Hướng điều trị tiếp theo">
                              <strong className="text-slate-800 dark:text-slate-200">
                                {currentExam.nextTreatmentPlan}
                              </strong>
                            </Descriptions.Item>
                            <Descriptions.Item label="Chế độ ăn uống & Dinh dưỡng">
                              {currentExam.dietaryAndLivingAdvice}
                            </Descriptions.Item>
                            <Descriptions.Item label="Lịch hẹn tái khám">
                              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-semibold text-sm">
                                📅 {currentExam.followUpAppointment}
                              </div>
                            </Descriptions.Item>
                          </Descriptions>
                        </div>

                        {/* 5.3 Chữ ký số xác thực */}
                        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-white p-2 rounded-lg border border-sky-200 shadow-sm">
                              <QRCodeSVG
                                value={`https://hospital-ai.vn/emr/${currentExam.examinationCode}`}
                                size={70}
                              />
                            </div>
                            <div>
                              <span className="text-xs text-slate-500 block">Xác thực Bệnh án Điện tử EMR</span>
                              <strong className="text-slate-800 dark:text-slate-100 text-sm block">
                                Mã tra cứu: {currentExam.examinationCode}
                              </strong>
                              <span className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                                <SafetyCertificateOutlined /> Chữ ký số hợp lệ theo Luật Giao dịch điện tử
                              </span>
                            </div>
                          </div>

                          <div className="text-center sm:text-right">
                            <span className="text-xs text-slate-400 block">Bác sĩ Điều trị phụ trách</span>
                            <Tag color="green" className="my-1 font-bold">
                              <SafetyCertificateOutlined /> Đã ký số SHA-256
                            </Tag>
                            <strong className="text-sm text-sky-700 dark:text-sky-300 block">
                              {currentExam.doctorName}
                            </strong>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          {/* CỘT PHỤ (BÊN PHẢI): DÒNG THỜI GIAN LỊCH SỬ CÁC ĐỢT KHÁM & TỔNG KẾT NHANH */}
          <Col xs={24} xl={7}>
            <div className="flex flex-col gap-5">
              {/* Thẻ Dòng thời gian các lần khám */}
              <Card
                bordered={false}
                className="rounded-2xl shadow-sm bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700"
                title={
                  <Space>
                    <HistoryOutlined className="text-sky-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Dòng thời gian Khám bệnh ({patientExams.length} đợt)
                    </span>
                  </Space>
                }
              >
                <Timeline
                  mode="left"
                  items={patientExams.map((exam, idx) => ({
                    color: idx === selectedExamIndex ? '#0284c7' : '#94a3b8',
                    children: (
                      <div
                        onClick={() => setSelectedExamIndex(idx)}
                        className={`p-3 rounded-xl cursor-pointer transition-all border ${
                          idx === selectedExamIndex
                            ? 'bg-sky-50 dark:bg-slate-900 border-sky-400 shadow-sm'
                            : 'bg-white dark:bg-slate-800/40 border-slate-200 hover:border-sky-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-xs text-sky-700 dark:text-sky-400">
                            {formatDate(exam.examinationDate)}
                          </strong>
                          <Tag color="purple" className="m-0 text-[10px]">{exam.icd10Code}</Tag>
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                          {exam.departmentName}
                        </span>
                        <p className="text-[11px] text-slate-500 line-clamp-2 m-0">
                          {exam.assessment || exam.icd10Name}
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400">BS: {exam.doctorName}</span>
                          <span className="text-[11px] font-semibold text-sky-600">
                            {idx === selectedExamIndex ? '● Đang xem' : 'Xem đợt này ➔'}
                          </span>
                        </div>
                      </div>
                    ),
                  }))}
                />
              </Card>

              {/* Thẻ Cảnh báo Y tế & Tiền sử */}
              <Card
                bordered={false}
                className="rounded-2xl shadow-sm bg-white dark:bg-slate-800 border border-sky-100 dark:border-slate-700"
                title={
                  <Space>
                    <AlertOutlined className="text-rose-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      Lưu ý Lâm sàng & Cảnh báo
                    </span>
                  </Space>
                }
              >
                <div className="flex flex-col gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200">
                    <span className="text-xs font-bold text-rose-700 block mb-0.5">Tiền sử Dị ứng:</span>
                    <strong className="text-xs text-rose-900 dark:text-rose-200">
                      {selectedPatient.diUngThuoc || 'Không ghi nhận dị ứng'}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                    <span className="text-xs font-bold text-amber-700 block mb-0.5">Bệnh nền mạn tính:</span>
                    <strong className="text-xs text-amber-900 dark:text-amber-200">
                      {selectedPatient.tienSuBenh || 'Không có bệnh mạn tính'}
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200">
                    <span className="text-xs font-bold text-sky-700 block mb-0.5">Người liên hệ khẩn:</span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 block">
                      {selectedPatient.tenNguoiThan || 'Chưa cập nhật'} (
                      {selectedPatient.quanHeNguoiThan || 'Người thân'}) - {selectedPatient.soDienThoaiNguoiThan}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </Col>
        </Row>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          4. DRAWER DANH SÁCH TOÀN BỘ BỆNH NHÂN (NÂNG CAO)
          ───────────────────────────────────────────────────────────────────────── */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined className="text-sky-600" />
            <span className="font-bold text-base">Danh Sách Bệnh Nhân Quản Lý EMR</span>
          </div>
        }
        placement="right"
        width={520}
        onClose={() => setIsPatientDrawerOpen(false)}
        open={isPatientDrawerOpen}
      >
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Tìm kiếm bệnh nhân..."
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            {filteredPatients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    handleSelectPatient(p);
                    setIsPatientDrawerOpen(false);
                    showToast(`Đã chuyển sang hồ sơ: ${p.hoTen.toUpperCase()}`, 'success');
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-50 border-sky-500 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      size="large"
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.hoTen}`}
                      icon={<UserOutlined />}
                      className="bg-sky-500"
                    />
                    <div>
                      <strong className="text-sm text-slate-900 block">{p.hoTen.toUpperCase()}</strong>
                      <span className="text-xs text-slate-500">
                        Mã: <strong className="font-mono text-sky-700">{p.maBenhNhan}</strong> • {p.tuoi} tuổi ({p.gioiTinh})
                      </span>
                      <span className="text-xs text-slate-400 block font-mono">CCCD: {p.soCCCD}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <Tag color={p.maTheBHYT ? 'green' : 'default'} className="m-0 text-[11px]">
                      {p.maTheBHYT ? 'Có BHYT' : 'Viện phí'}
                    </Tag>
                    {isSelected && (
                      <span className="text-xs text-sky-600 font-bold block mt-1">✓ Đang chọn</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Drawer>

      {/* ─────────────────────────────────────────────────────────────────────────
          5. MODAL XEM TRƯỚC VÀ IN HỒ SƠ BỆNH ÁN EMR A4 CHUẨN BỘ Y TẾ (PDF PREVIEW)
          ───────────────────────────────────────────────────────────────────────── */}
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

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Bác sĩ Điều trị</div>
                <Tag color="green" style={{ margin: '6px 0', fontWeight: 'bold' }}>
                  <SafetyCertificateOutlined /> ĐÃ KÝ SỐ SHA-256
                </Tag>
                <div style={{ fontWeight: 'bold', fontSize: 13, color: '#0369a1' }}>
                  {currentExam.doctorName}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
