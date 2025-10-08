import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, ChevronRight, ChevronDown, Printer, Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../../services/productService';

const ViewProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [parentProducts, setParentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBundles, setExpandedBundles] = useState(new Set());
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('Loading products...');
      const response = await productService.getProducts();
      console.log('API Response:', response);
      const allProducts = response.data || response || [];
      console.log('All Products Length:', allProducts.length);
      
      if (allProducts.length === 0) {
        console.log('No products found in API response');
      }
      
      // Separate parent and child products
      const parents = allProducts.filter(p => p.type === 'parent' || p.type === 'standalone');
      const children = allProducts.filter(p => p.type === 'child');
      
      // Find orphaned children (children without a parent in the dataset)
      const parentIds = new Set(parents.map(p => p._id));
      const orphanedChildren = children.filter(child => !child.parentProduct || !parentIds.has(child.parentProduct));
      
      console.log('Parents:', parents.length, 'Children:', children.length, 'Orphaned:', orphanedChildren.length);
      
      // Group children by parent
      const childrenByParent = {};
      children.forEach(child => {
        const parentId = child.parentProduct;
        if (parentId && parentIds.has(parentId)) {
          if (!childrenByParent[parentId]) {
            childrenByParent[parentId] = [];
          }
          childrenByParent[parentId].push(child);
        }
      });

      // Add children to parent products
      const enrichedParents = parents.map(parent => ({
        ...parent,
        children: childrenByParent[parent._id] || []
      }));

      // Add orphaned children as standalone products for display
      const orphanedAsStandalone = orphanedChildren.map(child => ({
        ...child,
        type: 'standalone', // Treat as standalone for display
        children: [],
        isOrphaned: true // Flag to show it's an orphaned child
      }));

      const allDisplayProducts = [...enrichedParents, ...orphanedAsStandalone];

      setProducts(allProducts);
      setParentProducts(allDisplayProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = parentProducts.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Parent Products:', parentProducts);
  console.log('Search Term:', searchTerm);
  console.log('Filtered Products:', filteredProducts);

  const toggleBundle = (productId) => {
    const newExpanded = new Set(expandedBundles);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedBundles(newExpanded);
  };

  const toggleSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleDeleteProduct = async (productId, isParent = false) => {
    try {
      const productToDelete = products.find(p => p._id === productId);
      if (!productToDelete) {
        toast.error('Product not found');
        return;
      }

      const confirmMessage = isParent && productToDelete.children?.length > 0
        ? `Are you sure you want to delete "${productToDelete.name}" and all its ${productToDelete.children.length} child products?`
        : `Are you sure you want to delete "${productToDelete.name}"?`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      setLoading(true);
      await productService.deleteProduct(productId);
      
      toast.success('Product deleted successfully');
      await loadProducts(); // Reload the products list
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: products.length,
    parents: parentProducts.filter(p => p.type === 'parent').length,
    children: products.filter(p => p.type === 'child').length,
    orphaned: parentProducts.filter(p => p.isOrphaned).length,
    standalone: parentProducts.filter(p => p.type === 'standalone' && !p.isOrphaned).length
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { text: 'Out of Stock', class: 'text-red-600 bg-red-100' };
    if (stock <= 10) return { text: 'Low Stock', class: 'text-yellow-600 bg-yellow-100' };
    return { text: 'In Stock', class: 'text-green-600 bg-green-100' };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN');
  };

  const getProductAge = (createdAt) => {
    const days = Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              📋 Product List
            </h1>
            <p className="text-gray-600 mt-1">Manage your product inventory with bundle hierarchy</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={loadProducts}
            className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => {/* Print logic */}}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Selected ({selectedProducts.size})
          </button>
          <button
            onClick={() => navigate('/products/add')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="🔍 Search by name or code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">{stats.total}</div>
              <div className="text-gray-500">Total Products</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">{stats.parents}</div>
              <div className="text-gray-500">Bundles</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">{stats.children}</div>
              <div className="text-gray-500">Children</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-orange-600">{stats.orphaned}</div>
              <div className="text-gray-500">Orphaned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <React.Fragment key={product._id}>
                  {/* Parent Product Row */}
                  <tr className={`hover:bg-gray-50 ${product.children?.length > 0 ? 'bg-blue-25' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.children?.length > 0 && (
                          <button
                            onClick={() => toggleBundle(product._id)}
                            className="mr-2 p-1 hover:bg-gray-200 rounded"
                          >
                            {expandedBundles.has(product._id) ? (
                              <ChevronDown className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-blue-600" />
                            )}
                          </button>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                            {product.isOrphaned && (
                              <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                Orphaned Child
                              </span>
                            )}
                            {product.children?.length > 0 && (
                              <span className="ml-2 text-xs text-blue-600">
                                Bundle ({product.children.length} items)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.category?.name || 'Electronics'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.specifications?.size || 'S'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.specifications?.color || 'Red'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.isOrphaned
                          ? 'bg-orange-100 text-orange-800'
                          : product.type === 'parent' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {product.isOrphaned ? 'Orphaned' : product.type === 'parent' ? 'Bundle' : 'Single'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getProductAge(product.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatus(product.inventory?.currentStock || 0).class}`}>
                        {product.inventory?.currentStock || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{product.pricing?.costPrice || 200}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => navigate(`/products/edit/${product._id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id, true)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Child Products Rows */}
                  {expandedBundles.has(product._id) && product.children?.map((child) => (
                    <tr key={child._id} className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center pl-8">
                          <div className="text-sm text-gray-700">
                            {child.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {child.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {child.category?.name || 'Electronics'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {child.specifications?.size || 'Standard'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {child.specifications?.color || 'Default'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          Child
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(child.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {getProductAge(child.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStockStatus(child.inventory?.currentStock || 0).class}`}>
                          {child.inventory?.currentStock || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{child.pricing?.costPrice || 200}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => navigate(`/products/edit/${child._id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(child._id, false)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new product.'}
            </p>
            <div className="mt-4 text-xs text-gray-400">
              <p>Debug Info:</p>
              <p>Total products in state: {products.length}</p>
              <p>Parent products: {parentProducts.length}</p>
              <p>Search term: "{searchTerm}"</p>
              <p>Filtered products: {filteredProducts.length}</p>
            </div>
            {!searchTerm && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/products/add')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewProductsPage;