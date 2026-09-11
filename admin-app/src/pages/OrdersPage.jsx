import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Eye, XCircle, RefreshCw, Filter } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import Drawer from '../components/common/Drawer';
import { useUIStore } from '../store/useUIStore';
import adminApi from '../api/adminApi';

export const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const limit = 10;

  // Fetch real backend orders
  const { data: resData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'orders', searchTerm, statusFilter, currentPage],
    queryFn: () => adminApi.getOrders({
      query: searchTerm,
      status: statusFilter,
      skip: (currentPage - 1) * limit,
      limit: limit
    }),
    refetchInterval: 15000,
  });

  const orders = resData?.items || [];
  const totalCount = resData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: (orderId) => adminApi.cancelOrder(orderId, 'Cancelled by Admin'),
    onSuccess: () => {
      addToast('Order cancelled successfully.', 'success');
      setCancellingOrder(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.detail || 'Failed to cancel order.', 'error');
    }
  });

  const columns = [
    {
      header: 'Order #',
      accessor: (row) => (
        <span className="font-extrabold text-amber-500 hover:underline cursor-pointer" onClick={() => setSelectedOrder(row)}>
          {row.order_number || row.id}
        </span>
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
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedOrder(row)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status !== 'cancelled' && row.status !== 'completed' && (
            <button
              onClick={() => setCancellingOrder(row)}
              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
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
            placeholder="Search by order # or customer..."
          />
        </div>

        <div className="hidden sm:flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
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
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order Details - ${selectedOrder.order_number || selectedOrder.id}`}
        >
          <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              <div><span className="text-slate-400">Customer:</span> {selectedOrder.customer_name || 'Guest'}</div>
              <div><span className="text-slate-400">Phone:</span> {selectedOrder.customer_phone || 'N/A'}</div>
              <div><span className="text-slate-400">Table:</span> {selectedOrder.table_number ? `Table #${selectedOrder.table_number}` : 'N/A'}</div>
              <div><span className="text-slate-400">Status:</span> <StatusBadge status={selectedOrder.status} /></div>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white mb-2">Order Items</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(selectedOrder.items || []).map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    <span>{it.quantity}x {it.name || it.item_name}</span>
                    <span className="font-extrabold">₹{Number(it.unit_price * (it.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white">
              <span>Total Amount</span>
              <span className="text-amber-500 text-base">₹{Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
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
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Filter by Status</label>
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
      </Drawer>
    </div>
  );
};

export default OrdersPage;
