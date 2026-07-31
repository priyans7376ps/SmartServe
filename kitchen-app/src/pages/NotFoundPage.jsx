import React from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-3xl bg-slate-800 text-amber-400 flex items-center justify-center mx-auto">
          <ChefHat className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white">404 - Page Not Found</h1>
        <p className="text-xs text-slate-400">
          The requested kitchen view does not exist or has been relocated.
        </p>
        <Link to="/">
          <Button variant="primary" size="md" icon={ArrowLeft}>
            Back to Live Order Queue
          </Button>
        </Link>
      </div>
    </div>
  );
}
