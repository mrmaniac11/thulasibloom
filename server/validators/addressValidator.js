const validateAddress = (addressData) => {
  const errors = {};
  
  if (!addressData.addressLine1 || !addressData.addressLine1.trim()) {
    errors.addressLine1 = 'Address Line 1 is required';
  }
  
  if (!addressData.city || !addressData.city.trim()) {
    errors.city = 'City is required';
  }
  
  if (!addressData.state || !addressData.state.trim()) {
    errors.state = 'Please select a state';
  }
  
  if (!addressData.pincode || !addressData.pincode.trim()) {
    errors.pincode = 'Pincode is required';
  } else if (!/^[0-9]{6}$/.test(addressData.pincode)) {
    errors.pincode = 'Pincode must be 6 digits';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = { validateAddress };