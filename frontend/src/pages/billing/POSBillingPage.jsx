import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Minus, Search, Trash2, ShoppingCart, Calculator, Barcode, User, Scan, Receipt, CreditCard, Banknote, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import comboService from '../../services/comboService';
import billingService from '../../services/billingService';
import paymentService from '../../services/paymentService';
import categoryService from '../../services/categoryService';

const POSBillingPage = () => {
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [processing, setProcessing] = useState(false);
  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Focus on barcode input when component mounts
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, combosData, categoriesData] = await Promise.all([
        productService.getProducts(),
        comboService.getCombos(),
        categoryService.getCategories()
      ]);
      setProducts(productsData.data || productsData || []);
      setCombos(combosData.data || combosData || []);
      setCategories(categoriesData.data || categoriesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle barcode input
  const handleBarcodeInput = async (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      const product = products.find(p => 
        p.barcode === barcodeInput.trim() || 
        p.productCode === barcodeInput.trim()
      );
      
      if (product) {
        addToCart(product);
        setBarcodeInput('');
      } else {
        toast.error('Product not found!');
        setBarcodeInput('');
      }
    }
  };

  // Quick add product by Enter key
  const handleProductSearch = (e) => {
    if (e.key === 'Enter' && filteredProducts.length === 1) {
      e.preventDefault();
      addToCart(filteredProducts[0]);
      setSearchTerm('');
      barcodeInputRef.current?.focus();
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.productCode && product.productCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (product.barcode && product.barcode.includes(searchTerm));
    
    const matchesCategory = !selectedCategory || product.category?._id === selectedCategory;
    
    return matchesSearch && matchesCategory && product.isActive && (product.inventory?.currentStock || 0) > 0;
  });

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    
    if (existingItem) {
      if (existingItem.quantity < (product.inventory?.currentStock || 0)) {
        setCart(cart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast.error('Insufficient stock');
      }
    } else {
      setCart([...cart, {
        ...product,
        quantity: 1,
        price: product.pricing?.sellingPrice || 0
      }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p._id === productId);
    if (!product || newQuantity > (product.inventory?.currentStock || 0)) {
      alert('Insufficient stock');
      return;
    }

    setCart(cart.map(item =>
      item._id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
  };

  const calculateTax = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = (item.price || 0) * item.quantity;
      // Use a default tax rate if pricing.tax is not available
      const taxRate = item.pricing?.tax?.type === 'percentage' ? (item.pricing.tax.value || 0) / 100 : 0.18; // Default 18% GST
      return sum + (itemTotal * taxRate);
    }, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const comboDiscount = calculateComboDiscount();
    return Math.max(0, subtotal + tax - comboDiscount);
  };

  const calculateComboSavings = (combo) => {
    if (!combo) return 0;
    
    const cartTotal = calculateSubtotal();
    if (combo.discountType === 'percentage') {
      const discount = (cartTotal * combo.discountValue) / 100;
      return combo.maxDiscount ? Math.min(discount, combo.maxDiscount) : discount;
    } else if (combo.discountType === 'fixed') {
      return combo.discountValue;
    }
    return 0;
  };

  const applyCombo = (combo) => {
    if (!combo.isActive) {
      toast.error('This combo is not currently active');
      return;
    }
    
    // Check minimum products requirement
    const minProducts = combo.rules?.totalProducts?.min || 2;
    if (cart.length < minProducts) {
      toast.error(`Add at least ${minProducts} products to cart to use this combo`);
      return;
    }
    
    const comboProductIds = combo.applicableProducts || [];
    
    // If no specific products are required, combo applies to any cart
    if (comboProductIds.length === 0) {
      setSelectedCombo(combo);
      const savings = calculateComboSavings(combo);
      toast.success(`${combo.name} applied! Savings: ₹${savings.toFixed(0)}`);
      return;
    }
    
    // Check if cart contains any of the eligible products (not all)
    const hasEligibleProducts = comboProductIds.some(productObj => {
      const productId = typeof productObj === 'string' ? productObj : productObj._id;
      return cart.some(item => item._id === productId);
    });
    
    if (!hasEligibleProducts) {
      toast.error('Cart does not contain any eligible products for this combo');
      return;
    }
    
    setSelectedCombo(combo);
    const savings = calculateComboSavings(combo);
    toast.success(`${combo.name} applied! Savings: ₹${savings.toFixed(0)}`);
  };

  const removeCombo = () => {
    setSelectedCombo(null);
    toast.success('Combo removed');
  };

  const calculateComboDiscount = () => {
    if (selectedCombo) {
      return calculateComboSavings(selectedCombo);
    }
    return 0;
  };

  const proceedToPayment = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPayment(true);
  };

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const calculatedTotal = calculateTotal();
    if (paymentMethod === 'cash' && parseFloat(receivedAmount) < calculatedTotal) {
      toast.error('Insufficient cash received');
      return;
    }

    setProcessing(true);
    try {
      const paymentData = {
        cartItems: cart,
        paymentMethod: paymentMethod,
        amount: calculatedTotal,
        receivedAmount: paymentMethod === 'cash' ? parseFloat(receivedAmount) : calculatedTotal,
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email
        },
        combos: selectedCombo ? [{
          comboId: selectedCombo._id,
          comboName: selectedCombo.name,
          discount: calculateComboDiscount()
        }] : []
      };

      console.log('Processing payment with data:', paymentData);
      const result = await paymentService.processPayment(paymentData);
      
      if (result.success) {
        toast.success('Payment processed successfully!');
        
        const changeAmount = result.data.changeAmount || 0;
        if (changeAmount > 0) {
          toast.success(`Change: ₹${changeAmount.toFixed(2)}`);
        }
        
        // Set bill data for receipt
        setLastBill({
          billNumber: result.data.billNumber,
          transactionId: result.data.transactionId,
          date: new Date(),
          customer: customerInfo,
          items: cart,
          subtotal: calculateSubtotal(),
          tax: calculateTax(),
          discount: calculateComboDiscount(),
          total: calculatedTotal,
          paymentMethod,
          receivedAmount: paymentMethod === 'cash' ? parseFloat(receivedAmount) : calculatedTotal,
          change: changeAmount,
          combo: selectedCombo
        });
        
        // Reset everything
        setCart([]);
        setSelectedCombo(null);
        setCustomerInfo({ name: '', phone: '', email: '' });
        setPaymentMethod('cash');
        setReceivedAmount('');
        setShowPayment(false);
        setShowReceipt(true);
        
        // Focus back to barcode input
        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
        
      } else {
        toast.error(result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(
        error.response?.data?.message || 
        'Payment processing failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const newSale = () => {
    setShowReceipt(false);
    setLastBill(null);
    barcodeInputRef.current?.focus();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale System</h1>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
              <div className="text-xs text-gray-500">Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ₹{calculateTotal().toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Quick Scanner */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Barcode Scanner */}
                  <div className="relative">
                    <Barcode className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Scan barcode or enter product code..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={handleBarcodeInput}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      autoFocus
                    />
                  </div>
                  
                  {/* Product Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search products by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleProductSearch}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    />
                  </div>
                </div>
                
                {/* Category Filter */}
                <div className="mt-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Products Grid */}
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Products ({filteredProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 h-full overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProducts.map(product => (
                    <button
                      key={product._id}
                      onClick={() => addToCart(product)}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
                    >
                      <h4 className="font-medium text-sm text-gray-900 truncate">{product.name || 'Unknown Product'}</h4>
                      <p className="text-xs text-gray-600 truncate">{product.productCode || 'N/A'}</p>
                      <p className="text-lg font-bold text-green-600">₹{(product.pricing?.sellingPrice || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Stock: {product.inventory?.currentStock || 0}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - Cart & Checkout */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Customer Info */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Customer name (optional)"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="Phone number (optional)"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart Items ({cart.length})
            </h3>
            
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Cart is empty</p>
                <p className="text-sm">Scan or search products to add</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item._id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm text-gray-900">{item.name}</h4>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-8 h-8 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">₹{(item.price || 0).toLocaleString()} each</p>
                        <p className="font-semibold text-green-600">₹{((item.price || 0) * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="border-t border-gray-200 p-4">
            {/* Available Combos */}
            {cart.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Combos</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(() => {
                    const activeCombos = combos.filter(combo => combo.isActive);
                    if (activeCombos.length === 0) {
                      return (
                        <div className="text-sm text-gray-500 p-2 border border-gray-200 rounded">
                          No active combos available
                        </div>
                      );
                    }
                    
                    return activeCombos.slice(0, 3).map((combo) => {
                      const eligibleProducts = (combo.applicableProducts || []);
                      
                      // If no specific products are required, combo applies to any cart
                      let hasEligibleProducts = false;
                      
                      if (eligibleProducts.length === 0) {
                        // Universal combo - applies to any products
                        hasEligibleProducts = true;
                      } else {
                        // Check if cart contains any of the eligible products
                        hasEligibleProducts = eligibleProducts.some(eligibleProduct => {
                          const productId = typeof eligibleProduct === 'string' ? eligibleProduct : eligibleProduct._id;
                          return cart.some(item => item._id === productId);
                        });
                      }
                      
                      if (!hasEligibleProducts) return null;
                      
                      const estimatedSavings = calculateComboSavings(combo);
                      
                      return (
                        <div
                          key={combo._id}
                          className={`p-2 border rounded cursor-pointer transition-colors text-xs ${
                            selectedCombo?._id === combo._id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-300 hover:border-blue-500'
                          }`}
                          onClick={() => applyCombo(combo)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{combo.name}</p>
                              <p className="text-gray-600">
                                {combo.discountType === 'percentage' 
                                  ? `${combo.discountValue}% off` 
                                  : `₹${combo.discountValue} off`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">₹{estimatedSavings}</p>
                              <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }).filter(Boolean);
                  })()}
                </div>
              </div>
            )}
            
            {/* Applied Combo Display */}
            {selectedCombo && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-green-800">{selectedCombo.name}</p>
                    <p className="text-xs text-green-600">
                      {selectedCombo.discountType === 'percentage' 
                        ? `${selectedCombo.discountValue}% off` 
                        : `₹${selectedCombo.discountValue} off`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-medium text-sm">
                      -₹{calculateComboDiscount().toLocaleString()}
                    </span>
                    <button 
                      onClick={removeCombo}
                      className="text-red-500 hover:text-red-700 text-xs p-1"
                      title="Remove combo"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal().toLocaleString()}</span>
              </div>
              {selectedCombo && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Combo Discount:</span>
                  <span>-₹{calculateComboDiscount().toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>₹{calculateTax().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
            
            <button
              onClick={proceedToPayment}
              disabled={cart.length === 0}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-semibold"
            >
              <CreditCard className="h-5 w-5" />
              Proceed to Payment (₹{calculateTotal().toLocaleString()})
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Payment</h3>
              
              {/* Payment Method Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${
                      paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <Banknote className="h-5 w-5" />
                    <span className="text-xs">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${
                      paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-xs">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 border rounded-lg flex flex-col items-center gap-1 ${
                      paymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                    <span className="text-xs">UPI</span>
                  </button>
                </div>
              </div>

              {/* Amount Details */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>₹{calculateTotal().toLocaleString()}</span>
                </div>
              </div>

              {/* Cash Payment Input */}
              {paymentMethod === 'cash' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Received Amount</label>
                  <input
                    type="number"
                    placeholder="Enter received amount"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {receivedAmount && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Change: </span>
                      <span className="font-semibold text-green-600">
                        ₹{Math.max(0, parseFloat(receivedAmount) - calculateTotal()).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Complete Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6" id="receipt">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold">Your Store Name</h2>
                <p className="text-sm text-gray-600">123 Store Address, City</p>
                <p className="text-sm text-gray-600">Phone: +91 98765 43210</p>
                <div className="border-t border-b border-gray-300 py-2 my-3">
                  <p className="font-medium">SALES RECEIPT</p>
                  <p className="text-sm">#{lastBill.billNumber}</p>
                  <p className="text-sm">{lastBill.date.toLocaleString()}</p>
                </div>
              </div>

              {/* Customer Info */}
              {(lastBill.customer.name || lastBill.customer.phone) && (
                <div className="mb-4">
                  <h4 className="font-medium">Customer:</h4>
                  {lastBill.customer.name && <p className="text-sm">{lastBill.customer.name}</p>}
                  {lastBill.customer.phone && <p className="text-sm">{lastBill.customer.phone}</p>}
                </div>
              )}

              {/* Items */}
              <div className="mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Item</th>
                      <th className="text-center py-1">Qty</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastBill.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-1">
                          <div>{item.name}</div>
                          <div className="text-xs text-gray-500">@₹{item.price.toLocaleString()}</div>
                        </td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">₹{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{lastBill.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₹{lastBill.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹{lastBill.total.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="capitalize">{lastBill.paymentMethod}</span>
                  </div>
                  {lastBill.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between">
                        <span>Received:</span>
                        <span>₹{lastBill.receivedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Change:</span>
                        <span>₹{lastBill.change.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="text-center mt-6 text-sm text-gray-600">
                <p>Thank you for your business!</p>
                <p>Visit again soon</p>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={printReceipt}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Receipt className="h-4 w-4" />
                Print Receipt
              </button>
              <button
                onClick={newSale}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSBillingPage;