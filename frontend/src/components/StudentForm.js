import React, { useState, useRef, useEffect } from 'react';
import { classAPI } from '../services/api'; 
import './StudentForm.css';
import sammanaLogo from '../assets/images/sammanalogo.jpg';


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
  const [qrImage, setQrImage] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [registeredStudent, setRegisteredStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [stream, setStream] = useState('Arts');
  const [activeSection, setActiveSection] = useState(0);
  const [printPreview, setPrintPreview] = useState(false);
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


  const handleDirectPrint = () => {
  const printWindow = window.open('', '_blank');
  
  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student ID Card - ${formData.firstName} ${formData.lastName}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          background: white;
          width: 210mm;
          height: 297mm;
        }
        
        .print-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 50mm;
        }
        
        .id-card-page {
          width: 95mm;
          height: 65mm;
          border: 1px solid #000;
          position: relative;
          page-break-inside: avoid;
        }
        
        .front-side {
          padding: 3mm;
        }
        
        .back-side {
          padding: 4mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        /* Add all the print styles from above here */
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="id-card-page front-side">
          <!-- Front side content -->
        </div>
        <div class="id-card-page back-side">
          <!-- Back side content -->
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() {
            window.close();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(printHtml);
  printWindow.document.close();
};

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
        const hasGuardianInfo = formData.guardianName || formData.guardianPhone;
        
        if (hasGuardianInfo) {
          if (formData.guardianName && !formData.guardianPhone) {
            newErrors.guardianPhone = 'Guardian phone is required when guardian name is provided';
          }
          
          if (formData.guardianPhone && !formData.guardianName) {
            newErrors.guardianName = 'Guardian name is required when guardian phone is provided';
          }

          if (formData.guardianPhone && !/^(\+94|0)[1-9][0-9]{8}$/.test(formData.guardianPhone.replace(/\s/g, ''))) {
            newErrors.guardianPhone = 'Please enter a valid Sri Lankan phone number';
          }
        }
        break;

      default:
        break;
    }

    return newErrors;
  };

  const validateAllSections = () => {
    const allErrors = {};
    
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

      case 1: // Academic Information
        break;

      case 2: // Class Section
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

      case 4: // Guardian Information
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
    
    const allErrors = validateAllSections();
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      
      for (let i = 0; i < sections.length; i++) {
        const sectionErrors = validateSection(i);
        if (Object.keys(sectionErrors).length > 0) {
          setActiveSection(i);
          
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
        classId: formData.schoolClass?.id || null
      };

      if (formData.guardianName.trim()) {
        submissionData.guardianName = formData.guardianName.trim();
      }
      if (formData.guardianPhone.trim()) {
        submissionData.guardianPhone = formData.guardianPhone.trim();
      }
      if (formData.relationship) {
        submissionData.relationship = formData.relationship;
      }

      console.log('📤 Sending to LOCAL backend:', submissionData);

      // Use localhost with register-direct endpoint
      const response = await fetch('http://localhost:8080/api/students/register-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });
      
      const data = await response.json();
      console.log('✅ Local backend response:', data);
      
      if (response.ok && data.success) {
        // Backend returns the QR image and data
        setQrImage(data.qrImage);
        setQrData(data.qrData);
        setRegisteredStudent({
          studentId: data.studentId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          grade: data.grade,
          classId: data.classId,
          className: data.className
        });
        
        console.log('✅ QR received from backend:', data.qrImage ? 'Yes' : 'No');
        console.log('✅ Student ID:', data.studentId);
        
        // Show success message
        setResult({ 
          success: true, 
          message: 'Student registered successfully! QR code has been emailed.' 
        });
      } else {
        // Handle error response from backend
        throw new Error(data.error || data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('❌ Registration error:', err);
      console.error('❌ Full error:', err);
      
      let errorMessage = err.message || 'Registration failed. Please try again.';
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMessage = 'Cannot connect to backend server. Make sure the backend is running on http://localhost:8080';
      }
      
      setResult({ 
        error: true, 
        message: errorMessage 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

const handlePrint = () => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=900,height=600');
  
  if (!printWindow) {
    alert('Please allow popups for this site to print');
    return;
  }

   const schoolLogoUrl = sammanaLogo;

  
  const frontSideHtml = `
    <div class="print-id-card front-side">
      <div class="print-card-header">
        <div class="print-school-logo">
          <img src="${schoolLogoUrl}" alt="Sammana Educational Institute" class="school-logo-img" />
        </div>
        <div class="print-school-info">
          <h3>SAMMANA EDUCATIONAL INSTITUTE</h3>
          <p class="print-school-tagline">Sarananda Mawatha, Kalutara </p>
          <p class="print-school-tagline">Knowledge • Excellence • Success</p>
        </div>
      </div>
             
      <div class="print-student-details">
        <div class="print-detail-row">
          <div class="print-detail-label">STUDENT ID</div>
          <div class="print-detail-value student-id">${registeredStudent?.studentId}</div>
        </div>
        
        <div class="print-detail-row">
          <div class="print-detail-label">FULL NAME</div>
          <div class="print-detail-value name">${formData.firstName} ${formData.lastName}</div>
        </div>
        
        <div class="print-detail-row">
          <div class="print-detail-label">GRADE</div>
          <div class="print-detail-value grade">${formData.grade}</div>
        </div>
        
        ${formData.grade === 'A/L' && stream ? `
          <div class="print-detail-row">
            <div class="print-detail-label">STREAM</div>
            <div class="print-detail-value stream">${stream}</div>
          </div>
        ` : ''}
        
        <div class="print-detail-row">
          <div class="print-detail-label">DATE OF BIRTH</div>
          <div class="print-detail-value dob">
            ${new Date(formData.dob).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>
      
      <div class="print-card-footer">
        <div class="print-signature-line">
          <div class="print-signature-label">AUTHORIZED SIGNATURE</div>
        </div>
        <div class="print-card-number">ID: ${registeredStudent?.studentId}</div>
      </div>
      <div class="cut-line">CUT</div>
    </div>
  `;
  
  const backSideHtml = `
    <div class="print-id-card back-side">
      <div class="print-qr-container-large">
        <img src="${qrImage}" alt="Student QR Code" class="print-qr-image-large" />
      </div>
      
      <div class="cut-line">CUT</div>
    </div>
  `;
  
  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Student ID Card - ${formData.firstName} ${formData.lastName}</title>
      <style>
        /* Reset for printing */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        /* LANDSCAPE A4 layout with safe margins */
        @page {
          size: A4 landscape;
          margin: 15mm; /* Safe margin for all printers */
        }
        
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 297mm;  /* Landscape width */
            height: 210mm; /* Landscape height */
          }
          
          /* Center content properly */
          .print-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          
          /* Remove all headers and footers */
          @page {
            margin: 15mm;
            size: A4 landscape;
          }
          
          /* Hide URL, date, page numbers */
          @page {
            @top-left { content: none; }
            @top-center { content: none; }
            @top-right { content: none; }
            @bottom-left { content: none; }
            @bottom-center { content: none; }
            @bottom-right { content: none; }
          }
          
          /* No page breaks */
          .print-container, .cards-row, .id-card-wrapper, .print-id-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
          }
          
          /* Force single page */
          html, body {
            height: 100% !important;
            width: 100% !important;
            overflow: hidden !important;
          }
        }

        /* School logo image styles */
        .school-logo-img {
          width: 15mm;
          height: 15mm;
          object-fit: contain;
          display: block;
        }
        
        /* Print school logo container */
        .print-school-logo {
          margin-right: 3mm;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Main container - centered in landscape */
        .print-container {
          width: 267mm; /* 297mm - 30mm margins (15mm each side) */
          height: 180mm; /* 210mm - 30mm margins (15mm each side) */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
          margin: 0 auto;
        }
        
        /* Two ID cards side by side - PROPERLY CENTERED */
        .cards-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 25mm; /* Space between cards */
          width: 100%;
          height: 75mm;
          margin: 10mm 0;
        }
        
        /* Each ID card wrapper */
        .id-card-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3mm;
        }
        
        /* Instruction text */
        .print-instruction {
          font-size: 9px;
          color: #000000;
          text-align: center;
          margin-top: 5px;
          font-weight: bold;
          padding: 3px 8px;
          border: 1px dashed #000000;
          border-radius: 3px;
          background: #f9f9f9;
          width: 95mm;
        }
        
        /* Cut line indicator */
        .cut-line {
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 8px;
          color: #ff0000;
          font-weight: bold;
          padding: 2px 6px;
          border: 1px dashed red;
          border-radius: 2px;
          background: #fff0f0;
          white-space: nowrap;
        }
        
        /* Actual ID card */
        .print-id-card {
          width: 95mm;
          height: 65mm;
          background: white;
          border: 1px solid #000;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .print-id-card.front-side {
          padding: 3mm;
        }
        
        /* Front side styles */
        .print-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 2mm;
          border-bottom: 1px solid #000000;
          padding-bottom: 2mm;
        }
        
        .print-school-logo {
          margin-right: 3mm;
        }
        
        .print-logo-circle {
          width: 15mm;
          height: 15mm;
          background: #000000;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 5mm;
        }
        
        .print-school-info h3 {
          margin: 0;
          font-size: 4mm;
          color: #000000;
          font-weight: bold;
          line-height: 1.2;
          text-transform: uppercase;
        }
        
        .print-school-tagline {
          margin: 1mm 0 0 0;
          font-size: 2.5mm;
          color: #170b0b;
        }
        
        .print-student-details {
          width: 60mm;
          margin-top: 5mm;
        }
        
        .print-detail-row {
          display: flex;
          margin-bottom: 1.5mm;
          align-items: center;
        }
        
        .print-detail-label {
          width: 25mm;
          font-size: 2.8mm;
          font-weight: bold;
          color: #000000;
          text-transform: uppercase;
        }
        
        .print-detail-value {
          flex: 1;
          font-size: 3.2mm;
          font-weight: bold;
          color: #000;
          border-bottom: 1px solid #eee;
          padding-bottom: 0.5mm;
          min-height: 4mm;
        }
        
        .print-detail-value.student-id {
          background: #f0f0f0;
          padding: 1mm;
          border-radius: 1mm;
          border: 1px solid #ccc;
          font-family: 'Courier New', monospace;
          font-size: 3.5mm;
        }
        
        .print-detail-value.name {
          font-size: 3.5mm;
          color: #000000;
          border-bottom: 1px solid #000000;
        }
        
        .print-card-footer {
          position: absolute;
          bottom: 3mm;
          left: 3mm;
          right: 3mm;
          border-top: 1px solid #ccc;
          padding-top: 1mm;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .print-signature-label {
          font-size: 2.5mm;
          color: #161313;
          font-style: italic;
        }
        
        .print-card-number {
          font-size: 2.8mm;
          font-weight: bold;
          color: #2a2626;
        }
        
        /* Back side styles */
        .print-id-card.back-side {
          padding: 4mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        
        .print-qr-container-large {
          width: 50mm;
          height: 50mm;
          border: 1px solid #000;
          padding: 1mm;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2mm;
        }
        
        .print-qr-image-large {
          width: 130%;
          height: 130%;
          object-fit: contain;
        }
        
        .qr-info {
          text-align: center;
          margin: 2mm 0;
        }
        
        .qr-info h4 {
          margin: 0 0 1mm 0;
          font-size: 3.5mm;
          color: #000000;
          font-weight: bold;
        }
        
        .qr-info p {
          margin: 0;
          font-size: 2.5mm;
          color: #000000;
        }
        
        .print-back-footer {
          display: flex;
          justify-content: space-between;
          width: 100%;
          font-size: 2.5mm;
          color: #000000;
          border-top: 1px solid #eee;
          padding-top: 1mm;
          margin-top: 2mm;
        }
        
        .print-website {
          font-weight: bold;
        }
        
        /* Instructions panel */
        .instructions-panel {
          width: 240mm;
          padding: 4mm;
          background: #f9f9f9;
          border: 1px solid #000000;
          border-radius: 2mm;
          margin-top: 5mm;
        }
        
        .instructions-panel h4 {
          color: #2E7D32;
          margin-bottom: 3mm;
          text-align: center;
          font-size: 12px;
        }
        
        .instructions-panel ol {
          margin: 0;
          padding-left: 20px;
          font-size: 10px;
        }
        
        .instructions-panel li {
          margin-bottom: 1mm;
          line-height: 1.4;
        }
        
        .instructions-panel strong {
          color: #041205;
        }
        
        /* Print controls (visible only in preview) */
        .print-controls {
          position: fixed;
          top: 20px;
          right: 20px;
          background: white;
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 5px;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .print-controls button {
          margin: 5px;
          padding: 8px 15px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          display: block;
          width: 100%;
        }
        
        .print-controls button:hover {
          background: #45a049;
        }
        
        /* Hide instructions and controls during print */
        @media print {
          .print-controls,
          .instructions-panel {
            display: none !important;
          }
        }
        
        /* Preview mode styles */
        @media screen {
          body {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          
          .print-container {
            background: white;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            border-radius: 10px;
            overflow: hidden;
          }
          
          /* Show safe area for printing */
          .print-container::before {
            content: "SAFE PRINT AREA";
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: #4CAF50;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="cards-row">
          <!-- Front Side -->
          <div class="id-card-wrapper">
            <div class="print-id-card front-side">
              ${frontSideHtml}
            </div>
            <div class="print-instruction">FRONT SIDE (Left)</div>
          </div>
          
          <!-- Back Side -->
          <div class="id-card-wrapper">
            <div class="print-id-card back-side">
              ${backSideHtml}
            </div>
            <div class="print-instruction">BACK SIDE (Right)</div>
          </div>
        </div>
        
        <div class="instructions-panel">
          <h4>📋 PRINTING INSTRUCTIONS - SINGLE A4 PAGE (LANDSCAPE)</h4>
          <ol>
            <li><strong>SET PRINTER TO LANDSCAPE</strong> in print settings</li>
            <li><strong>PRINT THIS PAGE</strong> on one side of A4 paper</li>
            <li>Take printed paper and <strong>FLIP VERTICALLY</strong> (long edge)</li>
            <li><strong>PRINT SAME PAGE AGAIN</strong> on reverse side</li>
            <li><strong>CUT</strong> along dashed red lines around each ID card</li>
            <li><strong>MATCH FRONT & BACK</strong> to create double-sided card</li>
            <li><strong>LAMINATE</strong> for professional finish</li>
          </ol>
        </div>
      </div>
      
      <div class="print-controls">
        <button onclick="window.print()">🖨️ Print Now</button>
        <button onclick="window.close()">✖️ Close Window</button>
        <div style="margin-top: 10px; font-size: 12px; color: #666;">
          <p><strong>Check printer settings:</strong></p>
          <p>• Paper: A4</p>
          <p>• Orientation: Landscape</p>
          <p>• Scale: 100%</p>
          <p>• Margins: Default</p>
        </div>
      </div>
      
      <script>
        // Disable browser headers and footers
        window.onbeforeprint = function() {
          // Add styles to remove headers/footers
          var style = document.createElement('style');
          style.innerHTML = '
            @page { 
              size: A4 landscape; 
              margin: 15mm; 
              marks: none; 
            }
            @page :footer { display: none; }
            @page :header { display: none; }
          ';
          document.head.appendChild(style);
        };
        
        // Auto-print after a short delay
        setTimeout(function() {
          window.print();
        }, 500);
        
        // Close window after printing
        window.onafterprint = function() {
          setTimeout(function() {
            window.close();
          }, 1000);
        };
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(printHtml);
  printWindow.document.close();
};

const closePrintPreview = () => {
  setPrintPreview(false);
};

// Add this useEffect to handle afterprint event
useEffect(() => {
  const handleAfterPrint = () => {
    console.log('Printing completed or cancelled');
  };

  window.addEventListener('afterprint', handleAfterPrint);
  
  return () => {
    window.removeEventListener('afterprint', handleAfterPrint);
  };
}, []);

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
    setQrImage(null);
    setQrData(null);
    setRegisteredStudent(null);
    setResult(null);
    setStream('Arts');
    setClasses([]);
    setActiveSection(0);
    setPrintPreview(false);
  };

  const nextSection = () => {
    const currentSectionErrors = validateCurrentSection();
    
    if (Object.keys(currentSectionErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...currentSectionErrors }));
      
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

          {!qrImage ? (
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
            // Success Section with ID Card Display
            <div className="qr-section">
              <div className="success-header">
                <div className="success-icon">✅</div>
                <h3>Registration Successful!</h3>
                <p>Student ID card generated. Print double-sided on A4 paper for 65×95mm ID card.</p>
                {result?.success && (
                  <div className="success-message">
                    <p>✅ QR code has been emailed to {formData.email}</p>
                  </div>
                )}
              </div>
              
              {/* ID Card Preview Container */}
              <div className="id-card-container">
                <div className="id-card-preview">
                  {/* Front Side - Student Details */}
                  <div className="id-card-side front-side">
                    <div className="card-header">
                      <div className="school-logo">
                        <div className="logo-circle">SEI</div>
                      </div>
                      <div className="school-info">
                        <h3>SAMMANA EDUCATIONAL INSTITUTE</h3>
                        <p className="school-tagline">Knowledge • Excellence • Success</p>
                      </div>
                    </div>
                                       
                    <div className="student-details">
                      <div className="detail-row">
                        <div className="detail-label">STUDENT ID</div>
                        <div className="detail-value student-id">{registeredStudent?.studentId}</div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-label">FULL NAME</div>
                        <div className="detail-value name">{formData.firstName} {formData.lastName}</div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-label">GRADE</div>
                        <div className="detail-value grade">{formData.grade}</div>
                      </div>
                      
                      <div className="detail-row">
                        <div className="detail-label">CLASS</div>
                        <div className="detail-value class">{formData.schoolClass?.className || 'Not Assigned'}</div>
                      </div>
                      
                      {formData.grade === 'A/L' && stream && (
                        <div className="detail-row">
                          <div className="detail-label">STREAM</div>
                          <div className="detail-value stream">{stream}</div>
                        </div>
                      )}
                      
                      <div className="detail-row">
                        <div className="detail-label">DATE OF BIRTH</div>
                        <div className="detail-value dob">
                          {new Date(formData.dob).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                  
                    </div>
                    
                    <div className="card-footer">
                      <div className="signature-line">
                        <div className="signature-label">AUTHORIZED SIGNATURE</div>
                      </div>
                      <div className="card-number">ID: {registeredStudent?.studentId}</div>
                    </div>
                    
                    <div className="front-indicator">FRONT SIDE</div>
                  </div>
                  
                  {/* Back Side - QR Code */}
                  <div className="id-card-side back-side">
                    <div className="qr-section-back">
                      <div className="qr-container-large">
                        <img 
                          src={qrImage} 
                          alt="Student QR Code" 
                          className="qr-image-large"
                        />
                      </div>                                     
                      <div className="back-side-footer">
                        <div className="website">www.sammanaedu.com</div>
                        <div className="contact">📞 011-234-5678</div>
                      </div>
                      
                      <div className="back-indicator">BACK SIDE</div>
                    </div>
                  </div>
                </div>
                
                <div className="print-instructions">
                  <h4>📋 Printing Instructions:</h4>
                  <ul>
                    <li>✅ Print <strong>double-sided</strong> on A4 paper</li>
                    <li>✅ Card size: <strong>65mm × 95mm</strong> (standard ID card)</li>
                    <li>✅ Print front side first, then flip paper vertically</li>
                    <li>✅ Print back side on reverse side</li>
                    <li>✅ Use thick paper or cardstock (200-300gsm recommended)</li>
                    <li>✅ Laminate after printing for durability</li>
                  </ul>
                </div>
                
                <div className="card-actions">
                  <div className="print-buttons">
                    <button onClick={() => {
                      setPrintPreview(true);
                      setTimeout(handlePrint, 100);
                    }} className="print-btn both-btn">
                      🖨️ PRINT ID CARD
                    </button>
                  </div>
                  <button onClick={resetForm} className="new-registration-btn">
                    ➕ REGISTER ANOTHER STUDENT
                  </button>
                </div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="result-box error">
              <h3>Error</h3>
              <p>{result.message}</p>
            </div>
          )}
        </div>
      </main>

          {/* Simple Print Preview Modal */}
{printPreview && (
  <div className="simple-print-preview">
    <div className="preview-content">
      <h3>Printing ID Card...</h3>
      <p>Print window should open automatically. If it doesn't, please check your popup blocker.</p>
      <div className="preview-buttons">
        <button onClick={handlePrint} className="retry-print-btn">
          🖨️ Open Print Window
        </button>
        <button onClick={() => setPrintPreview(false)} className="cancel-btn">
          ✖️ Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default StudentForm;