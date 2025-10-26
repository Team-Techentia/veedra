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

  // Auto-generate mixedBundleConfig when bundle type, sizes, or colors change
  useEffect(() => {
    if (formData.bundleType && (formData.sizes || formData.colors)) {
      const sizes = formData.sizes.split(',').filter(s => s.trim()).map(s => s.trim());
      const colors = formData.colors.split(',').filter(c => c.trim()).map(c => c.trim());
      
      let newConfig = [];
      
      if (formData.bundleType === 'sameSizeDifferentColors' && colors.length > 0) {
        // Generate config for each color with size fixed
        const baseSize = sizes[0] || 'S';
        newConfig = colors.map(color => ({
          key: `color-${color}`,
          size: baseSize,
          color: color,
          quantity: 1
        }));
      } else if (formData.bundleType === 'differentSizesSameColor' && sizes.length > 0) {
        // Generate config for each size with color fixed
        const baseColor = colors[0] || 'Black';
        newConfig = sizes.map(size => ({
          key: `size-${size}`,
          size: size,
          color: baseColor,
          quantity: 1
        }));
      }
      // Note: different_sizes_different_colors doesn't need custom quantity configuration
      
      // Only update if the config structure changed
      if (newConfig.length > 0 && JSON.stringify(newConfig.map(c => c.key)) !== JSON.stringify(mixedBundleConfig.map(c => c.key))) {
        setMixedBundleConfig(newConfig);
      }
    }
  }, [formData.bundleType, formData.sizes, formData.colors]);

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
      
      if (formData.bundleType && formData.bundleType !== '') {
        const sizes = formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : [];
        const colors = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : [];
        
        preview += `✅ Product Code: ${productCode}\n`;
        preview += `✅ Barcode: ${barcode}\n\n`;
        
        if (formData.bundleType === 'sameSizeDifferentColors') {
          preview += `👕 Bundle Type: Same Size, Different Colors\n`;
          preview += `📏 Size: ${sizes[0] || 'Not specified'}\n`;
          preview += `🎨 Colors: ${colors.length > 0 ? colors.join(', ') : 'Not specified'}\n`;
          preview += `📦 Total Quantity: ${quantity}\n\n`;
          preview += `📋 Distribution:\n`;
          
          // Check if custom quantities are set
          const customQuantities = mixedBundleConfig.filter(item => item.quantity > 0 && item.color);
          if (customQuantities.length > 0) {
            customQuantities.forEach((config, i) => {
              const childCode = i === 0 ? productCode : `${productCode}/${(i + 1).toString().padStart(2, '0')}`;
              preview += `  ${i + 1}. ${config.color}: ${config.quantity} items (${childCode})\n`;
            });
          } else {
            preview += `  ⚠️ No custom quantities configured for colors\n`;
          }
        } else if (formData.bundleType === 'differentSizesSameColor') {
          preview += `👕 Bundle Type: Different Sizes, Same Color\n`;
          preview += `📏 Sizes: ${sizes.length > 0 ? sizes.join(', ') : 'Not specified'}\n`;
          preview += `🎨 Color: ${colors[0] || 'Not specified'}\n`;
          preview += `📦 Total Quantity: ${quantity}\n\n`;
          preview += `📋 Distribution:\n`;
          
          // Check if custom quantities are set
          const customQuantities = mixedBundleConfig.filter(item => item.quantity > 0 && item.size);
          if (customQuantities.length > 0) {
            customQuantities.forEach((config, i) => {
              const childCode = i === 0 ? productCode : `${productCode}/${(i + 1).toString().padStart(2, '0')}`;
              preview += `  ${i + 1}. ${config.size}: ${config.quantity} items (${childCode})\n`;
            });
          } else {
            preview += `  ⚠️ No custom quantities configured for sizes\n`;
          }
        } else if (formData.bundleType === 'different_sizes_different_colors') {
          preview += `👕 Bundle Type: Mixed Size & Color Bundle\n`;
          preview += `📦 Total Items: ${quantity}\n\n`;
          preview += `📋 Product Structure:\n`;
          preview += `• Parent Product (${productCode})\n`;
          preview += `  - Quantity: 1\n`;
          preview += `  - Type: parent\n\n`;
          preview += `• Child Products:\n`;
          for (let i = 0; i < quantity - 1; i++) {
            const childCode = `${productCode}/${(i + 1).toString().padStart(2, '0')}`;
            preview += `  ${i + 1}. Mixed Bundle Child ${i + 1} (${childCode})\n`;
            preview += `     - Quantity: 1\n`;
            preview += `     - Type: child\n`;
          }
          preview += `\n💡 Creates ${quantity-1} individual child products with quantity 1 each.\n`;
        } else {
          preview += `❓ Unknown Bundle Type: ${formData.bundleType}\n`;
        }
      } else {
        preview += `✅ Product Code: ${productCode}\n`;
        preview += `✅ Barcode: ${barcode}\n\n`;
        preview += `👕 Single Product\n`;
        preview += `📦 Quantity: ${quantity} items\n`;
      }
      
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
      
      // Reset bundle configuration when bundle type changes
      if (name === 'bundleType') {
        setMixedBundleConfig([]);
        // If switching to mixed bundle, ensure minimum quantity
        if (value === 'different_sizes_different_colors' && (!formData.quantity || parseInt(formData.quantity) < 2)) {
          setFormData(prev => ({ ...prev, quantity: '2' }));
          toast.info('Mixed bundles must have at least 2 items (1 parent + 1 child)');
        }
      }
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
      
      // Check if custom quantities are configured and match total
      const configuredQuantity = mixedBundleConfig.reduce((sum, item) => sum + item.quantity, 0);
      if (configuredQuantity === 0) {
        toast.error('Configure custom quantities for each color');
        return false;
      }
      if (configuredQuantity !== quantity) {
        toast.error(`Total configured quantity (${configuredQuantity}) must equal the main quantity (${quantity})`);
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
      
      // Check if custom quantities are configured and match total
      const configuredQuantity = mixedBundleConfig.reduce((sum, item) => sum + item.quantity, 0);
      if (configuredQuantity === 0) {
        toast.error('Configure custom quantities for each size');
        return false;
      }
      if (configuredQuantity !== quantity) {
        toast.error(`Total configured quantity (${configuredQuantity}) must equal the main quantity (${quantity})`);
        return false;
      }
    }

  if (formData.bundleType === 'different_sizes_different_colors') {
      // For Mixed Size Mixed Color bundles, we only need quantity - no specific sizes/colors
      if (quantity <= 0) {
        toast.error('Enter a valid quantity for the mixed bundle');
        return false;
      }
  // No custom quantity validation needed for different_sizes_different_colors
    }

    return true;
  };

  const calculateBundleDistribution = () => {
    if (!formData.bundleType || !formData.quantity) return null;

    const quantity = parseInt(formData.quantity);
    const sizes = formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : [];
    const colors = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : [];

    if (formData.bundleType === 'sameSizeDifferentColors' && colors.length > 0 && sizes.length > 0) {
      // Check if custom quantities are set
      const customQuantities = mixedBundleConfig.filter(item => item.quantity > 0 && item.color);
      if (customQuantities.length > 0) {
        const distributions = customQuantities.map(item => `${item.color}: ${item.quantity}`).join(', ');
        const total = customQuantities.reduce((sum, item) => sum + item.quantity, 0);
        return `Custom distribution for size ${sizes[0]}: ${distributions} (Total: ${total})`;
      } else {
        const perColor = Math.floor(quantity / colors.length);
        return `${perColor} items per color: ${colors.join(', ')} - all in size ${sizes[0]} (Total: ${perColor * colors.length})`;
      }
    }

    if (formData.bundleType === 'differentSizesSameColor' && sizes.length > 0 && colors.length > 0) {
      // Check if custom quantities are set
      const customQuantities = mixedBundleConfig.filter(item => item.quantity > 0 && item.size);
      if (customQuantities.length > 0) {
        const distributions = customQuantities.map(item => `${item.size}: ${item.quantity}`).join(', ');
        const total = customQuantities.reduce((sum, item) => sum + item.quantity, 0);
        return `Custom distribution for ${colors[0]} color: ${distributions} (Total: ${total})`;
      } else {
        const perSize = Math.floor(quantity / sizes.length);
        return `${perSize} items per size: ${sizes.join(', ')} - all in ${colors[0]} color (Total: ${perSize * sizes.length})`;
      }
    }

  if (formData.bundleType === 'different_sizes_different_colors') {
      return `Mixed Size & Color Bundle:
• 1 Parent product (quantity: 1)
• ${quantity - 1} Child products (each with quantity: 1)
Total: ${quantity} items`;
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
        ...(formData.subcategory && formData.subcategory.trim() && { subcategory: formData.subcategory }),
        vendor: selectedVendor._id,
        pricing: {
          factoryPrice: parseFloat(formData.factoryPrice),
          offerPrice: parseFloat(formData.offerPrice),
          discountedPrice: parseFloat(formData.discountedPrice),
          mrp: parseFloat(formData.mrp)
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
        const sizes = formData.sizes ? formData.sizes.split(',').map(s => s.trim()).filter(s => s) : [];
        const colors = formData.colors ? formData.colors.split(',').map(c => c.trim()).filter(c => c) : [];
        
        // Determine correct bundle type
        let bundleType = 'custom';
        let bundleSize = 1;
        
        if (formData.bundleType === 'sameSizeDifferentColors') {
          bundleType = 'same_size_different_colors';
          bundleSize = colors.length;
        } else if (formData.bundleType === 'differentSizesSameColor') {
          bundleType = 'different_sizes_same_color';
          bundleSize = sizes.length;
        } else if (formData.bundleType === 'different_sizes_different_colors') {
          bundleType = 'different_sizes_different_colors';
          bundleSize = parseInt(formData.quantity); // Total bundle size includes all children
        }        const bundleConfig = {
          baseSize: formData.bundleType === 'sameSizeDifferentColors' ? sizes[0] : 
                   formData.bundleType === 'different_sizes_different_colors' ? null : // No specific size for mixed bundles
                   sizes.length > 0 ? sizes[0] : null,
          baseColor: formData.bundleType === 'differentSizesSameColor' ? colors[0] : 
                    formData.bundleType === 'different_sizes_different_colors' ? null : // No specific color for mixed bundles
                    colors.length > 0 ? colors[0] : null,
          sizes: formData.bundleType === 'different_sizes_different_colors' ? [] : sizes, // Empty arrays for mixed bundles
          colors: formData.bundleType === 'different_sizes_different_colors' ? [] : colors,
          quantity: parseInt(formData.quantity),
          priceVariation: 0
        };
        
        // Add mixed bundle configuration for specific bundle types only
        if (formData.bundleType === 'sameSizeDifferentColors') {
          // For same size different colors, create mixed config from color quantities
          bundleConfig.mixedConfig = mixedBundleConfig.filter(item => item.quantity > 0 && item.color);
        } else if (formData.bundleType === 'differentSizesSameColor') {
          // For different sizes same color, create mixed config from size quantities
          bundleConfig.mixedConfig = mixedBundleConfig.filter(item => item.quantity > 0 && item.size);
        }
  // For different_sizes_different_colors, we use 1+49 structure
        
        baseProduct.bundle = {
          isBundle: true,
          bundleType: bundleType,
          bundleSize: parseInt(formData.quantity), // Set bundle size to total quantity
          autoGenerateChildren: true,
          bundlePrefix: formData.name.substring(0, 5).toUpperCase(),
          bundleConfig: {
            ...bundleConfig,
            mixedConfig: formData.bundleType === 'different_sizes_different_colors' ? [{
              key: 'mixed-bundle',
              size: 'Mixed',
              color: 'Mixed',
              quantity: 1 // Each child gets quantity of 1
            }] : bundleConfig.mixedConfig
          }
        };
        
        // Set parent product specifications
        if (formData.bundleType === 'sameSizeDifferentColors' && sizes.length > 0 && colors.length > 0) {
          baseProduct.specifications.size = sizes[0];
          baseProduct.specifications.color = colors[0]; // First color as parent
        } else if (formData.bundleType === 'differentSizesSameColor' && sizes.length > 0 && colors.length > 0) {
          baseProduct.specifications.size = sizes[0]; // First size as parent
          baseProduct.specifications.color = colors[0];
  } else if (formData.bundleType === 'different_sizes_different_colors') {
          // For mixed bundles, don't set specific size/color - leave as general parent
          // The product will represent the entire mixed bundle without specific variants
        }
      }

      // Create the product (backend will handle child creation for bundles)
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
                      <option value="different_sizes_different_colors">Mixed Size, Mixed Color</option>
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
                      onChange={handleQuantityChange}
                      placeholder="e.g., 30"
                      min={formData.bundleType === 'different_sizes_different_colors' ? 2 : 1}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formData.bundleType === 'different_sizes_different_colors' && parseInt(formData.quantity) < 2
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      required
                    />
                    {formData.bundleType === 'different_sizes_different_colors' && (
                      <p className="text-xs text-blue-600 mt-1">
                        Mixed bundles will create 1 parent and {Math.max(0, parseInt(formData.quantity || 0) - 1)} child products (total: {formData.quantity || 0})
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sizes {formData.bundleType && formData.bundleType !== 'different_sizes_different_colors' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="sizes"
                      value={formData.sizes}
                      onChange={handleInputChange}
                      placeholder={formData.bundleType === 'different_sizes_different_colors' ? 'Not required for Mix Size Mix Color' : 'e.g., S, M, L, XL'}
                      disabled={formData.bundleType === 'different_sizes_different_colors'}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formData.bundleType === 'different_sizes_different_colors' ? 'bg-gray-100 text-gray-400' :
                        formData.bundleType && !formData.sizes ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required={!!formData.bundleType && formData.bundleType !== 'different_sizes_different_colors'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.bundleType === 'different_sizes_different_colors' 
                        ? 'Sizes not needed for Mixed Size Mixed Color bundles'
                        : `Comma separated values ${formData.bundleType ? '(Required for bundles)' : ''}`
                      }
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Colors {formData.bundleType && formData.bundleType !== 'different_sizes_different_colors' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      name="colors"
                      value={formData.colors}
                      onChange={handleInputChange}
                      placeholder={formData.bundleType === 'different_sizes_different_colors' ? 'Not required for Mix Size Mix Color' : 'e.g., Red, Blue, Green'}
                      disabled={formData.bundleType === 'different_sizes_different_colors'}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formData.bundleType === 'different_sizes_different_colors' ? 'bg-gray-100 text-gray-400' :
                        formData.bundleType && !formData.colors ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required={!!formData.bundleType && formData.bundleType !== 'different_sizes_different_colors'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.bundleType === 'different_sizes_different_colors' 
                        ? 'Colors not needed for Mixed Size Mixed Color bundles'
                        : `Comma separated values ${formData.bundleType ? '(Required for bundles)' : ''}`
                      }
                    </p>
                  </div>
                </div>

                {/* Same Size Different Colors Configuration */}
                {formData.bundleType === 'sameSizeDifferentColors' && formData.colors && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3">🎨 Same Size, Different Colors Configuration</h4>
                    <p className="text-sm text-green-700 mb-3">
                      Set quantity for each color:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {formData.colors.split(',').filter(c => c.trim()).map(color => {
                        const key = `color-${color.trim()}`;
                        return (
                          <div key={key} className="bg-white p-2 rounded border">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {color.trim()}
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              onChange={(e) => {
                                const newConfig = [...mixedBundleConfig];
                                const existingIndex = newConfig.findIndex(item => item.key === key);
                                const quantity = parseInt(e.target.value) || 0;
                                
                                if (existingIndex >= 0) {
                                  newConfig[existingIndex] = { 
                                    key, 
                                    color: color.trim(), 
                                    quantity 
                                  };
                                } else {
                                  newConfig.push({ 
                                    key, 
                                    color: color.trim(), 
                                    quantity 
                                  });
                                }
                                setMixedBundleConfig(newConfig);
                              }}
                              value={mixedBundleConfig.find(item => item.key === key)?.quantity || ''}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-3 text-sm text-green-700">
                      <strong>Total Quantity: </strong>
                      {mixedBundleConfig.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                  </div>
                )}

                {/* Different Sizes Same Color Configuration */}
                {formData.bundleType === 'differentSizesSameColor' && formData.sizes && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-3">📏 Different Sizes, Same Color Configuration</h4>
                    <p className="text-sm text-purple-700 mb-3">
                      Set quantity for each size:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {formData.sizes.split(',').filter(s => s.trim()).map(size => {
                        const key = `size-${size.trim()}`;
                        return (
                          <div key={key} className="bg-white p-2 rounded border">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {size.trim()}
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              onChange={(e) => {
                                const newConfig = [...mixedBundleConfig];
                                const existingIndex = newConfig.findIndex(item => item.key === key);
                                const quantity = parseInt(e.target.value) || 0;
                                
                                if (existingIndex >= 0) {
                                  newConfig[existingIndex] = { 
                                    key, 
                                    size: size.trim(), 
                                    quantity 
                                  };
                                } else {
                                  newConfig.push({ 
                                    key, 
                                    size: size.trim(), 
                                    quantity 
                                  });
                                }
                                setMixedBundleConfig(newConfig);
                              }}
                              value={mixedBundleConfig.find(item => item.key === key)?.quantity || ''}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-3 text-sm text-purple-700">
                      <strong>Total Quantity: </strong>
                      {mixedBundleConfig.reduce((sum, item) => sum + item.quantity, 0)}
                    </div>
                  </div>
                )}

                {/* Mixed Bundle Configuration */}
                {formData.bundleType === 'mixedSizeMixedColor' && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3">📦 Mixed Size & Color Bundle</h4>
                    <p className="text-sm text-green-700 mb-3">
                      This will create a single parent product representing a mixed bundle of different sizes and colors.
                    </p>
                    
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm font-medium text-gray-700 mb-2">Bundle Details:</div>
                      <div className="text-sm text-gray-600">
                        • <strong>Product Type:</strong> Parent product only (no individual variants)
                      </div>
                      <div className="text-sm text-gray-600">
                        • <strong>Total Quantity:</strong> {formData.quantity || 0} mixed items
                      </div>
                      <div className="text-sm text-gray-600">
                        • <strong>Contents:</strong> Various sizes and colors in one bundle
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-green-700 bg-green-100 p-2 rounded">
                      <strong>Note:</strong> No child products will be created. This represents the entire mixed bundle as one item.
                    </div>
                  </div>
                )}

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
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          autoCalculation.offerPrice 
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
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        autoCalculation.offerPrice ? 'bg-gray-100 text-gray-600' : 'bg-white'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>Discounted Price</span>
                      <button
                        type="button"
                        onClick={() => toggleAutoCalculation('discountedPrice')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          autoCalculation.discountedPrice 
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
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        autoCalculation.discountedPrice ? 'bg-gray-100 text-gray-600' : 'bg-white'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-1">
                      <span>MRP</span>
                      <button
                        type="button"
                        onClick={() => toggleAutoCalculation('mrp')}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          autoCalculation.mrp 
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
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        autoCalculation.mrp ? 'bg-gray-100 text-gray-600' : 'bg-white'
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