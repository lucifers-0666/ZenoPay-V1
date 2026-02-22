(function () {
  const verifyForm = document.getElementById('verify-form');
  const input = document.getElementById('receiptIdInput');
  const verifyBtn = document.getElementById('verifyBtn');
  const inputError = document.getElementById('inputError');
  const formCard = document.getElementById('verification-form-card');
  const resultState = document.getElementById('result-state');
  const successState = document.getElementById('success-state');
  const failedState = document.getElementById('failed-state');

  const verifyAnotherBtn = document.getElementById('verifyAnotherBtn');
  const tryAgainBtn = document.getElementById('tryAgainBtn');
  const reportBtn = document.getElementById('reportBtn');
  const scanQrBtn = document.getElementById('scanQrBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const printBtn = document.getElementById('printBtn');
  const shareBtn = document.getElementById('shareBtn');

  let latestVerifiedReceipt = null;

  const formatter = {
    normalize(value) {
      return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14);
    },
    format(value) {
      const cleaned = this.normalize(value);
      if (cleaned.length <= 2) return cleaned;

      const body = cleaned.startsWith('ZP') ? cleaned.slice(2) : cleaned;
      const parts = [];
      for (let i = 0; i < body.length; i += 4) {
        parts.push(body.slice(i, i + 4));
      }
      return `ZP-${parts.join('-')}`.replace(/-$/, '');
    },
    isValid(value) {
      return /^ZP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value);
    }
  };

  function setButtonLoading(isLoading) {
    verifyBtn.disabled = isLoading;
    verifyBtn.classList.toggle('btn-loading', isLoading);
    verifyBtn.innerHTML = isLoading
      ? '<span class="spinner"></span><span>Verifying...</span>'
      : '<i class="fa-solid fa-shield"></i><span>Verify</span>';
  }

  function showError(message) {
    input.classList.add('error');
    inputError.style.display = 'flex';
    inputError.querySelector('span').textContent = message;
  }

  function clearError() {
    input.classList.remove('error');
    inputError.style.display = 'none';
    inputError.querySelector('span').textContent = '';
  }

  function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(Number(amount || 0));
  }

  function formatDateTime(iso) {
    const date = new Date(iso);
    const dateText = date.toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: '2-digit'
    });
    const timeText = date.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    return { dateText, timeText };
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function showResultContainer() {
    resultState.style.display = 'block';
    resultState.classList.add('fade-in');
    resultState.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showSuccess(receipt) {
    latestVerifiedReceipt = receipt;

    const { dateText, timeText } = formatDateTime(receipt.transactionDate);
    const now = new Date();
    const verifiedStamp = `${now.toLocaleDateString('en-IN', {
      month: 'short', day: '2-digit', year: 'numeric'
    })} at ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} IST`;

    setText('verifiedAt', `Verified on: ${verifiedStamp}`);
    setText('r-receipt-id', receipt.receiptId || '-');
    setText('r-status', receipt.status || 'COMPLETED');
    setText('r-sender-name', receipt.sender?.name || '-');
    setText('r-sender-account', receipt.sender?.account || '-');
    setText('r-transaction-id', receipt.receiptId || '-');
    setText('r-reference', receipt.reference || '-');
    setText('r-method', receipt.method || '-');
    setText('r-recipient-name', receipt.recipient?.name || '-');
    setText('r-recipient-account', receipt.recipient?.account || '-');
    setText('r-date', dateText);
    setText('r-time', `${timeText} IST`);
    setText('r-amount', formatINR(receipt.amount));
    setText('r-fees', `Platform fee: ${formatINR(receipt.fee)} - GST: ${formatINR(receipt.gst)} - Net amount: ${formatINR(receipt.netAmount)}`);
    setText('r-hash', `SHA256: ${receipt.securityHash || '-'}`);

    successState.style.display = 'block';
    failedState.style.display = 'none';

    formCard.style.display = 'none';
    showResultContainer();
  }

  function showFailed() {
    latestVerifiedReceipt = null;
    failedState.style.display = 'block';
    successState.style.display = 'none';

    formCard.style.display = 'none';
    showResultContainer();
  }

  function resetToSearch() {
    successState.style.display = 'none';
    failedState.style.display = 'none';
    resultState.style.display = 'none';
    formCard.style.display = 'block';
    input.value = '';
    latestVerifiedReceipt = null;
    clearError();
    input.focus();
  }

  async function verifyReceipt(receiptId) {
    setButtonLoading(true);
    clearError();

    try {
      const response = await fetch(`/api/receipt/verify/${encodeURIComponent(receiptId)}`);
      const data = await response.json();

      if (response.ok && data.verified) {
        showSuccess(data.receipt);
        return;
      }

      if (response.status === 400) {
        showError('⚠ Receipt ID format is invalid. Please check and try again.');
        return;
      }

      showFailed();
    } catch (error) {
      showError('Unable to verify right now. Please try again in a moment.');
    } finally {
      setButtonLoading(false);
    }
  }

  input.addEventListener('input', (event) => {
    const currentPos = event.target.selectionStart;
    const formatted = formatter.format(event.target.value);
    event.target.value = formatted;
    clearError();

    if (currentPos !== null) {
      const endPos = Math.min(formatted.length, currentPos + (formatted.length > event.target.value.length ? 1 : 0));
      requestAnimationFrame(() => event.target.setSelectionRange(endPos, endPos));
    }
  });

  verifyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const receiptId = formatter.format(input.value.trim());
    input.value = receiptId;

    if (!receiptId) {
      showError('⚠ Please enter a receipt ID to continue.');
      formCard.style.animation = 'shake 0.4s ease';
      setTimeout(() => (formCard.style.animation = ''), 450);
      return;
    }

    if (!formatter.isValid(receiptId)) {
      showError('⚠ Receipt ID format is invalid. Please check and try again.');
      return;
    }

    await verifyReceipt(receiptId);
  });

  verifyAnotherBtn?.addEventListener('click', resetToSearch);
  tryAgainBtn?.addEventListener('click', resetToSearch);

  reportBtn?.addEventListener('click', () => {
    const id = formatter.format(input.value || document.body?.dataset?.prefilledReceiptId || '');
    window.location.href = `/report-issue?type=fraud&receiptId=${encodeURIComponent(id)}`;
  });

  scanQrBtn?.addEventListener('click', () => {
    window.location.href = '/qr-payment';
  });

  printBtn?.addEventListener('click', () => window.print());

  shareBtn?.addEventListener('click', async () => {
    if (!latestVerifiedReceipt?.receiptId) return;

    const url = `${window.location.origin}/verify-receipt/${encodeURIComponent(latestVerifiedReceipt.receiptId)}`;
    try {
      await navigator.clipboard.writeText(url);
      shareBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => {
        shareBtn.innerHTML = '<i class="fa-solid fa-share-nodes"></i> Share';
      }, 1500);
    } catch (error) {
      window.prompt('Copy this verification link:', url);
    }
  });

  downloadBtn?.addEventListener('click', () => {
    if (!latestVerifiedReceipt) return;

    const content = [
      'ZenoPay Receipt Verification',
      '---------------------------',
      `Receipt ID: ${latestVerifiedReceipt.receiptId}`,
      `Status: ${latestVerifiedReceipt.status}`,
      `Sender: ${latestVerifiedReceipt.sender?.name} (${latestVerifiedReceipt.sender?.account})`,
      `Recipient: ${latestVerifiedReceipt.recipient?.name} (${latestVerifiedReceipt.recipient?.account})`,
      `Amount: ${formatINR(latestVerifiedReceipt.amount)}`,
      `Fees: ${formatINR(latestVerifiedReceipt.fee)} | GST: ${formatINR(latestVerifiedReceipt.gst)} | Net: ${formatINR(latestVerifiedReceipt.netAmount)}`,
      `Method: ${latestVerifiedReceipt.method}`,
      `Reference: ${latestVerifiedReceipt.reference}`,
      `Security Hash: ${latestVerifiedReceipt.securityHash}`,
      `Verified at: ${new Date().toISOString()}`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${latestVerifiedReceipt.receiptId || 'receipt'}-verification.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  });

  const prefilled = formatter.format(document.body?.dataset?.prefilledReceiptId || '');
  if (prefilled) {
    input.value = prefilled;
    if (formatter.isValid(prefilled)) {
      verifyReceipt(prefilled);
    }
  }
})();
