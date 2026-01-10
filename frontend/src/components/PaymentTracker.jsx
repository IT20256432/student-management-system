// src/components/PaymentTracker.js
import React, { useState, useEffect } from 'react';
import { feePaymentAPI, classAPI } from '../services/api';
import './PaymentTracker.css';

const PaymentTracker = () => {
  // State declarations
  const [paymentData, setPaymentData] = useState({
    recentPayments: [],
    overdueStudents: [],
    feeStatistics: {},
    allPayments: [],
    dailyPayments: []
  });
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [viewMode, setViewMode] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teacherCommissionRate, setTeacherCommissionRate] = useState(10); // Default 10%
  const [dailySummary, setDailySummary] = useState(null);
  const [teacherSettlements, setTeacherSettlements] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [allPaymentsData, setAllPaymentsData] = useState([]);
  const [commissionData, setCommissionData] = useState({
    totalCommission: 0,
    teacherCommissions: {},
    totalForCommission: 0
  });

  // Generate date arrays
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().substring(0, 7);
  });

  const recentDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().substring(0, 10);
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load data based on view mode
  useEffect(() => {
    if (!loading) {
      loadDataBasedOnView();
    }
  }, [viewMode, selectedClass, selectedMonth, selectedDate, selectedTeacher]);

  // Calculate commission when rate or payments change
  useEffect(() => {
    if (viewMode === 'daily' && paymentData.dailyPayments.length > 0) {
      calculateCommission();
    }
  }, [teacherCommissionRate, paymentData.dailyPayments]);

  const loadDataBasedOnView = async () => {
    switch (viewMode) {
      case 'classWise':
        await loadClassWiseData();
        break;
      case 'monthly':
        await loadMonthlyData();
        break;
      case 'overdue':
        await loadOverdueData();
        break;
      case 'daily':
        await loadDailyData();
        break;
      case 'teacherSettlement':
        await loadTeacherSettlements();
        break;
      default:
        await loadOverviewData();
        break;
    }
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Loading initial data...');
      
      const classesData = await classAPI.getAllActive();
      console.log('✅ Classes loaded:', classesData.length);
      setClasses(classesData);

      // Extract unique teachers from classes
      const uniqueTeachers = [];
      classesData.forEach(cls => {
        if (cls.classTeacher && !uniqueTeachers.some(t => t.name === cls.classTeacher)) {
          uniqueTeachers.push({
            id: cls.id,
            name: cls.classTeacher,
            classId: cls.id
          });
        }
      });
      setTeachers(uniqueTeachers);
      console.log('✅ Teachers loaded:', uniqueTeachers.length);

      // Load all payments data
      const allPayments = await feePaymentAPI.getRecentPayments();
      console.log('✅ All payments loaded:', allPayments.length);
      setAllPaymentsData(allPayments);

      await loadOverviewData(allPayments);
      
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      setError(`Failed to load initial data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async (allPayments = null) => {
    try {
      console.log('📊 Loading overview data...');
      
      const payments = allPayments || await feePaymentAPI.getRecentPayments();
      const [overdueStudents, feeStatistics] = await Promise.all([
        feePaymentAPI.getOverdueStudents(),
        feePaymentAPI.getFeeStatistics()
      ]);

      setPaymentData(prev => ({
        ...prev,
        recentPayments: payments.slice(0, 20),
        overdueStudents,
        feeStatistics,
        allPayments: payments
      }));

    } catch (error) {
      console.error('❌ Error loading overview data:', error);
      setError(`Failed to load payment data: ${error.message}`);
    }
  };

  const loadDailyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📅 Loading daily data with filters:', {
        date: selectedDate,
        class: selectedClass,
        teacher: selectedTeacher
      });
      
      let filteredPayments = allPaymentsData.filter(payment => {
        if (!payment.paymentDate) return false;
        
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        if (paymentDate !== selectedDate) return false;
        
        if (selectedClass !== 'all') {
          const paymentClassId = getPaymentClassId(payment);
          if (paymentClassId !== parseInt(selectedClass)) return false;
        }
        
        if (selectedTeacher !== 'all') {
          const paymentTeacher = getPaymentTeacher(getPaymentClassId(payment));
          const selectedTeacherObj = teachers.find(t => t.id == selectedTeacher);
          if (selectedTeacherObj && paymentTeacher !== selectedTeacherObj.name) {
            return false;
          }
        }
        
        return true;
      });
      
      console.log(`📊 Filtered ${filteredPayments.length} payments after filtering`);

      // Calculate summary
      const cashTotal = filteredPayments
        .filter(p => p.paymentMethod === 'CASH' || !p.paymentMethod)
        .reduce((sum, p) => sum + (p.amountPaid || p.amount || 0), 0);
      
      const cardTotal = filteredPayments
        .filter(p => p.paymentMethod === 'CARD')
        .reduce((sum, p) => sum + (p.amountPaid || p.amount || 0), 0);
      
      const onlineTotal = filteredPayments
        .filter(p => p.paymentMethod === 'ONLINE')
        .reduce((sum, p) => sum + (p.amountPaid || p.amount || 0), 0);
      
      const totalAmount = cashTotal + cardTotal + onlineTotal;

      // Calculate teacher summary
      const teacherSummary = filteredPayments.reduce((acc, payment) => {
        const teacher = payment.teacherName || getPaymentTeacher(getPaymentClassId(payment));
        if (!acc[teacher]) {
          acc[teacher] = {
            total: 0,
            cash: 0,
            card: 0,
            online: 0,
            count: 0,
            commission: 0
          };
        }
        
        const amount = payment.amountPaid || 0;
        acc[teacher].total += amount;
        acc[teacher].count += 1;
        acc[teacher].commission += (amount * teacherCommissionRate) / 100;
        
        switch(payment.paymentMethod) {
          case 'CASH': acc[teacher].cash += amount; break;
          case 'CARD': acc[teacher].card += amount; break;
          case 'ONLINE': acc[teacher].online += amount; break;
        }
        
        return acc;
      }, {});

      // Calculate commission data
      const totalForCommission = filteredPayments.reduce((sum, payment) => 
        sum + (payment.amountPaid || 0), 0
      );
      
      const totalCommission = (totalForCommission * teacherCommissionRate) / 100;

      // Calculate individual teacher commissions
      const teacherCommissions = {};
      Object.entries(teacherSummary).forEach(([teacher, stats]) => {
        teacherCommissions[teacher] = {
          totalCollection: stats.total,
          commissionAmount: (stats.total * teacherCommissionRate) / 100,
          paymentCount: stats.count,
          commissionRate: teacherCommissionRate
        };
      });

      setCommissionData({
        totalCommission,
        teacherCommissions,
        totalForCommission
      });

      setDailySummary({
        date: selectedDate,
        cashTotal,
        cardTotal,
        onlineTotal,
        totalAmount,
        paymentCount: filteredPayments.length,
        byClass: selectedClass !== 'all' ? 
          `${classes.find(c => c.id == selectedClass)?.className || 'Unknown Class'} - ${classes.find(c => c.id == selectedClass)?.grade || ''}` 
          : 'All Classes',
        byTeacher: selectedTeacher !== 'all' ? 
          teachers.find(t => t.id == selectedTeacher)?.name || 'Unknown Teacher' 
          : 'All Teachers',
        teacherSummary
      });

      setPaymentData(prev => ({
        ...prev,
        dailyPayments: filteredPayments
      }));

      console.log('✅ Daily data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading daily data:', error);
      setError('Failed to load daily payment data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClassWiseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏫 Loading class-wise data for class:', selectedClass);
      
      const allPayments = allPaymentsData;
      let filteredPayments = allPayments;
      let filteredOverdue = paymentData.overdueStudents;

      if (selectedClass !== 'all') {
        const classId = parseInt(selectedClass);
        
        filteredPayments = allPayments.filter(payment => {
          const paymentClassId = getPaymentClassId(payment);
          return paymentClassId === classId;
        });

        filteredOverdue = paymentData.overdueStudents.filter(student => {
          const studentClassId = student.classId || student.schoolClass?.id;
          return studentClassId === classId;
        });
      }

      setPaymentData(prev => ({
        ...prev,
        allPayments: filteredPayments,
        overdueStudents: filteredOverdue
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
      
      const allPayments = allPaymentsData;
      
      const filteredPayments = allPayments.filter(payment => {
        const paymentDate = payment.paymentDate || payment.createdAt;
        if (!paymentDate) return false;
        
        const paymentMonth = new Date(paymentDate).toISOString().substring(0, 7);
        const matchesMonth = paymentMonth === selectedMonth;
        
        const matchesClass = selectedClass === 'all' || 
          getPaymentClassId(payment) === parseInt(selectedClass);
        
        return matchesMonth && matchesClass;
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
        ? allOverdueStudents.filter(student => {
            const studentClassId = student.classId || student.schoolClass?.id;
            return studentClassId === parseInt(selectedClass);
          })
        : allOverdueStudents;

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

  const loadTeacherSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('💰 Loading teacher settlements');
      
      const settlements = {};
      
      allPaymentsData.forEach(payment => {
        const teacherName = payment.teacherName || getPaymentTeacher(getPaymentClassId(payment));
        const paymentDate = new Date(payment.paymentDate).toISOString().split('T')[0];
        
        if (!teacherName || teacherName === 'No Teacher Assigned') return;
        
        const key = `${teacherName}_${paymentDate}`;
        if (!settlements[key]) {
          settlements[key] = {
            teacherName,
            date: paymentDate,
            totalAmount: 0,
            cashAmount: 0,
            cardAmount: 0,
            onlineAmount: 0,
            paymentCount: 0,
            commissionRate: teacherCommissionRate,
            commissionAmount: 0,
            status: 'PENDING'
          };
        }
        
        settlements[key].totalAmount += payment.amountPaid || 0;
        settlements[key].paymentCount += 1;
        
        switch(payment.paymentMethod) {
          case 'CASH': settlements[key].cashAmount += payment.amountPaid || 0; break;
          case 'CARD': settlements[key].cardAmount += payment.amountPaid || 0; break;
          case 'ONLINE': settlements[key].onlineAmount += payment.amountPaid || 0; break;
        }
      });
      
      const settlementsArray = Object.values(settlements).map(settlement => ({
        ...settlement,
        commissionAmount: (settlement.totalAmount * teacherCommissionRate) / 100,
        netAmount: settlement.totalAmount - (settlement.totalAmount * teacherCommissionRate) / 100
      }));
      
      setTeacherSettlements(settlementsArray);

    } catch (error) {
      console.error('❌ Error loading settlements:', error);
      setError('Failed to load teacher settlements');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getPaymentClassId = (payment) => {
    return payment.classId || payment.schoolClass?.id || payment.class?.id;
  };

  const getPaymentClassName = (payment) => {
    if (payment.className) return payment.className;
    if (payment.schoolClass?.className) return payment.schoolClass.className;
    if (payment.class?.className) return payment.class.className;
    
    const classId = getPaymentClassId(payment);
    if (classId) {
      const classInfo = classes.find(c => c.id === parseInt(classId));
      return classInfo?.className || 'Unknown Class';
    }
    
    return 'Unknown Class';
  };

  const getPaymentTeacher = (classId) => {
    if (!classId || classId === 'all') return 'No Teacher Assigned';
    const classInfo = classes.find(c => c.id === parseInt(classId));
    return classInfo?.classTeacher || 'No Teacher Assigned';
  };

  const getStudentTeacher = (student) => {
    const classId = student.classId || student.schoolClass?.id;
    return getPaymentTeacher(classId);
  };

  const calculateTeacherCommission = (classId) => {
    if (classId === 'all') return 0;
    
    const classPayments = allPaymentsData.filter(payment => 
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
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
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

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-LK', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
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

  // Commission calculation function
  const calculateCommission = () => {
    if (paymentData.dailyPayments.length === 0) return;

    const totalForCommission = paymentData.dailyPayments.reduce((sum, payment) => 
      sum + (payment.amountPaid || 0), 0
    );
    
    const totalCommission = (totalForCommission * teacherCommissionRate) / 100;

    const teacherCommissions = {};
    const teacherSummary = {};

    paymentData.dailyPayments.forEach(payment => {
      const teacher = payment.teacherName || getPaymentTeacher(getPaymentClassId(payment));
      if (!teacherSummary[teacher]) {
        teacherSummary[teacher] = {
          total: 0,
          count: 0
        };
      }
      teacherSummary[teacher].total += payment.amountPaid || 0;
      teacherSummary[teacher].count += 1;
    });

    Object.entries(teacherSummary).forEach(([teacher, stats]) => {
      teacherCommissions[teacher] = {
        totalCollection: stats.total,
        commissionAmount: (stats.total * teacherCommissionRate) / 100,
        paymentCount: stats.count,
        commissionRate: teacherCommissionRate
      };
    });

    setCommissionData({
      totalCommission,
      teacherCommissions,
      totalForCommission
    });

    if (dailySummary && dailySummary.teacherSummary) {
      const updatedTeacherSummary = { ...dailySummary.teacherSummary };
      Object.keys(updatedTeacherSummary).forEach(teacher => {
        if (teacherCommissions[teacher]) {
          updatedTeacherSummary[teacher].commission = teacherCommissions[teacher].commissionAmount;
        }
      });
      
      setDailySummary(prev => prev ? {
        ...prev,
        teacherSummary: updatedTeacherSummary
      } : null);
    }
  };

  // CSV Export function
  const exportDailyCSV = () => {
    try {
      setExportLoading(true);
      
      if (!dailySummary || paymentData.dailyPayments.length === 0) {
        alert('No data to export for the selected date');
        return;
      }

      const csvData = [
        ['DAILY PAYMENT REPORT WITH COMMISSION'],
        ['Date:', formatDate(dailySummary.date)],
        ['Class:', dailySummary.byClass],
        ['Teacher:', dailySummary.byTeacher],
        ['Commission Rate:', `${teacherCommissionRate}%`],
        ['Generated:', new Date().toLocaleDateString('en-LK')],
        [''],
        ['SUMMARY'],
        ['Total Payments:', dailySummary.paymentCount],
        ['Cash Total:', `LKR ${dailySummary.cashTotal.toLocaleString()}`],
        ['Card Total:', `LKR ${dailySummary.cardTotal.toLocaleString()}`],
        ['Online Total:', `LKR ${dailySummary.onlineTotal.toLocaleString()}`],
        ['Total Collection:', `LKR ${dailySummary.totalAmount.toLocaleString()}`],
        ['Total for Commission:', `LKR ${commissionData.totalForCommission.toLocaleString()}`],
        ['Total Commission:', `LKR ${commissionData.totalCommission.toLocaleString()}`],
        ['Commission Rate:', `${teacherCommissionRate}%`],
        [''],
        ['TEACHER WISE SUMMARY & COMMISSION'],
        ['Teacher', 'Total Collection', 'Payment Count', 'Cash', 'Card', 'Online', 'Commission', 'Commission Rate']
      ];

      if (dailySummary.teacherSummary) {
        Object.entries(dailySummary.teacherSummary).forEach(([teacher, stats]) => {
          csvData.push([
            teacher,
            `LKR ${stats.total.toLocaleString()}`,
            stats.count,
            `LKR ${stats.cash.toLocaleString()}`,
            `LKR ${stats.card.toLocaleString()}`,
            `LKR ${stats.online.toLocaleString()}`,
            `LKR ${(stats.commission || 0).toLocaleString()}`,
            `${teacherCommissionRate}%`
          ]);
        });
      }

      csvData.push([''], ['COMMISSION BREAKDOWN']);
      csvData.push(['Teacher', 'Total Collection', 'Commission Rate', 'Commission Amount', 'Payment Count', 'Average per Payment']);

      if (commissionData.teacherCommissions) {
        Object.entries(commissionData.teacherCommissions).forEach(([teacher, commission]) => {
          const avgPerPayment = commission.commissionAmount / commission.paymentCount || 0;
          csvData.push([
            teacher,
            `LKR ${commission.totalCollection.toLocaleString()}`,
            `${commission.commissionRate}%`,
            `LKR ${commission.commissionAmount.toLocaleString()}`,
            commission.paymentCount,
            `LKR ${avgPerPayment.toLocaleString()}`
          ]);
        });
      }

      csvData.push([''], ['DETAILED PAYMENTS WITH COMMISSION']);
      csvData.push(['Time', 'Student Name', 'Class', 'Teacher', 'Amount', 'Commission', 'Commission Rate', 'Payment Method', 'Status']);

      paymentData.dailyPayments.forEach(payment => {
        const paymentCommission = ((payment.amountPaid || 0) * teacherCommissionRate) / 100;
        csvData.push([
          formatTime(payment.createdAt || payment.paymentDate),
          getStudentName(payment),
          getPaymentClassName(payment),
          payment.teacherName || getPaymentTeacher(getPaymentClassId(payment)),
          `LKR ${(payment.amountPaid || 0).toLocaleString()}`,
          `LKR ${paymentCommission.toLocaleString()}`,
          `${teacherCommissionRate}%`,
          payment.paymentMethod || 'N/A',
          payment.status || 'N/A'
        ]);
      });

      csvData.push([''], ['REPORT SUMMARY']);
      csvData.push(['Report Type:', 'Daily Payment Report with Commission']);
      csvData.push(['Generated By:', 'Payment Tracking System']);
      csvData.push(['Generated At:', new Date().toLocaleString('en-LK')]);
      csvData.push(['Total Records:', paymentData.dailyPayments.length]);
      csvData.push(['Total Commission:', `LKR ${commissionData.totalCommission.toLocaleString()}`]);
      csvData.push(['Commission Rate:', `${teacherCommissionRate}%`]);

      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Daily_Payments_Commission_${dailySummary.date.replace(/-/g, '')}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('CSV report with commission data generated successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV report');
    } finally {
      setExportLoading(false);
    }
  };

  // Event handlers
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    
    if (classId !== 'all') {
      const classInfo = classes.find(c => c.id == classId);
      if (classInfo?.classTeacher) {
        const teacher = teachers.find(t => t.name === classInfo.classTeacher);
        if (teacher) {
          setSelectedTeacher(teacher.id.toString());
        }
      }
    }
  };

  const handleTeacherChange = (e) => {
    const teacherId = e.target.value;
    setSelectedTeacher(teacherId);
    
    if (teacherId !== 'all') {
      const teacher = teachers.find(t => t.id == teacherId);
      if (teacher?.classId) {
        setSelectedClass(teacher.classId.toString());
      }
    }
  };

  const markSettlementAsPaid = (settlementIndex) => {
    const updatedSettlements = [...teacherSettlements];
    updatedSettlements[settlementIndex].status = 'PAID';
    updatedSettlements[settlementIndex].paidDate = new Date().toISOString().split('T')[0];
    setTeacherSettlements(updatedSettlements);
    
    alert(`Settlement marked as paid for ${updatedSettlements[settlementIndex].teacherName} on ${updatedSettlements[settlementIndex].date}`);
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
            className={`tab-btn ${viewMode === 'daily' ? 'active' : ''}`}
            onClick={() => setViewMode('daily')}
          >
            📅 Daily Tracking
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
            📆 Monthly Report
          </button>
          <button 
            className={`tab-btn ${viewMode === 'overdue' ? 'active' : ''}`}
            onClick={() => setViewMode('overdue')}
          >
            ⚠️ Overdue Fees
          </button>
          <button 
            className={`tab-btn ${viewMode === 'teacherSettlement' ? 'active' : ''}`}
            onClick={() => setViewMode('teacherSettlement')}
          >
            💰 Teacher Settlement
          </button>
        </div>

        <div className="filters">
          <select 
            value={selectedClass} 
            onChange={handleClassChange}
            className="filter-select"
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.className} - {cls.grade} ({cls.classTeacher || 'No Teacher'})
              </option>
            ))}
          </select>

          {viewMode === 'daily' && (
            <>
              <select 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="filter-select"
              >
                {recentDates.map(date => (
                  <option key={date} value={date}>
                    {formatDate(date)}
                  </option>
                ))}
              </select>
              
              <select 
                value={selectedTeacher} 
                onChange={handleTeacherChange}
                className="filter-select"
              >
                <option value="all">All Teachers</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({classes.find(c => c.id === teacher.classId)?.className || 'N/A'})
                  </option>
                ))}
              </select>
            </>
          )}

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

          {(viewMode === 'classWise' || viewMode === 'teacherSettlement') && selectedClass !== 'all' && (
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

          {/* Export Options */}
          {viewMode === 'daily' && (
            <div className="report-export-options">
              <button 
                onClick={exportDailyCSV} 
                disabled={exportLoading || !dailySummary || paymentData.dailyPayments.length === 0}
                className="export-btn csv"
              >
                {exportLoading ? '⏳ Generating...' : '📊 Export CSV'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {/* Export Loading Overlay */}
      {exportLoading && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div className="spinner"></div>
            <p>Generating report...</p>
          </div>
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

            {/* Daily Tracking View */}
            {viewMode === 'daily' && (
              <div className="daily-tracking-view">
                <div className="daily-header">
                  <h3>
                    Daily Payment Tracking - {formatDate(selectedDate)}
                    {selectedClass !== 'all' && ` • ${classes.find(c => c.id == selectedClass)?.className || 'Unknown Class'}`}
                    {selectedTeacher !== 'all' && ` • ${teachers.find(t => t.id == selectedTeacher)?.name || 'Unknown Teacher'}`}
                  </h3>
                  <div className="daily-actions">
                    <button 
                      className="btn-export" 
                      onClick={exportDailyCSV}
                      disabled={exportLoading || !dailySummary || paymentData.dailyPayments.length === 0}
                    >
                      {exportLoading ? '⏳ Generating...' : '📥 Export CSV Report'}
                    </button>
                  </div>
                </div>
                
                {/* Commission Rate Control */}
                <div className="commission-rate-control">
                  <label>Teacher Commission Rate:</label>
                  <input
                    type="number"
                    value={teacherCommissionRate}
                    onChange={(e) => setTeacherCommissionRate(parseFloat(e.target.value))}
                    min="0"
                    max="100"
                    step="0.5"
                    className="commission-rate-input"
                  />
                  <span className="percentage">%</span>
                  <div className="commission-note">
                    <small>Commission is calculated on total payments</small>
                  </div>
                </div>
                
                {dailySummary && (
                  <div className="daily-summary-card">
                    <div className="summary-header">
                      <h4>Summary for {formatDate(selectedDate)}</h4>
                      <div className="summary-filters">
                        <span className="filter-badge">Class: {dailySummary.byClass}</span>
                        <span className="filter-badge">Teacher: {dailySummary.byTeacher}</span>
                        <span className="filter-badge">Payments: {dailySummary.paymentCount}</span>
                      </div>
                    </div>
                    
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span className="summary-label">Total Payments</span>
                        <span className="summary-value">{dailySummary.paymentCount}</span>
                      </div>
                      <div className="summary-item cash">
                        <span className="summary-label">Cash Total</span>
                        <span className="summary-value">{formatCurrency(dailySummary.cashTotal)}</span>
                      </div>
                      <div className="summary-item card">
                        <span className="summary-label">Card Total</span>
                        <span className="summary-value">{formatCurrency(dailySummary.cardTotal)}</span>
                      </div>
                      <div className="summary-item online">
                        <span className="summary-label">Online Total</span>
                        <span className="summary-value">{formatCurrency(dailySummary.onlineTotal)}</span>
                      </div>
                      <div className="summary-item total">
                        <span className="summary-label">Total Collection</span>
                        <span className="summary-value">{formatCurrency(dailySummary.totalAmount)}</span>
                      </div>
                      <div className="summary-item commission">
                        <span className="summary-label">Total Commission</span>
                        <span className="summary-value">{formatCurrency(commissionData.totalCommission)}</span>
                        <small className="commission-rate-display">({teacherCommissionRate}% of {formatCurrency(commissionData.totalForCommission)})</small>
                      </div>
                    </div>
                    
                    {/* Commission Breakdown */}
                    {commissionData.totalCommission > 0 && (
                      <div className="commission-summary">
                        <h4>💰 Commission Breakdown</h4>
                        <div className="commission-grid">
                          <div className="commission-item">
                            <span className="commission-label">Commission Rate</span>
                            <span className="commission-value">{teacherCommissionRate}%</span>
                          </div>
                          <div className="commission-item">
                            <span className="commission-label">Total for Commission</span>
                            <span className="commission-value">{formatCurrency(commissionData.totalForCommission)}</span>
                          </div>
                          <div className="commission-item">
                            <span className="commission-label">Total Commission</span>
                            <span className="commission-value">{formatCurrency(commissionData.totalCommission)}</span>
                          </div>
                          <div className="commission-item">
                            <span className="commission-label">Teachers</span>
                            <span className="commission-value">{Object.keys(commissionData.teacherCommissions).length}</span>
                          </div>
                        </div>
                        
                        {Object.keys(commissionData.teacherCommissions).length > 0 && (
                          <div className="commission-breakdown">
                            <div className="breakdown-header">
                              <h5>Teacher-wise Commission</h5>
                              <small>Rate: {teacherCommissionRate}%</small>
                            </div>
                            <div className="breakdown-grid">
                              {Object.entries(commissionData.teacherCommissions).map(([teacher, commission]) => (
                                <div key={teacher} className="teacher-commission-card">
                                  <div className="teacher-commission-header">
                                    <div className="teacher-name-commission">{teacher}</div>
                                    <div className="commission-amount">{formatCurrency(commission.commissionAmount)}</div>
                                  </div>
                                  <div className="teacher-commission-details">
                                    <div className="detail-item">
                                      <strong>Collection:</strong><br />
                                      {formatCurrency(commission.totalCollection)}
                                    </div>
                                    <div className="detail-item">
                                      <strong>Payments:</strong><br />
                                      {commission.paymentCount}
                                    </div>
                                    <div className="detail-item">
                                      <strong>Rate:</strong><br />
                                      {commission.commissionRate}%
                                    </div>
                                    <div className="detail-item">
                                      <strong>Per Payment:</strong><br />
                                      {formatCurrency(commission.commissionAmount / commission.paymentCount || 0)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Teacher Summary */}
                    {dailySummary.teacherSummary && Object.keys(dailySummary.teacherSummary).length > 0 && (
                      <div className="teacher-summary">
                        <h4>Teacher-wise Collection Summary</h4>
                        <div className="teacher-summary-grid">
                          {Object.entries(dailySummary.teacherSummary).map(([teacher, stats]) => (
                            <div key={teacher} className="teacher-summary-item">
                              <div className="teacher-name">{teacher}</div>
                              <div className="teacher-stats">
                                <span>Total: {formatCurrency(stats.total)}</span>
                                <span>Count: {stats.count}</span>
                                <span>Cash: {formatCurrency(stats.cash)}</span>
                                <span>Card: {formatCurrency(stats.card)}</span>
                                <span>Online: {formatCurrency(stats.online)}</span>
                                {stats.commission > 0 && (
                                  <span className="commission-highlight">
                                    Commission: {formatCurrency(stats.commission)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Payments Table */}
                <div className="daily-payments-table">
                  {paymentData.dailyPayments.length > 0 ? (
                    <>
                      <table>
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Teacher</th>
                            <th>Amount</th>
                            <th>Commission</th>
                            <th>Method</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentData.dailyPayments.map((payment, index) => {
                            const paymentCommission = ((payment.amountPaid || 0) * teacherCommissionRate) / 100;
                            return (
                              <tr key={payment.id || index}>
                                <td>{formatTime(payment.createdAt || payment.paymentDate)}</td>
                                <td>
                                  <strong>{getStudentName(payment)}</strong>
                                  {payment.student?.studentId && (
                                    <div className="student-id">ID: {payment.student.studentId}</div>
                                  )}
                                </td>
                                <td>{getPaymentClassName(payment)}</td>
                                <td>
                                  {payment.teacherName || getPaymentTeacher(getPaymentClassId(payment))}
                                </td>
                                <td className="amount-cell">
                                  {formatCurrency(payment.amountPaid || payment.amount)}
                                </td>
                                <td className="commission-cell">
                                  <small>{teacherCommissionRate}% =</small><br />
                                  <strong>{formatCurrency(paymentCommission)}</strong>
                                </td>
                                <td>
                                  <span className={`payment-method ${payment.paymentMethod?.toLowerCase()}`}>
                                    {payment.paymentMethod || 'N/A'}
                                  </span>
                                </td>
                                <td>{getStatusBadge(payment.status)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="table-footer">
                        <p>
                          Showing {paymentData.dailyPayments.length} payment(s) • 
                          Total: {formatCurrency(paymentData.dailyPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0))} •
                          Total Commission: {formatCurrency(commissionData.totalCommission)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="no-data-message">
                      <h4>No payments found for the selected criteria</h4>
                      <p>Try changing the date, class, or teacher filters</p>
                    </div>
                  )}
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

            {/* Teacher Settlement View */}
            {viewMode === 'teacherSettlement' && (
              <div className="teacher-settlement-view">
                <div className="settlement-header">
                  <h3>Teacher Settlements</h3>
                  <div className="settlement-info">
                    <p>Commission Rate: <strong>{teacherCommissionRate}%</strong></p>
                    <p>Total Settlements: <strong>{teacherSettlements.length}</strong></p>
                  </div>
                </div>
                
                <div className="settlements-grid">
                  {teacherSettlements.map((settlement, index) => (
                    <div key={index} className="settlement-card">
                      <div className="settlement-header-card">
                        <div className="teacher-name">{settlement.teacherName}</div>
                        <div className="settlement-date">{formatDate(settlement.date)}</div>
                        <div className={`settlement-status ${settlement.status.toLowerCase()}`}>
                          {settlement.status}
                        </div>
                      </div>
                      
                      <div className="settlement-details">
                        <div className="settlement-item">
                          <span>Total Collection:</span>
                          <span>{formatCurrency(settlement.totalAmount)}</span>
                        </div>
                        <div className="settlement-item">
                          <span>Cash:</span>
                          <span>{formatCurrency(settlement.cashAmount)}</span>
                        </div>
                        <div className="settlement-item">
                          <span>Card:</span>
                          <span>{formatCurrency(settlement.cardAmount)}</span>
                        </div>
                        <div className="settlement-item">
                          <span>Online:</span>
                          <span>{formatCurrency(settlement.onlineAmount)}</span>
                        </div>
                        <div className="settlement-item">
                          <span>Payment Count:</span>
                          <span>{settlement.paymentCount}</span>
                        </div>
                        <div className="settlement-item commission">
                          <span>Commission ({settlement.commissionRate}%):</span>
                          <span>{formatCurrency(settlement.commissionAmount)}</span>
                        </div>
                        <div className="settlement-item net">
                          <span>Net to Teacher:</span>
                          <span>{formatCurrency(settlement.netAmount)}</span>
                        </div>
                      </div>
                      
                      <div className="settlement-actions">
                        {settlement.status === 'PENDING' ? (
                          <>
                            <button 
                              className="btn-mark-paid"
                              onClick={() => markSettlementAsPaid(index)}
                            >
                              Mark as Paid
                            </button>
                            <button className="btn-view-details">View Details</button>
                          </>
                        ) : (
                          <div className="paid-info">
                            <span>Paid on: {formatDate(settlement.paidDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {teacherSettlements.length === 0 && (
                    <div className="no-data-message">
                      <p>No settlement records found. Try changing the date range or filters.</p>
                    </div>
                  )}
                </div>
                
                {teacherSettlements.length > 0 && (
                  <div className="settlement-summary">
                    <h4>Summary</h4>
                    <div className="summary-grid">
                      <div className="summary-item">
                        <span>Total Collections:</span>
                        <span>{formatCurrency(teacherSettlements.reduce((sum, s) => sum + s.totalAmount, 0))}</span>
                      </div>
                      <div className="summary-item">
                        <span>Total Commission:</span>
                        <span>{formatCurrency(teacherSettlements.reduce((sum, s) => sum + s.commissionAmount, 0))}</span>
                      </div>
                      <div className="summary-item">
                        <span>Total Net to Teachers:</span>
                        <span>{formatCurrency(teacherSettlements.reduce((sum, s) => sum + s.netAmount, 0))}</span>
                      </div>
                      <div className="summary-item">
                        <span>Pending Settlements:</span>
                        <span>{teacherSettlements.filter(s => s.status === 'PENDING').length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentTracker;