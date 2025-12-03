import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceAPI, classAPI, attendanceFeeAPI } from '../services/api';
import './AttendanceScanner.css';

const AttendanceScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeClasses, setActiveClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [feeStatus, setFeeStatus] = useState(null);
  const [showFeeWarning, setShowFeeWarning] = useState(false);
  const [attendanceRestricted, setAttendanceRestricted] = useState(false); // NEW: For blocking attendance

  const html5QrCodeRef = useRef(null);
  const readerId = "reader";

  useEffect(() => {
    loadActiveClasses();
    return () => stopScanner();
  }, []);

  const loadActiveClasses = async () => {
    try {
      const classes = await classAPI.getAllActive();
      setActiveClasses(classes);
      
      if (classes.length === 1) {
        setSelectedClass(classes[0]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load active classes');
    }
  };



// CheckStudentFeeStatus function:
const checkStudentFeeStatus = async (studentId) => {
  try {
    console.log("💰 Checking fee status for student:", studentId);
    
    // Use the dedicated attendance fee check API
    const feeCheck = await attendanceFeeAPI.checkFeeStatusForAttendance(
      studentId, 
      selectedClass?.id
    );
    
    setFeeStatus(feeCheck);
    
    // The API already returns everything we need
    return {
      allowAttendance: feeCheck.allowAttendance,
      warningMessage: feeCheck.warningMessage,
      showWarning: feeCheck.showWarning,
      status: feeCheck,
      gracePeriodActive: feeCheck.isGracePeriodActive,
      daysOverdue: feeCheck.daysOverdue,
      balance: feeCheck.balance,
      isOverdue: feeCheck.overallStatus === "OVERDUE",
      requireTeacherApproval: feeCheck.requireTeacherApproval
    };
    
  } catch (error) {
    console.error("Error checking fee status:", error);
    // Fail-safe: allow attendance if check fails
    return { 
      allowAttendance: true, 
      warningMessage: 'Fee check failed - attendance allowed', 
      showWarning: false,
      status: null,
      gracePeriodActive: false,
      daysOverdue: 0,
      balance: 0,
      isOverdue: false,
      requireTeacherApproval: false
    };
  }
};

  const startScanner = async () => {
    try {
      if (!selectedClass) {
        setError("Please select a class first");
        return;
      }

      setError(null);
      setScanResult(null);
      setAttendanceRecord(null);
      setFeeStatus(null);
      setShowFeeWarning(false);
      setAttendanceRestricted(false);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const readerElement = document.getElementById(readerId);
      if (!readerElement) throw new Error("Scanner element not found in DOM");

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
          setScanResult(decodedText);
          await processAttendance(decodedText);
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

  const processAttendance = async (qrData) => {
    setIsLoading(true);
    try {
      const studentData = JSON.parse(qrData);
      
      // Check fee status with grace period logic
      const feeCheck = await checkStudentFeeStatus(studentData.studentId);
      
      if (!feeCheck.allowAttendance) {
        // Block attendance completely
        setAttendanceRestricted(true);
        setFeeStatus(feeCheck.status);
        return;
      }
      
      if (feeCheck.showWarning) {
        // Show warning but allow attendance
        setFeeStatus(feeCheck.status);
        setShowFeeWarning(true);
        
        // Store for later
        sessionStorage.setItem('pendingStudentData', JSON.stringify({
          studentData,
          classId: selectedClass.id,
          warningMessage: feeCheck.warningMessage
        }));
        
        return;
      }
      
      // No issues, record attendance directly
      await recordAttendance(studentData, selectedClass.id);
      
    } catch (err) {
      console.error("❌ Processing error:", err);
      setError(err.message || "Failed to process attendance");
    } finally {
      setIsLoading(false);
    }
  };

  const proceedWithAttendance = async () => {
    setIsLoading(true);
    try {
      const pendingData = JSON.parse(sessionStorage.getItem('pendingStudentData'));
      if (pendingData) {
        await recordAttendance(pendingData.studentData, pendingData.classId);
        setShowFeeWarning(false);
      }
    } catch (err) {
      console.error("❌ Error proceeding with attendance:", err);
      setError(err.message || "Failed to record attendance");
    } finally {
      setIsLoading(false);
      sessionStorage.removeItem('pendingStudentData');
    }
  };

  const recordAttendance = async (studentData, classId) => {
    const attendanceData = {
      studentId: studentData.studentId,
      classId: classId,
      date: new Date().toISOString().split('T')[0],
      status: 'PRESENT'
    };

    console.log("💾 Recording attendance:", attendanceData);
    
    const result = await attendanceAPI.recordManual(
      studentData.studentId, 
      attendanceData.date, 
      'PRESENT'
    );
    
    if (result.error) throw new Error(result.error);

    const enhancedResult = {
      ...result,
      className: selectedClass.className,
      grade: selectedClass.grade,
      classTeacher: selectedClass.classTeacher,
      subject: 'General',
      scanTime: new Date().toISOString(),
      feeStatus: feeStatus
    };
    
    setAttendanceRecord(enhancedResult);
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

  const resetScanner = async () => {
    setScanResult(null);
    setAttendanceRecord(null);
    setError(null);
    setFeeStatus(null);
    setShowFeeWarning(false);
    setAttendanceRestricted(false);
    setIsLoading(false);
    await stopScanner();
    sessionStorage.removeItem('pendingStudentData');
  };

  const scanNext = async () => {
    await resetScanner();
    setTimeout(() => startScanner(), 200);
  };

  // Helper to get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'PAID': return '#4caf50';
      case 'PENDING': return '#ff9800';
      case 'PARTIAL': return '#2196f3';
      case 'OVERDUE': return '#f44336';
      default: return '#757575';
    }
  };

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <h2>QR Attendance Scanner</h2>
        <p>Select class and scan student QR codes</p>
        <div className="grace-period-banner">
          <span className="grace-period-icon">⏳</span>
          <span>Grace Period: 1st - 14th of each month</span>
        </div>
      </div>

      {/* Class Selection */}
      <div className="session-selection">
        <label htmlFor="classSelect">Select Class:</label>
        <select 
          id="classSelect"
          value={selectedClass?.id || ''} 
          onChange={(e) => {
            const cls = activeClasses.find(c => c.id === parseInt(e.target.value));
            setSelectedClass(cls);
            resetScanner();
          }}
          disabled={isScanning}
        >
          <option value="">Choose a class...</option>
          {activeClasses.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.className} - {cls.grade} {cls.stream ? `(${cls.stream})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedClass && (
        <div className="current-session-info">
          <h4>Current Class</h4>
          <div className="session-details">
            <p><strong>Class:</strong> {selectedClass.className}</p>
            <p><strong>Grade:</strong> {selectedClass.grade}</p>
            <p><strong>Teacher:</strong> {selectedClass.classTeacher || 'Not Assigned'}</p>
          </div>
        </div>
      )}

      {/* Scanner Section */}
      <div id={readerId} className="qr-scanner"></div>

      {/* Control Buttons */}
      <div className="scanner-controls">
        {!isScanning && !scanResult && !attendanceRecord && !error && !showFeeWarning && !attendanceRestricted && (
          <button 
            onClick={startScanner} 
            className="start-scan-btn"
            disabled={!selectedClass}
          >
            {selectedClass ? 'Start Scanner' : 'Select Class First'}
          </button>
        )}

        {isScanning && (
          <>
            <p className="scanner-status">🟢 Scanning... Point the QR code at the camera</p>
            <button onClick={stopScanner} className="stop-scan-btn">
              Stop Scanner
            </button>
          </>
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      {/* NEW: Attendance Blocked Modal */}
      {attendanceRestricted && feeStatus && (
        <div className="attendance-blocked-overlay">
          <div className="attendance-blocked-modal">
            <div className="blocked-icon">🚫</div>
            <h3>Attendance Restricted</h3>
            <div className="blocked-details">
              <p><strong>Student ID:</strong> {feeStatus.studentId}</p>
              <p><strong>Name:</strong> {feeStatus.studentName}</p>
              <p><strong>Class:</strong> {feeStatus.className}</p>
              
              <div className="fee-summary">
                <div className="summary-item">
                  <span>Fee Status:</span>
                  <span className="status-badge" style={{backgroundColor: getStatusColor(feeStatus.overallStatus)}}>
                    {feeStatus.overallStatus}
                  </span>
                </div>
                <div className="summary-item">
                  <span>Total Due:</span>
                  <span>LKR {feeStatus.totalDue?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-item">
                  <span>Amount Paid:</span>
                  <span>LKR {feeStatus.totalPaid?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="summary-item">
                  <span>Balance:</span>
                  <span className="balance-amount negative">
                    LKR {feeStatus.balance?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="summary-item">
                  <span>Days Overdue:</span>
                  <span className="overdue-days">{feeStatus.daysOverdue || 0} days</span>
                </div>
              </div>
              
              <div className="restriction-reason">
                <p><strong>Reason:</strong> Fees overdue by more than 14 days</p>
                <p>Please settle the outstanding balance to enable attendance.</p>
              </div>
            </div>
            
            <div className="blocked-actions">
              <button 
                onClick={resetScanner} 
                className="ok-btn"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Warning Modal */}
      {showFeeWarning && feeStatus && (
        <div className="fee-warning-overlay">
          <div className="fee-warning-modal">
            <div className="warning-header">
              <div className="warning-icon">⚠️</div>
              <h3>Fee Payment Notice</h3>
            </div>
            
            <div className="fee-warning-details">
              <div className="student-info">
                <p><strong>Student ID:</strong> {feeStatus.studentId}</p>
                <p><strong>Name:</strong> {feeStatus.studentName}</p>
                <p><strong>Class:</strong> {feeStatus.className}</p>
              </div>
              
              <div className="fee-status-info">
                <div className="status-row">
                  <span>Payment Status:</span>
                  <span className={`payment-status ${feeStatus.overallStatus.toLowerCase()}`}>
                    {feeStatus.overallStatus}
                    {feeStatus.gracePeriodActive && <span className="grace-period-tag"> (Grace Period)</span>}
                  </span>
                </div>
                
                {feeStatus.gracePeriodActive ? (
                  <div className="grace-period-info">
                    <p>✅ Grace period active (ends in {feeStatus.gracePeriodEnds} days)</p>
                    <p>Next due date: {new Date(feeStatus.nextDueDate).toLocaleDateString()}</p>
                  </div>
                ) : feeStatus.daysOverdue ? (
                  <div className="overdue-info">
                    <p>⚠️ Fees overdue by {feeStatus.daysOverdue} days</p>
                    <p>Balance: <span className="overdue-amount">LKR {feeStatus.balance?.toFixed(2)}</span></p>
                  </div>
                ) : null}
                
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Total Due:</span>
                    <span>LKR {feeStatus.totalDue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="summary-row">
                    <span>Amount Paid:</span>
                    <span>LKR {feeStatus.totalPaid?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="summary-row">
                    <span>Balance:</span>
                    <span className={`balance ${feeStatus.balance > 0 ? 'negative' : 'positive'}`}>
                      LKR {feeStatus.balance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="warning-actions">
              <button 
                onClick={proceedWithAttendance} 
                className="proceed-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Allow Attendance'}
              </button>
              <button 
                onClick={resetScanner} 
                className="cancel-btn"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
            
            <p className="warning-note">
              <small>
                {feeStatus.gracePeriodActive 
                  ? 'Student is within grace period. Attendance can be recorded.'
                  : 'Attendance allowed at teacher discretion. Please follow up on payment.'}
              </small>
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {attendanceRecord && (
        <div className="attendance-success">
          <div className="success-header">
            <div className="success-icon">✅</div>
            <h3>Attendance Recorded</h3>
          </div>
          
          <div className="attendance-details">
            <div className="detail-row">
              <span>Student ID:</span>
              <span>{attendanceRecord.studentId}</span>
            </div>
            <div className="detail-row">
              <span>Name:</span>
              <span>{attendanceRecord.studentName}</span>
            </div>
            <div className="detail-row">
              <span>Class:</span>
              <span>{attendanceRecord.className}</span>
            </div>
            <div className="detail-row">
              <span>Time:</span>
              <span>{new Date(attendanceRecord.scanTime).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span>Status:</span>
              <span className="status present">PRESENT</span>
            </div>
            
            {feeStatus && (
              <div className="fee-summary-mini">
                <div className="fee-row">
                  <span>Fee Status:</span>
                  <span className={`fee-status-indicator ${feeStatus.overallStatus.toLowerCase()}`}>
                    {feeStatus.overallStatus}
                    {feeStatus.gracePeriodActive && ' (Grace Period)'}
                  </span>
                </div>
                {feeStatus.balance > 0 && (
                  <div className="fee-row">
                    <span>Balance:</span>
                    <span className="balance-remaining">LKR {feeStatus.balance.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <button onClick={scanNext} className="scan-again-btn">
            Scan Next Student
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && !showFeeWarning && !attendanceRestricted && (
        <div className="attendance-error">
          <div className="error-icon">❌</div>
          <h3>Error</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={resetScanner} className="scan-again-btn">
              Try Again
            </button>
            <button onClick={loadActiveClasses} className="reload-btn">
              Reload Classes
            </button>
          </div>
        </div>
      )}

      <div className="scanner-instructions">
        <h4>Attendance Policy:</h4>
        <ul>
          <li><strong>Grace Period:</strong> 1st - 14th of each month</li>
          <li><strong>Allowed during grace period:</strong> All students (paid/unpaid)</li>
          <li><strong>15th-28th:</strong> Attendance allowed with fee warnings</li>
          <li><strong>After 28th:</strong> Attendance blocked for unpaid students</li>
          <li>Teachers can override warnings for valid reasons</li>
        </ul>
      </div>
    </div>
  );
};

export default AttendanceScanner;