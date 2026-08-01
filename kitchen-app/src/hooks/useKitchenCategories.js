import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../api/category.api';

export function useKitchenCategories(restaurantId = null) {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['kitchen-categories', restaurantId],
    queryFn: () => categoryApi.getCategories(restaurantId),
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => categoryApi.createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-categories'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoryApi.updateCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryApi.deleteCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-categories'] }),
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    refetch: categoriesQuery.refetch,

    createCategory: (data) => createMutation.mutateAsync(data),
    updateCategory: (id, data) => updateMutation.mutateAsync({ id, data }),
    deleteCategory: (id) => deleteMutation.mutateAsync(id),

    isSubmitting: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
