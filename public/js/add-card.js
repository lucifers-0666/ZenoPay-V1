// Card brand detection and logos
const cardBrands = {
  visa: {
    pattern: /^4/,
    logo: '<svg width="50" height="32" viewBox="0 0 50 32"><text x="0" y="24" fill="white" font-family="Arial" font-weight="bold" font-size="20">VISA</text></svg>',
    icon: 'fab fa-cc-visa'
  },
  mastercard: {
    pattern: /^5[1-5]/,
    logo: '<svg width="50" height="32" viewBox="0 0 50 32"><circle cx="15" cy="16" r="12" fill="#eb001b"/><circle cx="35" cy="16" r="12" fill="#f79e1b" opacity="0.8"/></svg>',
    icon: 'fab fa-cc-mastercard'
  },
  amex: {
    pattern: /^3[47]/,
    logo: '<svg width="50" height="32" viewBox="0 0 50 32"><text x="0" y="24" fill="white" font-family="Arial" font-weight="bold" font-size="18">AMEX</text></svg>',
    icon: 'fab fa-cc-amex'
  },
  discover: {
    pattern: /^6(?:011|5)/,
    logo: '<svg width="60" height="32" viewBox="0 0 60 32"><text x="0" y="24" fill="white" font-family="Arial" font-weight="bold" font-size="16">DISCOVER</text></svg>',
    icon: 'fab fa-cc-discover'
  }
};

// DOM Elements
const cardNumberInput = document.getElementById('card-number');
const cardholderNameInput = document.getElementById('cardholder-name');
const expiryMonthSelect = document.getElementById('expiry-month');
const expiryYearSelect = document.getElementById('expiry-year');
const cvvInput = document.getElementById('cvv');
const card3D = document.getElementById('card-3d');
const cardNumberDisplay = document.getElementById('card-number-display');
const cardholderDisplay = document.getElementById('cardholder-display');
const expiryDisplay = document.getElementById('expiry-display');
const cvvDisplay = document.getElementById('cvv-display');
const brandLogo = document.getElementById('brand-logo');
const brandIcon = document.getElementById('brand-icon');
const cardNumberError = document.getElementById('card-number-error');
const form = document.getElementById('add-card-form');
const submitBtn = document.getElementById('submit-btn');
const toast = document.getElementById('toast');

// Populate year options
function populateYears() {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear % 100;
  
  for (let i = 0; i < 15; i++) {
    const year = yearSuffix + i;
    const option = document.createElement('option');
    option.value = year.toString().padStart(2, '0');
    option.textContent = year.toString().padStart(2, '0');
    expiryYearSelect.appendChild(option);
  }
}

// Detect card brand
function detectCardBrand(number) {
  const cleanNumber = number.replace(/\s/g, '');
  
  for (const [brand, data] of Object.entries(cardBrands)) {
    if (data.pattern.test(cleanNumber)) {
      return brand;
    }
  }
  
  return null;
}

// Format card number
function formatCardNumber(value) {
  const cleanValue = value.replace(/\s/g, '');
  const groups = cleanValue.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

// Luhn algorithm validation
function validateLuhn(number) {
  const cleanNumber = number.replace(/\s/g, '');
  
  if (!/^\d+$/.test(cleanNumber)) return false;
  if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

// Update card number display
function updateCardNumberDisplay(value) {
  const formatted = formatCardNumber(value || '');
  const groups = formatted.split(' ');
  
  const displays = cardNumberDisplay.querySelectorAll('.digit-group');
  displays.forEach((display, index) => {
    if (groups[index]) {
      display.textContent = groups[index];
    } else {
      display.textContent = '••••';
    }
  });
}

// Update brand display
function updateBrand(brand) {
  if (brand && cardBrands[brand]) {
    card3D.setAttribute('data-brand', brand);
    brandLogo.innerHTML = cardBrands[brand].logo;
    brandIcon.innerHTML = `<i class="${cardBrands[brand].icon}"></i>`;
    brandIcon.classList.add('visible');
  } else {
    card3D.removeAttribute('data-brand');
    brandLogo.innerHTML = '';
    brandIcon.innerHTML = '';
    brandIcon.classList.remove('visible');
  }
}

// Validate card number
function validateCardNumber(value) {
  const cleanValue = value.replace(/\s/g, '');
  
  if (!cleanValue) {
    cardNumberError.textContent = '';
    cardNumberError.classList.remove('visible');
    cardNumberInput.classList.remove('error', 'success');
    return false;
  }
  
  if (cleanValue.length < 13) {
    cardNumberError.textContent = 'Card number is too short';
    cardNumberError.classList.add('visible');
    cardNumberInput.classList.add('error');
    cardNumberInput.classList.remove('success');
    return false;
  }
  
  if (!validateLuhn(cleanValue)) {
    cardNumberError.textContent = 'Invalid card number';
    cardNumberError.classList.add('visible');
    cardNumberInput.classList.add('error');
    cardNumberInput.classList.remove('success');
    return false;
  }
  
  cardNumberError.textContent = '';
  cardNumberError.classList.remove('visible');
  cardNumberInput.classList.remove('error');
  cardNumberInput.classList.add('success');
  return true;
}

// Show toast notification
function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  
  setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

// Event Listeners
cardNumberInput.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\s/g, '');
  
  // Only allow digits
  value = value.replace(/\D/g, '');
  
  // Limit to 19 digits
  if (value.length > 19) {
    value = value.slice(0, 19);
  }
  
  e.target.value = formatCardNumber(value);
  updateCardNumberDisplay(value);
  
  const brand = detectCardBrand(value);
  updateBrand(brand);
  
  // Validate on blur or when complete
  if (value.length >= 13) {
    validateCardNumber(value);
  } else {
    cardNumberError.classList.remove('visible');
    cardNumberInput.classList.remove('error', 'success');
  }
});

