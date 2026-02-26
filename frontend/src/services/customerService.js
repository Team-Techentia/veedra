import api from './api';

// Get all customers with pagination and search
export const getCustomers = async (page = 1, limit = 30, search = '', dateFrom = null, dateTo = null) => {
    try {
        const params = { page, limit };
        if (search) params.search = search;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const response = await api.get('/wallets/customers', { params });
        return response;
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
};

// Get customer by ID
export const getCustomerById = async (id) => {
    try {
        const response = await api.get(`/wallets/${id}`);
        return response;
    } catch (error) {
        console.error(`Error fetching customer ${id}:`, error);
        throw error;
    }
};

// Update customer
export const updateCustomer = async (id, data) => {
    try {
        const response = await api.put(`/wallets/${id}`, data);
        return response;
    } catch (error) {
        console.error(`Error updating customer ${id}:`, error);
        throw error;
    }
};

// Delete customer
export const deleteCustomer = async (id) => {
    try {
        const response = await api.delete(`/wallets/${id}`);
        return response;
    } catch (error) {
        console.error(`Error deleting customer ${id}:`, error);
        throw error;
    }
};

// Get top loyalty holders
export const getTopLoyaltyHolders = async (limit = 50, dateFrom = null, dateTo = null) => {
    try {
        const params = { limit };
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        const response = await api.get('/wallets/top-loyalty', { params });
        return response;
    } catch (error) {
        console.error('Error fetching top loyalty holders:', error);
        throw error;
    }
};

// Get customer bills
export const getCustomerBills = async (id, dateFrom = null, dateTo = null) => {
    try {
        const params = {};
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const response = await api.get(`/wallets/${id}/bills`, { params });
        return response;
    } catch (error) {
        console.error(`Error fetching bills for customer ${id}:`, error);
        throw error;
    }
};

// Manually adjust customer points
export const adjustCustomerPoints = async (id, points, reason) => {
    try {
        const response = await api.post(`/wallets/${id}/adjust-points`, { points, reason });
        return response;
    } catch (error) {
        console.error(`Error adjusting points for customer ${id}:`, error);
        throw error;
    }
};

// Expire old points (background job)
export const expireOldPoints = async () => {
    try {
        const response = await api.post('/wallets/expire-old-points');
        return response;
    } catch (error) {
        console.error('Error expiring old points:', error);
        throw error;
    }
};
