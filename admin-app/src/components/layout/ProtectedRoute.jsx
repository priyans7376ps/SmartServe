import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import Loader from '../common/Loader';

export const ProtectedRoute = () => {
  const { isAuthenticated, checkAuth, loading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return <Loader fullPage label="Verifying admin session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
