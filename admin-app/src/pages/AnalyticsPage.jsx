import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { Card } from '../components/common/StatCard';
import adminApi from '../api/adminApi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState('daily');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'revenue', timeframe],
    queryFn: () => adminApi.getRevenueAnalytics(timeframe),
  });

  const series = analytics?.series || [];
  const categorySales = analytics?.by_category || [];

  return (
    <div className="space-y-8">
      {/* Header with Timeframe Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Executive Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Deep insights into database revenue growth, order volume, category performance, and peak dining hours</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold shrink-0">
          {['daily', 'weekly', 'monthly', 'yearly'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                timeframe === tf
                  ? 'bg-amber-500 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Chart */}
        <Card title={`Revenue Growth (${timeframe.toUpperCase()})`}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1420',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Orders Volume Chart */}
        <Card title={`Orders Volume (${timeframe.toUpperCase()})`}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1420',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Popular Categories & Customer Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Categories */}
        <Card title="Revenue Breakdown by Category" className="lg:col-span-2">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {categorySales.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                    <span className="text-[10px] text-slate-400">{item.value}% contribution</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-slate-900 dark:text-white">₹{Number(item.amount || 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Peak Dining Hours */}
        <Card title="Peak Operating Hours">
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-500 font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>12:00 PM - 02:30 PM</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-semibold">Lunch Peak Dining</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-2 text-amber-500 font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>08:00 PM - 10:30 PM</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-semibold">Dinner Peak Velocity</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
