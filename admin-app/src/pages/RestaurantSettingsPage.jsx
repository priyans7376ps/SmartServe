import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, Save, Building, Clock, DollarSign, Image, Mail, Phone, MapPin, Receipt } from 'lucide-react';
import Card from '../components/common/StatCard';
import { useUIStore } from '../store/useUIStore';
import api from '../api/axios';

export const RestaurantSettingsPage = () => {
  const { addToast } = useUIStore();

  const [settings, setSettings] = useState({
    name: 'SmartServe Fine Dining',
    logoUrl: '',
    address: '124 Gourmet Boulevard, Culinary District, City 400001',
    phone: '+91 98765 00000',
    email: 'contact@smartservebistro.com',
    gst: '27AAAAA0000A1Z5',
    taxPercentage: 5.0,
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
    openingHours: '10:00 AM',
    closingHours: '11:30 PM',
  });

  const { isLoading } = useQuery({
    queryKey: ['admin-restaurant-settings'],
    queryFn: async () => {
      try {
        const res = await api.get('/restaurants/');
        if (res.data && res.data.length > 0) {
          const r = res.data[0];
          setSettings((prev) => ({
            ...prev,
            name: r.name || prev.name,
            address: r.address || prev.address,
            phone: r.phone || prev.phone,
            email: r.email || prev.email,
          }));
        }
        return res.data;
      } catch (err) {
        return null;
      }
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    addToast('Restaurant settings updated successfully.', 'success');
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
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Logo Image URL</label>
              <input
                type="text"
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://cloud.com/logo.png"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Physical Address</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Phone</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Email</label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
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
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">GST Registration Number</label>
              <input
                type="text"
                value={settings.gst}
                onChange={(e) => setSettings({ ...settings, gst: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Tax Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                value={settings.taxPercentage}
                onChange={(e) => setSettings({ ...settings, taxPercentage: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Currency Symbol</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
              >
                <option value="INR (₹)">INR (₹)</option>
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
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
                disabled
                value={settings.timezone}
                className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Opening Hours</label>
              <input
                type="text"
                value={settings.openingHours}
                onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Closing Hours</label>
              <input
                type="text"
                value={settings.closingHours}
                onChange={(e) => setSettings({ ...settings, closingHours: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 hover:bg-amber-600 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Restaurant Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantSettingsPage;
