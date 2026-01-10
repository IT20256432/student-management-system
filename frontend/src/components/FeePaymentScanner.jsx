import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { studentAPI, feePaymentAPI, feeAPI, classAPI } from '../services/api';
import { printReceipt as utilsPrintReceipt } from '../utils/receiptPrintingUtils';

import './FeePaymentScanner.css';

const FeePaymentScanner = () => {
    // State declarations
    const [scannedStudent, setScannedStudent] = useState(null);
    const [feeStatus, setFeeStatus] = useState(null);
    const [classFeeStructure, setClassFeeStructure] = useState(null);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: 'CASH',
        month: new Date().toISOString().substring(0, 7),
        notes: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [availableClasses, setAvailableClasses] = useState([]);
    const [showClassSelection, setShowClassSelection] = useState(false);
    const [selectedPaymentClass, setSelectedPaymentClass] = useState(null);
    
    // NEW STATES FOR EMAIL & PDF RECEIPT
    const [showReceiptOptions, setShowReceiptOptions] = useState(false);
    const [lastPaymentId, setLastPaymentId] = useState(null);
    const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    
    // NEW STATES FOR MONTH FUNCTIONALITY
    const [existingPayments, setExistingPayments] = useState([]);
    const [isLoadingFeeStructure, setIsLoadingFeeStructure] = useState(false);

    // NEW STATES FOR TERMINAL PRINTER SUPPORT
    const [showPrintOptions, setShowPrintOptions] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [printerType, setPrinterType] = useState('REGULAR'); // REGULAR, TERMINAL, USB

    const html5QrCodeRef = useRef(null);
    const readerId = "fee-qr-reader";

    // Helper functions for month navigation
    const getCurrentMonth = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    };

    const isFutureMonth = (monthString) => {
        const [year, month] = monthString.split('-').map(Number);
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        
        return year > currentYear || (year === currentYear && month > currentMonth);
    };

    useEffect(() => {
        return () => stopScanner();
    }, []);

    // Refresh fee status when month changes
    useEffect(() => {
        const refreshFeeStatusForMonth = async () => {
            if (!scannedStudent || !selectedPaymentClass || !paymentForm.month) return;
            
            console.log(`🔄 Month changed to ${paymentForm.month}, refreshing fee status...`);
            
            try {
                setIsLoadingFeeStructure(true);
                
                // Get ALL payments for this class
                let allPayments = [];
                try {
                    allPayments = await feePaymentAPI.getStudentPaymentsForClass(
                        scannedStudent.studentId,
                        selectedPaymentClass.id
                    );
                    console.log(`📋 Found ${allPayments.length} total payments for class`);
                } catch (paymentsError) {
                    console.error('Error loading payments:', paymentsError);
                    allPayments = [];
                }
                
                // Filter payments for the SPECIFIC month
                const monthPayments = allPayments.filter(payment => {
                    const paymentMonth = payment.month ? 
                        payment.month.split('-').slice(0, 2).join('-') : 
                        null;
                    return paymentMonth === paymentForm.month;
                });
                
                console.log(`📊 Found ${monthPayments.length} payments for ${paymentForm.month}`);
                
                const totalDue = classFeeStructure?.totalFee || 8000;
                const totalPaidForMonth = monthPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
                const balanceForMonth = totalDue - totalPaidForMonth;
                
                // Determine status
                let overallStatus;
                if (balanceForMonth <= 0) {
                    overallStatus = 'PAID';
                } else if (totalPaidForMonth > 0) {
                    overallStatus = 'PARTIAL';
                } else {
                    overallStatus = 'PENDING';
                }
                
                const refreshedStatus = {
                    studentId: scannedStudent.studentId,
                    studentName: `${scannedStudent.firstName} ${scannedStudent.lastName}`,
                    className: selectedPaymentClass.className,
                    classId: selectedPaymentClass.id,
                    month: paymentForm.month,
                    totalDue: totalDue,
                    totalPaid: totalPaidForMonth,
                    balance: balanceForMonth,
                    overallStatus: overallStatus,
                    isManuallyCalculated: true,
                    totalPaymentsCount: allPayments.length,
                    monthPaymentsCount: monthPayments.length
                };
                
                setFeeStatus(refreshedStatus);
                console.log('✅ Calculated fee status:', {
                    month: refreshedStatus.month,
                    totalDue: refreshedStatus.totalDue,
                    totalPaid: refreshedStatus.totalPaid,
                    balance: refreshedStatus.balance,
                    status: refreshedStatus.overallStatus,
                    paymentsThisMonth: monthPayments.length
                });
                
                // Update payment amount suggestion
                const suggestedAmount = balanceForMonth > 0 ? balanceForMonth : totalDue;
                setPaymentForm(prev => ({
                    ...prev,
                    amount: suggestedAmount.toString()
                }));
                
            } catch (error) {
                console.error('Error refreshing fee status for month:', error);
                setError('Failed to refresh fee status: ' + error.message);
            } finally {
                setIsLoadingFeeStructure(false);
            }
        };
        
        if (scannedStudent && selectedPaymentClass && paymentForm.month) {
            refreshFeeStatusForMonth();
        }
    }, [paymentForm.month, scannedStudent, selectedPaymentClass]);

    const startScanner = async () => {
        try {
            resetScanner();
            await new Promise((resolve) => setTimeout(resolve, 100));

            const readerElement = document.getElementById(readerId);
            if (!readerElement) throw new Error("Scanner element not found");

            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode(readerId);
            }

            const cameras = await Html5Qrcode.getCameras();
            if (cameras.length === 0) throw new Error("No camera found");

            const cameraId = cameras[0].id;
            setIsScanning(true);

            await html5QrCodeRef.current.start(
                { deviceId: { exact: cameraId } },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    console.log("✅ Scanned QR:", decodedText);
                    await stopScanner();
                    await processQRData(decodedText);
                },
                (scanError) => {
                    if (scanError && !scanError.includes("NotFoundException")) {
                        console.warn("⚠️ Scan error:", scanError);
                    }
                }
            );
        } catch (err) {
            console.error("❌ Scanner start error:", err);
            setError(err.message || "Failed to start scanner");
            setIsScanning(false);
        }
    };

    const stopScanner = async () => {
        try {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                await html5QrCodeRef.current.stop();
            }
            await html5QrCodeRef.current?.clear();
        } catch (err) {
            console.warn("⚠️ Error stopping scanner:", err);
        } finally {
            setIsScanning(false);
            const readerElement = document.getElementById(readerId);
            if (readerElement) readerElement.innerHTML = "";
        }
    };

    const resetScanner = () => {
        setScannedStudent(null);
        setFeeStatus(null);
        setClassFeeStructure(null);
        setSelectedPaymentClass(null);
        setError(null);
        setAvailableClasses([]);
        setShowClassSelection(false);
        setShowReceiptOptions(false);
        setShowPrintOptions(false);
        setLastPaymentId(null);
        setReceiptData(null);
        setExistingPayments([]);
        setPaymentForm({
            amount: '',
            paymentMethod: 'CASH',
            month: new Date().toISOString().substring(0, 7),
            notes: ''
        });
    };

    // CREATE FALLBACK FEE STRUCTURE BASED ON GRADE
    const getFallbackFeeStructure = (grade) => {
        const defaultFees = {
            'O/L': {
                monthlyFee: 3000,
                admissionFee: 2000,
                examFee: 1000,
                sportsFee: 500,
                libraryFee: 300,
                labFee: 700,
                otherFee: 500,
                totalFee: 8000
            },
            'A/L': {
                monthlyFee: 4000,
                admissionFee: 2500,
                examFee: 1500,
                sportsFee: 600,
                libraryFee: 400,
                labFee: 900,
                otherFee: 600,
                totalFee: 10500
            }
        };
        
        return defaultFees[grade] || defaultFees['O/L'];
    };

    const processQRData = async (qrData) => {
      try {
        const studentData = JSON.parse(qrData);
        console.log("📊 Processing student QR data:", studentData);
        
        // Get student details
        let student;
        try {
          student = await studentAPI.getByStudentId(studentData.studentId);
          console.log("✅ Student found in database:", student);
        } catch (apiError) {
          console.log("❌ Student not found, using QR data");
          student = {
            studentId: studentData.studentId,
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            grade: studentData.grade,
            email: studentData.email,
            id: studentData.studentId,
            status: 'Active',
            _fromQR: true
          };
        }
        
        // ALWAYS USE QUERY PARAMETER (it's working!)
        let classes = [];
        try {
          console.log(`🔄 Fetching classes for grade: ${student.grade}`);
          
          // Method 1: Use query parameter (the one that works)
          const response = await fetch(
            `http://localhost:8080/api/classes/by-grade?grade=${encodeURIComponent(student.grade)}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              mode: 'cors'
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            classes = data.classes || [];
            console.log(`✅ Query param successful: Found ${classes.length} classes`);
          } else {
            console.log(`❌ Query param failed: ${response.status}`);
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error('❌ Error loading classes:', error);
          classes = createFallbackClasses(student.grade);
          console.log(`🔄 Using ${classes.length} fallback classes`);
        }
        
        if (classes.length === 0) {
          classes = createFallbackClasses(student.grade);
        }

        setAvailableClasses(classes);
        
        // If only one class, auto-select it
        if (classes.length === 1) {
          await selectClassForPayment(student, classes[0]);
        } else {
          // Multiple classes - show selection
          setScannedStudent(student);
          setShowClassSelection(true);
        }

      } catch (error) {
        console.error('❌ Error processing QR:', error);
        setError(`Error: ${error.message}`);
      }
    };

    // Add this helper function for fallback classes
    const createFallbackClasses = (grade) => {
        const fallbackClasses = {
            'A/L': [
                { id: 1, className: `${grade} Mathematics`, grade: grade, classTeacher: 'Math Teacher', roomNumber: '101' },
                { id: 2, className: `${grade} Physics`, grade: grade, classTeacher: 'Physics Teacher', roomNumber: '102' },
                { id: 3, className: `${grade} Chemistry`, grade: grade, classTeacher: 'Chemistry Teacher', roomNumber: '103' },
                { id: 4, className: `${grade} Biology`, grade: grade, classTeacher: 'Biology Teacher', roomNumber: '104' }
            ],
            'O/L': [
                { id: 5, className: `${grade} Mathematics`, grade: grade, classTeacher: 'Math Teacher', roomNumber: '201' },
                { id: 6, className: `${grade} Science`, grade: grade, classTeacher: 'Science Teacher', roomNumber: '202' },
                { id: 7, className: `${grade} English`, grade: grade, classTeacher: 'English Teacher', roomNumber: '203' },
                { id: 8, className: `${grade} Sinhala`, grade: grade, classTeacher: 'Sinhala Teacher', roomNumber: '204' }
            ]
        };
        
        return fallbackClasses[grade] || [
            { id: 9, className: `${grade} General`, grade: grade, classTeacher: 'Class Teacher', roomNumber: '301' }
        ];
    };

    // SELECT CLASS FOR PAYMENT
    const selectClassForPayment = async (student, classObj) => {
        try {
            console.log(`🎯 Selected class for payment: ${classObj.className}`);
            setSelectedPaymentClass(classObj);
            setShowClassSelection(false);
            setIsLoadingFeeStructure(true);

            // Get fee structure for selected class
            let feeStructure = await feeAPI.getByClass(classObj.id);
            if (!feeStructure) {
                console.log('📝 Using fallback fee structure');
                feeStructure = getFallbackFeeStructure(student.grade);
                feeStructure._isFallback = true;
            }

            setClassFeeStructure(feeStructure);
            
            // Load ALL payments for this class
            let allPayments = [];
            try {
                allPayments = await feePaymentAPI.getStudentPaymentsForClass(
                    student.studentId, 
                    classObj.id
                );
                console.log(`📋 Found ${allPayments.length} total payments for class`);
            } catch (paymentsError) {
                console.error('Error loading payments:', paymentsError);
                allPayments = [];
            }
            
            setExistingPayments(allPayments);
            
            // Filter payments for the current month
            const currentMonthPayments = allPayments.filter(payment => {
                const paymentMonth = payment.month ? 
                    payment.month.split('-').slice(0, 2).join('-') : 
                    null;
                return paymentMonth === paymentForm.month;
            });
            
            console.log(`📊 Payments for ${paymentForm.month}:`, currentMonthPayments.length);
            
            // Calculate month-specific fee status
            const totalDue = feeStructure.totalFee || 8000;
            const totalPaidForMonth = currentMonthPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
            const balanceForMonth = totalDue - totalPaidForMonth;
            
            const feeStatus = {
                studentId: student.studentId,
                studentName: `${student.firstName} ${student.lastName}`,
                className: classObj.className,
                classId: classObj.id,
                month: paymentForm.month,
                totalDue: totalDue,
                totalPaid: totalPaidForMonth,
                balance: balanceForMonth,
                overallStatus: balanceForMonth <= 0 ? 'PAID' : totalPaidForMonth > 0 ? 'PARTIAL' : 'PENDING',
                isManuallyCalculated: true,
                totalPaymentsCount: allPayments.length,
                monthPaymentsCount: currentMonthPayments.length
            };
            
            setFeeStatus(feeStatus);
            console.log(`✅ Month ${paymentForm.month} status:`, {
                totalDue: feeStatus.totalDue,
                totalPaid: feeStatus.totalPaid,
                balance: feeStatus.balance,
                status: feeStatus.overallStatus
            });
            
            setScannedStudent(student);

            // Auto-fill payment amount
            const suggestedAmount = balanceForMonth > 0 ? balanceForMonth : totalDue;
            setPaymentForm(prev => ({
                ...prev,
                amount: suggestedAmount.toString()
            }));

        } catch (error) {
            console.error('❌ Error selecting class:', error);
            setError(`Failed to load class data: ${error.message}`);
        } finally {
            setIsLoadingFeeStructure(false);
        }
    };

    // HANDLE PAYMENT FOR SELECTED CLASS
    const handlePayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
        setError("Please enter a valid payment amount");
        return;
    }

    if (!selectedPaymentClass) {
        setError("Please select a class for payment");
        return;
    }

    setIsProcessing(true);
    setError(null);

    try {
        const paymentData = {
            studentId: scannedStudent.studentId,
            classId: selectedPaymentClass.id,
            amountPaid: parseFloat(paymentForm.amount),
            paymentDate: new Date().toISOString().split('T')[0],
            month: paymentForm.month,
            paymentMethod: paymentForm.paymentMethod,
            transactionId: `TXN${Date.now()}`,
            notes: paymentForm.notes,
            feeBreakdown: classFeeStructure // Add fee breakdown to payment data
        };

        console.log("💳 Recording payment with email...");
        
        const result = await feePaymentAPI.recordPaymentWithEmail(paymentData);
        console.log("✅ Payment recorded with email:", result);
        
        // Save payment ID and receipt data WITH FEE BREAKDOWN
        setLastPaymentId(result.id || result.paymentId);
        setReceiptData({
            studentName: scannedStudent.firstName + " " + scannedStudent.lastName,
            studentId: scannedStudent.studentId,
            className: selectedPaymentClass.className,
            amount: paymentForm.amount,
            month: paymentForm.month,
            date: new Date().toISOString().split('T')[0],
            transactionId: paymentData.transactionId,
            studentEmail: scannedStudent.email,
            paymentMethod: paymentForm.paymentMethod,
            // Add fee breakdown to receipt data
            feeBreakdown: {
                monthlyFee: classFeeStructure.monthlyFee || 0,
                admissionFee: classFeeStructure.admissionFee || 0,
                examFee: classFeeStructure.examFee || 0,
                sportsFee: classFeeStructure.sportsFee || 0,
                libraryFee: classFeeStructure.libraryFee || 0,
                labFee: classFeeStructure.labFee || 0,
                otherFee: classFeeStructure.otherFee || 0,
                totalFee: classFeeStructure.totalFee || 0
            }
        });
        
        // Show receipt download options
        setShowReceiptOptions(true);

        // Refresh ALL payments
        try {
            const allPayments = await feePaymentAPI.getStudentPaymentsForClass(
                scannedStudent.studentId, 
                selectedPaymentClass.id
            );
            setExistingPayments(allPayments);
            
            // Filter for current month
            const currentMonthPayments = allPayments.filter(payment => {
                const paymentMonth = payment.month ? 
                    payment.month.split('-').slice(0, 2).join('-') : 
                    null;
                return paymentMonth === paymentForm.month;
            });
            
            const totalPaidForMonth = currentMonthPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
            const totalDue = classFeeStructure.totalFee || 8000;
            const balanceForMonth = totalDue - totalPaidForMonth;
            
            const updatedStatus = {
                ...feeStatus,
                totalPaid: totalPaidForMonth,
                balance: balanceForMonth,
                overallStatus: balanceForMonth <= 0 ? 'PAID' : totalPaidForMonth > 0 ? 'PARTIAL' : 'PENDING'
            };
            
            setFeeStatus(updatedStatus);
            
        } catch (statusError) {
            console.warn('Could not refresh fee status:', statusError.message);
        }

        // Show success message with email info
        if (scannedStudent.email) {
            setError(`✅ Payment recorded successfully! Confirmation email sent to ${scannedStudent.email}`);
        } else {
            setError("✅ Payment recorded successfully! (No email sent - student email not available)");
        }

    } catch (err) {
        console.error("❌ Payment error:", err);
        setError(err.message || "Failed to record payment");
    } finally {
        setIsProcessing(false);
    }
};

    
    const handleDownloadReceipt = async () => {
        if (!lastPaymentId) return;
        
        setIsDownloadingPDF(true);
        try {
            const filename = await feePaymentAPI.downloadReceiptPDF(lastPaymentId);
            console.log("✅ Receipt downloaded:", filename);
            
            // Show success message
            setError(`✅ Receipt downloaded: ${filename}`);
            
            // Auto-close receipt options after download
            setTimeout(() => {
                setShowReceiptOptions(false);
                setPaymentForm({
                    amount: '',
                    paymentMethod: 'CASH',
                    month: new Date().toISOString().substring(0, 7),
                    notes: ''
                });
            }, 3000);
            
        } catch (error) {
            console.error("❌ Receipt download failed:", error);
            setError("Failed to download receipt: " + error.message);
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    const handlePreviewReceipt = async () => {
    if (!lastPaymentId || !receiptData) return;
    
    setIsDownloadingPDF(true);
    try {
        // Create a preview with fee breakdown
        const previewWindow = window.open('', '_blank');
        if (!previewWindow) {
            alert('Please allow pop-ups to preview receipt');
            return;
        }
        
        const totalAmount = parseFloat(receiptData.amount);
        const totalFee = receiptData.feeBreakdown.totalFee;
        
        // Generate fee breakdown for preview
        let feeBreakdownHTML = '';
        const fees = [
            { name: 'Monthly Fee', amount: receiptData.feeBreakdown.monthlyFee },
            { name: 'Admission Fee', amount: receiptData.feeBreakdown.admissionFee },
            { name: 'Exam Fee', amount: receiptData.feeBreakdown.examFee },
            { name: 'Sports Fee', amount: receiptData.feeBreakdown.sportsFee },
            { name: 'Library Fee', amount: receiptData.feeBreakdown.libraryFee },
            { name: 'Lab Fee', amount: receiptData.feeBreakdown.labFee },
            { name: 'Other Fees', amount: receiptData.feeBreakdown.otherFee }
        ];
        
        fees.forEach(fee => {
            if (fee.amount > 0) {
                feeBreakdownHTML += `
                    <tr>
                        <td>${fee.name}</td>
                        <td style="text-align: right;">${formatCurrency(fee.amount)}</td>
                    </tr>
                `;
            }
        });
        
        const previewHTML = `
            <html>
            <head>
                <title>Receipt Preview</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .receipt-container {
                        border: 1px solid #ddd;
                        padding: 20px;
                        border-radius: 8px;
                        background: white;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #3498db;
                        padding-bottom: 15px;
                    }
                    .header h2 {
                        color: #2c3e50;
                        margin: 0;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .info-item {
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }
                    .label {
                        font-weight: bold;
                        color: #555;
                        display: inline-block;
                        width: 120px;
                    }
                    .fee-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .fee-table th {
                        background: #3498db;
                        color: white;
                        padding: 10px;
                        text-align: left;
                    }
                    .fee-table td {
                        padding: 8px 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .total-row {
                        font-weight: bold;
                        background: #f8f9fa;
                    }
                    .payment-summary {
                        background: #f1f8e9;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                    .payment-amount {
                        font-size: 20px;
                        font-weight: bold;
                        color: #27ae60;
                        text-align: center;
                        margin: 15px 0;
                        padding: 10px;
                        background: white;
                        border: 2px solid #27ae60;
                        border-radius: 5px;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #ddd;
                        color: #7f8c8d;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="receipt-container">
                    <div class="header">
                        <h2>FEE PAYMENT RECEIPT - PREVIEW</h2>
                        <p>Transaction ID: ${receiptData.transactionId}</p>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Student:</span>
                            <span>${receiptData.studentName}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Student ID:</span>
                            <span>${receiptData.studentId}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Class:</span>
                            <span>${receiptData.className}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">For Month:</span>
                            <span>${receiptData.month}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Payment Date:</span>
                            <span>${receiptData.date}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Payment Method:</span>
                            <span>${receiptData.paymentMethod}</span>
                        </div>
                    </div>
                    
                    <h3>Fee Breakdown</h3>
                    <table class="fee-table">
                        <thead>
                            <tr>
                                <th>Fee Type</th>
                                <th style="text-align: right;">Amount (LKR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${feeBreakdownHTML}
                            <tr class="total-row">
                                <td><strong>TOTAL FEE DUE</strong></td>
                                <td style="text-align: right;"><strong>${formatCurrency(totalFee)}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div class="payment-summary">
                        <h3>Payment Summary</h3>
                        <div class="info-item">
                            <span class="label">Total Fee Due:</span>
                            <span>${formatCurrency(totalFee)}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">Amount Paid:</span>
                            <span><strong>${formatCurrency(totalAmount)}</strong></span>
                        </div>
                        <div class="info-item">
                            <span class="label">Remaining Balance:</span>
                            <span>${formatCurrency(totalFee - totalAmount)}</span>
                        </div>
                    </div>
                    
                    <div class="payment-amount">
                        AMOUNT PAID: ${formatCurrency(totalAmount)}
                    </div>
                    
                    <div class="footer">
                        <p><strong>Note:</strong> This is a preview. The actual receipt will be generated when printing.</p>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
                
                <script>
                    // Auto-close after 30 seconds
                    setTimeout(() => {
                        window.close();
                    }, 30000);
                </script>
            </body>
            </html>
        `;
        
        previewWindow.document.write(previewHTML);
        previewWindow.document.close();
        
    } catch (error) {
        console.error("❌ Receipt preview failed:", error);
        setError("Failed to preview receipt: " + error.message);
    } finally {
        setIsDownloadingPDF(false);
    }
};

const handlePrintReceipt = (printerType = 'REGULAR') => {
    if (!receiptData) return;
    
    setIsPrinting(true);
    try {
        const success = utilsPrintReceipt(receiptData, printerType);
        if (!success) {
            throw new Error('Failed to open print window');
        }
    } catch (error) {
        console.error("❌ Print failed:", error);
        setError("Failed to print receipt: " + error.message);
    } finally {
        setIsPrinting(false);
    }
};

const handleDirectUSBPrint = () => {
  // Show instructions
  const proceed = window.confirm(
    'For direct USB printing:\n\n' +
    '1. Ensure your receipt printer is connected via USB\n' +
    '2. Set it as default printer in your system\n' +
    '3. Click OK to print receipt\n\n' +
    'If automatic printing fails:\n' +
    '- Press Ctrl+P on the receipt window\n' +
    '- Select your receipt printer\n' +
    '- Click Print\n\n' +
    'Click OK to continue printing.'
  );
  
  if (proceed) {
    // Use the new unified printing function with THERMAL format
    handlePrintReceipt('THERMAL');
  }
};

    // NEW: RESET AFTER PAYMENT
    const handlePaymentComplete = () => {
        setShowReceiptOptions(false);
        setShowPrintOptions(false);
        setPaymentForm({
            amount: '',
            paymentMethod: 'CASH',
            month: new Date().toISOString().substring(0, 7),
            notes: ''
        });
    };

    const scanNext = async () => {
        await resetScanner();
        setTimeout(() => startScanner(), 200);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR'
        }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        const statusClass = status === 'PAID' ? 'paid' : 
                           status === 'PARTIAL' ? 'partial' : 'pending';
        return <span className={`fee-status-badge ${statusClass}`}>{status}</span>;
    };

    // Loading overlay
    if ((isLoadingFeeStructure) && scannedStudent && selectedPaymentClass) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p>Loading fee structure...</p>
            </div>
        );
    }

    return (
        <div className="fee-scanner-container">
            <div className="scanner-header">
                <h2>Fee Payment Scanner</h2>
                <p>Scan student QR code and select which class to pay fees for</p>
            </div>

            {/* QR Scanner Section */}
            <div className="scanner-section">
                <div id={readerId} className="qr-scanner"></div>
                
                <div className="scanner-controls">
                    {!isScanning && !scannedStudent && (
                        <button onClick={startScanner} className="start-scan-btn">
                            Start Scanner
                        </button>
                    )}

                    {isScanning && (
                        <>
                            <p className="scanner-status">🟢 Scanning... Point QR code at camera</p>
                            <button onClick={stopScanner} className="stop-scan-btn">
                                Stop Scanner
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <div className="error-icon">❌</div>
                    <p>{error}</p>
                    <button onClick={resetScanner} className="retry-btn">
                        Try Again
                    </button>
                </div>
            )}

            {/* Class Selection Modal */}
            {showClassSelection && scannedStudent && (
                <div className="class-selection-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Select Class for Payment</h3>
                            <p>{scannedStudent.firstName} is eligible for multiple classes. Select which class to pay fees for.</p>
                        </div>
                        
                        <div className="class-selection-grid">
                            {availableClasses.map(cls => (
                                <div 
                                    key={cls.id}
                                    className="class-option"
                                    onClick={() => selectClassForPayment(scannedStudent, cls)}
                                >
                                    <div className="class-info">
                                        <h4>{cls.className}</h4>
                                        <p>Teacher: {cls.classTeacher}</p>
                                        <p>Room: {cls.roomNumber}</p>
                                        {cls.stream && <p>Stream: {cls.stream}</p>}
                                    </div>
                                    <div className="class-actions">
                                        <button className="select-class-btn">
                                            Pay Fees for This Class
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="modal-actions">
                            <button 
                                onClick={resetScanner}
                                className="cancel-btn"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Interface */}
            {scannedStudent && feeStatus && classFeeStructure && selectedPaymentClass && (
                <div className="payment-interface">
                    {/* Student Information */}
                    <div className="student-card">
                        <div className="student-header">
                            <h3>{scannedStudent.firstName} {scannedStudent.lastName}</h3>
                            {getStatusBadge(feeStatus.overallStatus)}
                        </div>
                        <div className="student-details">
                            <p><strong>Student ID:</strong> {scannedStudent.studentId}</p>
                            <p><strong>Grade:</strong> {scannedStudent.grade}</p>
                            <p><strong>Payment Class:</strong> {selectedPaymentClass.className}</p>
                            {availableClasses.length > 1 && (
                                <button 
                                    onClick={() => setShowClassSelection(true)}
                                    className="change-class-btn"
                                >
                                    Change Class
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Class Fee Structure */}
                    <div className="fee-structure-card">
                        <h4>Class Fee Structure - {selectedPaymentClass.className}</h4>
                        {classFeeStructure._isFallback && (
                            <div className="demo-mode-indicator">
                                <small>📱 Using standard fee structure for {scannedStudent.grade}</small>
                            </div>
                        )}
                        <div className="fee-breakdown-detailed">
                            <div className="fee-item">
                                <span>Monthly Fee:</span>
                                <span>{formatCurrency(classFeeStructure.monthlyFee)}</span>
                            </div>
                            <div className="fee-item">
                                <span>Admission Fee:</span>
                                <span>{formatCurrency(classFeeStructure.admissionFee)}</span>
                            </div>
                            <div className="fee-item">
                                <span>Exam Fee:</span>
                                <span>{formatCurrency(classFeeStructure.examFee)}</span>
                            </div>
                            <div className="fee-item">
                                <span>Sports Fee:</span>
                                <span>{formatCurrency(classFeeStructure.sportsFee)}</span>
                            </div>
                            <div className="fee-item">
                                <span>Library Fee:</span>
                                <span>{formatCurrency(classFeeStructure.libraryFee)}</span>
                            </div>
                            <div className="fee-item">
                                <span>Lab Fee:</span>
                                <span>{formatCurrency(classFeeStructure.labFee)}</span>
                            </div>
                            <div className="fee-item">
                                <span>Other Fees:</span>
                                <span>{formatCurrency(classFeeStructure.otherFee)}</span>
                            </div>
                            <div className="fee-item total">
                                <span><strong>Total Monthly Fee:</strong></span>
                                <span><strong>{formatCurrency(classFeeStructure.totalFee)}</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Current Fee Status */}
                    <div className="fee-status-card">
                        <div className="fee-status-header">
                            <div>
                                <h4>Fee Status for {feeStatus.month}</h4>
                                <small className="month-note">
                                    Showing status for: <strong>{feeStatus.month}</strong>
                                </small>
                            </div>
                            {getStatusBadge(feeStatus.overallStatus)}
                        </div>
                        
                        <div className="fee-breakdown">
                            <div className="fee-item">
                                <span>Monthly Fee Due:</span>
                                <span>{formatCurrency(feeStatus.totalDue || 0)}</span>
                            </div>
                            <div className="fee-item">
                                <span>Paid for {feeStatus.month}:</span>
                                <span className="amount paid">{formatCurrency(feeStatus.totalPaid || 0)}</span>
                            </div>
                            <div className="fee-item total">
                                <span>Balance for {feeStatus.month}:</span>
                                <span className={`amount ${(feeStatus.balance || 0) > 0 ? 'pending' : 'paid'}`}>
                                    {formatCurrency(feeStatus.balance || 0)}
                                </span>
                            </div>
                        </div>
                        
                        {/* Month navigation */}
                        <div className="month-navigation">
                            <button 
                                onClick={() => {
                                    try {
                                        const [year, month] = paymentForm.month.split('-').map(Number);
                                        let newYear = year;
                                        let newMonth = month - 1;
                                        
                                        if (newMonth < 1) {
                                            newMonth = 12;
                                            newYear = year - 1;
                                        }
                                        
                                        const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
                                        setPaymentForm(prev => ({ ...prev, month: newMonthStr }));
                                    } catch (error) {
                                        console.error('Error calculating previous month:', error);
                                    }
                                }}
                                className="month-nav-btn"
                                disabled={isProcessing || isLoadingFeeStructure}
                            >
                                ← Previous Month
                            </button>
                            
                            <button 
                                onClick={() => {
                                    const today = new Date();
                                    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
                                    setPaymentForm(prev => ({ ...prev, month: currentMonth }));
                                }}
                                className="month-nav-btn current"
                                disabled={isProcessing || isLoadingFeeStructure || paymentForm.month === getCurrentMonth()}
                            >
                                Current Month
                            </button>
                            
                            <button 
                                onClick={() => {
                                    try {
                                        const [year, month] = paymentForm.month.split('-').map(Number);
                                        let newYear = year;
                                        let newMonth = month + 1;
                                        
                                        if (newMonth > 12) {
                                            newMonth = 1;
                                            newYear = year + 1;
                                        }
                                        
                                        const newMonthStr = `${newYear}-${String(newMonth).padStart(2, '0')}`;
                                        
                                        // Check if the new month is in the future
                                        const today = new Date();
                                        const currentYear = today.getFullYear();
                                        const currentMonthNum = today.getMonth() + 1;
                                        
                                        const isFutureMonth = newYear > currentYear || 
                                                              (newYear === currentYear && newMonth > currentMonthNum);
                                        
                                        if (isFutureMonth) {
                                            console.warn('Cannot navigate to future month:', newMonthStr);
                                            alert(`Cannot navigate to future months (${newMonthStr}). You can only view current and past months.`);
                                            return;
                                        }
                                        
                                        setPaymentForm(prev => ({ ...prev, month: newMonthStr }));
                                    } catch (error) {
                                        console.error('Error calculating next month:', error);
                                    }
                                }}
                                className="month-nav-btn"
                                disabled={isProcessing || isLoadingFeeStructure || isFutureMonth(paymentForm.month)}
                            >
                                Next Month →
                            </button>
                        </div>
                    </div>

                    {/* Payment History */}
                    {existingPayments.length > 0 && (
                        <div className="payment-history-card">
                            <h4>Payment History</h4>
                            <div className="payment-months">
                                {Array.from(new Set(existingPayments.map(p => p.month))).sort().reverse().map(month => {
                                    const monthPayments = existingPayments.filter(p => p.month === month);
                                    const monthTotal = monthPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
                                    const isCurrentMonth = month === paymentForm.month;
                                    
                                    return (
                                        <div 
                                            key={month} 
                                            className={`payment-month-item ${isCurrentMonth ? 'active' : ''}`}
                                            onClick={() => setPaymentForm(prev => ({ ...prev, month: month }))}
                                        >
                                            <div className="month-header">
                                                <strong>{month}</strong>
                                                <span className={`month-status ${monthTotal >= (classFeeStructure?.totalFee || 0) ? 'paid' : 'partial'}`}>
                                                    {monthTotal >= (classFeeStructure?.totalFee || 0) ? 'PAID' : 'PARTIAL'}
                                                </span>
                                            </div>
                                            <div className="month-details">
                                                <span>Payments: {monthPayments.length}</span>
                                                <span className="month-total">{formatCurrency(monthTotal)}</span>
                                            </div>
                                            {isCurrentMonth && <div className="current-indicator">✓ Viewing</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* NEW: Email Notification Section */}
                    {!showReceiptOptions && (
                        <div className="email-notification-section">
                            <div className="email-notification">
                                <div className="email-icon">📧</div>
                                <div className="email-info">
                                    <h5>Payment Confirmation</h5>
                                    <p>After successful payment:</p>
                                    <ul>
                                        <li>✅ Automatic confirmation email sent to student</li>
                                        <li>📄 Downloadable PDF receipt available</li>
                                        <li>🖨️ Print or save receipt for records</li>
                                    </ul>
                                    {scannedStudent.email ? (
                                        <p className="student-email-target">
                                            <strong>Email will be sent to:</strong> {scannedStudent.email}
                                        </p>
                                    ) : (
                                        <p className="email-warning">
                                            ⚠️ No email on record. Student won't receive email confirmation.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Form */}
                    <div className="payment-form-card">
                        <h4>Record Payment for {selectedPaymentClass.className}</h4>
                        <div className="payment-suggestions">
                            <button 
                                onClick={() => setPaymentForm({...paymentForm, amount: classFeeStructure.totalFee.toString()})}
                                className="suggestion-btn full-fee"
                                disabled={isProcessing}
                            >
                                Pay Full Fee: {formatCurrency(classFeeStructure.totalFee)}
                            </button>
                            <button 
                                onClick={() => setPaymentForm({...paymentForm, amount: classFeeStructure.monthlyFee.toString()})}
                                className="suggestion-btn monthly"
                                disabled={isProcessing}
                            >
                                Monthly Only: {formatCurrency(classFeeStructure.monthlyFee)}
                            </button>
                            {feeStatus.balance > 0 && (
                                <button 
                                    onClick={() => setPaymentForm({...paymentForm, amount: feeStatus.balance.toString()})}
                                    className="suggestion-btn balance"
                                    disabled={isProcessing}
                                >
                                    Pay Balance: {formatCurrency(feeStatus.balance)}
                                </button>
                            )}
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Amount (Rs.) *</label>
                                <input
                                    type="number"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                    disabled={isProcessing}
                                />
                                <small>Full fee: {formatCurrency(classFeeStructure.totalFee)} | Balance: {formatCurrency(feeStatus.balance)}</small>
                            </div>

                            <div className="form-group">
                                <label>Payment Method *</label>
                                <select
                                    value={paymentForm.paymentMethod}
                                    onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                                    disabled={isProcessing}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Card</option>
                                    <option value="ONLINE">Online</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>For Month *</label>
                                <input
                                    type="month"
                                    value={paymentForm.month}
                                    onChange={(e) => setPaymentForm({...paymentForm, month: e.target.value})}
                                    disabled={isProcessing || isLoadingFeeStructure}
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Notes (Optional)</label>
                                <textarea
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                                    placeholder={`Additional notes about payment for ${selectedPaymentClass.className}...`}
                                    rows="3"
                                    disabled={isProcessing}
                                />
                            </div>
                        </div>
                        <div className="payment-actions">
                            <button 
                                onClick={handlePayment}
                                disabled={isProcessing || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0 || isLoadingFeeStructure}
                                className="pay-btn"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="spinner-small"></div>
                                        Processing...
                                    </>
                                ) : (
                                    `Record Payment for ${selectedPaymentClass.className} - ${formatCurrency(parseFloat(paymentForm.amount))}`
                                )}
                            </button>
                            <button onClick={scanNext} className="scan-again-btn">
                                Scan Another Student
                            </button>
                        </div>
                    </div>

                    {/* NEW: Receipt Download Section */}
                    {showReceiptOptions && receiptData && (
                        <div className="receipt-options-section">
                            <div className="receipt-header">
                                <h4>🎉 Payment Successful!</h4>
                                <p>Your payment has been processed. Download your official receipt below.</p>
                            </div>
                            
                            <div className="receipt-details-card">
                                <div className="receipt-summary">
                                    <h5>Payment Summary</h5>
                                    <div className="receipt-summary-grid">
                                        <div className="summary-item">
                                            <span>Student:</span>
                                            <span>{receiptData.studentName}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Class:</span>
                                            <span>{receiptData.className}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Amount Paid:</span>
                                            <span className="amount-highlight">
                                                {formatCurrency(parseFloat(receiptData.amount))}
                                            </span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Payment Method:</span>
                                            <span>{receiptData.paymentMethod}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>For Month:</span>
                                            <span>{receiptData.month}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Transaction ID:</span>
                                            <span className="transaction-id">{receiptData.transactionId}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Date:</span>
                                            <span>{receiptData.date}</span>
                                        </div>
                                        {/* Add fee breakdown summary */}
                                        {receiptData.feeBreakdown && (
                                            <>
                                                <div className="summary-item fee-breakdown-header">
                                                    <span colSpan="2"><strong>Fee Breakdown:</strong></span>
                                                </div>
                                                {receiptData.feeBreakdown.monthlyFee > 0 && (
                                                    <div className="summary-item fee-detail">
                                                        <span>Monthly Fee:</span>
                                                        <span>{formatCurrency(receiptData.feeBreakdown.monthlyFee)}</span>
                                                    </div>
                                                )}
                                                {receiptData.feeBreakdown.admissionFee > 0 && (
                                                    <div className="summary-item fee-detail">
                                                        <span>Admission Fee:</span>
                                                        <span>{formatCurrency(receiptData.feeBreakdown.admissionFee)}</span>
                                                    </div>
                                                )}
                                                {receiptData.feeBreakdown.examFee > 0 && (
                                                    <div className="summary-item fee-detail">
                                                        <span>Exam Fee:</span>
                                                        <span>{formatCurrency(receiptData.feeBreakdown.examFee)}</span>
                                                    </div>
                                                )}
                                                {receiptData.feeBreakdown.sportsFee > 0 && (
                                                    <div className="summary-item fee-detail">
                                                        <span>Sports Fee:</span>
                                                        <span>{formatCurrency(receiptData.feeBreakdown.sportsFee)}</span>
                                                    </div>
                                                )}
                                                {receiptData.feeBreakdown.libraryFee > 0 && (
                                                    <div className="summary-item fee-detail">
                                                        <span>Library Fee:</span>
                                                        <span>{formatCurrency(receiptData.feeBreakdown.libraryFee)}</span>
                                                    </div>
                                                )}
                                                {receiptData.feeBreakdown.labFee > 0 && (
                                                    <div className="summary-item fee-detail">
                                                        <span>Lab Fee:</span>
                                                        <span>{formatCurrency(receiptData.feeBreakdown.labFee)}</span>
                                                    </div>
                                                )}
                                                {receiptData.feeBreakdown.otherFee > 0 && (
                                                    <div className="summary-item fee-detail">
                                                        <span>Other Fees:</span>
                                                        <span>{formatCurrency(receiptData.feeBreakdown.otherFee)}</span>
                                                    </div>
                                                )}
                                                <div className="summary-item total-fee">
                                                    <span><strong>Total Fee:</strong></span>
                                                    <span><strong>{formatCurrency(receiptData.feeBreakdown.totalFee)}</strong></span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="receipt-actions">
                                    <button 
                                        onClick={handleDownloadReceipt}
                                        disabled={isDownloadingPDF || isPrinting}
                                        className="download-receipt-btn primary"
                                    >
                                        {(isDownloadingPDF || isPrinting) ? (
                                            <>
                                                <div className="spinner-small"></div>
                                                {isDownloadingPDF ? 'Downloading PDF...' : 'Printing...'}
                                            </>
                                        ) : (
                                            '📥 Download Official Receipt (PDF)'
                                        )}
                                    </button>
                                    
                                    <div className="receipt-secondary-actions">
                                        <button 
                                            onClick={handlePreviewReceipt}
                                            disabled={isDownloadingPDF || isPrinting}
                                            className="action-btn preview"
                                        >
                                            👁️ Preview Receipt
                                        </button>
                                        
                                        <button 
                                            onClick={() => setShowPrintOptions(!showPrintOptions)}
                                            disabled={isDownloadingPDF || isPrinting}
                                            className="action-btn print"
                                        >
                                            🖨️ Print Receipt
                                        </button>
                                        
                                        <button 
                                            onClick={handlePaymentComplete}
                                            className="action-btn done"
                                            disabled={isDownloadingPDF || isPrinting}
                                        >
                                            ✓ Done
                                        </button>
                                        
                                        <button 
                                            onClick={scanNext}
                                            className="action-btn next"
                                            disabled={isDownloadingPDF || isPrinting}
                                        >
                                            🔄 Scan Next Student
                                        </button>
                                    </div>

                                    {showPrintOptions && (
                                        <div className="print-options-modal">
                                            <div className="modal-content">
                                            <div className="modal-header">
                                                <h5>Select Print Method</h5>
                                                <button 
                                                onClick={() => setShowPrintOptions(false)} 
                                                className="close-btn"
                                                disabled={isPrinting}
                                                >
                                                ✕
                                                </button>
                                            </div>
                                            
                                            <div className="print-instructions">
                                                <p className="instruction-note">
                                                <strong>Note:</strong> Ensure your printer is connected and turned on before printing.
                                                </p>
                                            </div>
                                            
                                            <div className="print-options">
                                                <button 
                                                onClick={() => {
                                                    setShowPrintOptions(false);
                                                    handlePrintReceipt('REGULAR');
                                                }}
                                                className="print-option-btn"
                                                disabled={isPrinting}
                                                >
                                                🖨️ Regular Printer
                                                <small>For A4/Letter paper with detailed breakdown</small>
                                                </button>
                                                
                                                <button 
                                                onClick={() => {
                                                    setShowPrintOptions(false);
                                                    handlePrintReceipt('THERMAL');
                                                }}
                                                className="print-option-btn terminal"
                                                disabled={isPrinting}
                                                >
                                                🧾 Thermal/Receipt Printer
                                                <small>For 80mm thermal paper printers</small>
                                                </button>
                                                
                                                <button 
                                                onClick={() => {
                                                    setShowPrintOptions(false);
                                                    handlePrintReceipt('DOT_MATRIX');
                                                }}
                                                className="print-option-btn"
                                                disabled={isPrinting}
                                                >
                                                🖨️ Dot Matrix Printer
                                                <small>For 80mm continuous paper printers</small>
                                                </button>
                                                
                                                <button 
                                                onClick={() => {
                                                    setShowPrintOptions(false);
                                                    // Show instructions first
                                                    if (window.confirm(
                                                    'For direct USB printing:\n\n' +
                                                    '1. Ensure your receipt printer is connected\n' +
                                                    '2. Set it as default printer\n' +
                                                    '3. Click OK to print receipt\n\n' +
                                                    'If printing fails, press Ctrl+P in the receipt window.'
                                                    )) {
                                                    handlePrintReceipt('THERMAL');
                                                    }
                                                }}
                                                className="print-option-btn direct"
                                                disabled={isPrinting}
                                                >
                                                🔌 Direct USB Print
                                                <small>For connected receipt printers</small>
                                                </button>
                                            </div>
                                            
                                            <div className="print-tips">
                                                <h6>Printing Tips:</h6>
                                                <ul>
                                                <li>For thermal printers, select "Save as PDF" then print from PDF viewer</li>
                                                <li>Set page size to 80mm width for receipt printers</li>
                                                <li>Use "Courier New" font for best thermal printer results</li>
                                                <li>For dot matrix printers, use continuous paper (80mm width)</li>
                                                <li>Regular printers work best with A4 or Letter paper</li>
                                                </ul>
                                            </div>
                                            </div>
                                        </div>
                                        )}
                                    
                                    <div className="email-confirmation-note">
                                        {receiptData.studentEmail ? (
                                            <p>📧 A confirmation email has been sent to: <strong>{receiptData.studentEmail}</strong></p>
                                        ) : (
                                            <p>⚠️ No email confirmation sent (email not available)</p>
                                        )}
                                        <p className="small-note">Keep this receipt for your records. You can also download it later from payment history.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeePaymentScanner;