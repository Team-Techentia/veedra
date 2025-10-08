import api from './api'

const productService = {
  // Get all products
  getProducts: async (params = {}) => {
    // Add cache busting
    const cacheParams = {
      ...params,
      _t: Date.now()
    };
    const response = await api.get('/products', { params: cacheParams })
    return response.data
  },

  // Get product by ID
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  // Create product
  createProduct: async (productData) => {
    const response = await api.post('/products', productData)
    return response.data
  },

  // Update product
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData)
    return response.data
  },

  // Delete product
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },

  // Bulk create products
  bulkCreateProducts: async (formData) => {
    const response = await api.post('/products/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Search products
  searchProducts: async (query) => {
    const response = await api.get('/products/search', {
      params: { q: query }
    })
    return response.data
  },

  // Get low stock products
  getLowStockProducts: async () => {
    const response = await api.get('/products/low-stock')
    return response.data
  },

  // Generate barcode
  generateBarcode: async (id) => {
    const response = await api.get(`/products/${id}/barcode`)
    return response.data
  },

  // Scan product by barcode
  scanProductByBarcode: async (barcode) => {
    const response = await api.get(`/products/scan/${barcode}`)
    return response.data
  },

  // Get combo eligible products
  getComboEligibleProducts: async (params = {}) => {
    const response = await api.get('/products/combo-eligible', { params })
    return response.data
  },

  // Get all bundles
  getBundles: async (params = {}) => {
    const response = await api.get('/products/bundles', { params })
    return response.data
  },

  // Get bundle summary
  getBundleSummary: async (id) => {
    const response = await api.get(`/products/${id}/bundle-summary`)
    return response.data
  },

  // Create child products for bundle
  createChildProducts: async (id) => {
    const response = await api.post(`/products/${id}/create-children`)
    return response.data
  }
}

export default productService