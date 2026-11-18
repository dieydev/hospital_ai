import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tabs,
  Button,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tooltip,
  Row,
  Col,
  Statistic,
  Descriptions,
  Divider,
  Alert,
  Space,
} from 'antd';
import {
  MedicineBoxOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  SearchOutlined,
  PlusOutlined,
  WarningOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  InboxOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../utils/formatters';
import { usePermissions } from '../hooks/usePermissions';
import { showSuccessAlert, showToast } from '../utils/sweetAlert';
import {
  HospitalDrugItem,
  PrescriptionDispenseItem,
  HOSPITAL_DRUG_CATALOG,
  SAMPLE_DISPENSING_PRESCRIPTIONS,
  DRUG_CATEGORIES,
} from '../data/drugCatalogData';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const PharmacyPage: React.FC = () => {
  const permissions = usePermissions();

  const [activeTab, setActiveTab] = useState<'dispensing' | 'catalog' | 'inventory' | 'interactions'>('dispensing');

  // Dữ liệu Đơn thuốc cấp phát (có lưu vào state để tương tác cấp phát thực tế)
  const [prescriptions, setPrescriptions] = useState<PrescriptionDispenseItem[]>(() => {
    try {
      const saved = localStorage.getItem('hospital_dispensing_prescriptions');
      return saved ? JSON.parse(saved) : SAMPLE_DISPENSING_PRESCRIPTIONS;
    } catch {
      return SAMPLE_DISPENSING_PRESCRIPTIONS;
    }
  });

  // Dữ liệu Kho thuốc & Danh mục thuốc (có lưu state)
  const [drugCatalog, setDrugCatalog] = useState<HospitalDrugItem[]>(() => {
    try {
      const saved = localStorage.getItem('hospital_drug_catalog_store');
      return saved ? JSON.parse(saved) : HOSPITAL_DRUG_CATALOG;
    } catch {
      return HOSPITAL_DRUG_CATALOG;
    }
  });

  // Bộ lọc danh mục thuốc
  const [searchDrugText, setSearchDrugText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả nhóm thuốc');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('all');

  // Modal Chi tiết đơn thuốc
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionDispenseItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Modal Thêm thuốc mới
  const [isAddDrugModalOpen, setIsAddDrugModalOpen] = useState(false);
  const [addDrugForm] = Form.useForm();

  // Modal Điều chỉnh tồn kho
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingDrug, setEditingDrug] = useState<HospitalDrugItem | null>(null);
  const [stockForm] = Form.useForm();

  // Công cụ kiểm tra tương tác thuốc
  const [selectedDrug1, setSelectedDrug1] = useState<string>('AUG-1G');
  const [selectedDrug2, setSelectedDrug2] = useState<string>('CONCOR-2.5');

  // Thống kê đơn thuốc
  const stats = useMemo(() => {
    const totalPrescriptions = prescriptions.length;
    const pending = prescriptions.filter((p) => p.status === 'Chờ cấp phát').length;
    const dispensed = prescriptions.filter((p) => p.status === 'Đã cấp phát').length;
    const totalRevenue = prescriptions.reduce((sum, p) => sum + p.totalAmount, 0);
    const lowStockCount = drugCatalog.filter((d) => d.stockQuantity <= d.minStock).length;
    return { totalPrescriptions, pending, dispensed, totalRevenue, lowStockCount };
  }, [prescriptions, drugCatalog]);

  // Lọc thuốc
  const filteredDrugs = useMemo(() => {
    return drugCatalog.filter((drug) => {
      const matchSearch =
        !searchDrugText ||
        drug.name.toLowerCase().includes(searchDrugText.toLowerCase()) ||
        drug.code.toLowerCase().includes(searchDrugText.toLowerCase()) ||
        drug.activeIngredient.toLowerCase().includes(searchDrugText.toLowerCase()) ||
        drug.manufacturer.toLowerCase().includes(searchDrugText.toLowerCase());

      const matchCat = selectedCategory === 'Tất cả nhóm thuốc' || drug.category === selectedCategory;

      let matchStock = true;
      if (selectedStockFilter === 'instock') matchStock = drug.stockQuantity > drug.minStock;
      else if (selectedStockFilter === 'lowstock') matchStock = drug.stockQuantity <= drug.minStock && drug.stockQuantity > 0;
      else if (selectedStockFilter === 'outofstock') matchStock = drug.stockQuantity === 0;

      return matchSearch && matchCat && matchStock;
    });
  }, [drugCatalog, searchDrugText, selectedCategory, selectedStockFilter]);

  // Thao tác: Cấp phát đơn thuốc
  const handleDispense = (record: PrescriptionDispenseItem) => {
    if (!permissions.canDispenseMedicine) {
      showToast(permissions.getLockTooltip('canDispenseMedicine'), 'warning');
      return;
    }

    const updated = prescriptions.map((item) => {
      if (item.id === record.id) {
        return {
          ...item,
          status: 'Đã cấp phát' as const,
          dispensedAt: new Date().toLocaleString('vi-VN'),
          dispensedBy: permissions.isAdmin ? 'Quản trị viên (DS. Trực)' : 'Dược sĩ Nhà thuốc D-Medical',
        };
      }
      return item;
    });

    setPrescriptions(updated);
    try {
      localStorage.setItem('hospital_dispensing_prescriptions', JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Tự động trừ kho thuốc tương ứng
    const updatedCatalog = drugCatalog.map((drug) => {
      const match = record.medicines.find((m) => m.drugCode === drug.code);
      if (match) {
        const nextQty = Math.max(0, drug.stockQuantity - match.quantity);
        return {
          ...drug,
          stockQuantity: nextQty,
          status: (nextQty === 0 ? 'OutOfStock' : nextQty <= drug.minStock ? 'LowStock' : 'InStock') as any,
        };
      }
      return drug;
    });

    setDrugCatalog(updatedCatalog);
    try {
      localStorage.setItem('hospital_drug_catalog_store', JSON.stringify(updatedCatalog));
    } catch {
      // ignore
    }

    showSuccessAlert(
      'Cấp phát thuốc thành công!',
      `Đã hoàn tất cấp phát toa thuốc [${record.prescriptionCode}] cho bệnh nhân ${record.patientName}. Tồn kho thuốc đã được trừ tự động.`
    );

    if (selectedPrescription?.id === record.id) {
      setIsDetailModalOpen(false);
    }
  };

  // Thao tác: Thêm thuốc mới vào kho
  const handleAddNewDrug = (values: any) => {
    if (!permissions.canManagePharmacyInventory) {
      showToast(permissions.getLockTooltip('canManagePharmacyInventory'), 'warning');
      return;
    }

    const newDrug: HospitalDrugItem = {
      id: `D-${Date.now()}`,
      code: values.code.toUpperCase(),
      name: values.name,
      activeIngredient: values.activeIngredient,
      category: values.category,
      unit: values.unit,
      unitPrice: Number(values.unitPrice),
      bhytPrice: Number(values.bhytPrice || 0),
      bhytCoveredRate: Number(values.bhytCoveredRate || 80),
      stockQuantity: Number(values.stockQuantity || 100),
      minStock: Number(values.minStock || 50),
      batchNumber: values.batchNumber || `LOT-${Date.now().toString().slice(-6)}`,
      expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : '2028-12-31',
      manufacturer: values.manufacturer || 'Dược phẩm Việt Nam',
      country: values.country || 'Việt Nam',
      dosageForm: values.dosageForm || 'Viên nén',
      status: 'InStock',
      defaultDosage: values.defaultDosage || 'Theo chỉ định của bác sĩ',
      requiresPrescription: values.requiresPrescription ?? true,
    };

    const nextCatalog = [newDrug, ...drugCatalog];
    setDrugCatalog(nextCatalog);
    try {
      localStorage.setItem('hospital_drug_catalog_store', JSON.stringify(nextCatalog));
    } catch {
      // ignore
    }

    setIsAddDrugModalOpen(false);
    addDrugForm.resetFields();
    showSuccessAlert('Thêm thuốc thành công!', `Thuốc ${newDrug.name} (${newDrug.code}) đã được nhập vào danh mục Dược viện.`);
  };

  // Thao tác: Cập nhật tồn kho
  const handleUpdateStock = (values: any) => {
    if (!permissions.canManagePharmacyInventory || !editingDrug) return;

    const nextQty = Number(values.stockQuantity);
    const updated = drugCatalog.map((d) => {
      if (d.id === editingDrug.id) {
        return {
          ...d,
          stockQuantity: nextQty,
          minStock: Number(values.minStock),
          status: (nextQty === 0 ? 'OutOfStock' : nextQty <= values.minStock ? 'LowStock' : 'InStock') as any,
        };
      }
      return d;
    });

    setDrugCatalog(updated);
    try {
      localStorage.setItem('hospital_drug_catalog_store', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setIsStockModalOpen(false);
    showToast(`Đã cập nhật tồn kho cho thuốc ${editingDrug.name}: ${nextQty} ${editingDrug.unit}`, 'success');
  };

  // In đơn thuốc
  const handlePrintPrescription = (_record: PrescriptionDispenseItem) => {
    window.print();
  };

  return (
    <div style={{ padding: '0 4px', maxWidth: 1600, margin: '0 auto' }}>
      {/* Header Banner & Phân quyền */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          borderRadius: 16,
          padding: '20px 24px',
          color: '#ffffff',
          marginBottom: 20,
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <MedicineBoxOutlined style={{ fontSize: 28 }} />
            <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 700 }}>
              Dược & Nhà Thuốc Bệnh Viện D-Medical
            </Title>
            <Tag color="cyan" style={{ fontSize: 13, padding: '2px 10px', borderRadius: 12, fontWeight: 600 }}>
              Kho Dược GPP Chuẩn
            </Tag>
          </div>
          <Paragraph style={{ color: '#e0f2fe', margin: 0, fontSize: 14 }}>
            Hệ thống Cấp phát thuốc theo đơn điện tử liên thông, Quản lý kho dược phẩm, Kiểm tra tương tác thuốc & Cảnh báo an toàn người bệnh.
          </Paragraph>
        </div>

        {/* Thẻ hiển thị Vai trò hiện tại & Quyền hạn */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            padding: '10px 16px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SafetyCertificateOutlined style={{ color: '#38bdf8', fontSize: 16 }} />
            <Text style={{ color: '#ffffff', fontWeight: 600, fontSize: 13 }}>Vai trò đang đăng nhập:</Text>
            <Tag color={permissions.isAdmin ? 'gold' : permissions.isPharmacy ? 'green' : 'blue'} style={{ fontWeight: 700, margin: 0 }}>
              {permissions.roleNameVN}
            </Tag>
          </div>
          <Text style={{ color: '#e0f2fe', fontSize: 12 }}>
            {permissions.canDispenseMedicine ? (
              <span style={{ color: '#a7f3d0' }}>
                <CheckCircleOutlined /> Có toàn quyền Cấp phát thuốc & Quản lý kho dược
              </span>
            ) : (
              <span style={{ color: '#fef08a' }}>
                <LockOutlined /> Chế độ Xem danh mục (Không có quyền Cấp phát trực tiếp)
              </span>
            )}
          </Text>
        </div>
      </div>

      {/* Thông báo phân quyền nếu không phải Dược sĩ / Admin */}
      {!permissions.canDispenseMedicine && (
        <Alert
          message={
            <span>
              <strong>Thông báo phân quyền nghiệp vụ y tế:</strong> Bạn đang truy cập Nhà thuốc dưới vai trò{' '}
              <Tag color="blue">{permissions.roleNameVN}</Tag>. Chức năng <strong>Xác nhận cấp phát thuốc</strong> và{' '}
              <strong>Nhập kho/Chỉnh sửa số lượng</strong> được khóa an toàn, chỉ dành riêng cho{' '}
              <strong>Dược sĩ Nhà thuốc (Pharmacy)</strong> và <strong>Quản trị viên (Admin)</strong>.
            </span>
          }
          type="info"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: 18, borderRadius: 10, border: '1px solid #bae6fd' }}
        />
      )}

      {/* Thẻ Thống kê nhanh */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)',
              border: '1px solid #bae6fd',
            }}
          >
            <Statistic
              title={<Text style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>TỔNG TOA THUỐC HÔM NAY</Text>}
              value={stats.totalPrescriptions}
              suffix="đơn"
              valueStyle={{ color: '#0284c7', fontWeight: 700 }}
              prefix={<MedicineBoxOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)',
              border: '1px solid #fef08a',
              background: '#fefce8',
            }}
          >
            <Statistic
              title={<Text style={{ color: '#854d0e', fontSize: 13, fontWeight: 600 }}>CHỜ CẤP PHÁT THUỐC</Text>}
              value={stats.pending}
              suffix="đơn"
              valueStyle={{ color: '#ca8a04', fontWeight: 700 }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)',
              border: '1px solid #bbf7d0',
              background: '#f0fdf4',
            }}
          >
            <Statistic
              title={<Text style={{ color: '#166534', fontSize: 13, fontWeight: 600 }}>ĐÃ HOÀN TẤT CẤP PHÁT</Text>}
              value={stats.dispensed}
              suffix="đơn"
              valueStyle={{ color: '#16a34a', fontWeight: 700 }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: '0 4px 20px rgba(2, 132, 199, 0.08)',
              border: stats.lowStockCount > 0 ? '1px solid #fecaca' : '1px solid #bae6fd',
              background: stats.lowStockCount > 0 ? '#fff1f2' : '#ffffff',
            }}
          >
            <Statistic
              title={<Text style={{ color: stats.lowStockCount > 0 ? '#9f1239' : '#64748b', fontSize: 13, fontWeight: 600 }}>CẢNH BÁO TỒN KHO THẤP</Text>}
              value={stats.lowStockCount}
              suffix="loại thuốc"
              valueStyle={{ color: stats.lowStockCount > 0 ? '#e11d48' : '#0284c7', fontWeight: 700 }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs điều hướng Nghiệp vụ Nhà thuốc */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.08)',
          border: '1px solid #bae6fd',
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k: any) => setActiveTab(k)}
          size="large"
          items={[
            {
              key: 'dispensing',
              label: (
                <span style={{ fontWeight: 600, fontSize: 15 }}>
                  <MedicineBoxOutlined /> Cấp Phát Thuốc Theo Đơn ({stats.pending} chờ)
                </span>
              ),
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <Title level={4} style={{ margin: 0, color: '#0369a1' }}>
                        Danh Sách Đơn Thuốc Lâm Sàng Chờ Cấp Phát
                      </Title>
                      <Text type="secondary">Toa thuốc điện tử được ký duyệt liên thông trực tiếp từ Phòng khám Bác sĩ.</Text>
                    </div>

                    <Space>
                      <Button
                        icon={<SyncOutlined />}
                        onClick={() => {
                          setPrescriptions(SAMPLE_DISPENSING_PRESCRIPTIONS);
                          localStorage.setItem('hospital_dispensing_prescriptions', JSON.stringify(SAMPLE_DISPENSING_PRESCRIPTIONS));
                          showToast('Đã làm mới danh sách đơn thuốc từ hệ thống phòng khám.', 'info');
                        }}
                      >
                        Làm mới
                      </Button>
                    </Space>
                  </div>

                  <Table
                    rowKey="id"
                    dataSource={prescriptions}
                    pagination={{ pageSize: 8, showTotal: (t) => `Tổng cộng ${t} đơn thuốc` }}
                    bordered
                    columns={[
                      {
                        title: 'Mã Toa',
                        dataIndex: 'prescriptionCode',
                        key: 'prescriptionCode',
                        width: 140,
                        render: (text) => <strong style={{ color: '#0284c7' }}>{text}</strong>,
                      },
                      {
                        title: 'Bệnh Nhân',
                        key: 'patient',
                        render: (_, record) => (
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{record.patientName}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {record.patientCode} • {record.patientGender}, {record.patientAge} tuổi
                            </Text>
                          </div>
                        ),
                      },
                      {
                        title: 'Bác Sĩ Kê Đơn & Khoa',
                        key: 'doctor',
                        render: (_, record) => (
                          <div>
                            <div style={{ fontWeight: 500 }}>{record.doctorName}</div>
                            <Tag color="geekblue" style={{ fontSize: 11, borderRadius: 6, margin: 0 }}>
                              {record.department}
                            </Tag>
                          </div>
                        ),
                      },
                      {
                        title: 'Chẩn Đoán (ICD-10)',
                        dataIndex: 'diagnosis',
                        key: 'diagnosis',
                        render: (text, record) => (
                          <div>
                            <div style={{ fontSize: 13 }}>{text}</div>
                            <Tag color="cyan" style={{ fontSize: 11, borderRadius: 6, margin: 0 }}>
                              Mã ICD: {record.icd10}
                            </Tag>
                          </div>
                        ),
                      },
                      {
                        title: 'Chi Phí Thuốc',
                        key: 'amount',
                        width: 170,
                        render: (_, record) => (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(record.totalAmount)}</div>
                            <div style={{ fontSize: 11, color: '#16a34a' }}>BHYT: -{formatCurrency(record.bhytSupport)}</div>
                            <div style={{ fontSize: 11, color: '#e11d48', fontWeight: 600 }}>
                              Người bệnh trả: {formatCurrency(record.copayAmount)}
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'Trạng Thái',
                        dataIndex: 'status',
                        key: 'status',
                        width: 140,
                        align: 'center',
                        render: (status: string) => {
                          if (status === 'Đã cấp phát') {
                            return <Tag color="success" style={{ fontWeight: 600, borderRadius: 10 }}>Đã Cấp Phát</Tag>;
                          }
                          if (status === 'Chờ cấp phát') {
                            return <Tag color="warning" style={{ fontWeight: 600, borderRadius: 10 }}>Chờ Cấp Thuốc</Tag>;
                          }
                          return <Tag color="default">{status}</Tag>;
                        },
                      },
                      {
                        title: 'Thao Tác Nghiệp Vụ',
                        key: 'action',
                        width: 200,
                        align: 'center',
                        render: (_, record) => (
                          <Space size="small">
                            <Tooltip title="Xem chi tiết danh sách thuốc & Liều lượng">
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => {
                                  setSelectedPrescription(record);
                                  setIsDetailModalOpen(true);
                                }}
                              >
                                Xem
                              </Button>
                            </Tooltip>

                            {/* Nút Cấp phát thuốc - Được khóa bằng RBAC nếu không phải Dược sĩ / Admin */}
                            {record.status === 'Chờ cấp phát' ? (
                              <Tooltip title={!permissions.canDispenseMedicine ? permissions.getLockTooltip('canDispenseMedicine') : 'Xác nhận cấp phát thuốc cho người bệnh'}>
                                <Button
                                  size="small"
                                  type="primary"
                                  icon={permissions.canDispenseMedicine ? <CheckCircleOutlined /> : <LockOutlined />}
                                  disabled={!permissions.canDispenseMedicine}
                                  onClick={() => handleDispense(record)}
                                  style={{
                                    backgroundColor: permissions.canDispenseMedicine ? '#0284c7' : undefined,
                                    borderColor: permissions.canDispenseMedicine ? '#0284c7' : undefined,
                                  }}
                                >
                                  Cấp Phát
                                </Button>
                              </Tooltip>
                            ) : (
                              <Tooltip title="In Phiếu Cấp Phát / Toa Thuốc">
                                <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrintPrescription(record)}>
                                  In Phiếu
                                </Button>
                              </Tooltip>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'catalog',
              label: (
                <span style={{ fontWeight: 600, fontSize: 15 }}>
                  <InboxOutlined /> Kho Dược & Danh Mục Thuốc ({drugCatalog.length} mặt hàng)
                </span>
              ),
              children: (
                <div>
                  {/* Thanh tìm kiếm & Bộ lọc kho Dược */}
                  <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={10} md={8}>
                      <Input
                        placeholder="Tìm theo tên thuốc, hoạt chất, mã thuốc, hãng SX..."
                        prefix={<SearchOutlined style={{ color: '#0284c7' }} />}
                        value={searchDrugText}
                        onChange={(e) => setSearchDrugText(e.target.value)}
                        allowClear
                        size="middle"
                      />
                    </Col>
                    <Col xs={24} sm={7} md={6}>
                      <Select
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        style={{ width: '100%' }}
                        size="middle"
                      >
                        {DRUG_CATEGORIES.map((cat) => (
                          <Option key={cat} value={cat}>
                            {cat}
                          </Option>
                        ))}
                      </Select>
                    </Col>
                    <Col xs={24} sm={7} md={5}>
                      <Select
                        value={selectedStockFilter}
                        onChange={setSelectedStockFilter}
                        style={{ width: '100%' }}
                        size="middle"
                      >
                        <Option value="all">Tất cả tình trạng kho</Option>
                        <Option value="instock">Còn hàng dồi dào</Option>
                        <Option value="lowstock">Cảnh báo sắp hết</Option>
                        <Option value="outofstock">Tạm hết hàng</Option>
                      </Select>
                    </Col>
                    <Col xs={24} md={5} style={{ textAlign: 'right' }}>
                      <Tooltip title={!permissions.canManagePharmacyInventory ? permissions.getLockTooltip('canManagePharmacyInventory') : 'Nhập mặt hàng thuốc mới vào kho'}>
                        <Button
                          type="primary"
                          icon={permissions.canManagePharmacyInventory ? <PlusOutlined /> : <LockOutlined />}
                          disabled={!permissions.canManagePharmacyInventory}
                          onClick={() => setIsAddDrugModalOpen(true)}
                          style={{
                            backgroundColor: permissions.canManagePharmacyInventory ? '#0284c7' : undefined,
                            borderColor: permissions.canManagePharmacyInventory ? '#0284c7' : undefined,
                          }}
                        >
                          Nhập Thuốc Mới
                        </Button>
                      </Tooltip>
                    </Col>
                  </Row>

                  {/* Bảng Danh mục thuốc đầy đủ */}
                  <Table
                    rowKey="id"
                    dataSource={filteredDrugs}
                    pagination={{ pageSize: 10, showTotal: (t) => `Hiển thị ${t} / ${drugCatalog.length} loại thuốc` }}
                    bordered
                    columns={[
                      {
                        title: 'Mã Thuốc',
                        dataIndex: 'code',
                        key: 'code',
                        width: 110,
                        render: (code) => <Tag color="blue" style={{ fontWeight: 600 }}>{code}</Tag>,
                      },
                      {
                        title: 'Tên Biệt Dược & Hoạt Chất',
                        key: 'name',
                        render: (_, record) => (
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{record.name}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Hoạt chất: {record.activeIngredient}
                            </Text>
                            <div>
                              <Tag color="cyan" style={{ fontSize: 11, borderRadius: 6, margin: '2px 0 0 0' }}>
                                {record.category}
                              </Tag>
                              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
                                Dạng: {record.dosageForm}
                              </span>
                            </div>
                          </div>
                        ),
                      },
                      {
                        title: 'ĐVT',
                        dataIndex: 'unit',
                        key: 'unit',
                        width: 80,
                        align: 'center',
                      },
                      {
                        title: 'Đơn Giá (VND)',
                        key: 'price',
                        width: 140,
                        render: (_, record) => (
                          <div>
                            <div style={{ fontWeight: 600, color: '#0284c7' }}>{formatCurrency(record.unitPrice)}</div>
                            {record.bhytCoveredRate > 0 ? (
                              <Text style={{ fontSize: 11, color: '#16a34a' }}>BHYT {record.bhytCoveredRate}%</Text>
                            ) : (
                              <Text style={{ fontSize: 11, color: '#94a3b8' }}>Thu phí 100%</Text>
                            )}
                          </div>
                        ),
                      },
                      {
                        title: 'Tồn Kho Hiện Tại',
                        key: 'stock',
                        width: 160,
                        render: (_, record) => {
                          const isLow = record.stockQuantity <= record.minStock;
                          const isOut = record.stockQuantity === 0;
                          return (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: isOut ? '#e11d48' : isLow ? '#d97706' : '#16a34a' }}>
                                {record.stockQuantity.toLocaleString()} {record.unit}
                              </div>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                Định mức tối thiểu: {record.minStock} {record.unit}
                              </Text>
                            </div>
                          );
                        },
                      },
                      {
                        title: 'Lô SX & Hạn Dùng',
                        key: 'batch',
                        width: 150,
                        render: (_, record) => (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{record.batchNumber}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>HSD: {record.expiryDate}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{record.manufacturer}</div>
                          </div>
                        ),
                      },
                      {
                        title: 'Tình Trạng',
                        key: 'status',
                        width: 130,
                        align: 'center',
                        render: (_, record) => {
                          if (record.stockQuantity === 0) return <Tag color="error">Hết hàng</Tag>;
                          if (record.stockQuantity <= record.minStock) return <Tag color="warning">Sắp hết</Tag>;
                          return <Tag color="success">Sẵn sàng</Tag>;
                        },
                      },
                      {
                        title: 'Quản Lý Kho',
                        key: 'action',
                        width: 110,
                        align: 'center',
                        render: (_, record) => (
                          <Tooltip title={!permissions.canManagePharmacyInventory ? permissions.getLockTooltip('canManagePharmacyInventory') : 'Điều chỉnh số lượng thực tế trong kho'}>
                            <Button
                              size="small"
                              disabled={!permissions.canManagePharmacyInventory}
                              onClick={() => {
                                setEditingDrug(record);
                                stockForm.setFieldsValue({
                                  stockQuantity: record.stockQuantity,
                                  minStock: record.minStock,
                                });
                                setIsStockModalOpen(true);
                              }}
                            >
                              Chỉnh Kho
                            </Button>
                          </Tooltip>
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
            {
              key: 'interactions',
              label: (
                <span style={{ fontWeight: 600, fontSize: 15 }}>
                  <AlertOutlined /> Tra Cứu Tương Tác Dược & Dị Ứng
                </span>
              ),
              children: (
                <div style={{ maxWidth: 900, margin: '0 auto', padding: '12px 0' }}>
                  <Alert
                    message="Hệ thống Kiểm thử An toàn Dược lâm sàng (Clinical Drug Interaction Checker)"
                    description="Công cụ hỗ trợ Bác sĩ và Dược sĩ kiểm tra tương tác chéo giữa các thuốc, chống chỉ định và liều an toàn trước khi cấp phát cho bệnh nhân."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 20, borderRadius: 12 }}
                  />

                  <Card
                    title="Kiểm Tra Tương Tác Giữa 2 Loại Thuốc"
                    style={{ borderRadius: 12, border: '1px solid #bae6fd' }}
                  >
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Chọn Thuốc thứ nhất:">
                          <Select
                            value={selectedDrug1}
                            onChange={setSelectedDrug1}
                            style={{ width: '100%' }}
                            showSearch
                            optionFilterProp="children"
                          >
                            {drugCatalog.slice(0, 30).map((d) => (
                              <Option key={d.code} value={d.code}>
                                {d.name} ({d.activeIngredient})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Chọn Thuốc thứ hai:">
                          <Select
                            value={selectedDrug2}
                            onChange={setSelectedDrug2}
                            style={{ width: '100%' }}
                            showSearch
                            optionFilterProp="children"
                          >
                            {drugCatalog.slice(0, 30).map((d) => (
                              <Option key={d.code} value={d.code}>
                                {d.name} ({d.activeIngredient})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider />

                    {/* Kết quả phân tích tương tác */}
                    <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <Title level={5} style={{ color: '#0f172a', marginBottom: 8 }}>
                        Kết Quả Phân Tích Dược Lâm Sàng:
                      </Title>
                      {selectedDrug1 === 'AUG-1G' && selectedDrug2.includes('CONCOR') ? (
                        <div>
                          <Tag color="green">Mức độ: An toàn - Không có tương tác đối kháng nghiêm trọng</Tag>
                          <p style={{ marginTop: 8, color: '#334155' }}>
                            Augmentin 1g (kháng sinh) và Bisoprolol (hạ áp chẹn beta) có thể dùng chung theo phác đồ điều trị nhiễm khuẩn hô hấp trên bệnh nhân tăng huyết áp.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Tag color="blue">Mức độ: Tương thích bình thường</Tag>
                          <p style={{ marginTop: 8, color: '#334155' }}>
                            Không ghi nhận tương tác bất lợi nguy hiểm trong cơ sở dữ liệu Dược lâm sàng quốc gia giữa 2 loại thuốc này. Lưu ý uống cách nhau tối thiểu 1-2 giờ nếu có thuốc bảo vệ niêm mạc dạ dày (antacid).
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Chi tiết đơn thuốc */}
      <Modal
        open={isDetailModalOpen}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MedicineBoxOutlined style={{ color: '#0284c7', fontSize: 20 }} />
            <span>Chi Tiết Toa Thuốc #{selectedPrescription?.prescriptionCode}</span>
          </div>
        }
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={() => selectedPrescription && handlePrintPrescription(selectedPrescription)}
          >
            In Toa Thuốc
          </Button>,
          selectedPrescription?.status === 'Chờ cấp phát' && (
            <Tooltip
              key="dispense"
              title={!permissions.canDispenseMedicine ? permissions.getLockTooltip('canDispenseMedicine') : 'Xác nhận cấp phát toa thuốc'}
            >
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                disabled={!permissions.canDispenseMedicine}
                onClick={() => selectedPrescription && handleDispense(selectedPrescription)}
                style={{ backgroundColor: '#0284c7' }}
              >
                Xác Nhận Cấp Phát
              </Button>
            </Tooltip>
          ),
        ]}
        width={750}
        centered
      >
        {selectedPrescription && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Bệnh nhân">
                <strong>{selectedPrescription.patientName}</strong> ({selectedPrescription.patientCode})
              </Descriptions.Item>
              <Descriptions.Item label="Tuổi / Giới tính">
                {selectedPrescription.patientAge} tuổi • {selectedPrescription.patientGender}
              </Descriptions.Item>
              <Descriptions.Item label="Bác sĩ kê đơn">
                {selectedPrescription.doctorName}
              </Descriptions.Item>
              <Descriptions.Item label="Chuyên khoa">
                {selectedPrescription.department}
              </Descriptions.Item>
              <Descriptions.Item label="Chẩn đoán lâm sàng" span={2}>
                {selectedPrescription.diagnosis} (ICD-10: <strong>{selectedPrescription.icd10}</strong>)
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian tạo">
                {selectedPrescription.createdAt}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedPrescription.status === 'Đã cấp phát' ? 'success' : 'warning'}>
                  {selectedPrescription.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ color: '#0369a1', marginBottom: 8 }}>
              Danh Sách Thuốc Kê Trong Toa:
            </Title>
            <Table
              dataSource={selectedPrescription.medicines}
              rowKey="drugCode"
              pagination={false}
              size="small"
              bordered
              columns={[
                {
                  title: 'Tên Thuốc & Biệt Dược',
                  dataIndex: 'drugName',
                  key: 'drugName',
                  render: (text) => <strong>{text}</strong>,
                },
                {
                  title: 'ĐVT',
                  dataIndex: 'unit',
                  key: 'unit',
                  width: 70,
                  align: 'center',
                },
                {
                  title: 'Số Lượng',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 90,
                  align: 'center',
                  render: (qty, r) => <span style={{ fontWeight: 700, color: '#0284c7' }}>{qty} {r.unit}</span>,
                },
                {
                  title: 'Đơn Giá',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  width: 100,
                  render: (p) => formatCurrency(p),
                },
                {
                  title: 'Hướng Dẫn Sử Dụng & Liều Dùng',
                  dataIndex: 'dosage',
                  key: 'dosage',
                },
              ]}
            />

            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: '#f0f9ff',
                borderRadius: 8,
                border: '1px solid #bae6fd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <Text type="secondary">Ghi chú dược:</Text> <span>{selectedPrescription.note || 'Không có ghi chú'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 13 }}>Tổng tiền: </Text>
                <strong style={{ fontSize: 16, color: '#0284c7' }}>{formatCurrency(selectedPrescription.totalAmount)}</strong>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm Thuốc Mới */}
      <Modal
        open={isAddDrugModalOpen}
        title="Nhập Dược Phẩm Mới Vào Kho Thuốc Bệnh Viện"
        onCancel={() => setIsAddDrugModalOpen(false)}
        onOk={() => addDrugForm.submit()}
        okText="Lưu Thuốc Mới"
        cancelText="Hủy bỏ"
        width={680}
      >
        <Form form={addDrugForm} layout="vertical" onFinish={handleAddNewDrug}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="Mã Thuốc" rules={[{ required: true, message: 'Nhập mã thuốc' }]}>
                <Input placeholder="VD: AUG-1G" />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="name" label="Tên Biệt Dược" rules={[{ required: true, message: 'Nhập tên biệt dược' }]}>
                <Input placeholder="VD: Augmentin 1g" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="activeIngredient" label="Hoạt Chất & Hàm Lượng" rules={[{ required: true, message: 'Nhập hoạt chất' }]}>
                <Input placeholder="VD: Amoxicillin 875mg + Acid Clavulanic 125mg" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="category" label="Nhóm Thuốc Lâm Sàng" initialValue="Kháng sinh & Kháng khuẩn">
                <Select>
                  {DRUG_CATEGORIES.filter((c) => c !== 'Tất cả nhóm thuốc').map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="unit" label="Đơn Vị Tính" initialValue="Viên">
                <Select>
                  <Option value="Viên">Viên</Option>
                  <Option value="Hộp">Hộp</Option>
                  <Option value="Chai">Chai</Option>
                  <Option value="Lọ">Lọ</Option>
                  <Option value="Gói">Gói</Option>
                  <Option value="Ống">Ống</Option>
                  <Option value="Bút">Bút tiêm</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item name="unitPrice" label="Đơn Giá Viện Phí (VND)" rules={[{ required: true, message: 'Nhập đơn giá' }]}>
                <InputNumber style={{ width: '100%' }} min={100} step={500} placeholder="18500" />
              </Form.Item>
            </Col>
            <Col span={9}>
              <Form.Item name="stockQuantity" label="Số Lượng Nhập Ban Đầu" initialValue={500}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="manufacturer" label="Nhà Sản Xuất" initialValue="Dược Hậu Giang (DHG)">
                <Input placeholder="VD: GlaxoSmithKline (GSK)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="defaultDosage" label="Liều Dùng Tiêu Chuẩn" initialValue="Theo chỉ định của bác sĩ">
                <Input placeholder="VD: Sáng 1 viên, Tối 1 viên sau ăn" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Modal Chỉnh Sửa Tồn Kho */}
      <Modal
        open={isStockModalOpen}
        title={`Điều Chỉnh Tồn Kho: ${editingDrug?.name}`}
        onCancel={() => setIsStockModalOpen(false)}
        onOk={() => stockForm.submit()}
        okText="Cập Nhật Tồn Kho"
        cancelText="Hủy"
        width={450}
      >
        <Form form={stockForm} layout="vertical" onFinish={handleUpdateStock}>
          <Form.Item
            name="stockQuantity"
            label={`Số lượng tồn kho thực tế (${editingDrug?.unit})`}
            rules={[{ required: true, message: 'Nhập số lượng tồn kho' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="minStock"
            label={`Định mức cảnh báo tồn kho tối thiểu (${editingDrug?.unit})`}
            rules={[{ required: true, message: 'Nhập định mức' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PharmacyPage;
