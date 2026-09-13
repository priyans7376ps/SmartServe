import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Eye, XCircle, RefreshCw, Filter, CheckCircle2, Clock } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import Drawer from '../components/common/Drawer';
import { useUIStore } from '../store/useUIStore';
import adminApi from '../api/adminApi';
import { getErrorMessage } from '../utils/error';

export const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const limit = 10;

  // Fetch real backend orders
  const { data: resData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'orders', searchTerm, statusFilter, paymentStatusFilter, paymentMethodFilter, currentPage],
    queryFn: () => adminApi.getOrders({
      query: searchTerm,
      status: statusFilter,
      paymentStatus: paymentStatusFilter,
      paymentMethod: paymentMethodFilter,
      skip: (currentPage - 1) * limit,
      limit: limit
    }),
    refetchInterval: 15000,
  });

  const orders = resData?.items || [];
  const totalCount = resData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Fetch full order details if modal is open
  const { data: detailedOrder } = useQuery({
    queryKey: ['admin', 'order', selectedOrderId],
    queryFn: () => adminApi.getOrder(selectedOrderId),
    enabled: !!selectedOrderId,
  });

  const activeOrder = detailedOrder || selectedOrder;

  // Update status mutation
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }) => adminApi.updateOrderStatus(orderId, { status }),
    onSuccess: (data) => {
      addToast(`Order status updated to ${data.status}.`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, 'Failed to update order status.'), 'error');
    }
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: (orderId) => adminApi.cancelOrder(orderId, 'Cancelled by Admin'),
    onSuccess: () => {
      addToast('Order cancelled successfully.', 'success');
      setCancellingOrder(null);
      if (selectedOrderId) setSelectedOrderId(null);
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, 'Failed to cancel order.'), 'error');
    }
  });

  const handleOpenDetails = (row) => {
    setSelectedOrder(row);
    setSelectedOrderId(row.id);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setSelectedOrderId(null);
  };

  const columns = [
    {
      header: 'Token / Order #',
      accessor: (row) => (
        <div className="cursor-pointer" onClick={() => handleOpenDetails(row)}>
          <span className="font-mono text-xs font-bold text-amber-500 block hover:underline">
            {row.token_number || `TKN-${(row.order_number || '').slice(-4)}`}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {row.order_number || row.id}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{row.customer_name || 'Guest'}</span>
          <span className="text-[11px] text-slate-400 font-medium">{row.customer_phone || row.customer_email || 'Table Dining'}</span>
        </div>
      ),
    },
    {
      header: 'Table / Type',
      accessor: (row) => (
        <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs">
          {row.table_number ? `Table #${row.table_number}` : (row.order_type || 'dine_in')}
        </span>
      ),
    },
    {
      header: 'Items',
      accessor: (row) => <span className="font-bold text-slate-800 dark:text-slate-200">{row.item_count || row.items?.length || 0} items</span>,
    },
    {
      header: 'Total Amount',
      accessor: (row) => <span className="font-extrabold text-slate-900 dark:text-white">₹{Number(row.total_amount || 0).toFixed(2)}</span>,
    },
    {
      header: 'Payment',
      accessor: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.payment_status} />
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {row.payment_method || 'cash'}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenDetails(row)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status !== 'cancelled' && row.status !== 'completed' && (
            <button
              onClick={() => setCancellingOrder(row)}
              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
              title="Cancel Order"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Order Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor, view details, and manage customer orders in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-amber-500 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="sm:hidden px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <Filter className="w-4 h-4 text-amber-500" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="w-full sm:w-80">
          <SearchBar
            value={searchTerm}
            onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
            placeholder="Search by order #, token, customer..."
          />
        </div>

        <div className="hidden sm:flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => { setPaymentMethodFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="razorpay">Online / Razorpay</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="cash">Cash / Pay at Table</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <Table
        data={orders}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No orders found matching criteria."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
        />
      )}

      {/* Order Details Modal */}
      {activeOrder && (
        <Modal
          isOpen={!!activeOrder}
          onClose={handleCloseDetails}
          title={`Order Details - ${activeOrder.token_number || activeOrder.order_number || activeOrder.id}`}
        >
          <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {/* Customer & Table Info Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div><span className="text-slate-400">Customer:</span> {activeOrder.customer_name || 'Guest'}</div>
              <div><span className="text-slate-400">Phone:</span> {activeOrder.customer_phone || 'N/A'}</div>
              <div><span className="text-slate-400">Table:</span> {activeOrder.table_number ? `Table #${activeOrder.table_number}` : 'Takeaway / Delivery'}</div>
              <div><span className="text-slate-400">Order Status:</span> <StatusBadge status={activeOrder.status} /></div>
              <div><span className="text-slate-400">Payment Status:</span> <StatusBadge status={activeOrder.payment_status} /></div>
              <div><span className="text-slate-400">Payment Method:</span> <span className="font-bold uppercase text-amber-500">{activeOrder.payment_method || 'cash'}</span></div>
            </div>

            {/* Quick Status Transition Controls */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Change Order Status</label>
              <div className="flex flex-wrap gap-2">
                {['pending', 'confirmed', 'preparing', 'ready', 'completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => statusMutation.mutate({ orderId: activeOrder.id, status: st })}
                    disabled={statusMutation.isPending || activeOrder.status === st}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                      activeOrder.status === st
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white mb-2">Order Items</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(activeOrder.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                    <div>
                      <span className="font-bold">{it.quantity}x {it.name || it.item_name}</span>
                      {it.variant_selected && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Variant: {JSON.stringify(it.variant_selected)}
                        </span>
                      )}
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      ₹{Number((it.subtotal !== undefined ? it.subtotal : (it.unit_price * (it.quantity || 1))) || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Pricing Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white">
              <span>Total Amount</span>
              <span className="text-amber-500 text-base">₹{Number(activeOrder.total_amount || 0).toFixed(2)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancellingOrder && (
        <ConfirmationDialog
          isOpen={!!cancellingOrder}
          onClose={() => setCancellingOrder(null)}
          onConfirm={() => cancelMutation.mutate(cancellingOrder.id)}
          title="Cancel Order"
          message={`Are you sure you want to cancel Order #${cancellingOrder.order_number || cancellingOrder.id}?`}
          confirmLabel="Cancel Order"
          isDanger
          isLoading={cancelMutation.isPending}
        />
      )}

      {/* Mobile Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Filter Orders"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Filter by Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Filter by Payment Status</label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Filter by Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            >
              <option value="all">All Methods</option>
              <option value="razorpay">Online / Razorpay</option>
              <option value="cash">Cash / Pay at Table</option>
            </select>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default OrdersPage;
