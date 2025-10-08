import api from './api'

const walletService = {
  // Get wallets
  getWallets: async () => {
    const response = await api.get('/wallets')
    return response.data
  },

  // Get wallet by ID
  getWallet: async (id) => {
    const response = await api.get(`/wallets/${id}`)
    return response.data
  },

  // Get wallet transactions
  getWalletTransactions: async (id, params = {}) => {
    const response = await api.get(`/wallets/${id}/transactions`, { params })
    return response.data
  },

  // Process commission payout
  processCommissionPayout: async (id, payoutData) => {
    const response = await api.post(`/wallets/${id}/payout`, payoutData)
    return response.data
  },

  // Adjust wallet balance
  adjustWalletBalance: async (id, adjustmentData) => {
    const response = await api.post(`/wallets/${id}/adjust`, adjustmentData)
    return response.data
  }
}

export default walletService