import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Input, Tag, Button, Modal, Divider } from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  MedicineBoxOutlined,
  UserOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { PatientPortalHeader } from '../components/PatientPortalHeader';
import { PatientPortalFooter } from '../components/PatientPortalFooter';
import { CountUpNumber } from '../components/CountUpNumber';
import { DEPARTMENTS_CATALOG, DOCTORS_CATALOG, DepartmentOption } from '../data/medicalCatalogs';
import './PatientBookingPage.css';

const { Title, Paragraph, Text } = Typography;

export const DepartmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'noi' | 'ngoai' | 'chuyen-khoa'>('all');
  const [detailModalDept, setDetailModalDept] = useState<DepartmentOption | null>(null);

  const categories = [
    { key: 'all', label: 'Tất Cả Chuyên Khoa' },
    { key: 'noi', label: 'Khối Nội Khoa' },
    { key: 'ngoai', label: 'Khối Ngoại & Chấn Thương' },
    { key: 'chuyen-khoa', label: 'Chuyên Khoa Mũi Nhọn' },
  ];

  const filteredDepts = DEPARTMENTS_CATALOG.filter((dept) => {
    const matchCat = selectedCategory === 'all' || dept.category === selectedCategory;
    const matchSearch =
      !searchKeyword ||
      dept.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      dept.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      dept.location.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (dept.headDoctor && dept.headDoctor.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchCat && matchSearch;
  });

  // Tìm danh sách bác sĩ thuộc khoa đang xem modal
  const doctorsInModalDept = detailModalDept
    ? DOCTORS_CATALOG.filter((doc) => doc.department.toLowerCase().includes(detailModalDept.name.toLowerCase().replace('khoa ', '')))
    : [];

  return (
    <div className="booking-page-container" style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <PatientPortalHeader />

      {/* Hero Banner Chuyên Khoa */}
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
            CHUYÊN KHOA KỸ THUẬT CAO • TIÊU CHUẨN QUỐC TẾ
          </Tag>
          <Title level={1} style={{ color: '#0c4a6e', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 38px)', margin: '0 0 14px' }}>
            Hệ Thống Chuyên Khoa Mũi Nhọn D-Medical
          </Title>
          <Paragraph style={{ color: '#475569', fontSize: 16, maxWidth: 720, margin: '0 auto 26px', lineHeight: 1.65 }}>
            Quy tụ các chuyên khoa lâm sàng và cận lâm sàng chuyên sâu, dẫn đầu bởi đội ngũ Bác sĩ Chuyên khoa II, Tiến sĩ đầu ngành cùng công nghệ chẩn đoán hình ảnh hiện đại nhất.
          </Paragraph>

          {/* Thanh tìm kiếm Chuyên khoa */}
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#0284c7', fontSize: 18 }} />}
              placeholder="Tìm theo tên khoa, triệu chứng, phòng khám, bác sĩ..."
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
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 16px 50px' }}>
        {/* 4 Thống kê Chuyên khoa với CountUp */}
        <Row gutter={[16, 16]} style={{ marginBottom: 36 }}>
          {[
            { end: 9, suffix: '+', label: 'Khoa Lâm Sàng Kỹ Thuật Cao', sub: 'Đầy đủ trang thiết bị thế hệ mới', color: '#0284c7', bg: '#e0f2fe' },
            { end: 100, suffix: '%', label: 'Phòng Khám Đạt Chuẩn', sub: 'Vô trùng, máy lạnh, kết nối EMR', color: '#059669', bg: '#d1fae5' },
            { end: 42100, suffix: 'đ', label: 'Khám BHYT Đúng Tuyến', sub: 'Thanh toán tự động thông tuyến', color: '#d97706', bg: '#fef3c7' },
            { end: 24, suffix: '/7', label: 'Trực Cấp Cứu 24/7', sub: 'Sẵn sàng tiếp nhận ngoại viện', color: '#e11d48', bg: '#ffe4e6' },
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
          {categories.map((cat) => (
            <Button
              key={cat.key}
              type={selectedCategory === cat.key ? 'primary' : 'default'}
              shape="round"
              size="middle"
              onClick={() => setSelectedCategory(cat.key as any)}
              style={{
                fontWeight: 700,
                backgroundColor: selectedCategory === cat.key ? '#0284c7' : '#ffffff',
                borderColor: selectedCategory === cat.key ? '#0284c7' : '#cbd5e1',
                color: selectedCategory === cat.key ? '#ffffff' : '#334155',
                boxShadow: selectedCategory === cat.key ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
              }}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Department Grid */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 15, color: '#475569' }}>
            Hiển thị <span style={{ color: '#0284c7' }}>{filteredDepts.length}</span> chuyên khoa
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {filteredDepts.map((dept) => (
            <Col xs={24} sm={12} lg={8} key={dept.id}>
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
                  position: 'relative',
                }}
                styles={{
                  body: {
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                  },
                }}
              >
                {/* Top Badge & Code */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Tag
                    color="blue"
                    style={{
                      borderRadius: 12,
                      fontWeight: 800,
                      padding: '2px 10px',
                      fontSize: 11.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    Mã: {dept.code || dept.id}
                  </Tag>
                  <Tag color="cyan" style={{ borderRadius: 12, fontWeight: 700, margin: 0, fontSize: 11 }}>
                    BHYT Áp dụng
                  </Tag>
                </div>

                {/* Department Name & Icon */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                  <div
                    className="about-stat-icon-wrap"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: dept.iconBg + '18',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MedicineBoxOutlined style={{ fontSize: 24, color: dept.iconBg }} />
                  </div>
                  <div>
                    <Title level={4} style={{ color: '#0f172a', fontWeight: 800, margin: '0 0 4px', fontSize: 17 }}>
                      {dept.name}
                    </Title>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 12.5 }}>
                      <EnvironmentOutlined style={{ color: '#0284c7' }} />
                      <span>{dept.location}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <Paragraph
                  ellipsis={{ rows: 2 }}
                  style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.6, marginBottom: 14, minHeight: 42 }}
                >
                  {dept.description}
                </Paragraph>

                {/* Head Doctor Badge */}
                {dept.headDoctor && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      marginBottom: 14,
                    }}
                  >
                    <UserOutlined style={{ color: '#0284c7', fontSize: 14 }} />
                    <div style={{ fontSize: 12.5, color: '#1e293b' }}>
                      Trưởng khoa: <strong>{dept.headDoctor}</strong>
                    </div>
                  </div>
                )}

                {/* Key Services Checklist */}
                {dept.keyServices && dept.keyServices.length > 0 && (
                  <div style={{ marginBottom: 18, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>
                      Dịch vụ trọng tâm:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {dept.keyServices.slice(0, 3).map((srv, sIdx) => (
                        <div key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: '#334155' }}>
                          <CheckCircleOutlined style={{ color: '#10b981', marginTop: 3, flexShrink: 0 }} />
                          <span style={{ lineHeight: 1.4 }}>{srv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '10px 14px',
                    borderRadius: 12,
                    backgroundColor: '#f0f9ff',
                    border: '1px dashed #bae6fd',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Giá khám dịch vụ</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0284c7' }}>
                      {dept.price.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>BHYT cùng chi trả</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>
                      {dept.bhytPrice.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                  <Button
                    style={{ flex: 1, borderRadius: 10, fontWeight: 700, borderColor: '#bae6fd', color: '#0284c7' }}
                    onClick={() => setDetailModalDept(dept)}
                    icon={<InfoCircleOutlined />}
                  >
                    Chi Tiết
                  </Button>
                  <Button
                    type="primary"
                    style={{ flex: 1.3, borderRadius: 10, fontWeight: 700, backgroundColor: '#0284c7' }}
                    onClick={() => navigate(`/booking?mode=byDept&deptId=${dept.id}`)}
                    icon={<CalendarOutlined />}
                  >
                    Đặt Khám Ngay
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </main>

      {/* Detail Department Modal */}
      <Modal
        open={Boolean(detailModalDept)}
        onCancel={() => setDetailModalDept(null)}
        footer={null}
        width={720}
        centered
        styles={{
          content: { borderRadius: 20, padding: 28 },
        }}
      >
        {detailModalDept && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  backgroundColor: detailModalDept.iconBg + '20',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MedicineBoxOutlined style={{ fontSize: 28, color: detailModalDept.iconBg }} />
              </div>
              <div>
                <Title level={3} style={{ color: '#0c4a6e', fontWeight: 900, margin: 0 }}>
                  {detailModalDept.name}
                </Title>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                  <Tag color="blue">{detailModalDept.code || detailModalDept.id}</Tag>
                  <span style={{ fontSize: 13, color: '#64748b' }}>
                    <EnvironmentOutlined style={{ color: '#0284c7' }} /> {detailModalDept.location}
                  </span>
                </div>
              </div>
            </div>

            <Paragraph style={{ color: '#334155', fontSize: 14.5, lineHeight: 1.65 }}>
              {detailModalDept.description}
            </Paragraph>

            <Divider style={{ margin: '16px 0' }} />

            {/* Thông tin hoạt động */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col span={12}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Trưởng khoa phụ trách:</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                  {detailModalDept.headDoctor || 'Hội đồng Chuyên môn D-Medical'}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Thời gian làm việc:</div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
                  {detailModalDept.workingHours || '07:00 - 17:00 (Thứ 2 - Thứ 7)'}
                </div>
              </Col>
            </Row>

            {/* Trang thiết bị */}
            {detailModalDept.equipment && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ExperimentOutlined style={{ color: '#0284c7' }} /> Trang thiết bị kỹ thuật cao:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {detailModalDept.equipment.map((eq, idx) => (
                    <Tag key={idx} color="cyan" style={{ padding: '4px 10px', borderRadius: 8, fontSize: 12.5 }}>
                      <CheckOutlined style={{ marginRight: 4, color: '#0284c7' }} />{eq}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {/* Bác sĩ thuộc khoa */}
            {doctorsInModalDept.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserOutlined style={{ color: '#0284c7' }} /> Bác sĩ nổi bật của khoa:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {doctorsInModalDept.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderRadius: 12,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a' }}>{doc.name}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>{doc.title}</div>
                        </div>
                      </div>
                      <Button
                        size="small"
                        type="link"
                        style={{ color: '#0284c7', fontWeight: 700 }}
                        onClick={() => {
                          setDetailModalDept(null);
                          navigate(`/booking?mode=byDoctor&doctorId=${doc.id}`);
                        }}
                      >
                        Đặt khám <ArrowRightOutlined />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nút Đặt Khám */}
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Button
                size="large"
                style={{ flex: 1, borderRadius: 12, fontWeight: 700 }}
                onClick={() => setDetailModalDept(null)}
              >
                Đóng
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<CalendarOutlined />}
                style={{ flex: 2, borderRadius: 12, fontWeight: 800, backgroundColor: '#0284c7' }}
                onClick={() => {
                  setDetailModalDept(null);
                  navigate(`/booking?mode=byDept&deptId=${detailModalDept.id}`);
                }}
              >
                Đặt Lịch Khám Khoa Này
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <PatientPortalFooter />
    </div>
  );
};
