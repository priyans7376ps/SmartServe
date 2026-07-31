import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Flame, Star, Tag, ArrowRight, Utensils, Sparkles } from 'lucide-react';
import api from '../api/axios';
import FoodCard from '../components/ui/FoodCard';
import CategoryCard from '../components/ui/CategoryCard';
import Button from '../components/ui/Button';
import { FoodCardSkeleton, CategorySkeleton, PromoCardSkeleton, BannerSkeleton } from '../components/ui/SkeletonLoaders';
import { cn } from '../lib/cn';
import { pageVariants, staggerContainer, staggerItem } from '../lib/motion';

/* ── SECTION WRAPPER ─────────────────────────────────── */
function Section({ title, icon: Icon, iconClass, linkLabel, onLink, children, className }) {
  return (
    <section className={cn('space-y-4', className)} aria-labelledby={`section-${title.replace(/\s+/g, '-')}`}>
      <div className="section-header">
        <h2 className="section-title" id={`section-${title.replace(/\s+/g, '-')}`}>
          {Icon && <Icon className={cn('w-5 h-5', iconClass || 'text-brand-500')} aria-hidden="true" />}
          {title}
        </h2>
        {onLink && (
          <button onClick={onLink} className="section-link" aria-label={`${linkLabel} →`}>
            {linkLabel}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

/* ── PROMO CARD ──────────────────────────────────────── */
function PromoCard({ gradient, badge, title, subtitle, icon: Icon }) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 text-white shadow-md cursor-pointer select-none',
        'border border-white/10',
        gradient,
      )}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-label font-bold uppercase tracking-wider">
            {badge}
          </span>
          <h3 className="text-subtitle font-extrabold mt-1 line-clamp-1">{title}</h3>
          <p className="text-label text-white/80 leading-relaxed line-clamp-2">{subtitle}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
          <Icon className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── HOME PAGE ───────────────────────────────────────── */
export default function HomePage({ onOpenSearch }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [todaysSpecials, setTodaysSpecials] = useState([]);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [catRes, menuRes] = await Promise.all([
          api.get('/categories/'),
          api.get('/menu/'),
        ]);
        const cats = catRes.data || [];
        const menuItems = menuRes.data?.items || [];
        setCategories(cats);
        setTodaysSpecials(menuItems.filter((i) => i.is_todays_special));
        setRecommendedItems(menuItems.slice(0, 6));
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <motion.div
      {...pageVariants}
      className="space-y-10 pb-8"
    >
      {/* ── HERO ─────────────────────────────── */}
      <section aria-label="Welcome banner">
        {isLoading ? (
          <BannerSkeleton />
        ) : (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#1a0f00] to-slate-950 text-white shadow-2xl">
            {/* Background radial glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-3/4 h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.18),_transparent_70%)]" />
              <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(245,158,11,0.1),_transparent_70%)]" />
            </div>

            {/* Decorative circles */}
            <div className="absolute top-4 right-4 w-64 h-64 rounded-full border border-white/5 pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-8 -right-8 w-48 h-48 rounded-full border border-white/5 pointer-events-none" aria-hidden="true" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
              className="relative z-10 p-6 sm:p-10 max-w-2xl"
            >
              {/* Tag pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/15 border border-brand-500/30 rounded-full text-brand-400 text-label font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                Table-side Digital Ordering
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold leading-[1.1] tracking-tight mb-3">
                Craving Fresh &{' '}
                <span className="gradient-brand">Delicious?</span>
              </h1>

              <p className="text-sm sm:text-base text-white/70 font-medium max-w-md leading-relaxed mb-6">
                Browse our chef-curated menu, customize your order, and track live kitchen preparation — all from your table.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/menu')}
                  iconRight={ArrowRight}
                >
                  Explore Menu
                </Button>
                <Button
                  variant="glass"
                  size="lg"
                  onClick={() => onOpenSearch ? onOpenSearch() : navigate('/menu')}
                  icon={Search}
                >
                  Search Dishes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </section>

      {/* ── PROMO CARDS ──────────────────────── */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <PromoCard
          gradient="bg-gradient-to-br from-emerald-600 to-teal-700"
          badge="10% OFF"
          title="Use Coupon: WELCOME10"
          subtitle="Get 10% off your first table order!"
          icon={Tag}
        />
        <PromoCard
          gradient="bg-gradient-to-br from-brand-600 to-orange-600"
          badge="FLAT $5 OFF"
          title="Use Coupon: FLAT5"
          subtitle="$5 off orders above $30!"
          icon={Sparkles}
        />
      </motion.div>

      {/* ── CATEGORIES ───────────────────────── */}
      <Section
        title="Categories"
        icon={Utensils}
        linkLabel="Full Menu"
        onLink={() => navigate('/menu')}
      >
        <div
          className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4"
          role="list"
          aria-label="Menu categories"
        >
          <CategoryCard
            category={{ name: 'All Dishes' }}
            isActive={!selectedCategory}
            onClick={() => setSelectedCategory(null)}
          />
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  isActive={selectedCategory === cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    navigate(`/menu?category=${cat.id}`);
                  }}
                />
              ))}
        </div>
      </Section>

      {/* ── TODAY'S SPECIALS ─────────────────── */}
      {(isLoading || todaysSpecials.length > 0) && (
        <Section
          title="Today's Specials"
          icon={Flame}
          iconClass="text-red-500"
          linkLabel="See All"
          onLink={() => navigate('/menu?special=true')}
        >
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <FoodCardSkeleton key={i} />)
              : todaysSpecials.map((item) => <FoodCard key={item.id} item={item} />)}
          </motion.div>
        </Section>
      )}

      {/* ── RECOMMENDED ──────────────────────── */}
      <Section
        title="Recommended for You"
        icon={Star}
        iconClass="text-brand-500"
        linkLabel="View All"
        onLink={() => navigate('/menu')}
      >
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <FoodCardSkeleton key={i} />)
            : recommendedItems.map((item) => <FoodCard key={item.id} item={item} />)}
        </motion.div>
      </Section>
    </motion.div>
  );
}
