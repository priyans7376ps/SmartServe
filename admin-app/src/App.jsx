import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Loader from './components/common/Loader';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

// Lazy loading feature pages for optimal code splitting & performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CouponsPage = lazy(() => import('./pages/CouponsPage'));
const ComplaintsPage = lazy(() => import('./pages/ComplaintsPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));
const RestaurantSettingsPage = lazy(() => import('./pages/RestaurantSettingsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/ErrorPages').then(module => ({ default: module.NotFoundPage })));
const ServerErrorPage = lazy(() => import('./pages/ErrorPages').then(module => ({ default: module.ServerErrorPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<Loader fullPage label="Loading SmartServe Admin Panel..." />}>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/coupons" element={<CouponsPage />} />
                <Route path="/complaints" element={<ComplaintsPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/settings" element={<RestaurantSettingsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/500" element={<ServerErrorPage />} />
              </Route>
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
