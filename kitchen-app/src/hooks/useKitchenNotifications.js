import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notification.api';

export function useKitchenNotifications(unreadOnly = false) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['kitchen-notifications', unreadOnly],
    queryFn: () => notificationApi.getNotifications(unreadOnly),
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-notifications'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-notifications'] }),
  });

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    refetch: notificationsQuery.refetch,

    markAsRead: (id) => markReadMutation.mutateAsync(id),
    deleteNotification: (id) => deleteMutation.mutateAsync(id),
  };
}
