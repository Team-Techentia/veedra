import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Package, Grid, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import categoryService from '../../services/categoryService';
import productService from '../../services/productService';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [subFormData, setSubFormData] = useState({
    name: '',
    code: ''
  });
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [parentCategorySelect, setParentCategorySelect] = useState('');
  const [subCategoryName, setSubCategoryName] = useState('');
  const [subCategoryCode, setSubCategoryCode] = useState('');
  const [manageCategorySelect, setManageCategorySelect] = useState('');
  
  // Table view states
  const [tableView, setTableView] = useState('categories'); // 'categories', 'subcategories', 'products'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubcategory, setCurrentSubcategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [newSubCategoryInput, setNewSubCategoryInput] = useState('');
  const [newSubCategoryCode, setNewSubCategoryCode] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all categories and subcategories
      const categoriesResponse = await categoryService.getCategories();
      const allCategories = categoriesResponse.data || categoriesResponse;
      
      // Separate main categories (no parent) and subcategories (have parent)
      const mainCategories = allCategories.filter(cat => !cat.parent || cat.parent === null);
      const subCategories = allCategories.filter(cat => cat.parent && cat.parent !== null);
      
      setCategories(mainCategories);
      setSubcategories(subCategories);
      
      // Fetch products
      const productsResponse = await productService.getProducts();
      setProducts(productsResponse.data || productsResponse);
      
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add Category
  const handleAddCategory = async () => {
    if (!categoryName.trim() || !categoryCode.trim()) {
      toast.error('Please fill all category fields');
      return;
    }

    const code = categoryCode.trim().toUpperCase();
    
    if (categories.some(c => 
      c.name.toLowerCase() === categoryName.toLowerCase() || 
      c.code === code
    )) {
      toast.error('Category already exists');
      return;
    }

    try {
      await categoryService.createCategory({
        name: categoryName,
        code: code
      });
      
      setCategoryName('');
      setCategoryCode('');
      toast.success('✅ Category added');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add category');
      console.error('Error adding category:', error);
    }
  };

  // Add Subcategory
  const handleAddSubcategory = async () => {
    if (!parentCategorySelect || !subCategoryName.trim() || !subCategoryCode.trim()) {
      toast.error('Select a category and enter both name and code');
      return;
    }

    if (subcategories.some(s => {
      const parentId = typeof s.parent === 'object' ? s.parent._id : s.parent;
      return parentId === parentCategorySelect && 
        (s.name.toLowerCase() === subCategoryName.toLowerCase() || s.code === subCategoryCode);
    })) {
      toast.error('Subcategory name or code already exists');
      return;
    }

    try {
      await categoryService.createCategory({
        name: subCategoryName,
        code: subCategoryCode,
        parent: parentCategorySelect
      });
      
      setSubCategoryName('');
      setSubCategoryCode('');
      toast.success('✅ Subcategory added');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add subcategory');
      console.error('Error adding subcategory:', error);
    }
  };

  // Edit Category
  const handleEditCategory = () => {
    if (!manageCategorySelect) {
      toast.error('Please select a category to edit');
      return;
    }
    
    const category = categories.find(c => c._id === manageCategorySelect);
    if (!category) return;
    
    setEditTarget(category);
    setEditName(category.name);
    setEditCode(category.code || '');
    setShowEditModal(true);
  };

  // Delete Category
  const handleDeleteCategory = async () => {
    if (!manageCategorySelect) {
      toast.error('Please select a category to delete');
      return;
    }
    
    if (!window.confirm('Delete this category and all linked data?')) return;

    try {
      await categoryService.deleteCategory(manageCategorySelect);
      toast.success('🗑️ Category deleted');
      setManageCategorySelect('');
      fetchAllData();
      setTableView('categories');
    } catch (error) {
      toast.error('Failed to delete category');
      console.error('Error deleting category:', error);
    }
  };

  // Save category edits
  const handleSaveEdit = async () => {
    if (!editTarget || !editName.trim() || !editCode.trim()) {
      toast.error('Fill all fields');
      return;
    }

    const newCode = editCode.trim().toUpperCase();
    
    if (categories.some(c => 
      c._id !== editTarget._id && 
      (c.name.toLowerCase() === editName.toLowerCase() || c.code === newCode)
    )) {
      toast.error('Category name/code already exists');
      return;
    }

    try {
      await categoryService.updateCategory(editTarget._id, {
        name: editName,
        code: newCode
      });
      
      setShowEditModal(false);
      setEditTarget(null);
      toast.success('✅ Category updated');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to update category');
      console.error('Error updating category:', error);
    }
  };

  // Add subcategory in modal
  const handleAddSubcategoryInModal = async () => {
    if (!editTarget || !newSubCategoryInput.trim() || !newSubCategoryCode.trim()) {
      toast.error('Enter both subcategory name and code');
      return;
    }

    if (subcategories.some(s => {
      const parentId = typeof s.parent === 'object' ? s.parent._id : s.parent;
      return parentId === editTarget._id && 
        (s.name.toLowerCase() === newSubCategoryInput.toLowerCase() || s.code === newSubCategoryCode);
    })) {
      toast.error('Subcategory name or code already exists in this category');
      return;
    }

    try {
      await categoryService.createCategory({
        name: newSubCategoryInput,
        code: newSubCategoryCode,
        parent: editTarget._id
      });
      
      setNewSubCategoryInput('');
      setNewSubCategoryCode('');
      toast.success('✅ Subcategory added');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add subcategory');
      console.error('Error adding subcategory:', error);
    }
  };

  // Remove subcategory
  const handleRemoveSubcategory = async (subcategoryId) => {
    if (!window.confirm('Remove this subcategory?')) return;

    try {
      await categoryService.deleteCategory(subcategoryId);
      toast.success('🗑️ Subcategory removed');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to remove subcategory');
      console.error('Error removing subcategory:', error);
    }
  };

  // Table row clicks for drill-down
  const handleRowClick = (type, data) => {
    if (type === 'category') {
      setCurrentCategory(data);
      setTableView('subcategories');
    } else if (type === 'subcategory') {
      setCurrentSubcategory(data.name);
      setTableView('products');
    }
  };

  // Filter data based on search term - only show main categories (no parent)
  const getFilteredCategories = () => {
    return categories.filter(c =>
      !c.parent && // Only show main categories (no parent)
      (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())))
    );
  };

  const getFilteredSubcategories = () => {
    if (!currentCategory) return [];
    return subcategories.filter(s => {
      const parentId = typeof s.parent === 'object' ? s.parent._id : s.parent;
      return parentId === currentCategory._id &&
        s.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const getFilteredProducts = () => {
    if (!currentCategory || !currentSubcategory) return [];
    return products.filter(p => {
      const matchesCategory = p.category === currentCategory._id;
      const matchesSubcategory = p.subcategory === currentSubcategory;
      return matchesCategory && matchesSubcategory;
    });
  };

  // Render table based on current view
  const renderTable = () => {
    if (tableView === 'categories') {
      const filtered = getFilteredCategories();
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length > 0 ? (
                filtered.map((category) => (
                  <tr 
                    key={category._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick('category', category)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{category.name}</span>
                        {category.code && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {category.code}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    } else if (tableView === 'subcategories') {
      const filtered = getFilteredSubcategories();
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategories of {currentCategory?.name}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length > 0 ? (
                filtered.map((subcategory) => (
                  <tr 
                    key={subcategory._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRowClick('subcategory', subcategory)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{subcategory.name}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                    No subcategories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    } else if (tableView === 'products') {
      const filtered = getFilteredProducts();
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subcategory</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length > 0 ? (
                filtered.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.productCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currentCategory?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {currentSubcategory}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">📂 Category Management</h1>

      {/* Forms Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Category Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">➕ Create Category</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Category Code"
              value={categoryCode}
              onChange={(e) => setCategoryCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddCategory}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Category
            </button>
          </div>
        </div>

        {/* Create Subcategory Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📑 Create Subcategory</h2>
          <div className="space-y-4">
            <select
              value={parentCategorySelect}
              onChange={(e) => setParentCategorySelect(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select Category --</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Subcategory Name"
              value={subCategoryName}
              onChange={(e) => setSubCategoryName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Subcategory Code"
              value={subCategoryCode}
              onChange={(e) => setSubCategoryCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddSubcategory}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Subcategory
            </button>
          </div>
        </div>
      </div>

      {/* Manage Categories */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">⚙️ Manage Categories</h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={manageCategorySelect}
            onChange={(e) => setManageCategorySelect(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select Category --</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name} ({category.code || 'No Code'})
              </option>
            ))}
          </select>
          <button
            onClick={handleEditCategory}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleDeleteCategory}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories or subcategories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {tableView !== 'categories' && (
            <button
              onClick={() => {
                setTableView('categories');
                setCurrentCategory(null);
                setCurrentSubcategory('');
                setSearchTerm('');
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Categories
            </button>
          )}
        </div>
      </div>

      {/* Drill-down Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            📦 Categories → Subcategories → Products
          </h2>
        </div>
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Edit Category</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Code
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <hr className="my-4" />

                <h4 className="text-lg font-medium">Subcategories</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {subcategories
                    .filter(s => {
                      const parentId = typeof s.parent === 'object' && s.parent ? s.parent._id : s.parent;
                      return parentId === editTarget._id;
                    })
                    .map((subcategory) => (
                      <div key={subcategory._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>{subcategory.name}</span>
                        <button
                          onClick={() => handleRemoveSubcategory(subcategory._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  {subcategories.filter(s => {
                    const parentId = typeof s.parent === 'object' && s.parent ? s.parent._id : s.parent;
                    return parentId === editTarget._id;
                  }).length === 0 && (
                    <div className="text-gray-500 italic p-3">No subcategories</div>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="New Subcategory Name"
                    value={newSubCategoryInput}
                    onChange={(e) => setNewSubCategoryInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="New Subcategory Code"
                    value={newSubCategoryCode}
                    onChange={(e) => setNewSubCategoryCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddSubcategoryInModal}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Subcategory
                  </button>
                </div>

                <hr className="my-4" />

                <button
                  onClick={handleSaveEdit}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;