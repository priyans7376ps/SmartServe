import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Building, Clock, Receipt } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import adminApi from '../api/adminApi';
import { getErrorMessage } from '../utils/error';

export const RestaurantSettingsPage = () => {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: 'SmartServe Bistro',
    logo_url: '',
    address: '124 Gourmet Boulevard, Tech Park',
    phone: '+91 98765 00000',
    email: 'contact@smartserve.com',
    gstin: '27AAAAA0000A1Z5',
    tax_rate: 0.05,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    opening_time: '10:00',
    closing_time: '23:00',
    is_open: true,
  });

  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ['admin', 'restaurant'],
    queryFn: () => adminApi.getRestaurantSettings(),
  });

  useEffect(() => {
    if (serverSettings) {
      setForm((prev) => ({
        ...prev,
        name: serverSettings.name || prev.name,
        logo_url: serverSettings.logo_url || prev.logo_url,
        address: serverSettings.address || prev.address,
        phone: serverSettings.phone || prev.phone,
        email: serverSettings.email || prev.email,
        gstin: serverSettings.gstin || prev.gstin,
        tax_rate: serverSettings.tax_rate ?? prev.tax_rate,
        currency: serverSettings.currency || prev.currency,
        timezone: serverSettings.timezone || prev.timezone,
        opening_time: serverSettings.opening_time || prev.opening_time,
        closing_time: serverSettings.closing_time || prev.closing_time,
        is_open: serverSettings.is_open ?? prev.is_open,
      }));
    }
  }, [serverSettings]);

  const updateMutation = useMutation({
    mutationFn: (data) => adminApi.updateRestaurantSettings(data),
    onSuccess: () => {
      addToast('Restaurant settings updated successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurant'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
    onError: (err) => {
      addToast(getErrorMessage(err, 'Failed to update settings.'), 'error');
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Restaurant Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure restaurant operational parameters, tax details, currency & working hours</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Branding Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building className="w-4 h-4 text-amber-500" />
            General Information & Branding
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Restaurant Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Logo Image URL</label>
              <input
                type="text"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://cloud.com/logo.png"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Physical Address</label>
              <input
                type="text"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Phone</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Tax & Financials */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Receipt className="w-4 h-4 text-amber-500" />
            Taxation & Financial Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">GSTIN Registration</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tax Rate (Decimal e.g. 0.05 = 5%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="0.5"
                value={form.tax_rate}
                onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Currency Symbol</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Operating Schedule */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-amber-500" />
            Operating Schedule & Timezone
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Timezone</label>
              <input
                type="text"
                value={form.timezone}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Opening Hours</label>
              <input
                type="text"
                value={form.opening_time}
                onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Closing Hours</label>
              <input
                type="text"
                value={form.closing_time}
                onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 hover:bg-amber-600 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{updateMutation.isPending ? 'Saving...' : 'Save Restaurant Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantSettingsPage;
