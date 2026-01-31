/* ====================================
   ZenoPay Send Money JavaScript
   Handle form interactions and AJAX
   ==================================== */

// Constants
const DAILY_LIMIT = 50000;
const TRANSACTION_FEE_THRESHOLD = 10000;
const TRANSACTION_FEE_RATE = 0.02; // 2%

// State
let todayTransactions = 0;
let todayAmount = 0;
let selectedAccount = null;
let verifiedReceiver = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeAccountSelection();
  initializeFormHandlers();
  initializeQuickAmounts();
  initializeCharacterCounter();
  loadTodayStats();
});

// ====================================
// ACCOUNT SELECTION
// ====================================
function initializeAccountSelection() {
  const accountRadios = document.querySelectorAll('.account-radio');
  const accountCards = document.querySelectorAll('.account-card');

  accountRadios.forEach((radio, index) => {
    radio.addEventListener('change', function() {
      // Remove selected class from all cards
      accountCards.forEach(card => card.classList.remove('selected'));
      
      // Add selected class to checked card
      if (this.checked) {
        this.closest('.account-card').classList.add('selected');
        selectedAccount = this.value;
        console.log('Selected account:', selectedAccount);
      }
    });

    // Set initial selected account
    if (index === 0 && radio.checked) {
      selectedAccount = radio.value;
    }
  });

  // Make entire card clickable
  accountCards.forEach(card => {
    card.addEventListener('click', function(e) {
      if (e.target.tagName !== 'INPUT') {
        const radio = this.querySelector('.account-radio');
        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event('change'));
        }
      }
    });
  });
}

// ====================================
// FORM HANDLERS
// ====================================
function initializeFormHandlers() {
  const form = document.getElementById('sendMoneyForm');
  const verifyBtn = document.getElementById('verifyReceiverBtn');
  const amountInput = document.getElementById('amount');

  // Verify Receiver
  if (verifyBtn) {
    verifyBtn.addEventListener('click', verifyReceiver);
  }

  // Amount Input - Update Summary
  if (amountInput) {
    amountInput.addEventListener('input', updateTransactionSummary);
  }

  // Form Submit
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }
}

// Verify Receiver Function
async function verifyReceiver() {
  const receiverInput = document.getElementById('receiverId');
  const verifyBtn = document.getElementById('verifyReceiverBtn');
  const verifiedCard = document.getElementById('receiverVerifiedCard');
  const receiverId = receiverInput.value.trim();

  if (!receiverId) {
    showError(receiverInput, 'Please enter a receiver ID, email, or mobile number');
    return;
  }

  // Show loading state
  verifyBtn.classList.add('loading');
  verifyBtn.disabled = true;

  try {
    // Make API call to verify receiver
    const response = await fetch('/api/verify-receiver', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receiverId })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Show success
      verifiedReceiver = data.receiver;
      document.getElementById('verifiedName').textContent = data.receiver.Name || data.receiver.name;
      document.getElementById('verifiedId').textContent = data.receiver.ZenoPayID || data.receiver.zenoPayId;
      
      verifiedCard.style.display = 'flex';
      receiverInput.classList.add('success');
      receiverInput.disabled = true;
      verifyBtn.style.display = 'none';
      
      showToast('Receiver verified successfully!', 'success');
    } else {
      showError(receiverInput, data.message || 'Receiver not found');
      showToast(data.message || 'Receiver not found', 'error');
    }
  } catch (error) {
    console.error('Error verifying receiver:', error);
    showError(receiverInput, 'Failed to verify receiver. Please try again.');
    showToast('Failed to verify receiver', 'error');
  } finally {
    verifyBtn.classList.remove('loading');
    verifyBtn.disabled = false;
  }
}

// Update Transaction Summary
function updateTransactionSummary() {
  const amountInput = document.getElementById('amount');
  const amount = parseFloat(amountInput.value) || 0;

  // Calculate charges
  let charges = 0;
  if (amount > TRANSACTION_FEE_THRESHOLD) {
    charges = amount * TRANSACTION_FEE_RATE;
  }

  // Calculate total
  const total = amount + charges;

  // Update display
  document.getElementById('summaryAmount').textContent = `₹ ${formatAmount(amount)}`;
  document.getElementById('summaryCharges').textContent = `₹ ${formatAmount(charges)}`;
  document.getElementById('summaryTotal').textContent = `₹ ${formatAmount(total)}`;

  // Check daily limit
  const remainingLimit = DAILY_LIMIT - todayAmount;
  if (total > remainingLimit) {
    showError(amountInput, `Amount exceeds daily limit. You can send up to ₹${formatAmount(remainingLimit)} today.`);
  } else {
    clearError(amountInput);
  }
}

