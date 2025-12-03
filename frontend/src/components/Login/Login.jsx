// src/components/Login/Login.js
import React, { useState } from 'react';
import { authAPI } from '../../services/api';
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
  
  const handleDemoLogin = (role) => {
    const demoCredentials = {
      admin: { username: 'admin', password: 'admin123' },
      teacher: { username: 'teacher', password: 'teacher123' },
      student: { username: 'student', password: 'student123' }
    };
    
    setCredentials(demoCredentials[role]);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  setLoading(true);
  setError('');

  try {
    console.log('🔐 Attempting login...');
    
    const result = await authAPI.login(credentials);
    
    console.log('🔵 Login response:', result);
    
    // FORCE REDIRECT FOR TESTING
    console.log('🚀 FORCE REDIRECTING TO DASHBOARD');
    
    // Store auth data
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('user', JSON.stringify(result.user || { username: credentials.username }));
    
    // Method 1: Use window.location.href
    window.location.href = '/dashboard';
    
    // Method 2: Use navigate if you have it
    // navigate('/dashboard');
    
    return; // Exit early
    
  } catch (err) {
    console.error('❌ Login error:', err);
    setError(err.message || 'Login failed');
    setLoading(false);
  }
};

  return (
    <div className="login-container">
      {/* Animated Background */}
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
              <h2>EduManage Pro</h2>
              <p>School Management System</p>
            </div>
          </div>
          <h3>Welcome Back</h3>
          <p>Sign in to your admin account</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              placeholder="Enter your username"
              disabled={loading}
              required
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                placeholder="Enter your password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Form Options */}
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              Remember me
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot password?
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="submit-error">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Demo Section */}
        <div className="demo-section">
          <div className="demo-label">Quick Demo Access</div>
          <div className="demo-buttons">
            <button 
              className="demo-btn admin"
              onClick={() => handleDemoLogin('admin')}
              disabled={loading}
            >
              Admin
            </button>
            <button 
              className="demo-btn teacher"
              onClick={() => handleDemoLogin('teacher')}
              disabled={loading}
            >
              Teacher
            </button>
            <button 
              className="demo-btn student"
              onClick={() => handleDemoLogin('student')}
              disabled={loading}
            >
              Student
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <a href="/signup" className="signup-link">
              Contact administrator
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;