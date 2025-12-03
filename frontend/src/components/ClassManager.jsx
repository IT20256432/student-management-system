import React, { useState, useEffect } from 'react';
import { classAPI, feeAPI } from '../services/api';
import './ClassManager.css';

const ClassManager = () => {
  const [classes, setClasses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
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

  const [feeForm, setFeeForm] = useState({
    monthlyFee: '',
    admissionFee: '',
    examFee: '',
    sportsFee: '',
    libraryFee: '',
    labFee: '',
    otherFee: '',
    description: ''
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const classList = await classAPI.getAll();
    console.log('Loaded classes:', classList);

    // Load fees for each class - UPDATED VERSION
    const classesWithFees = await Promise.all(
      classList.map(async (cls) => {
        try {
          const fees = await feeAPI.getByClass(cls.id);
          console.log(`Class ${cls.className} (ID: ${cls.id}) fees:`, fees);
          
          return {
            ...cls,
            fees: fees // Direct assignment since getByClass now returns null or object
          };
        } catch (error) {
          console.log(`Error loading fees for class ${cls.className}:`, error.message);
          return { 
            ...cls, 
            fees: null 
          };
        }
      })
    );

    console.log('Final classes with fees:', classesWithFees);
    setClasses(classesWithFees);
    
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

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      const feeData = {
        schoolClass: {  // Change from classId to schoolClass object
          id: selectedClass.id
        },
        monthlyFee: parseFloat(feeForm.monthlyFee) || 0,
        admissionFee: parseFloat(feeForm.admissionFee) || 0,
        examFee: parseFloat(feeForm.examFee) || 0,
        sportsFee: parseFloat(feeForm.sportsFee) || 0,
        libraryFee: parseFloat(feeForm.libraryFee) || 0,
        labFee: parseFloat(feeForm.labFee) || 0,
        otherFee: parseFloat(feeForm.otherFee) || 0,
        description: feeForm.description
        // Remove totalFee - backend calculates it automatically
      };

      if (selectedClass.fees) {
        await feeAPI.update(selectedClass.fees.id, feeData);
      } else {
        await feeAPI.create(feeData);
      }

      setShowFeeModal(false);
      loadClasses();
    } catch (error) {
      console.error('Error saving fees:', error);
      setError(error.message || 'Failed to save fees');
    }
  };

  const calculateTotalFee = () => {
    return (
      (parseFloat(feeForm.monthlyFee) || 0) +
      (parseFloat(feeForm.admissionFee) || 0) +
      (parseFloat(feeForm.examFee) || 0) +
      (parseFloat(feeForm.sportsFee) || 0) +
      (parseFloat(feeForm.libraryFee) || 0) +
      (parseFloat(feeForm.labFee) || 0) +
      (parseFloat(feeForm.otherFee) || 0)
    );
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

  const handleManageFees = (cls) => {
    setSelectedClass(cls);
    if (cls.fees) {
      setFeeForm({
        monthlyFee: cls.fees.monthlyFee || '',
        admissionFee: cls.fees.admissionFee || '',
        examFee: cls.fees.examFee || '',
        sportsFee: cls.fees.sportsFee || '',
        libraryFee: cls.fees.libraryFee || '',
        labFee: cls.fees.labFee || '',
        otherFee: cls.fees.otherFee || '',
        description: cls.fees.description || ''
      });
    } else {
      setFeeForm({
        monthlyFee: '',
        admissionFee: '',
        examFee: '',
        sportsFee: '',
        libraryFee: '',
        labFee: '',
        otherFee: '',
        description: ''
      });
    }
    setShowFeeModal(true);
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

  const resetFeeForm = () => {
    setShowFeeModal(false);
    setSelectedClass(null);
    setFeeForm({
      monthlyFee: '',
      admissionFee: '',
      examFee: '',
      sportsFee: '',
      libraryFee: '',
      labFee: '',
      otherFee: '',
      description: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  return (
    <div className="class-manager">
      <div className="class-header">
        <div className="header-content">
          <h1>Class Management</h1>
          <p>Create and manage classes with fee structures</p>
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

      {/* Class Form Modal */}
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

      {/* Fee Management Modal */}
      {showFeeModal && selectedClass && (
        <div className="modal-overlay">
          <div className="modal-content fee-modal">
            <div className="modal-header">
              <h2>Manage Fees - {selectedClass.className}</h2>
              <button onClick={resetFeeForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleFeeSubmit} className="fee-form">
              <div className="fee-form-grid">
                <div className="form-group">
                  <label htmlFor="monthlyFee">Monthly Fee</label>
                  <input
                    type="number"
                    id="monthlyFee"
                    value={feeForm.monthlyFee}
                    onChange={(e) => setFeeForm({...feeForm, monthlyFee: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admissionFee">Admission Fee</label>
                  <input
                    type="number"
                    id="admissionFee"
                    value={feeForm.admissionFee}
                    onChange={(e) => setFeeForm({...feeForm, admissionFee: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="examFee">Exam Fee</label>
                  <input
                    type="number"
                    id="examFee"
                    value={feeForm.examFee}
                    onChange={(e) => setFeeForm({...feeForm, examFee: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sportsFee">Sports Fee</label>
                  <input
                    type="number"
                    id="sportsFee"
                    value={feeForm.sportsFee}
                    onChange={(e) => setFeeForm({...feeForm, sportsFee: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="libraryFee">Library Fee</label>
                  <input
                    type="number"
                    id="libraryFee"
                    value={feeForm.libraryFee}
                    onChange={(e) => setFeeForm({...feeForm, libraryFee: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="labFee">Lab Fee</label>
                  <input
                    type="number"
                    id="labFee"
                    value={feeForm.labFee}
                    onChange={(e) => setFeeForm({...feeForm, labFee: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="otherFee">Other Fees</label>
                  <input
                    type="number"
                    id="otherFee"
                    value={feeForm.otherFee}
                    onChange={(e) => setFeeForm({...feeForm, otherFee: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">Fee Description</label>
                  <textarea
                    id="description"
                    value={feeForm.description}
                    onChange={(e) => setFeeForm({...feeForm, description: e.target.value})}
                    placeholder="Additional information about fees..."
                    rows="3"
                  />
                </div>

                <div className="total-fee-display">
                  <div className="total-fee-label">Total Fee:</div>
                  <div className="total-fee-amount">{formatCurrency(calculateTotalFee())}</div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetFeeForm} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedClass.fees ? 'Update Fees' : 'Save Fees'}
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
                  {classes.filter(c => c.fees).length}
                </span>
                <span className="stat-label">Classes with Fees</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">
                  {formatCurrency(classes.reduce((total, cls) => total + (cls.fees?.totalFee || 0), 0))}
                </span>
                <span className="stat-label">Total Monthly Revenue</span>
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

                  {/* Fee Summary */}
                  <div className="fee-summary">
                    <div className="fee-header">
                      <h4>Fee Structure</h4>
                      {cls.fees ? (
                        <span className="fee-status configured">Configured</span>
                      ) : (
                        <span className="fee-status not-configured">Not Set</span>
                      )}
                    </div>
                    {cls.fees && (
                      <div className="fee-breakdown">
                        <div className="fee-item">
                          <span>Monthly:</span>
                          <span>{formatCurrency(cls.fees.monthlyFee)}</span>
                        </div>
                        <div className="fee-total">
                          <span>Total Monthly:</span>
                          <span className="total-amount">{formatCurrency(cls.fees.totalFee)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="class-actions">
                    <button 
                      onClick={() => handleEdit(cls)}
                      className="btn-edit"
                    >
                      Edit Class
                    </button>
                    <button 
                      onClick={() => handleManageFees(cls)}
                      className={cls.fees ? 'btn-warning' : 'btn-success'}
                    >
                      {cls.fees ? 'Manage Fees' : 'Set Fees'}
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