// Handle Form Submit
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('.submit-btn');
  const amountInput = document.getElementById('amount');
  const descriptionInput = document.getElementById('description');
  
  const amount = parseFloat(amountInput.value);
  const description = descriptionInput.value.trim();

  // Validation
  if (!selectedAccount) {
    showToast('Please select a source account', 'error');
    return;
  }

  if (!verifiedReceiver) {
    showToast('Please verify the receiver first', 'error');
    return;
  }

  if (!amount || amount <= 0) {
    showError(amountInput, 'Please enter a valid amount');
    return;
  }

  const remainingLimit = DAILY_LIMIT - todayAmount;
  if (amount > remainingLimit) {
    showToast('Amount exceeds daily limit', 'error');
    return;
  }

  // Show loading
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    // Calculate charges and total
    let charges = 0;
    if (amount > TRANSACTION_FEE_THRESHOLD) {
      charges = amount * TRANSACTION_FEE_RATE;
    }
    const total = amount + charges;

    // Make API call
    const response = await fetch('/api/send-money', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceAccountId: selectedAccount,
        receiverId: verifiedReceiver.ZenoPayID || verifiedReceiver.zenoPayId,
        amount: amount,
        charges: charges,
        total: total,
        description: description
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Show success modal
      showSuccessModal(data.transaction);
      
      // Update stats
      todayTransactions++;
      todayAmount += total;
      updateStatsDisplay();
      
      // Reset form
      form.reset();
      verifiedReceiver = null;
      document.getElementById('receiverVerifiedCard').style.display = 'none';
      document.getElementById('receiverId').disabled = false;
      document.getElementById('receiverId').classList.remove('success');
      document.getElementById('verifyReceiverBtn').style.display = 'block';
      updateTransactionSummary();
    } else {
      showErrorModal(data.message || 'Transaction failed. Please try again.');
    }
  } catch (error) {
    console.error('Error sending money:', error);
    showErrorModal('Failed to process transaction. Please try again.');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

// ====================================
// QUICK AMOUNT BUTTONS
// ====================================
function initializeQuickAmounts() {
  const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
  const amountInput = document.getElementById('amount');

  quickAmountBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const amount = this.getAttribute('data-amount');
      amountInput.value = amount;
      
      // Remove active class from all buttons
      quickAmountBtns.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Update summary
      updateTransactionSummary();
    });
  });

  // Remove active class when user types custom amount
  amountInput.addEventListener('input', function() {
    quickAmountBtns.forEach(btn => {
      if (btn.getAttribute('data-amount') !== this.value) {
        btn.classList.remove('active');
      }
    });
  });
}

// ====================================
// CHARACTER COUNTER
// ====================================
function initializeCharacterCounter() {
  const descriptionInput = document.getElementById('description');
  const charCount = document.getElementById('charCount');

  if (descriptionInput && charCount) {
    descriptionInput.addEventListener('input', function() {
      charCount.textContent = this.value.length;
    });
  }
}

