import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import {
  Flame, Sparkles, Save, Image as ImageIcon,
  CheckCircle2, AlertCircle, X, UploadCloud, Loader2
} from 'lucide-react';
import { menuApi } from '../../api/menu.api';
import { categoryApi } from '../../api/category.api';
import { getApiErrorMessage } from '../../utils/error';

// -------------------------------------------------------------------
// Allowed types & size limit — mirrors the backend validation exactly
// -------------------------------------------------------------------
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_SIZE_LABEL = '5 MB';

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function MenuItemModal({ isOpen, onClose, item, categories = [], onSaved }) {
  const fileInputRef = useRef(null);

  // -------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------
  const [modalCategories, setModalCategories] = useState(categories || []);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  const availableCategories = modalCategories.length > 0 ? modalCategories : categories;

  // -------------------------------------------------------------------
  // Form state
  // -------------------------------------------------------------------
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
    image_public_id: '',
  });

  // -------------------------------------------------------------------
  // Image state (separate from formData to avoid storing File in form)
  // -------------------------------------------------------------------
  const [selectedFile, setSelectedFile] = useState(null);         // File object
  const [previewUrl, setPreviewUrl] = useState(null);             // object URL for local preview
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // Cloudinary HTTPS URL after upload
  const [uploadedPublicId, setUploadedPublicId] = useState(null); // Cloudinary public_id after upload

  // -------------------------------------------------------------------
  // UI state
  // -------------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // -------------------------------------------------------------------
  // Fetch categories when modal opens
  // -------------------------------------------------------------------
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

  // -------------------------------------------------------------------
  // Populate form when editing an existing item / reset for new item
  // -------------------------------------------------------------------
  useEffect(() => {
    const defaultCatId = availableCategories[0]?.id || '';

    // Clean up previous preview URL to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

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
        image_public_id: item.image_public_id || '',
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
        image_public_id: '',
      }));
    }

    // Reset all image upload state
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedImageUrl(null);
    setUploadedPublicId(null);
    setError('');
    setImageError('');
    setUploadSuccess(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, availableCategories, isOpen]);

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // -------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  /**
   * Validate and stage a file for upload.
   * Does NOT upload immediately — upload happens on form submit.
   * Uses URL.createObjectURL for local preview (no base64).
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setUploadSuccess(false);

    // --- Frontend validation (mirrors backend) ---
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setImageError('Image must be JPG, PNG, or WEBP.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setImageError(`Image size cannot exceed ${MAX_SIZE_LABEL}. Selected file: ${formatFileSize(file.size)}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setUploadedImageUrl(null);
    setUploadedPublicId(null);
  };

  /**
   * Remove the selected / uploaded image.
   */
  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedImageUrl(null);
    setUploadedPublicId(null);
    setImageError('');
    setUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    // If editing: clear current image from the form (user explicitly removed it)
    setFormData((prev) => ({
      ...prev,
      image_url: '',
      image_public_id: '',
    }));
  };

  // -------------------------------------------------------------------
  // Submit: upload image first (if new file staged), then save item
  // -------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Basic field validation
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

      // 2. Upload image if a new file was selected
      let finalImageUrl = formData.image_url || null;
      let finalPublicId = formData.image_public_id || null;

      if (selectedFile) {
        setIsUploadingImage(true);
        try {
          const uploadResult = await menuApi.uploadMenuImage(selectedFile);
          // Response shape: { success: true, data: { image_url, image_public_id } }
          const data = uploadResult?.data || uploadResult;
          finalImageUrl = data.image_url || data.url || null;
          finalPublicId = data.image_public_id || data.public_id || null;

          if (!finalImageUrl) {
            throw new Error('Upload succeeded but no image URL was returned.');
          }

          // Clean up the local object URL now that we have the Cloudinary URL
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
          setUploadedImageUrl(finalImageUrl);
          setUploadedPublicId(finalPublicId);
          setUploadSuccess(true);
        } catch (uploadErr) {
          setError(getApiErrorMessage(uploadErr) || 'Image upload failed. Please try again.');
          setIsLoading(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // 3. Resolve category / restaurant
      const selectedCat = availableCategories.find((c) => String(c.id) === String(formData.category_id));
      const restaurantId = selectedCat?.restaurant_id || undefined;

      // 4. Build payload
      const payload = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        category_id: formData.category_id,
        restaurant_id: restaurantId,
        price: parsedPrice,
        compare_price:
          formData.compare_price !== '' && !isNaN(parseFloat(formData.compare_price))
            ? parseFloat(formData.compare_price)
            : null,
        is_vegetarian: Boolean(formData.is_vegetarian),
        is_available: Boolean(formData.is_available),
        is_todays_special: Boolean(formData.is_todays_special),
        is_featured: Boolean(formData.is_featured),
        preparation_time: parseInt(formData.preparation_time || 15, 10),
        image_url: finalImageUrl,
        image_public_id: finalPublicId,
      };

      // 5. Create or update
      if (item && item.id) {
        await menuApi.updateMenuItem(item.id, payload);
      } else {
        await menuApi.createMenuItem(payload);
      }

      setIsLoading(false);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err) || 'Menu item could not be saved.');
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------------
  // Derived display values
  // -------------------------------------------------------------------
  const currentDisplayImageUrl = uploadedImageUrl || previewUrl || formData.image_url || null;
  const hasImage = Boolean(currentDisplayImageUrl);
  const isFromCloudinary =
    Boolean(uploadedImageUrl) ||
    (formData.image_url && !selectedFile && !previewUrl);

  const isBusy = isLoading || isUploadingImage;

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `Edit Menu Item: ${item.name}` : 'Create New Menu Item'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Global Error Alert */}
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
                <span className="text-[11px] text-amber-400/80 animate-pulse">Loading...</span>
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
          </div>
        </div>

        {/* ============================================================
            IMAGE UPLOAD SECTION
        ============================================================ */}
        <div className="space-y-3 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              Menu Item Image
            </label>
            {hasImage && isFromCloudinary && !selectedFile && (
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved to cloud
              </span>
            )}
            {uploadSuccess && (
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded successfully
              </span>
            )}
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={ALLOWED_ACCEPT}
            className="hidden"
            id="menu-image-input"
          />

          {hasImage ? (
            /* ------- Image is selected / already set ------- */
            <div className="flex items-start gap-3">
              {/* Preview thumbnail */}
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-800 group">
                <img
                  src={currentDisplayImageUrl}
                  alt="Menu item preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
                {/* Remove overlay on hover */}
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  title="Remove image"
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* File info + actions */}
              <div className="flex-1 space-y-2 min-w-0">
                {selectedFile && (
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <p className="font-semibold truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                )}
                {!selectedFile && formData.image_url && (
                  <p className="text-[11px] text-slate-400 break-all line-clamp-2" title={formData.image_url}>
                    {formData.image_url}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
                    disabled={isBusy}
                  >
                    Change Image
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    disabled={isBusy}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ------- No image yet ------- */
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:border-amber-500/50 hover:text-amber-400/70 hover:bg-amber-500/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UploadCloud className="w-7 h-7" />
                <span className="text-xs font-bold">Choose from Device</span>
                <span className="text-[11px] text-slate-600">JPG · JPEG · PNG · WEBP · max {MAX_SIZE_LABEL}</span>
              </button>
            </div>
          )}

          {/* Image validation error */}
          {imageError && (
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {imageError}
            </div>
          )}

          {/* Upload in progress indicator */}
          {isUploadingImage && (
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Uploading image to cloud…
            </div>
          )}
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
          <Button variant="ghost" onClick={onClose} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={isBusy ? Loader2 : Save}
            isLoading={isBusy}
            disabled={isBusy}
          >
            {isUploadingImage
              ? 'Uploading image…'
              : isLoading
              ? 'Saving…'
              : item
              ? 'Save Changes'
              : 'Create Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
