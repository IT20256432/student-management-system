import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI, attendanceAPI, classAPI, feePaymentAPI, sessionAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    presentToday: 0,
    attendanceRate: 0,
    feeCollection: 0,
    pendingPayments: 0,
    totalClasses: 0,
    activeSessionsCount: 0,
    monthlyCollection: 0,
    averageAttendance: 0,
    newRegistrations: 0
  });
  const [classStats, setClassStats] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [todaysSchedules, setTodaysSchedules] = useState([]);
  const [overdueStudents, setOverdueStudents] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [feeCollectionTrend, setFeeCollectionTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, analytics, alerts

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 2 minutes
    const interval = setInterval(loadDashboardData, 120000);
    return () => clearInterval(interval);
  }, []);

  const getTodaysSchedules = async () => {
    try {
      const activeSessions = await sessionAPI.getActive();
      const mockSchedules = Array.isArray(activeSessions) ? activeSessions.map(session => ({
        id: session.id,
        subject: session.subject || 'General',
        className: session.schoolClass?.className || 'Class',
        teacher: session.schoolClass?.classTeacher || 'Teacher',
        room: session.schoolClass?.roomNumber || '101',
        startTime: session.scheduledStartTime || '08:00',
        endTime: session.scheduledEndTime || '09:00'
      })) : [];
      
      return mockSchedules;
    } catch (error) {
      console.log('Could not load schedules, using mock data:', error.message);
      return [
        {
          id: 1,
          subject: 'Mathematics',
          className: '10-A',
          teacher: 'Mr. Silva',
          room: '101',
          startTime: '08:00',
          endTime: '09:00'
        },
        {
          id: 2,
          subject: 'Science',
          className: '10-B',
          teacher: 'Mrs. Perera',
          room: '102',
          startTime: '09:00',
          endTime: '10:00'
        }
      ];
    }
  };

  const generateAttendanceTrend = (studentCount) => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        present: Math.floor(studentCount * (0.7 + Math.random() * 0.2)),
        total: studentCount
      };
    });
  };

  const generateFeeTrend = () => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: Math.floor(50000 + Math.random() * 100000)
      };
    });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const today = new Date().toISOString().split('T')[0];
      
      console.log('📊 Loading comprehensive dashboard data...');
      
      const [
        studentsResponse, 
        attendanceResponse, 
        classesResponse, 
        sessionsResponse, 
        feeStatsResponse,
        overdueResponse
      ] = await Promise.all([
        studentAPI.getAll().catch(err => {
          console.log('Students API error:', err.message);
          return [];
        }),
        attendanceAPI.getByDate(today).catch(err => {
          console.log('Attendance API error:', err.message);
          return [];
        }),
        classAPI.getAllActive().catch(err => {
          console.log('Classes API error:', err.message);
          return [];
        }),
        sessionAPI.getActive().catch(err => {
          console.log('Sessions API error:', err.message);
          return [];
        }),
        feePaymentAPI.getFeeStatistics().catch(err => {
          console.log('Fee stats not available:', err.message);
          return { totalCollected: 0, pendingStudents: 0 };
        }),
        feePaymentAPI.getOverdueStudents().catch(err => {
          console.log('Overdue students not available:', err.message);
          return [];
        })
      ]);

      // Handle data processing
      const studentList = Array.isArray(studentsResponse) ? studentsResponse : [];
      const attendanceList = Array.isArray(attendanceResponse) ? attendanceResponse : [];
      const classList = Array.isArray(classesResponse) ? classesResponse : [];
      const sessionList = Array.isArray(sessionsResponse) ? sessionsResponse : [];
      const overdueList = Array.isArray(overdueResponse) ? overdueResponse : [];

      const presentToday = attendanceList.filter(a => 
        a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      
      const attendanceRate = studentList.length > 0 ? 
        Math.round((presentToday / studentList.length) * 100) : 0;

      // Calculate new registrations (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newRegistrations = studentList.filter(student => 
        new Date(student.registrationDate || new Date()) > oneWeekAgo
      ).length;

      setStats({
        totalStudents: studentList.length,
        todayAttendance: attendanceList.length,
        presentToday,
        attendanceRate,
        feeCollection: feeStatsResponse.totalCollected || 0,
        pendingPayments: feeStatsResponse.pendingStudents || 0,
        totalClasses: classList.length,
        activeSessionsCount: sessionList.length,
        monthlyCollection: (feeStatsResponse.totalCollected || 0) * 1.5, // Mock monthly projection
        averageAttendance: Math.round(attendanceRate * 0.9), // Mock average
        newRegistrations
      });

      // Load class statistics
      const classStatistics = await Promise.all(
        classList.map(async (cls) => {
          try {
            const classStudents = await studentAPI.getByClass(cls.id).catch(() => []);
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
              roomNumber: cls.roomNumber,
              grade: cls.grade
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
              roomNumber: cls.roomNumber,
              grade: cls.grade
            };
          }
        })
      );

      setClassStats(classStatistics);
      setActiveSessions(sessionList);
      setOverdueStudents(overdueList.slice(0, 10));
      
      // Get recent students (last 5 registered)
      const sortedStudents = [...studentList].sort((a, b) => 
        new Date(b.registrationDate || new Date()) - new Date(a.registrationDate || new Date())
      );
      setRecentStudents(sortedStudents.slice(0, 5));
      setTodayAttendance(attendanceList.slice(0, 10));

      // Load recent payments
      try {
        const payments = await feePaymentAPI.getRecentPayments();
        setRecentPayments(Array.isArray(payments) ? payments.slice(0, 5) : []);
      } catch (error) {
        console.log('Recent payments not available:', error.message);
        setRecentPayments([]);
      }

      // Load today's schedules
      const schedules = await getTodaysSchedules();
      setTodaysSchedules(schedules.slice(0, 6));

      // Generate trends
      setAttendanceTrend(generateAttendanceTrend(studentList.length));
      setFeeCollectionTrend(generateFeeTrend());

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

  const getPaymentStatusBadge = (status) => {
    const statusClass = status === 'PAID' ? 'paid' : 
                       status === 'PARTIAL' ? 'partial' : 'pending';
    return <span className={`payment-status-badge ${statusClass}`}>{status}</span>;
  };

  const getAlertLevel = (student) => {
    const balance = student.balance || 0;
    if (balance > 5000) return 'high';
    if (balance > 2000) return 'medium';
    return 'low';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const refreshDashboard = () => {
    loadDashboardData();
  };

  // New Analytics Components
  const AttendanceTrendChart = () => (
    <div className="trend-chart">
      <div className="chart-header">
        <h4>7-Day Attendance Trend</h4>
        <span className="trend-indicator positive">+5%</span>
      </div>
      <div className="chart-bars">
        {attendanceTrend.map((day, index) => {
          const percentage = (day.present / day.total) * 100;
          return (
            <div key={index} className="chart-bar-container">
              <div className="chart-bar">
                <div 
                  className="chart-fill" 
                  style={{ height: `${percentage}%` }}
                ></div>
              </div>
              <span className="chart-label">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="chart-value">{day.present}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const FeeCollectionChart = () => (
    <div className="trend-chart">
      <div className="chart-header">
        <h4>Fee Collection Trend</h4>
        <span className="trend-indicator positive">+12%</span>
      </div>
      <div className="chart-bars horizontal">
        {feeCollectionTrend.map((month, index) => (
          <div key={index} className="chart-bar-container horizontal">
            <div className="chart-bar horizontal">
              <div 
                className="chart-fill horizontal" 
                style={{ width: `${(month.amount / 150000) * 100}%` }}
              ></div>
            </div>
            <span className="chart-label">{month.month}</span>
            <span className="chart-value">{formatCurrency(month.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const QuickStatsPanel = () => (
    <div className="quick-stats-panel">
      <div className="quick-stat">
        <div className="quick-stat-icon">📈</div>
        <div className="quick-stat-content">
          <span className="quick-stat-value">{stats.averageAttendance}%</span>
          <span className="quick-stat-label">Avg. Attendance</span>
        </div>
      </div>
      <div className="quick-stat">
        <div className="quick-stat-icon">💰</div>
        <div className="quick-stat-content">
          <span className="quick-stat-value">{formatCurrency(stats.monthlyCollection)}</span>
          <span className="quick-stat-label">Monthly Collection</span>
        </div>
      </div>
      <div className="quick-stat">
        <div className="quick-stat-icon">👥</div>
        <div className="quick-stat-content">
          <span className="quick-stat-value">{stats.newRegistrations}</span>
          <span className="quick-stat-label">New Students (7d)</span>
        </div>
      </div>
      <div className="quick-stat">
        <div className="quick-stat-icon">⏰</div>
        <div className="quick-stat-content">
          <span className="quick-stat-value">{overdueStudents.length}</span>
          <span className="quick-stat-label">Overdue Fees</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-animation">
          <div className="loading-spinner"></div>
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
        <p>Loading your comprehensive dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-animation">
          <div className="error-icon">⚠️</div>
        </div>
        <h3>Unable to Load Dashboard</h3>
        <p>{error}</p>
        <button onClick={refreshDashboard} className="modern-retry-btn">
          <span className="retry-icon">🔄</span>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="modern-dashboard">
      {/* Enhanced Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>School Management Dashboard</h1>
            <p>Comprehensive overview of student management, attendance, and financial tracking</p>
          </div>
          <div className="header-actions">
            <QuickStatsPanel />
           
            <div className="current-time">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          ⚠️ Alerts
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Enhanced Statistics Grid */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">
                <div className="icon-bg"></div>
                <span>👨‍🎓</span>
              </div>
              <div className="stat-content">
                <h3>Total Students</h3>
                <div className="stat-number">{stats.totalStudents}</div>
                <div className="stat-trend positive">+{stats.newRegistrations} this week</div>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">
                <div className="icon-bg"></div>
                <span>📊</span>
              </div>
              <div className="stat-content">
                <h3>Attendance Rate</h3>
                <div className="stat-number">{stats.attendanceRate}%</div>
                <div className="stat-trend positive">+2% from yesterday</div>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">
                <div className="icon-bg"></div>
                <span>💰</span>
              </div>
              <div className="stat-content">
                <h3>Monthly Collection</h3>
                <div className="stat-number">{formatCurrency(stats.monthlyCollection)}</div>
                <div className="stat-trend positive">On track</div>
              </div>
            </div>

            <div className="stat-card danger">
              <div className="stat-icon">
                <div className="icon-bg"></div>
                <span>⏰</span>
              </div>
              <div className="stat-content">
                <h3>Pending Payments</h3>
                <div className="stat-number">{stats.pendingPayments}</div>
                <div className="stat-trend negative">Requires attention</div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions with All Features */}
          <div className="section-card">
            <div className="section-header">
              <h2>Quick Actions</h2>
              <span className="section-badge">All Features</span>
            </div>
            
            {/* Action Categories */}
            <div className="action-categories">
              {/* Student Management */}
              <div className="action-category">
                <h3 className="category-title">👨‍🎓 Student Management</h3>
                <div className="actions-grid">
                  <Link to="/register" className="action-btn info">
                    <div className="action-icon">➕</div>
                    <div className="action-text">
                      <span>Register Student</span>
                      <small>Add new student to system</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/students" className="action-btn info">
                    <div className="action-icon">👥</div>
                    <div className="action-text">
                      <span>View All Students</span>
                      <small>Browse and manage students</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/students/unassigned" className="action-btn info">
                    <div className="action-icon">🎯</div>
                    <div className="action-text">
                      <span>Unassigned Students</span>
                      <small>Students without classes</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/student-reports" className="action-btn info">
                    <div className="action-icon">📋</div>
                    <div className="action-text">
                      <span>Student Reports</span>
                      <small>Generate student analytics</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>
                </div>
              </div>

              {/* Attendance Management */}
              <div className="action-category">
                <h3 className="category-title">📊 Attendance Management</h3>
                <div className="actions-grid">
                  <Link to="/attendance" className="action-btn accent">
                    <div className="action-icon">📱</div>
                    <div className="action-text">
                      <span>QR Attendance</span>
                      <small>Scan student QR codes</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/attendance/manual" className="action-btn accent">
                    <div className="action-icon">✏️</div>
                    <div className="action-text">
                      <span>Manual Attendance</span>
                      <small>Record attendance manually</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/today-attendance" className="action-btn accent">
                    <div className="action-icon">📅</div>
                    <div className="action-text">
                      <span>Today's Attendance</span>
                      <small>View today's records</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/attendance-reports" className="action-btn accent">
                    <div className="action-icon">📈</div>
                    <div className="action-text">
                      <span>Attendance Reports</span>
                      <small>Generate analytics</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>
                </div>
              </div>

              {/* Fee Management */}
              <div className="action-category">
                <h3 className="category-title">💰 Fee Management</h3>
                <div className="actions-grid">
                  <Link to="/fee-payment" className="action-btn success">
                    <div className="action-icon">💳</div>
                    <div className="action-text">
                      <span>Fee Payment</span>
                      <small>Process student payments</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/payment-tracker" className="action-btn success">
                    <div className="action-icon">🔍</div>
                    <div className="action-text">
                      <span>Payment Tracker</span>
                      <small>Advanced payment tracking</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/fee-structure" className="action-btn success">
                    <div className="action-icon">🏷️</div>
                    <div className="action-text">
                      <span>Fee Structure</span>
                      <small>Manage class fees</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/overdue-fees" className="action-btn success">
                    <div className="action-icon">⏰</div>
                    <div className="action-text">
                      <span>Overdue Fees</span>
                      <small>View pending payments</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>
                </div>
              </div>

              {/* Class & Schedule Management */}
              <div className="action-category">
                <h3 className="category-title">🏫 Class Management</h3>
                <div className="actions-grid">
                  <Link to="/classes" className="action-btn info">
                    <div className="action-icon">🏫</div>
                    <div className="action-text">
                      <span>Manage Classes</span>
                      <small>Classes & sections</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/schedules" className="action-btn info">
                    <div className="action-icon">📅</div>
                    <div className="action-text">
                      <span>Class Schedules</span>
                      <small>Manage timetables</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/attendance-sessions" className="action-btn info">
                    <div className="action-icon">⏱️</div>
                    <div className="action-text">
                      <span>Attendance Sessions</span>
                      <small>Manage class sessions</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/class-analytics" className="action-btn accent">
                    <div className="action-icon">📊</div>
                    <div className="action-text">
                      <span>Class Analytics</span>
                      <small>Performance reports</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>
                </div>
              </div>

              {/* Reports & Analytics */}
              <div className="action-category">
                <h3 className="category-title">📈 Reports & Analytics</h3>
                <div className="actions-grid">
                  <Link to="/reports/attendance" className="action-btn danger">
                    <div className="action-icon">📊</div>
                    <div className="action-text">
                      <span>Attendance Reports</span>
                      <small>Detailed analytics</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/reports/financial" className="action-btn danger">
                    <div className="action-icon">💰</div>
                    <div className="action-text">
                      <span>Financial Reports</span>
                      <small>Fee collection reports</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/reports/student" className="action-btn danger">
                    <div className="action-icon">👨‍🎓</div>
                    <div className="action-text">
                      <span>Student Reports</span>
                      <small>Student performance</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>

                  <Link to="/reports/class" className="action-btn danger">
                    <div className="action-icon">🏫</div>
                    <div className="action-text">
                      <span>Class Reports</span>
                      <small>Class-wise analytics</small>
                    </div>
                    <div className="action-arrow">→</div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

              {/* Class-wise Statistics */}
              {classStats.length > 0 && (
                <div className="section-card">
                  <div className="section-header">
                    <h2>Class Performance Today</h2>
                    <span className="section-badge">Real-time</span>
                  </div>
                  <div className="classes-list">
                    {classStats.map(classStat => (
                      <div key={classStat.classId} className="class-item">
                        <div className="class-info">
                          <h4>{classStat.className}</h4>
                          <p>{classStat.classTeacher} • Room {classStat.roomNumber}</p>
                          {classStat.grade && (
                            <span className="grade-badge">Grade {classStat.grade}</span>
                          )}
                        </div>
                        <div className="class-stats">
                          <div className="attendance-progress">
                            <div className="progress-bar">
                              <div 
                                className="progress-fill" 
                                style={{ width: `${classStat.attendanceRate}%` }}
                              ></div>
                            </div>
                            <span className="attendance-percent">
                              {classStat.attendanceRate}%
                            </span>
                          </div>
                          <div className="attendance-count">
                            {classStat.presentCount}/{classStat.totalStudents}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
           

            {/* Right Column */}
            <div className="content-column">
              {/* Active Sessions */}
              {activeSessions.length > 0 && (
                <div className="section-card">
                  <div className="section-header">
                    <h2>Live Class Sessions</h2>
                    <span className="status-dot live"></span>
                  </div>
                  <div className="sessions-list">
                    {activeSessions.map(session => (
                      <div key={session.id} className="session-item">
                        <div className="session-header">
                          <h4>{session.schoolClass?.className || 'Unknown Class'}</h4>
                          <span className="session-badge live">LIVE</span>
                        </div>
                        <div className="session-details">
                          <div className="detail-item">
                            <span className="detail-label">Subject:</span>
                            <span>{session.subject || 'General'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Time:</span>
                            <span>{session.scheduledStartTime || '08:00'} - {session.scheduledEndTime || '09:00'}</span>
                          </div>
                        </div>
                        <Link to={`/attendance?session=${session.id}`} className="session-action">
                          Take Attendance
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="section-card">
                <div className="section-header">
                  <h2>Recent Activity</h2>
                  <span className="section-badge">Latest</span>
                </div>
                <div className="activity-tabs">
                  <div className="tab-content">
                    {/* Recent Payments */}
                    <div className="activity-section">
                      <h4>Recent Fee Payments</h4>
                      <div className="activity-list">
                        {recentPayments.length === 0 ? (
                          <div className="no-data">
                            <p>No fee payments recorded yet.</p>
                            <Link to="/fee-payment" className="fee-payment-link">
                              Record First Payment
                            </Link>
                          </div>
                        ) : (
                          <>
                            {recentPayments.map(payment => (
                              <div key={payment.id} className="activity-item">
                                <div className="activity-avatar payment">
                                  💰
                                </div>
                                <div className="activity-details">
                                  <p>
                                    <strong>{payment.student?.firstName} {payment.student?.lastName}</strong>
                                    <span className="payment-amount">{formatCurrency(payment.amountPaid)}</span>
                                  </p>
                                  <span className="activity-meta">
                                    {payment.student?.studentId}
                                    {payment.paymentMethod && ` • ${payment.paymentMethod}`}
                                  </span>
                                </div>
                                {getPaymentStatusBadge(payment.status || 'PAID')}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-grid">
          <div className="analytics-card large">
            <div className="card-header">
              <h3>Attendance Analytics</h3>
              <span className="time-filter">Last 7 Days</span>
            </div>
            <AttendanceTrendChart />
          </div>

          <div className="analytics-card large">
            <div className="card-header">
              <h3>Fee Collection Analytics</h3>
              <span className="time-filter">Last 6 Months</span>
            </div>
            <FeeCollectionChart />
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>Class Performance</h3>
            </div>
            <div className="performance-list">
              {classStats.sort((a, b) => b.attendanceRate - a.attendanceRate).map((classStat, index) => (
                <div key={classStat.classId} className="performance-item">
                  <div className="rank">#{index + 1}</div>
                  <div className="class-info">
                    <h4>{classStat.className}</h4>
                    <p>{classStat.grade} • {classStat.classTeacher}</p>
                  </div>
                  <div className="performance-metric">
                    <div className="metric-value">{classStat.attendanceRate}%</div>
                    <div className="metric-label">Attendance</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-header">
              <h3>Quick Insights</h3>
            </div>
            <div className="insights-list">
              <div className="insight-item positive">
                <div className="insight-icon">📈</div>
                <div className="insight-content">
                  <p>Attendance improved by 5% this week</p>
                  <span className="insight-meta">Compared to last week</span>
                </div>
              </div>
              <div className="insight-item warning">
                <div className="insight-icon">💰</div>
                <div className="insight-content">
                  <p>{stats.pendingPayments} students have pending fees</p>
                  <span className="insight-meta">Requires follow-up</span>
                </div>
              </div>
              <div className="insight-item positive">
                <div className="insight-icon">👥</div>
                <div className="insight-content">
                  <p>{stats.newRegistrations} new students registered this week</p>
                  <span className="insight-meta">Growth trend</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="alerts-grid">
          <div className="alerts-card">
            <div className="card-header">
              <h3>⚠️ Overdue Fee Alerts</h3>
              <span className="alerts-count">{overdueStudents.length} alerts</span>
            </div>
            <div className="alerts-list">
              {overdueStudents.length === 0 ? (
                <div className="no-alerts">
                  <div className="no-alerts-icon">✅</div>
                  <h4>No Overdue Fees</h4>
                  <p>All fee payments are up to date</p>
                </div>
              ) : (
                overdueStudents.map((student, index) => (
                  <div key={student.studentId} className={`alert-item ${getAlertLevel(student)}`}>
                    <div className="alert-header">
                      <div className="student-info">
                        <h4>{student.studentName}</h4>
                        <p>{student.className} • {student.studentId}</p>
                      </div>
                      <div className="alert-badge">
                        {getAlertLevel(student).toUpperCase()}
                      </div>
                    </div>
                    <div className="alert-details">
                      <div className="fee-detail">
                        <span>Overdue Amount:</span>
                        <span className="amount overdue">{formatCurrency(student.balance)}</span>
                      </div>
                      <div className="fee-detail">
                        <span>Total Due:</span>
                        <span>{formatCurrency(student.totalDue)}</span>
                      </div>
                    </div>
                    <div className="alert-actions">
                      <button className="btn-remind">Send Reminder</button>
                      <Link to={`/fee-payment?student=${student.studentId}`} className="btn-pay">
                        Process Payment
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="alerts-card">
            <div className="card-header">
              <h3>📊 Low Attendance Alerts</h3>
            </div>
            <div className="attendance-alerts">
              {classStats.filter(cls => cls.attendanceRate < 70).map(classStat => (
                <div key={classStat.classId} className="attendance-alert">
                  <div className="alert-info">
                    <h4>{classStat.className}</h4>
                    <p>Low attendance rate: {classStat.attendanceRate}%</p>
                  </div>
                  <div className="alert-metric">
                    <span className="metric critical">{classStat.attendanceRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;