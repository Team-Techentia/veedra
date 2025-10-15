import api from './api';

const paymentService = {
  processPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments', paymentData);
      return response; // API interceptor already returns response.data
    } catch (error) {
      console.error('Payment service error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  getPaymentHistory: async (params = {}) => {
    try {
      const response = await api.get('/payments/history', { params });
      return response.data;
    } catch (error) {
      console.error('Payment history error:', error);
      throw error;
    }
  }
};

export default paymentService;