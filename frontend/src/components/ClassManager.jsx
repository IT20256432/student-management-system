import React, { useState, useEffect } from 'react';
import { classAPI } from '../services/api';
import './ClassManager.css';

const ClassManager = () => {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [classForm, setClassForm] = useState({
    className: '',
    grade: 'O/L',
    stream: '',
    classTeacher: '',
    roomNumber: '',
    active: true
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      const classList = await classAPI.getAll();
      setClasses(classList);
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (editingClass) {
        await classAPI.update(editingClass.id, classForm);
      } else {
        await classAPI.create(classForm);
      }
      
      setShowForm(false);
      setEditingClass(null);
      setClassForm({
        className: '',
        grade: 'O/L',
        stream: '',
        classTeacher: '',
        roomNumber: '',
        active: true
      });
      loadClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      setError(error.message || 'Failed to save class');
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setClassForm({
      className: cls.className,
      grade: cls.grade,
      stream: cls.stream || '',
      classTeacher: cls.classTeacher || '',
      roomNumber: cls.roomNumber || '',
      active: cls.active
    });
    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        await classAPI.delete(classId);
        loadClasses();
      } catch (error) {
        console.error('Error deleting class:', error);
        setError('Failed to delete class');
      }
    }
  };

  const handleDeactivate = async (classId, currentStatus) => {
    try {
      if (currentStatus) {
        await classAPI.deactivate(classId);
      } else {
        // Reactivate - you might need to add this API method
        await classAPI.update(classId, { active: true });
      }
      loadClasses();
    } catch (error) {
      console.error('Error updating class status:', error);
      setError('Failed to update class status');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingClass(null);
    setClassForm({
      className: '',
      grade: 'O/L',
      stream: '',
      classTeacher: '',
      roomNumber: '',
      active: true
    });
    setError(null);
  };

  return (
    <div className="class-manager">
      <div className="class-header">
        <div className="header-content">
          <h1>Class Management</h1>
          <p>Create and manage classes for student grouping</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + Add New Class
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingClass ? 'Edit Class' : 'Create New Class'}</h2>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="class-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="className">Class Name *</label>
                  <input
                    type="text"
                    id="className"
                    value={classForm.className}
                    onChange={(e) => setClassForm({...classForm, className: e.target.value})}
                    placeholder="e.g., Grade 10-A, A/L Science"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="grade">Grade *</label>
                  <select
                    id="grade"
                    value={classForm.grade}
                    onChange={(e) => setClassForm({...classForm, grade: e.target.value})}
                  >
                    <option value="O/L">Ordinary Level (O/L)</option>
                    <option value="A/L">Advanced Level (A/L)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="stream">Stream</label>
                  <select
                    id="stream"
                    value={classForm.stream}
                    onChange={(e) => setClassForm({...classForm, stream: e.target.value})}
                  >
                    <option value="">Select Stream</option>
                    <option value="Science">Science</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="classTeacher">Class Teacher</label>
                  <input
                    type="text"
                    id="classTeacher"
                    value={classForm.classTeacher}
                    onChange={(e) => setClassForm({...classForm, classTeacher: e.target.value})}
                    placeholder="Teacher's full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="roomNumber">Room Number</label>
                  <input
                    type="text"
                    id="roomNumber"
                    value={classForm.roomNumber}
                    onChange={(e) => setClassForm({...classForm, roomNumber: e.target.value})}
                    placeholder="e.g., Room 101, Lab 2"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={classForm.active}
                      onChange={(e) => setClassForm({...classForm, active: e.target.checked})}
                    />
                    <span className="checkmark"></span>
                    Active Class (Can accept new students)
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="classes-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading classes...</p>
          </div>
        ) : (
          <>
            <div className="classes-stats">
              <div className="stat-card">
                <span className="stat-number">{classes.length}</span>
                <span className="stat-label">Total Classes</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {classes.filter(c => c.active).length}
                </span>
                <span className="stat-label">Active Classes</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {classes.filter(c => c.grade === 'O/L').length}
                </span>
                <span className="stat-label">O/L Classes</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {classes.filter(c => c.grade === 'A/L').length}
                </span>
                <span className="stat-label">A/L Classes</span>
              </div>
            </div>

            <div className="classes-grid">
              {classes.map(cls => (
                <div key={cls.id} className="class-card">
                  <div className="class-card-header">
                    <div className="class-title">
                      <h3>{cls.className}</h3>
                      <span className={`status-badge ${cls.active ? 'active' : 'inactive'}`}>
                        {cls.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span className="grade-badge">{cls.grade}</span>
                  </div>

                  <div className="class-details">
                    <div className="detail-item">
                      <span className="label">Stream:</span>
                      <span className="value">{cls.stream || 'Not Specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Teacher:</span>
                      <span className="value">{cls.classTeacher || 'Not Assigned'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Room:</span>
                      <span className="value">{cls.roomNumber || 'Not Assigned'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Students:</span>
                      <span className="value">{cls.studentCount || 0} enrolled</span>
                    </div>
                  </div>

                  <div className="class-actions">
                    <button 
                      onClick={() => handleEdit(cls)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeactivate(cls.id, cls.active)}
                      className={cls.active ? 'btn-warning' : 'btn-success'}
                    >
                      {cls.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handleDelete(cls.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {classes.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-icon">🏫</div>
                <h3>No Classes Found</h3>
                <p>Create your first class to start organizing students.</p>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  Create First Class
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClassManager;