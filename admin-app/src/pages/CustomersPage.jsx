import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Award, Ticket, Eye, RefreshCw } from 'lucide-react';
import Table from '../components/common/Table';
import StatusBadge from '../components/common/StatusBadge';
import SearchBar from '../components/common/SearchBar';
import Pagination from '../components/common/Pagination';
import Drawer from '../components/common/Drawer';
import api from '../api/axios';

export const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      try {
        const res = await api.get('/customer/status');
        const items = Array.isArray(res.data) ? res.data : (res.data ? [res.data] : []);
        return items.map((item, idx) => ({
          id: item.id || `CUST-${101 + idx}`,
          name: item.full_name || item.name || 'Customer User',
          email: item.email || 'N/A',
          phone: item.phone || 'N/A',
          type: item.type || item.role || 'registered',
          loyaltyPoints: item.loyaltyPoints ?? item.loyalty_points ?? 0,
          couponsUsed: item.couponsUsed ?? 0,
          totalOrders: item.totalOrders ?? 0,
          totalSpent: item.totalSpent ?? 0,
          history: item.history || [],
        }));
      } catch (err) {
        return [
          { id: 'CUST-101', name: 'John Doe', email: 'john@example.com', phone: '+91 98765 43210', type: 'registered', loyaltyPoints: 450, couponsUsed: 3, totalOrders: 12, totalSpent: 4850.00, history: [{ orderId: 'ORD-9021', date: '2026-08-01', total: 850 }] },
          { id: 'CUST-102', name: 'Sarah Smith', email: 'sarah@example.com', phone: '+91 98765 43211', type: 'registered', loyaltyPoints: 210, couponsUsed: 1, totalOrders: 5, totalSpent: 1820.00, history: [{ orderId: 'ORD-9020', date: '2026-08-01', total: 420 }] },
          { id: 'CUST-103', name: 'Guest Diner (Table 08)', email: 'N/A', phone: 'N/A', type: 'guest', loyaltyPoints: 0, couponsUsed: 0, totalOrders: 1, totalSpent: 1250.00, history: [{ orderId: 'ORD-9019', date: '2026-08-01', total: 1250 }] },
          { id: 'CUST-104', name: 'Emily Davis', email: 'emily@example.com', phone: '+91 98765 43213', type: 'registered', loyaltyPoints: 890, couponsUsed: 7, totalOrders: 28, totalSpent: 11400.00, history: [{ orderId: 'ORD-9018', date: '2026-08-01', total: 350 }] },
          { id: 'CUST-105', name: 'Guest Diner (Table 05)', email: 'N/A', phone: 'N/A', type: 'guest', loyaltyPoints: 0, couponsUsed: 0, totalOrders: 1, totalSpent: 600.00, history: [{ orderId: 'ORD-9017', date: '2026-08-01', total: 600 }] },
        ];
      }
    },
  });

  const filteredCustomers = (Array.isArray(customers) ? customers : []).filter((c) => {
    if (!c) return false;
    const nameStr = (c.name || c.full_name || '').toLowerCase();
    const emailStr = (c.email || '').toLowerCase();
    const phoneStr = (c.phone || '').toLowerCase();
    const typeStr = (c.type || c.role || '').toLowerCase();
    const matchesSearch =
      nameStr.includes(searchTerm.toLowerCase()) ||
      emailStr.includes(searchTerm.toLowerCase()) ||
      phoneStr.includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || typeStr === typeFilter;
    return matchesSearch && matchesType;
  });

  const pageSize = 5;
  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    { key: 'name', header: 'Customer Name', sortable: true, render: (val, row) => (
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{val}</p>
          <span className="text-[10px] text-slate-400">{row.email !== 'N/A' ? row.email : 'Walk-in Guest'}</span>
        </div>
      )
    },
    { key: 'type', header: 'Customer Type', sortable: true, render: (val) => <StatusBadge status={val} /> },
    { key: 'loyaltyPoints', header: 'Loyalty Points', sortable: true, render: (val) => <span className="font-bold text-amber-500">{val} pts</span> },
    { key: 'couponsUsed', header: 'Coupons Used', sortable: true, render: (val) => `${val} coupons` },
    { key: 'totalOrders', header: 'Total Orders', sortable: true },
    { key: 'totalSpent', header: 'Total Spent', sortable: true, render: (val) => <span className="font-bold">₹{val.toFixed(2)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <button
          onClick={() => setSelectedCustomer(row)}
          title="View Profile"
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage guest and registered customer profiles, loyalty points & coupons</p>
        </div>

        <button
          onClick={() => refetch()}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-amber-500" />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by customer name, email, or phone..."
          className="w-full md:w-80"
        />

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium shrink-0">
          {['all', 'registered', 'guest'].map((tp) => (
            <button
              key={tp}
              onClick={() => { setTypeFilter(tp); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                typeFilter === tp
                  ? 'bg-amber-500 text-white font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tp}
            </button>
          ))}
        </div>
      </div>

      <Table
        columns={columns}
        data={paginatedCustomers}
        isLoading={isLoading}
        emptyMessage="No customers found."
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredCustomers.length}
        pageSize={pageSize}
      />

      {/* Customer Profile Drawer */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Profile"
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-extrabold text-lg">
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</h4>
                <p className="text-slate-400">{selectedCustomer.email}</p>
                <StatusBadge status={selectedCustomer.type} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-amber-500 font-bold mb-1">
                  <Award className="w-4 h-4" />
                  <span>Loyalty Points</span>
                </div>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedCustomer.loyaltyPoints} pts</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-blue-500 font-bold mb-1">
                  <Ticket className="w-4 h-4" />
                  <span>Coupons Applied</span>
                </div>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedCustomer.couponsUsed} used</p>
              </div>
            </div>

            <div>
              <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-wider text-[11px]">Recent Order History</h5>
              <div className="space-y-2">
                {selectedCustomer.history?.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-amber-500">{h.orderId}</p>
                      <p className="text-[10px] text-slate-400">{h.date}</p>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">₹{h.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CustomersPage;
