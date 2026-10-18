import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { UsersPage } from '@/pages/UsersPage';
import { RolesPage } from '@/pages/RolesPage';
import { MembersPage } from '@/pages/MembersPage';
import { MembershipsPage } from '@/pages/MembershipsPage';
import { PlansPage } from '@/pages/PlansPage';
import { BenefitsPage } from '@/pages/BenefitsPage';
import { ClassesPage } from '@/pages/ClassesPage';
import { ClassTypesPage } from '@/pages/ClassTypesPage';
import { AttendancesPage } from '@/pages/AttendancesPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { PaymentReceiptsPage } from '@/pages/PaymentReceiptsPage';
import { PaymentMethodsPage } from '@/pages/PaymentMethodsPage';
import { PromotionsPage } from '@/pages/PromotionsPage';
import { WaitlistsPage } from '@/pages/WaitlistsPage';
import { RatingsPage } from '@/pages/RatingsPage';
import { ProfilePage } from '@/pages/ProfilePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes wrapped in MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Administration */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="roles"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="members"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPCIONISTA']}>
              <MembersPage />
            </ProtectedRoute>
          }
        />

        {/* Memberships */}
        <Route
          path="memberships"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPCIONISTA', 'CLIENTE']}>
              <MembershipsPage />
            </ProtectedRoute>
          }
        />
        <Route path="plans" element={<PlansPage />} />
        <Route path="benefits" element={<BenefitsPage />} />

        {/* Classes and Access */}
        <Route path="classes" element={<ClassesPage />} />
        <Route path="class-types" element={<ClassTypesPage />} />
        <Route path="attendances" element={<AttendancesPage />} />
        <Route
          path="waitlists"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPCIONISTA', 'CLIENTE']}>
              <WaitlistsPage />
            </ProtectedRoute>
          }
        />
        <Route path="ratings" element={<RatingsPage />} />

        {/* Finances */}
        <Route
          path="invoices"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPCIONISTA', 'CLIENTE']}>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payment-receipts"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPCIONISTA', 'CLIENTE']}>
              <PaymentReceiptsPage />
            </ProtectedRoute>
          }
        />
        <Route path="payment-methods" element={<PaymentMethodsPage />} />
        <Route path="promotions" element={<PromotionsPage />} />

        {/* User Profile */}
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
