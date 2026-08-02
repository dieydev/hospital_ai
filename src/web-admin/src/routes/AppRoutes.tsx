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
import { useAuthStore } from '../store/useAuthStore';

export const AppRoutes: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          user ? (
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/reception" element={<ReceptionPage />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/examinations" element={<ExaminationsPage />} />
                <Route path="/emr" element={<MedicalRecordsPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/ai-assistant" element={<AIAssistantPage />} />
                <Route path="/catalogs" element={<CatalogsPage />} />
                <Route path="/audit-logs" element={<AuditLogPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </MainLayout>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};
