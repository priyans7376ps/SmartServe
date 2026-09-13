import api from './axios';

export const adminApi = {
  // Auth & Status
  getAdminStatus: async () => {
    const res = await api.get('/admin/status');
    return res.data;
  },

  // Dashboard Analytics
  getDashboardStats: async () => {
    const res = await api.get('/admin/dashboard/stats');
    return res.data;
  },

  getHourlyRevenue: async () => {
    const res = await api.get('/admin/dashboard/hourly');
    return res.data;
  },

  getCategorySales: async () => {
    const res = await api.get('/admin/dashboard/category-sales');
    return res.data;
  },

  getDashboardOverview: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  // Revenue Analytics
  getRevenueAnalytics: async (timeframe = 'daily', startDate, endDate) => {
    const params = { timeframe };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get('/admin/analytics/revenue', { params });
    return res.data;
  },

  // Orders Management
  getOrders: async ({
    query,
    status,
    paymentStatus,
    paymentMethod,
    dateFrom,
    dateTo,
    skip = 0,
    limit = 50,
  } = {}) => {
    const params = { skip, limit };
    if (query) params.query = query;
    if (status && status !== 'all') params.status = status;
    if (paymentStatus && paymentStatus !== 'all') params.payment_status = paymentStatus;
    if (paymentMethod && paymentMethod !== 'all') params.payment_method = paymentMethod;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    const res = await api.get('/admin/orders', { params });
    return res.data;
  },

  getOrder: async (orderId) => {
    const res = await api.get(`/admin/orders/${orderId}`);
    return res.data;
  },

  updateOrderStatus: async (orderId, statusData) => {
    const res = await api.patch(`/admin/orders/${orderId}/status`, statusData);
    return res.data;
  },

  cancelOrder: async (orderId, reason) => {
    const res = await api.post(`/admin/orders/${orderId}/cancel`, { reason });
    return res.data;
  },

  // Payments Management
  getPayments: async ({ query, status, method, skip = 0, limit = 50 } = {}) => {
    const params = { skip, limit };
    if (query) params.query = query;
    if (status && status !== 'all') params.status = status;
    if (method && method !== 'all') params.method = method;
    const res = await api.get('/admin/payments', { params });
    return res.data;
  },

  refundPayment: async (paymentId, amount, reason) => {
    const res = await api.post(`/admin/payments/${paymentId}/refund`, { amount, reason });
    return res.data;
  },

  // Customers Management
  getCustomers: async ({ query, skip = 0, limit = 50 } = {}) => {
    const params = { skip, limit };
    if (query) params.query = query;
    const res = await api.get('/admin/customers', { params });
    return res.data;
  },

  getCustomer: async (customerId) => {
    const res = await api.get(`/admin/customers/${customerId}`);
    return res.data;
  },

  // Staff Management
  getStaff: async ({ query, role, skip = 0, limit = 50 } = {}) => {
    const params = { skip, limit };
    if (query) params.query = query;
    if (role && role !== 'all') params.role = role;
    const res = await api.get('/admin/staff', { params });
    return res.data;
  },

  getStaffMember: async (staffId) => {
    const res = await api.get(`/admin/staff/${staffId}`);
    return res.data;
  },

  createStaff: async (staffData) => {
    const res = await api.post('/admin/staff', staffData);
    return res.data;
  },

  updateStaff: async (staffId, staffData) => {
    const res = await api.put(`/admin/staff/${staffId}`, staffData);
    return res.data;
  },

  // Complaints Management
  getComplaints: async ({ query, status, priority, skip = 0, limit = 50 } = {}) => {
    const params = { skip, limit };
    if (query) params.query = query;
    if (status && status !== 'all') params.status = status;
    if (priority && priority !== 'all') params.priority = priority;
    const res = await api.get('/admin/complaints', { params });
    return res.data;
  },

  getComplaint: async (complaintId) => {
    const res = await api.get(`/admin/complaints/${complaintId}`);
    return res.data;
  },

  updateComplaint: async (complaintId, updateData) => {
    const res = await api.patch(`/admin/complaints/${complaintId}`, updateData);
    return res.data;
  },

  // Coupons Management
  getCoupons: async () => {
    const res = await api.get('/admin/coupons');
    return res.data;
  },

  getCoupon: async (couponId) => {
    const res = await api.get(`/admin/coupons/${couponId}`);
    return res.data;
  },

  createCoupon: async (couponData) => {
    const res = await api.post('/admin/coupons', couponData);
    return res.data;
  },

  updateCoupon: async (couponId, couponData) => {
    const res = await api.put(`/admin/coupons/${couponId}`, couponData);
    return res.data;
  },

  deleteCoupon: async (couponId) => {
    const res = await api.delete(`/admin/coupons/${couponId}`);
    return res.data;
  },

  // Reports
  getReport: async (reportType, startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get(`/admin/reports/${reportType}`, { params });
    return res.data;
  },

  downloadReportCSV: async (reportType, startDate, endDate) => {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get(`/admin/reports/${reportType}/export`, {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${reportType}_report_${startDate || 'all'}_${endDate || 'all'}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  // Restaurant Settings
  getRestaurantSettings: async () => {
    const res = await api.get('/admin/restaurant');
    return res.data;
  },

  updateRestaurantSettings: async (settingsData) => {
    const res = await api.put('/admin/restaurant', settingsData);
    return res.data;
  },

  // Notifications
  getNotifications: async () => {
    const res = await api.get('/admin/notifications');
    return res.data;
  },

  // Profile & Password
  updateProfile: async (profileData) => {
    const res = await api.put('/admin/profile', profileData);
    return res.data;
  },

  changePassword: async (passwordData) => {
    const res = await api.post('/admin/change-password', passwordData);
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async ({ action, resourceType, skip = 0, limit = 50 } = {}) => {
    const params = { skip, limit };
    if (action) params.action = action;
    if (resourceType) params.resource_type = resourceType;
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },
};

export default adminApi;
