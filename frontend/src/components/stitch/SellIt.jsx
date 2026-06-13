import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Garden', 'Books', 'Toys & Games',
  'Sports & Outdoors', 'Beauty & Health', 'Automotive', 'Music', 'Other',
];

const SellIt = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef(null);

  const [photos, setPhotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [conditionSummary, setConditionSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setPhotos(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return urls; });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/')).slice(0, 10);
    setPhotos(files);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => { prev.forEach((u) => URL.revokeObjectURL(u)); return urls; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      setError('Title and price are required.');
      return;
    }
    if (parseFloat(price) <= 0) {
      setError('Price must be greater than 0.');
      return;
    }
    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('condition_summary', conditionSummary.trim());
      if (photos[0]) formData.append('image', photos[0]);

      await api.post('/api/listings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        Object.values(err.response?.data || {})[0]?.[0] ||
        'Failed to create listing. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">List an Item</h1>
          <p className="text-gray-500 text-sm mt-1">Sell your pre-loved item on Amazon Revive — AI-verified, buyer-protected.</p>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium">
            ✓ Listing created! Redirecting to marketplace...
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo upload */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-3">Photos <span className="text-gray-400 font-normal text-sm">(up to 10)</span></h2>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-5 sm:p-8 text-center cursor-pointer hover:border-[#febd69] hover:bg-yellow-50 transition-colors"
              onClick={() => fileInputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {previewUrls.length === 0 ? (
                <div>
                  <div className="text-5xl mb-3">📷</div>
                  <p className="text-gray-700 font-medium">Drag and drop photos here</p>
                  <p className="text-gray-400 text-sm mt-1">or click to browse your files</p>
                  <p className="text-gray-300 text-xs mt-2">JPG, PNG, WEBP — Max 10 photos</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover rounded" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">Cover</span>
                      )}
                    </div>
                  ))}
                  <div className="aspect-square border-2 border-dashed border-gray-200 rounded flex items-center justify-center text-gray-400 text-2xl">+</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Item details */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-gray-800">Item Details</h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sony WH-1000XM4 Wireless Headphones"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#febd69] focus:ring-1 focus:ring-[#febd69] text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#febd69] text-sm bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your item — age, usage, any accessories included..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#febd69] text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Condition Notes</label>
              <textarea
                value={conditionSummary}
                onChange={(e) => setConditionSummary(e.target.value)}
                placeholder="Note any scratches, dents, or missing parts honestly..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#febd69] text-sm resize-none"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-3">Pricing</h2>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-gray-500">₹</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                className="flex-grow px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#febd69] focus:ring-1 focus:ring-[#febd69] text-lg font-bold"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">AI price suggestion will be available after photo upload (ML pipeline).</p>
          </div>

          {/* Drop-off info */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <p className="font-semibold text-blue-800 text-sm">How drop-off works</p>
              <p className="text-xs text-blue-600 mt-1">After listing, drop your item at any Amazon Locker or Kirana partner hub. Amazon verifies the condition matches your listing before it goes live. You earn when the buyer confirms receipt.</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-3 border border-gray-300 rounded text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className={`flex-1 py-3 rounded font-bold text-sm transition-colors
                ${submitting || success
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#febd69] hover:bg-[#f3a847] text-[#131921]'
                }`}
            >
              {submitting ? 'Publishing...' : success ? 'Listed!' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SellIt;
