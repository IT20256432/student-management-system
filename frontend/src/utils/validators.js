export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone) => {
  const regex = /^(\+94|0)[1-9][0-9]{8}$/;
  return regex.test(phone.replace(/\s/g, ''));
};

export const validateName = (name) => {
  return /^[A-Za-z\s]+$/.test(name);
};

export const validateStudentForm = (formData) => {
  const errors = {};

  if (!formData.firstName?.trim()) {
    errors.firstName = 'First name is required';
  } else if (!validateName(formData.firstName)) {
    errors.firstName = 'First name should contain only letters';
  }

  if (!formData.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  } else if (!validateName(formData.lastName)) {
    errors.lastName = 'Last name should contain only letters';
  }

  if (!formData.gender) {
    errors.gender = 'Gender is required';
  }

  if (!formData.dob) {
    errors.dob = 'Date of birth is required';
  }

  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.phone) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(formData.phone)) {
    errors.phone = 'Please enter a valid Sri Lankan phone number';
  }

  if (!formData.address?.trim()) {
    errors.address = 'Address is required';
  }

  if (!formData.city?.trim()) {
    errors.city = 'City is required';
  }

  if (!formData.district) {
    errors.district = 'District is required';
  }

  if (formData.subjects?.length === 0) {
    errors.subjects = 'Please select at least one subject';
  }

  return errors;
};