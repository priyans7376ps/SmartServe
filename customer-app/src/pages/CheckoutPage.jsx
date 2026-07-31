import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, QrCode, CheckCircle2, ShieldCheck, ArrowRight, Utensils } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useTableStore } from '../store/useTableStore';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/ui/Button';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { tableNumber, restaurantName } = useTableStore();
  const { user } = useAuthStore();
  const {
    items,
    specialInstructions,
    getSubtotal,
    getTax,
    getServiceCharge,
    getDiscount,
    getGrandTotal,
    clearCart,
  } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState('pay_at_table');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const tokenNumber = Math.floor(1000 + Math.random() * 9000);
      const orderData = {
        tokenNumber,
        tableNumber,
        grandTotal: getGrandTotal(),
        itemCount: items.length,
        paymentMethod,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('active_order', JSON.stringify(orderData));
      clearCart();
      setIsSubmitting(false);
      navigate(`/order-success?token=${tokenNumber}`);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8 pb-16"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-full text-amber-800 dark:text-amber-300 font-extrabold text-xs">
          <Utensils className="w-3.5 h-3.5" />
          <span>Table #{tableNumber} &bull; {restaurantName}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Complete Your Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          Confirm table order details and select your preferred payment option.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Info Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Name</span>
                <span className="text-slate-900 dark:text-white font-extrabold">
                  {user?.full_name || 'Guest Diner'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Table</span>
                <span className="text-amber-500 font-extrabold">Table #{tableNumber}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Payment Method (Placeholder)
            </h3>

            <div className="space-y-3">
              <motion.label
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('pay_at_table')}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all touch-target ${
                  paymentMethod === 'pay_at_table'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                      Pay at Table (Cash / Card)
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Pay waiter or cash counter upon order completion
                    </span>
                  </div>
                </div>
                {paymentMethod === 'pay_at_table' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
              </motion.label>

              <motion.label
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('upi_qr')}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all touch-target ${
                  paymentMethod === 'upi_qr'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                      UPI / Digital QR Code
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Scan QR code on table screen using any UPI app
                    </span>
                  </div>
                </div>
                {paymentMethod === 'upi_qr' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
              </motion.label>

              <motion.label
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all touch-target ${
                  paymentMethod === 'card'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                      Card Swipe Terminal
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Staff will bring terminal to Table #{tableNumber}
                    </span>
                  </div>
                </div>
                {paymentMethod === 'card' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
              </motion.label>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Order Preview ({items.length} items)
            </h3>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {items.map(({ item, quantity }) => (
                <div key={item.id} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold flex items-center justify-center">
                      {quantity}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 line-clamp-1">{item.name}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    ${(item.price * quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & Charges</span>
                <span>${(getTax() + getServiceCharge()).toFixed(2)}</span>
              </div>
              {getDiscount() > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount</span>
                  <span>-${getDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-lg font-black text-slate-900 dark:text-white">
                <span>Total Amount</span>
                <span className="text-amber-500 text-lg">${getGrandTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handlePlaceOrder}
              isLoading={isSubmitting}
              icon={ArrowRight}
            >
              Place Order Now
            </Button>

            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Directly transmitted to Kitchen Display</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
