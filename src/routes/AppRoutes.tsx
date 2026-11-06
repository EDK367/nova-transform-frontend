import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTE_POLICIES } from '@/security/route-policies';

// Pages
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { UsersPage } from '@/pages/UsersPage';
import { RolesPage } from '@/pages/RolesPage';
import { MembersPage } from '@/pages/MembersPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { ReceptionistsPage } from '@/pages/ReceptionistsPage';
import { TrainersPage } from '@/pages/TrainersPage';
import { SpecializationsPage } from '@/pages/SpecializationsPage';
import { TrainerAssignmentsPage } from '@/pages/TrainerAssignmentsPage';
import { ExercisesPage } from '@/pages/ExercisesPage';
import { RoutinesPage } from '@/pages/RoutinesPage';
import { WorkoutLogsPage } from '@/pages/WorkoutLogsPage';
import { GoalsPage } from '@/pages/GoalsPage';
import { PhysicalMeasurementsPage } from '@/pages/PhysicalMeasurementsPage';
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
import { ReportsPage } from '@/pages/ReportsPage';
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
        <Route
          path="dashboard"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.dashboard.policy}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Administration */}
        <Route
          path="branches"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.branches.policy}>
              <BranchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.users.policy}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="roles"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.roles.policy}>
              <RolesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="receptionists"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.receptionists.policy}>
              <ReceptionistsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="members"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.members.policy}>
              <MembersPage />
            </ProtectedRoute>
          }
        />

        {/* Memberships (Exclusivo Administración / Recepción) */}
        <Route
          path="memberships"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.memberships.policy}>
              <MembershipsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="plans"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.plans.policy}>
              <PlansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="benefits"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.benefits.policy}>
              <BenefitsPage />
            </ProtectedRoute>
          }
        />

        {/* Training */}
        <Route
          path="trainers"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.trainers.policy}>
              <TrainersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="specializations"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.specializations.policy}>
              <SpecializationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="trainer-assignments"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.trainerAssignments.policy}>
              <TrainerAssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="exercises"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.exercises.policy}>
              <ExercisesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="routines"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.routines.policy}>
              <RoutinesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="workout-logs"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.workoutLogs.policy}>
              <WorkoutLogsPage />
            </ProtectedRoute>
          }
        />

        {/* Health & Goals */}
        <Route
          path="goals"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.goals.policy}>
              <GoalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="physical-measurements"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.physicalMeasurements.policy}>
              <PhysicalMeasurementsPage />
            </ProtectedRoute>
          }
        />

        {/* Classes and Access */}
        <Route
          path="classes"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.classes.policy}>
              <ClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="class-types"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.classTypes.policy}>
              <ClassTypesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="attendances"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.attendances.policy}>
              <AttendancesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="waitlists"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.waitlists.policy}>
              <WaitlistsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ratings"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.ratings.policy}>
              <RatingsPage />
            </ProtectedRoute>
          }
        />

        {/* Finances & Reports (Exclusivo Administración / Recepción) */}
        <Route
          path="invoices"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.invoices.policy}>
              <InvoicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payment-receipts"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.paymentReceipts.policy}>
              <PaymentReceiptsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="payment-methods"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.paymentMethods.policy}>
              <PaymentMethodsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="promotions"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.promotions.policy}>
              <PromotionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute policy={ROUTE_POLICIES.reports.policy}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* User Profile */}
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
