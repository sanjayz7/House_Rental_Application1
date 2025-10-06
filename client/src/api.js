import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5001/api' });

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Purchase API functions
export const purchaseAPI = {
  // Add a new purchase (free house purchase)
  addPurchase: (listingId, notes = '') => 
    api.post('/purchases', { listingId, notes }),

  // Get user's purchases
  getUserPurchases: () => 
    api.get('/purchases/my-purchases'),

  // Get seller's sales
  getSellerSales: () => 
    api.get('/purchases/my-sales'),

  // Get purchase statistics
  getPurchaseStats: () => 
    api.get('/purchases/stats')
};

export default api;
