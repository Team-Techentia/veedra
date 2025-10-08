import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye,
  Package,
  ChevronDown,
  ChevronRight,
  Printer,
  CheckSquare,
  Square
} from 'lucide-react';
import productService from '../../services/productService';
import categoryService from '../../services/categoryService';
import vendorService from '../../services/vendorService';
import toast from 'react-hot-toast';

const ProductsPageEnhanced = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [expandedBundles, setExpandedBundles] = useState(new Set());
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData, vendorsData] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories(),
        vendorService.getVendors()
      ]);
      
      setProducts(productsData.data || productsData || []);
      setCategories(categoriesData.data || categoriesData || []);
      setVendors(vendorsData.data || vendorsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load products data');
    } finally {
      setLoading(false);
    }
  };

  // Group products into parent-child relationships
  const groupedProducts = () => {
    const parents = products.filter(p => p.type === 'parent' || p.type === 'standalone');
    const children = products.filter(p => p.type === 'child');
    
    return parents.map(parent => {
      const relatedChildren = children.filter(child => 
        child.parentProduct === parent._id || 
        (child.code && parent.code && child.code.startsWith(parent.code + '/'))
      );
      
      return {
        ...parent,
        children: relatedChildren,
        totalQuantity: (parent.inventory?.currentStock || 0) + 
                      relatedChildren.reduce((sum, child) => sum + (child.inventory?.currentStock || 0), 0)
      };
    });
  };

  // Filter products based on search and filters
  const filteredProducts = groupedProducts().filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category?._id === selectedCategory;
    const matchesVendor = selectedVendor === '' || product.vendor?._id === selectedVendor;
    
    return matchesSearch && matchesCategory && matchesVendor;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + rowsPerPage);

  const toggleBundle = (productId) => {
    const newExpanded = new Set(expandedBundles);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedBundles(newExpanded);
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const printSelected = () => {
    if (selectedProducts.size === 0) {
      toast.error('Please select products to print');
      return;
    }
    
    const selectedProductsArray = Array.from(selectedProducts);
    console.log('Printing products:', selectedProductsArray);
    toast.success(`Printing ${selectedProducts.size} product(s)`);
  };

  const printBarcode = (product) => {
    console.log('Printing barcode for:', product.code);
    toast.success(`Printing barcode for ${product.name}`);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        await loadData();
        toast.success('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const getProductAge = (dateStr) => {
    if (!dateStr) return '-';
    
    const createdDate = new Date(dateStr);
    const now = new Date();
    const diffTime = now - createdDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month';
    if (diffMonths < 12) return `${diffMonths} months`;
    
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? '1 year' : `${diffYears} years`;
  };

  const formatCurrency = (amount) => {
    return amount ? `₹${amount.toLocaleString()}` : '-';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Product List</h1>
          <p className="text-gray-600 mt-2">Manage your product inventory with parent-child relationships</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={printSelected}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Printer className="h-5 w-5" />
            <span>🖨️ Print Selected</span>
          </button>
          {(user.role === 'owner' || user.role === 'manager') && (
            <Link
              to="/products/add"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>➕ Add Product</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="🔍 Search by name or code"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL No.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">▼</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Factory</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Offer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discounted</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.map((product, index) => (
                  <React.Fragment key={product._id}>
                    {/* Parent Row */}
                    <tr className="hover:bg-gray-50 border-l-4 border-blue-400">
                      <td className="px-4 py-3 text-sm text-gray-900">{startIndex + index + 1}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleProductSelection(product._id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedProducts.has(product._id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {product.children.length > 0 && (
                          <button
                            onClick={() => toggleBundle(product._id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {expandedBundles.has(product._id) ? 
                              <span>➖</span> : <span>➕</span>
                            }
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.category?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.specifications?.size || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.specifications?.color || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.type === 'parent' ? 'bg-blue-100 text-blue-800' :
                          product.type === 'child' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {product.type || 'standalone'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getProductAge(product.createdAt)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {product.children.length > 0 ? 
                          `${1 + product.children.length} (${product.totalQuantity})` :
                          product.inventory?.currentStock || 0
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(product.pricing?.costPrice)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(product.pricing?.sellingPrice)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(product.pricing?.sellingPrice)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(product.pricing?.mrp)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => printBarcode(product)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Print Barcode"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <Link
                            to={`/products/${product._id}`}
                            className="text-green-600 hover:text-green-800"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          {(user.role === 'owner' || user.role === 'manager') && (
                            <>
                              <Link
                                to={`/products/${product._id}/edit`}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Edit Product"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteProduct(product._id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete Product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Child Rows */}
                    {expandedBundles.has(product._id) && product.children.map((child) => (
                      <tr key={child._id} className="bg-blue-50 border-l-4 border-green-400">
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleProductSelection(child._id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {selectedProducts.has(child._id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3"></td>
                        <td className="px-4 py-3 text-sm text-gray-600 pl-8">↳ {child.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{child.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{child.category?.name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{child.specifications?.size || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{child.specifications?.color || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            child
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {child.createdAt ? new Date(child.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{getProductAge(child.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{child.inventory?.currentStock || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(child.pricing?.costPrice)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(child.pricing?.sellingPrice)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(child.pricing?.sellingPrice)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(child.pricing?.mrp)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            child.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {child.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => printBarcode(child)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Print Barcode"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <Link
                              to={`/products/${child._id}`}
                              className="text-green-600 hover:text-green-800"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {(user.role === 'owner' || user.role === 'manager') && (
                              <>
                                <Link
                                  to={`/products/${child._id}/edit`}
                                  className="text-yellow-600 hover:text-yellow-800"
                                  title="Edit Product"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => handleDeleteProduct(child._id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* No products message */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">
                {products.length === 0 
                  ? "Get started by adding your first product."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === i + 1 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsPageEnhanced;