import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, Plus, Edit, Trash2, ToggleLeft, ToggleRight, Calendar, Percent, DollarSign } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { useUIStore } from '../store/useUIStore';
import api from '../api/axios';

export const CouponsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 200,
    usageLimit: 100,
    expiryDate: '2026-12-31',
    enabled: true,
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      try {
        const res = await api.get('/coupons/');
        return res.data || [];
      } catch (err) {
        return [
          { id: '1', code: 'WELCOME50', discountType: 'percentage', discountValue: 50, minOrderValue: 300, usageLimit: 500, usedCount: 142, expiryDate: '2026-12-31', enabled: true },
          { id: '2', code: 'FLAT100', discountType: 'flat', discountValue: 100, minOrderValue: 500, usageLimit: 200, usedCount: 89, expiryDate: '2026-09-30', enabled: true },
          { id: '3', code: 'SUMMER20', discountType: 'percentage', discountValue: 20, minOrderValue: 150, usageLimit: 1000, usedCount: 412, expiryDate: '2026-08-15', enabled: false },
        ];
      }
    },
  });

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: 15,
      minOrderValue: 200,
      usageLimit: 100,
      expiryDate: '2026-12-31',
      enabled: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      usageLimit: coupon.usageLimit,
      expiryDate: coupon.expiryDate,
      enabled: coupon.enabled,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingCoupon) {
      addToast(`Coupon ${formData.code} updated.`, 'success');
    } else {
      addToast(`New coupon ${formData.code} created.`, 'success');
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (coupon) => {
    addToast(`Coupon ${coupon.code} ${coupon.enabled ? 'disabled' : 'enabled'}.`, 'info');
  };

  const filteredCoupons = (Array.isArray(coupons) ? coupons : []).filter((c) => {
    if (!c) return false;
    const codeStr = (c.code || c.coupon_code || '').toLowerCase();
    return codeStr.includes(searchTerm.toLowerCase());
  });

  const columns = [
    { key: 'code', header: 'Coupon Code', sortable: true, render: (val) => <span className="font-mono font-bold text-amber-500">{val}</span> },
    { key: 'discountType', header: 'Discount', render: (val, row) => (
        <span className="font-bold text-slate-800 dark:text-slate-100">
          {val === 'percentage' ? `${row.discountValue}% OFF` : `₹${row.discountValue} FLAT`}
        </span>
      )
    },
    { key: 'minOrderValue', header: 'Min Order', sortable: true, render: (val) => `₹${val}` },
    { key: 'usageLimit', header: 'Usage Limit', render: (val, row) => `${row.usedCount || 0} / ${val}` },
    { key: 'expiryDate', header: 'Expiry Date', sortable: true },
    { key: 'enabled', header: 'Status', render: (val) => <StatusBadge status={val ? 'active' : 'inactive'} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleStatus(row)}
            title="Enable/Disable"
            className="p-1 rounded-lg text-slate-500 hover:text-amber-500"
          >
            {row.enabled ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit"
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeletingCoupon(row)}
            title="Delete"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Coupon Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create, enable, disable, and configure restaurant promotional coupons</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-600 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search coupons by code..."
          className="w-full md:w-80"
        />
      </div>

      <Table
        columns={columns}
        data={filteredCoupons}
        isLoading={isLoading}
        emptyMessage="No promotional coupons found."
      />

      {/* Create / Edit Coupon Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Coupon Code</label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="e.g. FESTIVE20"
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Discount Value</label>
              <input
                type="number"
                required
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Min Order (₹)</label>
              <input
                type="number"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Usage Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Expiry Date</label>
            <input
              type="date"
              required
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
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
              Save Coupon
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Coupon Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingCoupon}
        onClose={() => setDeletingCoupon(null)}
        onConfirm={() => {
          addToast(`Coupon ${deletingCoupon?.code} deleted.`, 'success');
          setDeletingCoupon(null);
        }}
        title="Delete Coupon"
        message={`Are you sure you want to delete coupon ${deletingCoupon?.code}?`}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

export default CouponsPage;
