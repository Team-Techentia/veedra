import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save, Package, DollarSign, Barcode, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import vendorService from '../../services/vendorService';
import categoryService from '../../services/categoryService';

const EditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    vendor: '',
    factoryPrice: '',
    offerPrice: '',
    discountedPrice: '',
    mrp: '',
    
    // Bundle fields
    bundleType: '',
    quantity: '',
    sizes: '',
    colors: '',
    
    currentStock: 0,
    minStockLevel: '',
    maxStockLevel: '',
    unit: 'piece',
    isComboEligible: true,
    isActive: true,
    barcode: '',
    hsnCode: '',
    
    specifications: {
      weight: '',
      dimensions: '',
      color: '',
      brand: '',
      model: '',
      warranty: ''
    }
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  
  // Auto-calculation state for pricing fields
  const [autoCalculation, setAutoCalculation] = useState({
    offerPrice: true,
    discountedPrice: true,
    mrp: true
  });

  useEffect(() => {
    loadData();
  }, [id]);

  // Load subcategories when category changes
  useEffect(() => {
    if (formData.category && allCategories.length > 0) {
      const categorySubcategories = allCategories.filter(cat => {
        if (!cat.parent) return false;
        const parentId = typeof cat.parent === 'object' && cat.parent ? cat.parent._id : cat.parent;
        return parentId === formData.category;
      });
      setSubcategories(categorySubcategories);
    } else {
      setSubcategories([]);
    }
  }, [formData.category, allCategories]);

  // Get GST rate based on price
  const getGSTRate = (price) => {
    return price > 2500 ? 0.12 : 0.05; // 12% for products above ₹2500, 5% for others
  };

  // Calculate prices automatically based on factory price
  const calculatePrices = (factoryPrice) => {
    const profitPrice = factoryPrice * 2;
    const gstRate = getGSTRate(profitPrice);
    const gst = profitPrice * gstRate;
    const afterGst = profitPrice + gst;
    const commission = (afterGst / 500) * 30;
    const offer = Math.round(afterGst + commission);
    const price15 = Math.round(offer / 0.75); // Reverse 25% discount
    const mrp = Math.round(price15 / 0.85);   // Reverse 15% discount

    return {
      offer,
      price15,
      mrp
    };
  };

  // Handle factory price change and auto-calculate other prices
  const handleFactoryPriceChange = (e) => {
    const factoryPrice = parseFloat(e.target.value);
    
    setFormData(prev => ({
      ...prev,
      factoryPrice: e.target.value
    }));

    if (!isNaN(factoryPrice) && factoryPrice > 0) {
      const { offer, price15, mrp } = calculatePrices(factoryPrice);
      setFormData(prev => ({
        ...prev,
        offerPrice: autoCalculation.offerPrice ? offer.toString() : prev.offerPrice,
        discountedPrice: autoCalculation.discountedPrice ? price15.toString() : prev.discountedPrice,
        mrp: autoCalculation.mrp ? mrp.toString() : prev.mrp
      }));
    } else {
      // Only clear auto-calculated fields
      setFormData(prev => ({
        ...prev,
        offerPrice: autoCalculation.offerPrice ? '' : prev.offerPrice,
        discountedPrice: autoCalculation.discountedPrice ? '' : prev.discountedPrice,
        mrp: autoCalculation.mrp ? '' : prev.mrp
      }));
    }
  };

  // Handle manual price changes
  const handlePriceChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  // Toggle auto-calculation for a price field
  const toggleAutoCalculation = (field) => {
    setAutoCalculation(prev => {
      const newState = { ...prev, [field]: !prev[field] };
      
      // If turning auto-calculation back on, recalculate the price
      if (newState[field] && formData.factoryPrice) {
        const factoryPrice = parseFloat(formData.factoryPrice);
        if (!isNaN(factoryPrice) && factoryPrice > 0) {
          const { offer, price15, mrp } = calculatePrices(factoryPrice);
          const newValue = field === 'offerPrice' ? offer.toString() : 
                          field === 'discountedPrice' ? price15.toString() : 
                          mrp.toString();
          
          setFormData(prevData => ({
            ...prevData,
            [field]: newValue
          }));
        }
      }
      
      return newState;
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productData, vendorsData, categoriesData] = await Promise.all([
        productService.getProduct(id),
        vendorService.getVendors(),
        categoryService.getCategories()
      ]);
      
      // Store all categories for subcategory filtering
      const allCategoriesData = categoriesData.data || categoriesData || [];
      setAllCategories(allCategoriesData);
      
      // Filter to only show main categories (no parent) in the dropdown
      const mainCategories = allCategoriesData.filter(cat => !cat.parent || cat.parent === null);
      setCategories(mainCategories);
      
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        category: productData.category?._id || productData.category || '',
        subcategory: productData.subcategory?._id || productData.subcategory || '',
        vendor: productData.vendor?._id || productData.vendor || '',
        factoryPrice: productData.pricing?.factoryPrice || '',
        offerPrice: productData.pricing?.offerPrice || '',
        discountedPrice: productData.pricing?.discountedPrice || '',
        mrp: productData.pricing?.mrp || '',
        
        // Bundle fields
        bundleType: productData.bundleType || '',
        quantity: productData.inventory?.currentStock || '',
        sizes: productData.sizes || '',
        colors: productData.colors || '',
        
        currentStock: productData.inventory?.currentStock || 0,
        minStockLevel: productData.inventory?.minStockLevel || '',
        maxStockLevel: productData.inventory?.maxStockLevel || '',
        unit: productData.unit || 'piece',
        isComboEligible: productData.isComboEligible !== undefined ? productData.isComboEligible : true,
        isActive: productData.isActive !== undefined ? productData.isActive : true,
        barcode: productData.barcode || '',
        hsnCode: productData.hsnCode || '',
        
        specifications: {
          weight: productData.specifications?.weight || '',
          dimensions: productData.specifications?.dimensions || '',
          color: productData.specifications?.color || '',
          brand: productData.specifications?.brand || '',
          model: productData.specifications?.model || '',
          warranty: productData.specifications?.warranty || ''
        }
      });
      setVendors(vendorsData.data || vendorsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load product data');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.offerPrice) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      // Transform data to match backend structure
      const updateData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || null,
        vendor: formData.vendor,
        
        // Bundle fields
        bundleType: formData.bundleType || null,
        sizes: formData.sizes || '',
        colors: formData.colors || '',
        
        pricing: {
          factoryPrice: parseFloat(formData.factoryPrice) || 0,
          offerPrice: parseFloat(formData.offerPrice) || 0,
          discountedPrice: parseFloat(formData.discountedPrice) || 0,
          mrp: parseFloat(formData.mrp) || 0
        },
        inventory: {
          currentStock: parseInt(formData.currentStock) || 0,
          minStockLevel: parseInt(formData.minStockLevel) || 0,
          maxStockLevel: parseInt(formData.maxStockLevel) || 0
        },
        unit: formData.unit,
        isComboEligible: formData.isComboEligible,
        barcode: formData.barcode,
        hsnCode: formData.hsnCode,
        isActive: formData.isActive,
        
        specifications: formData.specifications
      };

      await productService.updateProduct(id, updateData);
      toast.success('Product updated successfully!');
      navigate('/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const calculateMargin = () => {
    const factory = parseFloat(formData.factoryPrice) || 0;
    const offer = parseFloat(formData.offerPrice) || 0;
    if (factory > 0 && offer > 0) {
      return ((offer - factory) / factory * 100).toFixed(2);
    }
    return 0;
  };

  const calculateDiscount = (originalPrice, discountedPrice) => {
    const original = parseFloat(originalPrice) || 0;
    const discounted = parseFloat(discountedPrice) || 0;
    if (original > 0 && discounted > 0 && original > discounted) {
      return ((original - discounted) / original * 100).toFixed(1);
    }
    return 0;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/products')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Products
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-600 mt-2">Update product information and pricing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={formData.specifications.brand}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        specifications: { ...prev.specifications, brand: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.category}
                    >
                      <option value="">Select Subcategory</option>
                      {subcategories.map(subcategory => (
                        <option key={subcategory._id} value={subcategory._id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor
                    </label>
                    <select
                      value={formData.vendor}
                      onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(vendor => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bundle Type
                    </label>
                    <select
                      value={formData.bundleType}
                      onChange={(e) => setFormData(prev => ({ ...prev, bundleType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Single Product (No Bundle)</option>
                      <option value="sameSizeDifferentColors">Same Size, Different Colors (1+99)</option>
                      <option value="differentSizesSameColor">Different Sizes, Same Color (1+99)</option>
                      <option value="different_sizes_different_colors">Mixed Size & Color</option>
                    </select>
                  </div>
                </div>

                {/* Bundle Configuration */}
                {formData.bundleType && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sizes (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.sizes}
                        onChange={(e) => setFormData(prev => ({ ...prev, sizes: e.target.value }))}
                        placeholder="S, M, L, XL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Colors (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.colors}
                        onChange={(e) => setFormData(prev => ({ ...prev, colors: e.target.value }))}
                        placeholder="Red, Blue, Green"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Product is active
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isComboEligible"
                      checked={formData.isComboEligible}
                      onChange={(e) => setFormData(prev => ({ ...prev, isComboEligible: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isComboEligible" className="text-sm text-gray-700">
                      Combo eligible
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="border-2 border-blue-100 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <CardTitle className="flex items-center text-blue-900">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Pricing Information
                  <Calculator className="h-4 w-4 ml-2 text-blue-600" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Price Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Factory Price (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={formData.factoryPrice}
                        onChange={handleFactoryPriceChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      <div className="flex items-center justify-between">
                        <span>Offer Price (₹) *</span>
                        <button
                          type="button"
                          onClick={() => toggleAutoCalculation('offerPrice')}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                            autoCalculation.offerPrice 
                              ? 'bg-green-500 text-white shadow-md hover:bg-green-600' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Toggle auto-calculation"
                        >
                          {autoCalculation.offerPrice ? 'AUTO' : 'MANUAL'}
                        </button>
                      </div>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={formData.offerPrice}
                        onChange={handlePriceChange('offerPrice')}
                        min="0"
                        step="0.01"
                        className={`w-full pl-8 pr-3 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium ${
                          autoCalculation.offerPrice 
                            ? 'bg-green-50 border-green-300' 
                            : 'border-gray-200'
                        }`}
                        placeholder="0.00"
                        required
                        disabled={autoCalculation.offerPrice}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      <div className="flex items-center justify-between">
                        <span>Discounted Price (₹)</span>
                        <button
                          type="button"
                          onClick={() => toggleAutoCalculation('discountedPrice')}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                            autoCalculation.discountedPrice 
                              ? 'bg-green-500 text-white shadow-md hover:bg-green-600' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Toggle auto-calculation"
                        >
                          {autoCalculation.discountedPrice ? 'AUTO' : 'MANUAL'}
                        </button>
                      </div>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={formData.discountedPrice}
                        onChange={handlePriceChange('discountedPrice')}
                        min="0"
                        step="0.01"
                        className={`w-full pl-8 pr-3 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium ${
                          autoCalculation.discountedPrice 
                            ? 'bg-green-50 border-green-300' 
                            : 'border-gray-200'
                        }`}
                        placeholder="0.00"
                        disabled={autoCalculation.discountedPrice}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      <div className="flex items-center justify-between">
                        <span>MRP (₹)</span>
                        <button
                          type="button"
                          onClick={() => toggleAutoCalculation('mrp')}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                            autoCalculation.mrp 
                              ? 'bg-green-500 text-white shadow-md hover:bg-green-600' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Toggle auto-calculation"
                        >
                          {autoCalculation.mrp ? 'AUTO' : 'MANUAL'}
                        </button>
                      </div>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        value={formData.mrp}
                        onChange={handlePriceChange('mrp')}
                        min="0"
                        step="0.01"
                        className={`w-full pl-8 pr-3 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium ${
                          autoCalculation.mrp 
                            ? 'bg-green-50 border-green-300' 
                            : 'border-gray-200'
                        }`}
                        placeholder="0.00"
                        disabled={autoCalculation.mrp}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Price Analysis Cards */}
                {formData.factoryPrice && formData.offerPrice && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-700">Profit Margin</span>
                        <span className="text-lg font-bold text-green-800">{calculateMargin()}%</span>
                      </div>
                    </div>
                    
                    {formData.discountedPrice && formData.offerPrice && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700">Offer Discount</span>
                          <span className="text-lg font-bold text-blue-800">{calculateDiscount(formData.discountedPrice, formData.offerPrice)}%</span>
                        </div>
                      </div>
                    )}
                    
                    {formData.mrp && formData.discountedPrice && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-purple-700">MRP Discount</span>
                          <span className="text-lg font-bold text-purple-800">{calculateDiscount(formData.mrp, formData.discountedPrice)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* GST Information */}
                {formData.factoryPrice && (
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-4 rounded-xl border border-yellow-200 shadow-sm mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-yellow-800">GST Rate: </span>
                        <span className="text-lg font-bold text-yellow-900">
                          {getGSTRate(parseFloat(formData.factoryPrice) * 2) * 100}%
                        </span>
                      </div>
                      <span className="text-xs text-yellow-700">
                        {parseFloat(formData.factoryPrice) * 2 > 2500 
                          ? '(Product value > ₹2500)' 
                          : '(Product value ≤ ₹2500)'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventory Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Inventory Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock
                    </label>
                    <input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Stock Level
                    </label>
                    <input
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStockLevel: e.target.value }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Stock Level
                    </label>
                    <input
                      type="number"
                      value={formData.maxStockLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxStockLevel: e.target.value }))}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="piece">Piece</option>
                      <option value="kg">Kg</option>
                      <option value="gram">Gram</option>
                      <option value="liter">Liter</option>
                      <option value="meter">Meter</option>
                      <option value="box">Box</option>
                      <option value="pair">Pair</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Product Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={formData.specifications.color}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        specifications: { ...prev.specifications, color: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product color"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Codes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Barcode className="h-5 w-5 mr-2" />
                  Product Codes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HSN Code
                    </label>
                    <input
                      type="text"
                      value={formData.hsnCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, hsnCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Product Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="text-2xl font-bold text-blue-600">{formData.currentStock || 0} {formData.unit}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`text-sm font-medium ${
                      formData.isActive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bundle Type:</span>
                    <span className="text-sm font-medium">
                      {formData.bundleType || 'Single Product'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Combo Eligible:</span>
                    <span className={`text-sm font-medium ${
                      formData.isComboEligible ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.isComboEligible ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  <hr className="my-2" />
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Factory Price:</span>
                    <span className="text-sm font-medium">₹{formData.factoryPrice || 0}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Offer Price:</span>
                    <span className="text-sm font-medium">₹{formData.offerPrice || 0}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Discounted Price:</span>
                    <span className="text-sm font-medium">₹{formData.discountedPrice || 0}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">MRP:</span>
                    <span className="text-sm font-medium">₹{formData.mrp || 0}</span>
                  </div>
                  
                  {formData.factoryPrice && formData.offerPrice && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm text-gray-600">Profit Margin:</span>
                      <span className="text-sm font-bold text-green-600">{calculateMargin()}%</span>
                    </div>
                  )}
                  
                  {formData.minStockLevel && parseInt(formData.currentStock) <= parseInt(formData.minStockLevel) && (
                    <div className="bg-red-50 p-2 rounded-lg">
                      <p className="text-sm text-red-800">⚠️ Low Stock Alert</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductPage