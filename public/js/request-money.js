(function(){
  const form = document.getElementById('request-form');
  const amountInput = document.getElementById('amount');
  const currencySelect = document.getElementById('currency');
  const descriptionInput = document.getElementById('description');
  const dueDateInput = document.getElementById('due-date');
  const categorySelect = document.getElementById('category');
  const recipientInput = document.getElementById('recipient-input');
  const addRecipientBtn = document.getElementById('add-recipient');
  const recipientList = document.getElementById('recipient-list');
  const previewAmount = document.getElementById('preview-amount');
  const previewDesc = document.getElementById('preview-desc');
  const previewDue = document.getElementById('preview-due');
  const previewCategory = document.getElementById('preview-category');
  const previewRecipients = document.getElementById('preview-recipients');
  const previewStatus = document.getElementById('preview-status');
  const splitToggle = document.getElementById('split-toggle');
  const splitControl = document.getElementById('split-control');
  const splitCountInput = document.getElementById('split-count');
  const splitPreview = document.getElementById('split-preview');
  const splitNote = document.getElementById('split-note');
  const sendEmail = document.getElementById('send-email');
  const sendSMS = document.getElementById('send-sms');
  const generateLink = document.getElementById('generate-link');
  const copyLinkBtn = document.getElementById('copy-link');
  const showQrBtn = document.getElementById('show-qr');
  const templates = Array.from(document.querySelectorAll('.template'));
  const toast = document.getElementById('toast');
  const qrModal = document.getElementById('qr-modal');
  const qrImage = document.getElementById('qr-image');
  const closeQr = document.getElementById('close-qr');
  const successBox = document.getElementById('success-box');
  const successMessage = document.getElementById('success-message');
  const sendAnotherBtn = document.getElementById('send-another');
  const saveDraftBtn = document.getElementById('save-draft');
  const previewName = document.getElementById('preview-name');

  const state = {
    recipients: [],
    requestLink: null,
  };

  const userName = (window.REQUEST_CONTEXT && window.REQUEST_CONTEXT.userName) || 'You';
  previewName.textContent = userName;

  function formatAmount(value, currency) {
    const num = Number(value) || 0;
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', minimumFractionDigits: 2 }).format(num);
    } catch (_) {
      return `${currency || ''} ${num.toFixed(2)}`.trim();
    }
  }

  function renderRecipients() {
    recipientList.innerHTML = '';
    state.recipients.forEach((r, idx) => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `<span>${r}</span><button type="button" aria-label="Remove"><i class="fas fa-times"></i></button>`;
      chip.querySelector('button').addEventListener('click', () => {
        state.recipients.splice(idx, 1);
        renderRecipients();
        updatePreview();
      });
      recipientList.appendChild(chip);
    });
    updatePreview();
  }

  function addRecipient(value) {
    if (!value) return;
    const pieces = value.split(',').map((v) => v.trim()).filter(Boolean);
    pieces.forEach((p) => {
      if (!state.recipients.includes(p)) {
        state.recipients.push(p);
      }
    });
    recipientInput.value = '';
    renderRecipients();
  }

  function friendlyDate(dateStr) {
    if (!dateStr) return 'No due date';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'No due date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function updatePreview() {
    const amount = amountInput.value;
    const currency = currencySelect.value;
    const desc = descriptionInput.value.trim();
    const due = dueDateInput.value;
    const category = categorySelect.value;
    const recipientsLabel = state.recipients.length === 1 ? '1 recipient' : `${state.recipients.length} recipients`;

    previewAmount.textContent = formatAmount(amount || 0, currency);
    previewDesc.textContent = desc || 'Add a description so your recipients know what this is for.';
    previewDue.textContent = friendlyDate(due);
    previewCategory.textContent = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'No category';
    previewRecipients.textContent = recipientsLabel;

    const splitEnabled = splitToggle.checked;
    const splitCount = Math.max(1, Number(splitCountInput.value || 1));
    const perPerson = splitEnabled ? (Number(amount) || 0) / splitCount : 0;
    if (splitEnabled) {
      splitPreview.hidden = false;
      splitNote.textContent = `${splitCount} people • ${formatAmount(perPerson, currency)} each`;
    } else {
      splitPreview.hidden = true;
    }
  }

  function showToast(message, variant = 'info') {
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = variant === 'success' ? '#123524' : '#111a2f';
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function toggleLinkControls(enabled) {
    copyLinkBtn.disabled = !enabled;
    showQrBtn.disabled = !enabled;
  }

  addRecipientBtn.addEventListener('click', () => addRecipient(recipientInput.value.trim()));
  recipientInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRecipient(recipientInput.value.trim());
    }
  });

  splitToggle.addEventListener('change', () => {
    splitControl.hidden = !splitToggle.checked;
    updatePreview();
  });

  splitCountInput.addEventListener('input', updatePreview);
  amountInput.addEventListener('input', updatePreview);
  currencySelect.addEventListener('change', updatePreview);
  descriptionInput.addEventListener('input', updatePreview);
  dueDateInput.addEventListener('change', updatePreview);
  categorySelect.addEventListener('change', updatePreview);

  templates.forEach((tpl) => {
    tpl.addEventListener('click', () => {
      amountInput.value = tpl.dataset.amount || '';
      descriptionInput.value = tpl.dataset.note || '';
      categorySelect.value = (tpl.dataset.title || '').toLowerCase();
      updatePreview();
    });
  });

  function buildPayload(saveAsDraft = false) {
    return {
      recipients: state.recipients,
      amount: amountInput.value,
      currency: currencySelect.value,
      description: descriptionInput.value,
      dueDate: dueDateInput.value || null,
      category: categorySelect.value,
      sendEmail: sendEmail.checked,
      sendSMS: sendSMS.checked,
      generateLink: generateLink.checked,
      splitCount: splitToggle.checked ? Number(splitCountInput.value || 1) : 1,
      saveAsDraft,
    };
  }

  async function submitRequest(saveAsDraft = false) {
    if (!state.recipients.length) {
      showToast('Add at least one recipient');
      return;
    }

    if (!amountInput.value || Number(amountInput.value) <= 0) {
      showToast('Enter a valid amount');
      return;
    }

    try {
      const res = await fetch('/request-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(saveAsDraft)),
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.message || 'Failed to send request');
        return;
      }

      if (data.request && data.request.requestLink) {
        state.requestLink = data.request.requestLink;
        toggleLinkControls(true);
      }

      previewStatus.textContent = saveAsDraft ? 'Draft saved' : 'Ready to share';
      successBox.hidden = false;
      successMessage.textContent = saveAsDraft ? 'Draft saved. You can finish and send later.' : `Request sent to ${state.recipients.length} recipient(s).`;
      showToast(data.message || 'Request created', 'success');
    } catch (err) {
      console.error(err);
      showToast('Something went wrong');
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitRequest(false);
  });

  saveDraftBtn.addEventListener('click', () => submitRequest(true));

  copyLinkBtn.addEventListener('click', async () => {
    if (!state.requestLink) return;
    try {
      await navigator.clipboard.writeText(state.requestLink);
      showToast('Link copied', 'success');
    } catch (_) {
      showToast('Copy failed');
    }
  });

  showQrBtn.addEventListener('click', () => {
    if (!state.requestLink) return;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(state.requestLink)}`;
    qrModal.hidden = false;
  });

  closeQr.addEventListener('click', () => { qrModal.hidden = true; });
  qrModal.addEventListener('click', (e) => { if (e.target === qrModal) qrModal.hidden = true; });

  sendAnotherBtn.addEventListener('click', () => {
    form.reset();
    state.recipients = [];
    state.requestLink = null;
    toggleLinkControls(false);
    renderRecipients();
    successBox.hidden = true;
    previewStatus.textContent = 'Draft';
    updatePreview();
  });

  // Initial state
  toggleLinkControls(false);
  renderRecipients();
  updatePreview();
})();
