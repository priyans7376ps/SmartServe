import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile.api';
import { useAuthStore } from '../store/useAuthStore';

export function useProfile() {
  const queryClient = useQueryClient();
  const { isAuthenticated, updateUser } = useAuthStore();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => profileApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => profileApi.changePassword(data),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => profileApi.deleteAccount(),
    onSuccess: () => {
      useAuthStore.getState().logout();
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,

    updateProfile: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,

    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,

    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeletingAccount: deleteAccountMutation.isPending,

    refetchProfile: profileQuery.refetch,
  };
}
