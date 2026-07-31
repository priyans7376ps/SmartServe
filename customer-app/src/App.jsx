import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import Navbar from './components/ui/Navbar';
import Footer from './components/ui/Footer';
import CartDrawer from './components/ui/CartDrawer';
import FilterDrawer from './components/ui/FilterDrawer';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import AuthPages from './pages/AuthPages';
import ProfilePage from './pages/ProfilePage';
import { NotFoundPage } from './pages/ErrorPages';
import { useTableStore } from './store/useTableStore';
import { useSettingsStore } from './store/useSettingsStore';

function TableInitializer() {
  const [searchParams] = useSearchParams();
  const setTableContext = useTableStore((state) => state.setTableContext);

  useEffect(() => {
    const tableNum = searchParams.get('table') || searchParams.get('t');
    const restId = searchParams.get('restaurant_id') || searchParams.get('rest');
    if (tableNum || restId) {
      setTableContext(tableNum ? parseInt(tableNum, 10) : 12, restId, null, null);
    }
  }, [searchParams, setTableContext]);

  return null;
}

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { darkMode } = useSettingsStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <Router>
      <TableInitializer />
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <Navbar
          onOpenCart={() => setIsCartOpen(true)}
          onOpenFilter={() => setIsFilterOpen(true)}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccessPage />} />
            <Route path="/order-tracking" element={<OrderTrackingPage />} />
            <Route path="/auth" element={<AuthPages />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />

        {/* Global Drawers */}
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </Router>
  );
}
