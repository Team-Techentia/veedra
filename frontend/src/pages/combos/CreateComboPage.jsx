import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save, Plus, Trash2, Package, DollarSign, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import comboService from '../../services/comboService';

const CreateComboPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    discountType: 'percentage',
    discountValue: 5,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    priceSlots: [{
      slotName: 'Basic Slot',
      minPrice: 0,
      maxPrice: 500,
      maxProducts: 5,
      priority: 1,
      isActive: true
    }],
    rules: {
      totalProducts: { min: 2, max: 10 },
      allowDuplicates: false,
      requireAllSlots: false,
      minimumValue: 0,
      maximumValue: 999999
    },
    autoAssignment: {
      enabled: true,
      preventHighValueInLowSlot: true,
      allowPriceAdjustment: false
    },
    usageLimits: { totalUsage: null }
  });
  
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      console.log('Products response:', response);
      setProducts(response.data || response || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const updatePriceSlot = (index, field, value) => {
    const updatedSlots = [...formData.priceSlots];
    
    if (field === 'slotName') {
      updatedSlots[index][field] = value || '';
    } else if (field === 'isActive') {
      updatedSlots[index][field] = Boolean(value);
    } else {
      const numericValue = Number(value);
      if (!isNaN(numericValue) && numericValue >= 0) {
        updatedSlots[index][field] = numericValue;
      }
    }
    
    setFormData(prev => ({ ...prev, priceSlots: updatedSlots }));
  };

  const addProduct = (product) => {
    if (!selectedProducts.find(p => p._id === product._id)) {
      setSelectedProducts(prev => [...prev, product]);
    }
    setShowProductSelector(false);
  };

  const removeProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p._id !== productId));
  };

  const addPriceSlot = () => {
    const nextSlotNumber = formData.priceSlots.length + 1;
    const newSlot = {
      slotName: `Slot ${nextSlotNumber}`,
      minPrice: nextSlotNumber * 100,
      maxPrice: (nextSlotNumber + 1) * 100,
      maxProducts: 5,
      priority: nextSlotNumber,
      isActive: true
    };
    setFormData(prev => ({ ...prev, priceSlots: [...prev.priceSlots, newSlot] }));
  };

  const removePriceSlot = (index) => {
    if (formData.priceSlots.length > 1) {
      const updatedSlots = formData.priceSlots.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, priceSlots: updatedSlots }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Combo name is required';
    if (formData.priceSlots.length === 0) newErrors.priceSlots = 'At least one price slot is required';
    if (formData.discountValue <= 0) newErrors.discountValue = 'Discount value must be greater than 0';
    
    formData.priceSlots.forEach((slot, index) => {
      if (!slot.slotName.trim()) newErrors[`slot_${index}_name`] = 'Slot name is required';
      if (slot.minPrice >= slot.maxPrice) newErrors[`slot_${index}_range`] = 'Min price must be less than max price';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setSaving(true);
    try {
      const comboData = {
        name: formData.name,
        description: formData.description,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        priceSlots: formData.priceSlots,
        applicableProducts: selectedProducts.map(p => p._id),
        validFrom: formData.validFrom,
        validTo: formData.validUntil || null,
        usageLimit: formData.usageLimits.totalUsage,
        isActive: formData.isActive,
        rules: formData.rules,
        autoAssignment: formData.autoAssignment
      };

      console.log('Submitting combo data:', comboData);
      await comboService.createCombo(comboData);
      toast.success('Combo created successfully!');
      navigate('/combos');
    } catch (error) {
      console.error('Error creating combo:', error);
      const message = error.response?.data?.message || 'Failed to create combo';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child, grandchild] = field.split('.');
      if (grandchild) {
        setFormData(prev => ({
          ...prev,
          [parent]: { ...prev[parent], [child]: { ...prev[parent][child], [grandchild]: value } }
        }));
      } else {
        setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate('/combos')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Combo</h1>
            <p className="text-gray-600">Set up price slots and discount rules</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Combo Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter combo name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => handleInputChange('discountType', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="buy_x_get_y">Buy X Get Y</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value *</label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => handleInputChange('discountValue', parseFloat(e.target.value) || 0)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.discountValue ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter discount value"
                  min="0"
                  step="0.01"
                />
                {errors.discountValue && <p className="text-red-500 text-sm mt-1">{errors.discountValue}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => handleInputChange('validUntil', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Enter combo description"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Applicable Products</span>
              </div>
              <button
                type="button"
                onClick={() => setShowProductSelector(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Products</span>
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No products selected. Add products to make this combo applicable to specific items.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.code}</p>
                      <p className="text-sm text-green-600">₹{product.pricing?.sellingPrice || 0}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(product._id)}
                      className="p-1 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Selector Modal */}
        {showProductSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Select Products</h3>
                <button
                  onClick={() => {
                    setShowProductSelector(false);
                    setProductSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* Search Input */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products by name or code..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-80">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products
                    .filter(product => {
                      if (!productSearchTerm) return true;
                      const searchLower = productSearchTerm.toLowerCase();
                      return product.name.toLowerCase().includes(searchLower) ||
                             product.code.toLowerCase().includes(searchLower);
                    })
                    .filter(product => !selectedProducts.find(p => p._id === product._id))
                    .map((product) => (
                    <div
                      key={product._id}
                      onClick={() => {
                        addProduct(product);
                        setProductSearchTerm('');
                      }}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.code}</p>
                        <p className="text-sm text-green-600">₹{product.pricing?.sellingPrice || 0}</p>
                      </div>
                      <div className="text-blue-600">
                        <Plus className="h-5 w-5" />
                      </div>
                    </div>
                  ))}
                </div>
                {products.filter(product => {
                  if (!productSearchTerm) return true;
                  const searchLower = productSearchTerm.toLowerCase();
                  return product.name.toLowerCase().includes(searchLower) ||
                         product.code.toLowerCase().includes(searchLower);
                }).filter(product => !selectedProducts.find(p => p._id === product._id)).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No products found</p>
                    {productSearchTerm && (
                      <p className="text-sm">Try adjusting your search terms</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Price Slots Configuration</span>
              </div>
              <button
                type="button"
                onClick={addPriceSlot}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Slot</span>
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errors.priceSlots && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.priceSlots}</p>
              </div>
            )}

            <div className="space-y-4">
              {formData.priceSlots.map((slot, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Slot {index + 1}</h4>
                    {formData.priceSlots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePriceSlot(index)}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Slot Name *</label>
                      <input
                        type="text"
                        value={slot.slotName}
                        onChange={(e) => updatePriceSlot(index, 'slotName', e.target.value)}
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[`slot_${index}_name`] ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Slot name"
                      />
                      {errors[`slot_${index}_name`] && <p className="text-red-500 text-xs mt-1">{errors[`slot_${index}_name`]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Price *</label>
                      <input
                        type="number"
                        value={slot.minPrice}
                        onChange={(e) => updatePriceSlot(index, 'minPrice', e.target.value)}
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[`slot_${index}_range`] ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Min price"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Price *</label>
                      <input
                        type="number"
                        value={slot.maxPrice}
                        onChange={(e) => updatePriceSlot(index, 'maxPrice', e.target.value)}
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[`slot_${index}_range`] ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Max price"
                        min="0"
                        step="0.01"
                      />
                      {errors[`slot_${index}_range`] && <p className="text-red-500 text-xs mt-1">{errors[`slot_${index}_range`]}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Products</label>
                      <input
                        type="number"
                        value={slot.maxProducts}
                        onChange={(e) => updatePriceSlot(index, 'maxProducts', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Max products"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <input
                        type="number"
                        value={slot.priority}
                        onChange={(e) => updatePriceSlot(index, 'priority', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Priority"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={slot.isActive}
                        onChange={(e) => updatePriceSlot(index, 'isActive', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Combo Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Products</label>
                <input
                  type="number"
                  value={formData.rules.totalProducts.min}
                  onChange={(e) => handleInputChange('rules.totalProducts.min', parseInt(e.target.value) || 2)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Products</label>
                <input
                  type="number"
                  value={formData.rules.totalProducts.max}
                  onChange={(e) => handleInputChange('rules.totalProducts.max', parseInt(e.target.value) || 10)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Value</label>
                <input
                  type="number"
                  value={formData.rules.minimumValue}
                  onChange={(e) => handleInputChange('rules.minimumValue', parseFloat(e.target.value) || 0)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                <input
                  type="number"
                  value={formData.usageLimits.totalUsage || ''}
                  onChange={(e) => handleInputChange('usageLimits.totalUsage', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.rules.allowDuplicates}
                  onChange={(e) => handleInputChange('rules.allowDuplicates', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Allow Duplicate Products</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.rules.requireAllSlots}
                  onChange={(e) => handleInputChange('rules.requireAllSlots', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Require All Slots</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.autoAssignment.enabled}
                  onChange={(e) => handleInputChange('autoAssignment.enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto Assignment</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/combos')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Creating...' : 'Create Combo'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateComboPage;