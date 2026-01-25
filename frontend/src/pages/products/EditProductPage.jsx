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
    offerType: '',

    specifications: {
      weight: '',
      dimensions: '',
      color: '',
      size: '', // Added Size
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
    // const profitPrice = factoryPrice * 2;
    // const gstRate = getGSTRate(profitPrice);
    // const gst = profitPrice * gstRate;
    // const afterGst = profitPrice + gst;
    // const commission = (afterGst / 500) * 30;
    const mrp = factoryPrice * 2;   // Reverse 15% discount
    const offer = (factoryPrice / 0.6).toFixed(2);
    const price15 = offer; // Reverse 25% discount // Reverse 15% discount

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
        hsnCode: productData.hsnCode || '6204',
        offerType: productData.offerType || '',

        specifications: {
          weight: productData.specifications?.weight || '',
          dimensions: productData.specifications?.dimensions || '',
          color: productData.specifications?.color || '',
          size: productData.specifications?.size || '', // Load size
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
        hsnCode: formData.hsnCode ? formData.hsnCode.trim() : undefined,
        offerType: formData.offerType,
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
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  📦 Basic Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsnCode: e.target.value }))}
                    placeholder="e.g., 6203"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Offer Type
                  </label>
                  <input
                    type="text"
                    value={formData.offerType}
                    onChange={(e) => setFormData(prev => ({ ...prev, offerType: e.target.value }))}
                    placeholder="e.g., Buy 1 Get 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor *
                  </label>
                  <select
                    value={formData.vendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  📊 Inventory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Stock / Quantity *
                    </label>
                    <input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Stock Level
                    </label>
                    <input
                      type="number"
                      value={formData.minStockLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, minStockLevel: e.target.value }))}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  💰 Pricing (Auto-calculated + Manual Override)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Factory Price *
                    </label>
                    <input
                      type="number"
                      value={formData.factoryPrice}
                      onChange={handleFactoryPriceChange}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>Offer Price</span>
                      <button
                        type="button"
                        onClick={() => toggleAutoCalculation('offerPrice')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${autoCalculation.offerPrice
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {autoCalculation.offerPrice ? '🔄 Auto' : '✏️ Manual'}
                      </button>
                    </label>
                    <input
                      type="number"
                      value={formData.offerPrice}
                      onChange={handlePriceChange('offerPrice')}
                      readOnly={autoCalculation.offerPrice}
                      step="0.01"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${autoCalculation.offerPrice ? 'bg-gray-100 text-gray-600' : 'bg-white'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>Discounted</span>
                      <button
                        type="button"
                        onClick={() => toggleAutoCalculation('discountedPrice')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${autoCalculation.discountedPrice
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {autoCalculation.discountedPrice ? '🔄' : '✏️'}
                      </button>
                    </label>
                    <input
                      type="number"
                      value={formData.discountedPrice}
                      onChange={handlePriceChange('discountedPrice')}
                      readOnly={autoCalculation.discountedPrice}
                      step="0.01"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${autoCalculation.discountedPrice ? 'bg-gray-100 text-gray-600' : 'bg-white'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>MRP</span>
                      <button
                        type="button"
                        onClick={() => toggleAutoCalculation('mrp')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${autoCalculation.mrp
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {autoCalculation.mrp ? '🔄 Auto' : '✏️ Manual'}
                      </button>
                    </label>
                    <input
                      type="number"
                      value={formData.mrp}
                      onChange={handlePriceChange('mrp')}
                      readOnly={autoCalculation.mrp}
                      step="0.01"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${autoCalculation.mrp ? 'bg-gray-100 text-gray-600' : 'bg-white'
                        }`}
                    />
                  </div>
                </div>

                {/* Pricing Analysis Formula */}
                {formData.factoryPrice && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-4">
                    <h4 className="font-medium text-green-800 mb-2">💡 Pricing Analysis:</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>Profit Margin: <span className="font-bold">{calculateMargin()}%</span></p>
                      <p>GST Rate: {(getGSTRate(parseFloat(formData.factoryPrice) * 2) * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Identifiers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Barcode className="h-5 w-5 mr-2" />
                  🔑 Identifiers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Code (ReadOnly)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode} // Using barcode as proxy since code is not easily available in state without refactor
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
                    placeholder="Not available"
                  />
                </div>
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
              </CardContent>
            </Card>

            {/* Product Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Product Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isComboEligible"
                    checked={formData.isComboEligible}
                    onChange={(e) => setFormData(prev => ({ ...prev, isComboEligible: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isComboEligible" className="text-sm text-gray-700">
                    Eligible for combo offers
                  </label>
                </div>

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
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Size
                    </label>
                    <input
                      type="text"
                      value={formData.specifications.size}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        specifications: { ...prev.specifications, size: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., M, 42"
                    />
                  </div>
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
                      placeholder="e.g., Blue, Black"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  value={formData.specifications.brand}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    specifications: { ...prev.specifications, brand: e.target.value }
                  }))}
                  placeholder="Brand"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={formData.specifications.model}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    specifications: { ...prev.specifications, model: e.target.value }
                  }))}
                  placeholder="Model"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  value={formData.specifications.warranty}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    specifications: { ...prev.specifications, warranty: e.target.value }
                  }))}
                  placeholder="Warranty Period"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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

export default EditProductPage;