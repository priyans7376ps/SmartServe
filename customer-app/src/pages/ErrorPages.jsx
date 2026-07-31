import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCcw, UtensilsCrossed } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-16">
      <div className="w-24 h-24 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
        <UtensilsCrossed className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">404 - Page Not Found</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          The menu item or page you are looking for does not exist on our table service.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-2xl shadow-glow transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}

export function ServerErrorPage() {
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-16">
      <div className="w-24 h-24 mx-auto rounded-3xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">500 - Server Error</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Something went wrong on our server. Please try refreshing or call your table server.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all"
      >
        <RefreshCcw className="w-4 h-4" />
        <span>Refresh Page</span>
      </button>
    </div>
  );
}
