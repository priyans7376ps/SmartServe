import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, RefreshCw, DollarSign, ArrowUpRight } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { useUIStore } from '../store/useUIStore';
import adminApi from '../api/adminApi';
import { getErrorMessage } from '../utils/error';

export const PaymentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refundingPayment, setRefundingPayment] = useState(null);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const limit = 10;

  // Fetch real payments from backend
  const { data: rawPayments = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'payments', searchTerm, statusFilter, methodFilter, currentPage],
    queryFn: () => adminApi.getPayments({
      query: searchTerm,
      status: statusFilter,
      method: methodFilter,
      skip: (currentPage - 1) * limit,
      limit: limit
    }),
  });

  const payments = Array.isArray(rawPayments) ? rawPayments : (rawPayments?.items || []);
  const totalCount = Array.isArray(rawPayments) ? (rawPayments.length < limit && currentPage === 1 ? rawPayments.length : 50) : (rawPayments?.total || payments.length);
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const refundMutation = useMutation({
    mutationFn: ({ paymentId, reason }) => adminApi.refundPayment(paymentId, null, reason),
    onSuccess: () => {
      addToast('Refund processed successfully.', 'success');
      setRefundingPayment(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, 'Refund failed.'), 'error');
    }
  });

  const columns = [
    {
      header: 'Transaction / Order',
      accessor: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-amber-500 block">
            {row.transaction_id || row.provider_payment_id || row.provider_order_id || (row.id ? String(row.id).slice(0, 13) : 'TXN-N/A')}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Order: {row.order_number || (row.order_id ? String(row.order_id).slice(0, 8) : 'N/A')}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block">
            {row.billing_name || 'Guest Customer'}
          </span>
          {row.billing_email && (
            <span className="text-[11px] text-slate-400 font-medium">{row.billing_email}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: (row) => (
        <span className="font-extrabold text-slate-900 dark:text-white">
          ₹{Number(row.total_amount || row.amount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Method',
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
          {row.payment_method || row.provider || 'ONLINE'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      header: 'Timestamp',
      accessor: (row) => (
        <span className="text-xs text-slate-500 font-medium">
          {row.paid_at || row.created_at ? new Date(row.paid_at || row.created_at).toLocaleString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div>
          {row.payment_status === 'completed' ? (
            <button
              onClick={() => setRefundingPayment(row)}
              className="text-xs font-semibold text-rose-500 hover:underline"
            >
              Refund
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium">-</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Payment Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitor real transactions, Razorpay order IDs, payment statuses, and process refunds</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-amber-500 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          placeholder="Search by Transaction ID, Order #, or Customer..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select
            value={methodFilter}
            onChange={(e) => { setMethodFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Methods</option>
            <option value="online">Online / Razorpay</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed / Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={payments}
        isLoading={isLoading}
        emptyMessage="No payment transactions found."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Confirmation for Refund */}
      {refundingPayment && (
        <ConfirmationDialog
          isOpen={!!refundingPayment}
          onClose={() => setRefundingPayment(null)}
          onConfirm={() => refundMutation.mutate({ paymentId: refundingPayment.id, reason: 'Admin refund' })}
          title="Refund Payment"
          message={`Are you sure you want to refund ₹${refundingPayment.total_amount || refundingPayment.amount} for Transaction ${refundingPayment.transaction_id || refundingPayment.id}?`}
          confirmLabel="Process Refund"
          isDanger
          isLoading={refundMutation.isPending}
        />
      )}
    </div>
  );
};

export default PaymentsPage;
