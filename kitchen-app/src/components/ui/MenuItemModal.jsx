import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { Flame, Sparkles, Star, Clock, Check, Save } from 'lucide-react';
import api from '../../api/axios';

export default function MenuItemModal({ isOpen, onClose, item, categories = [], onSaved }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_vegetarian: true,
    is_available: true,
    is_todays_special: false,
    is_featured: false,
    preparation_time: 15,
    image_url: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price || '',
        category_id: item.category_id || (categories[0]?.id || ''),
        is_vegetarian: item.is_vegetarian !== undefined ? item.is_vegetarian : true,
        is_available: item.is_available !== undefined ? item.is_available : true,
        is_todays_special: item.is_todays_special || false,
        is_featured: item.is_featured || false,
        preparation_time: item.preparation_time || 15,
        image_url: item.image_url || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        category_id: categories[0]?.id || '',
        is_vegetarian: true,
        is_available: true,
        is_todays_special: false,
        is_featured: false,
        preparation_time: 15,
        image_url: '',
      });
    }
  }, [item, categories, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price || 0),
        category_id: formData.category_id || undefined,
        is_vegetarian: formData.is_vegetarian,
        is_available: formData.is_available,
        is_todays_special: formData.is_todays_special,
        is_featured: formData.is_featured,
        preparation_time: parseInt(formData.preparation_time || 15, 10),
        image_url: formData.image_url,
      };

      if (item && item.id) {
        await api.put(`/menu/${item.id}`, payload);
      } else {
        await api.post('/menu/', payload);
      }

      setIsLoading(false);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save menu item.');
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `Edit Menu Item: ${item.name}` : 'Create New Menu Item'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400">
            {error}
          </div>
        )}

        <Input
          label="Item Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g. Truffle Mushroom Pasta"
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Chef description of ingredients and taste profile..."
            className="w-full p-3 bg-slate-900 border border-slate-800 text-sm font-medium text-slate-100 rounded-xl outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Price ($)"
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            placeholder="14.50"
          />

          <Input
            label="Prep Time (mins)"
            type="number"
            name="preparation_time"
            value={formData.preparation_time}
            onChange={handleChange}
            placeholder="15"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Category
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 text-sm font-bold text-slate-200 rounded-xl outline-none focus:border-amber-500"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Image URL"
          type="url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="https://images.unsplash.com/photo-..."
        />

        {/* Toggles & Badges Grid */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Kitchen Flags & Tags</span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
            <label className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                name="is_vegetarian"
                checked={formData.is_vegetarian}
                onChange={handleChange}
                className="w-4 h-4 accent-amber-500"
              />
              <span>Vegetarian</span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleChange}
                className="w-4 h-4 accent-amber-500"
              />
              <span className={formData.is_available ? 'text-emerald-400' : 'text-rose-400'}>
                {formData.is_available ? 'In Stock' : 'Out of Stock'}
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                name="is_todays_special"
                checked={formData.is_todays_special}
                onChange={handleChange}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Special
              </span>
            </label>

            <label className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-xl cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleChange}
                className="w-4 h-4 accent-amber-500"
              />
              <span className="text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Popular
              </span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={Save} isLoading={isLoading}>
            {item ? 'Save Changes' : 'Create Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
