import axios from 'axios';
import { getToken, clearSession } from './auth';

const REMOTE_API_URL = process.env.REACT_APP_API_URL?.trim().replace(/\/$/, '');
const BASE_URL = REMOTE_API_URL || '/api';
const API_CONNECTION_HINT =
  'Cannot reach the backend API. Check REACT_APP_API_URL on the frontend and CORS_ORIGINS on the backend.';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const formatDetail = (detail) => {
  if (typeof detail === 'string') return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (!item || typeof item !== 'object') return String(item);
        const field = Array.isArray(item.loc)
          ? item.loc.filter((part) => part !== 'body').join('.')
          : '';
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .filter(Boolean)
      .join('; ');
  }

  if (detail && typeof detail === 'object') {
    return detail.message || JSON.stringify(detail);
  }

  return '';
};

api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      const error = new Error(API_CONNECTION_HINT);
      error.isApiConnectionError = true;
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    // Expired or invalid token: clear the session and bounce to login so
    // the user doesn't sit on a broken page silently failing requests.
    if (error?.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error, fallback = 'Request failed') => {
  if (error?.isApiConnectionError) return API_CONNECTION_HINT;

  const detail = formatDetail(error?.response?.data?.detail);
  if (detail) return detail;

  if (error?.response?.data?.message) return error.response.data.message;
  if (!error?.response) return API_CONNECTION_HINT;

  return fallback;
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

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
