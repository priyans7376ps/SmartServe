import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import Loader from '../common/Loader';

export const ProtectedRoute = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  // initialChecking prevents a flash of the login redirect while checkAuth runs
  const [initialChecking, setInitialChecking] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => setInitialChecking(false));
  }, []);

  if (initialChecking) {
    return <Loader fullPage label="Verifying admin session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
