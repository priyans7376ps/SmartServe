import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Plus, Minus, Ticket, ArrowRight, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useTableStore } from '../../store/useTableStore';
import Button from './Button';
import { cn } from '../../lib/cn';
import { backdrop, slideRight, springs } from '../../lib/motion';

/* ── QUANTITY STEPPER ────────────────────────────────── */
function QuantityStepper({ quantity, onDecrease, onIncrease }) {
  return (
    <div
      className="flex items-center gap-1 bg-surface-0 border border-subtle rounded-xl p-1"
      role="group"
      aria-label="Item quantity"
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        transition={springs.snappy}
        onClick={onDecrease}
        className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-brand-500 hover:text-white flex items-center justify-center text-ink-secondary transition-colors touch-target"
        aria-label="Decrease quantity"
      >
        <Minus className="w-3 h-3" aria-hidden="true" />
      </motion.button>
      <span className="w-5 text-center text-caption font-bold text-ink-primary" aria-live="polite">
        {quantity}
      </span>
      <motion.button
        whileTap={{ scale: 0.85 }}
        transition={springs.snappy}
        onClick={onIncrease}
        className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-brand-500 hover:text-white flex items-center justify-center text-ink-secondary transition-colors touch-target"
        aria-label="Increase quantity"
      >
        <Plus className="w-3 h-3" aria-hidden="true" />
      </motion.button>
    </div>
  );
}

/* ── PRICE ROW ───────────────────────────────────────── */
function PriceRow({ label, value, variant = 'default' }) {
  return (
    <div className={cn('flex items-center justify-between text-caption', {
      'font-semibold text-ink-secondary': variant === 'default',
      'font-bold text-success-text':      variant === 'discount',
      'font-extrabold text-ink-primary text-body pt-3 border-t border-subtle mt-1': variant === 'total',
    })}>
      <span>{label}</span>
      <span className={variant === 'total' ? 'text-brand-500 text-subtitle font-black' : ''}>
        {value}
      </span>
    </div>
  );
}

/* ── CART DRAWER ─────────────────────────────────────── */
export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { tableNumber } = useTableStore();
  const {
    items,
    subtotal,
    taxAmount,
    discountAmount,
    totalAmount,
    couponCode,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    isLoading,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    const code = inputCoupon.trim().toUpperCase();
    if (!code) return;

    try {
      await applyCoupon(code);
      setInputCoupon('');
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
    }
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
        >
          {/* Backdrop */}
          <motion.div
            {...backdrop}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            {...slideRight}
            className="relative w-full max-w-md bg-surface-1 shadow-2xl flex flex-col border-l border-subtle"
          >
            {/* ── HEADER ─────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-glow-sm">
                  <ShoppingBag className="w-4.5 h-4.5" aria-hidden="true" />
                </div>
                <div className="leading-none">
                  <h2 className="text-subtitle font-bold text-ink-primary">Your Cart</h2>
                  <p className="text-caption text-ink-muted mt-0.5">Table #{tableNumber}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-surface-2 hover:bg-surface-0 flex items-center justify-center text-ink-muted hover:text-ink-primary transition-colors touch-target"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* ── ITEM LIST ──────────────────────── */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-none">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-brand-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-subtitle font-bold text-ink-primary mb-1">Cart is empty</h3>
                    <p className="text-caption text-ink-muted max-w-[200px] leading-relaxed">
                      Add delicious items from the menu to get started.
                    </p>
                  </div>
                  <Button variant="primary" onClick={onClose} size="md">
                    Browse Menu
                  </Button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {items.map((cartItem) => {
                    const itemPrice = cartItem.unit_price ?? 0;
                    const totalItemPrice = cartItem.subtotal ?? itemPrice * cartItem.quantity;
                    return (
                      <motion.div
                        key={cartItem.id}
                        layout
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={springs.smooth}
                        className="flex gap-3 p-3.5 bg-surface-2 border border-subtle rounded-2xl overflow-hidden"
                      >
                        <img
                          src={cartItem.menu_item_image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                          alt={cartItem.menu_item_name || 'Dish'}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 border border-subtle"
                          loading="lazy"
                        />
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-caption font-bold text-ink-primary line-clamp-1 flex-1">
                              {cartItem.menu_item_name}
                            </h4>
                            <button
                              onClick={() => removeItem(cartItem.id)}
                              className="p-1 text-ink-muted hover:text-error-500 transition-colors rounded-md touch-target shrink-0"
                              aria-label={`Remove ${cartItem.menu_item_name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <span className="text-caption font-black text-brand-500">
                              ₹{Number(totalItemPrice).toFixed(2)}
                            </span>
                            <QuantityStepper
                              quantity={cartItem.quantity}
                              onDecrease={() => updateQuantity(cartItem.id, cartItem.quantity - 1)}
                              onIncrease={() => updateQuantity(cartItem.id, cartItem.quantity + 1)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* ── SUMMARY & CHECKOUT ─────────────── */}
            {items.length > 0 && (
              <div className="border-t border-subtle bg-surface-0 p-6 space-y-5">
                {/* Coupon */}
                {couponCode ? (
                  <div className="flex items-center justify-between p-3.5 bg-success-bg border border-success-border rounded-2xl">
                    <div className="flex items-center gap-2 text-caption font-bold text-success-text">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>'{couponCode}' applied</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-caption font-bold text-error-500 hover:text-error-600 transition-colors"
                      aria-label="Remove coupon"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2" noValidate>
                    <div className="flex-1 relative">
                      <Ticket className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={inputCoupon}
                        onChange={(e) => setInputCoupon(e.target.value)}
                        aria-label="Coupon code"
                        aria-describedby={couponError ? 'coupon-error' : undefined}
                        className={cn(
                          'w-full h-10 pl-9 pr-3 rounded-xl text-caption font-medium uppercase',
                          'bg-surface-1 border text-ink-primary',
                          'focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
                          'transition-all duration-150',
                          couponError ? 'border-error-500' : 'border-default hover:border-strong',
                        )}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="h-10 px-4 rounded-xl bg-ink-primary hover:bg-brand-600 text-ink-inverse text-caption font-bold transition-colors touch-target"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && (
                  <p id="coupon-error" role="alert" className="text-caption text-error-text -mt-3">
                    {couponError}
                  </p>
                )}

                {/* Price breakdown */}
                <div className="space-y-2">
                  <PriceRow label="Subtotal"          value={`₹${Number(subtotal).toFixed(2)}`} />
                  <PriceRow label="GST (5%)"          value={`₹${Number(taxAmount).toFixed(2)}`} />
                  {discountAmount > 0 && (
                    <PriceRow label="Discount" value={`-₹${Number(discountAmount).toFixed(2)}`} variant="discount" />
                  )}
                  <PriceRow label="Grand Total" value={`₹${Number(totalAmount).toFixed(2)}`} variant="total" />
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  iconRight={ArrowRight}
                  onClick={handleCheckout}
                  aria-label="Proceed to checkout"
                >
                  Proceed to Checkout
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
