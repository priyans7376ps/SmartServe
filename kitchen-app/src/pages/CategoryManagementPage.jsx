import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Plus, Edit3, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import CategoryModal from '../components/ui/CategoryModal';
import { cn } from '../lib/cn';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/categories/?active_only=false');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (cat) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
  };

  const handleDelete = async (catId) => {
    if (!window.confirm('Are you sure you want to delete this food category?')) return;
    try {
      await api.delete(`/categories/${catId}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete category.');
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      await api.put(`/categories/${cat.id}`, {
        is_active: !cat.is_active,
      });
      fetchCategories();
    } catch (err) {
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <FolderKanban className="w-7 h-7 text-amber-400" />
            <span>Category Management</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Organize kitchen food categories and display order
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={handleCreate}>
          Create Category
        </Button>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 font-bold text-xs">
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="p-16 text-center bg-[#131b2e] border border-slate-800 rounded-3xl space-y-3">
          <FolderKanban className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No categories created yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Create categories to organize your restaurant menu items.
          </p>
          <Button variant="primary" size="sm" icon={Plus} onClick={handleCreate}>
            Create Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  'bg-[#131b2e] border rounded-3xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4',
                  !cat.is_active ? 'border-slate-800 opacity-60' : 'border-slate-800'
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-white">{cat.name}</h3>
                    <Badge type="tag" value={cat.is_active ? 'enabled' : 'disabled'} />
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {cat.description || 'No description available for this category.'}
                  </p>

                  <div className="text-[11px] font-mono text-slate-500 font-bold pt-1">
                    Display Order: #{cat.display_order || 0}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border',
                      cat.is_active
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-rose-500/20 hover:text-rose-400'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                    )}
                  >
                    {cat.is_active ? 'Disable' : 'Enable'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
                      title="Edit Category"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 rounded-xl transition-colors"
                      title="Delete Category"
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

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        category={selectedCategory}
        onSaved={fetchCategories}
      />
    </div>
  );
}
