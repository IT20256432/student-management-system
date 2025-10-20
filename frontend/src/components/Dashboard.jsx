import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI, attendanceAPI, classAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    presentToday: 0,
    attendanceRate: 0
  });
  const [classStats, setClassStats] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      
      console.log('📊 Loading dashboard data...');
      
      const [studentsResponse, attendanceResponse, classesResponse, sessionsResponse] = await Promise.all([
        studentAPI.getAll(),
        attendanceAPI.getByDate(today),
        classAPI.getAllActive(),
        attendanceAPI.getActiveSessions()
      ]);

      console.log('✅ Students data:', studentsResponse);
      console.log('✅ Attendance data:', attendanceResponse);
      console.log('✅ Classes data:', classesResponse);
      console.log('✅ Sessions data:', sessionsResponse);

      // Handle students data
      const studentList = Array.isArray(studentsResponse) ? studentsResponse : [];
      console.log('📝 Processed student list:', studentList);

      // Handle attendance data
      const attendanceList = Array.isArray(attendanceResponse) ? attendanceResponse : [];
      
      // Handle classes data
      const classList = Array.isArray(classesResponse) ? classesResponse : [];
      
      // Handle sessions data
      const sessionList = Array.isArray(sessionsResponse) ? sessionsResponse : [];

      // Calculate statistics
      const presentToday = attendanceList.filter(a => 
        a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      
      const attendanceRate = studentList.length > 0 ? 
        Math.round((presentToday / studentList.length) * 100) : 0;

      setStats({
        totalStudents: studentList.length,
        todayAttendance: attendanceList.length,
        presentToday,
        attendanceRate
      });

      console.log('📈 Statistics calculated:', {
        totalStudents: studentList.length,
        todayAttendance: attendanceList.length,
        presentToday,
        attendanceRate
      });

      // Load class-wise statistics
      const classStatistics = await Promise.all(
        classList.map(async (cls) => {
          try {
            const classStudents = await studentAPI.getByClass(cls.id);
            const classAttendance = attendanceList.filter(a => 
              classStudents.some(s => s.studentId === a.studentId)
            );
            const presentCount = classAttendance.filter(a => 
              a.status === 'PRESENT' || a.status === 'LATE'
            ).length;
            
            return {
              classId: cls.id,
              className: cls.className,
              totalStudents: classStudents.length,
              presentCount,
              attendanceRate: classStudents.length > 0 ? 
                Math.round((presentCount / classStudents.length) * 100) : 0,
              classTeacher: cls.classTeacher,
              roomNumber: cls.roomNumber
            };
          } catch (error) {
            console.error(`Error loading stats for class ${cls.className}:`, error);
            return {
              classId: cls.id,
              className: cls.className,
              totalStudents: 0,
              presentCount: 0,
              attendanceRate: 0,
              classTeacher: cls.classTeacher,
              roomNumber: cls.roomNumber
            };
          }
        })
      );

      setClassStats(classStatistics);
      setActiveSessions(sessionList);
      
      // Get recent students (last 5 registered)
      const sortedStudents = [...studentList].sort((a, b) => 
        new Date(b.registrationDate) - new Date(a.registrationDate)
      );
      const recent = sortedStudents.slice(0, 5);
      setRecentStudents(recent);
      
      setTodayAttendance(attendanceList.slice(0, 10));

      console.log('🎯 Recent students:', recent);
      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError('Failed to load dashboard data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = status === 'PRESENT' ? 'present' : 
                       status === 'LATE' ? 'late' : 'absent';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const refreshDashboard = () => {
    loadDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">❌</div>
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button onClick={refreshDashboard} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Student Management Dashboard</h1>
        <button onClick={refreshDashboard} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h1>Welcome to Student Management System</h1>
          <p>Manage classes, track attendance, and generate reports all in one place.</p>
        </div>

        {/* Statistics Cards */}
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon total-students">👨‍🎓</div>
            <div className="stat-info">
              <h3>Total Students</h3>
              <div className="stat-number">{stats.totalStudents}</div>
              <p>Registered in system</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon today-attendance">📅</div>
            <div className="stat-info">
              <h3>Today's Attendance</h3>
              <div className="stat-number">{stats.todayAttendance}</div>
              <p>Students marked today</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon present-today">✅</div>
            <div className="stat-info">
              <h3>Present Today</h3>
              <div className="stat-number">{stats.presentToday}</div>
              <p>On time arrivals</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon attendance-rate">📊</div>
            <div className="stat-info">
              <h3>Attendance Rate</h3>
              <div className="stat-number">{stats.attendanceRate}%</div>
              <p>Overall today</p>
            </div>
          </div>
        </div>



        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="active-sessions-section">
            <h2>Active Class Sessions</h2>
            <div className="sessions-grid">
              {activeSessions.map(session => (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <h3>{session.schoolClass?.className || 'Unknown Class'}</h3>
                    <span className="session-status active">ACTIVE</span>
                  </div>
                  <div className="session-details">
                    <p><strong>Subject:</strong> {session.subject}</p>
                    <p><strong>Time:</strong> {session.scheduledStartTime} - {session.scheduledEndTime}</p>
                    <p><strong>Teacher:</strong> {session.schoolClass?.classTeacher || 'N/A'}</p>
                    <p><strong>Room:</strong> {session.schoolClass?.roomNumber || 'N/A'}</p>
                  </div>
                  <Link to={`/attendance?session=${session.id}`} className="session-action-btn">
                    Take Attendance
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Class-wise Statistics */}
        {classStats.length > 0 && (
          <div className="class-stats-section">
            <h2>Class-wise Attendance Today</h2>
            <div className="class-stats-grid">
              {classStats.map(classStat => (
                <div key={classStat.classId} className="class-stat-card">
                  <div className="class-header">
                    <h3>{classStat.className}</h3>
                    <span className="attendance-rate">{classStat.attendanceRate}%</span>
                  </div>
                  <div className="class-details">
                    <p><strong>Teacher:</strong> {classStat.classTeacher}</p>
                    <p><strong>Room:</strong> {classStat.roomNumber}</p>
                  </div>
                  <div className="attendance-breakdown">
                    <div className="attendance-bar">
                      <div 
                        className="attendance-fill" 
                        style={{ width: `${classStat.attendanceRate}%` }}
                      ></div>
                    </div>
                    <div className="attendance-numbers">
                      <span>{classStat.presentCount}/{classStat.totalStudents} Present</span>
                    </div>
                  </div>
                  <Link to={`/class/${classStat.classId}/attendance`} className="view-class-btn">
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/register" className="action-card">
              <div className="action-icon">👨‍🎓</div>
              <div className="action-content">
                <h3>Register Student</h3>
                <p>Add new student to the system</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/attendance" className="action-card">
              <div className="action-icon">📱</div>
              <div className="action-content">
                <h3>QR Attendance</h3>
                <p>Scan QR codes for attendance</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/classes" className="action-card">
              <div className="action-icon">🏫</div>
              <div className="action-content">
                <h3>Manage Classes</h3>
                <p>Create and manage classes</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/students" className="action-card">
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h3>View Students</h3>
                <p>Browse and manage students</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/schedules" className="action-card">
              <div className="action-icon">📅</div>
              <div className="action-content">
                <h3>Class Schedules</h3>
                <p>Manage class timetables</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/reports" className="action-card">
              <div className="action-icon">📈</div>
              <div className="action-content">
                <h3>Attendance Reports</h3>
                <p>Generate reports and analytics</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="recent-activity">
          <div className="recent-students">
            <h3>Recently Registered Students</h3>
            {recentStudents.length === 0 ? (
              <div className="no-data">
                <p>No students registered yet.</p>
                <Link to="/register" className="register-link">
                  Register First Student
                </Link>
              </div>
            ) : (
              <>
                <div className="students-list">
                  {recentStudents.map((student) => (
                    <div key={student.id} className="student-item">
                      <div className="student-avatar">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </div>
                      <div className="student-details">
                        <h4>{student.firstName} {student.lastName}</h4>
                        <p>{student.studentId} • {student.grade}</p>
                        {student.className && (
                          <p className="class-info">{student.className}</p>
                        )}
                      </div>
                      <div className="registration-date">
                        {new Date(student.registrationDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/students" className="view-all-link">
                  View All Students →
                </Link>
              </>
            )}
          </div>

          <div className="today-attendance">
            <h3>Today's Attendance</h3>
            {todayAttendance.length === 0 ? (
              <div className="no-data">
                <p>No attendance recorded today.</p>
                <Link to="/attendance" className="take-attendance-link">
                  Take Attendance
                </Link>
              </div>
            ) : (
              <>
                <div className="attendance-list">
                  {todayAttendance.map((record) => (
                    <div key={record.id} className="attendance-item">
                      <div className="student-info">
                        <strong>{record.studentName}</strong>
                        <span>{record.grade}</span>
                        {record.className && (
                          <span className="class-name">{record.className}</span>
                        )}
                      </div>
                      <div className="attendance-details">
                        {getStatusBadge(record.status)}
                        <span className="scan-time">
                          {new Date(record.scanTime).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/today-attendance" className="view-all-link">
                  View Full Report →
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;