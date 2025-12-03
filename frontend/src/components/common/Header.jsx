import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

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

    updateTime();
    const timeInterval = setInterval(updateTime, 60000);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timeInterval);
    };
  }, []);

  return (
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

        <div className="header-info">
          <div className="current-time">{currentTime}</div>
          <div className="institute-badge">Excellence in Education</div>
        </div>
      </div>
      
      {/* Animated background elements */}
      <div className="header-bg-elements">
        <div className="bg-circle-1"></div>
        <div className="bg-circle-2"></div>
        <div className="bg-circle-3"></div>
      </div>
    </header>
  );
};

export default Header;