import React, { useState } from 'react';
import Modal from './Modal';
import { Download, FileText, Table as TableIcon } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';

export const ExportDialog = ({ isOpen, onClose, title = 'Export Data', onExportCSV }) => {
  const [format, setFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useUIStore();

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      if (format === 'csv') {
        if (onExportCSV) onExportCSV();
        else addToast('CSV Export generated successfully.', 'success');
      } else {
        addToast('PDF Export feature placeholder triggered.', 'info');
      }
      setIsExporting(false);
      onClose();
    }, 600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select the file format to export your table data.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormat('csv')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              format === 'csv'
                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <TableIcon className="w-6 h-6" />
            <span className="text-xs font-semibold">CSV Spreadsheet</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('pdf')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
              format === 'pdf'
                ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs font-semibold">PDF Document (Placeholder)</span>
          </button>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Download File'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportDialog;
