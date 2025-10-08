import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Package, 
  DollarSign,
  Calculator,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import comboService from '../../services/comboService';

const CreateComboPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });
  
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [priceSlots, setPriceSlots] = useState([
    { quantity: 1, price: 0, savings: 0 }
  ]);
  
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Load products from API
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setAvailableProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const calculateBasePrice = () => {
    return selectedProducts.reduce((total, product) => {
      const price = product.pricing?.sellingPrice || product.sellingPrice || 0;
      const quantity = product.quantity || 1;
      return total + (price * quantity);
    }, 0);
  };

  const updatePriceSlot = (index, field, value) => {
    const newSlots = [...priceSlots];
    const numValue = parseFloat(value);
    newSlots[index][field] = isNaN(numValue) ? 0 : numValue;
    
    // Calculate savings
    if (field === 'price') {
      const basePrice = calculateBasePrice();
      const quantity = newSlots[index].quantity || 1;
      const totalBasePrice = basePrice * quantity;
      const currentPrice = newSlots[index].price || 0;
      newSlots[index].savings = Math.max(0, totalBasePrice - currentPrice);
    }
    
    setPriceSlots(newSlots);
  };

  const addPriceSlot = () => {
    const lastSlot = priceSlots[priceSlots.length - 1] || { quantity: 0 };
    const newQuantity = (lastSlot.quantity || 0) + 1;
    const basePrice = calculateBasePrice() || 0;
    
    setPriceSlots([...priceSlots, {
      quantity: newQuantity,
      price: basePrice * newQuantity,
      savings: 0
    }]);
  };

  const removePriceSlot = (index) => {
    if (priceSlots.length > 1) {
      setPriceSlots(priceSlots.filter((_, i) => i !== index));
    }
  };

  const addProduct = (product) => {
    const existingProduct = selectedProducts.find(p => p._id === product._id);
    
    if (existingProduct) {
      setSelectedProducts(prev => prev.map(p => 
        p._id === product._id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }]);
    }
    
    // Recalculate price slots
    const basePrice = calculateBasePrice();
    setPriceSlots(prev => prev.map(slot => ({
      ...slot,
      price: basePrice * slot.quantity,
      savings: Math.max(0, (basePrice * slot.quantity) - slot.price)
    })));
    
    setShowProductSelector(false);
  };

  const removeProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p._id !== productId));
  };

  const updateProductQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeProduct(productId);
      return;
    }
    
    setSelectedProducts(prev => prev.map(p => 
      p._id === productId ? { ...p, quantity } : p
    ));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Combo name is required');
      return false;
    }
    
    if (selectedProducts.length === 0) {
      toast.error('At least one product must be selected');
      return false;
    }
    
    if (priceSlots.length === 0) {
      toast.error('At least one price slot is required');
      return false;
    }
    
    // Validate price slots
    for (let i = 0; i < priceSlots.length; i++) {
      const slot = priceSlots[i];
      if (slot.quantity <= 0) {
        toast.error(`Price slot ${i + 1}: Quantity must be greater than 0`);
        return false;
      }
      if (slot.price <= 0) {
        toast.error(`Price slot ${i + 1}: Price must be greater than 0`);
        return false;
      }
    }
    
    // Check for duplicate quantities
    const quantities = priceSlots.map(slot => slot.quantity);
    const uniqueQuantities = [...new Set(quantities)];
    if (quantities.length !== uniqueQuantities.length) {
      toast.error('Price slots cannot have duplicate quantities');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const comboData = {
        ...formData,
        products: selectedProducts.map(p => ({
          product: p._id,
          quantity: p.quantity
        })),
        priceSlots: priceSlots.sort((a, b) => a.quantity - b.quantity),
        createdBy: user._id
      };
      
      // Create combo using API
      await comboService.createCombo(comboData);
      
      toast.success('Combo created successfully!');
      navigate('/combos');
      
    } catch (error) {
      console.error('Error creating combo:', error);
      toast.error('Failed to create combo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const basePrice = calculateBasePrice();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/combos')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Combos
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Combo</h1>
          <p className="text-gray-600 mt-2">Set up a new combo offer with multiple products</p>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Combo Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter combo name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter combo description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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
                    Combo is active
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Selected Products */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Selected Products</CardTitle>
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(true)}
                    className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Product
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No products selected</p>
                    <button
                      type="button"
                      onClick={() => setShowProductSelector(true)}
                      className="mt-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Add your first product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map((product) => (
                      <div key={product._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500">₹{product.sellingPrice} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => updateProductQuantity(product._id, parseInt(e.target.value) || 0)}
                            min="1"
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                          <button
                            type="button"
                            onClick={() => removeProduct(product._id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedProducts.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Base Price per combo:</span>
                      <span className="text-lg font-bold text-blue-600">₹{basePrice}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Slots */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Price Slots
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Set different prices for different quantities
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addPriceSlot}
                    className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Slot
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priceSlots.map((slot, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-3 border border-gray-200 rounded-lg">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={slot.quantity}
                          onChange={(e) => updatePriceSlot(index, 'quantity', e.target.value)}
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          value={slot.price}
                          onChange={(e) => updatePriceSlot(index, 'price', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Savings (₹)
                        </label>
                        <input
                          type="number"
                          value={slot.savings}
                          readOnly
                          className="w-full px-2 py-1 bg-gray-100 border border-gray-300 rounded"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        {priceSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePriceSlot(index)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {basePrice > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Calculator className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-800">
                        Base price calculation: ₹{basePrice} × quantity = total price
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Combo Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Products</h4>
                  <div className="space-y-1">
                    {selectedProducts.map((product) => (
                      <p key={product._id} className="text-sm text-gray-600">
                        • {product.name} (x{product.quantity})
                      </p>
                    ))}
                    {selectedProducts.length === 0 && (
                      <p className="text-sm text-gray-500 italic">No products selected</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Price Slots</h4>
                  <div className="space-y-1">
                    {priceSlots.map((slot, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {slot.quantity} combo{slot.quantity > 1 ? 's' : ''}: ₹{slot.price}
                        {slot.savings > 0 && (
                          <span className="text-green-600 ml-1">(Save ₹{slot.savings})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedProducts.length > 0 && basePrice > 0 && (
                  <div className="pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="text-xl font-bold text-blue-600">₹{basePrice}</p>
                      <p className="text-xs text-gray-500 mt-1">per combo unit</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => navigate('/combos')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || selectedProducts.length === 0}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Combo...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Combo
              </>
            )}
          </button>
        </div>
      </form>

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Select Products</h3>
                <button
                  onClick={() => setShowProductSelector(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-80">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableProducts
                  .filter(product => !selectedProducts.find(p => p._id === product._id))
                  .map((product) => (
                    <div
                      key={product._id}
                      onClick={() => addProduct(product)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-500">₹{product.sellingPrice}</p>
                      <p className="text-xs text-gray-400">Stock: {product.currentStock}</p>
                    </div>
                  ))}
              </div>
              {availableProducts.filter(product => !selectedProducts.find(p => p._id === product._id)).length === 0 && (
                <p className="text-center text-gray-500 py-8">All products are already selected</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateComboPage;