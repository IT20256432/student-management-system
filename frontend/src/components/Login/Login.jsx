// src/components/Login/Login.js
import React, { useState, useEffect, useRef } from 'react';
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
  const [particles, setParticles] = useState([]);
  const containerRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Initialize particles animation
  useEffect(() => {
    const initParticles = () => {
      const particleCount = window.innerWidth < 768 ? 40 : 60;
      const newParticles = [];
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          speedX: Math.random() * 0.5 - 0.25,
          speedY: Math.random() * 0.5 - 0.25,
          color: `rgba(102, 126, 234, ${Math.random() * 0.4 + 0.1})`
        });
      }
      
      setParticles(newParticles);
    };

    initParticles();
    window.addEventListener('resize', initParticles);
    return () => window.removeEventListener('resize', initParticles);
  }, []);

  // Particle animation loop
  useEffect(() => {
    if (!particles.length) return;

    let animationFrameId;
    const animate = () => {
      setParticles(prev => 
        prev.map(p => ({
          ...p,
          x: (p.x + p.speedX) % 100,
          y: (p.y + p.speedY) % 100,
        }))
      );
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [particles.length]);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.username.trim()) {
      setError('Please enter your username');
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
    setError('');

    try {
      const result = await authAPI.login(credentials);
      
      if (!result.token) {
        throw new Error('No authentication token received');
      }
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('isAuthenticated', 'true');
      
      const userData = result.user || {
        username: result.username,
        role: result.role,
        fullName: result.fullName,
        email: result.email
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      localStorage.setItem('loginTime', new Date().toISOString());
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedUsername', credentials.username);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedUsername');
      }
      
      const submitBtn = document.querySelector('.submit-button');
      if (submitBtn) {
        submitBtn.classList.add('success');
        setTimeout(() => {
          submitBtn.classList.remove('success');
        }, 1000);
      }
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 800);
      
    } catch (err) {
      let errorMessage = err.message;
      
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to connect to server';
      } else if (err.message.includes('401') || err.message.includes('Invalid')) {
        errorMessage = 'Invalid credentials';
      } else if (err.message.includes('403')) {
        errorMessage = 'Access denied';
      }
      
      setError(errorMessage);
      setLoading(false);
      
      const form = document.querySelector('.login-form');
      if (form) {
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
      }
      
      authAPI.clearAuth();
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [id]: value
    }));
    
    if (error) setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="login-container" ref={containerRef}>
      {/* Animated Background */}
      <div className="gradient-bg">
        <div className="gradient gradient-1"></div>
        <div className="gradient gradient-2"></div>
        <div className="gradient gradient-3"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles-container">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: particle.color,
              transform: `translate(-50%, -50%)`,
              opacity: 0.6
            }}
          />
        ))}
      </div>

      {/* Geometric Shapes */}
      <div className="geometric-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
      </div>

      {/* Login Card Container - Wider */}
      <div className="login-card-container">
        {/* Left Column - Logo and Welcome */}
        <div className="login-left-column">
          <div className="brand-section">
            <div className="logo-container">
              <div className="logo-orb">
                <div className="logo-orb-inner">
                  <div className="logo-symbol">🎓</div>
                </div>
                <div className="logo-orb-glow"></div>
              </div>
              <div className="brand-text">
                <h1 className="brand-title">
                  <span className="brand-title-main">Sammana</span>
                  <span className="brand-title-sub">Educational Institute</span>
                </h1>
                <p className="brand-tagline">Excellence in Education & Innovation</p>
              </div>
            </div>
          </div>

          <div className="welcome-section">
            <h2 className="welcome-heading">
              <span className="welcome-line welcome-line-1">Welcome to</span>
              <span className="welcome-line welcome-line-2">Student Management Portal</span>
            </h2>
            <p className="welcome-description">
              A comprehensive platform for managing student data, attendance, 
              fees, and academic records with advanced analytics and reporting.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-content">
                <h4>Real-time Analytics</h4>
                <p>Monitor student performance with live dashboards</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-content">
                <h4>Secure Data</h4>
                <p>Enterprise-grade security with 256-bit encryption</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <div className="feature-content">
                <h4>Fast & Reliable</h4>
                <p>Optimized performance with 99.9% uptime</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className="login-right-column">
          <div 
            className="form-glow"
            style={{
              background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(102, 126, 234, 0.2), transparent 60%)`
            }}
          />
          
          <div className="login-form-wrapper">
            <div className="form-header">
              <h3 className="form-title">Sign In to Your Account</h3>
              <p className="form-subtitle">Enter your credentials to access the system</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit} onKeyPress={handleKeyPress}>
              <div className="form-fields">
                {/* Username Field */}
                <div className="form-field">
                  <div className="field-label">
                    <span className="label-icon">👤</span>
                    <label htmlFor="username">Username or Email</label>
                  </div>
                  <div className="input-container">
                    <input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={handleInputChange}
                      placeholder="Enter your username or email"
                      disabled={loading}
                      required
                      autoComplete="username"
                      className="form-input"
                      autoFocus
                    />
                    <div className="input-underline">
                      <div className="underline-active"></div>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="form-field">
                  <div className="field-label">
                    <span className="label-icon">🔒</span>
                    <label htmlFor="password">Password</label>
                  </div>
                  <div className="input-container password-container">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={credentials.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      disabled={loading}
                      required
                      autoComplete="current-password"
                      className="form-input"
                    />
                    <div className="input-underline">
                      <div className="underline-active"></div>
                    </div>
                    <button
                      type="button"
                      className={`password-toggle ${showPassword ? 'visible' : ''}`}
                      onClick={togglePasswordVisibility}
                      disabled={loading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="toggle-icon">
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Options */}
              <div className="form-options">
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="checkbox-input"
                  />
                  <span className="checkbox-design">
                    <svg className="checkmark" viewBox="0 0 12 10">
                      <polyline points="1.5 6 4.5 9 10.5 1"></polyline>
                    </svg>
                  </span>
                  <span className="checkbox-label">Keep me signed in</span>
                </label>
                
                <a 
                  href="/forgot-password" 
                  className="forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setError('Password reset instructions sent to registered email');
                  }}
                >
                  Forgot password?
                </a>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message animate-in">
                  <div className="error-content">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{error}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                className={`submit-button ${loading ? 'loading' : ''}`}
                disabled={loading || !credentials.username || !credentials.password}
              >
                <span className="button-content">
                  <span className="button-text">
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </span>
                  <span className="button-arrow">→</span>
                </span>
                <span className="button-glow"></span>
                <span className="button-shine"></span>
              </button>
            </form>

            {/* Security Info */}
            <div className="security-info">
              <div className="security-item">
                <span className="security-icon">🛡️</span>
                <span className="security-text">256-bit SSL Encryption</span>
              </div>
              <div className="security-item">
                <span className="security-icon">👁️</span>
                <span className="security-text">Activity Monitored</span>
              </div>
            </div>

            {/* Footer */}
            <div className="form-footer">
              <p className="support-text">
                Need help?{' '}
                <a 
                  href="mailto:support@sammana.edu.lk" 
                  className="support-link"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = 'mailto:support@sammana.edu.lk?subject=Login Assistance';
                  }}
                >
                  Contact Support Team
                </a>
              </p>
              <div className="footer-meta">
                <span className="version">v2.5.1 • Enterprise Edition</span>
                <span className="copyright">© {new Date().getFullYear()} Sammana Institute</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <div className="floating-element element-1">✨</div>
        <div className="floating-element element-2">🌟</div>
        <div className="floating-element element-3">⚡</div>
      </div>
    </div>
  );
};

export default Login;