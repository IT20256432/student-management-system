// components/StudentList.jsx
import React, { useState, useEffect } from 'react';
import { attendanceAPI, classAPI } from '../services/api'; // Add classAPI
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
  const [filterClass, setFilterClass] = useState(''); // New filter for class
  const [classes, setClasses] = useState([]); // Store classes data
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid' or 'table'
  const [sortBy, setSortBy] = useState('name'); // Sorting options
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const classesData = await classAPI.getAllClasses();
      setClasses(classesData || []);
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Filter students based on search and filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGrade = !filterGrade || student.grade === filterGrade;
    const matchesStatus = !filterStatus || student.status === filterStatus;
    const matchesClass = !filterClass || student.classId?.toString() === filterClass;

    return matchesSearch && matchesGrade && matchesStatus && matchesClass;
  });

  // Sort students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'id':
        return a.studentId.localeCompare(b.studentId);
      case 'grade':
        return a.grade.localeCompare(b.grade);
      case 'date':
        return new Date(b.registrationDate) - new Date(a.registrationDate);
      case 'class':
        return (a.className || '').localeCompare(b.className || '');
      default:
        return 0;
    }
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

  const getClassInfo = (student) => {
    if (!student.classId) return 'Not Assigned';
    const className = student.className || 'Unnamed Class';
    const classTeacher = student.classTeacher ? ` - ${student.classTeacher}` : '';
    const room = student.roomNumber ? ` (Room: ${student.roomNumber})` : '';
    return `${className}${classTeacher}${room}`;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterGrade('');
    setFilterStatus('');
    setFilterClass('');
    setSortBy('name');
  };

  // Statistics for dashboard view
  const getStatistics = () => {
    const stats = {
      total: filteredStudents.length,
      byGrade: {},
      byClass: {},
      byStatus: {},
      unassigned: filteredStudents.filter(s => !s.classId).length
    };

    filteredStudents.forEach(student => {
      // Count by grade
      stats.byGrade[student.grade] = (stats.byGrade[student.grade] || 0) + 1;
      
      // Count by class
      const className = student.className || 'Unassigned';
      stats.byClass[className] = (stats.byClass[className] || 0) + 1;
      
      // Count by status
      stats.byStatus[student.status] = (stats.byStatus[student.status] || 0) + 1;
    });

    return stats;
  };

  const statistics = getStatistics();

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
        <div className="header-controls">
          <div className="view-controls">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table
            </button>
          </div>
          <div className="statistics-brief">
            <span className="stat-badge total">{students.length} Total</span>
            <span className="stat-badge active">{statistics.byStatus.Active || 0} Active</span>
            <span className="stat-badge unassigned">{statistics.unassigned} Unassigned</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="quick-stats">
        <div className="stat-card">
          <h4>Grade Distribution</h4>
          {Object.entries(statistics.byGrade).map(([grade, count]) => (
            <div key={grade} className="stat-item">
              <span>{grade}:</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
        <div className="stat-card">
          <h4>Top Classes</h4>
          {Object.entries(statistics.byClass)
            .slice(0, 3)
            .map(([className, count]) => (
              <div key={className} className="stat-item">
                <span>{className}:</span>
                <strong>{count}</strong>
              </div>
            ))}
        </div>
        <div className="stat-card">
          <h4>Status Overview</h4>
          {Object.entries(statistics.byStatus).map(([status, count]) => (
            <div key={status} className="stat-item">
              <span>{status}:</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, ID, email, or class..."
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
            <select 
              value={filterClass} 
              onChange={(e) => setFilterClass(e.target.value)}
              className="filter-select"
              disabled={loadingClasses}
            >
              <option value="">All Classes</option>
              <option value="unassigned">Unassigned Students</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.className} ({cls.grade}) - {cls.classTeacher || 'No Teacher'}
                </option>
              ))}
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="name">Sort by Name</option>
              <option value="id">Sort by ID</option>
              <option value="grade">Sort by Grade</option>
              <option value="class">Sort by Class</option>
              <option value="date">Sort by Date (Newest)</option>
            </select>
            <button 
              className="reset-filters-btn"
              onClick={resetFilters}
              disabled={!searchTerm && !filterGrade && !filterStatus && !filterClass}
            >
              Clear Filters
            </button>
          </div>
        </div>
        <div className="filter-summary">
          Showing {filteredStudents.length} of {students.length} students
          {filterClass && ` in selected class`}
          {filterGrade && ` in ${filterGrade}`}
          {filterStatus && ` with status ${filterStatus}`}
        </div>
      </div>

      <div className="student-list-content">
        {/* Students Display based on View Mode */}
        <div className="students-section">
          <div className="section-header">
            <h3>Students ({filteredStudents.length})</h3>
            <div className="section-actions">
              <a 
                href="/students/register" 
                className="btn-primary"
              >
                + Register New Student
              </a>
              <a 
                href="/classes/assign" 
                className="btn-secondary"
              >
                Assign to Class
              </a>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="no-students">
              <p>No students found matching your criteria.</p>
              {searchTerm || filterGrade || filterStatus || filterClass ? (
                <button onClick={resetFilters} className="btn-primary">
                  Reset Filters
                </button>
              ) : (
                <a href="/students/register" className="btn-primary">
                  Register First Student
                </a>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="students-grid">
              {sortedStudents.map((student) => (
                <div 
                  key={student.id} 
                  className={`student-card ${selectedStudent === student.studentId ? 'selected' : ''} ${expandedStudent === student.id ? 'expanded' : ''}`}
                  onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                >
                  <div className="student-card-header">
                    <div className="student-avatar">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </div>
                    <div className="student-title">
                      <h4>{student.firstName} {student.lastName}</h4>
                      {getStudentStatusBadge(student.status)}
                    </div>
                  </div>
                  
                  <div className="student-card-body">
                    <div className="student-info-compact">
                      <p><strong>ID:</strong> {student.studentId}</p>
                      <p><strong>Grade:</strong> {student.grade}</p>
                      <p><strong>Class:</strong> {getClassInfo(student)}</p>
                    </div>
                    
                    {expandedStudent === student.id && (
                      <div className="student-details-expanded">
                        <p><strong>Email:</strong> {student.email}</p>
                        <p><strong>Phone:</strong> {formatPhone(student.phone)}</p>
                        <p><strong>Registered:</strong> {formatDate(student.registrationDate)}</p>
                        {student.subjects && (
                          <p><strong>Subjects:</strong> {student.subjects}</p>
                        )}
                        <div className="expanded-actions">
                          <button 
                            className="view-attendance-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadStudentAttendance(student.studentId);
                            }}
                            disabled={loadingAttendance}
                          >
                            View Attendance
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === 'table' ? (
            // Table View
            <div className="students-table-container">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Grade</th>
                    <th>Class</th>
                    <th>Status</th>
                    <th>Contact</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((student) => (
                    <tr key={student.id} className={selectedStudent === student.studentId ? 'selected-row' : ''}>
                      <td><strong>{student.studentId}</strong></td>
                      <td>
                        <div className="student-name-cell">
                          {student.firstName} {student.lastName}
                        </div>
                      </td>
                      <td>{student.grade}</td>
                      <td>
                        <div className="class-info-cell">
                          <div>{getClassInfo(student)}</div>
                          {student.classTeacher && (
                            <small>Teacher: {student.classTeacher}</small>
                          )}
                        </div>
                      </td>
                      <td>{getStudentStatusBadge(student.status)}</td>
                      <td>
                        <div className="contact-cell">
                          <div>{student.email}</div>
                          <small>{formatPhone(student.phone)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-sm view-btn"
                            onClick={() => loadStudentAttendance(student.studentId)}
                          >
                            Attendance
                          </button>
                          <button 
                            className="btn-sm edit-btn"
                            onClick={() => window.location.href = `/students/edit/${student.id}`}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn-sm delete-btn"
                            onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // List View (Default)
            <div className="students-list">
              {sortedStudents.map((student) => (
                <div 
                  key={student.id} 
                  className={`student-list-item ${selectedStudent === student.studentId ? 'selected' : ''}`}
                >
                  <div className="item-main">
                    <div className="item-avatar">
                      {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                    </div>
                    <div className="item-info">
                      <div className="item-header">
                        <h4>{student.firstName} {student.lastName}</h4>
                        {getStudentStatusBadge(student.status)}
                      </div>
                      <div className="item-details">
                        <span><strong>ID:</strong> {student.studentId}</span>
                        <span><strong>Grade:</strong> {student.grade}</span>
                        <span><strong>Class:</strong> {getClassInfo(student)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="view-attendance-btn"
                      onClick={() => loadStudentAttendance(student.studentId)}
                      disabled={loadingAttendance}
                    >
                      Attendance
                    </button>
                    <button 
                      className="edit-btn"
                      onClick={() => window.location.href = `/students/edit/${student.id}`}
                    >
                      Edit
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
              <div className="header-actions">
                <button 
                  className="close-btn"
                  onClick={() => setSelectedStudent(null)}
                >
                  ×
                </button>
              </div>
            </div>
            {attendanceSummary && (
              <div className="attendance-stats">
                <div className="stat-card">
                  <h4>Attendance Summary</h4>
                  <div className="stat-grid">
                    <div className="stat-item">
                      <span className="stat-label">Present:</span>
                      <span className="stat-value present">{attendanceSummary.presentDays}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Absent:</span>
                      <span className="stat-value absent">{attendanceSummary.absentDays}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Days:</span>
                      <span className="stat-value">{attendanceSummary.totalDays}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Attendance Rate:</span>
                      <span className="stat-value percentage">
                        {attendanceSummary.attendancePercentage?.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    <span>Class/Subject</span>
                    <span>Method</span>
                  </div>
                  {attendanceRecords.slice(0, 15).map((record) => (
                    <div key={record.id} className="table-row">
                      <span>{formatDate(record.attendanceDate)}</span>
                      <span>{formatDate(record.scanTime)}</span>
                      <span>{getStatusBadge(record.status)}</span>
                      <span>
                        {record.className || 'N/A'}
                        {record.subject && ` - ${record.subject}`}
                      </span>
                      <span className="scan-method">{record.scanMethod}</span>
                    </div>
                  ))}
                </div>
                {attendanceRecords.length > 15 && (
                  <div className="table-footer">
                    <p>Showing 15 of {attendanceRecords.length} records</p>
                    <button className="view-all-btn">View All</button>
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