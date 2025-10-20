// src/services/api.js
const API_BASE_URL = 'http://localhost:8080/api';

// Generic API handler
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Network response was not ok');
  }
  return response.json();
};

// Generic API methods
const apiGet = (url) => fetch(`${API_BASE_URL}${url}`).then(handleResponse);
const apiPost = (url, data) => 
  fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse);

const apiPut = (url, data) =>
  fetch(`${API_BASE_URL}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse);

const apiDelete = (url) =>
  fetch(`${API_BASE_URL}${url}`, {
    method: 'DELETE'
  }).then(handleResponse);

// Student API calls
export const studentAPI = {
  register: (studentData) => apiPost('/students/register', studentData),
  getAll: () => apiGet('/students'),
  getById: (id) => apiGet(`/students/${id}`),
  getByStudentId: (studentId) => apiGet(`/students/student-id/${studentId}`),
  update: (id, studentData) => apiPut(`/students/${id}`, studentData),
  delete: (id) => apiDelete(`/students/${id}`),
  getByGrade: (grade) => apiGet(`/students/grade/${grade}`),
  getByStatus: (status) => apiGet(`/students/status/${status}`),
  
  // NEW: Class-based student methods
  getByClass: (classId) => apiGet(`/students/class/${classId}`),
  getWithoutClass: () => apiGet('/students/unassigned'),
  updateClass: (studentId, classId) => 
    apiPut(`/students/${studentId}/class/${classId}`),
  getClassStatistics: (classId) => apiGet(`/students/class/${classId}/statistics`)
};

// Attendance API calls
export const attendanceAPI = {
  record: (attendanceData) => apiPost('/attendance/record', attendanceData),
  getByStudent: (studentId) => apiGet(`/attendance/student/${studentId}`),
  getByDate: (date) => apiGet(`/attendance/date/${date}`),
  getSummary: (studentId) => apiGet(`/attendance/student/${studentId}/summary`),
  recordManual: (studentId, date, status, sessionId = null) => {
    const params = new URLSearchParams({
      studentId,
      date,
      status,
      ...(sessionId && { sessionId })
    });
    return apiPost(`/attendance/manual?${params}`);
  },
  getInRange: (studentId, startDate, endDate) =>
    apiGet(`/attendance/range/${studentId}?startDate=${startDate}&endDate=${endDate}`),
  
  // NEW: Session-based attendance methods
  getBySession: (sessionId) => apiGet(`/attendance/session/${sessionId}`),
  getActiveSessions: () => apiGet('/attendance/sessions/active'),
  getToday: () => apiGet('/attendance/today')
};

// Class API calls
export const classAPI = {
  getAll: () => apiGet('/classes'),
  getAllActive: () => apiGet('/classes/active'),
  getByGrade: (grade) => apiGet(`/classes/grade/${grade}`),
  getById: (id) => apiGet(`/classes/${id}`),
  create: (classData) => apiPost('/classes', classData),
  update: (id, classData) => apiPut(`/classes/${id}`, classData),
  delete: (id) => apiDelete(`/classes/${id}`),
  deactivate: (id) => apiPut(`/classes/${id}/deactivate`),
  getStudentCount: (classId) => apiGet(`/classes/${classId}/student-count`)
};

// Schedule API calls
export const scheduleAPI = {
  getByClass: (classId) => apiGet(`/schedules/class/${classId}`),
  getTodayByClass: (classId) => apiGet(`/schedules/class/${classId}/today`),
  create: (scheduleData) => apiPost('/schedules', scheduleData),
  update: (id, scheduleData) => apiPut(`/schedules/${id}`, scheduleData),
  delete: (id) => apiDelete(`/schedules/${id}`)
};

// Attendance Session API calls
export const sessionAPI = {
  getActive: () => apiGet('/attendance/sessions/active'), // Changed from /api/attendance/sessions/active
  getByClassAndDate: (classId, date) => 
    apiGet(`/attendance/sessions/class/${classId}?date=${date}`),
  create: (sessionData) => apiPost('/attendance/sessions', sessionData),
  start: (sessionId) => apiPost(`/attendance/sessions/${sessionId}/start`),
  end: (sessionId) => apiPost(`/attendance/sessions/${sessionId}/end`),
  getToday: () => apiGet('/attendance/sessions/today')
};

// Export all APIs
export default {
  studentAPI,
  attendanceAPI,
  classAPI,
  scheduleAPI,
  sessionAPI
};