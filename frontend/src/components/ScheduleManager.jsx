import React, { useState, useEffect } from 'react';
import { scheduleAPI, classAPI } from '../services/api';
import './ScheduleManager.css';

const ScheduleManager = () => {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    schoolClass: { id: '' },
    dayOfWeek: 'MONDAY',
    startTime: '08:00',
    endTime: '09:00',
    subject: ''
  });

  const daysOfWeek = [
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  ];

  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  useEffect(() => {
    loadClasses();
    loadAllSchedules();
  }, []);

  const loadClasses = async () => {
    try {
      const classList = await classAPI.getAllActive();
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClass(classList[0].id);
        setScheduleForm(prev => ({
          ...prev,
          schoolClass: { id: classList[0].id }
        }));
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes');
    }
  };

  const loadAllSchedules = async () => {
    try {
      setLoading(true);
      // Load schedules for all classes
      const allSchedules = [];
      for (const cls of classes) {
        try {
          const classSchedules = await scheduleAPI.getByClass(cls.id);
          // Add class information to each schedule
          const schedulesWithClassInfo = classSchedules.map(schedule => ({
            ...schedule,
            className: cls.className,
            grade: cls.grade,
            stream: cls.stream,
            roomNumber: cls.roomNumber,
            classTeacher: cls.classTeacher
          }));
          allSchedules.push(...schedulesWithClassInfo);
        } catch (error) {
          console.error(`Error loading schedules for class ${cls.className}:`, error);
        }
      }
      setSchedules(allSchedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const loadSchedulesForClass = async (classId) => {
    try {
      setLoading(true);
      const scheduleList = await scheduleAPI.getByClass(classId);
      // Add class information to schedules
      const selectedClass = classes.find(c => c.id == classId);
      const schedulesWithClassInfo = scheduleList.map(schedule => ({
        ...schedule,
        className: selectedClass?.className,
        grade: selectedClass?.grade,
        stream: selectedClass?.stream,
        roomNumber: selectedClass?.roomNumber,
        classTeacher: selectedClass?.classTeacher
      }));
      setSchedules(schedulesWithClassInfo);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      loadSchedulesForClass(selectedClass);
    } else {
      loadAllSchedules();
    }
  }, [selectedClass]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // Validate time
      if (scheduleForm.startTime >= scheduleForm.endTime) {
        setError('End time must be after start time');
        return;
      }

      // Validate class is selected
      if (!scheduleForm.schoolClass.id) {
        setError('Please select a class');
        return;
      }

      const scheduleData = {
        schoolClass: {
          id: scheduleForm.schoolClass.id
        },
        dayOfWeek: scheduleForm.dayOfWeek,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        subject: scheduleForm.subject
      };

      console.log('Sending schedule data:', scheduleData);

      if (editingSchedule) {
        await scheduleAPI.update(editingSchedule.id, scheduleData);
      } else {
        await scheduleAPI.create(scheduleData);
      }

      resetForm();
      // Reload schedules based on current view
      if (selectedClass) {
        loadSchedulesForClass(selectedClass);
      } else {
        loadAllSchedules();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError(error.message || 'Failed to save schedule');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      schoolClass: { id: schedule.schoolClass.id },
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      subject: schedule.subject
    });
    setShowForm(true);
  };

  const handleDelete = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await scheduleAPI.delete(scheduleId);
        // Reload schedules based on current view
        if (selectedClass) {
          loadSchedulesForClass(selectedClass);
        } else {
          loadAllSchedules();
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        setError('Failed to delete schedule');
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setScheduleForm({
      schoolClass: { id: selectedClass || '' },
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '09:00',
      subject: ''
    });
    setError(null);
  };

  const formatTimeDisplay = (time) => {
    return time.replace(':00', '').replace(':30', ':30');
  };

  const getClassDisplayName = (schedule) => {
    let displayName = schedule.className;
    if (schedule.grade) {
      displayName += ` (${schedule.grade})`;
    }
    if (schedule.stream) {
      displayName += ` - ${schedule.stream}`;
    }
    return displayName;
  };

  // Group schedules by day for table display
  const getSchedulesByDay = (day) => {
    return schedules
      .filter(schedule => schedule.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-header">
        <div className="header-content">
          <h1>Class Schedule Management</h1>
          <p>Manage timetables and class schedules for all classes</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn-primary"
        >
          + Add Schedule
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {/* View Toggle */}
      <div className="view-controls">
        <div className="view-toggle">
          <button
            className={!selectedClass ? 'active' : ''}
            onClick={() => setSelectedClass('')}
          >
            📋 All Classes
          </button>
          <button
            className={selectedClass ? 'active' : ''}
            onClick={() => setSelectedClass(classes[0]?.id || '')}
          >
            🏫 Single Class
          </button>
        </div>

        {selectedClass && (
          <div className="class-selection">
            <label htmlFor="classSelect">Select Class:</label>
            <select
              id="classSelect"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="">Choose a class...</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.className} - {cls.grade} {cls.stream ? `(${cls.stream})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</h2>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="schedule-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="classId">Class *</label>
                  <select
                    id="classId"
                    value={scheduleForm.schoolClass.id}
                    onChange={(e) => setScheduleForm({
                      ...scheduleForm, 
                      schoolClass: { id: e.target.value }
                    })}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} - {cls.grade} {cls.stream ? `(${cls.stream})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="dayOfWeek">Day of Week *</label>
                  <select
                    id="dayOfWeek"
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm({...scheduleForm, dayOfWeek: e.target.value})}
                    required
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="startTime">Start Time *</label>
                  <select
                    id="startTime"
                    value={scheduleForm.startTime}
                    onChange={(e) => setScheduleForm({...scheduleForm, startTime: e.target.value})}
                    required
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{formatTimeDisplay(time)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">End Time *</label>
                  <select
                    id="endTime"
                    value={scheduleForm.endTime}
                    onChange={(e) => setScheduleForm({...scheduleForm, endTime: e.target.value})}
                    required
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{formatTimeDisplay(time)}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    value={scheduleForm.subject}
                    onChange={(e) => setScheduleForm({...scheduleForm, subject: e.target.value})}
                    placeholder="e.g., Mathematics, Science, English"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="schedule-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading schedules...</p>
          </div>
        ) : (
          <>
            <div className="schedule-header-info">
              <h2>
                {selectedClass 
                  ? `Schedule for ${classes.find(c => c.id == selectedClass)?.className}`
                  : 'All Class Schedules'
                }
              </h2>
              <span className="schedule-count">
                {schedules.length} period(s) total
              </span>
            </div>

            <div className="weekly-schedule-table">
              {daysOfWeek.map(day => {
                const daySchedules = getSchedulesByDay(day);
                return (
                  <div key={day} className="day-section">
                    <div className="day-header">
                      <h3>{day}</h3>
                      <span className="period-count">{daySchedules.length} periods</span>
                    </div>
                    
                    {daySchedules.length > 0 ? (
                      <div className="schedules-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Time</th>
                              <th>Class</th>
                              <th>Room</th>
                              <th>Subject</th>
                              <th>Class Teacher</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {daySchedules.map(schedule => (
                              <tr key={schedule.id}>
                                <td className="time-cell">
                                  {formatTimeDisplay(schedule.startTime)} - {formatTimeDisplay(schedule.endTime)}
                                </td>
                                <td className="class-cell">
                                  <div className="class-info">
                                    <strong>{getClassDisplayName(schedule)}</strong>
                                    <span className="grade">{schedule.grade}</span>
                                  </div>
                                </td>
                                <td className="room-cell">
                                  {schedule.roomNumber || 'N/A'}
                                </td>
                                <td className="subject-cell">
                                  {schedule.subject}
                                </td>
                                <td className="teacher-cell">
                                  {schedule.classTeacher || 'N/A'}
                                </td>
                                <td className="actions-cell">
                                  <button 
                                    onClick={() => handleEdit(schedule)}
                                    className="btn-edit-small"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(schedule.id)}
                                    className="btn-danger-small"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="no-periods">
                        No classes scheduled for {day}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {schedules.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>No Schedules Found</h3>
                <p>
                  {selectedClass 
                    ? `No schedules have been created for ${classes.find(c => c.id == selectedClass)?.className} yet.`
                    : 'No schedules have been created for any class yet.'
                  }
                </p>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  Add First Schedule
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ScheduleManager;