// components/ProtectedRoute/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Check authentication
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role || '';
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If roles are specified but user doesn't have required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div className="unauthorized">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }
  
  // User is authenticated and has required role
  return children;
};

export default ProtectedRoute;