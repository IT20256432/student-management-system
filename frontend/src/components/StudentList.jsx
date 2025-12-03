// components/StudentList.jsx
import React, { useState } from 'react';
import {  attendanceAPI } from '../services/api';
import { useStudents } from '../hooks/useStudents';
import { formatDate, formatPhone } from '../utils/formatters';
import { GRADES, STATUSES } from '../utils/constants';
import './StudentList.css';

const StudentList = () => {
  const { students, loading, error, deleteStudent } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = !filterGrade || student.grade === filterGrade;
    const matchesStatus = !filterStatus || student.status === filterStatus;

    return matchesSearch && matchesGrade && matchesStatus;
  });

  const loadStudentAttendance = async (studentId) => {
    setLoadingAttendance(true);
    try {
      const [records, summary] = await Promise.all([
        attendanceAPI.getByStudent(studentId),
        attendanceAPI.getSummary(studentId)
      ]);
      setAttendanceRecords(records || []);
      setAttendanceSummary(summary);
      setSelectedStudent(studentId);
    } catch (err) {
      console.error('Error loading attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}?`)) {
      try {
        await deleteStudent(studentId);
        if (selectedStudent === studentId) {
          setSelectedStudent(null);
          setAttendanceRecords([]);
          setAttendanceSummary(null);
        }
      } catch (err) {
        alert('Error deleting student: ' + err.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = status === 'PRESENT' ? 'present' : 
                       status === 'LATE' ? 'late' : 'absent';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const getStudentStatusBadge = (status) => {
    const statusClass = status === 'Active' ? 'active' : 
                       status === 'Inactive' ? 'inactive' : 'suspended';
    return <span className={`student-status-badge ${statusClass}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error Loading Students</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="student-list-container">
      <div className="student-list-header">
        <h2>Student Management</h2>
        <p>Total Students: {students.length}</p>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select 
            value={filterGrade} 
            onChange={(e) => setFilterGrade(e.target.value)}
            className="filter-select"
          >
            <option value="">All Grades</option>
            {GRADES.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="student-list-content">
        {/* Students Grid */}
        <div className="students-section">
          <h3>Students ({filteredStudents.length})</h3>
          {filteredStudents.length === 0 ? (
            <div className="no-students">
              <p>No students found matching your criteria.</p>
            </div>
          ) : (
            <div className="students-grid">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id} 
                  className={`student-card ${selectedStudent === student.studentId ? 'selected' : ''}`}
                >
                  <div className="student-info">
                    <div className="student-header">
                      <h4>{student.firstName} {student.lastName}</h4>
                      {getStudentStatusBadge(student.status)}
                    </div>
                    <div className="student-details">
                      <p><strong>ID:</strong> {student.studentId}</p>
                      <p><strong>Grade:</strong> {student.grade}</p>
                      <p><strong>Email:</strong> {student.email}</p>
                      <p><strong>Phone:</strong> {formatPhone(student.phone)}</p>
                      <p><strong>Registered:</strong> {formatDate(student.registrationDate)}</p>
                      {student.subjects && (
                        <p><strong>Subjects:</strong> {student.subjects.split(',').slice(0, 3).join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="student-actions">
                    <button 
                      className="view-attendance-btn"
                      onClick={() => loadStudentAttendance(student.studentId)}
                      disabled={loadingAttendance}
                    >
                      {loadingAttendance && selectedStudent === student.studentId ? (
                        'Loading...'
                      ) : (
                        'View Attendance'
                      )}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Section */}
        {selectedStudent && (
          <div className="attendance-section">
            <div className="attendance-header">
              <h3>Attendance Records</h3>
              {attendanceSummary && (
                <div className="attendance-stats">
                  <div className="stat-item">
                    <span className="stat-label">Present:</span>
                    <span className="stat-value present">{attendanceSummary.presentDays}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Absent:</span>
                    <span className="stat-value absent">{attendanceSummary.absentDays}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Rate:</span>
                    <span className="stat-value percentage">
                      {attendanceSummary.attendancePercentage?.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {attendanceRecords.length === 0 ? (
              <div className="no-records">
                <p>No attendance records found for this student.</p>
              </div>
            ) : (
              <div className="attendance-table-container">
                <div className="attendance-table">
                  <div className="table-header">
                    <span>Date</span>
                    <span>Time</span>
                    <span>Status</span>
                    <span>Method</span>
                  </div>
                  {attendanceRecords.slice(0, 10).map((record) => (
                    <div key={record.id} className="table-row">
                      <span>{formatDate(record.attendanceDate)}</span>
                      <span>{formatDate(record.scanTime)}</span>
                      <span>{getStatusBadge(record.status)}</span>
                      <span className="scan-method">{record.scanMethod}</span>
                    </div>
                  ))}
                </div>
                {attendanceRecords.length > 10 && (
                  <div className="table-footer">
                    <p>Showing 10 of {attendanceRecords.length} records</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentList;