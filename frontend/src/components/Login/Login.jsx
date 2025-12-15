// src/components/Login/Login.js
import React, { useState } from 'react';
import { authAPI } from '../../services/authAPI';
import './Login.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!credentials.username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    if (!credentials.password.trim()) {
      setError('Please enter your password');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login...');
      
      // Call the authAPI login function
      const result = await authAPI.login(credentials);
      
      console.log('✅ Login successful:', { 
        username: result.user?.username || result.username,
        role: result.user?.role || result.role 
      });
      
      // Verify token was received
      if (!result.token) {
        throw new Error('No authentication token received from server');
      }
      
      // Store authentication data
      localStorage.setItem('token', result.token);
      localStorage.setItem('isAuthenticated', 'true');
      
      // Store user info
      const userData = result.user || {
        username: result.username,
        role: result.role,
        fullName: result.fullName,
        email: result.email
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Store login time
      localStorage.setItem('loginTime', new Date().toISOString());
      
      // Handle "Remember me"
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      console.log('🔄 Redirecting to dashboard...');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // User-friendly error messages
      let errorMessage = err.message;
      
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (err.message.includes('401') || err.message.includes('Invalid')) {
        errorMessage = 'Invalid username or password. Please try again.';
      } else if (err.message.includes('403')) {
        errorMessage = 'Access denied. Please contact administrator.';
      }
      
      setError(errorMessage);
      setLoading(false);
      
      // Clear any partial auth data
      authAPI.clearAuth();
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [id]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyPress = (e) => {
    // Allow form submission with Enter key
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-container">
      {/* Background */}
      <div className="login-background">
        <div className="login-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">
              🎓
            </div>
            <div className="logo-text">
              <h1>Student Management System</h1>
              <p>Administrator Portal</p>
            </div>
          </div>
          <h2>Sign In to Your Account</h2>
          <p className="login-subtitle">Enter your credentials to access the system</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              disabled={loading}
              required
              autoComplete="username"
              className="form-input"
              autoFocus
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈 Hide' : '👁️ Show'}
              </button>
            </div>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={loading}
                required
                autoComplete="current-password"
                className="form-input password-input"
              />
            </div>
          </div>

          {/* Form Options */}
          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="checkbox-input"
              />
              <span className="checkbox-text">Remember me</span>
            </label>
            
            <a 
              href="/forgot-password" 
              className="forgot-password-link"
              onClick={(e) => {
                e.preventDefault();
                alert('Please contact system administrator for password reset.');
              }}
            >
              Forgot password?
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <div className="error-text">{error}</div>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading || !credentials.username || !credentials.password}
          >
            {loading ? (
              <div className="button-loading">
                <span className="spinner"></span>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* System Info */}
        <div className="system-info">
          <div className="info-item">
            <span className="info-icon">📱</span>
            <span className="info-text">Secure Login</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <span className="info-text">Encrypted Connection</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🔄</span>
            <span className="info-text">24/7 Support</span>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p className="footer-text">
            Having trouble signing in?{' '}
            <a 
              href="mailto:admin@school.edu" 
              className="contact-link"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = 'mailto:admin@school.edu?subject=Login Assistance';
              }}
            >
              Contact Support
            </a>
          </p>
          <p className="copyright">
            © {new Date().getFullYear()} Student Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;