import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Flame,
  ChefHat,
  XCircle,
  TrendingUp,
  Timer,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import { Card } from '../components/common/StatCard';
import { SkeletonCard } from '../components/common/Loader';
import adminApi from '../api/adminApi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage = () => {
  // Fetch Real Live Metrics using TanStack Query
  const { data: stats, isLoading: isLoadingStats, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => adminApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const { data: revenueSeries = [] } = useQuery({
    queryKey: ['admin', 'dashboard', 'hourly'],
    queryFn: () => adminApi.getHourlyRevenue(),
    refetchInterval: 30000,
  });

  const { data: categorySales = [] } = useQuery({
    queryKey: ['admin', 'dashboard', 'category-sales'],
    queryFn: () => adminApi.getCategorySales(),
    refetchInterval: 30000,
  });

  if (isLoadingStats || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const comparisonText = stats.revenue_comparison
    ? `${stats.revenue_comparison.percentage_change >= 0 ? '+' : ''}${stats.revenue_comparison.percentage_change}%`
    : '+0%';

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Restaurant Admin Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time monitoring for <span className="font-semibold text-amber-500">{stats.restaurant_name}</span>
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 text-amber-500 ${isFetching ? 'animate-spin' : ''}`} />
          <span>{isFetching ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* Summary Cards Grid (Real Backend Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`₹${stats.today_revenue.toLocaleString()}`}
          change={comparisonText}
          changeType={stats.revenue_comparison?.trend === 'down' ? 'negative' : 'positive'}
          icon={DollarSign}
          iconBg="bg-amber-500/10 text-amber-500"
          description="vs yesterday"
        />
        <StatCard
          title="Today's Orders"
          value={stats.today_orders}
          change="Real-time"
          changeType="positive"
          icon={ShoppingBag}
          iconBg="bg-blue-500/10 text-blue-500"
          description="Total received"
        />
        <StatCard
          title="Completed Orders"
          value={stats.completed_orders}
          change={`${stats.today_orders > 0 ? Math.round((stats.completed_orders / stats.today_orders) * 100) : 100}%`}
          changeType="positive"
          icon={CheckCircle2}
          iconBg="bg-emerald-500/10 text-emerald-500"
          description="Success rate"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pending_orders}
          change="Requires action"
          changeType="neutral"
          icon={Clock}
          iconBg="bg-amber-500/10 text-amber-500"
          description="New orders awaiting"
        />
        <StatCard
          title="Preparing Orders"
          value={stats.preparing_orders}
          change="In Kitchen"
          changeType="neutral"
          icon={Flame}
          iconBg="bg-orange-500/10 text-orange-500"
          description="Active preparation"
        />
        <StatCard
          title="Ready Orders"
          value={stats.ready_orders}
          change="To Serve"
          changeType="positive"
          icon={ChefHat}
          iconBg="bg-indigo-500/10 text-indigo-500"
          description="Awaiting pickup"
        />
        <StatCard
          title="Cancelled Orders"
          value={stats.cancelled_orders}
          change="Cancelled"
          changeType="negative"
          icon={XCircle}
          iconBg="bg-rose-500/10 text-rose-500"
          description="Cancellation count"
        />
        <StatCard
          title="Avg Order Value"
          value={`₹${stats.avg_order_value}`}
          change="AOV"
          changeType="positive"
          icon={TrendingUp}
          iconBg="bg-teal-500/10 text-teal-500"
          description="Per order average"
        />
        <StatCard
          title="Avg Prep Time"
          value={`${stats.avg_prep_time_minutes} mins`}
          change="Target: 20m"
          changeType="positive"
          icon={Timer}
          iconBg="bg-purple-500/10 text-purple-500"
          description="Kitchen efficiency"
        />
        <StatCard
          title="Total Customers"
          value={stats.total_customers}
          change="Unique Diners"
          changeType="positive"
          icon={Users}
          iconBg="bg-cyan-500/10 text-cyan-500"
          description="Customer count"
        />
        <StatCard
          title="Guest Customers"
          value={stats.guest_customers}
          change="Walk-in"
          changeType="neutral"
          icon={UserX}
          iconBg="bg-slate-500/10 text-slate-500"
          description="Walk-in dining"
        />
        <StatCard
          title="Registered Customers"
          value={stats.registered_customers}
          change="Members"
          changeType="positive"
          icon={UserCheck}
          iconBg="bg-emerald-500/10 text-emerald-500"
          description="Loyalty members"
        />
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <Card title="Hourly Revenue & Order Velocity" className="lg:col-span-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f1420',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Sales Breakdown */}
        <Card title="Sales by Category">
          <div className="h-72 w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie data={categorySales} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {categorySales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#f59e0b'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 w-full pt-2">
              {categorySales.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || '#f59e0b' }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{cat.name}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 ml-auto">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
