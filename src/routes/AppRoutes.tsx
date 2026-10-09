import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { SignInPage } from '../features/auth/SignInPage';
import { SignUpPage } from '../features/auth/SignUpPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { UpdatePasswordPage } from '../features/auth/UpdatePasswordPage';
import { NotFoundPage } from '../features/not-found/NotFoundPage';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// Route-level code splitting for analytical & dashboard modules
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ExperimentsPage = lazy(() =>
  import('../features/experiments/pages/ExperimentsPage').then((m) => ({
    default: m.ExperimentsPage,
  }))
);
const ExperimentDetailPage = lazy(() =>
  import('../features/experiments/pages/ExperimentDetailPage').then((m) => ({
    default: m.ExperimentDetailPage,
  }))
);
const CampaignsPage = lazy(() =>
  import('../features/campaigns/CampaignsPage').then((m) => ({ default: m.CampaignsPage }))
);
const AnalyticsPage = lazy(() =>
  import('../features/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<SignInPage />} />
      <Route path="/register" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<UpdatePasswordPage />} />

      {/* Protected App Routes with Suspense Fallback */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<LoadingSpinner fullPage message="Loading Dashboard..." />}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="/experiments"
            element={
              <Suspense fallback={<LoadingSpinner fullPage message="Loading Experiments..." />}>
                <ExperimentsPage />
              </Suspense>
            }
          />
          <Route
            path="/experiments/:id"
            element={
              <Suspense fallback={<LoadingSpinner fullPage message="Evaluating Experiment..." />}>
                <ExperimentDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/campaigns"
            element={
              <Suspense fallback={<LoadingSpinner fullPage message="Loading Campaigns..." />}>
                <CampaignsPage />
              </Suspense>
            }
          />
          <Route
            path="/analytics"
            element={
              <Suspense fallback={<LoadingSpinner fullPage message="Aggregating Analytics..." />}>
                <AnalyticsPage />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<LoadingSpinner fullPage message="Loading Store Settings..." />}>
                <SettingsPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
