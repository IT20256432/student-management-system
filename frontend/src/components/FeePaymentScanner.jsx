import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { studentAPI, feePaymentAPI, feeAPI, classAPI } from '../services/api';
import './FeePaymentScanner.css';

const FeePaymentScanner = () => {
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

    const html5QrCodeRef = useRef(null);
    const readerId = "fee-qr-reader";

    useEffect(() => {
        return () => stopScanner();
    }, []);

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
        setLastPaymentId(null);
        setReceiptData(null);
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

            // Get fee structure for selected class
            let feeStructure = await feeAPI.getByClass(classObj.id);
            if (!feeStructure) {
                console.log('📝 Using fallback fee structure');
                feeStructure = getFallbackFeeStructure(student.grade);
                feeStructure._isFallback = true;
            }

            // Get fee status for this class
            let status;
            try {
                status = await feePaymentAPI.getFeeStatusForClass(student.studentId, classObj.id);
            } catch (statusError) {
                console.log('⚠️ Using fallback fee status');
                status = {
                    studentId: student.studentId,
                    studentName: `${student.firstName} ${student.lastName}`,
                    className: classObj.className,
                    totalDue: feeStructure.totalFee,
                    totalPaid: 0,
                    balance: feeStructure.totalFee,
                    overallStatus: 'PENDING',
                    classId: classObj.id
                };
            }

            setScannedStudent(student);
            setFeeStatus(status);
            setClassFeeStructure(feeStructure);

            // Auto-fill payment amount
            const suggestedAmount = status.balance > 0 ? status.balance : feeStructure.totalFee;
            setPaymentForm(prev => ({
                ...prev,
                amount: suggestedAmount.toString()
            }));

        } catch (error) {
            console.error('❌ Error selecting class:', error);
            setError(`Failed to load class data: ${error.message}`);
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
                notes: paymentForm.notes
            };

            console.log("💳 Recording payment with email...");
            
            // NEW: Use the email-enabled endpoint
            const result = await feePaymentAPI.recordPaymentWithEmail(paymentData);
            console.log("✅ Payment recorded with email:", result);
            
            // Save payment ID and receipt data
            setLastPaymentId(result.id);
            setReceiptData({
                studentName: scannedStudent.firstName + " " + scannedStudent.lastName,
                studentId: scannedStudent.studentId,
                className: selectedPaymentClass.className,
                amount: paymentForm.amount,
                month: paymentForm.month,
                date: new Date().toISOString().split('T')[0],
                transactionId: paymentData.transactionId,
                studentEmail: scannedStudent.email
            });
            
            // Show receipt download options
            setShowReceiptOptions(true);

            // Refresh fee status
            const updatedStatus = await feePaymentAPI.getFeeStatusForClass(
                scannedStudent.studentId, 
                selectedPaymentClass.id
            );
            setFeeStatus(updatedStatus);

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

    // NEW: DOWNLOAD PDF RECEIPT
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

    // NEW: PREVIEW RECEIPT IN NEW TAB
    const handlePreviewReceipt = async () => {
        if (!lastPaymentId) return;
        
        setIsDownloadingPDF(true);
        try {
            const receipt = await feePaymentAPI.getReceiptBase64(lastPaymentId);
            
            // Open PDF in new tab
            const pdfWindow = window.open();
            if (pdfWindow) {
                pdfWindow.document.write(`
                    <html>
                    <head>
                        <title>Receipt Preview - ${receipt.filename}</title>
                    </head>
                    <body style="margin: 0; padding: 0;">
                        <embed 
                            src="data:application/pdf;base64,${receipt.pdfBase64}" 
                            type="application/pdf" 
                            width="100%" 
                            height="100%"
                            style="position: absolute; top: 0; left: 0;"
                        />
                    </body>
                    </html>
                `);
            }
        } catch (error) {
            console.error("❌ Receipt preview failed:", error);
            setError("Failed to preview receipt: " + error.message);
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    // NEW: PRINT RECEIPT
    const handlePrintReceipt = async () => {
        if (!lastPaymentId) return;
        
        setIsDownloadingPDF(true);
        try {
            const receipt = await feePaymentAPI.getReceiptBase64(lastPaymentId);
            
            // Create iframe for printing
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`
                <html>
                <head>
                    <title>Print Receipt</title>
                    <style>
                        body { margin: 0; padding: 0; }
                        @media print {
                            body { margin: 0; }
                        }
                    </style>
                </head>
                <body>
                    <embed 
                        src="data:application/pdf;base64,${receipt.pdfBase64}" 
                        type="application/pdf" 
                        width="100%" 
                        height="100%"
                    />
                </body>
                </html>
            `);
            doc.close();
            
            // Wait for PDF to load then print
            iframe.onload = () => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                document.body.removeChild(iframe);
            };
            
        } catch (error) {
            console.error("❌ Print failed:", error);
            setError("Failed to print receipt: " + error.message);
        } finally {
            setIsDownloadingPDF(false);
        }
    };

    // NEW: RESET AFTER PAYMENT
    const handlePaymentComplete = () => {
        setShowReceiptOptions(false);
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
                        <h4>Current Payment Status - {selectedPaymentClass.className}</h4>
                        <div className="fee-breakdown">
                            <div className="fee-item">
                                <span>Total Due:</span>
                                <span className="amount">{formatCurrency(feeStatus.totalDue)}</span>
                            </div>
                            <div className="fee-item">
                                <span>Total Paid:</span>
                                <span className="amount paid">{formatCurrency(feeStatus.totalPaid)}</span>
                            </div>
                            <div className="fee-item total">
                                <span>Remaining Balance:</span>
                                <span className={`amount ${feeStatus.balance > 0 ? 'pending' : 'paid'}`}>
                                    {formatCurrency(feeStatus.balance)}
                                </span>
                            </div>
                        </div>
                    </div>

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
                            >
                                Pay Full Fee: {formatCurrency(classFeeStructure.totalFee)}
                            </button>
                            <button 
                                onClick={() => setPaymentForm({...paymentForm, amount: classFeeStructure.monthlyFee.toString()})}
                                className="suggestion-btn monthly"
                            >
                                Monthly Only: {formatCurrency(classFeeStructure.monthlyFee)}
                            </button>
                            {feeStatus.balance > 0 && (
                                <button 
                                    onClick={() => setPaymentForm({...paymentForm, amount: feeStatus.balance.toString()})}
                                    className="suggestion-btn balance"
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
                                />
                                <small>Full fee: {formatCurrency(classFeeStructure.totalFee)} | Balance: {formatCurrency(feeStatus.balance)}</small>
                            </div>

                            <div className="form-group">
                                <label>Payment Method *</label>
                                <select
                                    value={paymentForm.paymentMethod}
                                    onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
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
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Notes (Optional)</label>
                                <textarea
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                                    placeholder={`Additional notes about payment for ${selectedPaymentClass.className}...`}
                                    rows="3"
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
                                            onClick={handlePrintReceipt}
                                            disabled={isDownloadingPDF}
                                            className="action-btn print"
                                        >
                                            🖨️ Print Receipt
                                        </button>
                                        
                                        <button 
                                            onClick={handlePaymentComplete}
                                            className="action-btn done"
                                        >
                                            ✓ Done
                                        </button>
                                        
                                        <button 
                                            onClick={scanNext}
                                            className="action-btn next"
                                        >
                                            🔄 Scan Next Student
                                        </button>
                                    </div>
                                    
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