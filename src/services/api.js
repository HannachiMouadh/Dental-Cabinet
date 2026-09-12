import axios from 'axios';

// Helper function to safely get and validate the API Base URL
const getApiBaseUrl = () => {
  const envMode = import.meta.env.VITE_API_MODE || import.meta.env.API_MODE;
  const isDev = import.meta.env.DEV;

  const defaultLocal = 'http://localhost:3000/api';
  const defaultProd = 'https://dental-cabinet-backend.vercel.app/api';

  const localUrl = import.meta.env.VITE_API_BASE_URL_LOCAL || import.meta.env.API_BASE_URL_LOCAL || defaultLocal;
  const prodUrl = import.meta.env.VITE_API_BASE_URL_PROD || import.meta.env.API_BASE_URL_PROD || defaultProd;

  let targetUrl;
  if (envMode === 'local') {
    targetUrl = localUrl;
  } else if (envMode === 'prod') {
    targetUrl = prodUrl;
  } else {
    // Default dynamic switching based on environment build target
    targetUrl = isDev ? localUrl : prodUrl;
  }

  // Ensure string format and fallback if empty/undefined
  const finalString = String(targetUrl || (isDev ? defaultLocal : defaultProd)).trim();

  // Security measure: Ensure valid URL structure & HTTPS in production
  try {
    const parsedUrl = new URL(finalString);
    if (import.meta.env.PROD && parsedUrl.protocol !== 'https:') {
      console.warn('Security Warning: Production API base URL must use HTTPS. Falling back to default secure endpoint.');
      return defaultProd;
    }
    return parsedUrl.toString().replace(/\/$/, '');
  } catch (e) {
    console.error('Invalid API_BASE_URL provided in environment. Falling back to default.', e);
    return isDev ? defaultLocal : defaultProd;
  }
};

export const API_BASE_URL = getApiBaseUrl() || 'https://dental-cabinet-backend.vercel.app/api';

// Socket server URL (base domain without /api path)
export const SOCKET_URL = (API_BASE_URL || '').replace(/\/api\/?$/, '') || 'https://dental-cabinet-backend.vercel.app';


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
      // Basic token validation (ensure string format and prevent header injection)
      if (typeof token === 'string' && /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/.test(token)) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Clear corrupt token
        localStorage.removeItem('accessToken');
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 & 403 errors with automatic refresh token logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
          // Refresh token failed -> clear storage and trigger logout securely
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.reload();
          return Promise.reject(refreshErr);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
