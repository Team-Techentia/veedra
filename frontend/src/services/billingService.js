import api from './api'

const billingService = {
  // Create bill
  createBill: async (billData) => {
    const response = await api.post('/billing', billData)
    return response.data
  },

  // Get bills
  getBills: async (params = {}) => {
    const response = await api.get('/billing', { params })
    return response.data
  },

  // Get bill by ID
  getBill: async (id) => {
    const response = await api.get(`/billing/${id}`)
    return response.data
  },

  // Update bill
  updateBill: async (id, billData) => {
    const response = await api.put(`/billing/${id}`, billData)
    return response.data
  },

  // Delete bill
  deleteBill: async (id) => {
    const response = await api.delete(`/billing/${id}`)
    return response.data
  },

  // Generate invoice
  generateInvoice: async (id) => {
    const response = await api.get(`/billing/${id}/invoice`)
    return response.data
  },

  // Get daily sales
  getDailySales: async (date) => {
    const response = await api.get('/billing/reports/daily', {
      params: { date }
    })
    return response.data
  },

  // Get staff sales
  getStaffSales: async (staffId, params = {}) => {
    const response = await api.get(`/billing/reports/staff/${staffId}`, { params })
    return response.data
  }
}

export default billingService