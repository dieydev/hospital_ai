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
import { AuditLogPage } from '../pages/AuditLogPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AppointmentsPage } from '../pages/AppointmentsPage';
import { PatientBookingPage } from '../pages/PatientBookingPage';
import { useAuthStore } from '../store/useAuthStore';

export const AppRoutes: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  // Kiểm tra vai trò: Cán bộ y tế & Quản trị viên nội bộ mới được vào hệ thống quản lý nội bộ
  const isStaffOrAdmin = user?.vaiTro?.some((r) =>
    ['Admin', 'Doctor', 'Nurse', 'Receptionist'].includes(r)
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Public Patient Booking Portal Routes (Dành cho bệnh nhân đặt lịch & tra cứu) */}
      <Route path="/booking" element={<PatientBookingPage />} />
      <Route path="/dat-lich" element={<PatientBookingPage />} />

      {/* Protected Routes dành cho Quản trị viên & Cán bộ y tế */}
      <Route
        path="/*"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : !isStaffOrAdmin ? (
            // Nếu người dùng chỉ có quyền Patient, tự động chuyển hướng đến Cổng đặt khám bệnh nhân
            <Navigate to="/booking" replace />
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
                <Route path="/audit-logs" element={<AuditLogPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          )
        }
      />
    </Routes>
  );
};
