import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole, requiredRoles }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userStr = localStorage.getItem('user');
  let userRole = '';
  
  // Parse user data
  try {
    if (userStr) {
      const user = JSON.parse(userStr);
      userRole = user.role || user.userRole || '';
    }
  } catch (e) {
    console.error('Error parsing user data:', e);
  }

  console.log('🎭 ProtectedRoute check:', { 
    isAuthenticated, 
    userRole, 
    requiredRole, 
    requiredRoles 
  });

  // Check authentication first
  if (!isAuthenticated) {
    console.log('❌ User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check role requirements
  if (requiredRoles && !requiredRoles.includes(userRole)) {
    console.log(`❌ User role ${userRole} not in required roles:`, requiredRoles);
    return (
      <div className="unauthorized">
        <h1>🚫 Access Denied</h1>
        <p>Required roles: {requiredRoles.join(', ')}</p>
        <p>Your role: {userRole}</p>
      </div>
    );
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log(`❌ User role ${userRole} doesn't match required role: ${requiredRole}`);
    return (
      <div className="unauthorized">
        <h1>🚫 Access Denied</h1>
        <p>Required role: {requiredRole}</p>
        <p>Your role: {userRole}</p>
      </div>
    );
  }

  console.log('✅ Access granted');
  return children;
};

export default ProtectedRoute;