// ====================================
// LOAD TODAY'S STATS
// ====================================
async function loadTodayStats() {
  try {
    const response = await fetch('/api/today-stats');
    const data = await response.json();

    if (response.ok && data.success) {
      todayTransactions = data.transactions || 0;
      todayAmount = data.amount || 0;
      updateStatsDisplay();
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function updateStatsDisplay() {
  // Update transaction count
  const transactionEl = document.getElementById('todayTransactions');
  if (transactionEl) {
    animateValue(transactionEl, parseInt(transactionEl.textContent), todayTransactions, 500);
  }

  // Update amount sent
  const amountEl = document.getElementById('todayAmount');
  if (amountEl) {
    amountEl.textContent = `₹ ${formatAmount(todayAmount)}`;
  }

  // Update remaining limit
  const remainingLimit = DAILY_LIMIT - todayAmount;
  const remainingLimitEl = document.getElementById('remainingLimit');
  if (remainingLimitEl) {
    remainingLimitEl.textContent = `₹ ${formatAmount(remainingLimit)}`;
  }

  // Update progress bar
  const progressBar = document.getElementById('limitProgress');
  if (progressBar) {
    const percentage = (todayAmount / DAILY_LIMIT) * 100;
    progressBar.style.width = `${percentage}%`;
  }
}

// ====================================
// MODALS
// ====================================
function showSuccessModal(transaction) {
  const modal = document.getElementById('successModal');
  
  if (transaction) {
    document.getElementById('transactionId').textContent = transaction.transactionId || transaction._id || 'N/A';
    document.getElementById('transactionAmount').textContent = `₹ ${formatAmount(transaction.amount)}`;
    document.getElementById('transactionRecipient').textContent = transaction.receiverName || verifiedReceiver?.Name || 'Recipient';
  }
  
  modal.style.display = 'flex';
  
  // Optional: Add confetti effect
  // createConfetti();
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  modal.style.display = 'none';
}

function showErrorModal(message) {
  const modal = document.getElementById('errorModal');
  const messageEl = document.getElementById('errorMessage');
  
  if (messageEl) {
    messageEl.textContent = message;
  }
  
  modal.style.display = 'flex';
}

function closeErrorModal() {
  const modal = document.getElementById('errorModal');
  modal.style.display = 'none';
}

// Close modals on overlay click
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    closeSuccessModal();
    closeErrorModal();
  }
});

// ====================================
// UTILITY FUNCTIONS
// ====================================
function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function animateValue(element, start, end, duration) {
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.round(current);
  }, 16);
}

function showError(input, message) {
  input.classList.add('error');
  
  // Remove existing error message
  const existingError = input.parentElement.parentElement.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Add error message
  const errorDiv = document.createElement('p');
  errorDiv.className = 'error-message helper-text text-error';
  errorDiv.textContent = message;
  errorDiv.style.marginTop = '8px';
  input.parentElement.parentElement.appendChild(errorDiv);
}

function clearError(input) {
  input.classList.remove('error');
  const errorMessage = input.parentElement.parentElement.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
}

function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    animation: slideInRight 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 400px;
  `;
  
  // Add icon
  const icon = document.createElement('i');
  icon.className = type === 'success' ? 'fas fa-check-circle' : type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-info-circle';
  icon.style.fontSize = '20px';
  
  // Add message
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  messageSpan.style.fontWeight = '500';
  
  toast.appendChild(icon);
  toast.appendChild(messageSpan);
  document.body.appendChild(toast);
  
  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      toast.remove();
      style.remove();
    }, 300);
  }, 3000);
}

// Optional: Confetti effect for successful transactions
function createConfetti() {
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      top: -10px;
      left: ${Math.random() * 100}%;
      opacity: 1;
      z-index: 10000;
      pointer-events: none;
      animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    
    document.body.appendChild(confetti);
    
    setTimeout(() => {
      confetti.remove();
    }, 4000);
  }
}

// ====================================
// KEYBOARD SHORTCUTS
// ====================================
document.addEventListener('keydown', function(e) {
  // ESC to close modals
  if (e.key === 'Escape') {
    closeSuccessModal();
    closeErrorModal();
  }
  
  // Ctrl/Cmd + Enter to submit form
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const form = document.getElementById('sendMoneyForm');
    if (form) {
      form.dispatchEvent(new Event('submit'));
    }
  }
});

// ====================================
// MOBILE MENU (if needed)
// ====================================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileMenuClose = document.getElementById('mobileMenuClose');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', function() {
    mobileMenuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
}

if (mobileMenuClose) {
  mobileMenuClose.addEventListener('click', function() {
    mobileMenuOverlay.classList.remove('active');
    document.body.style.overflow = '';
  });
}

if (mobileMenuOverlay) {
  mobileMenuOverlay.addEventListener('click', function(e) {
    if (e.target === mobileMenuOverlay) {
      mobileMenuOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

console.log('Send Money page initialized successfully!');
