import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export const NotFoundPage = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
    <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
      <span className="text-3xl font-extrabold">404</span>
    </div>
    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Page Not Found</h2>
    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
      The administrative page or resource you are trying to access does not exist or has been moved.
    </p>
    <Link
      to="/dashboard"
      className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 hover:bg-amber-600 flex items-center gap-2"
    >
      <Home className="w-4 h-4" />
      <span>Return to Dashboard</span>
    </Link>
  </div>
);

export const ServerErrorPage = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
    <div className="w-20 h-20 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center">
      <AlertTriangle className="w-10 h-10" />
    </div>
    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">500 - Internal Server Error</h2>
    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
      Something went wrong on the server while processing your request. Please try again or contact system support.
    </p>
    <button
      onClick={() => window.location.reload()}
      className="mt-4 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-600/20 hover:bg-rose-700 flex items-center gap-2"
    >
      <RefreshCw className="w-4 h-4" />
      <span>Reload Page</span>
    </button>
  </div>
);

export default NotFoundPage;
