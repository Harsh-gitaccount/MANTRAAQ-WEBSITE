import React, { useState, useEffect } from 'react';
import { API_BASE } from '../context/AuthContext';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Image as ImageIcon,
  Tag,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Upload,
  Link as LinkIcon
} from 'lucide-react';

const AVAILABLE_TAGS = [
  { key: 'bestseller', label: 'Bestseller', color: 'bg-pink-100 text-pink-800' },
  { key: 'new-launch', label: 'New Launch', color: 'bg-violet-100 text-violet-800' },
  { key: 'seasonal', label: 'Seasonal', color: 'bg-sky-100 text-sky-800' },
  { key: 'coming-soon', label: 'Coming Soon', color: 'bg-amber-100 text-amber-800' },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [handle, setHandle] = useState('');
  const [imagesList, setImagesList] = useState([]);
  const [category, setCategory] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTags, setCustomTags] = useState('');
  const [variants, setVariants] = useState([{ title: 'Default Title', price: '', compareAtPrice: '', stockQuantity: 0, sku: '' }]);

  // Drag and drop / file states
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [inputUrl, setInputUrl] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/products?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setHandle('');
    setImagesList([]);
    setCategory('');
    setIsActive(true);
    setSelectedTags([]);
    setCustomTags('');
    setInputUrl('');
    setVariants([{ title: 'Default Title', price: '', compareAtPrice: '', stockQuantity: 0, sku: '' }]);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setHandle(product.handle);
    setImagesList(product.images || []);
    setCategory(product.category || '');
    setIsActive(product.isActive !== undefined ? product.isActive : true);
    
    // Parse tags: split preset vs custom
    const presetKeys = AVAILABLE_TAGS.map(t => t.key);
    const productTags = product.tags || [];
    setSelectedTags(productTags.filter(t => presetKeys.includes(t)));
    const custom = productTags.filter(t => !presetKeys.includes(t));
    setCustomTags(custom.join(', '));
    setInputUrl('');

    setVariants(product.variants.map(v => ({
      id: v.id,
      title: v.title,
      price: v.price.toString(),
      compareAtPrice: v.compareAtPrice ? v.compareAtPrice.toString() : '',
      stockQuantity: v.stockQuantity,
      sku: v.sku || ''
    })));
    setShowModal(true);
  };

  const handleToggleTag = (tagKey) => {
    setSelectedTags(prev =>
      prev.includes(tagKey)
        ? prev.filter(t => t !== tagKey)
        : [...prev, tagKey]
    );
  };

  const handleAddVariantField = () => {
    setVariants([...variants, { title: '', price: '', compareAtPrice: '', stockQuantity: 0, sku: '' }]);
  };

  const handleRemoveVariantField = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product and all its variants? This cannot be undone.')) return;

    try {
      const res = await fetch(`${API_BASE}/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Product deleted successfully.');
        fetchProducts();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('uploads/')) {
      const backendHost = API_BASE.replace('/api', '');
      return `${backendHost}/${url}`;
    }
    return `/${url}`;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      const res = await fetch(`${API_BASE}/admin/products/upload-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success && data.urls) {
        setImagesList(prev => [...prev, ...data.urls]);
      } else {
        alert(data.message || 'Failed to upload images.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading images to backend.');
    }
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setImagesList(prev => [...prev, inputUrl.trim()]);
    setInputUrl('');
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...products];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setProducts(items);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    const orderedIds = products.map(p => p.id);
    try {
      const res = await fetch(`${API_BASE}/admin/products/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ orderedIds })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Failed to save product order.');
        fetchProducts();
      }
    } catch (err) {
      console.error('Reorder error:', err);
      fetchProducts();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !handle || !variants.length) {
      return alert('Name, URL Handle, and at least one variant are required.');
    }

    // Combine preset selected tags with comma-separated custom tags
    const customTagsArray = customTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t !== '');
    const combinedTags = [...selectedTags, ...customTagsArray];

    const payload = {
      name,
      description,
      handle,
      images: imagesList,
      category: category || null,
      tags: combinedTags,
      isActive,
      variants: variants.map(v => ({
        id: v.id,
        title: v.title,
        price: parseFloat(v.price),
        compareAtPrice: v.compareAtPrice ? parseFloat(v.compareAtPrice) : null,
        stockQuantity: parseInt(v.stockQuantity),
        sku: v.sku || null
      }))
    };

    try {
      const url = editingProduct 
        ? `${API_BASE}/admin/products/${editingProduct.id}`
        : `${API_BASE}/admin/products`;

      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchProducts();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Save product error:', err);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-4 md:p-8 text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 m-0">Product Catalog</h1>
          <p className="text-sm text-slate-500 mt-1">Add, edit, or remove products and update stocks.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Product Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-slate-600">No Products Registered</p>
          <p className="text-sm mt-1">Get started by clicking the "Add New Product" button.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold tracking-wider bg-slate-50/50">
                <th className="py-4 px-4 w-10"></th>
                <th className="py-4 px-6">Product</th>
                <th className="py-4 px-6">Handle</th>
                <th className="py-4 px-6">Variants & Price</th>
                <th className="py-4 px-6">Tags</th>
                <th className="py-4 px-6">Stock</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => {
                const totalStock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                return (
                  <tr 
                    key={product.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`border-b border-slate-50 hover:bg-slate-50/30 transition-all duration-150 text-sm select-none ${
                      draggedIndex === index ? 'opacity-40 bg-slate-100 scale-[0.98]' : ''
                    }`}
                  >
                    {/* Grip Handle Column */}
                    <td className="py-5 px-4 text-center">
                      <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
                        <GripVertical className="w-4 h-4 mx-auto" />
                      </div>
                    </td>
                    {/* Column 1: Image & Name */}
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 flex items-center justify-center">
                          {product.images && product.images[0] ? (
                            <img src={getImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://placehold.co/100?text=MantraAQ' }} />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">{product.description}</p>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: URL Handle */}
                    <td className="py-5 px-6 font-mono text-xs text-slate-500">
                      {product.handle}
                    </td>

                    {/* Column 3: Variants details */}
                    <td className="py-5 px-6">
                      <div className="space-y-1">
                        {product.variants.map((v) => (
                          <div key={v.id} className="text-xs">
                            <span className="font-semibold text-slate-700">{v.title}:</span>{' '}
                            <span className="text-emerald-600 font-bold">₹{v.price.toFixed(0)}</span>
                            {v.compareAtPrice && (
                              <span className="text-slate-400 line-through ml-1.5">₹{v.compareAtPrice.toFixed(0)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Column 4: Tags */}
                    <td className="py-5 px-6">
                      <div className="flex flex-wrap gap-1">
                        {(product.tags || []).map(tag => {
                          const matched = AVAILABLE_TAGS.find(t => t.key === tag);
                          return (
                            <span key={tag} className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${matched ? matched.color : 'bg-slate-100 text-slate-600'}`}>
                              {matched ? matched.label : tag}
                            </span>
                          );
                        })}
                        {(!product.tags || product.tags.length === 0) && (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>
                    </td>

                    {/* Column 5: Stock level summary */}
                    <td className="py-5 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        totalStock === 0 ? 'bg-rose-100 text-rose-800' :
                        totalStock <= 15 ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {totalStock} in stock
                      </span>
                    </td>

                    {/* Column 6: Active/Inactive Status */}
                    <td className="py-5 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        product.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {product.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>

                    {/* Column 7: Edit/Delete CTA */}
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-150 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Modify Product Details' : 'Register New Product'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Singhara Flour"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">URL Handle Slug</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="singhara-atta"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell customers about the healthy features of this item..."
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Flour, Snacks, Sweeteners"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Availability</label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full flex items-center justify-between gap-2 border rounded-lg py-2.5 px-3 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <span>{isActive ? 'Active — Live on storefront' : 'Draft — Hidden from customers'}</span>
                    {isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Product Tags / Badges
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => {
                    const isSelected = selectedTags.includes(tag.key);
                    return (
                      <button
                        key={tag.key}
                        type="button"
                        onClick={() => handleToggleTag(tag.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                          isSelected
                            ? `${tag.color} border-current shadow-sm scale-105`
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && '✓ '}{tag.label}
                      </button>
                    );
                  })}
                </div>
                
                {/* Custom tags field */}
                <div className="space-y-1 mt-3">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Custom Features / Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                    placeholder="e.g. gluten-free, high-protein, stone-ground"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:outline-none focus:border-emerald-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Available storefront icons: gluten-free, cold-processed, qr-traced, 100%-natural, high-protein, premium-quality, stone-ground, farm-direct, fresh-&-juicy, sun-dried, etc.</p>
                </div>
              </div>

              {/* Product Images Management */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Product Gallery Images</label>
                
                {/* Drag-and-Drop upload zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-50/30'); }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50/30'); }}
                  onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50/30'); handleImageUpload(e); }}
                  onClick={() => document.getElementById('product-file-input').click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/10 rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group"
                >
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <div>
                    <span className="font-semibold text-slate-700 group-hover:text-emerald-600 transition-colors">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-xs text-slate-400">PNG, JPG, JPEG, WEBP or GIF. Select multiple files at once.</p>
                  <input
                    id="product-file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Paste URL Accordion/Input */}
                <div className="flex gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <input
                    type="text"
                    placeholder="Or paste an image URL here..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-md py-1.5 px-3 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="bg-slate-700 hover:bg-slate-850 text-white font-semibold px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Add URL
                  </button>
                </div>

                {/* Reorderable Thumbnails Grid */}
                {imagesList.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-slate-400 font-medium">Arrange images display order (Drag thumbnails to reorder):</p>
                    <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/50">
                      {imagesList.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          draggable
                          onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedImageIndex(idx); }}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDragEnter={(e) => {
                            e.preventDefault();
                            if (draggedImageIndex !== null && draggedImageIndex !== idx) {
                              const list = [...imagesList];
                              const item = list[draggedImageIndex];
                              list.splice(draggedImageIndex, 1);
                              list.splice(idx, 0, item);
                              setDraggedImageIndex(idx);
                              setImagesList(list);
                            }
                          }}
                          onDragEnd={() => setDraggedImageIndex(null)}
                          className={`relative aspect-square bg-white border rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-200 ${draggedImageIndex === idx ? 'opacity-35 border-emerald-500 scale-[0.96]' : 'border-slate-200'}`}
                        >
                          <img
                            src={getImageUrl(imgUrl)}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover select-none pointer-events-none"
                            onError={(e) => { e.target.src = 'https://placehold.co/100?text=Error' }}
                          />
                          {/* Reordering indicator overlay */}
                          <div className="absolute top-1 left-1 bg-black/65 text-white font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                            #{idx + 1}
                          </div>
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => setImagesList(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Variants Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Product Weights & Variants</h3>
                  <button
                    type="button"
                    onClick={handleAddVariantField}
                    className="text-emerald-500 hover:text-emerald-600 font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Weight Variant
                  </button>
                </div>

                <div className="space-y-3">
                  {variants.map((v, index) => (
                    <div key={index} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 grid grid-cols-5 gap-3 items-center">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Title/Weight</label>
                        <input
                          type="text"
                          value={v.title}
                          onChange={(e) => handleVariantChange(index, 'title', e.target.value)}
                          placeholder="e.g. 500g"
                          className="w-full bg-white border border-slate-200 rounded-md py-1.5 px-2 text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Price (₹)</label>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          placeholder="120"
                          className="w-full bg-white border border-slate-200 rounded-md py-1.5 px-2 text-xs"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Original Price (₹)</label>
                        <input
                          type="number"
                          value={v.compareAtPrice}
                          onChange={(e) => handleVariantChange(index, 'compareAtPrice', e.target.value)}
                          placeholder="150"
                          className="w-full bg-white border border-slate-200 rounded-md py-1.5 px-2 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Stock Level</label>
                        <input
                          type="number"
                          value={v.stockQuantity}
                          onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md py-1.5 px-2 text-xs"
                          required
                        />
                      </div>

                      <div className="flex items-end justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">SKU</label>
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                            placeholder="SKU-1"
                            className="w-full bg-white border border-slate-200 rounded-md py-1.5 px-2 text-xs"
                          />
                        </div>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantField(index)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-md mb-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal footer submit */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
