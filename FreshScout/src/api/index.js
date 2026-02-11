import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

// Auth interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ── Products ──
export const fetchProducts = (params) => api.get('/products', { params }).then(r => r.data);
export const fetchProduct = (id) => api.get(`/products/${id}`).then(r => r.data);
export const compareProduct = (title, city) => api.get('/products/compare', { params: { title, city } }).then(r => r.data);
export const searchProducts = (params) => api.get('/products', { params }).then(r => r.data);
export const smartSearch = (q, city) => api.get('/search/smart', { params: { q, city } }).then(r => r.data);

// ── Categories ──
export const fetchCategories = (city) => api.get('/categories', { params: { city } }).then(r => r.data);

// ── Stores ──
export const fetchStores = (city) => api.get('/stores', { params: { city } }).then(r => r.data);

// ── Cart ──
export const optimizeCart = (items, city) => api.post('/cart/optimize', { items, city }).then(r => r.data);

// ── Auth ──
export const sendOtp = (phone) => api.post('/auth/send-otp', { phone }).then(r => r.data);
export const verifyOtp = (phone, code) => api.post('/auth/verify-otp', { phone, code }).then(r => r.data);

// ── User ──
export const getProfile = () => api.get('/me').then(r => r.data);
export const updateProfile = (data) => api.put('/me', data).then(r => r.data);
export const getOrders = () => api.get('/orders').then(r => r.data);
export const createOrder = (data) => api.post('/orders', data).then(r => r.data);

// ── Delivery ──
export const checkDelivery = (address, city, stores, placeId) => 
  api.post('/orders/check-delivery', { address, city, stores, placeId }).then(r => r.data);

export const addressAutocomplete = (input, city) =>
  api.get('/orders/address-autocomplete', { params: { input, city } }).then(r => r.data);

export default api;
