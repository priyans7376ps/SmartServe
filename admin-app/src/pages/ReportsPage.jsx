import React, { useState } from 'react';
import { FileBarChart, Download, FileText, Calendar, Table as TableIcon } from 'lucide-react';
import Card from '../components/common/StatCard';
import ExportDialog from '../components/common/ExportDialog';
import DatePicker from '../components/common/DatePicker';
import { useUIStore } from '../store/useUIStore';

export const ReportsPage = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '2026-08-01', endDate: '2026-08-31' });
  const { addToast } = useUIStore();

  const reportsList = [
    { id: 'sales', title: 'Sales Performance Report', desc: 'Detailed breakdown of sales by category, items, and dining mode.', icon: FileBarChart, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'revenue', title: 'Revenue & Taxes Ledger', desc: 'Financial audit report including gross revenue, discounts, and GST collected.', icon: FileBarChart, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'orders', title: 'Orders Lifecycle Report', desc: 'Detailed order metrics, preparation times, delay logs, and cancellations.', icon: FileBarChart, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'payments', title: 'Payments & Settlement Report', desc: 'Transaction history across UPI, Card, and Cash with refund breakdown.', icon: FileBarChart, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'customers', title: 'Customer Acquisition & Loyalty Report', desc: 'Guest vs registered customer ratio, coupon usage, and repeat diner rates.', icon: FileBarChart, color: 'text-cyan-500 bg-cyan-500/10' },
  ];

  const handleExportCSV = (reportTitle) => {
    addToast(`${reportTitle} exported to CSV successfully!`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Financial & Operational Reports</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Generate and export comprehensive restaurant audit reports</p>
        </div>

        <DatePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportsList.map((rep) => {
          const Icon = rep.icon;
          return (
            <div
              key={rep.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div className="space-y-2">
                <div className={`p-3 rounded-xl w-fit ${rep.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{rep.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{rep.desc}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleExportCSV(rep.title)}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => setSelectedReport(rep)}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF (Placeholder)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ExportDialog
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={`Export ${selectedReport?.title}`}
      />
    </div>
  );
};

export default ReportsPage;
