import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Eye, RefreshCw, ShoppingBag, Clock } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import Drawer from '../components/common/Drawer';
import adminApi from '../api/adminApi';

export const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const limit = 10;

  const { data: resData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'customers', searchTerm, currentPage],
    queryFn: () => adminApi.getCustomers({ query: searchTerm, skip: (currentPage - 1) * limit, limit }),
  });

  const { data: detailedCustomer } = useQuery({
    queryKey: ['admin', 'customer', selectedCustomerId],
    queryFn: () => adminApi.getCustomer(selectedCustomerId),
    enabled: !!selectedCustomerId,
  });

  const activeCustomer = detailedCustomer || selectedCustomer;

  const customers = resData?.items || [];
  const totalCount = resData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handleOpenCustomer = (row) => {
    setSelectedCustomer(row);
    if (row.id) {
      setSelectedCustomerId(row.id);
    }
  };

  const handleCloseCustomer = () => {
    setSelectedCustomer(null);
    setSelectedCustomerId(null);
  };

  const columns = [
    {
      header: 'Customer Name',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{row.full_name || 'Guest'}</p>
          <span className="text-[11px] text-slate-400">{row.email || 'Walk-in Guest'}</span>
        </div>
      ),
    },
    {
      header: 'Phone Number',
      accessor: (row) => <span className="font-semibold text-slate-600 dark:text-slate-300">{row.phone || 'N/A'}</span>,
    },
    {
      header: 'Loyalty Points',
      accessor: (row) => <span className="font-bold text-amber-500">{row.loyalty_points || 0} pts</span>,
    },
    {
      header: 'Total Orders',
      accessor: (row) => <span className="font-semibold text-slate-800 dark:text-slate-200">{row.total_orders || 0}</span>,
    },
    {
      header: 'Total Spent',
      accessor: (row) => <span className="font-bold text-slate-900 dark:text-white">₹{Number(row.total_spending || 0).toFixed(2)}</span>,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <button
          onClick={() => handleOpenCustomer(row)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold"
        >
          <Eye className="w-4 h-4" />
          <span>Profile</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Customer Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage guest and registered customer profiles, spending history & loyalty points</p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-amber-500 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          placeholder="Search by customer name, email, or phone..."
          className="w-full md:w-80"
        />
      </div>

      <Table
        columns={columns}
        data={customers}
        isLoading={isLoading}
        emptyMessage="No customer records found."
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Customer Profile Drawer */}
      <Drawer
        isOpen={!!activeCustomer}
        onClose={handleCloseCustomer}
        title="Customer Profile"
      >
        {activeCustomer && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-extrabold text-lg">
                {(activeCustomer.full_name || 'G').charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{activeCustomer.full_name || 'Guest Customer'}</h4>
                <p className="text-slate-400">{activeCustomer.email || 'N/A'}</p>
                <p className="text-slate-400">{activeCustomer.phone || 'N/A'}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold mb-1">
                <Award className="w-4 h-4" />
                <span>Loyalty Points</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900 dark:text-white">{activeCustomer.loyalty_points || 0} pts</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Total Orders Placed:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeCustomer.total_orders}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Total Spending:</span>
                <span className="font-bold text-amber-500">₹{Number(activeCustomer.total_spending || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Average Order Value:</span>
                <span className="font-bold text-slate-900 dark:text-white">₹{Number(activeCustomer.avg_order_value || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Member Since:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeCustomer.registration_date ? new Date(activeCustomer.registration_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Recent Orders of Customer */}
            {activeCustomer.recent_orders && activeCustomer.recent_orders.length > 0 && (
              <div>
                <h5 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Recent Orders</span>
                </h5>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {activeCustomer.recent_orders.map((o) => (
                    <div key={o.id} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
                      <div>
                        <span className="font-mono text-amber-500 font-bold block">{o.order_number}</span>
                        <span className="text-[10px] text-slate-400">{o.placed_at ? new Date(o.placed_at).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-slate-900 dark:text-white block">₹{Number(o.total_amount || 0).toFixed(2)}</span>
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomersPage;
