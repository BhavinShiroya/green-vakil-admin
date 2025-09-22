import axios, { InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

// Create axios instance
const apiClient = axios.create({
  baseURL: 'https://fronterainfotech.com/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    const isExpired = decoded.exp < currentTime;
    
    if (isExpired) {
      console.log('🔴 Access token is EXPIRED');
    } else {
      console.log('✅ Access token is VALID');
    }
    
    return isExpired;
  } catch (error) {
    console.error('❌ Error decoding token:', error);
    return true;
  }
};

// Function to automatically refresh access token
const autoRefreshToken = async (): Promise<string | null> => {
  const refreshToken = Cookies.get('refreshToken');
  const currentAccessToken = Cookies.get('accessToken');

  if (!refreshToken || !currentAccessToken) {
    return null;
  }

  try {
    
    const response = await axios.post('https://fronterainfotech.com/v1/auth/refresh-tokens', 
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentAccessToken}`
        }
      }
    );
    

    if (response.data?.access) {
      const { access, refresh } = response.data;
      // Update access token in cookies
      if (access?.token) {
        // First remove the old access token
        Cookies.remove('accessToken');
        
        
        // Set the new access token
        Cookies.set('accessToken', access.token, { expires: 1 });
        
        
        // Verify the token was stored correctly
        const storedToken = Cookies.get('accessToken');
        
      }

      // Update refresh token in cookies
      if (refresh?.token) {
        // Remove old refresh token
        Cookies.remove('refreshToken');
        console.log('🗑️ Removed old refresh token');
        
        const refreshExpiry = refresh.expires ? new Date(refresh.expires) : 30;
        Cookies.set('refreshToken', refresh.token, { expires: refreshExpiry });
        console.log('✅ New refresh token automatically stored');
      }

      return access.token;
    }

    return null;
  } catch (error: any) {
    console.error('❌ Automatic token refresh failed:', error.response?.data || error.message);
    
    // If refresh fails with 401/403, clear tokens and redirect
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔴 Refresh token invalid, logging out...');
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      Cookies.remove('userData');
      window.location.href = '/login';
    }
    
    return null;
  }
};

// Request interceptor to automatically refresh token and add auth header
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Skip auto-refresh for the refresh endpoint to avoid infinite loops
    if (config.url?.includes('refresh-tokens')) {
      const token = Cookies.get('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }

    let token = Cookies.get('accessToken');
    
    // Automatically check if token is expired and refresh if needed
    if (token && isTokenExpired(token)) {
      const newToken = await autoRefreshToken();
      token = newToken || undefined;
    }

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