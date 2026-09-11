import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '../api/adminApi';

// Dashboard Hooks
export function useAdminDashboard() {
  const statsQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const hourlyQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'hourly'],
    queryFn: () => adminApi.getHourlyRevenue(),
    refetchInterval: 30000,
  });

  const categorySalesQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'category-sales'],
    queryFn: () => adminApi.getCategorySales(),
    refetchInterval: 30000,
  });

  return {
    metrics: statsQuery.data,
    isLoading: statsQuery.isLoading,
    isFetching: statsQuery.isFetching,
    error: statsQuery.error,
    refetch: statsQuery.refetch,

    hourlySeries: hourlyQuery.data || [],
    categorySales: categorySalesQuery.data || [],
  };
}

// Analytics Hook
export function useRevenueAnalytics(startDate, endDate) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'revenue', startDate, endDate],
    queryFn: () => adminApi.getRevenueAnalytics(startDate, endDate),
  });
}

// Orders Hook
export function useAdminOrders(filters = {}) {
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', filters],
    queryFn: () => adminApi.getOrders(filters),
    refetchInterval: 15000,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }) => adminApi.cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  return {
    ordersData: ordersQuery.data,
    isLoading: ordersQuery.isLoading,
    isFetching: ordersQuery.isFetching,
    error: ordersQuery.error,
    refetch: ordersQuery.refetch,
    cancelOrder: cancelOrderMutation.mutateAsync,
    isCancelling: cancelOrderMutation.isPending,
  };
}

// Payments Hook
export function useAdminPayments(filters = {}) {
  const queryClient = useQueryClient();
  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments', filters],
    queryFn: () => adminApi.getPayments(filters),
  });

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, amount, reason }) => adminApi.refundPayment(paymentId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });

  return {
    payments: paymentsQuery.data || [],
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    refetch: paymentsQuery.refetch,
    refundPayment: refundMutation.mutateAsync,
    isRefunding: refundMutation.isPending,
  };
}

// Customers Hook
export function useAdminCustomers(filters = {}) {
  return useQuery({
    queryKey: ['admin', 'customers', filters],
    queryFn: () => adminApi.getCustomers(filters),
  });
}

// Staff Hook
export function useAdminStaff(filters = {}) {
  const queryClient = useQueryClient();

  const staffQuery = useQuery({
    queryKey: ['admin', 'staff', filters],
    queryFn: () => adminApi.getStaff(filters),
  });

  const createStaffMutation = useMutation({
    mutationFn: (data) => adminApi.createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ staffId, data }) => adminApi.updateStaff(staffId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
  });

  return {
    staffList: staffQuery.data || [],
    isLoading: staffQuery.isLoading,
    error: staffQuery.error,
    refetch: staffQuery.refetch,
    createStaff: createStaffMutation.mutateAsync,
    isCreating: createStaffMutation.isPending,
    updateStaff: updateStaffMutation.mutateAsync,
    isUpdating: updateStaffMutation.isPending,
  };
}

// Complaints Hook
export function useAdminComplaints(filters = {}) {
  const queryClient = useQueryClient();

  const complaintsQuery = useQuery({
    queryKey: ['admin', 'complaints', filters],
    queryFn: () => adminApi.getComplaints(filters),
  });

  const updateComplaintMutation = useMutation({
    mutationFn: ({ complaintId, data }) => adminApi.updateComplaint(complaintId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
    },
  });

  return {
    complaintsData: complaintsQuery.data,
    isLoading: complaintsQuery.isLoading,
    error: complaintsQuery.error,
    refetch: complaintsQuery.refetch,
    updateComplaint: updateComplaintMutation.mutateAsync,
    isUpdating: updateComplaintMutation.isPending,
  };
}

// Coupons Hook
export function useAdminCoupons() {
  const queryClient = useQueryClient();

  const couponsQuery = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => adminApi.getCoupons(),
  });

  const createCouponMutation = useMutation({
    mutationFn: (data) => adminApi.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });

  const updateCouponMutation = useMutation({
    mutationFn: ({ couponId, data }) => adminApi.updateCoupon(couponId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: (couponId) => adminApi.deleteCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });

  return {
    coupons: couponsQuery.data || [],
    isLoading: couponsQuery.isLoading,
    error: couponsQuery.error,
    refetch: couponsQuery.refetch,
    createCoupon: createCouponMutation.mutateAsync,
    updateCoupon: updateCouponMutation.mutateAsync,
    deleteCoupon: deleteCouponMutation.mutateAsync,
  };
}

// Restaurant Settings Hook
export function useRestaurantSettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['admin', 'restaurant'],
    queryFn: () => adminApi.getRestaurantSettings(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => adminApi.updateRestaurantSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurant'] });
    },
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    error: settingsQuery.error,
    updateSettings: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
  };
}

// Reports Hook
export function useAdminReports(reportType, startDate, endDate) {
  return useQuery({
    queryKey: ['admin', 'reports', reportType, startDate, endDate],
    queryFn: () => adminApi.getReport(reportType, startDate, endDate),
  });
}
