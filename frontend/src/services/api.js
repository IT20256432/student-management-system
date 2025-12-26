const API_BASE_URL = 'https://management.sammanaedu.com/api';

const handleResponse = async (response) => {
  console.log(`🔍 API Response Code: ${response.status}`);
  
  // For 204 No Content responses
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  
  try {
    // Read the body ONCE based on content type
    let result;
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
    }
    
    // Check if response was successful
    if (!response.ok) {
      // Handle error with already-read result
      const errorMessage = result?.error || result?.message || 
                          (typeof result === 'string' ? result : `HTTP ${response.status}`);
      
      console.error('❌ API Error Details:', {
        status: response.status,
        message: errorMessage,
        url: response.url
      });
      
      throw new Error(errorMessage);
    }
    
    // Success case
    console.log('✅ API Success - Data received');
    return result;
    
  } catch (error) {
    // If we couldn't parse the body at all
    if (!response.ok) {
      console.error('❌ API Error (no body):', {
        status: response.status,
        url: response.url
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parse error for successful response
    console.error('❌ Response Parse Error:', error);
    throw new Error('Failed to parse response');
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('🔑 Auth headers:', headers);
  return headers;
};

// In your api.js, update the apiFetch function:
const apiFetch = async (url, options = {}) => {
  const fullUrl = `${API_BASE_URL}${url}`;
  console.log(`🌐 API CALL: ${options.method || 'GET'} ${fullUrl}`);
  
  // ✅ Use getAuthHeaders directly (not authAPI.getAuthHeaders)
  const authHeaders = getAuthHeaders();
  
  const requestOptions = {
    ...options,
    mode: 'cors',
    credentials: 'include',
    headers: {
      ...authHeaders,
      ...options.headers,
    }
  };
  
  try {
    const response = await fetch(fullUrl, requestOptions);
    
    // Remove the 401 handling for now (it's causing issues)
    // if (response.status === 401) {
    //   console.log('🔒 Unauthorized - attempting token refresh...');
    //   const refreshed = await authAPI.refreshToken();
    //   if (!refreshed) {
    //     console.log('❌ Token refresh failed, redirecting to login...');
    //     authAPI.clearAuth();
    //     window.location.href = '/login';
    //     throw new Error('Session expired. Please login again.');
    //   }
    //   return apiFetch(url, options);
    // }
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`💥 API Call Failed for ${fullUrl}:`, error);
    throw error;
  }
};
  


// API methods
export const apiGet = (url) => apiFetch(url, { method: 'GET' });

export const apiPost = (url, data) => apiFetch(url, {
  method: 'POST',
  body: JSON.stringify(data)
});

export const apiPut = (url, data) => apiFetch(url, {
  method: 'PUT',
  body: JSON.stringify(data)
});

export const apiDelete = (url) => apiFetch(url, { method: 'DELETE' });

export const apiPatch = (url, data) => apiFetch(url, {
  method: 'PATCH',
  body: JSON.stringify(data)
});

// AUTH API
export const authAPI = {
  login: (credentials) => apiPost('/auth/login', credentials),
  validateSession: () => apiPost('/auth/validate'),
  logout: () => apiPost('/auth/logout'),
  health: () => apiGet('/auth/health')
};

// CHECK BACKEND CONNECTION FUNCTION
export const checkBackendConnection = async () => {
  console.log('🔗 Checking backend connection...');
  
  const testEndpoints = [
    '/debug/health',
    '/dashboard/health',
    '/auth/health'
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        mode: 'no-cors' // Use no-cors just to check if server is up
      });
      console.log(`✅ Backend test ${endpoint}: Server responding`);
      return true;
    } catch (error) {
      console.log(`⚠️ Backend test ${endpoint} failed:`, error.message);
    }
  }
  
  console.error('❌ Backend not reachable at', API_BASE_URL);
  return false;
};

// DASHBOARD API
export const dashboardAPI = {
  getSummary: () => apiGet('/dashboard/summary'),
  getQuickStats: () => apiGet('/dashboard/quick-stats'),
  getTodayAttendance: () => apiGet('/dashboard/attendance-today'),
  getActiveSessions: () => apiGet('/dashboard/active-sessions'),
  test: () => apiGet('/dashboard/test'),
  health: () => apiGet('/dashboard/health'),
  getPublicStats: () => apiGet('/dashboard/public/stats')
};

// STUDENT API
export const studentAPI = {
  register: (studentData) => apiPost('/students/register', studentData),
  getAll: () => apiGet('/students'),
  getById: (id) => apiGet(`/students/${id}`),
  getByStudentId: (studentId) => apiGet(`/students/student-id/${encodeURIComponent(studentId)}`),
  update: (id, studentData) => apiPut(`/students/${id}`, studentData),
  delete: (id) => apiDelete(`/students/${id}`),
  getByClass: (classId) => apiGet(`/students/class/${classId}`),
  getByGrade: (grade) => apiGet(`/students/grade/${encodeURIComponent(grade)}?t=${Date.now()}`),
  getWithoutClass: () => apiGet('/students/unassigned'),
  updateClass: (studentId, classId) => apiPut(`/students/${studentId}/class/${classId}`),
  getClassStatistics: (classId) => apiGet(`/students/class/${classId}/statistics`),
  getRecent: () => apiGet('/students/recent'),
  
  // Test endpoints for debugging
  testConnection: () => apiGet('/students?limit=1&test=true')
};

export const classAPI = {
  getAll: () => apiGet('/classes'),
  getAllActive: () => apiGet('/classes/active'),
  getById: (id) => apiGet(`/classes/${id}`),
  create: (classData) => apiPost('/classes', classData),
  update: (id, classData) => apiPut(`/classes/${id}`, classData),
  delete: (id) => apiDelete(`/classes/${id}`),
  deactivate: (id) => apiPut(`/classes/${id}/deactivate`),
  getStudentCount: (classId) => apiGet(`/classes/${classId}/student-count`),
  getByGrade: (grade) => {
    console.log(`🎯 Getting classes for grade: ${grade}`);
    
    return apiGet(`/classes/by-grade?grade=${encodeURIComponent(grade)}`)
      .then(data => {
        // Handle the response format
        if (data.classes !== undefined) {
          return data.classes;
        }
        return data;
      })
      .catch(error => {
        console.error('❌ Error in getByGrade:', error);
        throw error;
      });

      
  },
  
  // Alternative method using path parameter (if needed)
  getByGradePath: (grade) => {
    // Convert A/L to A-L for path parameter
    const urlSafeGrade = grade.replace(/\//g, '-');
    return apiGet(`/classes/grade/${encodeURIComponent(urlSafeGrade)}`);
  },
  
  // Test endpoint
  testGradeEndpoint: (grade) => {
    return apiGet(`/classes/grade-test/${encodeURIComponent(grade.replace(/\//g, '-'))}`);
  },
}

// FEE STRUCTURE API - FIXED
export const feeAPI = {
  getAll: () => apiGet('/fees'),
  getByClass: (classId) => {
    console.log(`💰 Fetching fee structure for class ID: ${classId}`);
    return apiGet(`/fees/class/${classId}`).then(data => {
      console.log(`✅ Fee structure loaded for class ${classId}:`, data);
      return data;
    }).catch(error => {
      console.warn(`⚠️ Fee structure not found for class ${classId}:`, error.message);
      return null;
    });
  },
  create: (feeData) => apiPost('/fees', feeData),
  update: (id, feeData) => apiPut(`/fees/${id}`, feeData),
  delete: (id) => apiDelete(`/fees/${id}`),
  

  getStudentFeeStatus: async (studentId) => {
    console.log(`💰 [feeAPI] Getting fee status for student: ${studentId}`);
    
    try {
      // Since your backend endpoint is /api/fee-payments/student/{studentId}/status
      // But it's in feePaymentAPI, not feeAPI
      const response = await apiGet(`/fee-payments/student/${encodeURIComponent(studentId)}/status`);
      
      // Add current date info for frontend logic
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      // Ensure the response has grace period info
      const enhancedResponse = {
        ...response,
        // Add grace period info if missing
        gracePeriodActive: response.gracePeriodActive !== undefined 
          ? response.gracePeriodActive 
          : currentDay <= 14,
        gracePeriodEnds: response.gracePeriodEnds || (currentDay <= 14 ? 14 - currentDay : 0),
        daysOverdue: response.daysOverdue || (currentDay > 14 ? currentDay - 15 : 0),
        checkDate: today.toISOString().split('T')[0]
      };
      
      console.log('✅ Enhanced fee status:', enhancedResponse);
      return enhancedResponse;
      
    } catch (error) {
      console.error('❌ Error in getStudentFeeStatus:', error.message);
      
      // Create comprehensive fallback with grace period logic
      const today = new Date();
      const currentDay = today.getDate();
      const isGracePeriodActive = currentDay <= 14;
      const daysOverdue = currentDay > 14 ? currentDay - 15 : 0;
      
      const fallbackStatus = {
        studentId,
        studentName: 'Unknown Student',
        className: 'Unknown Class',
        classId: null,
        totalDue: 8000,
        totalPaid: 0,
        balance: 8000,
        overallStatus: isGracePeriodActive ? 'PENDING' : 'OVERDUE',
        paymentStatus: isGracePeriodActive ? 'GRACE_PERIOD' : 'UNPAID',
        daysOverdue: daysOverdue,
        gracePeriodActive: isGracePeriodActive,
        gracePeriodEnds: isGracePeriodActive ? 14 - currentDay : 0,
        nextDueDate: isGracePeriodActive 
          ? new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0]
          : new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0],
        isFallback: true,
        checkDate: today.toISOString().split('T')[0]
      };
      
      console.log('📋 Returning fallback fee status:', fallbackStatus);
      return fallbackStatus;
    }
  },
  
  // Fallback fee structures
  getFallbackForGrade: (grade) => {
    console.log(`🎯 Getting fallback fee structure for grade: ${grade}`);
    const fallbackFees = {
      'A/L': {
        id: 0,
        schoolClass: { id: 0, className: `${grade} General`, grade: grade },
        monthlyFee: 4000.00,
        admissionFee: 2500.00,
        examFee: 1500.00,
        sportsFee: 600.00,
        libraryFee: 400.00,
        labFee: 900.00,
        otherFee: 600.00,
        totalFee: 10500.00,
        description: "Standard A/L Fee Structure",
        isFallback: true
      },
      'O/L': {
        id: 0,
        schoolClass: { id: 0, className: `${grade} General`, grade: grade },
        monthlyFee: 3000.00,
        admissionFee: 2000.00,
        examFee: 1000.00,
        sportsFee: 500.00,
        libraryFee: 300.00,
        labFee: 700.00,
        otherFee: 500.00,
        totalFee: 8000.00,
        description: "Standard O/L Fee Structure",
        isFallback: true
      }
    };
    
    return Promise.resolve(fallbackFees[grade] || fallbackFees['O/L']);
  }
};

