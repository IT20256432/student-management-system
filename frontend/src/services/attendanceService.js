import { api } from './api';

export const attendanceService = {
  record: (attendanceData) => api.post('/attendance/record', attendanceData),
  getByStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
  getByDate: (date) => api.get(`/attendance/date/${date}`),
  getSummary: (studentId) => api.get(`/attendance/summary/${studentId}`),
  recordManual: (studentId, date, status) => 
    api.post(`/attendance/manual?studentId=${studentId}&date=${date}&status=${status}`),
  getInRange: (studentId, startDate, endDate) =>
    api.get(`/attendance/range/${studentId}?startDate=${startDate}&endDate=${endDate}`)
};