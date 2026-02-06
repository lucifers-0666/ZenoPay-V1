// User Edit Page JavaScript

// Sample User Data (would come from server in real app)
const userData = {
  id: 'USR-001',
  firstName: 'Rajesh',
  lastName: 'Kumar',
  email: 'rajesh.kumar@email.com',
  phone: '9876543210',
  countryCode: '+91',
  dob: '1990-03-15',
  gender: 'male',
  address1: '123, MG Road, Koramangala',
  address2: '',
  city: 'Bangalore',
  state: 'KA',
  pinCode: '560034',
  country: 'IN',
  accountStatus: 'active',
  statusReason: '',
  kycStatus: 'verified',
  verificationNotes: 'All documents verified successfully',
  verifiedDate: '2025-01-20',
  verifiedBy: 'Admin User',
  dailyLimit: 50000,
  monthlyLimit: 500000,
  maxSingleTransaction: 25000,
  dailyTransactionCount: 20,
  permissions: {
    canSendMoney: true,
    canReceiveMoney: true,
    canUseQR: true,
    canAddPaymentMethods: true,
    canRequestMoney: false,
    canAccessAPI: false
  },
  security: {
    twoFactorAuth: false,
    emailNotifications: true,
    smsNotifications: true
  },
  adminNotes: 'Regular user, no issues reported.',
  photoUrl: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=4F46E5&color=fff&size=100'
};

// State Management
let formState = {
  hasUnsavedChanges: false,
  isSubmitting: false,
  originalData: {},
  pendingNavigation: null
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadUserData();
  initializeEventListeners();
  setupFormChangeDetection();
  setupAutoSave();
});

// Load User Data into Form
function loadUserData() {
  // Update page header
  document.getElementById('userName').textContent = `${userData.firstName} ${userData.lastName}`;
  document.getElementById('userId').textContent = `#${userData.id}`;
  
  // Profile photo
  document.getElementById('profilePhoto').src = userData.photoUrl;
  
  // Personal Information
  document.getElementById('firstName').value = userData.firstName;
  document.getElementById('lastName').value = userData.lastName;
  document.getElementById('email').value = userData.email;
  document.getElementById('phone').value = userData.phone;
  document.getElementById('countryCode').value = userData.countryCode;
  document.getElementById('dob').value = userData.dob;
  document.getElementById('gender').value = userData.gender;
  document.getElementById('address1').value = userData.address1;
  document.getElementById('address2').value = userData.address2;
  document.getElementById('city').value = userData.city;
  document.getElementById('state').value = userData.state;
  document.getElementById('pinCode').value = userData.pinCode;
  document.getElementById('country').value = userData.country;
  
  // Account Status
  document.getElementById('accountStatus').value = userData.accountStatus;
  document.getElementById('statusReason').value = userData.statusReason;
  toggleStatusReasonField();
  
  // KYC Status
  document.getElementById('kycStatus').value = userData.kycStatus;
  document.getElementById('verificationNotes').value = userData.verificationNotes;
  document.getElementById('verifiedDate').value = userData.verifiedDate;
  document.getElementById('verifiedBy').value = userData.verifiedBy;
  
  // Account Limits
  document.getElementById('dailyLimit').value = userData.dailyLimit;
  document.getElementById('monthlyLimit').value = userData.monthlyLimit;
  document.getElementById('maxSingleTransaction').value = userData.maxSingleTransaction;
  document.getElementById('dailyTransactionCount').value = userData.dailyTransactionCount;
  
  // Permissions
  document.getElementById('canSendMoney').checked = userData.permissions.canSendMoney;
  document.getElementById('canReceiveMoney').checked = userData.permissions.canReceiveMoney;
  document.getElementById('canUseQR').checked = userData.permissions.canUseQR;
  document.getElementById('canAddPaymentMethods').checked = userData.permissions.canAddPaymentMethods;
  document.getElementById('canRequestMoney').checked = userData.permissions.canRequestMoney;
  document.getElementById('canAccessAPI').checked = userData.permissions.canAccessAPI;
  
  // Security Settings
  document.getElementById('twoFactorAuth').checked = userData.security.twoFactorAuth;
  document.getElementById('emailNotifications').checked = userData.security.emailNotifications;
  document.getElementById('smsNotifications').checked = userData.security.smsNotifications;
  
  // Admin Notes
  document.getElementById('adminNotes').value = userData.adminNotes;
  
  // Store original data for change detection
  formState.originalData = getFormData();
}

