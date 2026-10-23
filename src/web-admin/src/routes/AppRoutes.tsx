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

  // Kiểm tra vai trò Admin
  const isAdmin = user?.vaiTro?.some((r) => r.toLowerCase() === 'admin');

  // Kiểm tra vai trò: Cán bộ y tế & Quản trị viên nội bộ mới được vào hệ thống quản lý nội bộ
  const isStaffOrAdmin = user?.vaiTro?.some((r) =>
    ['Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(r)
  );

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
                  <Route path="/reception" element={<ReceptionPage />} />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/booking" element={<PatientBookingPage />} />
                  <Route path="/patients" element={<PatientsPage />} />
                  <Route path="/examinations" element={<ExaminationsPage />} />
                  <Route path="/cls-pacs" element={<ExaminationsPage />} />
                  <Route path="/pharmacy" element={<CatalogsPage />} />
                  <Route path="/insurance" element={<BillingPage />} />
                  <Route path="/emr" element={<MedicalRecordsPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/ai-assistant" element={<AIAssistantPage />} />
                  <Route path="/catalogs" element={<CatalogsPage />} />
                  <Route
                    path="/accounts"
                    element={isAdmin ? <AccountsPage /> : <Navigate to="/dashboard" replace />}
                  />
                  <Route path="/audit-logs" element={<AuditLogPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
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