// FEE PAYMENT API - ENHANCED WITH NEW FEE STATUS CHECK
export const feePaymentAPI = {
  // Record payment
  recordPayment: (paymentData) => {
    console.log('💳 Recording payment:', paymentData);
    return apiPost('/fee-payments/record', paymentData);
  },
  
  // FIXED: recordPaymentWithEmail - handles PDF download
  recordPaymentWithEmail: async (paymentData) => {
    console.log('📧 Recording payment with email confirmation:', paymentData);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/fee-payments/record-with-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/pdf, application/json' // Accept both
        },
        body: JSON.stringify(paymentData)
      });
      
      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/pdf')) {
        // It's a PDF - download it
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        
        // Get filename from headers
        let filename = `Payment-Receipt-${Date.now()}.pdf`;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+?)"?$/);
          if (match) filename = match[1];
        }
        
        // Trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        console.log('✅ PDF downloaded:', filename);
        
        // Return success object with transaction ID
        return {
          success: true,
          message: 'Payment successful and receipt downloaded',
          transactionId: paymentData.transactionId,
          filename: filename,
          pdfDownloaded: true
        };
        
      } else if (contentType.includes('application/json')) {
        // It's JSON - parse it
        const result = await response.json();
        console.log('✅ JSON response:', result);
        return result;
        
      } else {
        // Unknown content type - try to parse as text
        const text = await response.text();
        console.log('📄 Text response:', text.substring(0, 100));
        
        // Check if it looks like JSON
        try {
          const jsonResult = JSON.parse(text);
          return jsonResult;
        } catch {
          throw new Error(`Unexpected response format: ${contentType}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Payment with email error:', error);
      throw error;
    }
  },

  recordPaymentAndDownload: async (paymentData) => {
    console.log('💳 Recording payment and downloading receipt separately...');
    
    try {
      // Step 1: Record payment (returns JSON with payment ID)
      const result = await feePaymentAPI.recordPayment(paymentData);
      
      if (result && result.id) {
        // Step 2: Send email confirmation
        try {
          await feePaymentAPI.sendPaymentEmail(result.id);
          console.log('✅ Email sent');
        } catch (emailError) {
          console.warn('⚠️ Email failed:', emailError.message);
          // Don't fail if email fails
        }
        
        // Step 3: Download receipt
        try {
          await feePaymentAPI.downloadReceiptPDF(result.id);
          console.log('✅ Receipt downloaded');
        } catch (pdfError) {
          console.warn('⚠️ PDF download failed:', pdfError.message);
          // Don't fail if PDF download fails
        }
        
        return result;
      } else {
        throw new Error('No payment ID returned');
      }
    } catch (error) {
      console.error('❌ Payment and download error:', error);
      throw error;
    }
  },
  
  sendPaymentEmail: async (paymentId) => {
    try {
      // You need to create this endpoint in your backend
      const response = await apiPost(`/fee-payments/${paymentId}/send-email`, {});
      console.log('📧 Email sending response:', response);
      return response;
    } catch (error) {
      console.warn('Email send error:', error);
      throw error;
    }
  },
  
  // In api.js - update the downloadReceiptPDF function:
downloadReceiptPDF: async (paymentId) => {
    try {
        const token = localStorage.getItem('token');
        console.log('📥 Downloading receipt for payment:', paymentId);
        
        const response = await fetch(`${API_BASE_URL}/fee-payments/receipt/${paymentId}/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/pdf', // ← FIX: Request PDF, not JSON
                // Remove 'Content-Type' for GET requests
            },
            credentials: 'include'
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            // Try to get error message
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);
                errorMessage = errorText || errorMessage;
            } catch (e) {
                // Ignore
            }
            throw new Error(`Failed to download receipt: ${errorMessage}`);
        }
        
        // Verify content type is PDF
        const contentType = response.headers.get('content-type') || '';
        console.log('📄 Content-Type:', contentType);
        
        if (!contentType.includes('application/pdf')) {
            // If not PDF, read as text to see what's returned
            const text = await response.text();
            console.error('⚠️ Unexpected response (not PDF):', text.substring(0, 200));
            
            // Check if it's JSON error
            try {
                const jsonError = JSON.parse(text);
                throw new Error(jsonError.error || 'Server returned error instead of PDF');
            } catch {
                throw new Error('Server did not return PDF. Got: ' + contentType);
            }
        }
        
        // Download PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Get filename from headers or use default
        let filename = `Receipt-${paymentId}.pdf`;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+?)"?$/);
            if (match) filename = match[1];
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ PDF downloaded successfully:', filename);
        return filename;
        
    } catch (error) {
        console.error('❌ PDF download error:', error);
        throw error;
    }
},  
  
  // ✅ ADD THIS FUNCTION FOR BASE64 RECEIPT:
  getReceiptBase64: async (paymentId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/fee-payments/receipt/${paymentId}/base64`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get receipt data');
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('❌ Receipt fetch error:', error);
      throw error;
    }
  },
  
  // Get fee status (general) - WITH GRACE PERIOD SUPPORT
  getFeeStatus: async (studentId) => {
    console.log(`💰 Checking fee status for student: ${studentId}`);
    
    try {
      const response = await apiGet(`/fee-payments/student/${encodeURIComponent(studentId)}/status`);
      console.log('✅ Fee status received:', response);
      return response;
    } catch (error) {
      console.warn(`⚠️ Fee status endpoint failed: ${error.message}`);
      
      // Create a fallback fee status with grace period logic
      const today = new Date();
      const currentDay = today.getDate();
      const isGracePeriodActive = currentDay <= 14;
      const daysOverdue = currentDay > 14 ? currentDay - 15 : 0;
      
      const fallbackStatus = {
        studentId,
        studentName: 'Unknown Student',
        className: 'Unknown Class',
        classId: null,
        totalDue: 8000,
        totalPaid: 0,
        balance: 8000,
        overallStatus: isGracePeriodActive ? 'PENDING' : 'OVERDUE',
        paymentStatus: isGracePeriodActive ? 'GRACE_PERIOD' : 'UNPAID',
        daysOverdue: daysOverdue,
        gracePeriodActive: isGracePeriodActive,
        gracePeriodEnds: isGracePeriodActive ? 14 - currentDay : 0,
        nextDueDate: isGracePeriodActive 
          ? new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0]
          : new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0],
        isFallback: true
      };
      
      console.log('📋 Returning fallback fee status:', fallbackStatus);
      return fallbackStatus;
    }
  },
  
  // Get fee status for specific class - FALLBACK IMPLEMENTATION
  getFeeStatusForClass: async (studentId, classId) => {
    console.log(`📊 Getting fee status for student ${studentId}, class ${classId}`);
    
    try {
      // First try the standard endpoint
      const status = await apiGet(`/fee-payments/student/${encodeURIComponent(studentId)}/status`);
      
      // If we got the status but it's for a different class, adapt it
      if (status.classId && status.classId !== classId) {
        console.log(`⚠️ Fee status is for class ${status.classId}, not ${classId}. Adapting...`);
        status.classId = classId;
        status.isAdapted = true;
      }
      
      return status;
    } catch (error) {
      console.log(`⚠️ Fee status endpoint not available, using fallback: ${error.message}`);
      
      // Fallback logic
      try {
        // Try to get student info
        const student = await studentAPI.getByStudentId(studentId).catch(() => null);
        
        // Try to get class info
        const classInfo = await classAPI.getById(classId).catch(() => null);
        
        // Get current date for grace period logic
        const today = new Date();
        const currentDay = today.getDate();
        const isGracePeriodActive = currentDay <= 14;
        const daysOverdue = currentDay > 14 ? currentDay - 15 : 0;
        
        // Try to get actual payments
        const payments = await feePaymentAPI.getStudentPayments(studentId).catch(() => []);
        
        // Filter payments for this class
        const classPayments = payments.filter(p => p.classId === classId);
        const totalPaid = classPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
        
        // Get fee structure
        let totalDue = 8000; // Default
        try {
          const feeStructure = await feeAPI.getByClass(classId);
          if (feeStructure) totalDue = feeStructure.totalFee || totalDue;
        } catch (feeError) {
          console.log('Using default fee amount');
        }
        
        const balance = totalDue - totalPaid;
        let overallStatus;
        
        if (balance <= 0) {
          overallStatus = 'PAID';
        } else if (isGracePeriodActive) {
          overallStatus = totalPaid > 0 ? 'PARTIAL' : 'PENDING';
        } else {
          overallStatus = 'OVERDUE';
        }
        
        const fallbackStatus = {
          studentId,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
          className: classInfo ? classInfo.className : `Class ${classId}`,
          classId,
          totalDue,
          totalPaid,
          balance,
          overallStatus,
          paymentStatus: overallStatus === 'PAID' ? 'COMPLETE' : 
                       overallStatus === 'PENDING' ? 'GRACE_PERIOD' :
                       overallStatus === 'PARTIAL' ? 'IN_PROGRESS' : 'UNPAID',
          daysOverdue: overallStatus === 'OVERDUE' ? daysOverdue : null,
          gracePeriodActive: isGracePeriodActive,
          gracePeriodEnds: isGracePeriodActive ? 14 - currentDay : 0,
          nextDueDate: isGracePeriodActive 
            ? new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0]
            : new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0],
          isFallback: true
        };
        
        return fallbackStatus;
      } catch (fallbackError) {
        console.error('Fallback fee status failed:', fallbackError);
        
        // Ultimate fallback with current date logic
        const today = new Date();
        const currentDay = today.getDate();
        const isGracePeriodActive = currentDay <= 14;
        
        // Ultimate fallback
        return {
          studentId,
          studentName: 'Unknown',
          className: 'Unknown Class',
          classId,
          totalDue: 8000,
          totalPaid: 0,
          balance: 8000,
          overallStatus: isGracePeriodActive ? 'PENDING' : 'OVERDUE',
          paymentStatus: isGracePeriodActive ? 'GRACE_PERIOD' : 'UNPAID',
          daysOverdue: isGracePeriodActive ? 0 : currentDay - 15,
          gracePeriodActive: isGracePeriodActive,
          gracePeriodEnds: isGracePeriodActive ? 14 - currentDay : 0,
          nextDueDate: isGracePeriodActive 
            ? new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0]
            : new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0],
          isFallback: true
        };
      }
    }
  },
  
  // Get student payments for specific class
  getStudentPaymentsForClass: (studentId, classId) => 
    apiGet(`/fee-payments/student/${encodeURIComponent(studentId)}/class/${classId}`),
  
  // Other endpoints
  getOverdueStudents: () => apiGet('/fee-payments/overdue'),
  getFeeStatistics: () => apiGet('/fee-payments/statistics'),
  getRecentPayments: () => apiGet('/fee-payments/recent')
};

// ATTENDANCE API
export const attendanceAPI = {
  record: (attendanceData) => apiPost('/attendance/record', attendanceData),
  getByStudent: (studentId) => apiGet(`/attendance/student/${encodeURIComponent(studentId)}`),
  getByDate: (date) => apiGet(`/attendance/date/${date}`),
  getSummary: (studentId) => apiGet(`/attendance/student/${encodeURIComponent(studentId)}/summary`),
  recordManual: (studentId, date, status, sessionId = null) => {
    const params = new URLSearchParams({
      studentId,
      date,
      status,
      ...(sessionId && { sessionId: sessionId.toString() })
    });
    return apiPost(`/attendance/manual?${params}`, {});
  },
  getBySession: (sessionId) => apiGet(`/attendance/session/${sessionId}`),
  getActiveSessions: () => apiGet('/attendance/sessions/active'),
  getToday: () => apiGet('/attendance/today'),
  recordForSession: async (studentId, sessionId, status) => {
    const response = await fetch(`/api/attendance/session/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, status })
    });
    if (!response.ok) throw new Error('Failed to record attendance');
    return response.json();
  }
};

