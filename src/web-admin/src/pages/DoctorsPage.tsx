import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Input, Tag, Button, Modal, Rate, Divider, Avatar } from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  TrophyOutlined,
  InfoCircleOutlined,
  ReadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PatientPortalHeader } from '../components/PatientPortalHeader';
import { PatientPortalFooter } from '../components/PatientPortalFooter';
import { CountUpNumber } from '../components/CountUpNumber';
import { DOCTORS_CATALOG, DoctorOption } from '../data/medicalCatalogs';
import './PatientBookingPage.css';

const { Title, Paragraph, Text } = Typography;

export const DoctorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [detailModalDoctor, setDetailModalDoctor] = useState<DoctorOption | null>(null);

  // Danh sách các khoa để lọc
  const departmentsList = [
    { key: 'all', label: 'Tất Cả Bác Sĩ' },
    { key: 'Khoa Nội Tổng Hợp', label: 'Khoa Nội Tổng Hợp' },
    { key: 'Khoa Tiêu Hóa & Gan Mật', label: 'Khoa Tiêu Hóa' },
    { key: 'Khoa Tim Mạch Can Thiệp', label: 'Khoa Tim Mạch' },
    { key: 'Khoa Nhi & Tiêm Chủng', label: 'Khoa Nhi' },
    { key: 'Khoa Ngoại Tổng Quát & Chấn Thương', label: 'Khoa Ngoại' },
    { key: 'Khoa Tai Mũi Họng', label: 'Khoa Tai Mũi Họng' },
    { key: 'Khoa Mắt Kỹ Thuật Cao', label: 'Khoa Mắt' },
    { key: 'Khoa Da Liễu & Thẩm Mỹ Da', label: 'Khoa Da Liễu' },
    { key: 'Khoa Chẩn Đoán Hình Ảnh & Thăm Dò', label: 'CĐ Hình Ảnh' },
  ];

  const filteredDoctors = DOCTORS_CATALOG.filter((doc) => {
    const matchDept =
      selectedDeptFilter === 'all' ||
      doc.department.toLowerCase().includes(selectedDeptFilter.toLowerCase()) ||
      doc.department === selectedDeptFilter;
    const matchSearch =
      !searchKeyword ||
      doc.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (doc.specialties && doc.specialties.some((s) => s.toLowerCase().includes(searchKeyword.toLowerCase()))) ||
      (doc.bio && doc.bio.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchDept && matchSearch;
  });

  return (
    <div className="booking-page-container" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientPortalHeader />

      {/* Hero Banner Bác Sĩ */}
      <section
        style={{
          background: '#f0f9ff',
          padding: '48px 20px 40px',
          textAlign: 'center',
          borderBottom: '1px solid #bae6fd',
        }}
      >
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Tag color="cyan" style={{ padding: '3px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
            ĐỘI NGŨ THẦY THUỐC • Y ĐỨC & CHUYÊN MÔN CAO
          </Tag>
          <Title level={1} style={{ color: '#0c4a6e', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 38px)', margin: '0 0 14px' }}>
            Đội Ngũ Bác Sĩ & Chuyên Gia Đầu Ngành
          </Title>
          <Paragraph style={{ color: '#475569', fontSize: 16, maxWidth: 740, margin: '0 auto 26px', lineHeight: 1.65 }}>
            Tập hợp các Giáo sư, Tiến sĩ, Bác sĩ Chuyên khoa II giàu kinh nghiệm từng công tác tại các bệnh viện tuyến cuối (Chợ Rẫy, ĐHYD, Viện Tim). Tận tâm thăm khám, giải thích cặn kẽ và đồng hành cùng người bệnh.
          </Paragraph>

          {/* Ô Tìm kiếm bác sĩ */}
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#0284c7', fontSize: 18 }} />}
              placeholder="Tìm theo tên bác sĩ, học hàm học vị, chuyên khoa, triệu chứng..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
              size="large"
              style={{
                borderRadius: 30,
                border: '1.5px solid #bae6fd',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08)',
                height: 50,
                fontSize: 15,
              }}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: 1480, width: '95%', margin: '0 auto', padding: '36px 16px 50px' }}>
        {/* 4 Thống kê Bác Sĩ */}
        <Row gutter={[16, 16]} style={{ marginBottom: 36 }}>
          {[
            { end: 50, suffix: '+', label: 'Bác Sĩ Chuyên Khoa', sub: 'Trưởng khoa, CKII & Giảng viên', color: '#0284c7' },
            { end: 15, suffix: '+ Năm', label: 'Kinh Nghiệm Trung Bình', sub: 'Từng công tác tại BV Tuyến 1', color: '#059669' },
            { end: 99, suffix: '%', label: 'Người Bệnh Hài Lòng', sub: 'Tận tình giải thích và tư vấn', color: '#d97706' },
            { end: 100, suffix: '%', label: 'Bác Sĩ Đủ CCHN', sub: 'Cấp bởi Bộ Y Tế & Sở Y Tế', color: '#e11d48' },
          ].map((stat, idx) => (
            <Col xs={12} sm={12} md={6} key={idx}>
              <Card
                className="about-stat-card"
                bordered={false}
                style={{
                  borderRadius: 16,
                  textAlign: 'center',
                  background: '#ffffff',
                  border: '1px solid #bae6fd',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.05)',
                  height: '100%',
                  padding: '12px 8px',
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, marginBottom: 2 }}>
                  <CountUpNumber end={stat.end} suffix={stat.suffix} duration={1800} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a', marginBottom: 2 }}>{stat.label}</div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>{stat.sub}</div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28, justifyContent: 'center' }}>
          {departmentsList.map((dep) => (
            <Button
              key={dep.key}
              type={selectedDeptFilter === dep.key ? 'primary' : 'default'}
              shape="round"
              size="middle"
              onClick={() => setSelectedDeptFilter(dep.key)}
              style={{
                fontWeight: 700,
                backgroundColor: selectedDeptFilter === dep.key ? '#0284c7' : '#ffffff',
                borderColor: selectedDeptFilter === dep.key ? '#0284c7' : '#cbd5e1',
                color: selectedDeptFilter === dep.key ? '#ffffff' : '#334155',
                boxShadow: selectedDeptFilter === dep.key ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
              }}
            >
              {dep.label}
            </Button>
          ))}
        </div>

        {/* Doctor Grid Count */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 15, color: '#475569' }}>
            Hiển thị <span style={{ color: '#0284c7' }}>{filteredDoctors.length}</span> bác sĩ chuyên khoa
          </Text>
        </div>

        {/* Doctor Grid Cards */}
        <Row gutter={[24, 24]}>
          {filteredDoctors.map((doc) => (
            <Col xs={24} sm={12} lg={8} key={doc.id}>
              <Card
                className="about-stat-card"
                bordered={false}
                style={{
                  borderRadius: 20,
                  background: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
                styles={{
                  body: {
                    padding: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  },
                }}
              >
                {/* Doctor Avatar & Top Info */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar
                      src={doc.avatar}
                      icon={<UserOutlined style={{ fontSize: 36, color: '#0284c7' }} />}
                      onError={() => false}
                      size={76}
                      style={{
                        borderRadius: 18,
                        boxShadow: '0 6px 16px rgba(2, 132, 199, 0.15)',
                        border: '2px solid #bae6fd',
                        backgroundColor: '#e0f2fe',
                      }}
                    />
                    <CheckCircleFilled
                      style={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        fontSize: 20,
                        color: '#0284c7',
                        background: '#ffffff',
                        borderRadius: '50%',
                      }}
                      title="Bác sĩ đã xác thực chứng chỉ hành nghề"
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Tag color="cyan" style={{ borderRadius: 10, fontWeight: 700, fontSize: 11, marginBottom: 4 }}>
                      {doc.department}
                    </Tag>
                    <Title
                      level={4}
                      style={{
                        color: '#0f172a',
                        fontWeight: 900,
                        margin: '2px 0 4px',
                        fontSize: 16.5,
                        lineHeight: 1.3,
                      }}
                    >
                      {doc.name}
                    </Title>
                    <div style={{ fontSize: 12.5, color: '#0369a1', fontWeight: 700 }}>{doc.title}</div>
                  </div>
                </div>

                {/* Rating & Review */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: 10,
                    marginBottom: 12,
                  }}
                >
                  <Rate disabled defaultValue={doc.rating} allowHalf style={{ fontSize: 13, color: '#f59e0b' }} />
                  <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a' }}>{doc.rating}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>({doc.reviewCount || 150}+ đánh giá)</span>
                </div>

                {/* Experience & Room */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }}>
                    <TrophyOutlined style={{ color: '#0284c7' }} />
                    <span>{doc.experience}</span>
                  </div>
                  {doc.room && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#64748b' }}>
                      <EnvironmentOutlined style={{ color: '#0284c7' }} />
                      <span>{doc.room}</span>
                    </div>
                  )}
                  {doc.workingDays && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
                      <ClockCircleOutlined style={{ color: '#0284c7' }} />
                      <span>{doc.workingDays}</span>
                    </div>
                  )}
                </div>

                {/* Specialties Pills */}
                {doc.specialties && doc.specialties.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16, flex: 1 }}>
                    {doc.specialties.map((spec, sIdx) => (
                      <Tag
                        key={sIdx}
                        color="blue"
                        style={{
                          borderRadius: 8,
                          fontSize: 11.5,
                          padding: '1px 8px',
                          border: 'none',
                          background: '#f0f9ff',
                          color: '#0369a1',
                        }}
                      >
                        {spec}
                      </Tag>
                    ))}
                  </div>
                )}

                {/* Consultation Fee & Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#64748b' }}>Giá khám chuyên gia:</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#0284c7' }}>
                    {doc.consultationFee.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                  <Button
                    style={{ flex: 1, borderRadius: 10, fontWeight: 700, borderColor: '#bae6fd', color: '#0284c7' }}
                    onClick={() => setDetailModalDoctor(doc)}
                    icon={<InfoCircleOutlined />}
                  >
                    Tiểu Sử
                  </Button>
                  <Button
                    type="primary"
                    style={{ flex: 1.4, borderRadius: 10, fontWeight: 700, backgroundColor: '#0284c7' }}
                    onClick={() => navigate(`/booking?mode=byDoctor&doctorId=${doc.id}`)}
                    icon={<CalendarOutlined />}
                  >
                    Đặt Khám Bác Sĩ
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </main>

      {/* Detail Doctor Modal */}
      <Modal
        open={Boolean(detailModalDoctor)}
        onCancel={() => setDetailModalDoctor(null)}
        footer={null}
        width={680}
        centered
        styles={{
          content: { borderRadius: 20, padding: 28 },
        }}
      >
        {detailModalDoctor && (
          <div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
              <Avatar
                src={detailModalDoctor.avatar}
                icon={<UserOutlined style={{ fontSize: 40, color: '#0284c7' }} />}
                onError={() => false}
                size={84}
                style={{
                  borderRadius: 20,
                  border: '3px solid #bae6fd',
                  boxShadow: '0 6px 18px rgba(2, 132, 199, 0.15)',
                  backgroundColor: '#e0f2fe',
                }}
              />
              <div>
                <Tag color="cyan" style={{ borderRadius: 10, fontWeight: 700, marginBottom: 4 }}>
                  {detailModalDoctor.department}
                </Tag>
                <Title level={3} style={{ color: '#0c4a6e', fontWeight: 900, margin: '2px 0 4px' }}>
                  {detailModalDoctor.name}
                </Title>
                <div style={{ color: '#0369a1', fontWeight: 700, fontSize: 14 }}>
                  {detailModalDoctor.title}
                </div>
              </div>
            </div>

            <Paragraph style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65 }}>
              {detailModalDoctor.bio ||
                'Bác sĩ có nhiều năm kinh nghiệm lâm sàng trong chẩn đoán và điều trị, luôn cập nhật các phác đồ y khoa hiện đại và tận tâm vì sức khỏe người bệnh.'}
            </Paragraph>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
              {detailModalDoctor.education && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ReadOutlined style={{ color: '#0284c7' }} /> Quá trình đào tạo & Học vị:
                  </div>
                  <div style={{ fontSize: 13.5, color: '#475569' }}>{detailModalDoctor.education}</div>
                </div>
              )}

              {detailModalDoctor.room && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <EnvironmentOutlined style={{ color: '#0284c7' }} /> Vị trí phòng khám:
                  </div>
                  <div style={{ fontSize: 13.5, color: '#475569' }}>{detailModalDoctor.room}</div>
                </div>
              )}

              {detailModalDoctor.workingDays && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ClockCircleOutlined style={{ color: '#0284c7' }} /> Lịch làm việc trong tuần:
                  </div>
                  <div style={{ fontSize: 13.5, color: '#475569' }}>{detailModalDoctor.workingDays}</div>
                </div>
              )}

              {detailModalDoctor.achievements && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrophyOutlined style={{ color: '#0284c7' }} /> Thành tựu y khoa nổi bật:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {detailModalDoctor.achievements.map((ach, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155' }}>
                        <CheckCircleFilled style={{ color: '#10b981' }} />
                        <span>{ach}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button size="large" style={{ flex: 1, borderRadius: 12, fontWeight: 700 }} onClick={() => setDetailModalDoctor(null)}>
                Đóng
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                style={{ flex: 2, borderRadius: 12, fontWeight: 800, backgroundColor: '#0284c7' }}
                onClick={() => {
                  setDetailModalDoctor(null);
                  navigate(`/booking?mode=byDoctor&doctorId=${detailModalDoctor.id}`);
                }}
              >
                Đặt Khám Với {detailModalDoctor.name}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <PatientPortalFooter />
    </div>
  );
};
