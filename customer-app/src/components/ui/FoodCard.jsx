import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Clock, Star } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import Badge from './Badge';
import { cn } from '../../lib/cn';
import { springs, staggerItem } from '../../lib/motion';

const FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

export default function FoodCard({ item }) {
  const { items, addItem, updateQuantity, removeItem } = useCartStore();

  const price = item.price ?? item.base_price ?? 0;
  const isVeg = item.is_veg ?? item.is_vegetarian ?? false;
  const isSpecial = item.is_todays_special ?? item.is_chef_special ?? false;
  const prepTime = item.preparation_time ?? item.prep_time ?? 15;

  const cartEntry = items.find((i) => i.menu_item_id === item.id || i.item?.id === item.id);
  const quantity = cartEntry?.quantity ?? 0;

  const handleAdd = async (e) => {
    e.stopPropagation();
    try {
      await addItem(item.id, 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleIncrease = async (e) => {
    e.stopPropagation();
    if (!cartEntry) return;
    try {
      await updateQuantity(cartEntry.id, quantity + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecrease = async (e) => {
    e.stopPropagation();
    if (!cartEntry) return;
    try {
      if (quantity === 1) {
        await removeItem(cartEntry.id);
      } else {
        await updateQuantity(cartEntry.id, quantity - 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.article
      variants={staggerItem}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="group relative bg-surface-1 border border-subtle rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
      aria-label={`${item.name}, ${isVeg ? 'vegetarian' : 'non-vegetarian'}, ₹${Number(price).toFixed(2)}`}
    >
      {/* ── IMAGE ZONE ─────────────────────────────── */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
        <motion.img
          src={item.image_url || FALLBACK}
          alt={item.name}
          className="w-full h-full object-cover"
          transition={{ duration: 0.5, ease: 'easeOut' }}
          whileHover={{ scale: 1.06 }}
          onError={(e) => { e.target.src = FALLBACK; }}
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
          <Badge variant={isVeg ? 'veg' : 'non-veg'} />

          {prepTime && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-label">
              <Clock className="w-3 h-3 text-brand-400" aria-hidden="true" />
              <span>{prepTime}m</span>
            </div>
          )}
        </div>

        {/* Bottom overlay badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
          {isSpecial && <Badge variant="special" />}
          {item.is_featured && <Badge variant="popular" />}
        </div>

        {/* Unavailable overlay */}
        {item.is_available === false && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <span className="px-4 py-2 bg-surface-1/90 text-ink-secondary text-caption font-bold rounded-full border border-default">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* ── CONTENT ────────────────────────────────── */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Title + Rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-subtitle text-ink-primary line-clamp-1 group-hover:text-brand-500 transition-colors duration-150 flex-1">
            {item.name}
          </h3>
          {item.rating > 0 && (
            <div
              className="flex items-center gap-1 shrink-0 text-brand-500"
              aria-label={`Rated ${item.rating.toFixed(1)} out of 5`}
            >
              <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span className="text-caption font-bold">{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-caption text-ink-muted line-clamp-2 leading-relaxed flex-1 min-h-[2.25rem]">
          {item.description || 'Chef-crafted specialty prepared fresh with premium ingredients.'}
        </p>

        {/* Price + Action */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-subtle">
          <div className="flex flex-col">
            <span className="text-label text-ink-muted uppercase tracking-wider">Price</span>
            <span className="text-h3 font-extrabold text-ink-primary">
              ₹{Number(price).toFixed(2)}
            </span>
          </div>

          {item.is_available !== false && (
            quantity > 0 ? (
              /* Quantity stepper */
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springs.bouncy}
                className="flex items-center gap-1.5 bg-brand-500 rounded-xl p-1 shadow-glow-sm"
                role="group"
                aria-label="Quantity controls"
              >
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  transition={springs.snappy}
                  onClick={handleDecrease}
                  className="w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-700 flex items-center justify-center text-white transition-colors touch-target"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                </motion.button>

                <span className="w-6 text-center text-caption font-black text-white" aria-live="polite">
                  {quantity}
                </span>

                <motion.button
                  whileTap={{ scale: 0.88 }}
                  transition={springs.snappy}
                  onClick={handleIncrease}
                  className="w-8 h-8 rounded-lg bg-brand-600 hover:bg-brand-700 flex items-center justify-center text-white transition-colors touch-target"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </motion.button>
              </motion.div>
            ) : (
              /* Add button */
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                transition={springs.snappy}
                onClick={handleAdd}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5',
                  'bg-gradient-to-b from-brand-400 to-brand-600 hover:from-brand-300 hover:to-brand-500',
                  'text-white text-btn rounded-xl shadow-glow-sm hover:shadow-glow',
                  'border border-brand-500/50 transition-shadow duration-200 touch-target',
                )}
                aria-label={`Add ${item.name} to cart`}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Add</span>
              </motion.button>
            )
          )}
        </div>
      </div>
    </motion.article>
  );
}
