import { api } from './api';

export const studentService = {
  register: (studentData) => api.post('/students/register', studentData),
  getAll: () => api.get('/students'),
  getById: (id) => api.get(`/students/${id}`),
  getByStudentId: (studentId) => api.get(`/students/studentId/${studentId}`),
  update: (id, studentData) => api.put(`/students/${id}`, studentData),
  delete: (id) => api.delete(`/students/${id}`),
  getByGrade: (grade) => api.get(`/students/grade/${grade}`),
  getByStatus: (status) => api.get(`/students/status/${status}`)
};