// OTHER APIs
export const scheduleAPI = {
  getByClass: (classId) => apiGet(`/schedules/class/${classId}`),
  getTodayByClass: (classId) => apiGet(`/schedules/class/${classId}/today`),
  create: (scheduleData) => apiPost('/schedules', scheduleData),
  update: (id, scheduleData) => apiPut(`/schedules/${id}`, scheduleData),
  delete: (id) => apiDelete(`/schedules/${id}`),
  
  getSchedulesByClassAndDate: async (classId, date) => {
    try {
      const response = await fetch(`/api/schedules/class/${classId}?date=${date}`);
      
      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('API returned HTML instead of JSON');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('getSchedulesByClassAndDate error:', error);
      throw error;
    }
  },
  
  getTodaySchedulesByClass: async (classId) => {
    try {
      const response = await fetch(`/api/schedules/class/${classId}/today`);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('API returned HTML instead of JSON');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('getTodaySchedulesByClass error:', error);
      throw error;
    }
  },
  
  getSchedulesByClass: async (classId) => {
    try {
      const response = await fetch(`/api/schedules/class/${classId}`);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('API returned HTML instead of JSON');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('getSchedulesByClass error:', error);
      throw error;
    }
  }

};

export const sessionAPI = {
  getActive: () => apiGet('/attendance/sessions/active'),
  getByClassAndDate: (classId, date) => apiGet(`/attendance/sessions/class/${classId}?date=${date}`),
  create: (sessionData) => apiPost('/attendance/sessions', sessionData),
  start: (sessionId) => apiPost(`/attendance/sessions/${sessionId}/start`),
  end: (sessionId) => apiPost(`/attendance/sessions/${sessionId}/end`),
  getToday: () => apiGet('/attendance/sessions/today')
};

