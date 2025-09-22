import axios, { InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

// Create axios instance
const apiClient = axios.create({
  baseURL: 'https://fronterainfotech.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post('https://fronterainfotech.com/v1/auth/refresh-tokens', {
            refreshToken,
          });

          if (response.data?.tokens) {
            const { access, refresh } = response.data.tokens;
            
            // Update cookies with new tokens
            if (access?.token) {
              const accessExpiry = access.expires ? new Date(access.expires) : 1;
              Cookies.set('accessToken', access.token, { expires: accessExpiry });
            }
            
            if (refresh?.token) {
              const refreshExpiry = refresh.expires ? new Date(refresh.expires) : 30;
              Cookies.set('refreshToken', refresh.token, { expires: refreshExpiry });
            }

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access.token}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          Cookies.remove('userData');
          window.location.href = '/auth/auth1/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        Cookies.remove('userData');
        window.location.href = '/auth/auth1/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient; 