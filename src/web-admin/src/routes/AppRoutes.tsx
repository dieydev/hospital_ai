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
import { NotFoundPage } from '../pages/NotFoundPage';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useAuthStore } from '../store/useAuthStore';

export const AppRoutes: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  const isAdmin = Boolean(user?.vaiTro?.some((r) => r.toLowerCase() === 'admin'));
  const isDoctor = Boolean(user?.vaiTro?.some((r) => r.toLowerCase() === 'doctor'));
  const isNurseOrReceptionist = Boolean(user?.vaiTro?.some((r) =>
    ['nurse', 'receptionist'].includes(r.toLowerCase())
  ));

  // Kiểm tra vai trò: Cán bộ y tế & Quản trị viên nội bộ mới được vào hệ thống quản lý nội bộ
  const isStaffOrAdmin = isAdmin || isDoctor || isNurseOrReceptionist;

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

        {/* 404 Trang không tìm thấy */}
        <Route path="/404" element={<NotFoundPage />} />

        {/* Protected Routes dành cho Quản trị viên & Cán bộ y tế */}
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

                  {/* Tiếp đón: Admin, Lễ tân, Điều dưỡng */}
                  <Route
                    path="/reception"
                    element={isAdmin || isNurseOrReceptionist ? <ReceptionPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route
                    path="/booking"
                    element={isAdmin || isNurseOrReceptionist ? <PatientBookingPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route path="/patients" element={<PatientsPage />} />

                  {/* Lâm sàng & Chẩn đoán: Admin, Bác sĩ */}
                  <Route
                    path="/examinations"
                    element={isAdmin || isDoctor ? <ExaminationsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/cls-pacs"
                    element={isAdmin || isDoctor ? <ExaminationsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/emr"
                    element={isAdmin || isDoctor ? <MedicalRecordsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/ai-assistant"
                    element={isAdmin || isDoctor ? <AIAssistantPage /> : <Navigate to="/dashboard" replace />}
                  />

                  {/* Dược & Nhà thuốc BV: Tra cứu cho cán bộ nội bộ */}
                  <Route path="/pharmacy" element={<CatalogsPage />} />

                  {/* Tài chính & Viện phí: Admin, Lễ tân, Thu ngân, Điều dưỡng */}
                  <Route
                    path="/billing"
                    element={isAdmin || isNurseOrReceptionist ? <BillingPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/insurance"
                    element={isAdmin || isNurseOrReceptionist ? <BillingPage /> : <Navigate to="/dashboard" replace />}
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

                  {/* Thống kê & Báo cáo BI: Admin và Bác sĩ */}
                  <Route
                    path="/reports"
                    element={isAdmin || isDoctor ? <ReportsPage /> : <Navigate to="/dashboard" replace />}
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

