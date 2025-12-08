import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!token && !!user);
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 60000);
    checkAuthStatus();

    // Listen for auth changes
    window.addEventListener('storage', checkAuthStatus);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', checkAuthStatus);
      clearInterval(timeInterval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API
      const response = await fetch('http://localhost:8080/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('username');

      // Clear session storage
      sessionStorage.clear();

      // Update state
      setIsLoggedIn(false);
      setShowLogoutConfirm(false);

      // Redirect to login page
      navigate('/login');
      
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    }
  };

  const handleQuickLogout = () => {
    // Quick logout without confirmation for admin/dev
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <div className="logo-icon">🎓</div>
              <div className="icon-star"></div>
            </div>
            <div className="logo-text">
              <h1>Sammana</h1>
              <span>Educational Institute</span>
            </div>
          </Link>

          <nav className="nav">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              <span className="nav-icon">📊</span>
              Dashboard
            </Link>
            <Link to="/register" className={`nav-link ${isActive('/register')}`}>
              <span className="nav-icon">👤</span>
              Register
            </Link>
            <Link to="/attendance" className={`nav-link ${isActive('/attendance')}`}>
              <span className="nav-icon">✅</span>
              Attendance
            </Link>
            <Link to="/students" className={`nav-link ${isActive('/students')}`}>
              <span className="nav-icon">🎓</span>
              Students
            </Link>
            <Link to="/reports" className={`nav-link ${isActive('/reports')}`}>
              <span className="nav-icon">📈</span>
              Reports
            </Link>
          </nav>

          <div className="header-right">
            <div className="header-info">
              <div className="current-time">{currentTime}</div>
              <div className="institute-badge">Excellence in Education</div>
            </div>
            
            {/* User Info & Logout Button */}
            <div className="user-section">
              {isLoggedIn ? (
                <>
                  <div className="user-info">
                    <span className="user-icon">👤</span>
                    <span className="username">
                      {localStorage.getItem('username') || 'Admin'}
                    </span>
                  </div>
                  <button 
                    className="logout-btn"
                    onClick={() => setShowLogoutConfirm(true)}
                    title="Logout"
                  >
                    <span className="logout-icon">🚪</span>
                    <span className="logout-text">Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="login-btn">
                  <span className="login-icon">🔑</span>
                  <span className="login-text">Logout</span>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="header-bg-elements">
          <div className="bg-circle-1"></div>
          <div className="bg-circle-2"></div>
          <div className="bg-circle-3"></div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay">
          <div className="logout-modal">
            <div className="modal-icon">⚠️</div>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out of the system?</p>
            
            <div className="modal-actions">
              <button 
                className="modal-btn confirm-btn"
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
            </div>
            
            <div className="modal-footer">
              <button 
                className="quick-logout-btn"
                onClick={handleQuickLogout}
                title="Admin Quick Logout"
              >
                Force Logout (Admin)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;