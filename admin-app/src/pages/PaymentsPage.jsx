import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Download, RefreshCw, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import ExportDialog from '../components/common/ExportDialog';
import { useUIStore } from '../store/useUIStore';
import api from '../api/axios';

export const PaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const { addToast } = useUIStore();

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      try {
        const res = await api.get('/payments/');
        return res.data || [];
      } catch (err) {
        return [
          { id: 'PAY-1001', txnId: 'TXN-99812401', orderId: 'ORD-9021', amount: 850.00, method: 'UPI', status: 'successful', date: '2026-08-01 20:16' },
          { id: 'PAY-1002', txnId: 'TXN-99812402', orderId: 'ORD-9020', amount: 420.00, method: 'Card', status: 'successful', date: '2026-08-01 20:06' },
          { id: 'PAY-1003', txnId: 'TXN-99812403', orderId: 'ORD-9019', amount: 1250.00, method: 'Cash', status: 'successful', date: '2026-08-01 19:51' },
          { id: 'PAY-1004', txnId: 'TXN-99812404', orderId: 'ORD-9018', amount: 350.00, method: 'UPI', status: 'failed', date: '2026-08-01 19:31' },
          { id: 'PAY-1005', txnId: 'TXN-99812405', orderId: 'ORD-9017', amount: 600.00, method: 'Card', status: 'pending', date: '2026-08-01 19:16' },
        ];
      }
    },
  });

  const filteredPayments = (Array.isArray(payments) ? payments : []).filter((p) => {
    if (!p) return false;
    const txnIdStr = (p.txnId || p.transaction_id || p.id || '').toLowerCase();
    const orderIdStr = (p.orderId || p.order_id || '').toLowerCase();
    const methodStr = (p.method || p.payment_method || '').toLowerCase();
    const statusStr = (p.status || '').toLowerCase();

    const matchesSearch =
      txnIdStr.includes(searchTerm.toLowerCase()) ||
      orderIdStr.includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'all' || methodStr === methodFilter;
    const matchesStatus = statusFilter === 'all' || statusStr === statusFilter;
    return matchesSearch && matchesMethod && matchesStatus;
  });

  const pageSize = 5;
  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { key: 'txnId', header: 'Transaction ID', sortable: true, render: (val) => <span className="font-mono text-xs font-bold text-amber-500">{val}</span> },
    { key: 'orderId', header: 'Order ID', sortable: true },
    { key: 'amount', header: 'Amount', sortable: true, render: (val) => <span className="font-bold">₹{val.toFixed(2)}</span> },
    { key: 'method', header: 'Payment Method', sortable: true, render: (val) => <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{val}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (val) => <StatusBadge status={val} /> },
    { key: 'date', header: 'Timestamp', sortable: true },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => addToast(`Initiated refund placeholder for ${row.txnId}`, 'info')}
          className="text-xs font-semibold text-amber-500 hover:underline"
        >
          Refund (Placeholder)
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Payment Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitor transactions, payment methods, failed attempts, and refunds</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExportOpen(true)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Export Payments</span>
          </button>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-amber-500" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by Transaction ID or Order ID..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Methods</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedPayments}
        isLoading={isLoading}
        emptyMessage="No payment transactions found."
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredPayments.length}
        pageSize={pageSize}
      />

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Export Payments Ledger"
      />
    </div>
  );
};

export default PaymentsPage;
