import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceAPI } from '../services/api';
import './AttendanceScanner.css';

const AttendanceScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const html5QrCodeRef = useRef(null);
  const readerId = "reader";

  useEffect(() => {
    loadActiveSessions();
    return () => stopScanner();
  }, []);

  const loadActiveSessions = async () => {
    try {
      const sessions = await attendanceAPI.getActiveSessions();
      setActiveSessions(sessions);
      
      // Auto-select session if only one is active
      if (sessions.length === 1) {
        setSelectedSession(sessions[0]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError('Failed to load active sessions');
    }
  };

  const startScanner = async () => {
    try {
      if (!selectedSession) {
        setError("Please select a class session first");
        return;
      }

      setError(null);
      setScanResult(null);
      setAttendanceRecord(null);

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
          await recordAttendance(decodedText);
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

  const recordAttendance = async (qrData) => {
    setIsLoading(true);
    try {
      const studentData = JSON.parse(qrData);
      const attendanceData = {
        studentId: studentData.studentId,
        sessionId: selectedSession.id,
        date: new Date().toISOString().split('T')[0],
      };

      console.log("💾 Recording attendance:", attendanceData);
      const result = await attendanceAPI.record(attendanceData);
      if (result.error) throw new Error(result.error);

      setAttendanceRecord(result);
    } catch (err) {
      console.error("❌ Attendance error:", err);
      setError(err.message || "Failed to record attendance");
    } finally {
      setIsLoading(false);
    }
  };

  const resetScanner = async () => {
    setScanResult(null);
    setAttendanceRecord(null);
    setError(null);
    setIsLoading(false);
    await stopScanner();
  };

  const scanNext = async () => {
    await resetScanner();
    setTimeout(() => startScanner(), 200);
  };

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <h2>QR Attendance Scanner</h2>
        <p>Select class session and scan student QR codes</p>
      </div>

      {/* Session Selection */}
      <div className="session-selection">
        <label htmlFor="sessionSelect">Select Class Session:</label>
        <select 
          id="sessionSelect"
          value={selectedSession?.id || ''} 
          onChange={(e) => {
            const session = activeSessions.find(s => s.id === parseInt(e.target.value));
            setSelectedSession(session);
            setError(null);
          }}
          disabled={isScanning}
        >
          <option value="">Choose a session...</option>
          {activeSessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.schoolClass.className} - {session.subject} ({session.scheduledStartTime} - {session.scheduledEndTime})
            </option>
          ))}
        </select>
      </div>

      {selectedSession && (
        <div className="current-session-info">
          <h4>Current Session</h4>
          <div className="session-details">
            <p><strong>Class:</strong> {selectedSession.schoolClass.className}</p>
            <p><strong>Subject:</strong> {selectedSession.subject}</p>
            <p><strong>Time:</strong> {selectedSession.scheduledStartTime} - {selectedSession.scheduledEndTime}</p>
            <p><strong>Teacher:</strong> {selectedSession.schoolClass.classTeacher}</p>
            <p><strong>Room:</strong> {selectedSession.schoolClass.roomNumber}</p>
          </div>
        </div>
      )}

      {/* Scanner Section */}
      <div id={readerId} className="qr-scanner"></div>

      {/* Control Buttons */}
      <div className="scanner-controls">
        {!isScanning && !scanResult && !attendanceRecord && !error && (
          <button 
            onClick={startScanner} 
            className="start-scan-btn"
            disabled={!selectedSession}
          >
            {selectedSession ? 'Start Scanner' : 'Select Session First'}
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

      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Recording attendance...</p>
        </div>
      )}

      {attendanceRecord && (
        <div className="attendance-success">
          <div className="success-icon">✅</div>
          <h3>Attendance Recorded Successfully!</h3>
          <div className="attendance-details">
            <div className="detail-item"><strong>Student ID:</strong> {attendanceRecord.studentId}</div>
            <div className="detail-item"><strong>Name:</strong> {attendanceRecord.studentName}</div>
            <div className="detail-item"><strong>Grade:</strong> {attendanceRecord.grade}</div>
            <div className="detail-item"><strong>Class:</strong> {attendanceRecord.className}</div>
            <div className="detail-item"><strong>Subject:</strong> {attendanceRecord.subject}</div>
            <div className="detail-item"><strong>Time:</strong> {new Date(attendanceRecord.scanTime).toLocaleString()}</div>
            <div className="detail-item">
              <strong>Status:</strong>
              <span className={`status ${attendanceRecord.status?.toLowerCase() || 'present'}`}>
                {attendanceRecord.status || 'PRESENT'}
              </span>
            </div>
          </div>
          <button onClick={scanNext} className="scan-again-btn">
            Scan Next Student
          </button>
        </div>
      )}

      {error && (
        <div className="attendance-error">
          <div className="error-icon">❌</div>
          <h3>Error</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={resetScanner} className="scan-again-btn">
              Try Again
            </button>
            <button onClick={loadActiveSessions} className="reload-btn">
              Reload Sessions
            </button>
          </div>
        </div>
      )}

      <div className="scanner-instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Select the correct class session before scanning</li>
          <li>Ensure good lighting conditions</li>
          <li>Hold the QR code steady within the frame</li>
          <li>Keep the QR code 10–20 cm from the camera</li>
          <li>Allow camera permissions when prompted</li>
        </ul>
      </div>
    </div>
  );
};

export default AttendanceScanner;