// Initialize Event Listeners
function initializeEventListeners() {
  // Top action buttons
  document.getElementById('backButton')?.addEventListener('click', handleBack);
  document.getElementById('cancelButton')?.addEventListener('click', handleCancel);
  document.getElementById('saveButton')?.addEventListener('click', handleSave);
  
  // Bottom action buttons
  document.getElementById('cancelBottomBtn')?.addEventListener('click', handleCancel);
  document.getElementById('saveDraftBtn')?.addEventListener('click', handleSaveDraft);
  document.getElementById('saveBottomBtn')?.addEventListener('click', handleSave);
  
  // Photo upload
  document.getElementById('uploadPhotoBtn')?.addEventListener('click', () => {
    document.getElementById('photoUpload').click();
  });
  document.getElementById('photoUpload')?.addEventListener('change', handlePhotoUpload);
  document.getElementById('removePhotoBtn')?.addEventListener('click', handlePhotoRemove);
  
  // Account status change
  document.getElementById('accountStatus')?.addEventListener('change', toggleStatusReasonField);
  
  // KYC status change
  document.getElementById('kycStatus')?.addEventListener('change', handleKycStatusChange);
  
  // Security actions
  document.getElementById('resetPasswordBtn')?.addEventListener('click', handleResetPassword);
  document.getElementById('forceLogoutBtn')?.addEventListener('click', handleForceLogout);
  
  // Modal actions
  document.getElementById('closeUnsavedModal')?.addEventListener('click', closeUnsavedModal);
  document.getElementById('stayOnPageBtn')?.addEventListener('click', closeUnsavedModal);
  document.getElementById('leavePageBtn')?.addEventListener('click', confirmLeave);
  
  // Toast close
  document.getElementById('toastClose')?.addEventListener('click', closeToast);
  
  // Form validation on blur
  const inputs = document.querySelectorAll('.form-input-edit, .form-textarea-edit');
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });
}

