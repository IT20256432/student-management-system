// Simple TeacherDailyReport.jsx component
import React, { useState } from 'react';
import { feePaymentAPI } from '../services/api';

const TeacherDailyReport = ({ teacherId, teacherName }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    
    const loadDailyReport = async () => {
        try {
            // Get payments for the selected date
            const data = await feePaymentAPI.getPaymentsByDate(selectedDate);
            
            // Filter by teacher (if teacherId is provided)
            let filtered = data;
            if (teacherId) {
                filtered = data.filter(p => 
                    p.teacherId === teacherId || 
                    p.recordedBy === teacherId
                );
            }
            
            setPayments(filtered);
            
            // Calculate summary
            const cashTotal = filtered
                .filter(p => p.paymentMethod === 'CASH')
                .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
            
            const cardTotal = filtered
                .filter(p => p.paymentMethod === 'CARD')
                .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
            
            setSummary({
                cashTotal,
                cardTotal,
                total: cashTotal + cardTotal,
                count: filtered.length
            });
        } catch (error) {
            console.error('Error loading report:', error);
        }
    };
    
    return (
        <div className="teacher-daily-report">
            <h3>Daily Collection Report - {teacherName}</h3>
            
            <div className="date-selector">
                <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
                <button onClick={loadDailyReport} className="btn-primary">
                    Load Report
                </button>
                <button onClick={() => window.print()} className="btn-secondary">
                    Print
                </button>
            </div>
            
            {summary && (
                <div className="daily-summary-card">
                    <h4>Summary for {selectedDate}</h4>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <span>Total Payments:</span>
                            <strong>{summary.count}</strong>
                        </div>
                        <div className="summary-item">
                            <span>Cash Collection:</span>
                            <strong>Rs. {summary.cashTotal.toFixed(2)}</strong>
                        </div>
                        <div className="summary-item">
                            <span>Card Collection:</span>
                            <strong>Rs. {summary.cardTotal.toFixed(2)}</strong>
                        </div>
                        <div className="summary-item highlight">
                            <span>Total Collection:</span>
                            <strong>Rs. {summary.total.toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            )}
            
            {payments.length > 0 && (
                <div className="payments-list">
                    <h4>Payment Details</h4>
                    <table className="simple-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Class</th>
                                <th>Amount</th>
                                <th>Method</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment, index) => (
                                <tr key={index}>
                                    <td>{payment.student?.firstName} {payment.student?.lastName}</td>
                                    <td>{payment.student?.grade}</td>
                                    <td>Rs. {payment.amountPaid?.toFixed(2)}</td>
                                    <td>{payment.paymentMethod}</td>
                                    <td>{new Date(payment.createdAt).toLocaleTimeString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};