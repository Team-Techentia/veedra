const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).populate('parent');
  
  res.json({
    status: 'success',
    count: categories.length,
    data: categories
  });
});

// @desc    Get category tree
// @route   GET /api/categories/tree
// @access  Private
const getCategoryTree = asyncHandler(async (req, res) => {
  const categoryTree = await Category.getCategoryTree();
  
  res.json({
    status: 'success',
    data: categoryTree
  });
});

// @desc    Get subcategories by parent category
// @route   GET /api/categories/:parentId/subcategories
// @access  Private
const getSubcategories = asyncHandler(async (req, res) => {
  const { parentId } = req.params;
  
  const subcategories = await Category.find({ 
    parent: parentId, 
    isActive: true 
  }).sort({ sortOrder: 1, name: 1 });
  
  res.json({
    status: 'success',
    count: subcategories.length,
    data: subcategories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate('parent')
    .populate('subcategories');
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  res.json({
    status: 'success',
    data: category
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Manager
const createCategory = asyncHandler(async (req, res) => {
  const categoryData = {
    ...req.body,
    createdBy: req.user.id
  };
  
  // Set level based on parent
  if (categoryData.parent) {
    const parentCategory = await Category.findById(categoryData.parent);
    if (parentCategory) {
      categoryData.level = parentCategory.level + 1;
    }
  }
  
  const category = await Category.create(categoryData);
  
  res.status(201).json({
    status: 'success',
    data: category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Manager
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.json({
    status: 'success',
    data: updatedCategory
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Manager
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  
  // Check if category has products
  if (category.productCount > 0) {
    res.status(400);
    throw new Error('Cannot delete category with products');
  }
  
  category.isActive = false;
  await category.save();
  
  res.json({
    status: 'success',
    message: 'Category deleted successfully'
  });
});

module.exports = {
  getCategories,
  getCategoryTree,
  getSubcategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};