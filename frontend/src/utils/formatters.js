export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  // Format: +94 XX XXX XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('94')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+94${cleaned.slice(1)}`;
  }
  return phone;
};

export const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};