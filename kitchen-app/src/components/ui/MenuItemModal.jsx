import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import { Flame, Sparkles, Save, Upload, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { menuApi } from '../../api/menu.api';
import { categoryApi } from '../../api/category.api';
import { getApiErrorMessage } from '../../utils/error';

export default function MenuItemModal({ isOpen, onClose, item, categories = [], onSaved }) {
  const fileInputRef = useRef(null);

  const [modalCategories, setModalCategories] = useState(categories || []);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const availableCategories = modalCategories.length > 0 ? modalCategories : categories;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    category_id: '',
    is_vegetarian: true,
    is_available: true,
    is_todays_special: false,
    is_featured: false,
    preparation_time: 15,
    image_url: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Fetch categories when modal opens
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      setCategoryError('');
      try {
        const data = await categoryApi.getCategories();
        if (isMounted) {
          setModalCategories(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setCategoryError(getApiErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      setModalCategories((prev) => (prev.length === 0 ? categories : prev));
    }
  }, [categories]);

  useEffect(() => {
    const defaultCatId = availableCategories[0]?.id || '';
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price !== undefined && item.price !== null ? String(item.price) : '',
        compare_price: item.compare_price !== undefined && item.compare_price !== null ? String(item.compare_price) : '',
        category_id: item.category_id || defaultCatId,
        is_vegetarian: item.is_vegetarian !== undefined ? item.is_vegetarian : true,
        is_available: item.is_available !== undefined ? item.is_available : true,
        is_todays_special: item.is_todays_special || false,
        is_featured: item.is_featured || false,
        preparation_time: item.preparation_time || 15,
        image_url: item.image_url || '',
      });
    } else {
      setFormData((prev) => ({
        name: '',
        description: '',
        price: '',
        compare_price: '',
        category_id: prev.category_id || defaultCatId,
        is_vegetarian: true,
        is_available: true,
        is_todays_special: false,
        is_featured: false,
        preparation_time: 15,
        image_url: '',
      }));
    }
    setError('');
    setUploadSuccess(false);
  }, [item, availableCategories, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setIsUploadingImage(true);
    setError('');
    setUploadSuccess(false);

    try {
      const res = await menuApi.uploadImage(file);
      const uploadedUrl = res.url || res.secure_url;
      if (uploadedUrl) {
        setFormData((prev) => ({
          ...prev,
          image_url: uploadedUrl,
        }));
        setUploadSuccess(true);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Client-side sanity checks
      if (!formData.name?.trim()) {
        setError('Item name is required.');
        setIsLoading(false);
        return;
      }

      if (!formData.category_id) {
        setError('Please select a category for this item.');
        setIsLoading(false);
        return;
      }

      const parsedPrice = parseFloat(formData.price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        setError('Please enter a valid price (greater than or equal to 0).');
        setIsLoading(false);
        return;
      }

      // 2. Resolve category and restaurant association
      const selectedCat = availableCategories.find((c) => String(c.id) === String(formData.category_id));
      const restaurantId = selectedCat?.restaurant_id || undefined;

      // 3. Construct exact schema-compatible payload
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        category_id: formData.category_id,
        restaurant_id: restaurantId,
        price: parsedPrice,
        compare_price: formData.compare_price !== '' && !isNaN(parseFloat(formData.compare_price))
          ? parseFloat(formData.compare_price)
          : null,
        is_vegetarian: Boolean(formData.is_vegetarian),
        is_available: Boolean(formData.is_available),
        is_todays_special: Boolean(formData.is_todays_special),
        is_featured: Boolean(formData.is_featured),
        preparation_time: parseInt(formData.preparation_time || 15, 10),
        image_url: formData.image_url?.trim() || null,
      };

      // 4. Send API request
      if (item && item.id) {
        await menuApi.updateMenuItem(item.id, payload);
      } else {
        await menuApi.createMenuItem(payload);
      }

      setIsLoading(false);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      const errorMsg = getApiErrorMessage(err);
      setError(errorMsg);
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
        {/* Error Notification Alert */}
        {error && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{String(error)}</span>
          </div>
        )}

        <Input
          label="Item Name *"
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

        {/* Pricing, Preparation, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            label="Price (₹) *"
            type="number"
            step="0.01"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            placeholder="250.00"
          />

          <Input
            label="Compare Price (₹)"
            type="number"
            step="0.01"
            name="compare_price"
            value={formData.compare_price}
            onChange={handleChange}
            placeholder="299.00 (Optional)"
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
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Category *
              </label>
              {isLoadingCategories && (
                <span className="text-[11px] text-amber-400/80 animate-pulse">Loading categories...</span>
              )}
            </div>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              disabled={isLoadingCategories && availableCategories.length === 0}
              className="w-full py-2.5 px-3 bg-slate-900 border border-slate-800 text-sm font-bold text-slate-200 rounded-xl outline-none focus:border-amber-500 disabled:opacity-50"
            >
              <option value="">
                {isLoadingCategories && availableCategories.length === 0
                  ? 'Loading categories...'
                  : availableCategories.length === 0
                  ? 'No categories available'
                  : 'Select Category'}
              </option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categoryError && (
              <p className="text-[11px] text-red-400">{categoryError}</p>
            )}
            {!isLoadingCategories && availableCategories.length === 0 && !categoryError && (
              <p className="text-[11px] text-slate-400">
                No categories found. Create categories first.
              </p>
            )}
          </div>
        </div>

        {/* Image Upload & URL */}
        <div className="space-y-2 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Menu Item Image
            </label>
            {formData.image_url && (
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Image attached
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* File Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploadingImage}
              className="w-full sm:w-auto"
            >
              {isUploadingImage ? 'Uploading...' : 'Upload Image'}
            </Button>

            {/* Direct Image URL fallback input */}
            <div className="relative flex-1 w-full">
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="Or paste image URL (https://...)"
                className="w-full py-2 px-3 bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 rounded-xl outline-none focus:border-amber-500"
              />
            </div>

            {/* Image Preview Thumbnail */}
            {formData.image_url && (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-800">
                <img
                  src={formData.image_url}
                  alt="Item Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

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
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
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
