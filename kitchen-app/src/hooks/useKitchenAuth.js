import { useAuthStore } from '../store/useAuthStore';

export function useKitchenAuth() {
  const { user, isAuthenticated, isLoading, error, login, logout, checkAuth, clearError } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
  };
}