// Setup Form Change Detection
function setupFormChangeDetection() {
  const form = document.getElementById('userEditForm');
  form.addEventListener('input', () => {
    formState.hasUnsavedChanges = true;
  });
  
  // Warn before leaving page
  window.addEventListener('beforeunload', (e) => {
    if (formState.hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// Setup Auto Save (every 30 seconds)
function setupAutoSave() {
  setInterval(() => {
    if (formState.hasUnsavedChanges && !formState.isSubmitting) {
      saveDraft(true); // silent save
    }
  }, 30000);
}

// Get Form Data
function getFormData() {
  return {
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    countryCode: document.getElementById('countryCode').value,
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    address1: document.getElementById('address1').value.trim(),
    address2: document.getElementById('address2').value.trim(),
    city: document.getElementById('city').value.trim(),
    state: document.getElementById('state').value,
    pinCode: document.getElementById('pinCode').value.trim(),
    country: document.getElementById('country').value,
    accountStatus: document.getElementById('accountStatus').value,
    statusReason: document.getElementById('statusReason').value.trim(),
    kycStatus: document.getElementById('kycStatus').value,
    verificationNotes: document.getElementById('verificationNotes').value.trim(),
    verifiedDate: document.getElementById('verifiedDate').value,
    verifiedBy: document.getElementById('verifiedBy').value,
    dailyLimit: document.getElementById('dailyLimit').value,
    monthlyLimit: document.getElementById('monthlyLimit').value,
    maxSingleTransaction: document.getElementById('maxSingleTransaction').value,
    dailyTransactionCount: document.getElementById('dailyTransactionCount').value,
    permissions: {
      canSendMoney: document.getElementById('canSendMoney').checked,
      canReceiveMoney: document.getElementById('canReceiveMoney').checked,
      canUseQR: document.getElementById('canUseQR').checked,
      canAddPaymentMethods: document.getElementById('canAddPaymentMethods').checked,
      canRequestMoney: document.getElementById('canRequestMoney').checked,
      canAccessAPI: document.getElementById('canAccessAPI').checked
    },
    security: {
      twoFactorAuth: document.getElementById('twoFactorAuth').checked,
      emailNotifications: document.getElementById('emailNotifications').checked,
      smsNotifications: document.getElementById('smsNotifications').checked
    },
    adminNotes: document.getElementById('adminNotes').value.trim()
  };
}

// Validate Form
function validateForm() {
  let isValid = true;
  
  // Required fields
  const firstName = document.getElementById('firstName');
  if (!firstName.value.trim()) {
    showFieldError(firstName, 'First name is required');
    isValid = false;
  }
  
  const lastName = document.getElementById('lastName');
  if (!lastName.value.trim()) {
    showFieldError(lastName, 'Last name is required');
    isValid = false;
  }
  
  const email = document.getElementById('email');
  if (!email.value.trim()) {
    showFieldError(email, 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email.value)) {
    showFieldError(email, 'Please enter a valid email address');
    isValid = false;
  }
  
  const phone = document.getElementById('phone');
  if (!phone.value.trim()) {
    showFieldError(phone, 'Phone number is required');
    isValid = false;
  } else if (!isValidPhone(phone.value)) {
    showFieldError(phone, 'Please enter a valid 10-digit phone number');
    isValid = false;
  }
  
  // PIN code validation
  const pinCode = document.getElementById('pinCode');
  if (pinCode.value && !isValidPinCode(pinCode.value)) {
    showFieldError(pinCode, 'Please enter a valid 6-digit PIN code');
    isValid = false;
  }
  
  // Date of birth validation (18+ years)
  const dob = document.getElementById('dob');
  if (dob.value && !isValidAge(dob.value)) {
    showFieldError(dob, 'User must be at least 18 years old');
    isValid = false;
  }
  
  return isValid;
}

// Validate Single Field
function validateField(field) {
  const fieldId = field.id;
  
  if (fieldId === 'firstName' || fieldId === 'lastName') {
    if (!field.value.trim()) {
      showFieldError(field, 'This field is required');
      return false;
    }
  }
  
  if (fieldId === 'email') {
    if (!field.value.trim()) {
      showFieldError(field, 'Email is required');
      return false;
    } else if (!isValidEmail(field.value)) {
      showFieldError(field, 'Please enter a valid email address');
      return false;
    }
  }
  
  if (fieldId === 'phone') {
    if (!field.value.trim()) {
      showFieldError(field, 'Phone number is required');
      return false;
    } else if (!isValidPhone(field.value)) {
      showFieldError(field, 'Please enter a valid 10-digit phone number');
      return false;
    }
  }
  
  if (fieldId === 'pinCode' && field.value) {
    if (!isValidPinCode(field.value)) {
      showFieldError(field, 'Please enter a valid 6-digit PIN code');
      return false;
    }
  }
  
  if (fieldId === 'dob' && field.value) {
    if (!isValidAge(field.value)) {
      showFieldError(field, 'User must be at least 18 years old');
      return false;
    }
  }
  
  // If valid, add success state
  field.classList.remove('error');
  field.classList.add('success');
  return true;
}

// Validation Helper Functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

function isValidPinCode(pinCode) {
  const pinRegex = /^\d{6}$/;
  return pinRegex.test(pinCode);
}

function isValidAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
}

// Show Field Error
function showFieldError(field, message) {
  field.classList.add('error');
  field.classList.remove('success');
  const errorSpan = document.getElementById(`${field.id}-error`);
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.style.display = 'block';
  }
}

// Clear Field Error
function clearFieldError(field) {
  field.classList.remove('error');
  const errorSpan = document.getElementById(`${field.id}-error`);
  if (errorSpan) {
    errorSpan.textContent = '';
    errorSpan.style.display = 'none';
  }
}

// Toggle Status Reason Field
function toggleStatusReasonField() {
  const status = document.getElementById('accountStatus').value;
  const reasonField = document.getElementById('statusReasonField');
  
  if (status === 'suspended' || status === 'blocked') {
    reasonField.style.display = 'block';
  } else {
    reasonField.style.display = 'none';
  }
}

// Handle KYC Status Change
function handleKycStatusChange() {
  const kycStatus = document.getElementById('kycStatus').value;
  const verifiedDate = document.getElementById('verifiedDate');
  
  if (kycStatus === 'verified') {
    verifiedDate.value = new Date().toISOString().split('T')[0];
  } else {
    verifiedDate.value = '';
  }
}

// Handle Photo Upload
function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
    showToast('error', 'Please upload a JPG or PNG image');
    return;
  }
  
  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast('error', 'Image size must be less than 2MB');
    return;
  }
  
  // Preview image
  const reader = new FileReader();
  reader.onload = (event) => {
    document.getElementById('profilePhoto').src = event.target.result;
    formState.hasUnsavedChanges = true;
  };
  reader.readAsDataURL(file);
}

