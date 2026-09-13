import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Modal from '../components/common/Modal';
import ConfirmationDialog from '../components/common/ConfirmationDialog';
import { useUIStore } from '../store/useUIStore';
import adminApi from '../api/adminApi';
import { getErrorMessage } from '../utils/error';

export const CouponsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 15,
    min_order_amount: 200,
    max_usage_count: 100,
    is_active: true,
  });

  const { data: coupons = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => adminApi.getCoupons(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingCoupon) {
        return adminApi.updateCoupon(editingCoupon.id, data);
      } else {
        return adminApi.createCoupon(data);
      }
    },
    onSuccess: () => {
      addToast(editingCoupon ? 'Coupon updated.' : 'New coupon created.', 'success');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, 'Failed to save coupon.'), 'error');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (coupon) => adminApi.updateCoupon(coupon.id, { is_active: !coupon.is_active }),
    onSuccess: () => {
      addToast('Coupon status toggled.', 'info');
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, 'Failed to toggle coupon status.'), 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (couponId) => adminApi.deleteCoupon(couponId),
    onSuccess: () => {
      addToast('Coupon deleted.', 'success');
      setDeletingCoupon(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, 'Failed to delete coupon.'), 'error');
    }
  });

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 15,
      min_order_amount: 200,
      max_usage_count: 100,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type || coupon.discountType || 'percentage',
      discount_value: coupon.discount_value || coupon.discountValue || 15,
      min_order_amount: coupon.min_order_amount || coupon.minOrderValue || 0,
      max_usage_count: coupon.max_usage_count || coupon.usageLimit || 100,
      is_active: coupon.is_active ?? coupon.enabled ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const filteredCoupons = coupons.filter((c) => (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()));

  const columns = [
    { header: 'Coupon Code', accessor: (row) => <span className="font-mono font-bold text-amber-500">{row.code}</span> },
    {
      header: 'Discount',
      accessor: (row) => (
        <span className="font-bold text-slate-800 dark:text-slate-100">
          {(row.discount_type || row.discountType) === 'percentage'
            ? `${row.discount_value || row.discountValue}% OFF`
            : `₹${row.discount_value || row.discountValue} FLAT`}
        </span>
      ),
    },
    { header: 'Min Order', accessor: (row) => `₹${row.min_order_amount || row.minOrderValue || 0}` },
    { header: 'Usage Count', accessor: (row) => `${row.used_count || row.usedCount || 0} / ${row.max_usage_count || row.usageLimit || '∞'}` },
    { header: 'Status', accessor: (row) => <StatusBadge status={(row.is_active ?? row.enabled) ? 'active' : 'inactive'} /> },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleMutation.mutate(row)}
            title="Enable/Disable"
            className="p-1 rounded-lg text-slate-500 hover:text-amber-500"
          >
            {(row.is_active ?? row.enabled) ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
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
            <span>Create Coupon</span>
          </button>
        </div>
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
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Discount Value</label>
              <input
                type="number"
                required
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Min Order (₹)</label>
              <input
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Usage Limit</label>
              <input
                type="number"
                value={formData.max_usage_count}
                onChange={(e) => setFormData({ ...formData, max_usage_count: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>
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
              {saveMutation.isPending ? 'Saving...' : 'Save Coupon'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Coupon Dialog */}
      {deletingCoupon && (
        <ConfirmationDialog
          isOpen={!!deletingCoupon}
          onClose={() => setDeletingCoupon(null)}
          onConfirm={() => deleteMutation.mutate(deletingCoupon.id)}
          title="Delete Coupon"
          message={`Are you sure you want to delete coupon ${deletingCoupon.code}?`}
          confirmLabel="Delete"
          isDanger={true}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default CouponsPage;
