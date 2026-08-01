import React, { useState } from 'react';
import { TrendingUp, BarChart2, PieChart as PieIcon, Flame, Clock, Users } from 'lucide-react';
import { Card } from '../components/common/StatCard';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'yearly'

  const getSeries = () => {
    switch (timeframe) {
      case 'weekly':
        return [
          { label: 'Mon', revenue: 32000, orders: 94, customers: 180 },
          { label: 'Tue', revenue: 38000, orders: 110, customers: 210 },
          { label: 'Wed', revenue: 41000, orders: 125, customers: 240 },
          { label: 'Thu', revenue: 45000, orders: 135, customers: 260 },
          { label: 'Fri', revenue: 62000, orders: 180, customers: 350 },
          { label: 'Sat', revenue: 78000, orders: 230, customers: 440 },
          { label: 'Sun', revenue: 71000, orders: 210, customers: 410 },
        ];
      case 'monthly':
        return [
          { label: 'Week 1', revenue: 240000, orders: 720, customers: 1400 },
          { label: 'Week 2', revenue: 280000, orders: 840, customers: 1650 },
          { label: 'Week 3', revenue: 310000, orders: 930, customers: 1800 },
          { label: 'Week 4', revenue: 345000, orders: 1020, customers: 1980 },
        ];
      case 'yearly':
        return [
          { label: 'Q1', revenue: 980000, orders: 2900, customers: 5800 },
          { label: 'Q2', revenue: 1120000, orders: 3400, customers: 6700 },
          { label: 'Q3', revenue: 1250000, orders: 3800, customers: 7400 },
          { label: 'Q4', revenue: 1420000, orders: 4200, customers: 8300 },
        ];
      default: // daily
        return [
          { label: '10 AM', revenue: 4200, orders: 14, customers: 28 },
          { label: '12 PM', revenue: 12500, orders: 42, customers: 75 },
          { label: '02 PM', revenue: 18400, orders: 58, customers: 110 },
          { label: '04 PM', revenue: 11200, orders: 35, customers: 64 },
          { label: '06 PM', revenue: 24800, orders: 78, customers: 145 },
          { label: '08 PM', revenue: 38900, orders: 118, customers: 220 },
          { label: '10 PM', revenue: 28400, orders: 86, customers: 160 },
        ];
    }
  };

  const popularItems = [
    { name: 'Butter Chicken Special', sales: 420, revenue: '₹1,89,000', percentage: '28%' },
    { name: 'Paneer Tikka Masala', sales: 310, revenue: '₹99,200', percentage: '21%' },
    { name: 'Tandoori Garlic Naan', sales: 890, revenue: '₹62,300', percentage: '18%' },
    { name: 'Special Mutton Biryani', sales: 240, revenue: '₹1,08,000', percentage: '15%' },
    { name: 'Cold Brew Coffee', sales: 180, revenue: '₹27,000', percentage: '8%' },
  ];

  const peakHoursData = [
    { hour: '12-2 PM (Lunch Peak)', intensity: 'High (88% Occupancy)' },
    { hour: '8-10 PM (Dinner Peak)', intensity: 'Maximum (96% Occupancy)' },
    { hour: '4-6 PM (Evening Tea)', intensity: 'Moderate (45% Occupancy)' },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Timeframe Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Executive Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Deep insights into revenue growth, order volume, popular dishes, and peak dining hours</p>
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
              <AreaChart data={getSeries()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
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
              <BarChart data={getSeries()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
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

      {/* Popular Items & Customer Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performing Dishes */}
        <Card title="Popular Menu Items" className="lg:col-span-2">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {popularItems.map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.name}</p>
                    <span className="text-[10px] text-slate-400">{item.sales} orders placed</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-extrabold text-slate-900 dark:text-white">{item.revenue}</p>
                  <span className="text-[10px] text-emerald-500 font-bold">{item.percentage} of sales</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Peak Dining Hours */}
        <Card title="Peak Dining Hours">
          <div className="space-y-4 text-xs">
            {peakHoursData.map((ph, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-amber-500 font-bold mb-1">
                  <Clock className="w-4 h-4" />
                  <span>{ph.hour}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-semibold">{ph.intensity}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
