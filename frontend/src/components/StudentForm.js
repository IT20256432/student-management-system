import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { classAPI } from '../services/api'; 
import './StudentForm.css';

function StudentForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    grade: 'O/L',
    email: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    guardianName: '',
    guardianPhone: '',
    relationship: '',
    status: 'Active',
    schoolClass: null
  });

  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(null);
  const [registeredStudent, setRegisteredStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [stream, setStream] = useState('Arts');
  const [activeSection, setActiveSection] = useState(0);
  const dateInputRef = useRef(null);

  // District options for Sri Lanka
  const districts = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
    "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
    "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Moneragala",
    "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
    "Trincomalee", "Vavuniya"
  ];

  const relationships = ["Father", "Mother", "Guardian", "Other"];
  const sections = ["Personal", "Academic", "Class", "Contact", "Guardian"];

  // Handle click outside to close date picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateInputRef.current && !dateInputRef.current.contains(event.target)) {
        dateInputRef.current.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load classes based on selected grade
useEffect(() => {
  const fetchClasses = async () => {
    try {
      if (formData.grade) {
        console.log(`🎯 Fetching classes for grade: ${formData.grade}`);
        
        // Use the classAPI service instead of direct fetch
        const classData = await classAPI.getByGrade(formData.grade);
        
        console.log(`✅ Loaded ${classData.length} classes for grade ${formData.grade}:`, classData);
        setClasses(classData);
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };
  
  fetchClasses();
}, [formData.grade]);

const validateCurrentSection = () => {
const newErrors = {};

switch (activeSection) {
  case 0: // Personal Information
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!/^[A-Za-z\s]+$/.test(formData.firstName)) {
      newErrors.firstName = 'First name should contain only letters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!/^[A-Za-z\s]+$/.test(formData.lastName)) {
      newErrors.lastName = 'Last name should contain only letters';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      
      if (age < 5) {
        newErrors.dob = 'Student must be at least 5 years old';
      } else if (age > 35) {
        newErrors.dob = 'Student age seems too high';
      }
    }
    break;

  case 1: // Academic Information
    // No validation needed as grade has default value
    break;

  case 2: // Class Section
    // ✅ FIXED: Use newErrors instead of sectionErrors
    if (!formData.schoolClass) {
      newErrors.schoolClass = 'Class assignment is required';
    }
    break;

  case 3: // Contact Information
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+94|0)[1-9][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Sri Lankan phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.district) {
      newErrors.district = 'District is required';
    }
    break;

  case 4: // Guardian Information
    // Guardian validation - ONLY validate if at least one field is filled
    const hasGuardianInfo = formData.guardianName || formData.guardianPhone;
    
    if (hasGuardianInfo) {
      // If guardian name is provided but phone is missing
      if (formData.guardianName && !formData.guardianPhone) {
        newErrors.guardianPhone = 'Guardian phone is required when guardian name is provided';
      }
      
      // If guardian phone is provided but name is missing
      if (formData.guardianPhone && !formData.guardianName) {
        newErrors.guardianName = 'Guardian name is required when guardian phone is provided';
      }

      // Validate guardian phone format if provided
      if (formData.guardianPhone && !/^(\+94|0)[1-9][0-9]{8}$/.test(formData.guardianPhone.replace(/\s/g, ''))) {
        newErrors.guardianPhone = 'Please enter a valid Sri Lankan phone number';
      }
    }
    break;

  default:
    break;
}

return newErrors; // ✅ Don't forget to return newErrors
};

  const validateAllSections = () => {
    const allErrors = {};
    
    // Validate each section
    for (let i = 0; i < sections.length; i++) {
      const sectionErrors = validateSection(i);
      Object.assign(allErrors, sectionErrors);
    }

    return allErrors;
  };

  const validateSection = (sectionIndex) => {
  const sectionErrors = {};

  switch (sectionIndex) {
    case 0: // Personal Information
      if (!formData.firstName.trim()) {
        sectionErrors.firstName = 'First name is required';
      } else if (!/^[A-Za-z\s]+$/.test(formData.firstName)) {
        sectionErrors.firstName = 'First name should contain only letters';
      }

      if (!formData.lastName.trim()) {
        sectionErrors.lastName = 'Last name is required';
      } else if (!/^[A-Za-z\s]+$/.test(formData.lastName)) {
        sectionErrors.lastName = 'Last name should contain only letters';
      }

      if (!formData.gender) {
        sectionErrors.gender = 'Gender is required';
      }

      if (!formData.dob) {
        sectionErrors.dob = 'Date of birth is required';
      } else {
        const dob = new Date(formData.dob);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        
        if (age < 5) {
          sectionErrors.dob = 'Student must be at least 5 years old';
        } else if (age > 25) {
          sectionErrors.dob = 'Student age seems too high';
        }
      }
      break;

    case 1: // Academic Information - No validation needed
      break;

    case 2: // Class Section - ✅ ADD THIS
      if (!formData.schoolClass) {
        sectionErrors.schoolClass = 'Class assignment is required';
      }
      break;

    case 3: // Contact Information
      if (!formData.email) {
        sectionErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        sectionErrors.email = 'Please enter a valid email address';
      }

      if (!formData.phone) {
        sectionErrors.phone = 'Phone number is required';
      } else if (!/^(\+94|0)[1-9][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
        sectionErrors.phone = 'Please enter a valid Sri Lankan phone number';
      }

      if (!formData.address.trim()) {
        sectionErrors.address = 'Address is required';
      }

      if (!formData.city.trim()) {
        sectionErrors.city = 'City is required';
      }

      if (!formData.district) {
        sectionErrors.district = 'District is required';
      }
      break;

    case 4: // Guardian Information - Optional, no validation needed for empty fields
      const hasGuardianInfo = formData.guardianName || formData.guardianPhone;
      
      if (hasGuardianInfo) {
        if (formData.guardianName && !formData.guardianPhone) {
          sectionErrors.guardianPhone = 'Guardian phone is required when guardian name is provided';
        }
        
        if (formData.guardianPhone && !formData.guardianName) {
          sectionErrors.guardianName = 'Guardian name is required when guardian phone is provided';
        }

        if (formData.guardianPhone && !/^(\+94|0)[1-9][0-9]{8}$/.test(formData.guardianPhone.replace(/\s/g, ''))) {
          sectionErrors.guardianPhone = 'Please enter a valid Sri Lankan phone number';
        }
      }
      break;

    default:
      break;
  }

  return sectionErrors;
};
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (name === 'grade') {
      setFormData(prev => ({
        ...prev,
        schoolClass: null
      }));
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleStreamChange = (e) => {
    const newStream = e.target.value;
    setStream(newStream);
  };

  const handleClassChange = (e) => {
    const classId = e.target.value;
    const selectedClass = classes.find(c => c.id == classId);
    
    setFormData(prev => ({
      ...prev,
      schoolClass: selectedClass || null
    }));

    if (errors.schoolClass) {
      setErrors(prev => ({
        ...prev,
        schoolClass: ''
      }));
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate all sections before submission
  const allErrors = validateAllSections();
  
  if (Object.keys(allErrors).length > 0) {
    setErrors(allErrors);
    
    // Find the first section that has errors and navigate to it
    for (let i = 0; i < sections.length; i++) {
      const sectionErrors = validateSection(i);
      if (Object.keys(sectionErrors).length > 0) {
        setActiveSection(i);
        
        // Scroll to the first error in that section
        setTimeout(() => {
          const firstError = Object.keys(sectionErrors)[0];
          if (firstError) {
            const errorElement = document.querySelector(`[name="${firstError}"]`);
            if (errorElement) {
              errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              errorElement.focus();
            }
          }
        }, 100);
        return;
      }
    }
    return;
  }

  setIsSubmitting(true);
  try {
    // ✅ SIMPLE APPROACH: Send classId as separate field (not nested object)
    const submissionData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      dob: formData.dob,
      grade: formData.grade,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      district: formData.district,
      status: formData.status,
      // ✅ Send classId directly (NOT as nested schoolClass object)
      classId: formData.schoolClass?.id || null
    };

    // Only add guardian fields if they have values
    if (formData.guardianName.trim()) {
      submissionData.guardianName = formData.guardianName.trim();
    }
    if (formData.guardianPhone.trim()) {
      submissionData.guardianPhone = formData.guardianPhone.trim();
    }
    if (formData.relationship) {
      submissionData.relationship = formData.relationship;
    }

    console.log('📤 Sending to SIMPLE endpoint:', submissionData);
    console.log('📋 School Class ID:', formData.schoolClass?.id);

    // ✅ USE THE SIMPLE ENDPOINT
    const response = await fetch('http://localhost:8080/api/students/register-simple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });
    
    const data = await response.json();
    console.log('✅ Registration response:', data);
    
    if (response.ok) {
      const qrData = JSON.stringify({
        studentId: data.studentId,
        firstName: data.firstName || formData.firstName,
        lastName: data.lastName || formData.lastName,
        grade: data.grade || formData.grade,
        email: data.email || formData.email,
        classId: data.classId || formData.schoolClass?.id,
        className: data.className || formData.schoolClass?.className
      });
      setGeneratedQR(qrData);
      setRegisteredStudent(data);
    } else {
      throw new Error(data.error || 'Registration failed');
    }
  } catch (err) {
    console.error('❌ Registration error:', err);
    setResult({ error: err.message });
  } finally {
    setIsSubmitting(false);
  }
};

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: '',
      dob: '',
      grade: 'O/L',
      email: '',
      phone: '',
      address: '',
      city: '',
      district: '',
      guardianName: '',
      guardianPhone: '',
      relationship: '',
      status: 'Active',
      schoolClass: null
    });
    setGeneratedQR(null);
    setRegisteredStudent(null);
    setResult(null);
    setStream('Arts');
    setClasses([]);
    setActiveSection(0);
  };

  const nextSection = () => {
    const currentSectionErrors = validateCurrentSection();
    
    if (Object.keys(currentSectionErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...currentSectionErrors }));
      
      // Scroll to first error in current section
      const firstError = Object.keys(currentSectionErrors)[0];
      if (firstError) {
        const errorElement = document.querySelector(`[name="${firstError}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }
      return;
    }

    setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
  };

  const prevSection = () => {
    setActiveSection(prev => Math.max(prev - 1, 0));
  };

  // Check if all required sections are filled
  const isFormComplete = () => {
    const requiredErrors = validateAllSections();
    return Object.keys(requiredErrors).length === 0;
  };

  return (
    <div className="app-container">
      <main className="main-content">
        <div className="form-wrapper">
          <div className="form-header">
            <div className="header-icon">👨‍🎓</div>
            <h2>Student Registration</h2>
            <p>Complete all fields to register a new student in the system</p>
          </div>

          {!generatedQR ? (
            <form onSubmit={handleSubmit} className="modern-form">
              {/* Progress Steps */}
              <div className="progress-steps">
                {sections.map((section, index) => (
                  <div key={section} className={`step ${index === activeSection ? 'active' : ''} ${index < activeSection ? 'completed' : ''}`}>
                    <div className="step-number">
                      {index < activeSection ? '✓' : index + 1}
                    </div>
                    <span className="step-label">{section}</span>
                    {index < sections.length - 1 && <div className="step-connector"></div>}
                  </div>
                ))}
              </div>

              {/* Personal Information Section */}
              {activeSection === 0 && (
                <div className="form-section active">
                  <h3>Personal Information</h3>
                  <div className="section-description">
                    Please provide the student's basic personal details
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name *</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={errors.firstName ? 'error' : ''}
                        placeholder="Enter first name"
                      />
                      {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Last Name *</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={errors.lastName ? 'error' : ''}
                        placeholder="Enter last name"
                      />
                      {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="gender">Gender *</label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className={errors.gender ? 'error' : ''}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.gender && <span className="error-message">{errors.gender}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="dob">Date of Birth *</label>
                      <input
                        ref={dateInputRef}
                        type="date"
                        id="dob"
                        name="dob"
                        value={formData.dob}
                        onChange={handleDateChange}
                        className={errors.dob ? 'error' : ''}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {errors.dob && <span className="error-message">{errors.dob}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Information Section */}
              {activeSection === 1 && (
                <div className="form-section active">
                  <h3>Academic Information</h3>
                  <div className="section-description">
                    Select the student's academic level and status
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="grade">Grade *</label>
                      <select
                        id="grade"
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                      >
                        <option value="O/L">O/L (Ordinary Level)</option>
                        <option value="A/L">A/L (Advanced Level)</option>
                      </select>
                    </div>

                    {formData.grade === 'A/L' && (
                      <div className="form-group">
                        <label htmlFor="stream">Stream *</label>
                        <select
                          id="stream"
                          name="stream"
                          value={stream}
                          onChange={handleStreamChange}
                        >
                          <option value="Arts">Arts Stream</option>
                          <option value="Commerce">Commerce Stream</option>
                          <option value="Science">Science Stream</option>
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

                          {/* Class Section */}
            {activeSection === 2 && (
              <div className="form-section active">
                <h3>Class Assignment <span className="required-badge">Required</span></h3>
                <div className="section-description">
                  Assign the student to a specific class. This is required for attendance and fee management.
                </div>
                
                <div className="form-group">
                  <label htmlFor="classAssignment">Select Class *</label>
                  <select
                    id="classAssignment"
                    name="classAssignment"
                    value={formData.schoolClass?.id || ''}
                    onChange={handleClassChange}
                    className={errors.schoolClass ? 'error' : ''}
                    required
                  >
                    <option value="">Choose a class *</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} - {cls.classTeacher} ({cls.roomNumber})
                      </option>
                    ))}
                  </select>
                  {errors.schoolClass && <span className="error-message">{errors.schoolClass}</span>}
                  
                  {formData.schoolClass && (
                    <div className="class-selection-info">
                      <div className="class-info-card">
                        <strong>Selected Class:</strong> {formData.schoolClass.className}
                        <br />
                        <strong>Teacher:</strong> {formData.schoolClass.classTeacher}
                        <br />
                        <strong>Room:</strong> {formData.schoolClass.roomNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* Contact Information Section */}
              {activeSection === 3 && (
                <div className="form-section active">
                  <h3>Contact Information</h3>
                  <div className="section-description">
                    Provide the student's contact details and address
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="email">Email *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'error' : ''}
                        placeholder="student@example.com"
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number *</label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={errors.phone ? 'error' : ''}
                        placeholder="+94 XX XXX XXXX or 0XX XXX XXXX"
                      />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="address">Address *</label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={errors.address ? 'error' : ''}
                        placeholder="Enter full address"
                      />
                      {errors.address && <span className="error-message">{errors.address}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="city">City *</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={errors.city ? 'error' : ''}
                        placeholder="Enter city"
                      />
                      {errors.city && <span className="error-message">{errors.city}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="district">District *</label>
                      <select
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className={errors.district ? 'error' : ''}
                      >
                        <option value="">Select District</option>
                        {districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                      {errors.district && <span className="error-message">{errors.district}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Guardian Information Section */}
              {activeSection === 4 && (
                <div className="form-section active">
                  <h3>Guardian Information <span className="optional-badge">Optional</span></h3>
                  <div className="section-description">
                    Provide guardian details for emergency contact (optional). You can skip this section if not needed.
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="guardianName">Guardian Name</label>
                      <input
                        type="text"
                        id="guardianName"
                        name="guardianName"
                        value={formData.guardianName}
                        onChange={handleChange}
                        className={errors.guardianName ? 'error' : ''}
                        placeholder="Guardian's full name"
                      />
                      {errors.guardianName && <span className="error-message">{errors.guardianName}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="guardianPhone">Guardian Phone</label>
                      <input
                        type="text"
                        id="guardianPhone"
                        name="guardianPhone"
                        value={formData.guardianPhone}
                        onChange={handleChange}
                        className={errors.guardianPhone ? 'error' : ''}
                        placeholder="+94 XX XXX XXXX or 0XX XXX XXXX"
                      />
                      {errors.guardianPhone && <span className="error-message">{errors.guardianPhone}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="relationship">Relationship</label>
                      <select
                        id="relationship"
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleChange}
                      >
                        <option value="">Select Relationship</option>
                        {relationships.map(rel => (
                          <option key={rel} value={rel}>{rel}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="form-navigation">
                {activeSection > 0 && (
                  <button type="button" onClick={prevSection} className="nav-btn prev-btn">
                    ← Previous
                  </button>
                )}
                
                {activeSection < sections.length - 1 ? (
                  <button type="button" onClick={nextSection} className="nav-btn next-btn">
                    Next →
                  </button>
                ) : (
                  <div className="final-actions">
                    <button 
                      type="submit" 
                      className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner"></div>
                          Registering...
                        </>
                      ) : (
                        'Complete Registration'
                      )}
                    </button>
                    <div className="skip-notice">
                      Guardian information is optional. You can submit without filling this section.
                    </div>
                  </div>
                )}
              </div>
            </form>
          ) : (
            // QR Code Display Section
            <div className="qr-section">
              <div className="success-header">
                <div className="success-icon">✅</div>
                <h3>Registration Successful!</h3>
                <p>Student has been registered successfully. Here's their ID card:</p>
              </div>
              
              <div className="id-card">
                <div className="qr-code-container">
                  <div className="qr-code">
                    <QRCode value={generatedQR} size={200} />
                  </div>
                  <p className="qr-note">Scan this QR code for attendance and fee payments</p>
                </div>
                
                <div className="student-info">
                  <h4>Student ID Card</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>Student ID:</strong> 
                      <span>{registeredStudent.studentId}</span>
                    </div>
                    <div className="info-item">
                      <strong>Name:</strong> 
                      <span>{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="info-item">
                      <strong>Gender:</strong> 
                      <span>{formData.gender}</span>
                    </div>
                    <div className="info-item">
                      <strong>Date of Birth:</strong> 
                      <span>{new Date(formData.dob).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item">
                      <strong>Grade:</strong> 
                      <span>{formData.grade}</span>
                    </div>
                    {formData.schoolClass && (
                      <div className="info-item">
                        <strong>Class:</strong> 
                        <span>{formData.schoolClass.className}</span>
                      </div>
                    )}
                    <div className="info-item">
                      <strong>Email:</strong> 
                      <span>{formData.email}</span>
                    </div>
                    <div className="info-item">
                      <strong>Phone:</strong> 
                      <span>{formData.phone}</span>
                    </div>
                    {formData.guardianName && (
                      <div className="info-item">
                        <strong>Guardian:</strong> 
                        <span>{formData.guardianName}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="action-buttons">
                    <button onClick={() => window.print()} className="print-btn">
                      🖨️ Print ID Card
                    </button>
                    <button onClick={resetForm} className="new-registration-btn">
                      👨‍🎓 Register Another Student
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {result && result.error && (
            <div className="result-box error">
              <h3>Error</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentForm;