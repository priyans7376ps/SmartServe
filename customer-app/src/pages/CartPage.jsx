import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, Ticket, ArrowRight, ArrowLeft, UtensilsCrossed, MessageSquare } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useTableStore } from '../store/useTableStore';
import Button from '../components/ui/Button';

export default function CartPage() {
  const navigate = useNavigate();
  const { tableNumber, restaurantName } = useTableStore();
  const {
    items,
    removeItem,
    updateQuantity,
    setNotes,
    coupon,
    applyCoupon,
    removeCoupon,
    specialInstructions,
    setSpecialInstructions,
    getSubtotal,
    getTax,
    getServiceCharge,
    getDiscount,
    getGrandTotal,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    if (couponCode.toUpperCase() === 'WELCOME10') {
      applyCoupon({
        code: 'WELCOME10',
        discount_type: 'percentage',
        discount_value: 10,
      });
      setCouponCode('');
    } else if (couponCode.toUpperCase() === 'FLAT5') {
      applyCoupon({
        code: 'FLAT5',
        discount_type: 'flat',
        discount_value: 5,
      });
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code. Try WELCOME10 or FLAT5');
    }
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 my-8 shadow-sm"
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
          <UtensilsCrossed className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          Your Table Cart is Empty
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 font-medium">
          Looks like you haven't added any delicious items to your order yet.
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate('/menu')} icon={ArrowLeft}>
          Browse Restaurant Menu
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 pb-16"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Table Order Summary
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
            Review your selected dishes for Table #{tableNumber} at {restaurantName}.
          </p>
        </div>
        <Link
          to="/menu"
          className="hidden sm:flex items-center gap-2 text-amber-500 hover:text-amber-600 font-extrabold text-xs sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Add More Items</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items List & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <AnimatePresence>
              {items.map(({ item, quantity, notes }) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 justify-between"
                >
                  <div className="flex gap-4">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                      alt={item.name}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            item.is_vegetarian ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 font-medium">
                        {item.description}
                      </p>
                      <span className="font-black text-amber-500 text-sm block">
                        ${Number(item.price).toFixed(2)} each
                      </span>

                      <input
                        type="text"
                        placeholder="Add note (e.g. Extra spicy, no onions)..."
                        value={notes || ''}
                        onChange={(e) => setNotes(item.id, e.target.value)}
                        className="mt-2 w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                    <span className="font-black text-slate-900 dark:text-white text-base">
                      ${(item.price * quantity).toFixed(2)}
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-colors text-slate-700 dark:text-slate-300 font-bold touch-target"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </motion.button>
                        <span className="w-6 text-center font-black text-xs">{quantity}</span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-colors text-slate-700 dark:text-slate-300 font-bold touch-target"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors touch-target"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Kitchen Special Instructions */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <label className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <span>Special Kitchen Instructions</span>
            </label>
            <textarea
              rows="3"
              placeholder="Allergies, table preferences, or dietary requirements for the chef..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Right Column: Checkout Summary Box */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6 sticky top-24">
            <h3 className="font-black text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Payment Summary
            </h3>

            <div>
              {coupon ? (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    <span>Coupon '{coupon.code}' Applied!</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-red-500 hover:text-red-700 text-xs font-extrabold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 uppercase"
                  />
                  <Button type="submit" variant="secondary" size="md">
                    Apply
                  </Button>
                </form>
              )}
              {couponError && <p className="text-[11px] font-bold text-red-500 mt-1">{couponError}</p>}
            </div>

            {/* Calculations */}
            <div className="space-y-3 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ${getSubtotal().toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>GST Tax (8%)</span>
                <span>${getTax().toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Service Charge (5%)</span>
                <span>${getServiceCharge().toFixed(2)}</span>
              </div>

              {getDiscount() > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Discount</span>
                  <span>-${getDiscount().toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 text-lg font-black text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span className="text-amber-500 text-xl">${getGrandTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => navigate('/checkout')}
              icon={ArrowRight}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
