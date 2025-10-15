import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Package, AlertTriangle, Plus, Minus, Eye, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import inventoryService from '../../services/inventoryService';
import toast from 'react-hot-toast';

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Detail view state
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      console.log('Loading inventory data...');
      const response = await inventoryService.getInventory();
      console.log('Inventory response:', response);
      
      // Handle the backend response structure
      const inventoryData = response.data || response;
      console.log('Inventory data loaded:', inventoryData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading inventory:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleStockAdjustment = async () => {
    if (!adjustmentQuantity) {
      toast.error('Please enter adjustment quantity');
      return;
    }

    const quantity = parseInt(adjustmentQuantity);
    const adjustmentValue = adjustmentType === 'add' ? quantity : -quantity;

    try {
      const response = await inventoryService.adjustStock({
        productId: selectedItem._id,
        adjustment: adjustmentValue,
        reason: adjustmentReason || `${adjustmentType === 'add' ? 'Stock addition' : 'Stock removal'} - ${new Date().toLocaleDateString()}`,
        type: 'adjustment'
      });

      // Reload inventory to get updated data
      await loadInventory();
      
      toast.success(`Stock ${adjustmentType === 'add' ? 'added' : 'removed'} successfully`);
      setShowAdjustment(false);
      setAdjustmentQuantity('');
      setAdjustmentReason('');
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    }
  };

  // Helper function to determine stock status
  const getStockStatus = (item) => {
    const currentStock = item.inventory?.currentStock || 0;
    const minStock = item.inventory?.minStockLevel || 0;
    
    if (currentStock === 0) return 'out_of_stock';
    if (currentStock <= minStock) return 'low_stock';
    return 'in_stock';
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && getStockStatus(item) === filterType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredInventory.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalItems = inventory.length;
  const inStock = inventory.filter(item => getStockStatus(item) === 'in_stock').length;
  const lowStock = inventory.filter(item => getStockStatus(item) === 'low_stock').length;
  const outOfStock = inventory.filter(item => getStockStatus(item) === 'out_of_stock').length;

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
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage stock levels</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{totalItems}</p>
                <p className="text-gray-600">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{inStock}</p>
                <p className="text-gray-600">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{lowStock}</p>
                <p className="text-gray-600">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{outOfStock}</p>
                <p className="text-gray-600">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Items</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min/Max Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.category?.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.inventory?.currentStock || 0}</div>
                      <div className="text-xs text-gray-500">
                        Last updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Invalid Date'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.inventory?.minStockLevel || 0} / {item.inventory?.maxStockLevel || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">Main Store</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getStatusColor(getStockStatus(item))
                      }`}>
                        {getStockStatus(item).replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setAdjustmentType('add');
                          setShowAdjustment(true);
                        }}
                        className="text-green-600 hover:text-green-900 p-1"
                        title="Add Stock"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setAdjustmentType('remove');
                          setShowAdjustment(true);
                        }}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Remove Stock"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredInventory.length)}</span> of{' '}
                    <span className="font-medium">{filteredInventory.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Modal */}
      {showAdjustment && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'} - {selectedItem.name}
                </h3>
                <button
                  onClick={() => setShowAdjustment(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Stock: {selectedItem.inventory?.currentStock || 0}
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity to {adjustmentType}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter quantity"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter reason for adjustment (optional)"
                  />
                </div>
                
                {adjustmentQuantity && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      New Stock Level: {adjustmentType === 'add' 
                        ? (selectedItem.inventory?.currentStock || 0) + parseInt(adjustmentQuantity || 0)
                        : (selectedItem.inventory?.currentStock || 0) - parseInt(adjustmentQuantity || 0)
                      }
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowAdjustment(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStockAdjustment}
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    adjustmentType === 'add' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Product Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <p className="text-sm text-gray-900">{selectedItem.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                    <p className="text-sm text-gray-900">{selectedItem.code}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-sm text-gray-900">{selectedItem.category?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                    <p className="text-sm text-gray-900">{selectedItem.vendor?.name || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
                    <p className="text-sm font-semibold text-gray-900">{selectedItem.inventory?.currentStock || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
                    <p className="text-sm text-gray-900">{selectedItem.inventory?.minStockLevel || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock Level</label>
                    <p className="text-sm text-gray-900">{selectedItem.inventory?.maxStockLevel || 0}</p>
                  </div>
                </div>
                
                {selectedItem.pricing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Information</label>
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg">
                      {selectedItem.pricing.factoryPrice && (
                        <div>
                          <span className="text-xs text-gray-500">Factory Price</span>
                          <p className="text-sm font-medium">₹{selectedItem.pricing.factoryPrice}</p>
                        </div>
                      )}
                      {selectedItem.pricing.offerPrice && (
                        <div>
                          <span className="text-xs text-gray-500">Offer Price</span>
                          <p className="text-sm font-medium">₹{selectedItem.pricing.offerPrice}</p>
                        </div>
                      )}
                      {selectedItem.pricing.mrp && (
                        <div>
                          <span className="text-xs text-gray-500">MRP</span>
                          <p className="text-sm font-medium">₹{selectedItem.pricing.mrp}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getStatusColor(getStockStatus(selectedItem))
                  }`}>
                    {getStockStatus(selectedItem).replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {selectedItem.updatedAt ? new Date(selectedItem.updatedAt).toLocaleString() : 'Invalid Date'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setAdjustmentType('add');
                    setShowAdjustment(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Adjust Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
