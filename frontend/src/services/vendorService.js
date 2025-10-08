import api from './api'

const vendorService = {
  // Get all vendors
  getVendors: async () => {
    const response = await api.get('/vendors')
    return response.data
  },

  // Get vendor by ID
  getVendor: async (id) => {
    const response = await api.get(`/vendors/${id}`)
    return response.data
  },

  // Create vendor
  createVendor: async (vendorData) => {
    const response = await api.post('/vendors', vendorData)
    return response.data
  },

  // Update vendor
  updateVendor: async (id, vendorData) => {
    const response = await api.put(`/vendors/${id}`, vendorData)
    return response.data
  },

  // Delete vendor
  deleteVendor: async (id) => {
    const response = await api.delete(`/vendors/${id}`)
    return response.data
  },

  // Get vendor commissions
  getVendorCommissions: async (id, params = {}) => {
    const response = await api.get(`/vendors/${id}/commissions`, { params })
    return response.data
  }
}

export default vendorService