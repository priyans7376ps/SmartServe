import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, RefreshCw } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import { useUIStore } from '../store/useUIStore';
import adminApi from '../api/adminApi';
import { getErrorMessage } from '../utils/error';

export const ComplaintsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: resData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'complaints', searchTerm],
    queryFn: () => adminApi.getComplaints({ query: searchTerm }),
  });

  const complaints = resData?.items || [];

  const updateMutation = useMutation({
    mutationFn: ({ complaintId, status, resolutionNotes }) => adminApi.updateComplaint(complaintId, {
      status,
      resolution_notes: resolutionNotes
    }),
    onSuccess: () => {
      addToast('Complaint status updated successfully.', 'success');
      setSelectedComplaint(null);
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'complaints'] });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, 'Failed to update complaint.'), 'error');
    }
  });

  const columns = [
    { header: 'Subject / Category', accessor: (row) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-100 block">{row.subject}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{row.category}</span>
        </div>
      )
    },
    { header: 'Customer', accessor: (row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{row.customer_name || 'Customer'}</p>
          <span className="text-[10px] text-slate-400">{row.customer_email || 'N/A'}</span>
        </div>
      )
    },
    { header: 'Priority', accessor: (row) => <StatusBadge status={row.priority} /> },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.status} /> },
    { header: 'Received', accessor: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A' },
    {
      header: 'Actions',
      accessor: (row) => (
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review, resolve, reject customer tickets, and add admin responses</p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-amber-500 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by ticket subject, customer, or category..."
          className="w-full md:w-80"
        />
      </div>

      <Table
        columns={columns}
        data={complaints}
        isLoading={isLoading}
        emptyMessage="No customer complaints logged."
      />

      {/* Inspect Complaint Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Ticket: ${selectedComplaint.subject}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">{selectedComplaint.customer_name} ({selectedComplaint.customer_email || 'N/A'})</p>
                <p className="text-[10px] text-slate-400">Category: {selectedComplaint.category}</p>
              </div>
              <StatusBadge status={selectedComplaint.status} />
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Description:</p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{selectedComplaint.description}</p>
            </div>

            {selectedComplaint.resolution_notes && (
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
                <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">Previous Resolution Notes:</p>
                <p className="text-slate-700 dark:text-slate-300">{selectedComplaint.resolution_notes}</p>
              </div>
            )}

            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider text-[10px]">Update Complaint Status</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateMutation.mutate({ complaintId: selectedComplaint.id, status: 'in_progress' })}
                  className="py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 font-bold hover:bg-amber-500 hover:text-white transition-all"
                >
                  In Progress
                </button>
                <button
                  onClick={() => updateMutation.mutate({ complaintId: selectedComplaint.id, status: 'resolved', resolutionNotes: replyText || 'Resolved by Admin' })}
                  className="py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold hover:bg-emerald-500 hover:text-white transition-all"
                >
                  Resolve Ticket
                </button>
                <button
                  onClick={() => updateMutation.mutate({ complaintId: selectedComplaint.id, status: 'closed', resolutionNotes: replyText || 'Closed by Admin' })}
                  className="py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 font-bold hover:bg-rose-500 hover:text-white transition-all"
                >
                  Close Ticket
                </button>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate({ complaintId: selectedComplaint.id, status: selectedComplaint.status, resolutionNotes: replyText }); }} className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Add Admin Response & Resolution Notes
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
                disabled={updateMutation.isPending}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold shadow-md hover:bg-amber-600 flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Save Response Notes</span>
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ComplaintsPage;
