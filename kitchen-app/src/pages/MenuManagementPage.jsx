import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit3, Trash2, Flame, Sparkles, Star, Clock, Check, X, UtensilsCrossed } from 'lucide-react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import MenuItemModal from '../components/ui/MenuItemModal';
import { cn } from '../lib/cn';

export default function MenuManagementPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchMenuData = async () => {
    setIsLoading(true);
    try {
      const [catRes, menuRes] = await Promise.all([
        api.get('/categories/'),
        api.get('/menu/?limit=100'),
      ]);
      setCategories(catRes.data || []);
      setItems(menuRes.data?.items || menuRes.data || []);
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const handleCreate = () => {
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.delete(`/menu/${itemId}`);
      fetchMenuData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete item.');
    }
  };

  const handleToggleStock = async (item) => {
    try {
      await api.put(`/menu/${item.id}`, {
        is_available: !item.is_available,
      });
      fetchMenuData();
    } catch (err) {
      // Fallback local update
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !i.is_available } : i))
      );
    }
  };

  const handleToggleSpecial = async (item) => {
    try {
      await api.put(`/menu/${item.id}`, {
        is_todays_special: !item.is_todays_special,
      });
      fetchMenuData();
    } catch (err) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_todays_special: !i.is_todays_special } : i))
      );
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (selectedCategory && item.category_id !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-7 h-7 text-amber-400" />
            <span>Kitchen Menu Management</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Create, update stock availability, prep time & special chef picks
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={handleCreate}>
          Create New Item
        </Button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="p-4 bg-[#131b2e] border border-slate-800 rounded-3xl space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dish by name or ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-medium text-slate-100 outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                selectedCategory === ''
                  ? 'bg-amber-500 text-white shadow-glow-amber'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              )}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-white shadow-glow-amber'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 font-bold text-xs">
          Loading kitchen menu catalog...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-16 text-center bg-[#131b2e] border border-slate-800 rounded-3xl space-y-3">
          <UtensilsCrossed className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No menu items found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Try adjusting your search query or create a new item.
          </p>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleCreate}>
            Create Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  'bg-[#131b2e] border rounded-3xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4',
                  !item.is_available ? 'border-rose-500/30 opacity-80' : 'border-slate-800'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-sm text-white line-clamp-1">{item.name}</h3>
                        <Badge type="diet" value={item.is_vegetarian} />
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-slate-800/60">
                    <span className="text-lg font-black text-amber-400 font-mono">
                      ${Number(item.price || 0).toFixed(2)}
                    </span>

                    <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{item.preparation_time || 15}m prep</span>
                    </div>
                  </div>

                  {/* Tags Row */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.is_todays_special && <Badge type="tag" value="special" />}
                    {item.is_featured && <Badge type="tag" value="popular" />}
                    <Badge type="tag" value={item.is_available ? 'enabled' : 'disabled'} text={item.is_available ? 'In Stock' : 'Out of Stock'} />
                  </div>
                </div>

                {/* Controls Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleStock(item)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border',
                      item.is_available
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-rose-500/20 hover:text-rose-400'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                    )}
                  >
                    {item.is_available ? 'Mark Out of Stock' : 'Mark In Stock'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleSpecial(item)}
                      className={cn('p-2 rounded-xl border transition-colors', item.is_todays_special ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-amber-400')}
                      title="Toggle Today's Special"
                    >
                      <Flame className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                      title="Edit Item"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 rounded-xl transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        categories={categories}
        onSaved={fetchMenuData}
      />
    </div>
  );
}
