import { getAuthHeaders } from './authHeaders';

// Define API_BASE_URL directly
const API_BASE_URL = 'https://management.sammanaedu.com/api';



export const authAPI = {
  getAuthHeaders,
  login: async (credentials) => {
    try {
      console.log('🔐 Login attempt:', credentials.username);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      // Check response status first
      if (!response.ok) {
        let errorMessage = `Login failed (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, get text
          const text = await response.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('📥 Login response:', data);

      // Check for success flag or token
      if (!data.success && !data.token) {
        throw new Error(data.message || data.error || 'Login failed');
      }

      // ✅ Store authentication data
      if (data.token) {
        localStorage.setItem('token', data.token);
        console.log('✅ Token stored in localStorage');
      } else {
        console.error('❌ No token in response! Response was:', data);
        throw new Error('No authentication token received');
      }
      
      // Store user info
      const userData = data.user || {
        username: data.username,
        role: data.role,
        fullName: data.fullName,
        email: data.email
      };
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('loginTime', new Date().toISOString());

      return {
        success: true,
        message: data.message || 'Login successful',
        token: data.token,
        user: userData
      };

    } catch (error) {
      console.error('❌ Login error:', error);
      // Clear any partial auth data
      authAPI.clearAuth();
      throw error;
    }
  },

  logout: () => {
    console.log('👋 Logging out...');
    authAPI.clearAuth();
    // Redirect to login page
    window.location.href = '/login';
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('rememberMe');
    console.log('🧹 Authentication data cleared');
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const isAuth = token !== null && localStorage.getItem('isAuthenticated') === 'true';
    
    // Optional: Check token format (basic validation)
    if (isAuth && token) {
      try {
        // JWT tokens have 3 parts separated by dots
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('⚠️ Token format invalid');
          return false;
        }
      } catch (e) {
        console.warn('⚠️ Token validation error:', e.message);
        return false;
      }
    }
    
    return isAuth;
  },

  getUserInfo: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('❌ Error parsing user info:', error);
      return null;
    }
  },

  getToken: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('⚠️ No token found in localStorage');
      return null;
    }
    return token;
  },



  // Validate token with server
  validateToken: async () => {
    try {
      const token = authAPI.getToken();
      if (!token) {
        console.log('❌ No token to validate');
        return false;
      }

      console.log('🔍 Validating token...');
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.log('❌ Token validation failed:', response.status);
        // If token is invalid, clear auth data
        if (response.status === 401 || response.status === 403) {
          authAPI.clearAuth();
        }
        return false;
      }

      const data = await response.json();
      const isValid = data.authenticated === true;
      console.log('✅ Token validation result:', isValid);
      
      if (!isValid) {
        authAPI.clearAuth();
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      // Don't clear auth on network errors - might be temporary
      return false;
    }
  },

  // Check authentication status and auto-redirect if needed
  checkAuthAndRedirect: () => {
    const isAuth = authAPI.isAuthenticated();
    const currentPath = window.location.pathname;
    
    // If not authenticated and not on login page, redirect to login
    if (!isAuth && !currentPath.includes('/login')) {
      console.log('🔒 Not authenticated, redirecting to login...');
      window.location.href = '/login';
      return false;
    }
    
    // If authenticated and on login page, redirect to dashboard
    if (isAuth && currentPath.includes('/login')) {
      console.log('✅ Already authenticated, redirecting to dashboard...');
      window.location.href = '/dashboard';
      return false;
    }
    
    return isAuth;
  },

  // Debug function to show current auth state
  debugAuth: () => {
    console.group('🔍 Authentication Debug');
    console.log('Token exists:', !!localStorage.getItem('token'));
    console.log('Token:', localStorage.getItem('token')?.substring(0, 30) + '...');
    console.log('User:', localStorage.getItem('user'));
    console.log('isAuthenticated:', localStorage.getItem('isAuthenticated'));
    console.log('Login Time:', localStorage.getItem('loginTime'));
    console.groupEnd();
    
    return {
      hasToken: !!localStorage.getItem('token'),
      user: authAPI.getUserInfo(),
      isAuthenticated: authAPI.isAuthenticated(),
      loginTime: localStorage.getItem('loginTime')
    };
  }
};

