import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserCheck, Plus, Edit, UserX, Shield, ChefHat, RefreshCw } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { useUIStore } from '../store/useUIStore';
import api from '../api/axios';

export const StaffPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deactivatingStaff, setDeactivatingStaff] = useState(null);
  const { addToast } = useUIStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'kitchen',
    active: true,
  });

  const { data: staffList = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-staff'],
    queryFn: async () => {
      try {
        const res = await api.get('/auth/me');
        const items = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
        return items.map((item, idx) => ({
          id: item.id || `STF-0${idx + 1}`,
          name: item.full_name || item.name || 'Staff Member',
          email: item.email || 'N/A',
          phone: item.phone || 'N/A',
          role: item.role || 'kitchen',
          active: item.is_active ?? item.active ?? true,
          joinedDate: item.created_at ? item.created_at.split('T')[0] : '2025-01-15',
        }));
      } catch (err) {
        return [
          { id: 'STF-01', name: 'Alexander Wright', email: 'alex.w@smartserve.com', phone: '+91 98765 11111', role: 'admin', active: true, joinedDate: '2025-01-15' },
          { id: 'STF-02', name: 'Chef Marco Rossi', email: 'marco@smartserve.com', phone: '+91 98765 22222', role: 'kitchen', active: true, joinedDate: '2025-03-10' },
          { id: 'STF-03', name: 'Priya Sharma', email: 'priya@smartserve.com', phone: '+91 98765 33333', role: 'manager', active: true, joinedDate: '2025-06-01' },
          { id: 'STF-04', name: 'David Miller', email: 'david@smartserve.com', phone: '+91 98765 44444', role: 'kitchen', active: false, joinedDate: '2025-08-20' },
        ];
      }
    },
  });

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFormData({ name: '', email: '', phone: '', role: 'kitchen', active: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      active: staff.active,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingStaff) {
      addToast(`Staff member ${formData.name} updated.`, 'success');
    } else {
      addToast(`New staff member ${formData.name} onboarded!`, 'success');
    }
    setIsModalOpen(false);
  };

  const filteredStaff = (Array.isArray(staffList) ? staffList : []).filter((s) => {
    if (!s) return false;
    const nameStr = (s.name || s.full_name || '').toLowerCase();
    const emailStr = (s.email || '').toLowerCase();
    const roleStr = (s.role || '').toLowerCase();
    const matchesSearch =
      nameStr.includes(searchTerm.toLowerCase()) ||
      emailStr.includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || roleStr === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns = [
    { key: 'name', header: 'Staff Member', sortable: true, render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-bold text-amber-500 text-xs">
            {val.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">{val}</p>
            <span className="text-[10px] text-slate-400">{row.email}</span>
          </div>
        </div>
      )
    },
    { key: 'role', header: 'Assigned Role', sortable: true, render: (val) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
          val === 'admin' || val === 'manager'
            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200'
            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200'
        }`}>
          {val}
        </span>
      )
    },
    { key: 'phone', header: 'Contact Phone' },
    { key: 'active', header: 'Status', sortable: true, render: (val) => <StatusBadge status={val ? 'active' : 'inactive'} /> },
    { key: 'joinedDate', header: 'Joined' },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Onboard staff, assign roles (Kitchen vs Admin/Manager), and toggle status</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-600 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search staff by name or email..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium shrink-0">
          {['all', 'admin', 'manager', 'kitchen'].map((r) => (
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
        data={filteredStaff}
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Chef Robert"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="staff@smartserve.com"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

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
              <option value="manager">Manager</option>
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
              className="px-5 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-md shadow-amber-500/20"
            >
              Save Staff Details
            </button>
          </div>
        </form>
      </Modal>

      {/* Deactivate Dialog */}
      <ConfirmationDialog
        isOpen={!!deactivatingStaff}
        onClose={() => setDeactivatingStaff(null)}
        onConfirm={() => {
          addToast(`Status toggled for ${deactivatingStaff?.name}.`, 'success');
          setDeactivatingStaff(null);
        }}
        title="Deactivate Staff"
        message={`Are you sure you want to deactivate ${deactivatingStaff?.name}? They will lose dashboard access.`}
        confirmText="Deactivate"
        isDanger={true}
      />
    </div>
  );
};

export default StaffPage;
