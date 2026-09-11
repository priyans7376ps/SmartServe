import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, UserX, RefreshCw } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { useUIStore } from '../store/useUIStore';
import adminApi from '../api/adminApi';

export const StaffPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deactivatingStaff, setDeactivatingStaff] = useState(null);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'kitchen',
    is_active: true,
  });

  const { data: staffList = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'staff', searchTerm, roleFilter],
    queryFn: () => adminApi.getStaff({ query: searchTerm, role: roleFilter }),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingStaff) {
        return adminApi.updateStaff(editingStaff.id, {
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          is_active: data.is_active,
        });
      } else {
        return adminApi.createStaff(data);
      }
    },
    onSuccess: () => {
      addToast(editingStaff ? 'Staff member updated!' : 'New staff member onboarded!', 'success');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.detail || 'Failed to save staff details.', 'error');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (staff) => adminApi.updateStaff(staff.id, { is_active: !staff.is_active }),
    onSuccess: () => {
      addToast('Staff status updated.', 'success');
      setDeactivatingStaff(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
    },
    onError: (err) => {
      addToast(err.response?.data?.detail || 'Action failed.', 'error');
    }
  });

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFormData({ full_name: '', email: '', phone: '', password: '', role: 'kitchen', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      full_name: staff.full_name || staff.name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      password: '',
      role: staff.role || 'kitchen',
      is_active: staff.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Staff Member',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-xs">
            {(row.full_name || row.name || 'S').charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{row.full_name || row.name}</p>
            <span className="text-[10px] text-slate-400">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      accessor: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          row.role === 'admin' || row.role === 'super_admin'
            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200'
            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200'
        }`}>
          {row.role}
        </span>
      ),
    },
    { header: 'Contact Phone', accessor: (row) => row.phone || 'N/A' },
    { header: 'Status', accessor: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Staff"
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeactivatingStaff(row)}
            title="Toggle Status"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <UserX className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Staff Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Onboard staff, assign roles (Kitchen vs Admin), and manage active status</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-amber-500 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-600 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search staff by name or email..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium shrink-0">
          {['all', 'admin', 'kitchen'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                roleFilter === r
                  ? 'bg-amber-500 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <Table
        columns={columns}
        data={staffList}
        isLoading={isLoading}
        emptyMessage="No staff members found."
      />

      {/* Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? 'Update Staff Member' : 'Onboard New Staff Member'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Chef Robert"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Email Address</label>
            <input
              type="email"
              required
              disabled={!!editingStaff}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="staff@smartserve.com"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          {!editingStaff && (
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Initial password"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 98765 00000"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Role Assignment</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value="kitchen">Kitchen Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-md shadow-amber-500/20"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Staff Details'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Dialog */}
      {deactivatingStaff && (
        <ConfirmationDialog
          isOpen={!!deactivatingStaff}
          onClose={() => setDeactivatingStaff(null)}
          onConfirm={() => toggleActiveMutation.mutate(deactivatingStaff)}
          title="Toggle Staff Status"
          message={`Are you sure you want to ${deactivatingStaff.is_active ? 'deactivate' : 'activate'} ${deactivatingStaff.full_name || deactivatingStaff.name}?`}
          confirmLabel={deactivatingStaff.is_active ? 'Deactivate' : 'Activate'}
          isDanger={deactivatingStaff.is_active}
          isLoading={toggleActiveMutation.isPending}
        />
      )}
    </div>
  );
};

export default StaffPage;
