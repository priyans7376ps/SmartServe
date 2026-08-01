import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/auth.api';

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, error, login, signup, guestLogin, logout } = useAuthStore();

  const statusQuery = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: authApi.getStatus,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const guestLoginMutation = useMutation({
    mutationFn: (sessionId) => guestLogin(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: ({ fullName, email, password, phone }) => signup(fullName, email, password, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || statusQuery.isLoading,
    error,
    guestLogin: guestLoginMutation.mutateAsync,
    isGuestLoggingIn: guestLoginMutation.isPending,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,
    logout,
  };
}
