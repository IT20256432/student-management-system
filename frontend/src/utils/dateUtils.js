// src/utils/dateUtils.js
export const formatDateForComparison = (dateString) => {
  if (!dateString) return null;
  
  // Handle '2025-12-29 10:09:27.573040' format
  if (typeof dateString === 'string' && dateString.includes(' ')) {
    return dateString.split(' ')[0]; // Returns '2025-12-29'
  }
  
  // Handle ISO format '2025-12-29T10:09:27.573Z'
  if (typeof dateString === 'string' && dateString.includes('T')) {
    return dateString.split('T')[0]; // Returns '2025-12-29'
  }
  
  // Handle Date object
  if (dateString instanceof Date) {
    return dateString.toISOString().split('T')[0];
  }
  
  // Assume it's already in YYYY-MM-DD format
  return dateString;
};

export const parsePaymentDate = (payment) => {
  if (!payment.paymentDate) return null;
  
  const dateStr = formatDateForComparison(payment.paymentDate);
  
  if (!dateStr) return null;
  
  // Ensure it's in YYYY-MM-DD format
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr;
};