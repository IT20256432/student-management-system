import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard'; // Make sure this path is correct
import StudentForm from './components/StudentForm';
import StudentList from './components/StudentList';
import AttendanceReports from './components/AttendanceReports';
import AttendanceScanner from './components/AttendanceScanner'; 
import ClassManager from './components/ClassManager';
import ScheduleManager from './components/ScheduleManager';
import FeePaymentScanner from './components/FeePaymentScanner';
import FeeManagement from './components/FeeManagement';
import PaymentTracker from './components/PaymentTracker';
import Login from './components/Login/Login';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import './App.css';

// If component files don't exist in these paths, create them or update the paths
// For now, let's create placeholder components

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes - No Header/Footer */}
          <Route path="/login" element={<Login />} />
          
          {/* Default route - redirect to login or dashboard based on auth */}
          <Route path="/" element={<AuthRedirect />} />
          
          {/* Protected Routes - With Header/Footer */}
          <Route path="/*" element={
            <ProtectedRouteWrapper>
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/register" element={<StudentForm />} />
                  <Route path="/students" element={<StudentList />} />
                  <Route path="/reports" element={<AttendanceReports />} />
                  <Route path="/attendance" element={<AttendanceScanner />} />
                  <Route path="/classes" element={<ClassManager />} />
                  <Route path="/schedules" element={<ScheduleManager />} />
                  <Route path="/fee-payment" element={<FeePaymentScanner />} />
                  <Route path="/fee-management" element={<FeeManagement />} />
                  <Route path="/payment-tracker" element={<PaymentTracker />} />
                  
                  {/* Admin Only Routes */}
                  <Route path="/manual-attendance" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <ManualAttendance />
                    </ProtectedRoute>
                  } />
                  <Route path="/student-reports" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <StudentReports />
                    </ProtectedRoute>
                  } />
                  <Route path="/overdue-fees" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <OverdueFees />
                    </ProtectedRoute>
                  } />
                  <Route path="/fee-structure" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <FeeStructure />
                    </ProtectedRoute>
                  } />
                  <Route path="/bulk-actions" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <BulkActions />
                    </ProtectedRoute>
                  } />
                  <Route path="/system-settings" element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <SystemSettings />
                    </ProtectedRoute>
                  } />
                  
                  {/* Teacher & Admin Routes */}
                  <Route path="/today-attendance" element={
                    <ProtectedRoute requiredRoles={['ADMIN', 'TEACHER']}>
                      <TodayAttendance />
                    </ProtectedRoute>
                  } />
                  <Route path="/attendance-sessions" element={
                    <ProtectedRoute requiredRoles={['ADMIN', 'TEACHER']}>
                      <AttendanceSessions />
                    </ProtectedRoute>
                  } />
                  
                  {/* Additional Routes */}
                  <Route path="/qr-generator" element={<QRGenerator />} />
                  <Route path="/data-export" element={<DataExport />} />
                  <Route path="/students/unassigned" element={<UnassignedStudents />} />
                  
                  {/* 404 Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </ProtectedRouteWrapper>
          } />
        </Routes>
      </div>
    </Router>
  );
}

// Auth Redirect Component - Updated to check correct values
const AuthRedirect = () => {
  // FIX: Check authToken and user instead of isAuthenticated
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  const isAuthenticated = !!token && !!user;

  console.log('🔄 AuthRedirect - Checking authentication:', { 
    tokenExists: !!token,
    userExists: !!user,
    isAuthenticated
  });

  if (isAuthenticated) {
    console.log('✅ User authenticated, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  } else {
    console.log('❌ User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
};

// Main Protected Route Wrapper - FIXED VERSION
const ProtectedRouteWrapper = ({ children }) => {
  // FIX: Use isAuthenticated instead of token
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || user.userRole || '';

  console.log('🔐 ProtectedRouteWrapper Check:', { 
    isAuthenticated,
    storedValue: localStorage.getItem('isAuthenticated'),
    userRole,
    userData: user
  });

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ User authenticated, showing protected content');
  return children;
};

// Temporary components for missing routes
const ManualAttendance = () => (
  <div className="coming-soon">
    <h2>Manual Attendance</h2>
    <p>Record attendance manually for students</p>
    <div className="feature-preview">
      <p>📝 This feature will allow teachers to manually mark student attendance</p>
    </div>
  </div>
);

const TodayAttendance = () => (
  <div className="coming-soon">
    <h2>Today's Attendance</h2>
    <p>View and manage today's attendance records</p>
    <div className="feature-preview">
      <p>📊 Real-time attendance overview for today's classes</p>
    </div>
  </div>
);

const StudentReports = () => (
  <div className="coming-soon">
    <h2>Student Reports</h2>
    <p>Comprehensive student performance and analytics</p>
    <div className="feature-preview">
      <p>📈 Detailed student progress reports and analytics</p>
    </div>
  </div>
);

const OverdueFees = () => (
  <div className="coming-soon">
    <h2>Overdue Fees</h2>
    <p>Track and manage overdue fee payments</p>
    <div className="feature-preview">
      <p>💰 Monitor students with pending fee payments</p>
    </div>
  </div>
);

const FeeStructure = () => (
  <div className="coming-soon">
    <h2>Fee Structure Management</h2>
    <p>Configure and manage class fee structures</p>
    <div className="feature-preview">
      <p>🏷️ Set up and modify fee structures for different classes</p>
    </div>
  </div>
);

const AttendanceSessions = () => (
  <div className="coming-soon">
    <h2>Attendance Sessions</h2>
    <p>Manage class attendance sessions and schedules</p>
    <div className="feature-preview">
      <p>⏰ Create and manage attendance sessions for classes</p>
    </div>
  </div>
);

const QRGenerator = () => (
  <div className="coming-soon">
    <h2>QR Code Generator</h2>
    <p>Generate QR codes for students and classes</p>
    <div className="feature-preview">
      <p>🔳 Generate and print QR codes for student IDs</p>
    </div>
  </div>
);

const BulkActions = () => (
  <div className="coming-soon">
    <h2>Bulk Actions</h2>
    <p>Perform bulk operations on student data</p>
    <div className="feature-preview">
      <p>⚡ Bulk student registration and data management</p>
    </div>
  </div>
);

const DataExport = () => (
  <div className="coming-soon">
    <h2>Data Export</h2>
    <p>Export system data in various formats</p>
    <div className="feature-preview">
      <p>📤 Export student data, reports, and analytics</p>
    </div>
  </div>
);

const SystemSettings = () => (
  <div className="coming-soon">
    <h2>System Settings</h2>
    <p>Configure system preferences and settings</p>
    <div className="feature-preview">
      <p>⚙️ System configuration and administration settings</p>
    </div>
  </div>
);

const UnassignedStudents = () => (
  <div className="coming-soon">
    <h2>Unassigned Students</h2>
    <p>Manage students not assigned to any class</p>
    <div className="feature-preview">
      <p>🎯 View and assign students to appropriate classes</p>
    </div>
  </div>
);

const Unauthorized = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || user.userRole || 'Not logged in';

  return (
    <div className="unauthorized">
      <div className="error-container">
        <h1>🚫 Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <p>Your current role: <strong>{userRole}</strong></p>
        <button 
          onClick={() => window.history.back()} 
          className="back-btn"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

const NotFound = () => (
  <div className="not-found">
    <div className="error-container">
      <h1>🔍 404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <button 
        onClick={() => window.location.href = '/dashboard'} 
        className="home-btn"
      >
        Go to Dashboard
      </button>
    </div>
  </div>
);

// Add CSS styles
const styles = `
.coming-soon {
  padding: 40px;
  text-align: center;
  max-width: 800px;
  margin: 40px auto;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.coming-soon h2 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.feature-preview {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 30px;
  margin-top: 30px;
  border: 1px dashed #dee2e6;
}

.unauthorized, .not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.error-container {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.error-container h1 {
  color: #e74c3c;
  margin-bottom: 20px;
}

.error-container p {
  color: #666;
  margin-bottom: 10px;
}

.back-btn, .home-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  transition: background 0.3s;
}

.back-btn:hover, .home-btn:hover {
  background: #2980b9;
}

.home-btn {
  background: #2ecc71;
}

.home-btn:hover {
  background: #27ae60;
}

/* Ensure main content has proper spacing */
.main-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default App;