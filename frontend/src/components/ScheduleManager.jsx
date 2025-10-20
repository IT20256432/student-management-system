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
    classId: '',
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
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSchedules(selectedClass);
    } else {
      setSchedules([]);
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const classList = await classAPI.getAllActive();
      setClasses(classList);
      if (classList.length > 0) {
        setSelectedClass(classList[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes');
    }
  };

  const loadSchedules = async (classId) => {
    try {
      setLoading(true);
      const scheduleList = await scheduleAPI.getByClass(classId);
      setSchedules(scheduleList);
    } catch (error) {
      console.error('Error loading schedules:', error);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // Validate time
      if (scheduleForm.startTime >= scheduleForm.endTime) {
        setError('End time must be after start time');
        return;
      }

      if (editingSchedule) {
        await scheduleAPI.update(editingSchedule.id, scheduleForm);
      } else {
        await scheduleAPI.create(scheduleForm);
      }

      resetForm();
      loadSchedules(selectedClass);
    } catch (error) {
      console.error('Error saving schedule:', error);
      setError(error.message || 'Failed to save schedule');
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      classId: schedule.schoolClass.id,
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
        loadSchedules(selectedClass);
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
      classId: selectedClass,
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '09:00',
      subject: ''
    });
    setError(null);
  };

  const getSchedulesByDay = (day) => {
    return schedules
      .filter(schedule => schedule.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getSelectedClassName = () => {
    const selected = classes.find(c => c.id == selectedClass);
    return selected ? selected.className : 'Select Class';
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-header">
        <div className="header-content">
          <h1>Class Schedule Management</h1>
          <p>Manage timetables and class schedules</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn-primary"
          disabled={!selectedClass}
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

      {/* Class Selection */}
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
                    value={scheduleForm.classId}
                    onChange={(e) => setScheduleForm({...scheduleForm, classId: e.target.value})}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className}
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
                      <option key={time} value={time}>{time}</option>
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
                      <option key={time} value={time}>{time}</option>
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

      {selectedClass ? (
        <div className="schedule-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading schedules for {getSelectedClassName()}...</p>
            </div>
          ) : (
            <>
              <div className="schedule-header-info">
                <h2>Schedule for {getSelectedClassName()}</h2>
                <span className="schedule-count">
                  {schedules.length} period(s) scheduled
                </span>
              </div>

              <div className="weekly-schedule">
                {daysOfWeek.map(day => {
                  const daySchedules = getSchedulesByDay(day);
                  return (
                    <div key={day} className="day-column">
                      <div className="day-header">
                        <h3>{day}</h3>
                        <span className="period-count">{daySchedules.length} periods</span>
                      </div>
                      
                      <div className="periods-list">
                        {daySchedules.length > 0 ? (
                          daySchedules.map(schedule => (
                            <div key={schedule.id} className="period-card">
                              <div className="period-time">
                                {schedule.startTime} - {schedule.endTime}
                              </div>
                              <div className="period-subject">
                                {schedule.subject}
                              </div>
                              <div className="period-actions">
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
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-periods">
                            No classes scheduled
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {schedules.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No Schedules Found</h3>
                  <p>No schedules have been created for {getSelectedClassName()} yet.</p>
                  <button onClick={() => setShowForm(true)} className="btn-primary">
                    Add First Schedule
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="no-class-selected">
          <div className="empty-icon">🏫</div>
          <h3>Select a Class</h3>
          <p>Please select a class to view and manage its schedule.</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;