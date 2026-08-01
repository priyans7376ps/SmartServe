import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '../api/menu.api';

export function useKitchenMenu(params = {}) {
  const queryClient = useQueryClient();

  const menuQuery = useQuery({
    queryKey: ['kitchen-menu', params],
    queryFn: () => menuApi.getMenuItems(params),
    staleTime: 10000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => menuApi.createMenuItem(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-menu'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => menuApi.updateMenuItem(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-menu'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => menuApi.deleteMenuItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-menu'] }),
  });

  return {
    items: menuQuery.data || [],
    isLoading: menuQuery.isLoading,
    isError: menuQuery.isError,
    refetch: menuQuery.refetch,

    createMenuItem: (data) => createMutation.mutateAsync(data),
    updateMenuItem: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteMenuItem: (id) => deleteMutation.mutateAsync(id),

    isSubmitting: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
