import React, { useState, useEffect } from 'react';
import { feePaymentAPI } from '../services/api'; // Make sure this import is correct
import './FeeManagement.css';

const FeeManagement = () => {
    const [overdueStudents, setOverdueStudents] = useState([]);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTab, setSelectedTab] = useState('overview');

    useEffect(() => {
        loadFeeData();
    }, []);

    const loadFeeData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const [overdue, history, statistics] = await Promise.all([
                feePaymentAPI.getOverdueStudents(), // Make sure this uses feePaymentAPI
                feePaymentAPI.getRecentPayments(),  // Make sure this uses feePaymentAPI
                feePaymentAPI.getFeeStatistics()    // Make sure this uses feePaymentAPI
            ]);
            
            setOverdueStudents(overdue);
            setPaymentHistory(history);
            setStats(statistics);
        } catch (err) {
            console.error('Error loading fee data:', err);
            setError('Failed to load fee data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusClass = status === 'PAID' ? 'paid' : 
                           status === 'PARTIAL' ? 'partial' : 'pending';
        return <span className={`status-badge ${statusClass}`}>{status}</span>;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR'
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-LK');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading fee data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">❌</div>
                <h3>Error Loading Data</h3>
                <p>{error}</p>
                <button onClick={loadFeeData} className="retry-btn">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="fee-management">
            <div className="fee-header">
                <h1>Fee Management</h1>
                <p>Manage student fees and payment tracking</p>
            </div>

            {/* Statistics Cards */}
            <div className="stats-cards">
                <div className="stat-card total-collected">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Total Collected</h3>
                        <div className="stat-number">{formatCurrency(stats.totalCollected)}</div>
                        <p>Last 30 days</p>
                    </div>
                </div>

                <div className="stat-card pending-payments">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-content">
                        <h3>Pending Payments</h3>
                        <div className="stat-number">{stats.pendingStudents}</div>
                        <p>Students with dues</p>
                    </div>
                </div>

                <div className="stat-card collection-rate">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>Collection Rate</h3>
                        <div className="stat-number">{stats.collectionRate?.toFixed(1)}%</div>
                        <p>Overall efficiency</p>
                    </div>
                </div>

                <div className="stat-card recent-payments">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-content">
                        <h3>Recent Payments</h3>
                        <div className="stat-number">{stats.recentPaymentCount}</div>
                        <p>Last 30 days</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <div className="tabs">
                    <button 
                        className={`tab ${selectedTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('overview')}
                    >
                        Overview
                    </button>
                    <button 
                        className={`tab ${selectedTab === 'overdue' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('overdue')}
                    >
                        Overdue Students
                    </button>
                    <button 
                        className={`tab ${selectedTab === 'history' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('history')}
                    >
                        Payment History
                    </button>
                </div>

                <div className="tab-content">
                    {selectedTab === 'overview' && (
                        <div className="overview-tab">
                            <h3>Fee Collection Overview</h3>
                            <div className="overview-grid">
                                <div className="overview-card">
                                    <h4>Quick Actions</h4>
                                    <div className="action-buttons">
                                        <button className="action-btn primary">
                                            📱 Scan Payment
                                        </button>
                                        <button className="action-btn secondary">
                                            📄 Generate Report
                                        </button>
                                        <button className="action-btn secondary">
                                            📧 Send Reminders
                                        </button>
                                    </div>
                                </div>
                                <div className="overview-card">
                                    <h4>This Month Summary</h4>
                                    <div className="summary-stats">
                                        <div className="summary-item">
                                            <span>Target Collection:</span>
                                            <span>{formatCurrency(stats.totalCollected * 2)}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Actual Collection:</span>
                                            <span className="highlight">{formatCurrency(stats.totalCollected)}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Collection Rate:</span>
                                            <span className="highlight">{stats.collectionRate?.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'overdue' && (
                        <div className="overdue-tab">
                            <div className="section-header">
                                <h3>Overdue Payments</h3>
                                <span className="count-badge">{overdueStudents.length} students</span>
                            </div>
                            
                            {overdueStudents.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🎉</div>
                                    <h4>No Overdue Payments!</h4>
                                    <p>All students are up to date with their fees.</p>
                                </div>
                            ) : (
                                <div className="overdue-list">
                                    {overdueStudents.map((student, index) => (
                                        <div key={student.studentId || index} className="overdue-student">
                                            <div className="student-info">
                                                <h4>{student.studentName}</h4>
                                                <p>{student.studentId} • {student.className}</p>
                                            </div>
                                            <div className="fee-details">
                                                <div className="amount-due">
                                                    <span>Due: {formatCurrency(student.balance)}</span>
                                                </div>
                                                {getStatusBadge(student.overallStatus)}
                                            </div>
                                            <div className="action-buttons">
                                                <button className="btn-small primary">
                                                    Mark Paid
                                                </button>
                                                <button className="btn-small secondary">
                                                    Send Reminder
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedTab === 'history' && (
                        <div className="history-tab">
                            <div className="section-header">
                                <h3>Recent Payment History</h3>
                                <span className="count-badge">{paymentHistory.length} payments</span>
                            </div>
                            
                            {paymentHistory.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">💸</div>
                                    <h4>No Payments Yet</h4>
                                    <p>Payment history will appear here once payments are recorded.</p>
                                </div>
                            ) : (
                                <div className="payment-history">
                                    <div className="history-table">
                                        <div className="table-header">
                                            <span>Student</span>
                                            <span>Amount</span>
                                            <span>Date</span>
                                            <span>Method</span>
                                            <span>Month</span>
                                            <span>Status</span>
                                        </div>
                                        {paymentHistory.map((payment) => (
                                            <div key={payment.id} className="table-row">
                                                <span className="student-name">
                                                    {payment.student?.firstName} {payment.student?.lastName}
                                                </span>
                                                <span className="amount">{formatCurrency(payment.amountPaid)}</span>
                                                <span className="date">{formatDate(payment.paymentDate)}</span>
                                                <span className="method">{payment.paymentMethod}</span>
                                                <span className="month">{payment.month}</span>
                                                <span className="status">{getStatusBadge(payment.status)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeeManagement;