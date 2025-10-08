import api from './api'

const reportService = {
  // Get dashboard data
  getDashboardData: async () => {
    const response = await api.get('/dashboard/owner')
    return response.data
  },

  // Get sales report
  getSalesReport: async (params = {}) => {
    const response = await api.get('/reports/sales', { params })
    return response.data
  },

  // Get inventory report
  getInventoryReport: async (params = {}) => {
    const response = await api.get('/reports/inventory', { params })
    return response.data
  },

  // Get commission report
  getCommissionReport: async (params = {}) => {
    const response = await api.get('/reports/commission', { params })
    return response.data
  },

  // Get product performance
  getProductPerformance: async (params = {}) => {
    const response = await api.get('/reports/products', { params })
    return response.data
  },

  // Export report
  exportReport: async (reportData) => {
    const response = await api.post('/reports/export', reportData, {
      responseType: 'blob'
    })
    return response
  }
}

export default reportService