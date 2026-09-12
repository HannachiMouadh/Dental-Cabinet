import axios from 'axios';

// Clean relative '/api' URL proxied transparently by Vercel / Vite
// The browser NEVER sees or communicates directly with the backend domain.
export const API_BASE_URL = '/api';


// Socket server URL (base domain without /api path)
export const SOCKET_URL = import.meta.env.API_SOCK_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3000' : 'https://dental-cabinet-backend.vercel.app');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach access token securely
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      if (typeof token === 'string' && /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        localStorage.removeItem('accessToken');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to sanitize any error message and remove any leaked server URLs
const sanitizeError = (error) => {
  if (!error) return error;
  const backendRegex = /https?:\/\/[a-zA-Z0-9.-]*vercel\.app[^\s]*/gi;
  if (error.message) {
    error.message = error.message.replace(backendRegex, '/api');
  }
  if (error.response?.data?.message && typeof error.response.data.message === 'string') {
    error.response.data.message = error.response.data.message.replace(backendRegex, '/api');
  }
  return error;
};

// Response interceptor to handle 401 & 403 errors and sanitize error messages
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Sanitize any URL references in error
    sanitizeError(error);

    // If 401/403 and token expired, attempt refresh once
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/users/refresh-token`, {
            refreshToken
          });

          const { accessToken, refreshToken: newRefreshToken } = res.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.reload();
          return Promise.reject(sanitizeError(refreshErr));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

