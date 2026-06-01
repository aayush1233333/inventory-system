import axios from 'axios';

const REMOTE_API_URL = process.env.REACT_APP_API_URL?.replace(/\/$/, '');
const BASE_URL = REMOTE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const productsApi = {
  list: (params = {}) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  replace: (id, data) => api.put(`/products/${id}`, data),
  update: (id, data) => api.patch(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const customersApi = {
  list: (params = {}) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.patch(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const ordersApi = {
  list: (params = {}) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  delete: (id) => api.delete(`/orders/${id}`),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
};

export default api;
