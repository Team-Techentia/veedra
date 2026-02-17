import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/wallets`;

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Get wallet by phone number
const getWalletByPhone = async (phone) => {
  try {
    console.log(`📱 Fetching wallet for phone: ${phone}`);
    const response = await axios.get(
      `${API_URL}/phone/${phone}`,
      getAuthHeader()
    );
    console.log(`✅ Wallet fetched:`, response.data.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching wallet:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Calculate points for a bill amount
const calculatePointsEarned = async (billAmount) => {
  try {
    const response = await axios.post(
      `${API_URL}/calculate-points`,
      { billAmount },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error('Error calculating points:', error);
    throw error.response?.data || error;
  }
};

// Calculate points per product
const calculatePointsPerProduct = async (products) => {
  try {
    console.log('📊 Calculating points per product...', products);
    const response = await axios.post(
      `${API_URL}/calculate-points-per-product`,
      { products },
      getAuthHeader()
    );
    console.log('✅ Points per product:', response.data.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error calculating points per product:', error);
    throw error.response?.data || error;
  }
};

// Update wallet points (earn or redeem)
const updateWalletPoints = async (phone, points, type, billNumber, billAmount, description, customerName) => {
  try {
    const response = await axios.post(
      `${API_URL}/update`,
      {
        phone,
        points,
        type,
        billNumber,
        billAmount,
        description,
        customerName
      },
      getAuthHeader()
    );
    return response.data;
  } catch (error) {
    console.error('Error updating wallet:', error);
    throw error.response?.data || error;
  }
};

// Get point configuration (point price)
const getPointConfig = async () => {
  try {
    console.log('🔧 Fetching point config...');
    const response = await axios.get(
      'https://api.techentia.in/api/point-rules/config/price',
      getAuthHeader()
    );
    console.log('✅ Point config fetched:', response.data.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching point config:', error);
    throw error.response?.data || error;
  }
};

// Adjust customer points (bonus/deduction)
const adjustPoints = async (customerId, points, reason) => {
  try {
    console.log(`🎁 Adjusting points for customer ${customerId}: ${points > 0 ? '+' : ''}${points}`);
    const response = await axios.post(
      `${API_URL}/${customerId}/adjust-points`,
      { points, reason },
      getAuthHeader()
    );
    console.log('✅ Points adjusted successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error adjusting points:', error);
    throw error.response?.data || error;
  }
};

// Point Rules methods
const getPointRules = async () => {
  try {
    const response = await axios.get(`${API_URL}/rules`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching point rules:', error);
    throw error.response?.data || error;
  }
};

const addPointRule = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/rules`, data, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('❌ Error adding point rule:', error);
    throw error.response?.data || error;
  }
};

const updatePointRule = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/rules/${id}`, data, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('❌ Error updating point rule:', error);
    throw error.response?.data || error;
  }
};

const deletePointRule = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/rules/${id}`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting point rule:', error);
    throw error.response?.data || error;
  }
};


const walletService = {
  getWalletByPhone,
  // Point Rules
  getPointRules,
  addPointRule,
  updatePointRule,
  deletePointRule,

  // Calculate points
  calculatePointsEarned,
  calculatePointsPerProduct,
  updateWalletPoints,
  getPointConfig,
  adjustPoints
};

export default walletService;