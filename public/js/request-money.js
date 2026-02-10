(function() {
  'use strict';

  // ========== DOM ELEMENTS ==========
  const form = document.getElementById('request-form');
  const recipientInput = document.getElementById('recipient-input');
  const addRecipientBtn = document.getElementById('add-recipient');
  const recipientList = document.getElementById('recipient-list');
  const recipientError = document.getElementById('recipient-error');

  const currencySelect = document.getElementById('currency');
  const amountInput = document.getElementById('amount');
  const amountError = document.getElementById('amount-error');

  const splitToggle = document.getElementById('split-toggle');
  const splitControl = document.getElementById('split-control');
  const splitCountInput = document.getElementById('split-count');

  const descriptionInput = document.getElementById('description');
  const charCount = document.querySelector('.char-count');

  const dueDateInput = document.getElementById('due-date');
  const dueInfo = document.getElementById('due-info');

  const categorySelect = document.getElementById('category');

  const sendEmail = document.getElementById('send-email');
  const sendSMS = document.getElementById('send-sms');
  const generateLink = document.getElementById('generate-link');
  const copyLinkBtn = document.getElementById('copy-link');
  const showQrBtn = document.getElementById('show-qr');

  const templates = Array.from(document.querySelectorAll('.template-card'));

  const previewName = document.getElementById('preview-name');
  const previewAmount = document.getElementById('preview-amount');
  const previewDesc = document.getElementById('preview-desc');
  const previewStatus = document.getElementById('preview-status');
  const previewRecipients = document.getElementById('preview-recipients');
  
  const previewDueBadge = document.getElementById('preview-due-badge');
  const previewDue = document.getElementById('preview-due');
  const previewCategoryBadge = document.getElementById('preview-category-badge');
  const previewCategory = document.getElementById('preview-category');
  
  const previewPerPersonItem = document.getElementById('preview-per-person-item');
  const previewPerPerson = document.getElementById('preview-per-person');
  const previewQrBtn = document.getElementById('preview-qr-btn');

  const successBox = document.getElementById('success-box');
  const successMessage = document.getElementById('success-message');
  const sendAnotherBtn = document.getElementById('send-another');

  const saveDraftBtn = document.getElementById('save-draft');
  const sendRequestBtn = document.getElementById('send-request');

  const toastContainer = document.getElementById('toast-container');
  const qrModal = document.getElementById('qr-modal');
  const qrImage = document.getElementById('qr-image');
  const modalOverlay = document.getElementById('modal-overlay');
  const closeQrBtn = document.getElementById('close-qr');

  // ========== STATE ==========
  const state = {
    recipients: [],
    requestLink: null,
    requestId: null,
    isSubmitting: false,
  };

  const config = window.APP_CONFIG || {
    userName: 'You',
    userId: '',
    baseUrl: 'http://localhost:3000'
  };

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Validate email format
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate phone format (basic)
   */
  function isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]{10,}$/.test(phone.replace(/\s/g, ''));
  }

  /**
   * Validate recipient (email or phone)
   */
  function isValidRecipient(value) {
    const trimmed = value.trim();
    return isValidEmail(trimmed) || isValidPhone(trimmed);
  }

  /**
   * Format currency amount
   */
  function formatCurrency(amount, currency = 'INR') {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(Number(amount) || 0);
    } catch (e) {
      return `₹${Number(amount || 0).toFixed(2)}`;
    }
  }

  /**
   * Format date to readable format
   */
  function formatDate(dateStr) {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr + 'T00:00:00Z');
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return null;
    }
  }

  /**
   * Get days until date
   */
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr + 'T00:00:00Z');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const days = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
      return days;
    } catch (e) {
      return null;
    }
  }

  /**
   * Generate unique request ID
   */
  function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease';
      toast.style.display = 'block';
    }, 0);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ========== RECIPIENT MANAGEMENT ==========

  /**
   * Render recipient chips
   */
  function renderRecipients() {
    recipientList.innerHTML = '';
    
    if (state.recipients.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.innerHTML = '<i class="fas fa-users"></i> No recipients added yet';
      recipientList.appendChild(empty);
    } else {
      state.recipients.forEach((recipient, index) => {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `
          <span>${recipient}</span>
          <button type="button" class="remove-btn" aria-label="Remove recipient">
            <i class="fas fa-times"></i>
          </button>
        `;
        
        chip.querySelector('.remove-btn').addEventListener('click', (e) => {
          e.preventDefault();
          state.recipients.splice(index, 1);
          renderRecipients();
          updatePreview();
          validateForm();
        });
        
        recipientList.appendChild(chip);
      });
    }
  }

  /**
   * Add recipient
   */
  function addRecipient(value) {
    const trimmed = value.trim();
    if (!trimmed) {
      recipientError.textContent = 'Enter email or phone number';
      recipientError.hidden = false;
      return false;
    }

    if (!isValidRecipient(trimmed)) {
      recipientError.textContent = 'Invalid email or phone format';
      recipientError.hidden = false;
      return false;
    }

    if (state.recipients.includes(trimmed)) {
      recipientError.textContent = 'This recipient is already added';
      recipientError.hidden = false;
      return false;
    }

    state.recipients.push(trimmed);
    recipientInput.value = '';
    recipientError.hidden = true;
    renderRecipients();
    updatePreview();
    validateForm();
    return true;
  }

  // ========== PREVIEW UPDATE ==========

  /**
   * Update preview section in real-time
   */
  function updatePreview() {
    const amount = amountInput.value || '0';
    const currency = currencySelect.value;
    const description = descriptionInput.value.trim();
    const dueDate = dueDateInput.value;
    const category = categorySelect.value;
    const splitEnabled = splitToggle.checked;
    const splitCount = Math.max(1, Number(splitCountInput.value) || 1);

    // Amount
    previewAmount.textContent = formatCurrency(amount, currency);

    // Description
    previewDesc.textContent = description || 'Add a description so your recipients know what this is for.';

    // Recipient count
    const recipientCount = state.recipients.length;
    previewRecipients.textContent = recipientCount === 0 ? 'No recipients' :
                                   recipientCount === 1 ? '1 recipient' :
                                   `${recipientCount} recipients`;

    // Due date
    if (dueDate) {
      const formatted = formatDate(dueDate);
      const days = daysUntil(dueDate);
      previewDue.textContent = formatted;
      previewDueBadge.hidden = false;
      dueInfo.textContent = days <= 0 ? 'Overdue' : `Due in ${days} day${days !== 1 ? 's' : ''}`;
      dueInfo.hidden = false;
    } else {
      previewDueBadge.hidden = true;
      dueInfo.hidden = true;
    }

    // Category
    if (category) {
      previewCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1);
      previewCategoryBadge.hidden = false;
    } else {
      previewCategoryBadge.hidden = true;
    }

    // Split
    if (splitEnabled && recipientCount > 1) {
      const perPerson = Number(amount) / splitCount;
      previewPerPerson.textContent = `${formatCurrency(perPerson, currency)} per person`;
      previewPerPersonItem.hidden = false;
    } else {
      previewPerPersonItem.hidden = true;
    }

    // Status
    if (recipientCount > 0 && amount && Number(amount) > 0) {
      previewStatus.textContent = 'Ready';
      previewStatus.className = 'preview-status-badge success';
    } else {
      previewStatus.textContent = 'Complete form';
      previewStatus.className = 'preview-status-badge';
    }
  }

  // ========== FORM VALIDATION ==========

  /**
   * Validate form
   */
  function validateForm() {
    let isValid = true;

    // Validate recipients
    if (state.recipients.length === 0) {
      recipientError.textContent = 'Add at least one recipient';
      recipientError.hidden = false;
      isValid = false;
    } else {
      recipientError.hidden = true;
    }

    // Validate amount
    const amount = Number(amountInput.value);
    if (!amountInput.value || amount <= 0) {
      amountError.textContent = 'Enter an amount greater than 0';
      amountError.hidden = false;
      isValid = false;
    } else {
      amountError.hidden = true;
    }

    // Enable/disable submit button
    sendRequestBtn.disabled = !isValid;

    return isValid;
  }

  // ========== TEMPLATE QUICK-FILL ==========

  /**
   * Apply template
   */
  function applyTemplate(templateData) {
    amountInput.value = templateData.amount;
    descriptionInput.value = templateData.note;
    categorySelect.value = templateData.category;
    
    updatePreview();
    validateForm();
    
    showToast('✓ Template applied', 'success');
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ========== LINK & QR ==========

  /**
   * Generate request link
   */
  function generateRequestLink() {
    if (!state.requestId) {
      state.requestId = generateRequestId();
    }
    return `${config.baseUrl}/pay/request/${state.requestId}`;
  }

  /**
   * Generate and show QR code
   */
  function generateQRCode() {
    const link = generateRequestLink();
    const qrContainer = qrImage;
    qrContainer.innerHTML = '';

    // Use qrcode.js library
    if (typeof QRCode !== 'undefined') {
      new QRCode(qrContainer, {
        text: link,
        width: 240,
        height: 240,
        colorDark: '#1E293B',
        colorLight: '#FFFFFF'
      });
    } else {
      // Fallback to API
      const img = document.createElement('img');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(link)}`;
      img.alt = 'QR Code';
      qrContainer.appendChild(img);
    }

    qrModal.hidden = false;
  }

  /**
   * Copy link to clipboard
   */
  function copyLinkToClipboard() {
    const link = generateRequestLink();
    navigator.clipboard.writeText(link).then(() => {
      showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  }

  // ========== FORM SUBMISSION ==========

  /**
   * Submit request
   */
  async function submitRequest(saveAsDraft = false) {
    if (state.isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    state.isSubmitting = true;
    const buttonText = saveAsDraft ? 'Saving...' : 'Sending...';
    const originalText = saveAsDraft ? saveDraftBtn.innerHTML : sendRequestBtn.innerHTML;
    
    if (saveAsDraft) {
      saveDraftBtn.disabled = true;
      saveDraftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + buttonText;
    } else {
      sendRequestBtn.disabled = true;
      sendRequestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + buttonText;
    }

    try {
      const payload = {
        recipients: state.recipients,
        amount: Number(amountInput.value),
        currency: currencySelect.value,
        description: descriptionInput.value.trim(),
        dueDate: dueDateInput.value || null,
        category: categorySelect.value || null,
        sendEmail: sendEmail.checked,
        sendSMS: sendSMS.checked,
        generateLink: generateLink.checked,
        splitEnabled: splitToggle.checked,
        splitCount: splitToggle.checked ? Number(splitCountInput.value) : 1,
        saveAsDraft,
        requestId: state.requestId || generateRequestId()
      };

      state.requestId = payload.requestId;

      // Simulate API call (replace with actual endpoint)
      const response = await fetch('/api/request-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Fallback for demo: simulate success
        return {
          ok: true,
          json: async () => ({
            success: true,
            message: saveAsDraft ? 'Draft saved successfully' : 'Request sent successfully',
            requestId: payload.requestId,
            link: generateRequestLink()
          })
        };
      });

      const data = await response.json();

      if (data.success) {
        state.requestLink = data.link || generateRequestLink();
        showToast(data.message, 'success');
        showSuccessState(saveAsDraft);
      } else {
        showToast(data.message || 'Failed to process request', 'error');
      }
    } catch (error) {
      console.error('Request error:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      state.isSubmitting = false;
      if (saveAsDraft) {
        saveDraftBtn.disabled = false;
        saveDraftBtn.innerHTML = originalText;
      } else {
        sendRequestBtn.disabled = false;
        sendRequestBtn.innerHTML = originalText;
      }
    }
  }

  /**
   * Show success state
   */
  function showSuccessState(isSaveDraft) {
    form.style.opacity = '0.5';
    form.style.pointerEvents = 'none';
    successBox.hidden = false;
    
    if (isSaveDraft) {
      successMessage.textContent = 'Your request draft has been saved. You can finish and send it later.';
    } else {
      successMessage.textContent = `Your payment request has been sent to ${state.recipients.length} recipient${state.recipients.length !== 1 ? 's' : ''}.`;
    }

    previewStatus.textContent = isSaveDraft ? 'Draft saved' : 'Sent';
    previewStatus.className = 'preview-status-badge success';

    // Enable link controls
    if (generateLink.checked && state.requestLink) {
      copyLinkBtn.disabled = false;
      showQrBtn.disabled = false;
      previewQrBtn.hidden = false;
    }

    document.querySelector('.preview-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Reset form
   */
  function resetForm() {
    form.reset();
    state.recipients = [];
    state.requestLink = null;
    state.requestId = null;
    state.isSubmitting = false;

    form.style.opacity = '1';
    form.style.pointerEvents = 'auto';
    successBox.hidden = true;

    copyLinkBtn.disabled = true;
    showQrBtn.disabled = true;
    previewQrBtn.hidden = true;

    renderRecipients();
    updatePreview();
    validateForm();

    recipientInput.focus();
  }

  // ========== EVENT LISTENERS ==========

  // Set user name in preview
  previewName.textContent = config.userName;

  // Recipient input
  addRecipientBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const value = recipientInput.value.trim();
    if (value) {
      addRecipient(value);
    }
  });

  recipientInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = recipientInput.value.trim();
      if (value) {
        addRecipient(value);
      }
    }
  });

  recipientInput.addEventListener('blur', () => {
    if (recipientInput.value.trim()) {
      recipientError.hidden = true;
    }
  });

  // Amount input
  amountInput.addEventListener('input', () => {
    updatePreview();
    validateForm();
  });

  amountInput.addEventListener('blur', () => {
    if (amountInput.value) {
      amountError.hidden = true;
    }
  });

  // Currency
  currencySelect.addEventListener('change', updatePreview);

  // Description
  descriptionInput.addEventListener('input', () => {
    const length = descriptionInput.value.length;
    charCount.textContent = `${length}/500`;
    charCount.style.color = length > 480 ? '#F59E0B' : '';
    updatePreview();
  });

  // Due date
  dueDateInput.addEventListener('change', updatePreview);

  // Category
  categorySelect.addEventListener('change', updatePreview);

  // Split
  splitToggle.addEventListener('change', () => {
    splitControl.hidden = !splitToggle.checked;
    updatePreview();
  });

  splitCountInput.addEventListener('input', updatePreview);

  // Send options
  sendEmail.addEventListener('change', () => {
    copyLinkBtn.disabled = !(generateLink.checked && state.requestLink);
    showQrBtn.disabled = !(generateLink.checked && state.requestLink);
  });

  generateLink.addEventListener('change', () => {
    copyLinkBtn.disabled = !(generateLink.checked && state.requestLink);
    showQrBtn.disabled = !(generateLink.checked && state.requestLink);
  });

  // Templates
  templates.forEach((template) => {
    template.addEventListener('click', (e) => {
      e.preventDefault();
      applyTemplate({
        amount: template.dataset.amount,
        note: template.dataset.note,
        category: template.dataset.category
      });
    });
  });

  // Buttons
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitRequest(false);
  });

  saveDraftBtn.addEventListener('click', (e) => {
    e.preventDefault();
    submitRequest(true);
  });

  copyLinkBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.requestLink) {
      copyLinkToClipboard();
    }
  });

  showQrBtn.addEventListener('click', (e) => {
    e.preventDefault();
    generateQRCode();
  });

  previewQrBtn.addEventListener('click', (e) => {
    e.preventDefault();
    generateQRCode();
  });

  // Modal controls
  closeQrBtn.addEventListener('click', () => {
    qrModal.hidden = true;
  });

  modalOverlay.addEventListener('click', () => {
    qrModal.hidden = true;
  });

  sendAnotherBtn.addEventListener('click', resetForm);

  // ========== INITIALIZATION ==========

  // Set initial state
  renderRecipients();
  updatePreview();
  validateForm();

  // Auto-focus on load
  recipientInput.focus();

  console.log('Request Money form initialized');
})();
