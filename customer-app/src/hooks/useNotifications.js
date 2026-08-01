import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notification.api';
import { useAuthStore } from '../store/useAuthStore';

export function useNotifications() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,

    markAsRead: markReadMutation.mutateAsync,
    deleteNotification: deleteMutation.mutateAsync,
    refetch: notificationsQuery.refetch,
  };
}
