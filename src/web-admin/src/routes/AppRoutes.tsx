import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ReceptionPage } from '../pages/ReceptionPage';
import { PatientsPage } from '../pages/PatientsPage';
import { ExaminationsPage } from '../pages/ExaminationsPage';
import { MedicalRecordsPage } from '../pages/MedicalRecordsPage';
import { BillingPage } from '../pages/BillingPage';
import { AIAssistantPage } from '../pages/AIAssistantPage';
import { CatalogsPage } from '../pages/CatalogsPage';
import { PharmacyPage } from '../pages/PharmacyPage';
import { AccountsPage } from '../pages/AccountsPage';
import { AuditLogPage } from '../pages/AuditLogPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { PatientHomePage } from '../pages/PatientHomePage';
import { PatientBookingPage } from '../pages/PatientBookingPage';
import { AboutPage } from '../pages/AboutPage';
import { NewsPage } from '../pages/NewsPage';
import { GuidePage } from '../pages/GuidePage';
import { DepartmentsPage } from '../pages/DepartmentsPage';
import { DoctorsPage } from '../pages/DoctorsPage';
import { PackagesPage } from '../pages/PackagesPage';
import { KioskPage } from '../pages/KioskPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuthStore } from '../store/useAuthStore';

export const AppRoutes: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const checkRole = (names: string[]) => {
    const lowerNames = names.map((n) => n.toLowerCase());
    return Boolean(user?.vaiTro?.some((r) => lowerNames.includes(r.toLowerCase())));
  };

  const isAdmin = checkRole(['Admin', 'Quản trị viên']);
  const isDoctor = checkRole(['Doctor', 'Bác sĩ']);
  const isReceptionist = checkRole(['Receptionist', 'Nhân viên tiếp nhận', 'Lễ tân']);
  const isTriage = checkRole(['Triage', 'Nhân viên sàng lọc bệnh']);
  const isPharmacy = checkRole(['Pharmacy', 'Nhà thuốc', 'Dược sĩ']);
  const isNurse = checkRole(['Nurse', 'Y tế', 'Nhân viên y tế']);
  const isCashier = checkRole(['Cashier', 'Thu ngân']);

  // Kiểm tra vai trò: Cán bộ y tế & Quản trị viên trong 7 vai trò nội bộ mới được vào hệ thống quản lý
  const isStaffOrAdmin =
    isAdmin || isDoctor || isReceptionist || isTriage || isPharmacy || isNurse || isCashier;

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Root path "/" — Cán bộ y tế vào Dashboard, Người bệnh & Khách vào Trang chủ Cổng Y Tế */}
        <Route
          path="/"
          element={
            isStaffOrAdmin ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <PatientHomePage />
            )
          }
        />
        <Route path="/home" element={<PatientHomePage />} />
        <Route path="/trang-chu" element={<PatientHomePage />} />

        {/* Public Patient Booking & Information Portal Routes */}
        <Route path="/booking" element={<PatientBookingPage />} />
        <Route path="/dat-lich" element={<PatientBookingPage />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/chuyen-khoa" element={<DepartmentsPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/bac-si" element={<DoctorsPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/goi-kham" element={<PackagesPage />} />
        <Route path="/packages" element={<PackagesPage />} />
        <Route path="/tin-tuc" element={<NewsPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/huong-dan" element={<GuidePage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/kiosk" element={<KioskPage />} />
        <Route path="/kiosk-cap-stt" element={<KioskPage />} />

        {/* 404 Trang không tìm thấy */}
        <Route path="/404" element={<NotFoundPage />} />

        {/* Protected Routes dành cho Quản trị viên & 7 Vai trò nhân sự */}
        <Route
          path="/*"
          element={
            !user ? (
              <NotFoundPage />
            ) : !isStaffOrAdmin ? (
              <NotFoundPage />
            ) : (
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* Tiếp nhận & Cấp số: Admin, Nhân viên tiếp nhận, Nhân viên sàng lọc bệnh, Y tế */}
                  <Route
                    path="/reception"
                    element={isAdmin || isReceptionist || isTriage || isNurse ? <ReceptionPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/appointments"
                    element={isAdmin || isDoctor || isReceptionist || isTriage || isNurse || isCashier ? <AppointmentsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/booking"
                    element={isAdmin || isReceptionist || isTriage ? <PatientBookingPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/patients"
                    element={isAdmin || isDoctor || isReceptionist || isTriage || isPharmacy || isNurse || isCashier ? <PatientsPage /> : <Navigate to="/dashboard" replace />}
                  />

                  {/* Lâm sàng & Chẩn đoán: Admin, Bác sĩ, Y tế */}
                  <Route
                    path="/examinations"
                    element={isAdmin || isDoctor || isNurse ? <ExaminationsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/cls-pacs"
                    element={isAdmin || isDoctor || isNurse ? <ExaminationsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/emr"
                    element={isAdmin || isDoctor || isNurse ? <MedicalRecordsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/ai-assistant"
                    element={isAdmin || isDoctor ? <AIAssistantPage /> : <Navigate to="/dashboard" replace />}
                  />

                  {/* Dược & Nhà thuốc BV: Admin, Nhà thuốc, Bác sĩ, Y tế */}
                  <Route
                    path="/pharmacy"
                    element={isAdmin || isPharmacy || isDoctor || isNurse ? <PharmacyPage /> : <Navigate to="/dashboard" replace />}
                  />

                  {/* Tài chính & Viện phí: Admin, Thu ngân, Nhân viên tiếp nhận */}
                  <Route
                    path="/billing"
                    element={isAdmin || isCashier || isReceptionist ? <BillingPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/insurance"
                    element={isAdmin || isCashier || isReceptionist ? <BillingPage /> : <Navigate to="/dashboard" replace />}
                  />

                  {/* Quản trị & Cấu hình: CHỈ DÀNH CHO ADMIN */}
                  <Route
                    path="/accounts"
                    element={isAdmin ? <AccountsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/catalogs"
                    element={isAdmin ? <CatalogsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/audit-logs"
                    element={isAdmin ? <AuditLogPage /> : <Navigate to="/dashboard" replace />}
                  />

                  {/* Thống kê & Báo cáo BI: Admin, Bác sĩ, Thu ngân */}
                  <Route
                    path="/reports"
                    element={isAdmin || isDoctor || isCashier ? <ReportsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </MainLayout>
            )
          }
        />
      </Routes>
    </ErrorBoundary>
  );
};

