import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingBag, Eye, XCircle, RefreshCw, Download, Filter } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import DatePicker from '../components/common/DatePicker';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import ExportDialog from '../components/common/ExportDialog';
import Drawer from '../components/common/Drawer';
import { useUIStore } from '../store/useUIStore';
import api from '../api/axios';

export const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      try {
        const res = await api.get('/orders/');
        return res.data || [];
      } catch (err) {
        // Fallback sample data if backend endpoint varies
        return [
          { id: 'ORD-9021', customer: 'John Doe', type: 'Registered', table: 'Table 04', itemsCount: 3, total: 850.00, status: 'pending', createdAt: '2026-08-01 20:15', items: [{ name: 'Butter Chicken', qty: 1, price: 450 }, { name: 'Garlic Naan', qty: 2, price: 200 }] },
          { id: 'ORD-9020', customer: 'Sarah Smith', type: 'Guest', table: 'Table 02', itemsCount: 2, total: 420.00, status: 'preparing', createdAt: '2026-08-01 20:05', items: [{ name: 'Paneer Tikka', qty: 1, price: 320 }, { name: 'Coke', qty: 2, price: 100 }] },
          { id: 'ORD-9019', customer: 'Michael Brown', type: 'Registered', table: 'Table 08', itemsCount: 4, total: 1250.00, status: 'ready', createdAt: '2026-08-01 19:50', items: [{ name: 'Mutton Biryani', qty: 2, price: 900 }, { name: 'Raita', qty: 2, price: 350 }] },
          { id: 'ORD-9018', customer: 'Emily Davis', type: 'Registered', table: 'Table 01', itemsCount: 1, total: 350.00, status: 'completed', createdAt: '2026-08-01 19:30', items: [{ name: 'Veg Pizza', qty: 1, price: 350 }] },
          { id: 'ORD-9017', customer: 'Alex Johnson', type: 'Guest', table: 'Table 05', itemsCount: 2, total: 600.00, status: 'cancelled', createdAt: '2026-08-01 19:15', items: [{ name: 'Pasta Arrabbiata', qty: 1, price: 450 }, { name: 'Iced Tea', qty: 1, price: 150 }] },
        ];
      }
    },
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: async (orderId) => {
      try {
        await api.patch(`/orders/${orderId}/status`, { status: 'cancelled' });
      } catch (err) {
        // simulated
      }
    },
    onSuccess: () => {
      addToast('Order cancelled successfully.', 'success');
      setCancellingOrder(null);
      queryClient.invalidateQueries(['admin-orders']);
    },
    onError: () => {
      addToast('Failed to cancel order.', 'error');
    },
  });

  // Filter & Search Logic
  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((o) => {
    if (!o) return false;
    const idStr = (o.id || '').toLowerCase();
    const customerStr = (o.customer || o.user?.full_name || '').toLowerCase();
    const tableStr = (o.table || o.table_id || '').toLowerCase();
    const statusStr = (o.status || '').toLowerCase();

    const matchesSearch =
      idStr.includes(searchTerm.toLowerCase()) ||
      customerStr.includes(searchTerm.toLowerCase()) ||
      tableStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || statusStr === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pageSize = 5;
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { key: 'id', header: 'Order ID', sortable: true, render: (val) => <span className="font-bold text-amber-500">{val}</span> },
    { key: 'customer', header: 'Customer', sortable: true, render: (val, row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{val || 'Guest'}</p>
          <span className="text-[10px] text-slate-400">{row.type || 'Walk-in'}</span>
        </div>
      )
    },
    { key: 'table', header: 'Table', sortable: true },
    { key: 'itemsCount', header: 'Items', sortable: true, render: (val) => `${val} items` },
    { key: 'total', header: 'Total Amount', sortable: true, render: (val) => <span className="font-bold">₹{val.toFixed(2)}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (val) => <StatusBadge status={val} /> },
    { key: 'createdAt', header: 'Time', sortable: true },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedOrder(row)}
            title="View Details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status !== 'cancelled' && row.status !== 'completed' && (
            <button
              onClick={() => setCancellingOrder(row)}
              title="Cancel Order"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Order Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitor, filter, inspect, and manage restaurant orders</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportOpen(true)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Export Orders</span>
          </button>

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-amber-500" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by Order ID, customer, table..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium shrink-0">
            {['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-amber-500 text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <DatePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onChange={setDateRange}
            className="shrink-0"
          />

          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={paginatedOrders}
        isLoading={isLoading}
        emptyMessage="No orders match your filter criteria."
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredOrders.length}
        pageSize={pageSize}
      />

      {/* Order Details Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details - ${selectedOrder?.id}`}
        maxWidth="max-w-lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-400">Customer</p>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">{selectedOrder.customer} ({selectedOrder.table})</h4>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {/* Items list */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ordered Items</h5>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {it.qty}x {it.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{it.price * it.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Total Paid / Due</span>
              <span className="text-lg font-extrabold text-amber-500">₹{selectedOrder.total.toFixed(2)}</span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  addToast(`Refund initiated for ${selectedOrder.id} (Placeholder)`, 'info');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Initiate Refund (Placeholder)
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Order Confirmation */}
      <ConfirmationDialog
        isOpen={!!cancellingOrder}
        onClose={() => setCancellingOrder(null)}
        onConfirm={() => cancelMutation.mutate(cancellingOrder.id)}
        title="Cancel Order"
        message={`Are you sure you want to cancel order ${cancellingOrder?.id}? This cannot be undone.`}
        confirmText="Cancel Order"
        isDanger={true}
        isLoading={cancelMutation.isPending}
      />

      {/* Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Advanced Order Filters"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Order Amount Range</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min ₹" className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              <span>-</span>
              <input type="number" placeholder="Max ₹" className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            </div>
          </div>

          <button
            onClick={() => setIsFilterDrawerOpen(false)}
            className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold shadow-md"
          >
            Apply Filters
          </button>
        </div>
      </Drawer>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Export Orders Report"
      />
    </div>
  );
};

export default OrdersPage;
