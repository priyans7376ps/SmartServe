import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, AlertTriangle, Flame, ChefHat, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import KitchenStatsCard from '../components/ui/KitchenStatsCard';
import OrderCard from '../components/ui/OrderCard';
import OrderDetailsModal from '../components/ui/OrderDetailsModal';
import Button from '../components/ui/Button';
import { useKitchenOrderStore } from '../store/useKitchenOrderStore';
import { useWebSocketOrderHook } from '../hooks/useWebSocketOrderHook';
import { useSoundNotification } from '../hooks/useSoundNotification';
import { cn } from '../lib/cn';

export default function DashboardPage() {
  useWebSocketOrderHook();
  useSoundNotification();

  const {
    orders,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    isVegOnly,
    setIsVegOnly,
    isNonVegOnly,
    setIsNonVegOnly,
    priorityOnly,
    setPriorityOnly,
    fetchOrders,
    resetDemoOrders,
    isLoading,
  } = useKitchenOrderStore();

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && ord.status !== statusFilter) {
        return false;
      }

      // 2. Search Query (Token #, Table #, Customer, Food Name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchToken = String(ord.token_number || '').toLowerCase().includes(query);
        const matchTable = String(ord.table_number || '').toLowerCase().includes(query);
        const matchCustomer = String(ord.customer_name || '').toLowerCase().includes(query);
        const matchItem = (ord.items || []).some((item) => item.name?.toLowerCase().includes(query));

        if (!matchToken && !matchTable && !matchCustomer && !matchItem) {
          return false;
        }
      }

      // 3. Priority Filter
      if (priorityOnly && !ord.is_priority) {
        return false;
      }

      // 4. Veg / Non-Veg Filters
      if (isVegOnly) {
        const hasNonVeg = (ord.items || []).some((i) => i.is_veg === false);
        if (hasNonVeg) return false;
      }
      if (isNonVegOnly) {
        const hasVeg = (ord.items || []).some((i) => i.is_veg === true);
        if (hasVeg) return false;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery, priorityOnly, isVegOnly, isNonVegOnly]);

  const handleResetAllFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setIsVegOnly(false);
    setIsNonVegOnly(false);
    setPriorityOnly(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Kitchen Stats */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-amber-400" />
              <span>Kitchen Display System (KDS)</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Real-time live order queue, prep status tracking & kitchen dispatch
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={isLoading}
              onClick={() => fetchOrders()}
            >
              Refresh Queue
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={resetDemoOrders}
              title="Reset test orders"
            >
              Reset Samples
            </Button>
          </div>
        </div>

        {/* Stats Header Grid */}
        <KitchenStatsCard />
      </div>

      {/* Search & Quick Filters Bar */}
      <div className="p-4 bg-[#131b2e] border border-slate-800 rounded-3xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search token, table, food item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-medium text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setPriorityOnly(!priorityOnly)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border',
                priorityOnly
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-glow-rose'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Priority Only</span>
            </button>

            <button
              onClick={() => {
                setIsVegOnly(!isVegOnly);
                if (!isVegOnly) setIsNonVegOnly(false);
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                isVegOnly
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              )}
            >
              Veg Only
            </button>

            <button
              onClick={() => {
                setIsNonVegOnly(!isNonVegOnly);
                if (!isNonVegOnly) setIsVegOnly(false);
              }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                isNonVegOnly
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              )}
            >
              Non-Veg Only
            </button>

            {(statusFilter !== 'all' || searchQuery || priorityOnly || isVegOnly || isNonVegOnly) && (
              <button
                onClick={handleResetAllFilters}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 ml-auto md:ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-[#131b2e] border border-slate-800 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto">
            <ChefHat className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No active orders in queue</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              All caught up! No orders match the selected filters or status tag.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetAllFilters}>
            Show All Orders
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewDetails={handleOpenDetails}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
}
