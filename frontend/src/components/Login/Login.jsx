// src/components/Login/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

import sammanaLogo from '../../assets/images/sammanalogo.jpg';

import { authAPI } from '../../services/authAPI';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setViewportHeight(window.innerHeight);
      
      // Adjust body height for mobile browsers
      if (window.innerWidth <= 768) {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    // Handle virtual keyboard appearance on mobile
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true';
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    
    if (remembered && rememberedEmail) {
      setCredentials(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!credentials.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!credentials.password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (credentials.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Call your actual authentication API
      const result = await authAPI.login({
        username: credentials.email, // Using email as username
        password: credentials.password
      });
      
      if (!result.token) {
        throw new Error('No authentication token received');
      }
      
      // Store authentication data
      localStorage.setItem('token', result.token);
      localStorage.setItem('isAuthenticated', 'true');
      
      const userData = result.user || {
        username: credentials.email.split('@')[0],
        email: credentials.email,
        fullName: result.fullName || 'User',
        role: result.role || 'student'
      };
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', new Date().toISOString());
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', credentials.email);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberMe');
      }

      // Add success animation to login button
      const loginBtn = document.querySelector('.login-btn');
      if (loginBtn) {
        loginBtn.classList.add('success');
        setTimeout(() => {
          loginBtn.classList.remove('success');
        }, 1000);
      }
      
      // Navigate to dashboard with smooth transition
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
      
    } catch (err) {
      let errorMessage = err.message;
      
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      } else if (err.message.includes('401') || err.message.includes('Invalid')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.message.includes('403')) {
        errorMessage = 'Access denied. Please contact administrator.';
      }
      
      setError(errorMessage);
      
      // Add shake animation to form on error
      const form = document.querySelector('.login-form');
      if (form) {
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
      }
      
      // Clear any existing auth data on error
      authAPI.clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError('');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError('Password reset instructions have been sent to your email.');
    setTimeout(() => setError(''), 5000);
  };

  const handleDemoLogin = () => {
    setCredentials({
      email: 'demo@sammana.edu',
      password: 'demo@2024'
    });
  };

  const handleSocialLogin = (provider) => {
    setError(`${provider} login integration is being configured. Please use email login for now.`);
  };

  const isFormValid = () => {
    return credentials.email.trim() && 
           credentials.password.trim() && 
           credentials.password.length >= 6;
  };

  // Add CSS animation for shake effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .login-form.shake {
        animation: shake 0.5s ease-in-out;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      
      .login-btn.success {
        background: linear-gradient(135deg, #228B22 0%, #32CD32 100%) !important;
        animation: pulse 1s ease-in-out;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="login-container" style={{ minHeight: `${viewportHeight}px` }}>
      {/* Background Elements - Hidden on mobile for performance */}
      {!isMobile && (
        <div className="bg-elements">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
          <div className="pattern-dots"></div>
        </div>
      )}

      {/* Main Content */}
      <div className="login-wrapper">
        {/* Left Panel - Brand (Hidden on mobile) */}
        {!isMobile && (
          <div className="login-left-panel">
            <div className="brand-content">
              <div className="logo-section">
                <div className="logo-container">
                  <img 
                    src={sammanaLogo} 
                    alt="Sammana Educational Institute Logo" 
                    className="brand-logo"
                    loading="lazy"
                  />
                  <div className="logo-glow"></div>
                </div>
                <div className="brand-text">
                  <h1 className="institute-name">Sammana</h1>
                  <p className="institute-subtitle">Educational Institute</p>
                  <p className="institute-tagline">Excellence in Learning & Innovation</p>
                </div>
              </div>

              <div className="welcome-message">
                <h2>Welcome Back</h2>
                <p>
                  Sign in to access your personalized student portal, manage your courses, 
                  track academic progress, and access exclusive educational resources.
                </p>
              </div>

              <div className="features-list">
                <div className="feature">
                  <div className="feature-icon">
                    <span role="img" aria-label="Books">📚</span>
                  </div>
                  <div className="feature-content">
                    <h3>Course Management</h3>
                    <p>Access all your enrolled courses and materials</p>
                  </div>
                </div>
                
                <div className="feature">
                  <div className="feature-icon">
                    <span role="img" aria-label="Analytics">📊</span>
                  </div>
                  <div className="feature-content">
                    <h3>Progress Analytics</h3>
                    <p>Track your academic performance in real-time</p>
                  </div>
                </div>
                
                <div className="feature">
                  <div className="feature-icon">
                    <span role="img" aria-label="Graduation">🎓</span>
                  </div>
                  <div className="feature-content">
                    <h3>Academic Resources</h3>
                    <p>Access library, research papers, and study materials</p>
                  </div>
                </div>
              </div>

              <div className="institute-stats">
                <div className="stat">
                  <div className="stat-value">250+</div>
                  <div className="stat-label">Students</div>
                </div>
                <div className="stat">
                  <div className="stat-value">98%</div>
                  <div className="stat-label">Success Rate</div>
                </div>
                <div className="stat">
                  <div className="stat-value">50+</div>
                  <div className="stat-label">Programs</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Panel - Login Form */}
        <div className="login-right-panel">
          <div className="form-container">
            {/* Mobile Header */}
            {isMobile && (
              <div className="mobile-header">
                <div className="mobile-logo-container">
                  <img 
                    src={sammanaLogo} 
                    alt="Sammana Logo" 
                    className="mobile-logo"
                    loading="lazy"
                  />
                  <div className="mobile-brand">
                    <h2>Sammana</h2>
                    <p>Educational Institute</p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-header">
              <h1>Sign In</h1>
              <p className="form-subtitle">Welcome back! Please enter your details</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <span className="label-icon" role="img" aria-label="Email">📧</span>
                  Email Address
                </label>
                <div className="input-group">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleInputChange}
                    placeholder="Enter Your Username"
                    disabled={loading}
                    required
                    autoComplete="email"
                    className="form-input"
                    inputMode="email"
                    autoCapitalize="none"
                  />
                  <div className="input-focus-line"></div>
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <div className="form-label-row">
                  <label htmlFor="password" className="form-label">
                    <span className="label-icon" role="img" aria-label="Password">🔐</span>
                    Password
                  </label>
                  <button
                    type="button"
                    className="forgot-password-btn"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    disabled={loading}
                    required
                    autoComplete="current-password"
                    className="form-input"
                    inputMode="text"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    <span className="toggle-icon" role="img" aria-hidden="true">
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </span>
                  </button>
                  <div className="input-focus-line"></div>
                </div>
                <div className="password-hint">
                  Password must be at least 6 characters
                </div>
              </div>

              {/* Options */}
              <div className="form-options">
                <label className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="checkbox-input"
                  />
                  <span className="checkbox-custom"></span>
                  <span className="checkbox-text">Remember me</span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-alert" role="alert">
                  <div className="alert-icon" aria-hidden="true">!</div>
                  <div className="alert-message">{error}</div>
                </div>
              )}

              {/* Demo Login Button (Mobile only for space) */}
              {isMobile && (
                <button
                  type="button"
                  className="demo-btn"
                  onClick={handleDemoLogin}
                  disabled={loading}
                >
                  <span className="demo-icon" role="img" aria-label="Demo">🎮</span>
                  Use Demo Account
                </button>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="login-btn"
                disabled={loading || !isFormValid()}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner" aria-hidden="true"></span>
                    <span className="btn-text">Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span className="btn-text">Sign In</span>
                    <span className="btn-arrow" aria-hidden="true">→</span>
                  </>
                )}
              </button>

              {/* Sign Up Link */}
              <div className="signup-section">
                <p className="signup-text">
                  Don't have an account?{' '}
                  <a href="/signup" className="signup-link">
                    Sign up here
                  </a>
                </p>
              </div>
            </form>

            {/* Security & Support - Hidden on very small screens */}
            {!isMobile && (
              <>
                <div className="security-info">
                  <div className="security-item">
                    <span className="security-icon" role="img" aria-label="Secure">🔒</span>
                    <span className="security-text">256-bit SSL Encryption</span>
                  </div>
                  <div className="security-item">
                    <span className="security-icon" role="img" aria-label="Monitoring">👁️</span>
                    <span className="security-text">Activity Monitoring</span>
                  </div>
                </div>

                <div className="support-section">
                  <p className="support-text">
                    Need assistance?{' '}
                    <a 
                      href="mailto:support@sammana.edu" 
                      className="support-link"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = 'mailto:support@sammana.edu?subject=Login Assistance';
                      }}
                    >
                      Contact Support
                    </a>
                  </p>
                </div>
              </>
            )}

            {/* Footer - Compact on mobile */}
            <footer className="form-footer">
              {!isMobile && (
                <div className="footer-links">
                  <a href="/privacy" className="footer-link">Privacy Policy</a>
                  <span className="footer-separator">•</span>
                  <a href="/terms" className="footer-link">Terms of Service</a>
                  <span className="footer-separator">•</span>
                  <a href="/help" className="footer-link">Help Center</a>
                </div>
              )}
              <p className="copyright">
                © {new Date().getFullYear()} Sammana Educational Institute
                {!isMobile && (
                  <span className="version">v2.5.1</span>
                )}
              </p>
              {isMobile && (
                <p className="mobile-links">
                  <a href="/privacy" className="footer-link">Privacy</a>
                  <span className="footer-separator">•</span>
                  <a href="/terms" className="footer-link">Terms</a>
                  <span className="footer-separator">•</span>
                  <a href="/help" className="footer-link">Help</a>
                </p>
              )}
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;