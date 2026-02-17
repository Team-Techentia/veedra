import api from './api'

const comboService = {
  // Get all combos
  getCombos: async () => {
    const response = await api.get('/combos')
    return response.data
  },

  // Get combo by ID
  getCombo: async (id) => {
    const response = await api.get(`/combos/${id}`)
    return response.data
  },

  // Create combo
  createCombo: async (comboData) => {
    const response = await api.post('/combos', comboData)
    return response.data
  },

  // Update combo
  updateCombo: async (id, comboData) => {
    const response = await api.put(`/combos/${id}`, comboData)
    return response.data
  },

  // Delete combo
  deleteCombo: async (id) => {
    const response = await api.delete(`/combos/${id}`)
    return response.data
  },

  // Toggle combo active/pause status
  toggleComboStatus: async (id) => {
    const response = await api.patch(`/combos/${id}/toggle`)
    return response.data
  },

  // Validate combo slot
  validateComboSlot: async (slotData) => {
    const response = await api.post('/combos/validate-slot', slotData)
    return response.data
  },

  // Create quantity slab combo
  createQuantitySlabCombo: async (comboData) => {
    const response = await api.post('/combos/quantity-slab', comboData)
    return response.data
  }
}

export default comboService