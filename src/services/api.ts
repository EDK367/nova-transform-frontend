import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nova_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; error?: string; status?: number }>) => {
    const status = error.response?.status;
    const errorData = error.response?.data;
    const errorMessage = errorData?.message || errorData?.error || error.message || 'Error en la petición';

    if (status === 401) {
      // Don't toast for login endpoint 401 (handled by login form)
      if (!error.config?.url?.includes('/api/v1/auth/login')) {
        toast.error('Sesión expirada o no autorizada. Por favor ingresa nuevamente.');
        localStorage.removeItem('nova_token');
        localStorage.removeItem('nova_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (status === 403) {
      toast.error('Acceso denegado: No cuentas con permisos para esta acción.');
    } else if (status && status >= 500) {
      toast.error(`Error del servidor (${status}): ${errorMessage}`);
    }

    return Promise.reject(error);
  }
);

export default api;
