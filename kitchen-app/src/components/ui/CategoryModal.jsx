import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { Save } from 'lucide-react';
import api from '../../api/axios';

export default function CategoryModal({ isOpen, onClose, category, restaurantId, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setDisplayOrder(category.display_order || 0);
      setIsActive(category.is_active !== undefined ? category.is_active : true);
    } else {
      setName('');
      setDescription('');
      setDisplayOrder(0);
      setIsActive(true);
    }
  }, [category, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (category && category.id) {
        await api.put(`/categories/${category.id}`, {
          name,
          description,
          display_order: parseInt(displayOrder || 0, 10),
          is_active: isActive,
        });
      } else {
        await api.post('/categories/', {
          name,
          description,
          restaurant_id: restaurantId || undefined,
          display_order: parseInt(displayOrder || 0, 10),
          is_active: isActive,
        });
      }

      setIsLoading(false);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save category.');
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? `Edit Category: ${category.name}` : 'Create Food Category'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400">
            {error}
          </div>
        )}

        <Input
          label="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Starters, Main Course, Drinks"
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Short description of this category..."
            className="w-full p-3 bg-slate-900 border border-slate-800 text-sm font-medium text-slate-100 rounded-xl outline-none focus:border-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Display Order"
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            placeholder="0"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Status
            </label>
            <label className="flex items-center gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-xs font-bold">{isActive ? 'Active' : 'Disabled'}</span>
            </label>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Save} isLoading={isLoading}>
            {category ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
