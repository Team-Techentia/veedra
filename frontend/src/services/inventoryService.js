import api from './api'

const inventoryService = {
  // Get inventory
  getInventory: async (params = {}) => {
    const response = await api.get('/inventory', { params })
    return response.data
  },

  // Adjust stock
  adjustStock: async (adjustmentData) => {
    const response = await api.post('/inventory/adjust', adjustmentData)
    return response.data
  },

  // Bulk stock adjustment
  bulkStockAdjustment: async (adjustmentData) => {
    const response = await api.post('/inventory/bulk-adjust', adjustmentData)
    return response.data
  },

  // Get stock movements
  getStockMovements: async (params = {}) => {
    const response = await api.get('/inventory/movements', { params })
    return response.data
  },

  // Get inventory report
  getInventoryReport: async (params = {}) => {
    const response = await api.get('/inventory/report', { params })
    return response.data
  },

  // Get low stock items
  getLowStockItems: async () => {
    const response = await api.get('/products/low-stock')
    return response.data
  }
}

export default inventoryService