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
  getAllClasses: () => apiGet('/classes'),
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
                'Accept': 'application/pdf', 
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
  
  getReceiptBase64: async (paymentId) => {
  try {
    console.log(`📄 Fetching receipt base64 for payment: ${paymentId}`);
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const response = await fetch(
      `${API_BASE_URL}/fee-payments/receipt/${paymentId}/base64`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,  // ✅ ADD THIS
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      }
    );
    
    console.log('📄 Response status:', response.status);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        errorMessage = errorText || errorMessage;
      } catch (e) {
        // Ignore
      }
      throw new Error(`Failed to get receipt data: ${errorMessage}`);
    }
    
    const data = await response.json();
    console.log('✅ Receipt data fetched successfully');
    return data;
    
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
  
  getFeeStatusForClass: async (studentId, classId) => {
  console.log(`📊 [DEBUG] Getting ACTUAL fee status for student ${studentId}, class ${classId}`);
  
  try {
    // Try to get class-specific payments first
    console.log('📊 [DEBUG] Step 1: Getting class-specific payments...');
    const classPayments = await feePaymentAPI.getStudentPaymentsForClass(studentId, classId);
    console.log('📊 [DEBUG] Class payments found:', classPayments.length);
    
    // Calculate total paid for this specific class
    const totalPaid = classPayments.reduce((sum, payment) => {
      return sum + (payment.amountPaid || 0);
    }, 0);
    
    console.log('📊 [DEBUG] Total paid for class', classId, ':', totalPaid);
    
    // Get fee structure for this specific class
    console.log('📊 [DEBUG] Step 2: Getting fee structure for class', classId);
    let feeStructure;
    try {
      feeStructure = await feeAPI.getByClass(classId);
      console.log('📊 [DEBUG] Fee structure found:', feeStructure);
    } catch (feeError) {
      console.log('📊 [DEBUG] Using fallback fee structure');
      // Get fallback based on class grade
      const classInfo = await classAPI.getById(classId).catch(() => ({ grade: 'A/L' }));
      const fallbackFees = {
        'A/L': { totalFee: 10500 },
        'O/L': { totalFee: 8000 }
      };
      feeStructure = { totalFee: fallbackFees[classInfo.grade]?.totalFee || 8000 };
    }
    
    const totalDue = feeStructure.totalFee || 8000;
    const balance = totalDue - totalPaid;
    
    // Determine status
    let overallStatus;
    let paymentStatus;
    
    if (balance <= 0) {
      overallStatus = 'PAID';
      paymentStatus = 'COMPLETE';
    } else if (totalPaid > 0) {
      overallStatus = 'PARTIAL';
      paymentStatus = 'IN_PROGRESS';
    } else {
      const today = new Date();
      const currentDay = today.getDate();
      if (currentDay <= 14) {
        overallStatus = 'PENDING';
        paymentStatus = 'GRACE_PERIOD';
      } else {
        overallStatus = 'OVERDUE';
        paymentStatus = 'UNPAID';
      }
    }
    
    // Get student and class info
    const student = await studentAPI.getByStudentId(studentId).catch(() => null);
    const classInfo = await classAPI.getById(classId).catch(() => null);
    
    const feeStatus = {
      studentId,
      studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
      className: classInfo ? classInfo.className : `Class ${classId}`,
      classId,
      totalDue,
      totalPaid,
      balance,
      overallStatus,
      paymentStatus,
      daysOverdue: overallStatus === 'OVERDUE' ? Math.max(0, new Date().getDate() - 15) : 0,
      gracePeriodActive: new Date().getDate() <= 14,
      gracePeriodEnds: new Date().getDate() <= 14 ? 14 - new Date().getDate() : 0,
      nextDueDate: new Date().getDate() <= 14 
        ? new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split('T')[0]
        : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
      isCalculated: true,
      debug: {
        classPaymentsCount: classPayments.length,
        totalPaidCalculated: totalPaid,
        feeStructureUsed: feeStructure.totalFee,
        balanceCalculated: balance
      }
    };
    
    console.log('📊 [DEBUG] Calculated fee status:', feeStatus);
    return feeStatus;
    
  } catch (error) {
    console.error('❌ [DEBUG] Error calculating class-specific fee status:', error);
    
    // Fallback: Use the general endpoint
    try {
      console.log('📊 [DEBUG] Using general fee status as fallback');
      const generalStatus = await feePaymentAPI.getFeeStatus(studentId);
      
      // Adapt it for the specific class
      const adaptedStatus = {
        ...generalStatus,
        classId: classId,
        className: 'Unknown Class', // We'll try to get the actual name
        isAdapted: true,
        debugNote: 'Adapted from general status'
      };
      
      // Try to get actual class name
      try {
        const classInfo = await classAPI.getById(classId);
        if (classInfo) {
          adaptedStatus.className = classInfo.className;
          
          // Try to get actual payments for this class
          const classPayments = await feePaymentAPI.getStudentPaymentsForClass(studentId, classId);
          if (classPayments && classPayments.length > 0) {
            const totalPaid = classPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
            adaptedStatus.totalPaid = totalPaid;
            adaptedStatus.balance = adaptedStatus.totalDue - totalPaid;
            
            // Recalculate status
            if (adaptedStatus.balance <= 0) {
              adaptedStatus.overallStatus = 'PAID';
            } else if (totalPaid > 0) {
              adaptedStatus.overallStatus = 'PARTIAL';
            } else {
              const today = new Date();
              const currentDay = today.getDate();
              adaptedStatus.overallStatus = currentDay <= 14 ? 'PENDING' : 'OVERDUE';
            }
          }
        }
      } catch (e) {
        console.log('Could not enhance adapted status:', e.message);
      }
      
      return adaptedStatus;
      
    } catch (generalError) {
      console.error('❌ [DEBUG] General status also failed:', generalError);
      
      // Ultimate fallback
      const today = new Date();
      const currentDay = today.getDate();
      const isGracePeriodActive = currentDay <= 14;
      
      return {
        studentId,
        studentName: 'Unknown',
        className: 'Unknown Class',
        classId,
        totalDue: 8000,
        totalPaid: 0, // IMPORTANT: Set to 0
        balance: 8000, // IMPORTANT: Balance should equal total due
        overallStatus: isGracePeriodActive ? 'PENDING' : 'OVERDUE',
        paymentStatus: isGracePeriodActive ? 'GRACE_PERIOD' : 'UNPAID',
        daysOverdue: isGracePeriodActive ? 0 : currentDay - 15,
        gracePeriodActive: isGracePeriodActive,
        gracePeriodEnds: isGracePeriodActive ? 14 - currentDay : 0,
        nextDueDate: isGracePeriodActive 
          ? new Date(today.getFullYear(), today.getMonth(), 15).toISOString().split('T')[0]
          : new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0],
        isFallback: true,
        debugNote: 'Ultimate fallback - assuming NO payments'
      };
    }
  }
},
  
  getStudentPaymentsForClass: async (studentId, classId) => {
  console.log(`💰 [IMPROVED] Searching payments for student ${studentId}, class ${classId}`);
  
  try {
    // Method 1: Try the general payments endpoint
    console.log('💰 Method 1: Trying general payments endpoint...');
    try {
      const allPayments = await apiGet(`/fee-payments/student/${encodeURIComponent(studentId)}`);
      
      if (Array.isArray(allPayments)) {
        // Filter by class ID (check multiple possible field names)
        const filteredPayments = allPayments.filter(payment => {
          // Check all possible class ID fields
          const paymentClassId = 
            payment.classId || 
            payment.class_id || 
            payment.schoolClass?.id ||
            payment.schoolClassId ||
            payment.feeStructure?.schoolClass?.id;
          
          return paymentClassId == classId; // Use == for type coercion
        });
        
        console.log(`💰 Found ${filteredPayments.length} payments via general endpoint`);
        return filteredPayments;
      }
    } catch (error1) {
      console.log('💰 Method 1 failed:', error1.message);
    }
    
    // Method 2: Try recent payments endpoint
    console.log('💰 Method 2: Trying recent payments endpoint...');
    try {
      const recentPayments = await feePaymentAPI.getRecentPayments();
      
      if (Array.isArray(recentPayments)) {
        // Filter for this student and class
        const studentRecentPayments = recentPayments.filter(payment => 
          payment.studentId === studentId && 
          (payment.classId == classId || payment.schoolClass?.id == classId)
        );
        
        console.log(`💰 Found ${studentRecentPayments.length} recent payments`);
        return studentRecentPayments;
      }
    } catch (error2) {
      console.log('💰 Method 2 failed:', error2.message);
    }
    
    // Method 3: Try payments by date range (last 30 days)
    console.log('💰 Method 3: Trying payments by date range...');
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const dateRangePayments = await feePaymentAPI.getPaymentsByDateRange(startDate, endDate);
      
      if (Array.isArray(dateRangePayments)) {
        const filteredPayments = dateRangePayments.filter(payment => 
          payment.studentId === studentId && 
          (payment.classId == classId || payment.schoolClass?.id == classId)
        );
        
        console.log(`💰 Found ${filteredPayments.length} payments via date range`);
        return filteredPayments;
      }
    } catch (error3) {
      console.log('💰 Method 3 failed:', error3.message);
    }
    
    console.log('💰 No payments found through any method');
    return [];
    
  } catch (error) {
    console.error('💰 Error in getStudentPaymentsForClass:', error);
    return [];
  }
},

