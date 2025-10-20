import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import StudentForm from './components/StudentForm';
import StudentList from './components/StudentList';
import AttendanceReports from './components/AttendanceReports';
import AttendanceScanner from './components/AttendanceScanner'; 
import ClassManager from './components/ClassManager';
import ScheduleManager from './components/ScheduleManager';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<StudentForm />} />
            <Route path="/students" element={<StudentList />} />
            <Route path="/reports" element={<AttendanceReports />} />
            <Route path="/attendance" element={<AttendanceScanner />} />
            <Route path="/classes" element={<ClassManager />} />
            <Route path="/schedules" element={<ScheduleManager />} />
            {/* Add these temporary routes for missing components */}
            <Route path="/manual-attendance" element={<ManualAttendance />} />
            <Route path="/today-attendance" element={<TodayAttendance />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

// Temporary components for missing routes
const ManualAttendance = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Manual Attendance</h2>
    <p>This feature is coming soon...</p>
  </div>
);

const TodayAttendance = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Today's Attendance</h2>
    <p>This feature is coming soon...</p>
  </div>
);

export default App;