cardNumberInput.addEventListener('blur', () => {
  const value = cardNumberInput.value.replace(/\s/g, '');
  if (value) {
    validateCardNumber(value);
  }
});

cardholderNameInput.addEventListener('input', (e) => {
  const value = e.target.value.toUpperCase();
  e.target.value = value;
  cardholderDisplay.textContent = value || 'YOUR NAME';
});

expiryMonthSelect.addEventListener('change', updateExpiryDisplay);
expiryYearSelect.addEventListener('change', updateExpiryDisplay);

function updateExpiryDisplay() {
  const month = expiryMonthSelect.value;
  const year = expiryYearSelect.value;
  
  if (month && year) {
    expiryDisplay.textContent = `${month}/${year}`;
  } else {
    expiryDisplay.textContent = 'MM/YY';
  }
}

cvvInput.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  
  // Limit to 4 digits (Amex can have 4)
  if (value.length > 4) {
    value = value.slice(0, 4);
  }
  
  e.target.value = value;
  cvvDisplay.textContent = value ? value : '•••';
});

// Flip card on CVV focus
cvvInput.addEventListener('focus', () => {
  card3D.classList.add('flipped');
});

cvvInput.addEventListener('blur', () => {
  card3D.classList.remove('flipped');
});

// Form validation and submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validate card number
  const cardNumber = cardNumberInput.value.replace(/\s/g, '');
  if (!validateCardNumber(cardNumber)) {
    showToast('Please enter a valid card number', 'error');
    cardNumberInput.focus();
    return;
  }
  
  // Validate cardholder name
  if (!cardholderNameInput.value.trim()) {
    showToast('Please enter cardholder name', 'error');
    cardholderNameInput.focus();
    return;
  }
  
  // Validate expiry
  const month = expiryMonthSelect.value;
  const year = expiryYearSelect.value;
  
  if (!month || !year) {
    showToast('Please select expiry date', 'error');
    return;
  }
  
  // Check if card is expired
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  const expiryYearNum = parseInt(year);
  const expiryMonthNum = parseInt(month);
  
  if (expiryYearNum < currentYear || (expiryYearNum === currentYear && expiryMonthNum < currentMonth)) {
    showToast('Card has expired', 'error');
    return;
  }
  
  // Validate CVV
  if (!cvvInput.value || cvvInput.value.length < 3) {
    showToast('Please enter a valid CVV', 'error');
    cvvInput.focus();
    return;
  }
  
  // Disable submit button
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding Card...';
  
  try {
    const formData = {
      cardNumber: cardNumber,
      cardholderName: cardholderNameInput.value.trim(),
      expiryMonth: month,
      expiryYear: year,
      cvv: cvvInput.value,
      billingAddress: {
        addressLine1: document.getElementById('address-line1').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        zipCode: document.getElementById('zip-code').value.trim(),
        country: document.getElementById('country').value
      },
      saveForFuture: document.getElementById('save-for-future').checked,
      setAsDefault: document.getElementById('set-as-default').checked
    };
    
    const response = await fetch('/add-card', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Card added successfully!', 'success');
      
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = '/payment-methods';
      }, 1500);
    } else {
      throw new Error(data.message || 'Failed to add card');
    }
  } catch (error) {
    console.error('Error adding card:', error);
    showToast(error.message || 'Failed to add card. Please try again.', 'error');
    
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-credit-card"></i> Add Card';
  }
});

// Initialize
populateYears();
