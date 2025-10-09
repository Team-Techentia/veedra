import api from './api'

const categoryService = {
  // Get all categories
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  // Get category tree
  getCategoryTree: async () => {
    const response = await api.get('/categories/tree')
    return response.data
  },

  // Get subcategories by parent category
  getSubcategories: async (parentId) => {
    const response = await api.get(`/categories/${parentId}/subcategories`)
    return response.data
  },

  // Get category by ID
  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}`)
    return response.data
  },

  // Create category
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData)
    return response.data
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData)
    return response.data
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`)
    return response.data
  }
}

export default categoryService