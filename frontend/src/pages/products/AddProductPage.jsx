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
    
    // Bundle fields matching HTML
    bundleType: '',
    quantity: '',
    sizes: '',
    colors: '',
    
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
      brand: '',
      model: '',
      warranty: ''
    }
  });
  
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedBarcode, setGeneratedBarcode] = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  
  const BRANCH_CODE = "SHI";

  // Load categories and vendors from API
  useEffect(() => {
    loadCategoriesAndVendors();
  }, []);

  const loadCategoriesAndVendors = async () => {
    try {
      const [categoriesData, vendorsData] = await Promise.all([
        categoryService.getCategories(),
        vendorService.getVendors()
      ]);
      
      setCategories(categoriesData.data || categoriesData || []);
      setVendors(vendorsData.data || vendorsData || []);
    } catch (error) {
      console.error('Error loading categories and vendors:', error);
      toast.error('Failed to load categories and vendors');
    }
  };

  // Calculate prices automatically based on factory price
  const calculatePrices = (factoryPrice) => {
    const profitPrice = factoryPrice * 2;
    const gst = profitPrice * 0.05;
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
        offerPrice: offer.toString(),
        discountedPrice: price15.toString(),
        mrp: mrp.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        offerPrice: '',
        discountedPrice: '',
        mrp: ''
      }));
    }
  };

  // Generate next product code based on category
  const generateNextProductCode = async (categoryCode) => {
    try {
      // Get existing products to determine next code
      const existingProducts = await productService.getProducts();
      const products = existingProducts.data || existingProducts || [];
      
      console.log('Total products found:', products.length);
      
      const existingCodes = products
        .filter(p => p.code && p.code.startsWith(`${BRANCH_CODE}/${categoryCode}/`))
        .map(p => {
          const parts = p.code.split('/');
          return parts[2]; // Extract the serial part like "A00001"
        });

      console.log('Existing codes for category', categoryCode, ':', existingCodes);

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
      
      console.log('Generated new code:', newCode);
      console.log('Previous max was:', (maxSerial === 1 && maxChar !== "A") ? 
        String.fromCharCode(maxChar.charCodeAt(0) - 1) + "99999" : 
        maxChar + String(maxSerial - 1).padStart(5, "0"));
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
      
      if (formData.bundleType) {
        const sizes = formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : [];
        const colors = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : [];
        
        if (formData.bundleType === 'sameSizeDifferentColors') {
          const perColor = quantity / colors.length;
          preview += `👕 Bundle: Same Size (${sizes[0]}), Different Colors\n`;
          colors.forEach((color, i) => {
            const childCode = i === 0 ? productCode : `${productCode}/${(i).toString().padStart(2, '0')}`;
            preview += `  - ${color}: ${perColor} items (${childCode})\n`;
          });
        } else if (formData.bundleType === 'differentSizesSameColor') {
          const perSize = quantity / sizes.length;
          preview += `👕 Bundle: Different Sizes, Same Color (${colors[0]})\n`;
          sizes.forEach((size, i) => {
            const childCode = i === 0 ? productCode : `${productCode}/${(i).toString().padStart(2, '0')}`;
            preview += `  - ${size}: ${perSize} items (${childCode})\n`;
          });
        }
      } else {
        preview += `👕 Single Product: ${productCode}\n`;
        preview += `  - Quantity: ${quantity} items\n`;
      }
      
      alert(preview);
      toast.success('Product code generated successfully!');
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error('Failed to generate product code');
    }
  };

  const handleInputChange = (e) => {
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

  // Validate bundle inputs
  const validateBundleInputs = () => {
    if (!formData.bundleType) return true;

    const quantity = parseInt(formData.quantity);
    const sizes = formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : [];
    const colors = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : [];

    if (formData.bundleType === 'sameSizeDifferentColors') {
      if (sizes.length !== 1) {
        toast.error('Enter exactly 1 size for "Same Size, Different Colors" bundle');
        return false;
      }
      if (colors.length === 0) {
        toast.error('Enter colors for the bundle');
        return false;
      }
      if (quantity % colors.length !== 0) {
        toast.error(`Quantity (${quantity}) must be divisible by number of colors (${colors.length})`);
        return false;
      }
    }

    if (formData.bundleType === 'differentSizesSameColor') {
      if (colors.length !== 1) {
        toast.error('Enter exactly 1 color for "Different Sizes, Same Color" bundle');
        return false;
      }
      if (sizes.length === 0) {
        toast.error('Enter sizes for the bundle');
        return false;
      }
      if (quantity % sizes.length !== 0) {
        toast.error(`Quantity (${quantity}) must be divisible by number of sizes (${sizes.length})`);
        return false;
      }
    }

    return true;
  };

  const calculateBundleDistribution = () => {
    if (!formData.bundleType || !formData.quantity) return null;

    const quantity = parseInt(formData.quantity);
    const sizes = formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : [];
    const colors = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : [];

    if (formData.bundleType === 'sameSizeDifferentColors' && colors.length > 0 && sizes.length > 0) {
      const perColor = Math.floor(quantity / colors.length);
      return `${perColor} items per color: ${colors.join(', ')} - all in size ${sizes[0]} (Total: ${perColor * colors.length})`;
    }

    if (formData.bundleType === 'differentSizesSameColor' && sizes.length > 0 && colors.length > 0) {
      const perSize = Math.floor(quantity / sizes.length);
      return `${perSize} items per size: ${sizes.join(', ')} - all in ${colors[0]} color (Total: ${perSize * sizes.length})`;
    }

    return null;
  };

  const validateForm = () => {
    const required = ['name', 'category', 'factoryPrice', 'quantity'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return false;
    }

    if (!generatedCode) {
      toast.error('Please generate product code first');
      return false;
    }

    if (!selectedVendor) {
      toast.error('Please select a vendor');
      return false;
    }
    
    if (parseFloat(formData.factoryPrice) <= 0) {
      toast.error('Factory price must be greater than 0');
      return false;
    }
    
    if (parseInt(formData.quantity) <= 0) {
      toast.error('Quantity must be greater than 0');
      return false;
    }

    return validateBundleInputs();
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
        category: formData.category,
        subcategory: formData.subcategory,
        vendor: selectedVendor._id,
        pricing: {
          costPrice: parseFloat(formData.factoryPrice),
          sellingPrice: parseFloat(formData.offerPrice),
          mrp: parseFloat(formData.mrp),
          wholesalePrice: parseFloat(formData.offerPrice) * 0.9 // 10% less than selling price
        },
        inventory: {
          currentStock: parseInt(formData.quantity),
          minStockLevel: formData.minStockLevel ? parseInt(formData.minStockLevel) : 0,
          maxStockLevel: formData.maxStockLevel ? parseInt(formData.maxStockLevel) : 1000
        },
        unit: formData.unit,
        isComboEligible: formData.isComboEligible,
        isActive: formData.isActive,
        specifications: formData.specifications,
        createdBy: user._id,
        type: formData.bundleType ? 'parent' : 'standalone'
      };

      // Add bundle configuration if it's a bundle
      if (formData.bundleType) {
        console.log('=== FORM SUBMISSION DEBUG ===');
        console.log('Raw formData.bundleType:', formData.bundleType);
        console.log('Raw formData.sizes:', formData.sizes);
        console.log('Raw formData.colors:', formData.colors);
        console.log('Raw formData.quantity:', formData.quantity);
        
        const sizes = formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : [];
        const colors = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : [];
        
        console.log('Parsed sizes:', sizes);
        console.log('Parsed colors:', colors);
        console.log('Bundle type check - sameSizeDifferentColors:', formData.bundleType === 'sameSizeDifferentColors');
        console.log('Bundle type check - differentSizesSameColor:', formData.bundleType === 'differentSizesSameColor');
        
        // Determine correct bundle type
        let bundleType = 'custom';
        if (formData.bundleType === 'sameSizeDifferentColors') {
          bundleType = 'same_size_different_colors';
        } else if (formData.bundleType === 'differentSizesSameColor') {
          bundleType = 'different_sizes_same_color';
        }
        
        console.log('Final bundleType:', bundleType);
        console.log('bundleSize calculation:', (formData.bundleType === 'sameSizeDifferentColors' ? colors.length : sizes.length));
        console.log('=== END DEBUG ===');
        
        baseProduct.bundle = {
          isBundle: true,
          bundleType: bundleType,
          bundleSize: (formData.bundleType === 'sameSizeDifferentColors' ? colors.length : sizes.length),
          autoGenerateChildren: true,
          bundlePrefix: formData.name.substring(0, 5).toUpperCase(),
          bundleConfig: {
            baseSize: formData.bundleType === 'sameSizeDifferentColors' ? sizes[0] : sizes.length > 0 ? sizes[0] : null,
            baseColor: formData.bundleType === 'differentSizesSameColor' ? colors[0] : colors.length > 0 ? colors[0] : null,
            sizes: sizes,
            colors: colors,
            quantity: parseInt(formData.quantity), // Use total quantity, not per-variant
            priceVariation: 0
          }
        };
        
        // Set parent product specifications
        if (formData.bundleType === 'sameSizeDifferentColors' && sizes.length > 0 && colors.length > 0) {
          baseProduct.specifications.size = sizes[0];
          baseProduct.specifications.color = colors[0]; // First color as parent
        } else if (formData.bundleType === 'differentSizesSameColor' && sizes.length > 0 && colors.length > 0) {
          baseProduct.specifications.size = sizes[0]; // First size as parent
          baseProduct.specifications.color = colors[0];
        }
      }

      // Create the product (backend will handle child creation for bundles)
      console.log('=== FINAL PAYLOAD TO API ===');
      console.log('baseProduct.bundle:', JSON.stringify(baseProduct.bundle, null, 2));
      console.log('=== END PAYLOAD DEBUG ===');
      
      const result = await productService.createProduct(baseProduct);
      
      if (formData.bundleType) {
        toast.success(`Bundle created successfully with ${result.bundleSummary?.summary?.totalChildren || 0} child products!`);
      } else {
        toast.success('Product created successfully!');
      }
      
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleCategoryChange}
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
                    <input
                      type="text"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      placeholder="Enter subcategory"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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

            {/* Inventory */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bundle Type
                    </label>
                    <select
                      name="bundleType"
                      value={formData.bundleType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Bundle Type</option>
                      <option value="sameSizeDifferentColors">Same Size, Different Colors</option>
                      <option value="differentSizesSameColor">Different Sizes, Same Color</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="e.g., 30"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sizes {formData.bundleType && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="sizes"
                      value={formData.sizes}
                      onChange={handleInputChange}
                      placeholder="e.g., S, M, L, XL"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formData.bundleType && !formData.sizes ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required={!!formData.bundleType}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comma separated values {formData.bundleType ? '(Required for bundles)' : ''}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Colors {formData.bundleType && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="colors"
                      value={formData.colors}
                      onChange={handleInputChange}
                      placeholder="e.g., Red, Blue, Green"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formData.bundleType && !formData.colors ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required={!!formData.bundleType}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comma separated values {formData.bundleType ? '(Required for bundles)' : ''}
                    </p>
                  </div>
                </div>

                {/* Bundle Distribution Preview */}
                {formData.bundleType && formData.quantity && (formData.sizes || formData.colors) && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">📦 Bundle Distribution:</h4>
                    <p className="text-sm text-blue-700">
                      {calculateBundleDistribution()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  💰 Pricing (Auto-calculated)
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Offer Price
                    </label>
                    <input
                      type="text"
                      name="offerPrice"
                      value={formData.offerPrice}
                      readOnly
                      placeholder="Auto calculated"
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discounted Price
                    </label>
                    <input
                      type="text"
                      name="discountedPrice"
                      value={formData.discountedPrice}
                      readOnly
                      placeholder="Auto calculated"
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP
                    </label>
                    <input
                      type="text"
                      name="mrp"
                      value={formData.mrp}
                      readOnly
                      placeholder="Auto calculated"
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                
                {/* Pricing Formula Display */}
                {formData.factoryPrice && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">💡 Pricing Formula:</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>Factory Price: ₹{formData.factoryPrice}</p>
                      <p>Profit Price: ₹{formData.factoryPrice} × 2 = ₹{(parseFloat(formData.factoryPrice) * 2).toFixed(2)}</p>
                      <p>GST (5%): ₹{((parseFloat(formData.factoryPrice) * 2) * 0.05).toFixed(2)}</p>
                      <p>Commission: ₹{(((parseFloat(formData.factoryPrice) * 2) * 1.05 / 500) * 30).toFixed(2)}</p>
                      <p>Profit Margin: <span className="font-bold">{calculateMargin()}%</span></p>
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