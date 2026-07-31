import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ArrowUpDown, Frown, X } from 'lucide-react';
import api from '../api/axios';
import FoodCard from '../components/ui/FoodCard';
import CategoryCard from '../components/ui/CategoryCard';
import FilterDrawer from '../components/ui/FilterDrawer';
import Button from '../components/ui/Button';
import { FoodCardSkeleton, CategorySkeleton } from '../components/ui/SkeletonLoaders';
import { cn } from '../lib/cn';
import { pageVariants, staggerContainer, staggerItem } from '../lib/motion';

/* ── DIET TOGGLE PILL ────────────────────────────────── */
function DietPill({ active, color, dot, label, onClick }) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-label font-bold',
        'transition-all duration-200 touch-target border',
        active
          ? `${color} text-white shadow-sm border-transparent`
          : 'bg-surface-2 border-subtle text-ink-secondary hover:border-default',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} aria-hidden="true" />
      {label}
    </motion.button>
  );
}

/* ── MENU PAGE ───────────────────────────────────────── */
export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catQuery = searchParams.get('category');

  const [items, setItems]             = useState([]);
  const [categories, setCategories]   = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(catQuery || null);
  const [isVegOnly, setIsVegOnly]     = useState(false);
  const [isNonVegOnly, setIsNonVegOnly] = useState(false);
  const [maxPrice, setMaxPrice]       = useState(100);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortOption, setSortOption]   = useState('name');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters = isVegOnly || isNonVegOnly || selectedCategory || searchQuery || availableOnly;

  useEffect(() => {
    api.get('/categories/')
      .then((res) => setCategories(res.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const params = { limit: 100, sort_by: sortOption };
        if (searchQuery.trim()) params.q = searchQuery;
        if (selectedCategory) params.category_id = selectedCategory;
        if (isVegOnly) params.is_veg = true;
        if (availableOnly) params.is_available = true;
        if (maxPrice < 100) params.max_price = maxPrice;

        const endpoint = searchQuery.trim() ? '/menu/search' : '/menu/';
        const res = await api.get(endpoint, { params });
        let result = res.data?.items || res.data || [];
        if (isNonVegOnly) result = result.filter((i) => !i.is_vegetarian);
        setItems(result);
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
      } finally {
        setIsLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, isVegOnly, isNonVegOnly, maxPrice, availableOnly, sortOption]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setIsVegOnly(false);
    setIsNonVegOnly(false);
    setMaxPrice(100);
    setAvailableOnly(false);
    setSortOption('name');
    setSearchParams({});
  };

  return (
    <motion.div {...pageVariants} className="space-y-6 pb-10">

      {/* ── PAGE HEADER ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-h1 font-display font-extrabold text-ink-primary">Restaurant Menu</h1>
          <p className="text-caption text-ink-muted mt-1 font-medium">
            Explore our chef-crafted selection of starters, mains, and desserts.
          </p>
        </div>

        {/* Sort + Filter */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort select */}
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              aria-label="Sort menu items"
              className={cn(
                'appearance-none h-10 pl-4 pr-9 rounded-xl text-caption font-bold',
                'bg-surface-1 border border-default text-ink-primary',
                'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                'cursor-pointer transition-all duration-150 touch-target',
              )}
            >
              <option value="name">Name</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="rating">Top Rated</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          </div>

          <Button
            variant="secondary"
            size="icon-md"
            onClick={() => setIsFilterOpen(true)}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* ── SEARCH BAR ───────────────────────── */}
      <div className="relative">
        <Search className="w-4.5 h-4.5 text-brand-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search dishes, ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search menu"
          className={cn(
            'w-full h-12 pl-11 pr-10 rounded-2xl text-body font-medium',
            'bg-surface-1 border border-default text-ink-primary',
            'placeholder:text-ink-muted',
            'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            'transition-all duration-200',
          )}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-ink-muted hover:text-ink-primary transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* ── CATEGORY CHIPS ───────────────────── */}
      <div
        className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4"
        role="radiogroup"
        aria-label="Filter by category"
      >
        <CategoryCard
          category={{ name: 'All' }}
          isActive={!selectedCategory}
          onClick={() => { setSelectedCategory(null); setSearchParams({}); }}
        />
        {categories.length === 0 && isLoading
          ? Array.from({ length: 4 }).map((_, i) => <CategorySkeleton key={i} />)
          : categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                isActive={selectedCategory === cat.id}
                onClick={() => {
                  const next = selectedCategory === cat.id ? null : cat.id;
                  setSelectedCategory(next);
                  next ? setSearchParams({ category: next }) : setSearchParams({});
                }}
              />
            ))}
      </div>

      {/* ── DIET TOGGLES ─────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <DietPill
          active={isVegOnly}
          color="bg-success-500"
          dot="bg-success-500"
          label="Veg Only"
          onClick={() => { setIsVegOnly(!isVegOnly); if (!isVegOnly) setIsNonVegOnly(false); }}
        />
        <DietPill
          active={isNonVegOnly}
          color="bg-error-500"
          dot="bg-error-500"
          label="Non-Veg Only"
          onClick={() => { setIsNonVegOnly(!isNonVegOnly); if (!isNonVegOnly) setIsVegOnly(false); }}
        />
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="ml-auto flex items-center gap-1 text-label font-bold text-ink-muted hover:text-brand-500 transition-colors"
            aria-label="Clear all filters"
          >
            <X className="w-3 h-3" aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      {/* ── RESULTS COUNT ────────────────────── */}
      {!isLoading && items.length > 0 && (
        <p className="text-caption text-ink-muted font-medium" aria-live="polite">
          {items.length} {items.length === 1 ? 'dish' : 'dishes'} found
        </p>
      )}

      {/* ── FOOD GRID ────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <FoodCardSkeleton key={i} />)}
        </div>
      ) : items.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-surface-1 border border-subtle"
        >
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mb-4">
            <Frown className="w-8 h-8 text-brand-400" aria-hidden="true" />
          </div>
          <h3 className="text-subtitle font-bold text-ink-primary mb-1">No dishes found</h3>
          <p className="text-caption text-ink-muted max-w-xs mb-6 leading-relaxed">
            Try a different search term or reset your active filters.
          </p>
          <Button variant="primary" onClick={handleResetFilters} size="md">
            Reset Filters
          </Button>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence>
            {items.map((item) => (
              <motion.div key={item.id} variants={staggerItem}>
                <FoodCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isVegOnly={isVegOnly}
        setIsVegOnly={setIsVegOnly}
        isNonVegOnly={isNonVegOnly}
        setIsNonVegOnly={setIsNonVegOnly}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        availableOnly={availableOnly}
        setAvailableOnly={setAvailableOnly}
        onReset={handleResetFilters}
      />
    </motion.div>
  );
}
