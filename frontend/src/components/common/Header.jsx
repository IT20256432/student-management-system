import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>EduRegister</h1>
          <span>Student Management System</span>
        </Link>
        <nav className="nav">
          <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
          <Link to="/register" className={isActive('/register')}>Register</Link>
          <Link to="/attendance" className={isActive('/attendance')}>Attendance</Link>
          <Link to="/students" className={isActive('/students')}>Students</Link>
          <Link to="/reports" className={isActive('/reports')}>Reports</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;