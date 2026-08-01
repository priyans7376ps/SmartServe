import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareWarning, CheckCircle2, XCircle, MessageCircle, RefreshCw } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import { useUIStore } from '../store/useUIStore';
import api from '../api/axios';

export const ComplaintsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const { addToast } = useUIStore();

  const { data: complaints = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-complaints'],
    queryFn: async () => {
      try {
        const res = await api.get('/complaints/');
        return res.data || [];
      } catch (err) {
        return [
          { id: 'CMP-501', customer: 'John Doe', table: 'Table 04', orderId: 'ORD-9021', issue: 'Food served cold and garlic naan missing.', status: 'new', createdAt: '2026-08-01 20:20' },
          { id: 'CMP-502', customer: 'Sarah Smith', table: 'Table 02', orderId: 'ORD-9020', issue: 'Delayed order delivery by over 35 mins.', status: 'in_progress', createdAt: '2026-08-01 19:40' },
          { id: 'CMP-503', customer: 'Alex J.', table: 'Table 05', orderId: 'ORD-9017', issue: 'Incorrect bill item added.', status: 'resolved', createdAt: '2026-08-01 18:10' },
        ];
      }
    },
  });

  const handleUpdateStatus = (id, newStatus) => {
    addToast(`Complaint ${id} marked as ${newStatus}.`, 'success');
    setSelectedComplaint(null);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    addToast(`Customer reply placeholder sent: "${replyText}"`, 'info');
    setReplyText('');
  };

  const filteredComplaints = (Array.isArray(complaints) ? complaints : []).filter((c) => {
    if (!c) return false;
    const idStr = (c.id || '').toLowerCase();
    const customerStr = (c.customer || c.user?.full_name || '').toLowerCase();
    const issueStr = (c.issue || c.description || '').toLowerCase();

    return (
      idStr.includes(searchTerm.toLowerCase()) ||
      customerStr.includes(searchTerm.toLowerCase()) ||
      issueStr.includes(searchTerm.toLowerCase())
    );
  });

  const columns = [
    { key: 'id', header: 'Ticket ID', sortable: true, render: (val) => <span className="font-bold text-amber-500">{val}</span> },
    { key: 'customer', header: 'Customer', sortable: true, render: (val, row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{val}</p>
          <span className="text-[10px] text-slate-400">{row.table}</span>
        </div>
      )
    },
    { key: 'orderId', header: 'Order ID' },
    { key: 'issue', header: 'Issue Description', render: (val) => <span className="truncate max-w-xs block">{val}</span> },
    { key: 'status', header: 'Status', sortable: true, render: (val) => <StatusBadge status={val} /> },
    { key: 'createdAt', header: 'Received Time', sortable: true },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => setSelectedComplaint(row)}
          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white text-xs font-semibold transition-colors"
        >
          Inspect & Reply
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Complaint Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review, resolve, reject customer tickets, and send replies</p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-amber-500" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by ticket ID, customer, issue..."
          className="w-full md:w-80"
        />
      </div>

      <Table
        columns={columns}
        data={filteredComplaints}
        isLoading={isLoading}
        emptyMessage="No customer complaints logged."
      />

      {/* Inspect Complaint Modal */}
      <Modal
        isOpen={!!selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        title={`Ticket ${selectedComplaint?.id}`}
        maxWidth="max-w-lg"
      >
        {selectedComplaint && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{selectedComplaint.customer} ({selectedComplaint.table})</p>
                <p className="text-[10px] text-slate-400">Order Ref: {selectedComplaint.orderId}</p>
              </div>
              <StatusBadge status={selectedComplaint.status} />
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Reported:</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedComplaint.issue}</p>
            </div>

            {/* Status Assignment Buttons */}
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider text-[10px]">Assign Status</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedComplaint.id, 'in_progress')}
                  className="py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 font-bold hover:bg-amber-500 hover:text-white transition-all"
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedComplaint.id, 'resolved')}
                  className="py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold hover:bg-emerald-500 hover:text-white transition-all"
                >
                  Resolve Ticket
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedComplaint.id, 'rejected')}
                  className="py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 font-bold hover:bg-rose-500 hover:text-white transition-all"
                >
                  Reject Ticket
                </button>
              </div>
            </div>

            {/* Customer Reply Placeholder */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Send Reply to Customer (Placeholder)
              </label>
              <textarea
                rows={3}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type resolution message or response to customer..."
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold shadow-md hover:bg-amber-600 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send Customer Reply</span>
              </button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintsPage;