// Handle Photo Remove
function handlePhotoRemove() {
  if (confirm('Are you sure you want to remove the profile photo?')) {
    document.getElementById('profilePhoto').src = 'https://ui-avatars.com/api/?name=User&background=94A3B8&color=fff&size=100';
    document.getElementById('photoUpload').value = '';
    formState.hasUnsavedChanges = true;
  }
}

// Handle Save
function handleSave(e) {
  e.preventDefault();
  
  if (formState.isSubmitting) return;
  
  if (!validateForm()) {
    showToast('error', 'Please fix the errors before saving');
    return;
  }
  
  formState.isSubmitting = true;
  
  const formData = getFormData();
  
  // Simulate API call
  setTimeout(() => {
    console.log('Saving user data:', formData);
    formState.hasUnsavedChanges = false;
    formState.isSubmitting = false;
    showToast('success', 'User details updated successfully');
    
    // Redirect to user details page after 1 second
    setTimeout(() => {
      window.location.href = `/admin/users/${userData.id}`;
    }, 1000);
  }, 1000);
}

// Handle Save Draft
function handleSaveDraft() {
  saveDraft(false);
}

function saveDraft(silent = false) {
  const formData = getFormData();
  
  // Simulate API call
  console.log('Saving draft:', formData);
  
  if (!silent) {
    showToast('success', 'Draft saved successfully');
  }
  
  formState.hasUnsavedChanges = false;
}

// Handle Cancel
function handleCancel(e) {
  e.preventDefault();
  
  if (formState.hasUnsavedChanges) {
    formState.pendingNavigation = `/admin/users/${userData.id}`;
    showUnsavedModal();
  } else {
    window.location.href = `/admin/users/${userData.id}`;
  }
}

// Handle Back
function handleBack(e) {
  if (formState.hasUnsavedChanges) {
    e.preventDefault();
    formState.pendingNavigation = `/admin/users/${userData.id}`;
    showUnsavedModal();
  }
}

// Handle Reset Password
function handleResetPassword() {
  if (confirm(`Send password reset email to ${userData.email}?`)) {
    // Simulate API call
    console.log('Sending password reset email');
    showToast('success', 'Password reset email sent successfully');
  }
}

// Handle Force Logout
function handleForceLogout() {
  if (confirm(`Force logout ${userData.firstName} ${userData.lastName} from all devices?`)) {
    // Simulate API call
    console.log('Forcing user logout');
    showToast('success', 'User has been logged out from all devices');
  }
}

// Show Unsaved Changes Modal
function showUnsavedModal() {
  document.getElementById('unsavedChangesModal').style.display = 'flex';
}

// Close Unsaved Changes Modal
function closeUnsavedModal() {
  document.getElementById('unsavedChangesModal').style.display = 'none';
  formState.pendingNavigation = null;
}

// Confirm Leave
function confirmLeave() {
  formState.hasUnsavedChanges = false;
  if (formState.pendingNavigation) {
    window.location.href = formState.pendingNavigation;
  }
}

// Show Toast Notification
function showToast(type, message) {
  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');
  
  // Set icon based on type
  if (type === 'success') {
    toastIcon.innerHTML = `
      <svg class="icon-20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    `;
    toast.className = 'toast toast-success';
  } else {
    toastIcon.innerHTML = `
      <svg class="icon-20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    `;
    toast.className = 'toast toast-error';
  }
  
  toastMessage.textContent = message;
  toast.style.display = 'flex';
  
  // Auto dismiss success toasts after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      closeToast();
    }, 3000);
  }
}

// Close Toast
function closeToast() {
  document.getElementById('toast').style.display = 'none';
}
