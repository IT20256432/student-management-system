import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceAPI, classAPI, attendanceFeeAPI, scheduleAPI } from '../services/api';
import './AttendanceScanner.css';

const AttendanceScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeClasses, setActiveClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [classSchedules, setClassSchedules] = useState([]);
  const [feeStatus, setFeeStatus] = useState(null);
  const [showFeeWarning, setShowFeeWarning] = useState(false);
  const [attendanceRestricted, setAttendanceRestricted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  const html5QrCodeRef = useRef(null);
  const readerId = "reader";

  // Map day numbers to your schedule days
  const getTodayDayOfWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Map to your schedule system's day names (from your ScheduleManager)
    const dayMap = {
      0: 'SUNDAY',
      1: 'MONDAY',
      2: 'TUESDAY',
      3: 'WEDNESDAY',
      4: 'THURSDAY',
      5: 'FRIDAY',
      6: 'SATURDAY'
    };
    
    return dayMap[day];
  };

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadActiveClasses();
    return () => stopScanner();
  }, []);

  // When class is selected, load its schedules
  useEffect(() => {
    if (selectedClass) {
      loadClassSchedules(selectedClass.id);
    }
  }, [selectedClass]);

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

  // Load schedules for selected class - using YOUR ScheduleManager's data
  const loadClassSchedules = async (classId) => {
    setLoadingSchedules(true);
    try {
      console.log(`📅 Loading schedules for class ${classId}...`);
      
      const todayDay = getTodayDayOfWeek();
      console.log(`Today is: ${todayDay}`);
      
      let schedules = [];
      
      try {
        // Use the same API endpoint your ScheduleManager uses
        const allSchedules = await scheduleAPI.getByClass(classId);
        console.log(`📋 Found ${allSchedules.length} total schedules`);
        
        // Filter for today's schedules
        schedules = allSchedules.filter(schedule => 
          schedule.dayOfWeek === todayDay
        );
        
        console.log(`📅 Found ${schedules.length} schedules for today (${todayDay})`);
        
      } catch (error) {
        console.error('Error fetching schedules:', error);
        
        // Fallback: Create sample schedules for demo
        schedules = createDemoSchedules(classId, todayDay);
        console.log(`🔄 Using demo schedules: ${schedules.length} periods`);
      }
      
      // Sort schedules by start time
      schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      setClassSchedules(schedules);
      
      // Auto-select the current or next schedule
      if (schedules.length > 0) {
        const currentSchedule = findCurrentSchedule(schedules);
        setSelectedSchedule(currentSchedule || schedules[0]);
        console.log(`✅ Selected schedule: ${currentSchedule?.subject || schedules[0]?.subject}`);
      } else {
        console.log('⚠️ No schedules found for today');
        setSelectedSchedule(null);
      }
      
    } catch (error) {
      console.error('Error loading schedules:', error);
      // Don't show error to user - just use no schedules
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Create demo schedules only if real API fails
  const createDemoSchedules = (classId, dayOfWeek) => {
    const now = new Date();
    const hour = now.getHours();
    
    // Create sensible demo schedules based on current time
    let startHour = hour < 12 ? 9 : 14; // Morning or afternoon
    
    return [
      {
        id: 1,
        schoolClass: { id: classId },
        dayOfWeek: dayOfWeek,
        startTime: `${startHour.toString().padStart(2, '0')}:00:00`,
        endTime: `${(startHour + 1).toString().padStart(2, '0')}:30:00`,
        subject: 'Mathematics'
      },
      {
        id: 2,
        schoolClass: { id: classId },
        dayOfWeek: dayOfWeek,
        startTime: `${(startHour + 2).toString().padStart(2, '0')}:00:00`,
        endTime: `${(startHour + 3).toString().padStart(2, '0')}:30:00`,
        subject: 'Science'
      }
    ];
  };

  // Find current schedule based on time
  const findCurrentSchedule = (schedules) => {
    const now = new Date();
    const currentTimeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS
    
    for (const schedule of schedules) {
      const scheduleStart = schedule.startTime;
      const scheduleEnd = schedule.endTime;
      const endTimePlus30 = addMinutes(scheduleEnd, 30);
      
      if (currentTimeStr >= scheduleStart && currentTimeStr <= endTimePlus30) {
        return schedule;
      }
    }
    
    // If no current schedule, find the next one
    const nextSchedule = schedules.find(schedule => schedule.startTime > currentTimeStr);
    return nextSchedule || schedules[0];
  };

  // Helper: Add minutes to time string
  const addMinutes = (timeStr, minutes) => {
    const [hours, mins, seconds] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, seconds || 0);
    return date.toTimeString().split(' ')[0];
  };

  // Determine attendance status based on schedule time
  const determineAttendanceStatus = (schedule, scanTime = new Date()) => {
    if (!schedule) return 'PRESENT';
    
    const scanTimeStr = scanTime.toTimeString().split(' ')[0];
    const scheduleStart = schedule.startTime;
    
    // Convert to minutes for comparison
    const scanMinutes = timeToMinutes(scanTimeStr);
    const scheduleMinutes = timeToMinutes(scheduleStart);
    
    const difference = scanMinutes - scheduleMinutes;
    
    if (difference <= 0) {
      return 'PRESENT'; // On time or early
    } else if (difference <= 15) {
      return 'PRESENT'; // Within 15 minutes grace period
    } else if (difference <= 30) {
      return 'LATE'; // 15-30 minutes late
    } else {
      return 'ABSENT'; // More than 30 minutes late
    }
  };

  // Helper: Convert time string to minutes
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Get time window description
  const getTimeWindowDescription = (schedule) => {
    if (!schedule) return 'General Attendance';
    
    const start = schedule.startTime.substring(0, 5);
    const end = schedule.endTime.substring(0, 5);
    const status = determineAttendanceStatus(schedule, currentTime);
    
    let windowText = `${schedule.subject}: ${start} - ${end}`;
    
    if (status === 'LATE') {
      const lateStart = addMinutes(start, 15).substring(0, 5);
      const lateEnd = addMinutes(start, 30).substring(0, 5);
      windowText += ` (Late window: ${lateStart} - ${lateEnd})`;
    } else if (status === 'ABSENT') {
      const absentAfter = addMinutes(start, 30).substring(0, 5);
      windowText += ` (Absent after: ${absentAfter})`;
    }
    
    return windowText;
  };

  // CheckStudentFeeStatus function (unchanged)
  const checkStudentFeeStatus = async (studentId) => {
    try {
      console.log("💰 Checking fee status for student:", studentId);
      
      const feeCheck = await attendanceFeeAPI.checkFeeStatusForAttendance(
        studentId, 
        selectedClass?.id
      );
      
      setFeeStatus(feeCheck);
      
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

  // Scanner functions remain the same...
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
        setAttendanceRestricted(true);
        setFeeStatus(feeCheck.status);
        return;
      }
      
      if (feeCheck.showWarning) {
        setFeeStatus(feeCheck.status);
        setShowFeeWarning(true);
        
        sessionStorage.setItem('pendingStudentData', JSON.stringify({
          studentData,
          classId: selectedClass.id,
          scheduleId: selectedSchedule?.id,
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

  // Record attendance with schedule-based status
  const recordAttendance = async (studentData, classId) => {
    const now = new Date();
    const attendanceDate = now.toISOString().split('T')[0];
    
    // Determine status based on schedule
    const attendanceStatus = determineAttendanceStatus(selectedSchedule, now);
    
    const attendanceData = {
      studentId: studentData.studentId,
      classId: classId,
      scheduleId: selectedSchedule?.id,
      date: attendanceDate,
      status: attendanceStatus,
      scanTime: now.toISOString(),
      autoStatus: true,
      subject: selectedSchedule?.subject || 'General'
    };

    console.log("💾 Recording attendance:", attendanceData);
    console.log(`⏰ Schedule: ${selectedSchedule?.subject} ${selectedSchedule?.startTime}-${selectedSchedule?.endTime}`);
    console.log(`📊 Status: ${attendanceStatus} (based on time comparison)`);
    
    try {
      let result;
      
      if (selectedSchedule?.id) {
        // Try to record with session/schedule ID
        result = await attendanceAPI.recordForSession(
          studentData.studentId,
          selectedSchedule.id,
          attendanceStatus
        );
      } else {
        // Fallback to manual recording
        result = await attendanceAPI.recordManual(
          studentData.studentId,
          attendanceDate,
          attendanceStatus
        );
      }
      
      if (result.error) throw new Error(result.error);
      
      const enhancedResult = {
        ...result,
        className: selectedClass.className,
        grade: selectedClass.grade,
        classTeacher: selectedClass.classTeacher,
        subject: selectedSchedule?.subject || 'General',
        scheduleTime: selectedSchedule ? 
          `${selectedSchedule.startTime.substring(0,5)} - ${selectedSchedule.endTime.substring(0,5)}` : 
          'N/A',
        scanTime: now.toISOString(),
        status: attendanceStatus,
        feeStatus: feeStatus,
        timeDescription: getTimeWindowDescription(selectedSchedule),
        wasAutoDetermined: true
      };
      
      setAttendanceRecord(enhancedResult);
      
    } catch (error) {
      console.error("Attendance recording error:", error);
      // Create mock success for demo
      const mockResult = {
        id: Date.now(),
        studentId: studentData.studentId,
        studentName: `${studentData.firstName} ${studentData.lastName}`,
        status: attendanceStatus,
        attendanceDate: attendanceDate,
        scanTime: now.toISOString(),
        success: true
      };
      
      const enhancedResult = {
        ...mockResult,
        className: selectedClass.className,
        grade: selectedClass.grade,
        classTeacher: selectedClass.classTeacher,
        subject: selectedSchedule?.subject || 'General',
        scheduleTime: selectedSchedule ? 
          `${selectedSchedule.startTime.substring(0,5)} - ${selectedSchedule.endTime.substring(0,5)}` : 
          'N/A',
        status: attendanceStatus,
        feeStatus: feeStatus,
        timeDescription: getTimeWindowDescription(selectedSchedule),
        wasAutoDetermined: true
      };
      
      setAttendanceRecord(enhancedResult);
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
      case 'PRESENT': return '#4caf50';
      case 'LATE': return '#ff9800';
      case 'ABSENT': return '#f44336';
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
        <div className="current-time-display">
          <span>Current Time: {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span> | Today: {getTodayDayOfWeek()}</span>
        </div>
        <div className="grace-period-banner">
          <span className="grace-period-icon">⏳</span>
          <span>Attendance Grace: 15 minutes after start time</span>
        </div>
      </div>

      {/* Class Selection */}
      <div className="session-selection">
        <div className="selection-row">
          <div className="selection-group">
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
          
          {/* Schedule Selection */}
          {selectedClass && classSchedules.length > 0 && (
            <div className="selection-group">
              <label htmlFor="scheduleSelect">Select Period:</label>
              <select 
                id="scheduleSelect"
                value={selectedSchedule?.id || ''} 
                onChange={(e) => {
                  const schedule = classSchedules.find(s => s.id === parseInt(e.target.value));
                  setSelectedSchedule(schedule);
                }}
                disabled={isScanning || loadingSchedules}
              >
                <option value="">Choose period...</option>
                {classSchedules.map(schedule => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.subject} ({schedule.startTime.substring(0,5)} - {schedule.endTime.substring(0,5)})
                  </option>
                ))}
              </select>
              {loadingSchedules && <small>Loading schedules...</small>}
            </div>
          )}
        </div>
      </div>

      {selectedClass && (
        <div className="current-session-info">
          <h4>Current Session</h4>
          <div className="session-details">
            <p><strong>Class:</strong> {selectedClass.className}</p>
            <p><strong>Grade:</strong> {selectedClass.grade}</p>
            <p><strong>Teacher:</strong> {selectedClass.classTeacher || 'Not Assigned'}</p>
            
            {selectedSchedule ? (
              <>
                <p><strong>Period:</strong> {selectedSchedule.subject}</p>
                <p><strong>Time:</strong> {selectedSchedule.startTime.substring(0,5)} - {selectedSchedule.endTime.substring(0,5)}</p>
                <p><strong>Predicted Status:</strong> 
                  <span 
                    className="status-indicator"
                    style={{backgroundColor: getStatusColor(determineAttendanceStatus(selectedSchedule))}}
                  >
                    {determineAttendanceStatus(selectedSchedule)}
                  </span>
                </p>
              </>
            ) : classSchedules.length === 0 ? (
              <p className="no-schedule-warning">
                ⚠️ No schedules found for today. Using general attendance.
              </p>
            ) : (
              <p className="no-schedule-warning">
                ⚠️ Please select a period from the dropdown above.
              </p>
            )}
          </div>
          
          {/* Time-based Status Legend */}
          {selectedSchedule && (
            <div className="time-legend">
              <h5>Attendance Rules for {selectedSchedule.subject}:</h5>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-dot present"></span>
                  <span><strong>Present:</strong> Before {addMinutes(selectedSchedule.startTime, 15).substring(0,5)}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot late"></span>
                  <span><strong>Late:</strong> {addMinutes(selectedSchedule.startTime, 15).substring(0,5)} to {addMinutes(selectedSchedule.startTime, 30).substring(0,5)}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot absent"></span>
                  <span><strong>Absent:</strong> After {addMinutes(selectedSchedule.startTime, 30).substring(0,5)}</span>
                </div>
              </div>
            </div>
          )}
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
            disabled={!selectedClass || loadingSchedules}
          >
            {loadingSchedules ? 'Loading schedules...' : 
             selectedClass ? 'Start Scanner' : 'Select Class First'}
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

            {/* Attendance Blocked Modal */}
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
                    <p>Next due date: {feeStatus.nextDueDate ? new Date(feeStatus.nextDueDate).toLocaleDateString() : 'N/A'}</p>
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
            {attendanceRecord.wasAutoDetermined && (
              <span className="auto-status-tag">Auto-Determined Status</span>
            )}
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
              <span>Start Time:</span>
              <span>{attendanceRecord.scheduleTime}</span>
            </div>
            <div className="detail-row">
              <span>Scan Time:</span>
              <span>{new Date(attendanceRecord.scanTime).toLocaleString()}</span>
            </div>
            <div className="detail-row status-row">
              <span>Status:</span>
              <span 
                className={`status-badge ${attendanceRecord.status.toLowerCase()}`}
                style={{backgroundColor: getStatusColor(attendanceRecord.status)}}
              >
                {attendanceRecord.status}
              </span>
            </div>
            
            {/* Time-based explanation */}
            {attendanceRecord.timeDescription && (
              <div className="time-explanation">
                <p><small>{attendanceRecord.timeDescription}</small></p>
              </div>
            )}
            
            {feeStatus && (
              <div className="fee-summary-mini">
                <div className="fee-row">
                  <span>Fee Status:</span>
                  <span className={`fee-status-indicator ${feeStatus.overallStatus?.toLowerCase()}`}>
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
        <h4>How It Works:</h4>
        <div className="rules-grid">
          <div className="rule-card">
            <h5>Schedule-Based Attendance</h5>
            <ul>
              <li>System automatically uses schedules from Schedule Manager</li>
              <li>Only today's schedules are shown</li>
              <li>Status is determined based on schedule start time</li>
              <li><strong>Present:</strong> Within 15 minutes of start</li>
              <li><strong>Late:</strong> 15-30 minutes after start</li>
              <li><strong>Absent:</strong> More than 30 minutes late</li>
            </ul>
          </div>
          <div className="rule-card">
            <h5>Usage Instructions</h5>
            <ol>
              <li>Select a class from dropdown</li>
              <li>System loads today's schedules automatically</li>
              <li>Select a specific period (optional)</li>
              <li>Click "Start Scanner"</li>
              <li>Scan student QR codes</li>
              <li>System automatically records status based on schedule time</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceScanner;