import React, { useState, useEffect } from 'react';
import { studentAPI, classAPI, attendanceAPI, scheduleAPI } from '../services/api';
import './ManualAttendance.css';

const ManualAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedClassName, setSelectedClassName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');

  // Student search and selection
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allStudents, setAllStudents] = useState([]);

  // Days of week mapping
  const daysOfWeek = [
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
  ];

  // Load classes and all students on component mount
  useEffect(() => {
    loadClasses();
    loadAllStudents();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Calculate day of week from selected date
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      setDayOfWeek(daysOfWeek[dayIndex]);
    }
  }, [selectedDate]);

  // Load sessions when class or date changes
  useEffect(() => {
    if (selectedClass && dayOfWeek) {
      loadSessions();
    } else {
      setSessions([]);
      setSelectedSession('');
    }
  }, [selectedClass, selectedDate, dayOfWeek]);

  // Clear search when class changes
  useEffect(() => {
    setSearchTerm('');
    setSearchResults([]);
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const data = await classAPI.getAllActive();
      setClasses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading classes:', error);
      setMessage({ type: 'error', text: 'Failed to load classes' });
      setLoading(false);
    }
  };

  // Load ALL students in the system
  const loadAllStudents = async () => {
    try {
      const data = await studentAPI.getAll();
      setAllStudents(data);
      console.log(`Loaded ${data.length} students from system`);
    } catch (error) {
      console.error('Error loading all students:', error);
      // If getAll fails, try to get by grade or other methods
      try {
        // Try to get A/L and O/L students separately
        const alStudents = await studentAPI.getByGrade('A/L');
        const olStudents = await studentAPI.getByGrade('O/L');
        const combined = [...(alStudents || []), ...(olStudents || [])];
        setAllStudents(combined);
        console.log(`Loaded ${combined.length} students by grade`);
      } catch (fallbackError) {
        console.error('Fallback loading also failed:', fallbackError);
        setMessage({ type: 'warning', text: 'Could not load student list. Search may be limited.' });
      }
    }
  };

  const loadSessions = async () => {
    try {
      setMessage({ type: '', text: '' });
      
      // Get all schedules for the class
      let allSchedules = [];
      try {
        allSchedules = await scheduleAPI.getSchedulesByClass(selectedClass);
      } catch (error) {
        // Use fallback schedules if API fails
        allSchedules = await scheduleAPI.getFallbackSchedules(selectedClass);
      }
      
      if (allSchedules && Array.isArray(allSchedules)) {
        // Filter schedules for the specific day of week
        const daySchedules = allSchedules.filter(schedule => 
          schedule.dayOfWeek === dayOfWeek
        );
        
        if (daySchedules.length > 0) {
          // Convert schedule periods to sessions with unique IDs
          const formattedSessions = daySchedules.map((schedule, index) => ({
            id: schedule.id || `session-${index}`,
            subject: schedule.subject,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            dayOfWeek: schedule.dayOfWeek,
            periodNumber: index + 1
          }));
          
          setSessions(formattedSessions);
        } else {
          createDefaultSessions();
        }
      } else {
        createDefaultSessions();
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      createDefaultSessions();
    }
  };

  const createDefaultSessions = () => {
    // Get class info for default sessions
    const classInfo = classes.find(cls => cls.id === parseInt(selectedClass));
    const grade = classInfo?.grade || 'General';
    
    let defaultSessions = [];
    
    if (grade.includes('A/L')) {
      defaultSessions = [
        { id: 1, subject: 'Combined Maths', startTime: '08:30', endTime: '09:30', dayOfWeek, periodNumber: 1 },
        { id: 2, subject: 'Physics', startTime: '09:45', endTime: '10:45', dayOfWeek, periodNumber: 2 },
        { id: 3, subject: 'Chemistry', startTime: '11:00', endTime: '12:00', dayOfWeek, periodNumber: 3 },
        { id: 4, subject: 'English', startTime: '13:00', endTime: '14:00', dayOfWeek, periodNumber: 4 },
        { id: 5, subject: 'ICT', startTime: '14:15', endTime: '15:15', dayOfWeek, periodNumber: 5 }
      ];
    } else if (grade.includes('O/L')) {
      defaultSessions = [
        { id: 1, subject: 'Mathematics', startTime: '08:30', endTime: '09:30', dayOfWeek, periodNumber: 1 },
        { id: 2, subject: 'Science', startTime: '09:45', endTime: '10:45', dayOfWeek, periodNumber: 2 },
        { id: 3, subject: 'English', startTime: '11:00', endTime: '12:00', dayOfWeek, periodNumber: 3 },
        { id: 4, subject: 'Sinhala', startTime: '13:00', endTime: '14:00', dayOfWeek, periodNumber: 4 },
        { id: 5, subject: 'History', startTime: '14:15', endTime: '15:15', dayOfWeek, periodNumber: 5 }
      ];
    } else {
      defaultSessions = [
        { id: 1, subject: 'Mathematics', startTime: '08:30', endTime: '09:30', dayOfWeek, periodNumber: 1 },
        { id: 2, subject: 'Science', startTime: '09:45', endTime: '10:45', dayOfWeek, periodNumber: 2 },
        { id: 3, subject: 'English', startTime: '11:00', endTime: '12:00', dayOfWeek, periodNumber: 3 },
        { id: 4, subject: 'ICT', startTime: '13:00', endTime: '14:00', dayOfWeek, periodNumber: 4 },
        { id: 5, subject: 'Study Hall', startTime: '14:15', endTime: '15:15', dayOfWeek, periodNumber: 5 }
      ];
    }
    
    setSessions(defaultSessions);
    if (selectedClass) {
      setMessage({ 
        type: 'warning', 
        text: `Using default timetable for ${dayOfWeek}. No schedule found in system.` 
      });
    }
  };

  // Search ALL students in the system
  const searchStudents = async () => {
    if (!searchTerm.trim()) {
      setMessage({ type: 'error', text: 'Please enter a search term' });
      return;
    }

    setIsSearching(true);
    try {
      // Use the preloaded allStudents or fetch fresh data
      let studentsToSearch = allStudents;
      
      // If we don't have preloaded data, fetch it
      if (studentsToSearch.length === 0) {
        try {
          studentsToSearch = await studentAPI.getAll();
          setAllStudents(studentsToSearch);
        } catch (fetchError) {
          // Try alternative methods
          const alStudents = await studentAPI.getByGrade('A/L');
          const olStudents = await studentAPI.getByGrade('O/L');
          studentsToSearch = [...(alStudents || []), ...(olStudents || [])];
        }
      }

      // Filter based on search term
      const searchLower = searchTerm.toLowerCase();
      const results = studentsToSearch.filter(student => {
        const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
        const studentId = student.studentId?.toLowerCase() || '';
        const email = student.email?.toLowerCase() || '';
        const phone = student.phone?.toLowerCase() || '';
        const guardianName = student.guardianName?.toLowerCase() || '';
        const grade = student.grade?.toLowerCase() || '';
        const className = student.className?.toLowerCase() || '';
        
        return fullName.includes(searchLower) ||
               studentId.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower) ||
               guardianName.includes(searchLower) ||
               grade.includes(searchLower) ||
               className.includes(searchLower);
      });

      if (results.length === 0) {
        setMessage({ type: 'info', text: 'No students found matching your search' });
      } else {
        setMessage({ type: 'success', text: `Found ${results.length} student(s) in the system` });
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching students:', error);
      setMessage({ type: 'error', text: 'Failed to search students' });
    } finally {
      setIsSearching(false);
    }
  };

  // Add student to selected list
  const addStudent = (student) => {
    // Check if already added
    if (selectedStudents.some(s => s.studentId === student.studentId)) {
      setMessage({ type: 'warning', text: 'Student already added' });
      return;
    }

    // Add student with default status "PRESENT"
    const studentWithStatus = {
      ...student,
      attendanceStatus: 'PRESENT',
      className: student.className || 'Unassigned',
      grade: student.grade || 'Unknown'
    };
    
    setSelectedStudents(prev => [...prev, studentWithStatus]);
    setMessage({ type: 'success', text: `Added ${student.firstName} ${student.lastName}` });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  // Remove student from selected list
  const removeStudent = (studentId) => {
    setSelectedStudents(prev => prev.filter(s => s.studentId !== studentId));
  };

  // Update attendance status for a student
  const updateStudentStatus = (studentId, status) => {
    setSelectedStudents(prev => 
      prev.map(student => 
        student.studentId === studentId 
          ? { ...student, attendanceStatus: status }
          : student
      )
    );
  };

  // Clear all selected students
  const clearAllStudents = () => {
    setSelectedStudents([]);
    setMessage({ type: 'info', text: 'Cleared all selected students' });
  };

  const saveAttendance = async () => {
    if (!selectedClass) {
      setMessage({ type: 'error', text: 'Please select a class for the session' });
      return;
    }

    if (!selectedSession) {
      setMessage({ type: 'error', text: 'Please select a session' });
      return;
    }

    if (selectedStudents.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one student' });
      return;
    }

    // Warn if students are from different classes
    const differentClassStudents = selectedStudents.filter(s => 
      s.classId && s.classId.toString() !== selectedClass
    );
    
    if (differentClassStudents.length > 0) {
      const confirmMessage = `${differentClassStudents.length} student(s) are from different classes. Are you sure you want to record attendance for this session?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const selectedSessionData = sessions.find(s => s.id === selectedSession);
      const sessionId = selectedSessionData?.id || null;

      const attendancePromises = selectedStudents.map(student => 
        attendanceAPI.recordManual(student.studentId, selectedDate, student.attendanceStatus, sessionId)
      );

      await Promise.all(attendancePromises);
      
      setMessage({ 
        type: 'success', 
        text: `✅ Attendance saved successfully for ${selectedStudents.length} student(s)` 
      });
      
      // Clear after successful save
      setTimeout(() => {
        setSelectedStudents([]);
        setMessage({ type: '', text: '' });
      }, 5000);
      
    } catch (error) {
      console.error('Error saving attendance:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to save attendance: ${error.message || 'Unknown error'}` 
      });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    // Reset related states
    setSelectedSession('');
    setSessions([]);
    
    // Get class name for display
    const selectedClassData = classes.find(cls => cls.id === parseInt(classId));
    if (selectedClassData) {
      setSelectedClassName(selectedClassData.className);
    }
  };

  // Quick add by student ID
  const quickAddByID = async () => {
    if (!searchTerm.trim()) {
      setMessage({ type: 'error', text: 'Please enter a student ID' });
      return;
    }

    const studentId = searchTerm.trim();
    setIsSearching(true);
    try {
      // Try to get student directly by ID
      const student = await studentAPI.getByStudentId(studentId);
      
      if (student) {
        addStudent(student);
        setSearchTerm('');
        setSearchResults([]);
      } else {
        setMessage({ type: 'error', text: `Student with ID "${studentId}" not found` });
      }
    } catch (error) {
      console.error('Error fetching student by ID:', error);
      setMessage({ type: 'error', text: `Could not find student with ID "${studentId}"` });
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="scanner-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading manual attendance system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <h2>Manual Attendance Management</h2>
        <p>Record attendance for any student in the system</p>
        
        <div className="current-time-display">
          <span>Current Time: {formatTime(currentTime)}</span>
          <span>Selected Date: {selectedDate} ({dayOfWeek})</span>
          {selectedClassName && (
            <span>Session Class: {selectedClassName}</span>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`attendance-${message.type}`} style={{
          padding: '15px',
          borderRadius: '8px',
          margin: '15px 0',
          backgroundColor: message.type === 'success' ? '#d4edda' : 
                         message.type === 'error' ? '#f8d7da' :
                         message.type === 'warning' ? '#fff3cd' : '#d1ecf1',
          color: message.type === 'success' ? '#155724' : 
                message.type === 'error' ? '#721c24' :
                message.type === 'warning' ? '#856404' : '#0c5460',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : 
                              message.type === 'error' ? '#f5c6cb' :
                              message.type === 'warning' ? '#ffeaa7' : '#bee5eb'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Selection Controls */}
      <div className="selection-row">
        <div className="selection-group">
          <label>Session Class *</label>
          <select 
            value={selectedClass} 
            onChange={(e) => handleClassChange(e.target.value)}
            required
          >
            <option value="">-- Select Class for Session --</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>
                {cls.className} ({cls.grade}) - {cls.classTeacher || 'No Teacher'}
              </option>
            ))}
          </select>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            This determines the timetable/sessions
          </div>
        </div>

        <div className="selection-group">
          <label>Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="time-input"
            max={new Date().toISOString().split('T')[0]}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            Day: {dayOfWeek}
          </div>
        </div>

        <div className="selection-group">
          <label>Select Session *</label>
          <select 
            value={selectedSession} 
            onChange={(e) => setSelectedSession(e.target.value)}
            disabled={!selectedClass || sessions.length === 0}
            required
          >
            {sessions.length === 0 ? (
              <option value="">No sessions scheduled</option>
            ) : (
              <>
                <option value="">-- Select Period --</option>
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>
                    Period {session.periodNumber}: {session.subject} ({session.startTime} - {session.endTime})
                  </option>
                ))}
              </>
            )}
          </select>
          {selectedClass && sessions.length === 0 && (
            <div className="no-schedule-warning">
              No timetable found for {dayOfWeek}. Using default schedule.
            </div>
          )}
        </div>
      </div>

      {/* Student Search Section */}
      <div className="search-section" style={{ 
        marginTop: '30px',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>
          Search Students in System
        </h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name, ID, email, phone, guardian, grade, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchStudents()}
              style={{
                width: '100%',
                padding: '12px 20px 12px 45px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '15px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              fontSize: '18px'
            }}>
              🔍
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={searchStudents}
              disabled={!searchTerm.trim() || isSearching}
              style={{
                padding: '12px 25px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: !searchTerm.trim() ? 'not-allowed' : 'pointer',
                opacity: !searchTerm.trim() ? 0.5 : 1,
                whiteSpace: 'nowrap'
              }}
            >
              {isSearching ? 'Searching...' : 'Search All'}
            </button>
            
            <button
              onClick={quickAddByID}
              disabled={!searchTerm.trim() || isSearching}
              style={{
                padding: '12px 25px',
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: !searchTerm.trim() ? 'not-allowed' : 'pointer',
                opacity: !searchTerm.trim() ? 0.5 : 1,
                whiteSpace: 'nowrap'
              }}
            >
              Quick Add by ID
            </button>
          </div>
        </div>

        <div style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          <p>Search across all {allStudents.length} students in the system. Search by:</p>
          <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
            <li>Name (first or last)</li>
            <li>Student ID</li>
            <li>Email or Phone</li>
            <li>Guardian Name</li>
            <li>Grade or Class</li>
          </ul>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="search-results" style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#555' }}>
                Search Results ({searchResults.length} found)
              </h4>
              <button
                onClick={() => setSearchResults([])}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                Clear Results
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '10px',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '10px',
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid #eee'
            }}>
              {searchResults.map(student => {
                const isAlreadyAdded = selectedStudents.some(s => s.studentId === student.studentId);
                return (
                  <div key={student.studentId} style={{
                    padding: '15px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    backgroundColor: isAlreadyAdded ? '#f8f9fa' : '#fff',
                    opacity: isAlreadyAdded ? 0.7 : 1
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                            {student.firstName} {student.lastName}
                          </div>
                          {student.grade && (
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {student.grade}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                          <div><strong>ID:</strong> {student.studentId}</div>
                          {student.className && <div><strong>Class:</strong> {student.className}</div>}
                          {student.email && <div><strong>Email:</strong> {student.email}</div>}
                          {student.phone && <div><strong>Phone:</strong> {student.phone}</div>}
                          {student.guardianName && <div><strong>Guardian:</strong> {student.guardianName}</div>}
                        </div>
                      </div>
                      <button
                        onClick={() => addStudent(student)}
                        disabled={isAlreadyAdded}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isAlreadyAdded ? '#6c757d' : '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: isAlreadyAdded ? 'not-allowed' : 'pointer',
                          minWidth: '80px'
                        }}
                      >
                        {isAlreadyAdded ? 'Added ✓' : 'Add'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Students Section */}
      <div className="selected-students-section" style={{ 
        marginTop: '30px',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>
            Students to Mark Attendance ({selectedStudents.length})
          </h3>
          {selectedStudents.length > 0 && (
            <button
              onClick={clearAllStudents}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {selectedStudents.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '2px dashed #ddd'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>👤</div>
            <h4>No students selected yet</h4>
            <p>Search for students above and click "Add" to include them in attendance</p>
          </div>
        ) : (
          <>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '15px',
              flexWrap: 'wrap'
            }}>
              <div style={{
                padding: '8px 15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                <strong>Session:</strong> {selectedClassName} ({sessions.find(s => s.id === selectedSession)?.subject || 'No session'})
              </div>
              <div style={{
                padding: '8px 15px',
                backgroundColor: '#f3e5f5',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                <strong>Date:</strong> {selectedDate} ({dayOfWeek})
              </div>
              <div style={{
                padding: '8px 15px',
                backgroundColor: '#e8f5e9',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                <strong>Students:</strong> {selectedStudents.length} from {new Set(selectedStudents.map(s => s.className || 'Unassigned')).size} class(es)
              </div>
            </div>

            <div className="selected-students-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '15px',
              maxHeight: '500px',
              overflowY: 'auto',
              padding: '10px'
            }}>
              {selectedStudents.map(student => (
                <div key={student.studentId} style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                        <h4 style={{ margin: 0, color: '#333' }}>
                          {student.firstName} {student.lastName}
                        </h4>
                        {student.className && student.className !== 'Unassigned' && (
                          <span style={{
                            padding: '2px 8px',
                            backgroundColor: '#e3f2fd',
                            color: '#1976d2',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {student.className}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        <div><strong>ID:</strong> {student.studentId}</div>
                        {student.grade && <div><strong>Grade:</strong> {student.grade}</div>}
                        {student.email && <div><strong>Email:</strong> {student.email}</div>}
                      </div>
                    </div>
                    <div style={{
                      padding: '6px 15px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: student.attendanceStatus === 'PRESENT' ? '#4CAF50' :
                                     student.attendanceStatus === 'LATE' ? '#FF9800' : '#F44336',
                      color: 'white',
                      minWidth: '80px',
                      textAlign: 'center'
                    }}>
                      {student.attendanceStatus}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button
                      onClick={() => updateStudentStatus(student.studentId, 'PRESENT')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #4CAF50',
                        borderRadius: '4px',
                        backgroundColor: student.attendanceStatus === 'PRESENT' ? '#4CAF50' : 'transparent',
                        color: student.attendanceStatus === 'PRESENT' ? 'white' : '#4CAF50',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => updateStudentStatus(student.studentId, 'LATE')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #FF9800',
                        borderRadius: '4px',
                        backgroundColor: student.attendanceStatus === 'LATE' ? '#FF9800' : 'transparent',
                        color: student.attendanceStatus === 'LATE' ? 'white' : '#FF9800',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Late
                    </button>
                    <button
                      onClick={() => updateStudentStatus(student.studentId, 'ABSENT')}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: '1px solid #F44336',
                        borderRadius: '4px',
                        backgroundColor: student.attendanceStatus === 'ABSENT' ? '#F44336' : 'transparent',
                        color: student.attendanceStatus === 'ABSENT' ? 'white' : '#F44336',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Absent
                    </button>
                  </div>
                  
                  <button
                    onClick={() => removeStudent(student.studentId)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: 'transparent',
                      color: '#dc3545',
                      border: '1px solid #dc3545',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Remove Student
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Save Button */}
      {selectedClass && selectedStudents.length > 0 && (
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button
            onClick={saveAttendance}
            disabled={saving || !selectedClass || !selectedSession}
            className="scan-again-btn"
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!selectedClass || !selectedSession) ? 'not-allowed' : 'pointer',
              opacity: (!selectedClass || !selectedSession) ? 0.5 : 1
            }}
          >
            {saving ? (
              <>
                <span className="spinner" style={{ 
                  width: '20px', 
                  height: '20px', 
                  display: 'inline-block',
                  verticalAlign: 'middle',
                  marginRight: '10px'
                }}></span>
                Saving Attendance...
              </>
            ) : (
              `Save Attendance for ${selectedStudents.length} Student(s)`
            )}
          </button>
          <div style={{ 
            marginTop: '15px', 
            color: '#666', 
            fontSize: '14px',
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '8px',
            display: 'inline-block'
          }}>
            <strong>Session:</strong> {sessions.find(s => s.id === selectedSession)?.subject || 'Not selected'} | 
            <strong> Date:</strong> {selectedDate} ({dayOfWeek}) | 
            <strong> Session Class:</strong> {selectedClassName} | 
            <strong> Time:</strong> {sessions.find(s => s.id === selectedSession)?.startTime} - {sessions.find(s => s.id === selectedSession)?.endTime}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="scanner-instructions">
        <h4>How to Use System-Wide Manual Attendance</h4>
        <ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li><strong>Select Session Class:</strong> Choose which class's timetable to use</li>
          <li><strong>Select Date:</strong> Choose the date (system determines day of week)</li>
          <li><strong>Select Session:</strong> Choose period from the selected class timetable</li>
          <li><strong>Search Students:</strong> Search ALL students in the system by any criteria</li>
          <li><strong>Add Students:</strong> Click "Add" next to each student you want to include</li>
          <li><strong>Set Status:</strong> Set Present/Late/Absent for each selected student</li>
          <li><strong>Save:</strong> Click "Save Attendance" to record for all selected students</li>
        </ol>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
          <strong>Note:</strong> You can mark attendance for students from ANY class in any session. 
          The "Session Class" only determines which timetable to use for session times.
        </p>
      </div>
    </div>
  );
};

export default ManualAttendance;
