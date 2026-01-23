import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Save, Package, Barcode, DollarSign, Scan, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import vendorService from '../../services/vendorService';
import categoryService from '../../services/categoryService';

const AddProductPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

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

    hsnCode: '', // Added HSN Code
    quantity: '',

    currentStock: '',
    minStockLevel: '',
    maxStockLevel: '',
    unit: 'piece',
    isComboEligible: true,
    isActive: true,

    specifications: {
      weight: '',
      dimensions: '',
      color: '',
      size: '', // Added Size to specifications
      brand: '',
      model: '',
      warranty: ''
    }
  });

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [mixedBundleConfig, setMixedBundleConfig] = useState([]);

  // Auto-calculation state for pricing fields
  const [autoCalculation, setAutoCalculation] = useState({
    offerPrice: true,
    discountedPrice: true,
    mrp: true
  });

  const BRANCH_CODE = "SHI";

  // Load categories and vendors from API
  useEffect(() => {
    loadCategoriesAndVendors();
  }, []);

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

  // Bundle auto-generation effects removed


  const loadCategoriesAndVendors = async () => {
    try {
      const [categoriesData, vendorsData] = await Promise.all([
        categoryService.getCategories(),
        vendorService.getVendors()
      ]);

      // Store all categories for subcategory filtering
      const allCategoriesData = categoriesData.data || categoriesData || [];
      setAllCategories(allCategoriesData);

      // Filter to only show main categories (no parent) in the dropdown
      const mainCategories = allCategoriesData.filter(cat => !cat.parent || cat.parent === null);

      setCategories(mainCategories);
      setVendors(vendorsData.data || vendorsData || []);
    } catch (error) {
      console.error('Error loading categories and vendors:', error);
      toast.error('Failed to load categories and vendors');
    }
  };

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
    const price15 = offer; // Reverse 25% discount

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

  // Generate next product code based on category
  const generateNextProductCode = async (categoryCode) => {
    try {
      // Get existing products to determine next code
      const existingProducts = await productService.getProducts();
      const products = existingProducts.data || existingProducts || [];

      const existingCodes = products
        .filter(p => p.code && p.code.startsWith(`${BRANCH_CODE}/${categoryCode}/`))
        .map(p => {
          const parts = p.code.split('/');
          return parts[2]; // Extract the serial part like "A00001"
        });

      let maxSerial = 0;
      let maxChar = "A";

      // If no existing codes, start with A00001
      if (existingCodes.length === 0) {
        return `${BRANCH_CODE}/${categoryCode}/A00001`;
      }

      // Find the highest letter and number combination
      existingCodes.forEach(codePart => {
        if (codePart) {
          const match = codePart.match(/^([A-Z])(\d{5})$/);
          if (match) {
            const [_, letter, numStr] = match;
            const num = parseInt(numStr);

            // If this letter is higher than current maxChar, update both
            if (letter > maxChar) {
              maxChar = letter;
              maxSerial = num;
            }
            // If same letter, check if number is higher
            else if (letter === maxChar && num > maxSerial) {
              maxSerial = num;
            }
          }
        }
      });

      // Increment for next available code
      maxSerial++;

      // Handle overflow: A99999 -> B00001
      if (maxSerial > 99999) {
        maxSerial = 1; // Reset to 1, not 0
        maxChar = String.fromCharCode(maxChar.charCodeAt(0) + 1);
        if (maxChar > "Z") {
          throw new Error("Max product limit reached");
        }
      }

      const serialStr = maxChar + String(maxSerial).padStart(5, "0");
      const newCode = `${BRANCH_CODE}/${categoryCode}/${serialStr}`;

      return newCode;
    } catch (error) {
      console.error('Error generating product code:', error);
      throw error;
    }
  };

  // Handle generate code button
  const handleGenerateCode = async () => {
    if (!formData.category) {
      toast.error('Please select a category first');
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast.error('Please enter valid quantity before generating code');
      return;
    }

    if (generatedCode) {
      toast.warning('Product code already generated. To generate a new one, refresh the page.');
      return;
    }

    try {
      const category = categories.find(c => c._id === formData.category);
      if (!category) {
        toast.error('Invalid category selected');
        return;
      }

      const productCode = await generateNextProductCode(category.code);
      setGeneratedCode(productCode);

      // Generate barcode
      const timestamp = Date.now().toString().slice(-6);
      const barcode = `${timestamp}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      setGeneratedBarcode(barcode);

      // Show preview of what will be created
      const quantity = parseInt(formData.quantity);
      let preview = `🧾 Generated Product Codes:\n\n`;

      preview += `✅ Product Code: ${productCode}\n`;
      preview += `✅ Barcode: ${barcode}\n\n`;
      preview += `👕 Single Product\n`;
      preview += `📦 Quantity: ${quantity} items\n`;


      alert(preview);
      toast.success('Product code generated successfully!');
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate product code');
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (formData.bundleType === 'different_sizes_different_colors' && value < 2) {
      toast.info('Mixed bundles must have at least 2 items (1 parent + children)');
    }
    handleInputChange(e);
  };

  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle quantity field for mixed bundles
      if (name === 'quantity' && formData.bundleType === 'different_sizes_different_colors') {
        const qty = parseInt(value) || 0;
        if (qty < 2) {
          toast.info('Mixed bundles must have at least 2 items (1 parent + children)');
        }
      }
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));

    }
  };

  // Handle category change and load subcategories
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setFormData(prev => ({ ...prev, category: categoryId, subcategory: '' }));

    if (categoryId) {
      const category = categories.find(c => c._id === categoryId);
      if (category) {
        // Load subcategories based on category code
        const categorySubcategories = subcategories.filter(s => s.parent === category.code);
        // You might want to implement subcategory loading from API
      }
    }
  };

  // Vendor selection functions
  const openVendorModal = () => {
    setShowVendorModal(true);
    setVendorSearch('');
  };

  const selectVendor = (vendor) => {
    setSelectedVendor(vendor);
    setFormData(prev => ({ ...prev, vendor: vendor._id }));
    setShowVendorModal(false);
    toast.success(`Vendor selected: ${vendor.name}`);
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    vendor.city?.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  // Validate form simplified
  const validateForm = () => {
    if (!formData.name) {
      toast.error('Product Name is required');
      return false;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return false;
    }
    if (!formData.factoryPrice) {
      toast.error('Factory Price is required');
      return false;
    }
    if (!formData.quantity) {
      toast.error('Quantity is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare base product data
      const baseProduct = {
        name: formData.name,
        description: formData.description,
        code: generatedCode,
        barcode: generatedBarcode,
        hsnCode: formData.hsnCode ? formData.hsnCode.trim() : undefined, // Include HSN Code (skip if empty)
        category: formData.category,
        ...(formData.subcategory && formData.subcategory.trim() && { subcategory: formData.subcategory }),
        vendor: selectedVendor._id,
        pricing: {
          factoryPrice: parseFloat(formData.factoryPrice),
          offerPrice: parseFloat(formData.offerPrice),
          discountedPrice: parseFloat(formData.discountedPrice),
          mrp: parseFloat(formData.mrp)
        },
        inventory: {
          currentStock: parseInt(formData.quantity) || 0,
          minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : 0,
          maxStockLevel: formData.maxStockLevel ? parseInt(formData.maxStockLevel) : 1000
        },
        unit: formData.unit,
        isComboEligible: formData.isComboEligible,
        isActive: formData.isActive,
        specifications: formData.specifications,
        createdBy: user._id,
        type: 'standalone' // Always standalone now
      };

      // Create the product
      await productService.createProduct(baseProduct);

      toast.success('Product created successfully!');

      navigate('/products');

    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateMargin = () => {
    const cost = parseFloat(formData.factoryPrice) || 0;
    const selling = parseFloat(formData.offerPrice) || 0;

    if (cost > 0 && selling > 0) {
      const margin = ((selling - cost) / cost * 100);
      return margin.toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="p-6 space-y-6">
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
          <h1 className="text-3xl font-bold text-gray-900">➕ Add New Product</h1>
          <p className="text-gray-600 mt-2">Create a new product with automated pricing and bundle support</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2">
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
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Denim Jacket"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* HSN Code Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    name="hsnCode"
                    value={formData.hsnCode}
                    onChange={handleInputChange}
                    placeholder="e.g., 6203"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.name} - {category.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory
                    </label>
                    <select
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!formData.category}
                    >
                      <option value="">Select Subcategory</option>
                      {subcategories.map(subcategory => (
                        <option key={subcategory._id} value={subcategory._id}>
                          {subcategory.name} - {subcategory.code}
                        </option>
                      ))}
                    </select>
                    {!formData.category && (
                      <p className="text-xs text-gray-500 mt-1">Select a category first</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor *
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={openVendorModal}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select Vendor
                    </button>
                    <span className="text-gray-600">
                      {selectedVendor ? `${selectedVendor.name} (${selectedVendor.city})` : 'No vendor selected'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simple Quantity Input */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleQuantityChange}
                    placeholder="e.g., 30"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
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
                      name="factoryPrice"
                      value={formData.factoryPrice}
                      onChange={handleFactoryPriceChange}
                      placeholder="e.g., 450"
                      step="0.01"
                      min="0"
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
                      name="offerPrice"
                      value={formData.offerPrice}
                      onChange={handlePriceChange('offerPrice')}
                      readOnly={autoCalculation.offerPrice}
                      placeholder={autoCalculation.offerPrice ? "Auto calculated" : "Enter offer price"}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${autoCalculation.offerPrice ? 'bg-gray-100 text-gray-600' : 'bg-white'
                        }`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>Discounted Price</span>
                      <button
                        type="button"
                        onClick={() => toggleAutoCalculation('discountedPrice')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${autoCalculation.discountedPrice
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {autoCalculation.discountedPrice ? '🔄 Auto' : '✏️ Manual'}
                      </button>
                    </label>
                    <input
                      type="number"
                      name="discountedPrice"
                      value={formData.discountedPrice}
                      onChange={handlePriceChange('discountedPrice')}
                      readOnly={autoCalculation.discountedPrice}
                      placeholder={autoCalculation.discountedPrice ? "Auto calculated" : "Enter discounted price"}
                      step="0.01"
                      min="0"
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
                      name="mrp"
                      value={formData.mrp}
                      onChange={handlePriceChange('mrp')}
                      readOnly={autoCalculation.mrp}
                      placeholder={autoCalculation.mrp ? "Auto calculated" : "Enter MRP"}
                      step="0.01"
                      min="0"
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${autoCalculation.mrp ? 'bg-gray-100 text-gray-600' : 'bg-white'
                        }`}
                    />
                  </div>
                </div>

                {/* Pricing Control Info */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">🔧 Pricing Controls:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• <span className="font-medium">🔄 Auto:</span> Prices calculated automatically from Factory Price</p>
                    <p>• <span className="font-medium">✏️ Manual:</span> Override auto-calculation with custom prices</p>
                    <p>• Click the toggle buttons to switch between Auto and Manual modes</p>
                  </div>
                </div>

                {/* Pricing Formula Display */}
                {formData.factoryPrice && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">💡 Auto-Calculation Formula:</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      {(() => {
                        const profitPrice = parseFloat(formData.factoryPrice) * 2;
                        const gstRate = getGSTRate(profitPrice);
                        const gstAmount = profitPrice * gstRate;
                        const afterGst = profitPrice + gstAmount;
                        const commission = (afterGst / 500) * 30;

                        return (
                          <>
                            <p>Factory Price: ₹{formData.factoryPrice}</p>
                            <p>Profit Price: ₹{formData.factoryPrice} × 2 = ₹{profitPrice.toFixed(2)}</p>
                            <p>GST ({(gstRate * 100).toFixed(0)}%): ₹{gstAmount.toFixed(2)} {profitPrice > 2500 ? '(Above ₹2500)' : '(Below ₹2500)'}</p>
                            <p>Commission: ₹{commission.toFixed(2)}</p>
                            <p>Profit Margin: <span className="font-bold">{calculateMargin()}%</span></p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Product Code Generation */}
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
                    Product Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generatedCode}
                      readOnly
                      placeholder="Click Generate"
                      className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Format: SHI/CategoryCode/SerialCode
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={generatedBarcode}
                    readOnly
                    placeholder="Auto-generated"
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Generated automatically for scanning
                  </p>
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
                    name="isComboEligible"
                    checked={formData.isComboEligible}
                    onChange={handleInputChange}
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
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
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
                      name="specifications.size"
                      value={formData.specifications.size}
                      onChange={handleInputChange}
                      placeholder="e.g., M, 42, 10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      name="specifications.color"
                      value={formData.specifications.color}
                      onChange={handleInputChange}
                      placeholder="e.g., Blue, Black"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  name="specifications.brand"
                  value={formData.specifications.brand}
                  onChange={handleInputChange}
                  placeholder="Brand"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  name="specifications.model"
                  value={formData.specifications.model}
                  onChange={handleInputChange}
                  placeholder="Model"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  name="specifications.warranty"
                  value={formData.specifications.warranty}
                  onChange={handleInputChange}
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
                Adding Product...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                ➕ Add Product
              </>
            )}
          </button>
        </div>
      </form>

      {/* Vendor Selection Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Vendor</h3>
                <button
                  onClick={() => setShowVendorModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vendor by name or city"
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="max-h-96 overflow-y-auto">
                {filteredVendors.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No vendors found</p>
                ) : (
                  <div className="space-y-2">
                    {filteredVendors.map((vendor) => (
                      <div
                        key={vendor._id}
                        onClick={() => selectVendor(vendor)}
                        className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-gray-600">{vendor.city}</div>
                        {vendor.phone && (
                          <div className="text-sm text-gray-500">{vendor.phone}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProductPage;