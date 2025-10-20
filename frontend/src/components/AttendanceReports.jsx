// components/AttendanceReports.jsx
import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';
import { formatDate, formatTime, capitalizeWords } from '../utils/formatters';
import { GRADES, ATTENDANCE_STATUS } from '../utils/constants';
import './AttendanceReports.css';

const AttendanceReports = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ 
    present: 0, 
    late: 0, 
    absent: 0, 
    total: 0,
    percentage: 0 
  });
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadAttendanceData();
  }, [selectedDate]);

  const loadAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await attendanceAPI.getByDate(selectedDate);
      const attendanceList = Array.isArray(data) ? data : [];
      
      setAttendanceData(attendanceList);
      calculateStats(attendanceList);
    } catch (err) {
      setError('Failed to load attendance data: ' + err.message);
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const present = data.filter(a => a.status === 'PRESENT').length;
    const late = data.filter(a => a.status === 'LATE').length;
    const absent = data.filter(a => a.status === 'ABSENT').length;
    const total = data.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    setStats({
      present,
      late,
      absent,
      total,
      percentage
    });
  };

  // Filter attendance data
  const filteredAttendance = attendanceData.filter(record => {
    const matchesGrade = !filterGrade || record.grade === filterGrade;
    const matchesStatus = !filterStatus || record.status === filterStatus;
    return matchesGrade && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const statusClass = status === 'PRESENT' ? 'present' : 
                       status === 'LATE' ? 'late' : 'absent';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const exportToCSV = () => {
    const headers = ['Student ID', 'Name', 'Grade', 'Scan Time', 'Status', 'Method'];
    const csvData = filteredAttendance.map(record => [
      record.studentId,
      record.studentName,
      record.grade,
      formatTime(record.scanTime),
      record.status,
      record.scanMethod
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Attendance Reports</h2>
        <div className="header-controls">
          <div className="date-selector">
            <label htmlFor="report-date">Select Date: </label>
            <input
              type="date"
              id="report-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button 
            className="refresh-btn"
            onClick={loadAttendanceData}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Present</h3>
            <div className="stat-number">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card present">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>On Time</h3>
            <div className="stat-number">{stats.present}</div>
          </div>
        </div>
        <div className="stat-card late">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>Late</h3>
            <div className="stat-number">{stats.late}</div>
          </div>
        </div>
        <div className="stat-card percentage">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Attendance Rate</h3>
            <div className="stat-number">{stats.percentage}%</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="report-filters">
        <div className="filter-group">
          <label htmlFor="filter-grade">Filter by Grade:</label>
          <select
            id="filter-grade"
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
          >
            <option value="">All Grades</option>
            {GRADES.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-status">Filter by Status:</label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            {ATTENDANCE_STATUS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance List */}
      <div className="attendance-list-section">
        <div className="section-header">
          <h3>Attendance for {formatDate(selectedDate)}</h3>
          <div className="section-actions">
            <button 
              className="export-btn"
              onClick={exportToCSV}
              disabled={filteredAttendance.length === 0}
            >
              📥 Export CSV
            </button>
            <button 
              className="print-btn"
              onClick={() => window.print()}
            >
              🖨️ Print
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={loadAttendanceData} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-message">
            <div className="spinner"></div>
            <p>Loading attendance data...</p>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="no-data-message">
            <p>No attendance records found for the selected date and filters.</p>
          </div>
        ) : (
          <div className="attendance-table-container">
            <div className="attendance-table">
              <div className="table-header">
                <span>Student ID</span>
                <span>Name</span>
                <span>Grade</span>
                <span>Scan Time</span>
                <span>Status</span>
                <span>Method</span>
              </div>
              {filteredAttendance.map((record) => (
                <div key={record.id} className="table-row">
                  <span className="student-id">{record.studentId}</span>
                  <span className="student-name">{record.studentName}</span>
                  <span className="grade">{record.grade}</span>
                  <span className="scan-time">{formatTime(record.scanTime)}</span>
                  <span className="status">{getStatusBadge(record.status)}</span>
                  <span className="method">{record.scanMethod}</span>
                </div>
              ))}
            </div>
            <div className="table-footer">
              <p>Showing {filteredAttendance.length} records</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {filteredAttendance.length > 0 && (
        <div className="summary-section">
          <h4>Quick Summary</h4>
          <div className="summary-grid">
            <div className="summary-item">
              <strong>Total Records:</strong> {filteredAttendance.length}
            </div>
            <div className="summary-item">
              <strong>On Time Rate:</strong> {stats.present}/{stats.total} ({stats.percentage}%)
            </div>
            <div className="summary-item">
              <strong>Late Arrivals:</strong> {stats.late}
            </div>
            <div className="summary-item">
              <strong>Most Common Grade:</strong> {(() => {
                const gradeCount = {};
                filteredAttendance.forEach(record => {
                  gradeCount[record.grade] = (gradeCount[record.grade] || 0) + 1;
                });
                return Object.keys(gradeCount).reduce((a, b) => 
                  gradeCount[a] > gradeCount[b] ? a : b, '');
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReports;