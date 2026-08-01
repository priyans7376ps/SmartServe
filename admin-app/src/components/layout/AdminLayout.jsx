import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import ToastContainer from '../common/ToastContainer';

export const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AdminLayout;
