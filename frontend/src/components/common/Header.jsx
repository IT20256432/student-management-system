import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    role: ''
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const hamburgerRef = useRef(null);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    // Update time every minute
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    // Check if user is logged in
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      
      setIsLoggedIn(!!token && isAuthenticated);
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserData({
            name: user.fullName || user.username || 'Administrator',
            role: user.role || 'Admin'
          });
        } catch (error) {
          setUserData({
            name: 'Administrator',
            role: 'Admin'
          });
        }
      }
    };

    // Close mobile menu when clicking outside
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    // Handle escape key
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 60000);
    checkAuthStatus();

    // Listen for auth changes
    window.addEventListener('storage', checkAuthStatus);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkAuthStatus);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      clearInterval(timeInterval);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        await fetch('https://management.sammanaedu.com/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('loginTime');

      setIsLoggedIn(false);
      setShowLogoutConfirm(false);
      setIsMobileMenuOpen(false);

      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
      navigate('/login');
    }
  };

  const navLinks = [
    { path: '/dashboard', icon: '📊', text: 'Dashboard' },
    { path: '/register', icon: '👤', text: 'Register' },
    { path: '/attendance', icon: '✅', text: 'Attendance' },
    { path: '/fee-payment', icon: '💳', text: 'Payments' }, 
    { path: '/students', icon: '🎓', text: 'Students' },
    { path: '/reports', icon: '📈', text: 'Reports' },
  ];

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          {/* Logo and Hamburger Container */}
          <div className="mobile-header-left">
            <button 
              ref={hamburgerRef}
              className={`hamburger-menu ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>

            <Link to="/dashboard" className="logo">
              <div className="logo-icon">
                <div className="logo-symbol">🎓</div>
              </div>
              <div className="logo-text">
                <h1>Sammana</h1>
                <span>Educational Institute</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on Mobile */}
          <nav className="nav desktop-nav">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                className={`nav-link ${isActive(link.path)}`}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-text">{link.text}</span>
              </Link>
            ))}
          </nav>

          <div className="header-right">
            {/* Time and Badge - Hidden on Mobile */}
            <div className="header-info">
              <div className="current-time">
                <span className="time-icon">🕒</span>
                {currentTime}
              </div>
              <div className="institute-badge">Excellence in Education</div>
            </div>
            
            {/* User Profile & Logout Section */}
            <div className="user-profile-section">
              {isLoggedIn ? (
                <div className="user-profile">
                  <div className="user-avatar" onClick={() => setIsMobileMenuOpen(true)}>
                    <div className="avatar-icon">👤</div>
                    <div className="user-status-indicator"></div>
                  </div>
                  
                  <div className="user-details">
                    <div className="user-name">{userData.name}</div>
                    <div className="user-role">{userData.role}</div>
                  </div>
                  
                  <button 
                    className="logout-button desktop-logout"
                    onClick={() => setShowLogoutConfirm(true)}
                    title="Logout"
                  >
                    <svg className="logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M16 17l5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className="logout-button-text">Logout</span>
                  </button>
                </div>
              ) : (
                <Link to="/login" className="login-button desktop-login">
                  <svg className="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10 17l5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 12H3" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="login-button-text">Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}>
          <nav className={`mobile-nav ${isMobileMenuOpen ? 'active' : ''}`} ref={mobileMenuRef}>
            <div className="mobile-nav-header">
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">
                  <div className="avatar-icon">👤</div>
                  <div className="user-status-indicator"></div>
                </div>
                <div>
                  <div className="mobile-user-name">{isLoggedIn ? userData.name : 'Guest'}</div>
                  <div className="mobile-user-role">{isLoggedIn ? userData.role : 'Please login'}</div>
                </div>
              </div>
              <button 
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            
            <div className="mobile-nav-links">
              {navLinks.map((link) => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={`mobile-nav-link ${isActive(link.path)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mobile-nav-icon">{link.icon}</span>
                  <span className="mobile-nav-text">{link.text}</span>
                </Link>
              ))}
            </div>
            
            <div className="mobile-nav-footer">
              <div className="mobile-current-time">
                <span className="mobile-time-icon">🕒</span>
                {currentTime}
              </div>
              <div className="mobile-institute-badge">
                Excellence in Education
              </div>
              {isLoggedIn ? (
                <button 
                  className="mobile-logout-btn"
                  onClick={() => {
                    setShowLogoutConfirm(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <svg className="mobile-logout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16 17l5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12H9" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Logout
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="mobile-login-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg className="mobile-login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10 17l5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 12H3" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Login
                </Link>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="modal-icon">🔒</div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of your account?</p>
            
            <div className="current-user-info">
              <div className="current-user-avatar">👤</div>
              <div>
                <div className="current-user-name">{userData.name}</div>
                <div className="current-user-role">{userData.role}</div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm-btn"
                onClick={handleLogout}
              >
                <svg className="confirm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 17l5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12H9" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;