export const qrCodeAPI = {
  resend: (studentId) => apiPost(`/qrcode/resend/${encodeURIComponent(studentId)}`)
};

// DEBUG API
export const debugAPI = {
  health: () => apiGet('/debug/health'),
  dbStatus: () => apiGet('/debug/institute-db-status'),
  essentialData: () => apiGet('/debug/check-essential-data'),
  corsTest: () => apiGet('/debug/cors-test'),
  securityTest: () => apiGet('/debug/security/test'),
  publicTest: () => apiGet('/debug/security/public-test'),
  
  // Test all endpoints
  testAll: async () => {
    console.log('🧪 Testing all API endpoints...');
    
    const tests = [
      { name: 'Dashboard', func: () => dashboardAPI.health() },
      { name: 'Auth', func: () => authAPI.health() },
      { name: 'Students', func: () => studentAPI.getAll() },
      { name: 'Classes', func: () => classAPI.getAll() },
      { name: 'Fee Payments', func: () => feePaymentAPI.getRecentPayments() },
      { name: 'Attendance', func: () => attendanceAPI.getToday() },
      { name: 'Fee Status Check', func: () => feePaymentAPI.getFeeStatus('TEST123') }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        const startTime = Date.now();
        const data = await test.func();
        const time = Date.now() - startTime;
        
        results.push({
          name: test.name,
          status: '✅ SUCCESS',
          time: `${time}ms`,
          data: Array.isArray(data) ? `${data.length} items` : 'OK'
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: '❌ FAILED',
          error: error.message,
          time: 'N/A'
        });
      }
    }
    
    console.table(results);
    return results;
  }
};



