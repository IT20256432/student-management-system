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
  const [userData, setUserData] = useState({
    name: '',
    role: ''
  });

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
      const token = localStorage.getItem('token');
      
      if (token) {
        // Call logout API with Authorization header
        await fetch('http://localhost:8080/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
      }

      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('loginTime');

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
      navigate('/login');
    }
  };

  return (
    <>
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <Link to="/dashboard" className="logo">
            <div className="logo-icon">
              <div className="logo-symbol">🎓</div>
            </div>
            <div className="logo-text">
              <h1>Sammana</h1>
              <span>Educational Institute</span>
            </div>
          </Link>

          <nav className="nav">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </Link>
            <Link to="/register" className={`nav-link ${isActive('/register')}`}>
              <span className="nav-icon">👤</span>
              <span className="nav-text">Register</span>
            </Link>
            <Link to="/attendance" className={`nav-link ${isActive('/attendance')}`}>
              <span className="nav-icon">✅</span>
              <span className="nav-text">Attendance</span>
            </Link>
            <Link to="/students" className={`nav-link ${isActive('/students')}`}>
              <span className="nav-icon">🎓</span>
              <span className="nav-text">Students</span>
            </Link>
            <Link to="/students" className={`nav-link ${isActive('/payments')}`}>
              <span className="nav-icon">🎓</span>
              <span className="nav-text">Payments</span>
            </Link>
            <Link to="/reports" className={`nav-link ${isActive('/reports')}`}>
              <span className="nav-icon">📈</span>
              <span className="nav-text">Reports</span>
            </Link>
          </nav>

          <div className="header-right">
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
                  <div className="user-details">
                    <div className="user-name">{userData.name}</div>
                    <div className="user-role">{userData.role}</div>
                  </div>
                  
                  <button 
                    className="logout-button"
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
                <Link to="/login" className="login-button">
                  <svg className="login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10 17l5-5-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 12H3" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span className="login-button-text">Login</span> {/* Fixed: Changed from Logout to Login */}
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