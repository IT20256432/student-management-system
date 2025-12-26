import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Dashboard from './components/Dashboard';
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
import ManualAttendance from './components/ManualAttendance';

// Temporary placeholder components for other routes
const StudentReports = () => <div className="coming-soon"><h2>Student Reports</h2></div>;
const OverdueFees = () => <div className="coming-soon"><h2>Overdue Fees</h2></div>;
const FeeStructure = () => <div className="coming-soon"><h2>Fee Structure</h2></div>;
const BulkActions = () => <div className="coming-soon"><h2>Bulk Actions</h2></div>;
const SystemSettings = () => <div className="coming-soon"><h2>System Settings</h2></div>;
const TodayAttendance = () => <div className="coming-soon"><h2>Today Attendance</h2></div>;
const AttendanceSessions = () => <div className="coming-soon"><h2>Attendance Sessions</h2></div>;
const QRGenerator = () => <div className="coming-soon"><h2>QR Generator</h2></div>;
const DataExport = () => <div className="coming-soon"><h2>Data Export</h2></div>;
const UnassignedStudents = () => <div className="coming-soon"><h2>Unassigned Students</h2></div>;
const NotFound = () => <div className="not-found"><h1>404 - Page Not Found</h1></div>;

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Default route - redirect to dashboard if authenticated, otherwise login */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* Protected Routes Layout - Uses wildcard * to match nested routes */}
          <Route path="/*" element={<ProtectedLayout />} />
          
          {/* 404 Route for unmatched public routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

// Protected Layout with Header/Footer - handles all protected routes
const ProtectedLayout = () => {
  // Check authentication
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Header />
      <main className="main-content">
        <Routes>
          {/* All protected routes go here */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="register" element={<StudentForm />} />
          <Route path="students" element={<StudentList />} />
          <Route path="reports" element={<AttendanceReports />} />
          <Route path="attendance" element={<AttendanceScanner />} />
          <Route path="classes" element={<ClassManager />} />
          <Route path="schedules" element={<ScheduleManager />} />
          <Route path="fee-payment" element={<FeePaymentScanner />} />
          <Route path="fee-management" element={<FeeManagement />} />
          <Route path="payment-tracker" element={<PaymentTracker />} />
          
          {/* Admin Only Routes */}
          <Route path="manual-attendance" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
              <ManualAttendance />
            </ProtectedRoute>
          } />
          <Route path="student-reports" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <StudentReports />
            </ProtectedRoute>
          } />
          <Route path="overdue-fees" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <OverdueFees />
            </ProtectedRoute>
          } />
          <Route path="fee-structure" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <FeeStructure />
            </ProtectedRoute>
          } />
          <Route path="bulk-actions" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <BulkActions />
            </ProtectedRoute>
          } />
          <Route path="system-settings" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SystemSettings />
            </ProtectedRoute>
          } />
          
          {/* Teacher & Admin Routes */}
          <Route path="today-attendance" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
              <TodayAttendance />
            </ProtectedRoute>
          } />
          <Route path="attendance-sessions" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
              <AttendanceSessions />
            </ProtectedRoute>
          } />
          
          {/* Additional Routes */}
          <Route path="qr-generator" element={<QRGenerator />} />
          <Route path="data-export" element={<DataExport />} />
          <Route path="students/unassigned" element={<UnassignedStudents />} />
          
          {/* Catch-all for protected routes - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default App;