// NEW: Dedicated Fee Check API for Attendance Scanner
export const attendanceFeeAPI = {
  // Main method for attendance scanner to check fees
  checkFeeStatusForAttendance: async (studentId, classId = null) => {
    console.log(`🎯 Checking fee status for attendance: student=${studentId}, class=${classId}`);
    
    try {
      let feeStatus;
      
      if (classId) {
        // Get fee status for specific class
        feeStatus = await feePaymentAPI.getFeeStatusForClass(studentId, classId);
      } else {
        // Get general fee status
        feeStatus = await feePaymentAPI.getFeeStatus(studentId);
      }
      
      // Apply attendance logic based on fee status and grace period
      const today = new Date();
      const currentDay = today.getDate();
      const isGracePeriodActive = feeStatus.gracePeriodActive || currentDay <= 14;
      const daysOverdue = feeStatus.daysOverdue || (currentDay > 14 ? currentDay - 15 : 0);
      
      // Determine if attendance should be allowed
      let allowAttendance = true;
      let requireTeacherApproval = false;
      let warningMessage = '';
      let showWarning = false;
      
      // Logic based on fee status and grace period
      if (feeStatus.overallStatus === 'PAID') {
        // Fully paid - no restrictions
        allowAttendance = true;
        warningMessage = '';
      } else if (isGracePeriodActive) {
        // Within grace period (1st-14th)
        allowAttendance = true;
        showWarning = feeStatus.overallStatus !== 'PAID';
        
        if (feeStatus.overallStatus === 'PENDING') {
          warningMessage = `Fees not paid yet. Grace period ends in ${feeStatus.gracePeriodEnds || 14 - currentDay} day(s)`;
        } else if (feeStatus.overallStatus === 'PARTIAL') {
          warningMessage = `Partial payment: LKR ${feeStatus.totalPaid?.toFixed(2)} paid, balance: LKR ${feeStatus.balance?.toFixed(2)}`;
        }
      } else {
        // After grace period
        if (daysOverdue <= 7) {
          // Within 1 week of overdue
          allowAttendance = true;
          requireTeacherApproval = false;
          warningMessage = `Fees overdue by ${daysOverdue} day(s). Balance: LKR ${feeStatus.balance?.toFixed(2)}`;
          showWarning = true;
        } else if (daysOverdue <= 14) {
          // 1-2 weeks overdue
          allowAttendance = false;
          requireTeacherApproval = true;
          warningMessage = `Fees overdue by ${daysOverdue} day(s). Teacher approval required`;
          showWarning = true;
        } else {
          // More than 2 weeks overdue
          allowAttendance = false;
          requireTeacherApproval = false;
          warningMessage = `Attendance blocked: Fees overdue by ${daysOverdue} days`;
          showWarning = true;
        }
      }
      
      return {
        ...feeStatus,
        allowAttendance,
        requireTeacherApproval,
        warningMessage,
        showWarning,
        isGracePeriodActive,
        daysOverdue,
        checkTimestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error in fee check for attendance:', error);
      
      // Fail-safe: allow attendance if check fails
      return {
        studentId,
        allowAttendance: true,
        requireTeacherApproval: false,
        warningMessage: 'Fee check failed - attendance allowed',
        showWarning: false,
        overallStatus: 'ERROR',
        isFallback: true,
        checkTimestamp: new Date().toISOString()
      };
    }
  }
};

// EXPORT EVERYTHING
export default {
  API_BASE_URL,
  checkBackendConnection,
  authAPI,
  studentAPI,
  classAPI,
  feeAPI,
  feePaymentAPI,
  attendanceAPI,
  attendanceFeeAPI, // NEW: Added for attendance fee checks
  scheduleAPI,
  sessionAPI,
  qrCodeAPI,
  dashboardAPI,
  debugAPI,
  apiGet,
  apiPost,
  apiPut,
  apiDelete
};