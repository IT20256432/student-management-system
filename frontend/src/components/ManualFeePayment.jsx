import React, { useState, useEffect } from 'react';
import { feePaymentAPI, studentAPI, classAPI, feeAPI } from '../services/api';
import { printReceipt, handleDirectUSBPrint as utilsHandleDirectUSBPrint } from '../utils/receiptPrintingUtils';
import './ManualFeePayment.css';

const ManualFeePayment = () => {
  // State declarations
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [classFeeStructure, setClassFeeStructure] = useState(null);
  const [feeStatus, setFeeStatus] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [existingPayments, setExistingPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFeeStructure, setIsLoadingFeeStructure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [lastPaymentId, setLastPaymentId] = useState(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // NEW STATES FOR TERMINAL PRINTER SUPPORT
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [terminalPrinterType, setTerminalPrinterType] = useState('REGULAR');
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(true);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    month: new Date().toISOString().substring(0, 7),
    notes: ''
  });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  // Status badge component
  const getStatusBadge = (status) => {
    const statusClass = status === 'PAID' ? 'paid' : 
                       status === 'PARTIAL' ? 'partial' : 
                       status === 'OVERDUE' ? 'overdue' : 'pending';
    return <span className={`fee-status-badge ${statusClass}`}>{status}</span>;
  };

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

  // Search for students
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSearchResults([]);
    setSelectedStudent(null);
    setSelectedClass(null);
    setAvailableClasses([]);
    setClassFeeStructure(null);
    setFeeStatus(null);
    setExistingPayments([]);
    
    try {
      const students = await studentAPI.getAll();
      
      const filtered = students.filter(student => 
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.firstName + ' ' + student.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setSearchResults(filtered.slice(0, 10));
      
      if (filtered.length === 0) {
        setError('No students found matching your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Error searching for students');
    } finally {
      setIsLoading(false);
    }
  };

  // Select student
  const handleSelectStudent = async (student) => {
    setIsLoading(true);
    setError(null);
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedClass(null);
    setClassFeeStructure(null);
    setFeeStatus(null);
    setExistingPayments([]);
    setShowClassSelection(false);
    setAvailableClasses([]);
    
    try {
      console.log(`🎯 Student selected: ${student.studentId}, Grade: ${student.grade}`);
      
      // Get classes for student's grade
      let classes = [];
      if (student.grade) {
        try {
          classes = await classAPI.getByGrade(student.grade);
          console.log(`✅ Found ${classes.length} classes for grade ${student.grade}`);
        } catch (classError) {
          console.warn('Could not load classes for grade:', classError.message);
          classes = createFallbackClasses(student.grade);
        }
      } else {
        try {
          classes = await classAPI.getAll();
        } catch (allClassError) {
          console.warn('Could not load all classes:', allClassError.message);
          classes = [];
        }
      }
      
      setAvailableClasses(classes);
      
      // If student has an assigned class, preselect it
      if (student.schoolClass && student.schoolClass.id && classes.length > 0) {
        const assignedClass = classes.find(c => c.id === student.schoolClass.id);
        if (assignedClass) {
          await selectClassForPayment(assignedClass);
        } else if (classes.length > 0) {
          setShowClassSelection(true);
        } else {
          setError('No classes available for this student');
        }
      } else if (classes.length > 0) {
        setShowClassSelection(true);
      } else {
        setError('No classes available for this student');
      }
      
    } catch (error) {
      console.error('Error loading student data:', error);
      setError('Failed to load student information');
    } finally {
      setIsLoading(false);
    }
  };

  // Create fallback classes
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

  const selectClassForPayment = async (classItem) => {
    if (!selectedStudent) {
      setError('Please select a student first');
      return;
    }
    
    setIsLoadingFeeStructure(true);
    setError(null);
    
    try {
      console.log(`🎯 Selected class: ${classItem.className} (ID: ${classItem.id})`);
      
      setSelectedClass(classItem);
      setShowClassSelection(false);
      
      // Load fee structure
      let feeStructure;
      try {
        feeStructure = await feeAPI.getByClass(classItem.id);
        console.log('✅ Fee structure loaded:', feeStructure);
        
        if (!feeStructure) {
          feeStructure = getFallbackFeeStructure(classItem.grade || selectedStudent.grade);
          feeStructure._isFallback = true;
        }
      } catch (feeError) {
        console.warn('⚠️ Fee structure not found, using fallback:', feeError.message);
        feeStructure = getFallbackFeeStructure(classItem.grade || selectedStudent.grade);
        feeStructure._isFallback = true;
      }
      
      setClassFeeStructure(feeStructure);
      
      // Load ALL payments for this class
      console.log('📋 Loading all payments for class...');
      let allPayments = [];
      try {
        allPayments = await feePaymentAPI.getStudentPaymentsForClass(
          selectedStudent.studentId, 
          classItem.id
        );
        console.log('📋 All payments found:', allPayments.length);
      } catch (paymentsError) {
        console.error('❌ Error loading payments:', paymentsError);
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
        studentId: selectedStudent.studentId,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        className: classItem.className,
        classId: classItem.id,
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

  // Get fallback fee structure
  const getFallbackFeeStructure = (grade) => {
    const defaultFees = {
      'O/L': {
        id: 0,
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
        id: 0,
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
    
    const feeStructure = defaultFees[grade] || defaultFees['O/L'];
    return {
      ...feeStructure,
      schoolClass: selectedClass || { className: `${grade} Class`, grade: grade }
    };
  };

  useEffect(() => {
    const refreshFeeStatusForMonth = async () => {
      if (!selectedStudent || !selectedClass || !paymentForm.month) return;
      
      console.log(`🔄 Month changed to ${paymentForm.month}, refreshing fee status...`);
      
      try {
        setIsLoadingFeeStructure(true);
        
        // Get ALL payments for this student and class
        let allPayments = [];
        try {
          allPayments = await feePaymentAPI.getStudentPaymentsForClass(
            selectedStudent.studentId,
            selectedClass.id
          );
          console.log(`📋 Found ${allPayments.length} total payments for class`);
        } catch (paymentsError) {
          console.error('Error loading payments:', paymentsError);
          allPayments = [];
        }
        
        // Filter payments for the SPECIFIC month
        const monthPayments = allPayments.filter(payment => {
          // Normalize the month format (YYYY-MM)
          const paymentMonth = payment.month ? 
            payment.month.split('-').slice(0, 2).join('-') : 
            null;
          
          return paymentMonth === paymentForm.month;
        });
        
        console.log(`📊 Found ${monthPayments.length} payments for ${paymentForm.month}`);
        
        // Get fee structure
        let feeStructure;
        try {
          feeStructure = await feeAPI.getByClass(selectedClass.id);
        } catch (feeError) {
          console.warn('Using fallback fee structure');
          feeStructure = getFallbackFeeStructure(selectedClass.grade || selectedStudent.grade);
        }
        
        const totalDue = feeStructure.totalFee || 8000;
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
          studentId: selectedStudent.studentId,
          studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
          className: selectedClass.className,
          classId: selectedClass.id,
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
    
    if (selectedStudent && selectedClass && paymentForm.month) {
      refreshFeeStatusForMonth();
    }
  }, [paymentForm.month, selectedStudent, selectedClass]);

  // Handle payment
  const handlePayment = async () => {
    if (!selectedStudent) {
      setError("Please select a student first");
      return;
    }

    if (!selectedClass) {
      setError("Please select a class for payment");
      return;
    }

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (!classFeeStructure) {
      setError("Fee structure not loaded. Please try selecting the class again.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const paymentData = {
        studentId: selectedStudent.studentId,
        classId: selectedClass.id,
        amountPaid: parseFloat(paymentForm.amount),
        paymentDate: new Date().toISOString().split('T')[0],
        month: paymentForm.month,
        paymentMethod: paymentForm.paymentMethod,
        transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
        notes: paymentForm.notes
      };

      console.log("💳 Recording manual payment...", paymentData);
      
      const result = await feePaymentAPI.recordPaymentWithEmail(paymentData);
      console.log("✅ Manual payment recorded:", result);
      
      // Save payment ID and receipt data WITH FEE BREAKDOWN
      setLastPaymentId(result.id || result.paymentId);
      setReceiptData({
        studentName: selectedStudent.firstName + " " + selectedStudent.lastName,
        studentId: selectedStudent.studentId,
        className: selectedClass.className,
        amount: paymentForm.amount,
        month: paymentForm.month,
        date: new Date().toISOString().split('T')[0],
        transactionId: paymentData.transactionId,
        studentEmail: selectedStudent.email,
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

      try {
        const allPayments = await feePaymentAPI.getStudentPaymentsForClass(
          selectedStudent.studentId, 
          selectedClass.id
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

      // Show success message
      setSuccessMessage(`✅ Payment of ${formatCurrency(parseFloat(paymentForm.amount))} recorded successfully!`);

    } catch (err) {
      console.error("❌ Payment error:", err);
      setError(err.message || "Failed to record payment");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedStudent(null);
    setSelectedClass(null);
    setAvailableClasses([]);
    setClassFeeStructure(null);
    setFeeStatus(null);
    setSearchResults([]);
    setExistingPayments([]);
    setShowClassSelection(false);
    setPaymentForm({
      amount: '',
      paymentMethod: 'CASH',
      month: new Date().toISOString().substring(0, 7),
      notes: ''
    });
    setShowReceiptOptions(false);
    setShowPrintOptions(false);
    setLastPaymentId(null);
    setReceiptData(null);
    setError(null);
    setSuccessMessage(null);
    setIsLoading(false);
    setIsLoadingFeeStructure(false);
    setTerminalPrinterType('REGULAR');
    setShowFeeBreakdown(true);
  };

  // PDF Receipt Functions
  const handleDownloadReceipt = async () => {
    if (!lastPaymentId) return;
    
    setIsDownloadingPDF(true);
    try {
      const filename = await feePaymentAPI.downloadReceiptPDF(lastPaymentId);
      setSuccessMessage(`✅ Receipt downloaded: ${filename}`);
      
      setTimeout(() => {
        setShowReceiptOptions(false);
        resetForm();
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
      const totalFee = receiptData.feeBreakdown?.totalFee || totalAmount;
      
      // Generate fee breakdown for preview
      let feeBreakdownHTML = '';
      const fees = [
        { name: 'Monthly Fee', amount: receiptData.feeBreakdown?.monthlyFee || 0 },
        { name: 'Admission Fee', amount: receiptData.feeBreakdown?.admissionFee || 0 },
        { name: 'Exam Fee', amount: receiptData.feeBreakdown?.examFee || 0 },
        { name: 'Sports Fee', amount: receiptData.feeBreakdown?.sportsFee || 0 },
        { name: 'Library Fee', amount: receiptData.feeBreakdown?.libraryFee || 0 },
        { name: 'Lab Fee', amount: receiptData.feeBreakdown?.labFee || 0 },
        { name: 'Other Fees', amount: receiptData.feeBreakdown?.otherFee || 0 }
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

  const handleTerminalPrintReceipt = async () => {
    if (!receiptData) return;
    
    setIsPrinting(true);
    try {
        const success = printReceipt(receiptData, terminalPrinterType);
        if (!success) {
            throw new Error('Failed to open print window');
        }
        
        setSuccessMessage(`✅ Receipt sent to ${terminalPrinterType} printer successfully!`);
        
        // Auto-close print options after successful print
        setTimeout(() => {
            setShowPrintOptions(false);
        }, 2000);
    } catch (error) {
        console.error("❌ Terminal print failed:", error);
        setError("Failed to print to terminal: " + error.message);
    } finally {
        setIsPrinting(false);
    }
};

const handleThermalPrint = () => {
    setIsPrinting(true);
    try {
        const success = printReceipt(receiptData, 'THERMAL');
        if (!success) {
            throw new Error('Failed to open print window');
        }
    } catch (error) {
        console.error("❌ Thermal print failed:", error);
        setError("Failed to print receipt: " + error.message);
    } finally {
        setIsPrinting(false);
    }
};

  // SIMULATED TERMINAL PRINTER PREVIEW (for demonstration)
  const handleTerminalPreview = () => {
    if (!receiptData) return;
    
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      alert('Please allow pop-ups to preview terminal receipt');
      return;
    }
    
    const totalAmount = parseFloat(receiptData.amount);
    const totalFee = receiptData.feeBreakdown?.totalFee || totalAmount;
    
    // Generate terminal-style receipt
    const terminalHTML = `
      <html>
      <head>
        <title>Terminal Printer Preview</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: ${terminalPrinterType === 'THERMAL' ? '12px' : '14px'};
            line-height: 1.2;
            background: #f5f5f5;
            padding: 20px;
            max-width: ${terminalPrinterType === 'THERMAL' ? '320px' : '400px'};
            margin: 0 auto;
          }
          .terminal-receipt {
            background: white;
            border: 1px solid #ccc;
            padding: ${terminalPrinterType === 'THERMAL' ? '15px' : '20px'};
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #333;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .center {
            text-align: center;
          }
          .right {
            text-align: right;
          }
          .divider {
            border-top: 1px dashed #333;
            margin: 10px 0;
          }
          .bold {
            font-weight: bold;
          }
          .large {
            font-size: ${terminalPrinterType === 'THERMAL' ? '14px' : '16px'};
          }
          .footer {
            margin-top: 20px;
            font-size: 10px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="terminal-receipt">
          <div class="header">
            <div class="center bold large">SCHOOL NAME</div>
            <div class="center">Fee Payment Receipt</div>
            <div class="center">${terminalPrinterType === 'THERMAL' ? '58mm Thermal' : '80mm Receipt'}</div>
          </div>
          
          <div class="center">
            Transaction ID: ${receiptData.transactionId}
          </div>
          <div class="center">
            Date: ${receiptData.date}
          </div>
          
          <div class="divider"></div>
          
          <div>
            <div>Student: ${receiptData.studentName}</div>
            <div>ID: ${receiptData.studentId}</div>
            <div>Class: ${receiptData.className}</div>
            <div>Month: ${receiptData.month}</div>
          </div>
          
          <div class="divider"></div>
          
          ${showFeeBreakdown ? `
          <div class="bold">FEE BREAKDOWN:</div>
          ${receiptData.feeBreakdown?.monthlyFee ? `<div>Monthly Fee:      ${formatCurrency(receiptData.feeBreakdown.monthlyFee)}</div>` : ''}
          ${receiptData.feeBreakdown?.admissionFee ? `<div>Admission Fee:    ${formatCurrency(receiptData.feeBreakdown.admissionFee)}</div>` : ''}
          ${receiptData.feeBreakdown?.examFee ? `<div>Exam Fee:         ${formatCurrency(receiptData.feeBreakdown.examFee)}</div>` : ''}
          ${receiptData.feeBreakdown?.sportsFee ? `<div>Sports Fee:       ${formatCurrency(receiptData.feeBreakdown.sportsFee)}</div>` : ''}
          ${receiptData.feeBreakdown?.libraryFee ? `<div>Library Fee:      ${formatCurrency(receiptData.feeBreakdown.libraryFee)}</div>` : ''}
          ${receiptData.feeBreakdown?.labFee ? `<div>Lab Fee:          ${formatCurrency(receiptData.feeBreakdown.labFee)}</div>` : ''}
          ${receiptData.feeBreakdown?.otherFee ? `<div>Other Fees:       ${formatCurrency(receiptData.feeBreakdown.otherFee)}</div>` : ''}
          <div class="bold">Total Fee:        ${formatCurrency(totalFee)}</div>
          <div class="divider"></div>
          ` : ''}
          
          <div class="bold">PAYMENT DETAILS:</div>
          <div>Amount Paid:      ${formatCurrency(totalAmount)}</div>
          <div>Payment Method:   ${receiptData.paymentMethod}</div>
          <div>Balance:          ${formatCurrency(totalFee - totalAmount)}</div>
          
          <div class="divider"></div>
          
          <div class="center large bold">
            AMOUNT PAID:<br>
            ${formatCurrency(totalAmount)}
          </div>
          
          <div class="divider"></div>
          
          <div class="center">
            <div>Thank you for your payment!</div>
            <div>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          </div>
          
          <div class="footer">
            This is a preview of how the receipt will look on ${terminalPrinterType === 'THERMAL' ? 'thermal' : terminalPrinterType.toLowerCase()} printer.
            Actual print may vary based on printer configuration.
          </div>
        </div>
        
        <script>
          setTimeout(() => {
            window.print();
          }, 1000);
        </script>
      </body>
      </html>
    `;
    
    previewWindow.document.write(terminalHTML);
    previewWindow.document.close();
  };

  return (
    <div className="manual-fee-container">
      <div className="manual-header">
        <h2>Manual Fee Collection</h2>
        <p>Collect fees without QR code scanning</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <div className="error-icon">❌</div>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="dismiss-btn">
            Dismiss
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <p>{successMessage}</p>
        </div>
      )}

      {/* Loading Overlay */}
      {(isLoading || isLoadingFeeStructure) && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>{isLoadingFeeStructure ? 'Loading fee structure...' : 'Loading...'}</p>
        </div>
      )}

      {/* Student Search Section */}
      {!selectedStudent && !isLoading && (
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by Student ID, Name, or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
            />
            <button 
              onClick={handleSearch} 
              className="search-btn"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? '🔍 Searching...' : '🔍 Search Student'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              <h4>Search Results ({searchResults.length})</h4>
              {searchResults.map(student => (
                <div 
                  key={student.id} 
                  className="student-result-card"
                  onClick={() => handleSelectStudent(student)}
                >
                  <div className="student-info">
                    <h5>{student.firstName} {student.lastName}</h5>
                    <div className="student-details">
                      <p><strong>ID:</strong> {student.studentId}</p>
                      <p><strong>Grade:</strong> {student.grade || 'Not specified'}</p>
                      <p><strong>Current Class:</strong> {student.schoolClass?.className || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div className="select-indicator">
                    <button className="select-btn">Select →</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Class Selection Modal */}
      {showClassSelection && selectedStudent && availableClasses.length > 0 && (
        <div className="class-selection-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Select Class for Payment</h3>
              <p>{selectedStudent.firstName} is enrolled in {availableClasses.length} class(es). Select which class to pay fees for.</p>
              <button onClick={() => setShowClassSelection(false)} className="close-btn">
                ✕
              </button>
            </div>
            
            <div className="class-selection-grid">
              {availableClasses.map(cls => (
                <div 
                  key={cls.id}
                  className="class-option"
                  onClick={() => !isLoadingFeeStructure && selectClassForPayment(cls)}
                >
                  <div className="class-info">
                    <h4>{cls.className}</h4>
                    <div className="class-details">
                      <p><strong>Grade:</strong> {cls.grade}</p>
                      <p><strong>Teacher:</strong> {cls.classTeacher}</p>
                      <p><strong>Room:</strong> {cls.roomNumber}</p>
                    </div>
                  </div>
                  <div className="class-actions">
                    <button 
                      className="select-class-btn"
                      disabled={isLoadingFeeStructure}
                    >
                      {isLoadingFeeStructure ? 'Loading...' : 'Pay Fees for This Class'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowClassSelection(false)}
                className="cancel-btn"
                disabled={isLoadingFeeStructure}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected Information Section */}
      {selectedStudent && !isLoading && (
        <div className="selected-info-section">
          {/* Student Information */}
          <div className="student-info-card">
            <div className="info-header">
              <div>
                <h4>{selectedStudent.firstName} {selectedStudent.lastName}</h4>
                <p className="student-id">ID: {selectedStudent.studentId}</p>
              </div>
              <button onClick={resetForm} className="change-btn" disabled={isProcessing}>
                Change Student
              </button>
            </div>
            
            <div className="student-details-grid">
              <div className="detail-item">
                <strong>Grade:</strong> {selectedStudent.grade || 'Not specified'}
              </div>
              <div className="detail-item">
                <strong>Email:</strong> {selectedStudent.email || 'No email'}
              </div>
              <div className="detail-item">
                <strong>Contact:</strong> {selectedStudent.contactNumber || 'Not provided'}
              </div>
            </div>
          </div>

          {/* Selected Class Information */}
          {selectedClass && (
            <div className="class-info-card">
              <div className="info-header">
                <div>
                  <h4>Selected Class: {selectedClass.className}</h4>
                  {feeStatus && getStatusBadge(feeStatus.overallStatus)}
                </div>
                <button 
                  onClick={() => setShowClassSelection(true)}
                  className="change-btn"
                  disabled={isProcessing}
                >
                  Change Class
                </button>
              </div>
              
              <div className="class-details-grid">
                <div className="detail-item">
                  <strong>Grade:</strong> {selectedClass.grade}
                </div>
                <div className="detail-item">
                  <strong>Teacher:</strong> {selectedClass.classTeacher}
                </div>
                <div className="detail-item">
                  <strong>Room:</strong> {selectedClass.roomNumber}
                </div>
              </div>
            </div>
          )}

          {/* Fee Structure Details */}
          {classFeeStructure && (
            <div className="fee-structure-card">
              <h4>Class Fee Structure - {selectedClass?.className}</h4>
              {classFeeStructure._isFallback && (
                <div className="demo-notice">
                  <small>📱 Using standard fee structure for {selectedClass?.grade || selectedStudent.grade}</small>
                </div>
              )}
              <div className="fee-breakdown-detailed">
                <div className="fee-item">
                  <span>Monthly Fee:</span>
                  <span>{formatCurrency(classFeeStructure.monthlyFee || 0)}</span>
                </div>
                <div className="fee-item">
                  <span>Admission Fee:</span>
                  <span>{formatCurrency(classFeeStructure.admissionFee || 0)}</span>
                </div>
                <div className="fee-item">
                  <span>Exam Fee:</span>
                  <span>{formatCurrency(classFeeStructure.examFee || 0)}</span>
                </div>
                <div className="fee-item">
                  <span>Sports Fee:</span>
                  <span>{formatCurrency(classFeeStructure.sportsFee || 0)}</span>
                </div>
                <div className="fee-item">
                  <span>Library Fee:</span>
                  <span>{formatCurrency(classFeeStructure.libraryFee || 0)}</span>
                </div>
                <div className="fee-item">
                  <span>Lab Fee:</span>
                  <span>{formatCurrency(classFeeStructure.labFee || 0)}</span>
                </div>
                <div className="fee-item">
                  <span>Other Fees:</span>
                  <span>{formatCurrency(classFeeStructure.otherFee || 0)}</span>
                </div>
                <div className="fee-item total">
                  <span><strong>Total Monthly Fee:</strong></span>
                  <span><strong>{formatCurrency(classFeeStructure.totalFee || 0)}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Current Fee Status */}
          {feeStatus && (
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
          )}

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

          {/* Email Notification */}
          {!showReceiptOptions && selectedStudent.email && (
            <div className="email-notification-section">
              <div className="email-notification">
                <div className="email-icon">📧</div>
                <div className="email-info">
                  <h5>Payment Confirmation Email</h5>
                  <p>A confirmation email will be sent to:</p>
                  <p className="student-email-target">
                    <strong>{selectedStudent.email}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Form */}
      {selectedStudent && selectedClass && classFeeStructure && !showReceiptOptions && (
        <div className="payment-form-section">
          <h3>Record Payment for {selectedClass.className}</h3>
          
          {/* Payment Suggestions */}
          <div className="payment-suggestions">
            <button 
              onClick={() => setPaymentForm({...paymentForm, amount: (classFeeStructure.totalFee || 0).toString()})}
              className="suggestion-btn full-fee"
              disabled={isProcessing}
            >
              Pay Full Fee: {formatCurrency(classFeeStructure.totalFee || 0)}
            </button>
            <button 
              onClick={() => setPaymentForm({...paymentForm, amount: (classFeeStructure.monthlyFee || 0).toString()})}
              className="suggestion-btn monthly"
              disabled={isProcessing}
            >
              Monthly Only: {formatCurrency(classFeeStructure.monthlyFee || 0)}
            </button>
            {feeStatus && (feeStatus.balance || 0) > 0 && (
              <button 
                onClick={() => setPaymentForm({...paymentForm, amount: (feeStatus.balance || 0).toString()})}
                className="suggestion-btn balance"
                disabled={isProcessing}
              >
                Pay Balance: {formatCurrency(feeStatus.balance || 0)}
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
              <small>
                Balance: {formatCurrency(feeStatus?.balance || 0)} | 
                Full fee: {formatCurrency(classFeeStructure.totalFee || 0)}
              </small>
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
                disabled={isProcessing}
              />
            </div>

            <div className="form-group full-width">
              <label>Notes (Optional)</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                placeholder={`Additional notes about payment for ${selectedClass.className}...`}
                rows="3"
                disabled={isProcessing}
              />
            </div>
          </div>

          <div className="payment-actions">
            <button 
              onClick={handlePayment}
              disabled={isProcessing || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
              className="pay-btn"
            >
              {isProcessing ? (
                <>
                  <div className="spinner-small"></div>
                  Processing...
                </>
              ) : (
                `Record Payment of ${formatCurrency(parseFloat(paymentForm.amount))}`
              )}
            </button>
            <button onClick={resetForm} className="cancel-btn" disabled={isProcessing}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Receipt Download Section */}
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
              </div>
            </div>
            
            <div className="receipt-actions">
              <button 
                onClick={handleDownloadReceipt}
                disabled={isDownloadingPDF}
                className="download-receipt-btn primary"
              >
                {isDownloadingPDF ? (
                  <>
                    <div className="spinner-small"></div>
                    Downloading PDF...
                  </>
                ) : (
                  '📥 Download Official Receipt (PDF)'
                )}
              </button>
              
              <div className="receipt-secondary-actions">
                <button 
                  onClick={handlePreviewReceipt}
                  disabled={isDownloadingPDF}
                  className="action-btn preview"
                >
                  👁️ Preview Receipt
                </button>
                
                <button 
                  onClick={() => setShowPrintOptions(true)}
                  disabled={isDownloadingPDF || isPrinting}
                  className="action-btn print"
                >
                  🖨️ Print Receipt
                </button>
                
                <button 
                  onClick={resetForm}
                  className="action-btn done"
                >
                  ✓ Done & Start New
                </button>
              </div>
              
              <div className="email-confirmation-note">
                {receiptData.studentEmail ? (
                  <p>📧 A confirmation email has been sent to: <strong>{receiptData.studentEmail}</strong></p>
                ) : (
                  <p>⚠️ No email confirmation sent (email not available)</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Printer Options Modal */}
      {showPrintOptions && (
        <div className="terminal-printer-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Print Receipt to Terminal</h3>
              <p>Select printer type and options for terminal printing</p>
              <button 
                onClick={() => setShowPrintOptions(false)} 
                className="close-btn"
                disabled={isPrinting}
              >
                ✕
              </button>
            </div>
                         
              {/* Print Options */}
              <div className="print-options-section">
                <h4>Print Options</h4>
                <div className="options-grid">
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={showFeeBreakdown}
                      onChange={(e) => setShowFeeBreakdown(e.target.checked)}
                      disabled={isPrinting}
                    />
                    <span>Include Fee Breakdown</span>
                    <small>Show detailed fee structure on receipt</small>
                  </label>
                  
                  
                </div>
              </div>              
              
              <div className="print-options">
    <button 
        onClick={() => {
            setShowPrintOptions(false);
            printReceipt(receiptData, 'REGULAR');
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
            printReceipt(receiptData, 'THERMAL');
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
            printReceipt(receiptData, 'DOT_MATRIX');
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
            utilsHandleDirectUSBPrint(receiptData);
        }}
        className="print-option-btn direct"
        disabled={isPrinting}
    >
        🔌 Direct USB Print
        <small>For connected receipt printers</small>
    </button>

</div>
              
              {/* Printer Status */}
              {isPrinting && (
                <div className="printer-status">
                  <div className="status-indicator processing"></div>
                  <p>Sending receipt to {terminalPrinterType} printer...</p>
                </div>
              )}
            </div>
          </div>
     
      )}
    </div>
  );
};

export default ManualFeePayment;