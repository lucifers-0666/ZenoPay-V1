/**
 * Forms and Validation
 * Handle form validation and submission
 */

document.addEventListener('DOMContentLoaded', function() {
  initializeForms();
});

function initializeForms() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', validateForm);
    
    // Add real-time validation
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('blur', validateField);
      input.addEventListener('change', validateField);
    });
  });
}

/**
 * Validate form
 */
function validateForm(e) {
  let isValid = true;
  const form = e.target;
  
  const inputs = form.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    if (!validateField({ target: input })) {
      isValid = false;
    }
  });
  
  if (!isValid) {
    e.preventDefault();
    showNotification('Please fix the errors in the form', 'error');
  }
  
  return isValid;
}

/**
 * Validate individual field
 */
function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  let isValid = true;
  
  // Required validation
  if (field.hasAttribute('required') && !value) {
    setFieldError(field, 'This field is required');
    return false;
  }
  
  // Email validation
  if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setFieldError(field, 'Invalid email address');
      return false;
    }
  }
  
  // Phone validation
  if (field.type === 'tel' && value) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(value)) {
      setFieldError(field, 'Invalid phone number');
      return false;
    }
  }
  
  // Min length
  if (field.hasAttribute('minlength')) {
    const minLen = parseInt(field.getAttribute('minlength'));
    if (value.length < minLen) {
      setFieldError(field, `Minimum ${minLen} characters required`);
      return false;
    }
  }
  
  // Max length
  if (field.hasAttribute('maxlength')) {
    const maxLen = parseInt(field.getAttribute('maxlength'));
    if (value.length > maxLen) {
      setFieldError(field, `Maximum ${maxLen} characters allowed`);
      return false;
    }
  }
  
  clearFieldError(field);
  return true;
}

/**
 * Set field error
 */
function setFieldError(field, message) {
  field.classList.add('error');
  
  let errorElement = field.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains('form-error')) {
    errorElement = document.createElement('small');
    errorElement.className = 'form-error';
    field.parentNode.insertBefore(errorElement, field.nextSibling);
  }
  
  errorElement.textContent = message;
}

/**
 * Clear field error
 */
function clearFieldError(field) {
  field.classList.remove('error');
  
  const errorElement = field.nextElementSibling;
  if (errorElement && errorElement.classList.contains('form-error')) {
    errorElement.remove();
  }
}
