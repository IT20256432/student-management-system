import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
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
    subjects: [],
    schoolClass: null
  });

  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(null);
  const [registeredStudent, setRegisteredStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [stream, setStream] = useState('Arts');
  const dateInputRef = useRef(null);

  // Subject options based on grade
  const subjectOptions = {
    "O/L": [
      "Mathematics",
      "Science",
      "English",
      "Sinhala",
      "Tamil",
      "History",
      "Geography",
      "Citizenship Education",
      "Health & Physical Education",
      "ICT",
      "Religion",
      "Aesthetics"
    ],
    "A/L": {
      "Arts": [
        "Sinhala",
        "English",
        "History",
        "Geography",
        "Political Science",
        "Economics",
        "Logic & Scientific Method",
        "Languages",
        "Arts & Culture"
      ],
      "Commerce": [
        "Business Studies",
        "Accounting",
        "Economics",
        "Commerce",
        "Statistics",
        "ICT"
      ],
      "Science": [
        "Combined Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Agriculture",
        "ICT"
      ]
    }
  };

  // District options for Sri Lanka
  const districts = [
    "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
    "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
    "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Moneragala",
    "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
    "Trincomalee", "Vavuniya"
  ];

  const relationships = ["Father", "Mother", "Guardian", "Other"];

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
          const response = await fetch(`http://localhost:8080/api/classes/grade/${formData.grade}`);
          if (response.ok) {
            const classData = await response.json();
            setClasses(classData);
          }
        } else {
          setClasses([]);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    
    fetchClasses();
  }, [formData.grade]);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
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

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    // Date of Birth validation
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      
      if (age < 5) {
        newErrors.dob = 'Student must be at least 5 years old';
      } else if (age > 25) {
        newErrors.dob = 'Student age seems too high';
      }
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+94|0)[1-9][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Sri Lankan phone number';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    // District validation
    if (!formData.district) {
      newErrors.district = 'District is required';
    }

    // Guardian validation if provided
    if (formData.guardianName && !formData.guardianPhone) {
      newErrors.guardianPhone = 'Guardian phone is required when guardian name is provided';
    }

    if (formData.guardianPhone && !formData.guardianName) {
      newErrors.guardianName = 'Guardian name is required when guardian phone is provided';
    }

    if (formData.guardianPhone && !/^(\+94|0)[1-9][0-9]{8}$/.test(formData.guardianPhone.replace(/\s/g, ''))) {
      newErrors.guardianPhone = 'Please enter a valid Sri Lankan phone number';
    }

    // Subjects validation
    if (formData.subjects.length === 0) {
      newErrors.subjects = 'Please select at least one subject';
    }

    // Class validation (if class is selected, ensure grade matches)
    if (formData.schoolClass && formData.schoolClass.grade !== formData.grade) {
      newErrors.schoolClass = `Selected class is for ${formData.schoolClass.grade}, but student grade is ${formData.grade}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        subjects: [],
        schoolClass: null // Reset class when grade changes
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
    setFormData(prev => ({
      ...prev,
      subjects: []
    }));
  };

  const handleSubjectChange = (subject) => {
    setFormData(prev => {
      const currentSubjects = [...prev.subjects];
      if (currentSubjects.includes(subject)) {
        return {
          ...prev,
          subjects: currentSubjects.filter(s => s !== subject)
        };
      } else {
        return {
          ...prev,
          subjects: [...currentSubjects, subject]
        };
      }
    });

    if (errors.subjects) {
      setErrors(prev => ({
        ...prev,
        subjects: ''
      }));
    }
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data for backend
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
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        relationship: formData.relationship,
        status: formData.status,
        subjects: formData.subjects.join(','), // Convert array to comma-separated string
        schoolClass: formData.schoolClass // Include class object
      };

      const response = await fetch('http://localhost:8080/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      
      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        // Generate QR data
        const qrData = JSON.stringify({
          studentId: data.studentId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          grade: formData.grade,
          email: formData.email,
          classId: formData.schoolClass?.id
        });
        setGeneratedQR(qrData);
        setRegisteredStudent(data);
      }
    } catch (err) {
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
      subjects: [],
      schoolClass: null
    });
    setGeneratedQR(null);
    setRegisteredStudent(null);
    setResult(null);
    setStream('Arts');
    setClasses([]);
  };

  // Get current subjects based on grade and stream
  const getCurrentSubjects = () => {
    if (formData.grade === 'O/L') {
      return subjectOptions['O/L'];
    } else {
      return subjectOptions['A/L'][stream] || [];
    }
  };

  const currentSubjects = getCurrentSubjects();

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1>EduRegister</h1>
            <span>Student Management System</span>
          </div>
          <nav className="nav">
            <a href="/">Dashboard</a>
            <a href="/students">Students</a>
            <a href="/classes">Classes</a>
            <a href="/attendance">Attendance</a>
          </nav>
        </div>
      </header>

      <main className="main-content">
        <div className="form-wrapper">
          <div className="form-header">
            <h2>Student Registration</h2>
            <p>Complete all fields to register a new student</p>
          </div>

          {!generatedQR ? (
            <form onSubmit={handleSubmit} className="modern-form">
              {/* Personal Information Section */}
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
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
                </div>

                <div className="form-row">
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

              {/* Academic Information Section */}
              <div className="form-section">
                <h3>Academic Information</h3>
                <div className="form-row">
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

                {/* Class Assignment */}
                <div className="form-group">
                  <label htmlFor="classAssignment">Class Assignment</label>
                  <select
                    id="classAssignment"
                    name="classAssignment"
                    value={formData.schoolClass?.id || ''}
                    onChange={handleClassChange}
                    className={errors.schoolClass ? 'error' : ''}
                  >
                    <option value="">Select Class (Optional)</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.className} - {cls.classTeacher} ({cls.roomNumber})
                      </option>
                    ))}
                  </select>
                  {errors.schoolClass && <span className="error-message">{errors.schoolClass}</span>}
                  <small>Optional: Assign student to a specific class. Only classes matching the selected grade are shown.</small>
                  
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

              {/* Contact Information Section */}
              <div className="form-section">
                <h3>Contact Information</h3>
                <div className="form-row">
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
                </div>

                <div className="form-row">
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
                </div>

                <div className="form-row">
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

              {/* Guardian Information Section */}
              <div className="form-section">
                <h3>Guardian Information</h3>
                <div className="form-row">
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
                </div>

                <div className="form-row">
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

              {/* Subjects Section */}
              <div className="form-section">
                <h3>Subjects</h3>
                <div className="form-group full-width">
                  <label>Select Subjects * {formData.grade === 'A/L' && `- ${stream} Stream`}</label>
                  <div className="subjects-container">
                    <div className="subjects-grid">
                      {currentSubjects.map((subject) => (
                        <label key={subject} className="subject-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(subject)}
                            onChange={() => handleSubjectChange(subject)}
                          />
                          <span className="checkmark"></span>
                          {subject}
                        </label>
                      ))}
                    </div>
                  </div>
                  {errors.subjects && <span className="error-message">{errors.subjects}</span>}
                  <div className="selected-subjects">
                    <strong>Selected Subjects ({formData.subjects.length}):</strong>
                    {formData.subjects.length > 0 ? (
                      <div className="selected-tags">
                        {formData.subjects.map(subject => (
                          <span key={subject} className="subject-tag">
                            {subject}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-selection">No subjects selected</span>
                    )}
                  </div>
                </div>
              </div>

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
                  'Register Student'
                )}
              </button>
            </form>
          ) : (
            // QR Code Display Section
            <div className="qr-section">
              <div className="success-header">
                <div className="success-icon">🎉</div>
                <h3>Registration Successful!</h3>
                <p>Student has been registered successfully. Here's their ID card:</p>
              </div>
              
              <div className="id-card">
                <div className="qr-code-container">
                  <div className="qr-code">
                    <QRCode value={generatedQR} size={200} />
                  </div>
                  <p className="qr-note">Scan this QR code for attendance</p>
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

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>EduRegister</h3>
            <p>Transforming education through innovative technology solutions.</p>
          </div>
          <div className="footer-section">
            <h4>Contact Info</h4>
            <p>Email: info@eduregister.com</p>
            <p>Phone: +94 11 234 5678</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="/">Dashboard</a>
            <a href="/students">Students</a>
            <a href="/classes">Classes</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 EduRegister. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default StudentForm;