// src/components/PaymentTracker.js
import React, { useState, useEffect } from 'react';
import { feePaymentAPI, classAPI, studentAPI } from '../services/api';
import './PaymentTracker.css';

const PaymentTracker = () => {
  const [paymentData, setPaymentData] = useState({
    recentPayments: [],
    overdueStudents: [],
    feeStatistics: {},
    allPayments: []
  });
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [viewMode, setViewMode] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teacherCommissionRate, setTeacherCommissionRate] = useState(5);

  // Generate last 6 months for filter
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().substring(0, 7);
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (viewMode === 'classWise') {
      loadClassWiseData();
    } else if (viewMode === 'monthly') {
      loadMonthlyData();
    } else if (viewMode === 'overdue') {
      loadOverdueData();
    } else if (viewMode === 'overview') {
      loadOverviewData();
    }
  }, [viewMode, selectedClass, selectedMonth]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Starting to load initial data...');
      
      const classesData = await classAPI.getAllActive();
      console.log('✅ Loaded classes:', classesData.length);
      setClasses(classesData);

      await loadOverviewData();
      
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      setError(`Failed to load initial data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async () => {
    try {
      console.log('📊 Loading overview data...');
      
      const [recentPayments, overdueStudents, feeStatistics] = await Promise.all([
        feePaymentAPI.getRecentPayments(),
        feePaymentAPI.getOverdueStudents(),
        feePaymentAPI.getFeeStatistics()
      ]);

      console.log('✅ Overview data loaded:', {
        payments: recentPayments.length,
        overdue: overdueStudents.length,
        stats: feeStatistics
      });

      setPaymentData({
        recentPayments,
        overdueStudents,
        feeStatistics,
        allPayments: recentPayments
      });

    } catch (error) {
      console.error('❌ Error loading overview data:', error);
      setError(`Failed to load payment data: ${error.message}`);
      // Set empty data to prevent further errors
      setPaymentData({
        recentPayments: [],
        overdueStudents: [],
        feeStatistics: {},
        allPayments: []
      });
    }
  };

  const loadClassWiseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏫 Loading class-wise data for class:', selectedClass);
      
      // Since backend doesn't have class-specific endpoints, we'll filter client-side
      const [allRecentPayments, allOverdueStudents, allFeeStatistics] = await Promise.all([
        feePaymentAPI.getRecentPayments(),
        feePaymentAPI.getOverdueStudents(),
        feePaymentAPI.getFeeStatistics()
      ]);

      let filteredPayments = allRecentPayments;
      let filteredOverdue = allOverdueStudents;

      if (selectedClass !== 'all') {
        const classId = parseInt(selectedClass);
        
        // Client-side filtering based on payment class association
        filteredPayments = allRecentPayments.filter(payment => {
          const paymentClassId = payment.schoolClass?.id || payment.classId;
          console.log(`Payment ${payment.id} class:`, paymentClassId, 'Selected:', classId);
          return paymentClassId === classId;
        });

        filteredOverdue = allOverdueStudents.filter(student => {
          const studentClassId = student.classId;
          console.log(`Overdue student ${student.studentId} class:`, studentClassId, 'Selected:', classId);
          return studentClassId === classId;
        });
      }

      console.log('📋 Filtered Class Data:', {
        filteredPayments: filteredPayments.length,
        filteredOverdue: filteredOverdue.length
      });

      setPaymentData(prev => ({
        ...prev,
        allPayments: filteredPayments,
        overdueStudents: filteredOverdue,
        feeStatistics: allFeeStatistics
      }));

    } catch (error) {
      console.error('❌ Error loading class data:', error);
      setError(`Failed to load class data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Loading monthly data for:', selectedMonth);
      
      const allPayments = await feePaymentAPI.getRecentPayments();
      
      const filteredPayments = allPayments.filter(payment => {
        const paymentMonth = payment.month || payment.paymentDate?.substring(0, 7);
        const matchesMonth = paymentMonth === selectedMonth;
        const matchesClass = selectedClass === 'all' || 
          (payment.schoolClass?.id === parseInt(selectedClass) || payment.classId === parseInt(selectedClass));
        
        return matchesMonth && matchesClass;
      });

      console.log('✅ Monthly data filtered:', {
        allPayments: allPayments.length,
        filteredPayments: filteredPayments.length
      });

      setPaymentData(prev => ({
        ...prev,
        allPayments: filteredPayments
      }));

    } catch (error) {
      console.error('❌ Error loading monthly data:', error);
      setError('Failed to load monthly data');
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('⚠️ Loading overdue data for class:', selectedClass);
      
      const allOverdueStudents = await feePaymentAPI.getOverdueStudents();
      
      const filteredOverdue = selectedClass !== 'all' 
        ? allOverdueStudents.filter(student => student.classId === parseInt(selectedClass))
        : allOverdueStudents;

      console.log('✅ Overdue data loaded:', {
        allOverdue: allOverdueStudents.length,
        filteredOverdue: filteredOverdue.length
      });

      setPaymentData(prev => ({
        ...prev,
        overdueStudents: filteredOverdue
      }));

    } catch (error) {
      console.error('❌ Error loading overdue data:', error);
      setError('Failed to load overdue data');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced data extraction functions
  const getPaymentClassId = (payment) => {
    return payment.classId || payment.schoolClass?.id;
  };

  const getPaymentClassName = (payment) => {
    return payment.className || payment.schoolClass?.className || 'Unknown Class';
  };

  const getPaymentTeacher = (classId) => {
    if (classId === 'all') return 'All Teachers';
    const classInfo = classes.find(c => c.id === parseInt(classId));
    return classInfo?.classTeacher || 'No Teacher Assigned';
  };

  const getStudentTeacher = (student) => {
    const classId = student.classId || student.schoolClass?.id;
    return getPaymentTeacher(classId);
  };

  const calculateTeacherCommission = (classId) => {
    if (classId === 'all') return 0;
    
    const classPayments = paymentData.allPayments.filter(payment => 
      getPaymentClassId(payment) === parseInt(classId)
    );
    
    const totalCollected = classPayments.reduce((sum, payment) => 
      sum + (payment.amountPaid || 0), 0
    );
    
    return (totalCollected * teacherCommissionRate) / 100;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="status-badge unknown">UNKNOWN</span>;
    
    const statusClass = status === 'PAID' ? 'paid' : 
                       status === 'PARTIAL' ? 'partial' : 
                       status === 'PENDING' ? 'pending' : 'unknown';
    return <span className={`status-badge ${statusClass}`}>{status}</span>;
  };

  const getOverdueSeverity = (balance) => {
    if (!balance || balance <= 0) return 'paid';
    if (balance > 5000) return 'high';
    if (balance > 2000) return 'medium';
    return 'low';
  };

  const getStudentName = (payment) => {
    if (payment.studentName) return payment.studentName;
    if (payment.student) {
      return `${payment.student.firstName || ''} ${payment.student.lastName || ''}`.trim();
    }
    return 'Unknown Student';
  };

  return (
    <div className="payment-tracker">
      {/* Header */}
      <div className="tracker-header">
        <div className="header-content">
          <h1>💰 Payment Tracking System</h1>
          <p>Monitor fee payments, track overdue amounts, and generate reports</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-value">{formatCurrency(paymentData.feeStatistics.totalCollected || 0)}</div>
            <div className="stat-label">Total Collected</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{paymentData.feeStatistics.pendingStudents || 0}</div>
            <div className="stat-label">Pending Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{paymentData.feeStatistics.recentPaymentCount || 0}</div>
            <div className="stat-label">Recent Payments</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round(paymentData.feeStatistics.collectionRate || 0)}%</div>
            <div className="stat-label">Collection Rate</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="tracker-controls">
        <div className="view-tabs">
          <button 
            className={`tab-btn ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-btn ${viewMode === 'classWise' ? 'active' : ''}`}
            onClick={() => setViewMode('classWise')}
          >
            🏫 Class Wise
          </button>
          <button 
            className={`tab-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            📅 Monthly Report
          </button>
          <button 
            className={`tab-btn ${viewMode === 'overdue' ? 'active' : ''}`}
            onClick={() => setViewMode('overdue')}
          >
            ⚠️ Overdue Fees
          </button>
        </div>

        <div className="filters">
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.className} - {cls.grade} ({cls.classTeacher || 'No Teacher'})
              </option>
            ))}
          </select>

          {(viewMode === 'monthly' || viewMode === 'overview') && (
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="filter-select"
            >
              {months.map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-LK', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </option>
              ))}
            </select>
          )}

          {viewMode === 'classWise' && selectedClass !== 'all' && (
            <div className="commission-control">
              <label>Commission Rate: </label>
              <input
                type="number"
                value={teacherCommissionRate}
                onChange={(e) => setTeacherCommissionRate(parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.5"
                className="commission-input"
              />
              <span>%</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {/* Content */}
      <div className="tracker-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading payment data...</p>
          </div>
        ) : (
          <>
            {/* Overview View */}
            {viewMode === 'overview' && (
              <div className="overview-grid">
                <div className="overview-card recent-payments">
                  <h3>Recent Payments</h3>
                  <div className="payments-list">
                    {paymentData.recentPayments.slice(0, 10).map(payment => (
                      <div key={payment.id} className="payment-item">
                        <div className="payment-info">
                          <div className="student-name">{getStudentName(payment)}</div>
                          <div className="payment-details">
                            {getPaymentClassName(payment)} • {formatCurrency(payment.amountPaid)}
                          </div>
                        </div>
                        <div className="payment-meta">
                          <div className="payment-date">{formatDate(payment.paymentDate)}</div>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                    ))}
                    {paymentData.recentPayments.length === 0 && (
                      <div className="no-data">No recent payments found</div>
                    )}
                  </div>
                </div>

                <div className="overview-card overdue-summary">
                  <h3>Overdue Summary</h3>
                  <div className="overdue-list">
                    {paymentData.overdueStudents.slice(0, 8).map(student => (
                      <div key={student.studentId} className="overdue-item">
                        <div className="student-info">
                          <div className="student-name">{student.studentName}</div>
                          <div className="class-name">{student.className}</div>
                        </div>
                        <div className="overdue-amount">
                          {formatCurrency(student.balance)}
                        </div>
                      </div>
                    ))}
                    {paymentData.overdueStudents.length === 0 && (
                      <div className="no-data">No overdue students</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Class Wise View */}
            {viewMode === 'classWise' && (
              <div className="class-wise-view">
                <div className="class-header">
                  <h3>
                    {selectedClass !== 'all' 
                      ? `Class: ${classes.find(c => c.id == selectedClass)?.className} - ${classes.find(c => c.id == selectedClass)?.grade}`
                      : 'All Classes'
                    }
                  </h3>
                  
                  {selectedClass !== 'all' && (
                    <div className="teacher-info">
                      <div className="teacher-details">
                        <strong>Class Teacher:</strong> {getPaymentTeacher(selectedClass)}
                      </div>
                      <div className="commission-details">
                        <strong>Commission Earned:</strong> {formatCurrency(calculateTeacherCommission(selectedClass))}
                        <span className="commission-rate">({teacherCommissionRate}% of {formatCurrency(
                          paymentData.allPayments.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
                        )})</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="class-payments-table">
                  {paymentData.allPayments.length > 0 ? (
                    <>
                      <table>
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Class</th>
                            <th>Class Teacher</th>
                            <th>Amount Paid</th>
                            <th>Payment Date</th>
                            <th>Month</th>
                            <th>Status</th>
                            <th>Method</th>
                            <th>Teacher Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentData.allPayments.map(payment => {
                            const commission = (payment.amountPaid * teacherCommissionRate) / 100;
                            const classId = getPaymentClassId(payment);
                            
                            return (
                              <tr key={payment.id}>
                                <td className="student-id-cell">
                                  {payment.student?.studentId || 'N/A'}
                                </td>
                                <td className="student-name-cell">
                                  <strong>{getStudentName(payment)}</strong>
                                </td>
                                <td className="class-cell">
                                  {getPaymentClassName(payment)}
                                </td>
                                <td className="teacher-cell">
                                  {getPaymentTeacher(classId)}
                                </td>
                                <td className="amount-cell">
                                  {formatCurrency(payment.amountPaid)}
                                </td>
                                <td className="date-cell">
                                  {formatDate(payment.paymentDate)}
                                </td>
                                <td className="month-cell">
                                  {payment.month || 'N/A'}
                                </td>
                                <td className="status-cell">
                                  {getStatusBadge(payment.status)}
                                </td>
                                <td className="method-cell">
                                  <span className="payment-method">
                                    {payment.paymentMethod || 'N/A'}
                                  </span>
                                </td>
                                <td className="commission-cell">
                                  {formatCurrency(commission)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      
                      <div className="table-summary">
                        <p>
                          Showing {paymentData.allPayments.length} payment(s) • 
                          Total: {formatCurrency(paymentData.allPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0))}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="no-data-message">
                      <h4>No payment records found for selected class</h4>
                      <p>Try selecting "All Classes" or check if payments are properly associated with classes.</p>
                      <div className="debug-suggestions">
                        <p><strong>Possible reasons:</strong></p>
                        <ul>
                          <li>No payments recorded for this class</li>
                          <li>Payments might not be associated with classes</li>
                          <li>Check browser console for detailed error messages</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Monthly Report View */}
            {viewMode === 'monthly' && (
              <div className="monthly-report-view">
                <h3>Monthly Payment Report - {new Date(selectedMonth + '-01').toLocaleDateString('en-LK', { 
                  year: 'numeric', 
                  month: 'long' 
                })}</h3>
                
                <div className="monthly-stats">
                  <div className="month-stat">
                    <span className="stat-label">Total Collected:</span>
                    <span className="stat-value">
                      {formatCurrency(
                        paymentData.allPayments.reduce((sum, payment) => sum + (payment.amountPaid || 0), 0)
                      )}
                    </span>
                  </div>
                  <div className="month-stat">
                    <span className="stat-label">Total Payments:</span>
                    <span className="stat-value">{paymentData.allPayments.length}</span>
                  </div>
                  {selectedClass !== 'all' && (
                    <div className="month-stat">
                      <span className="stat-label">Class Teacher:</span>
                      <span className="stat-value">{getPaymentTeacher(selectedClass)}</span>
                    </div>
                  )}
                </div>

                <div className="monthly-payments">
                  {paymentData.allPayments.map(payment => (
                    <div key={payment.id} className="monthly-payment-item">
                      <div className="payment-main">
                        <div className="student-class">
                          <strong>{getStudentName(payment)}</strong>
                          <span>{getPaymentClassName(payment)}</span>
                          {selectedClass === 'all' && (
                            <span className="teacher-name">Teacher: {getPaymentTeacher(getPaymentClassId(payment))}</span>
                          )}
                        </div>
                        <div className="payment-amount">
                          {formatCurrency(payment.amountPaid)}
                        </div>
                      </div>
                      <div className="payment-details">
                        <span className="payment-date">{formatDate(payment.paymentDate)}</span>
                        <span className="payment-method">{payment.paymentMethod || 'N/A'}</span>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                  {paymentData.allPayments.length === 0 && (
                    <div className="no-data-message">
                      <p>No payments found for the selected month and class.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overdue Fees View */}
            {viewMode === 'overdue' && (
              <div className="overdue-view">
                <h3>Overdue Fee Report {selectedClass !== 'all' && `- ${classes.find(c => c.id == selectedClass)?.className}`}</h3>
                
                <div className="overdue-students-grid">
                  {paymentData.overdueStudents.map(student => {
                    const severity = getOverdueSeverity(student.balance);
                    
                    return (
                      <div key={student.studentId} className={`overdue-student-card ${severity}`}>
                        <div className="student-header">
                          <div className="student-info">
                            <h4>{student.studentName}</h4>
                            <p>{student.className} • {student.studentId}</p>
                            <p className="teacher-name">Class Teacher: {getStudentTeacher(student)}</p>
                          </div>
                          <div className="overdue-indicator">
                            <span className={`overdue-severity ${severity}`}>
                              {severity === 'paid' ? 'PAID' : severity.toUpperCase() + ' PRIORITY'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="fee-details">
                          <div className="fee-item">
                            <span>Total Due:</span>
                            <span>{formatCurrency(student.totalDue)}</span>
                          </div>
                          <div className="fee-item">
                            <span>Amount Paid:</span>
                            <span className="paid-amount">{formatCurrency(student.totalPaid)}</span>
                          </div>
                          <div className="fee-item total">
                            <span>Balance:</span>
                            <span className="balance-amount">{formatCurrency(student.balance)}</span>
                          </div>
                        </div>
                        
                        <div className="action-buttons">
                          <button className="btn-remind">Send Reminder</button>
                          <button className="btn-view">View History</button>
                        </div>
                      </div>
                    );
                  })}
                  {paymentData.overdueStudents.length === 0 && (
                    <div className="no-data-message">
                      <p>No overdue students found for the selected criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentTracker;