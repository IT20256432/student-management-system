import { useState, useEffect } from 'react';
import { studentAPI } from '../services/api';

export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentAPI.getAll();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  return {
    students,
    loading,
    error,
    loadStudents
  };
};