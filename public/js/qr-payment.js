(function() {
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  const staticQR = document.getElementById('static-qr');
  const staticLinkInput = document.getElementById('static-link-input');
  const copyStaticLinkBtn = document.getElementById('copy-static-link');
  const downloadStaticBtn = document.getElementById('download-static');
  const shareStaticBtn = document.getElementById('share-static');
  const printStaticBtn = document.getElementById('print-static');
  const copyBtn = document.getElementById('copy-btn');
  const shareWhatsAppBtn = document.getElementById('share-whatsapp');
  const shareTelegramBtn = document.getElementById('share-telegram');
  const shareEmailBtn = document.getElementById('share-email');
  const dynamicForm = document.getElementById('dynamic-form');
  const resultCard = document.getElementById('result-card');
  const dynamicQR = document.getElementById('dynamic-qr');
  const amountInput = document.getElementById('amount');
  const descriptionInput = document.getElementById('description');
  const expirySelect = document.getElementById('expiry');
  const qrSizeSelect = document.getElementById('qr-size');
  const qrColorSelect = document.getElementById('qr-color');
  const downloadDynamicBtn = document.getElementById('download-dynamic');
  const shareDynamicBtn = document.getElementById('share-dynamic');
  const copyDynamicLinkBtn = document.getElementById('copy-dynamic-link');
  const resetDynamicBtn = document.getElementById('reset-dynamic');
  const amountDetail = document.getElementById('amount-detail');
  const amountValue = document.getElementById('amount-value');
  const noteDetail = document.getElementById('note-detail');
  const noteValue = document.getElementById('note-value');
  const expiryDetail = document.getElementById('expiry-detail');
  const countdownValue = document.getElementById('countdown-value');
  const toast = document.getElementById('toast');

  const qrData = window.QR_DATA || {};
  let dynamicPaymentUrl = '';
  let countdownInterval = null;

  // Tab switching
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));
      tab.classList.add('active');
      const targetTab = tab.dataset.tab;
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });

  // Toast notification
  function showToast(message, variant = 'info') {
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = variant === 'success' ? '#123524' : '#0f172a';
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, 2500);
  }

  // Copy to clipboard
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Link copied to clipboard', 'success');
    } catch (err) {
      showToast('Failed to copy link');
    }
  }

  // Download QR code
  function downloadQR(imageElement, filename = 'zenopay-qr.png') {
    const link = document.createElement('a');
    link.href = imageElement.src;
    link.download = filename;
    link.click();
    showToast('QR code downloaded', 'success');
  }

  // Share QR (Web Share API)
  async function shareQR(title, text, url) {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        showToast('Shared successfully', 'success');
      } catch (err) {
        if (err.name !== 'AbortError') {
          showToast('Share failed');
        }
      }
    } else {
      await copyToClipboard(url);
    }
  }

  // Print QR
  function printQR() {
    const printWindow = window.open('', '_blank');
    const qrSrc = staticQR.src;
    const userName = qrData.zenoPayId || 'ZenoPay User';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print QR Code</title>
        <style>
          body { margin: 0; padding: 40px; text-align: center; font-family: Arial, sans-serif; }
          img { max-width: 400px; height: auto; margin: 20px auto; display: block; }
          h2 { margin: 20px 0 10px; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <h2>ZenoPay Payment QR Code</h2>
        <p>${userName}</p>
        <img src="${qrSrc}" alt="QR Code">
        <p>Scan this code to send payment</p>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    showToast('Print dialog opened', 'success');
  }

  // Static QR actions
  copyBtn.addEventListener('click', () => copyToClipboard(qrData.paymentUrl));
  copyStaticLinkBtn.addEventListener('click', () => copyToClipboard(qrData.paymentUrl));
  downloadStaticBtn.addEventListener('click', () => downloadQR(staticQR, 'zenopay-static-qr.png'));
  shareStaticBtn.addEventListener('click', () => shareQR('ZenoPay Payment', 'Send me money via ZenoPay', qrData.paymentUrl));
  printStaticBtn.addEventListener('click', printQR);

  // Social share
  shareWhatsAppBtn.addEventListener('click', () => {
    const url = `https://wa.me/?text=${encodeURIComponent('Send me money via ZenoPay: ' + qrData.paymentUrl)}`;
    window.open(url, '_blank');
  });

  shareTelegramBtn.addEventListener('click', () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(qrData.paymentUrl)}&text=${encodeURIComponent('Send me money via ZenoPay')}`;
    window.open(url, '_blank');
  });

  shareEmailBtn.addEventListener('click', () => {
    const subject = encodeURIComponent('Payment Request - ZenoPay');
    const body = encodeURIComponent(`Please send payment via ZenoPay:\n${qrData.paymentUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });

  // Generate dynamic QR
  dynamicForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const amount = amountInput.value;
    const description = descriptionInput.value;
    const expiryMinutes = Number(expirySelect.value);

    const payload = {
      amount: amount || null,
      description: description || '',
      expiryMinutes: expiryMinutes,
    };

    try {
      const res = await fetch('/qr-payment/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        showToast(data.message || 'Failed to generate QR');
        return;
      }

      // Display generated QR
      dynamicQR.src = data.qrCode;
      dynamicPaymentUrl = data.paymentUrl;

      // Update details
      if (amount) {
        amountDetail.hidden = false;
        amountValue.textContent = `₹${parseFloat(amount).toFixed(2)}`;
      } else {
        amountDetail.hidden = true;
      }

      if (description) {
        noteDetail.hidden = false;
        noteValue.textContent = description;
      } else {
        noteDetail.hidden = true;
      }

      if (data.expiresAt) {
        expiryDetail.hidden = false;
        startCountdown(data.expiresAt);
      } else {
        expiryDetail.hidden = true;
      }

      resultCard.hidden = false;
      showToast('QR code generated', 'success');
    } catch (err) {
      console.error(err);
      showToast('Something went wrong');
    }
  });

  // Countdown timer
  function startCountdown(expiresAt) {
    if (countdownInterval) clearInterval(countdownInterval);

    function updateCountdown() {
      const now = Date.now();
      const remaining = expiresAt - now;

      if (remaining <= 0) {
        countdownValue.textContent = 'Expired';
        countdownValue.style.color = '#ff6b6b';
        clearInterval(countdownInterval);
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      countdownValue.textContent = `${minutes}m ${seconds}s`;
    }

    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  // Dynamic QR actions
  downloadDynamicBtn.addEventListener('click', () => downloadQR(dynamicQR, 'zenopay-dynamic-qr.png'));
  shareDynamicBtn.addEventListener('click', () => shareQR('ZenoPay Payment Request', 'Pay this request via ZenoPay', dynamicPaymentUrl));
  copyDynamicLinkBtn.addEventListener('click', () => copyToClipboard(dynamicPaymentUrl));

  // Reset dynamic form
  resetDynamicBtn.addEventListener('click', () => {
    dynamicForm.reset();
    resultCard.hidden = true;
    dynamicPaymentUrl = '';
    if (countdownInterval) clearInterval(countdownInterval);
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (countdownInterval) clearInterval(countdownInterval);
  });
})();
