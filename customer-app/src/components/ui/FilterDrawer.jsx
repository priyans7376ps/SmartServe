import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RotateCcw } from 'lucide-react';
import Button from './Button';

export default function FilterDrawer({
  isOpen,
  onClose,
  categories = [],
  selectedCategory,
  setSelectedCategory,
  isVegOnly,
  setIsVegOnly,
  isNonVegOnly,
  setIsNonVegOnly,
  maxPrice,
  setMaxPrice,
  availableOnly,
  setAvailableOnly,
  onReset,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Filter Menu</h2>
              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Filter Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Dietary Type Filter */}
              <div>
                <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3 block">
                  Dietary Preference
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVegOnly(!isVegOnly);
                      if (!isVegOnly) setIsNonVegOnly(false);
                    }}
                    className={`p-3.5 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition-all touch-target ${
                      isVegOnly
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span>Veg Only</span>
                    {isVegOnly && <Check className="w-4 h-4 ml-auto" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsNonVegOnly(!isNonVegOnly);
                      if (!isNonVegOnly) setIsVegOnly(false);
                    }}
                    className={`p-3.5 rounded-2xl font-bold text-sm border flex items-center justify-center gap-2 transition-all touch-target ${
                      isNonVegOnly
                        ? 'bg-red-500 text-white border-red-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span>Non-Veg Only</span>
                    {isNonVegOnly && <Check className="w-4 h-4 ml-auto" />}
                  </button>
                </div>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3 block">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all touch-target ${
                        !selectedCategory
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all touch-target ${
                          selectedCategory === cat.id
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Filter Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Max Price
                  </label>
                  <span className="text-amber-500 font-black text-sm">${maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Availability Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  In-Stock Items Only
                </span>
                <button
                  type="button"
                  onClick={() => setAvailableOnly(!availableOnly)}
                  className={`w-12 h-7 rounded-full transition-colors relative touch-target ${
                    availableOnly ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                      availableOnly ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <Button variant="secondary" onClick={onReset} icon={RotateCcw}>
                Reset
              </Button>
              <Button variant="primary" className="flex-1" onClick={onClose}>
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