// Add this new function to api.js
checkPaymentExistsDirect: async (studentId, classId, month) => {
  console.log(`🔍 [DIRECT CHECK] Checking if payment exists:`, { studentId, classId, month });
  
  try {
    // Try multiple endpoint variations
    const endpoints = [
      `/fee-payments/student/${encodeURIComponent(studentId)}/exists?classId=${classId}&month=${month}`,
      `/fee-payments/exists?studentId=${encodeURIComponent(studentId)}&classId=${classId}&month=${month}`,
      `/fee-payments/check?studentId=${encodeURIComponent(studentId)}&classId=${classId}&month=${month}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await apiGet(endpoint);
        console.log(`🔍 Endpoint ${endpoint} responded:`, response);
        return response.exists || response.paymentExists || false;
      } catch (endpointError) {
        continue; // Try next endpoint
      }
    }
    
    // If no endpoint works, check via payments list
    const payments = await feePaymentAPI.getStudentPaymentsForClass(studentId, classId);
    const paymentExists = payments.some(payment => payment.month === month);
    
    console.log(`🔍 Payment exists check via list: ${paymentExists}`);
    return paymentExists;
    
  } catch (error) {
    console.error('🔍 Error checking payment existence:', error);
    return false;
  }
},

getOverdueStudents: () => apiGet('/fee-payments/overdue'),
  getFeeStatistics: () => apiGet('/fee-payments/statistics'),
  getRecentPayments: () => apiGet('/fee-payments/recent'),

getStudentPaymentsForClassAndMonth: async (studentId, classId, month) => {
  try {
    const payments = await feePaymentAPI.getStudentPaymentsForClass(studentId, classId);
    return payments.filter(payment => payment.month === month);
  } catch (error) {
    console.error('Error filtering payments by month:', error);
    return [];
  }
},

getPaymentsByDateRange: (startDate, endDate) => {
    return apiGet(`/fee-payments/by-date-range?startDate=${startDate}&endDate=${endDate}`);
},

getDailySummary: (date = null) => {
    let url = '/fee-payments/daily-summary';
    if (date) {
        url += `?date=${date}`;
    }
    return apiGet(url);
},

// Simple method for teacher daily settlement (no complex entities needed)
recordDailyCollection: async (collectionData) => {
    // Use existing recordPayment but add teacher info
    const paymentData = {
        ...collectionData,
        transactionId: `DAILY-${Date.now()}-${collectionData.teacherId}`
    };
    return apiPost('/fee-payments/record', paymentData);
}


};

// Add this debug function to check auth status
export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('🔑 Current token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.error('❌ No token in localStorage');
      return { hasToken: false };
    }
    
    // Try to validate the token
    try {
      const response = await apiGet('/auth/validate');
      console.log('✅ Token is valid:', response);
      return { hasToken: true, isValid: true, user: response };
    } catch (validateError) {
      console.error('❌ Token validation failed:', validateError.message);
      return { hasToken: true, isValid: false };
    }
    
  } catch (error) {
    console.error('❌ Auth check error:', error);
    return { hasToken: false, error: error.message };
  }
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

export const scheduleAPI = {
  getByClass: (classId) => {
    console.log(`📅 Fetching schedules for class: ${classId}`);
    return apiGet(`/schedules/class/${classId}`).catch(error => {
      console.warn(`⚠️ getByClass failed for ${classId}:`, error.message);
      // Return empty array instead of throwing
      return [];
    });
  },
  
  getTodayByClass: (classId) => {
    console.log(`📅 Fetching today's schedules for class: ${classId}`);
    return apiGet(`/schedules/class/${classId}/today`).catch(error => {
      console.warn(`⚠️ getTodayByClass failed for ${classId}:`, error.message);
      return [];
    });
  },
  
  create: (scheduleData) => apiPost('/schedules', scheduleData),
  update: (id, scheduleData) => apiPut(`/schedules/${id}`, scheduleData),
  delete: (id) => apiDelete(`/schedules/${id}`),
  
  getSchedulesByClassAndDate: async (classId, date) => {
    try {
      console.log(`📅 Fetching schedules for class ${classId} on ${date}`);
      const response = await fetch(`${API_BASE_URL}/schedules/class/${classId}?date=${date}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      
      // Handle HTML responses
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        console.warn('⚠️ API returned HTML instead of JSON');
        return [];
      }
      
      if (!response.ok) {
        console.warn(`⚠️ API returned status ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('getSchedulesByClassAndDate error:', error);
      return [];
    }
  },
  
  getSchedulesByClass: async (classId) => {
    try {
      console.log(`📅 Fetching all schedules for class: ${classId}`);
      
      // Try the main endpoint
      try {
        const response = await fetch(`${API_BASE_URL}/schedules/class/${classId}`, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        
        // Check if response is HTML
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          console.warn('⚠️ Main schedule endpoint returned HTML');
          throw new Error('HTML response');
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Loaded ${data.length} schedules for class ${classId}`);
          return data;
        }
      } catch (mainError) {
        console.warn('Main schedule endpoint failed, trying alternative...');
      }
      
      // Try alternative endpoints
      const alternativeEndpoints = [
        `/api/schedules/class/${classId}`,
        `/api/class-schedules/${classId}`,
        `/api/timetable/class/${classId}`
      ];
      
      for (const endpoint of alternativeEndpoints) {
        try {
          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getAuthHeaders(),
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Loaded schedules from alternative endpoint: ${endpoint}`);
            return data;
          }
        } catch (error) {
          continue; // Try next endpoint
        }
      }
      
      // If all endpoints fail, return empty array
      console.warn(`❌ No schedule endpoints worked for class ${classId}`);
      return [];
      
    } catch (error) {
      console.error('getSchedulesByClass error:', error);
      return []; // Return empty array instead of throwing
    }
  },
  
  // Fallback method to get schedules if API is not available
  getFallbackSchedules: (classId) => {
    console.log(`📅 Using fallback schedules for class: ${classId}`);
    
    // Return a default weekly schedule
    const defaultSchedules = [
      { id: 1, dayOfWeek: 'MONDAY', subject: 'Mathematics', startTime: '08:30', endTime: '09:30' },
      { id: 2, dayOfWeek: 'MONDAY', subject: 'Science', startTime: '09:45', endTime: '10:45' },
      { id: 3, dayOfWeek: 'MONDAY', subject: 'English', startTime: '11:00', endTime: '12:00' },
      { id: 4, dayOfWeek: 'TUESDAY', subject: 'Mathematics', startTime: '08:30', endTime: '09:30' },
      { id: 5, dayOfWeek: 'TUESDAY', subject: 'Sinhala', startTime: '09:45', endTime: '10:45' },
      { id: 6, dayOfWeek: 'TUESDAY', subject: 'History', startTime: '11:00', endTime: '12:00' },
      { id: 7, dayOfWeek: 'WEDNESDAY', subject: 'Science', startTime: '08:30', endTime: '09:30' },
      { id: 8, dayOfWeek: 'WEDNESDAY', subject: 'English', startTime: '09:45', endTime: '10:45' },
      { id: 9, dayOfWeek: 'WEDNESDAY', subject: 'ICT', startTime: '11:00', endTime: '12:00' },
      { id: 10, dayOfWeek: 'THURSDAY', subject: 'Mathematics', startTime: '08:30', endTime: '09:30' },
      { id: 11, dayOfWeek: 'THURSDAY', subject: 'Science', startTime: '09:45', endTime: '10:45' },
      { id: 12, dayOfWeek: 'THURSDAY', subject: 'English', startTime: '11:00', endTime: '12:00' },
      { id: 13, dayOfWeek: 'FRIDAY', subject: 'Revision', startTime: '08:30', endTime: '09:30' },
      { id: 14, dayOfWeek: 'FRIDAY', subject: 'Tests', startTime: '09:45', endTime: '10:45' },
      { id: 15, dayOfWeek: 'FRIDAY', subject: 'Study Hall', startTime: '11:00', endTime: '12:00' }
    ];
    
    // Filter by classId if needed (for simulation)
    const classSpecificSchedules = defaultSchedules.map(schedule => ({
      ...schedule,
      classId: classId,
      schoolClass: { id: classId }
    }));
    
    return Promise.resolve(classSpecificSchedules);
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