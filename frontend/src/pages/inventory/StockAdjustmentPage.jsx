import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Plus, Minus, Search, Package, History, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';
import inventoryService from '../../services/inventoryService';

const StockAdjustmentPage = () => {
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'add',
    quantity: '',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, adjustmentsData] = await Promise.all([
        productService.getProducts(),
        inventoryService.getStockAdjustments()
      ]);
      
      setProducts(productsData);
      setAdjustments(adjustmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAdjustment = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }
    
    if (!adjustmentData.quantity || !adjustmentData.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    const quantity = parseInt(adjustmentData.quantity);
    const adjustmentValue = adjustmentData.type === 'add' ? quantity : -quantity;

    try {
      await inventoryService.adjustStock(selectedProduct._id, {
        quantity: adjustmentValue,
        reason: adjustmentData.reason,
        notes: adjustmentData.notes,
        type: 'adjustment'
      });

      toast.success('Stock adjustment completed successfully');
      
      // Reload data to get updated information
      await loadData();
      
      // Reset form
      setSelectedProduct(null);
      setAdjustmentData({
        type: 'add',
        quantity: '',
        reason: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting adjustment:', error);
      toast.error('Failed to process stock adjustment');
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAdjustments = adjustments.length;
  const additionsCount = adjustments.filter(adj => adj.type === 'add').length;
  const removalsCount = adjustments.filter(adj => adj.type === 'remove').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Adjustment</h1>
          <p className="text-gray-600 mt-2">Adjust inventory levels and track changes</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <History className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalAdjustments}</p>
                <p className="text-gray-600">Total Adjustments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{additionsCount}</p>
                <p className="text-gray-600">Stock Additions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{removalsCount}</p>
                <p className="text-gray-600">Stock Removals</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adjustment Form */}
        <Card>
          <CardHeader>
            <CardTitle>New Stock Adjustment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitAdjustment} className="space-y-4">
              {/* Product Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Product
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Product Selection */}
              {searchTerm && (
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredProducts.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product);
                        setSearchTerm('');
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.productCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Stock: {product.currentStock}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Product */}
              {selectedProduct && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedProduct.name}</p>
                      <p className="text-sm text-gray-600">{selectedProduct.productCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-lg font-bold">{selectedProduct.currentStock}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="add"
                      checked={adjustmentData.type === 'add'}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Plus className="h-4 w-4 ml-2 mr-1 text-green-600" />
                    <span className="text-sm">Add Stock</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value="remove"
                      checked={adjustmentData.type === 'remove'}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <Minus className="h-4 w-4 ml-2 mr-1 text-red-600" />
                    <span className="text-sm">Remove Stock</span>
                  </label>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter quantity"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason *
                </label>
                <select
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select reason...</option>
                  <option value="New stock received">New stock received</option>
                  <option value="Damaged items">Damaged items</option>
                  <option value="Theft/Loss">Theft/Loss</option>
                  <option value="Initial stock">Initial stock</option>
                  <option value="Return from customer">Return from customer</option>
                  <option value="Correction">Stock count correction</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes (optional)"
                />
              </div>

              {/* Preview */}
              {selectedProduct && adjustmentData.quantity && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Preview:</p>
                  <p className="text-sm">
                    <span className="font-medium">{selectedProduct.currentStock}</span>
                    <span className={`mx-2 ${adjustmentData.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                      {adjustmentData.type === 'add' ? '+' : '-'}{adjustmentData.quantity}
                    </span>
                    = 
                    <span className="ml-2 font-bold">
                      {adjustmentData.type === 'add' 
                        ? selectedProduct.currentStock + parseInt(adjustmentData.quantity || 0)
                        : selectedProduct.currentStock - parseInt(adjustmentData.quantity || 0)
                      }
                    </span>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!selectedProduct || !adjustmentData.quantity || !adjustmentData.reason}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit Adjustment
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Adjustments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {adjustments.map((adjustment) => (
                <div key={adjustment._id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{adjustment.productName}</p>
                      <p className="text-sm text-gray-600">{adjustment.reason}</p>
                    </div>
                    <div className={`flex items-center text-sm font-medium ${
                      adjustment.type === 'add' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {adjustment.type === 'add' ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {adjustment.type === 'add' ? '+' : '-'}{adjustment.quantity}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{adjustment.oldStock} → {adjustment.newStock}</span>
                    <span>{new Date(adjustment.adjustedAt).toLocaleDateString()}</span>
                  </div>
                  
                  {adjustment.notes && (
                    <p className="text-xs text-gray-500 mt-1">{adjustment.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StockAdjustmentPage;