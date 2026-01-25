import axios from 'axios';

const API_URL = 'https://api.techentia.in/api/wallets';

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

const walletService = {
  getWalletByPhone,
  calculatePointsEarned,
  updateWalletPoints,
  getPointConfig
};

export default walletService;