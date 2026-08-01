import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loyaltyApi } from '../api/loyalty.api';
import { useAuthStore } from '../store/useAuthStore';

export function useLoyalty() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const loyaltyQuery = useQuery({
    queryKey: ['loyalty'],
    queryFn: loyaltyApi.getLoyalty,
    enabled: isAuthenticated,
  });

  const transactionsQuery = useQuery({
    queryKey: ['loyalty', 'transactions'],
    queryFn: () => loyaltyApi.getTransactions(),
    enabled: isAuthenticated,
  });

  const rewardsQuery = useQuery({
    queryKey: ['loyalty', 'rewards'],
    queryFn: loyaltyApi.getRewards,
    enabled: isAuthenticated,
  });

  const redeemMutation = useMutation({
    mutationFn: (rewardId) => loyaltyApi.redeemReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty'] });
    },
  });

  return {
    loyalty: loyaltyQuery.data,
    isLoadingLoyalty: loyaltyQuery.isLoading,

    transactions: transactionsQuery.data || [],
    isLoadingTransactions: transactionsQuery.isLoading,

    rewards: rewardsQuery.data || [],
    isLoadingRewards: rewardsQuery.isLoading,

    redeemReward: redeemMutation.mutateAsync,
    isRedeeming: redeemMutation.isPending,
  };
}
