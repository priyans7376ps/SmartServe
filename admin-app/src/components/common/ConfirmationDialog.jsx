import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
    <div className="flex flex-col items-center text-center p-2">
      <div className={`p-3.5 rounded-full mb-4 ${isDanger ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'}`}>
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">{message}</p>

      <div className="flex items-center gap-3 w-full">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-semibold shadow-md transition-all disabled:opacity-50 ${
            isDanger
              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
              : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
          }`}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </div>
  </Modal>
);

export default ConfirmationDialog;
