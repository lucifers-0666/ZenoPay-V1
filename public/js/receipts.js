// Receipts JavaScript

const viewReceiptButtons = document.querySelectorAll('.view-receipt-btn');
const downloadReceiptButtons = document.querySelectorAll('.download-receipt-btn');
const receiptModal = document.getElementById('receipt-modal');
const closeModalBtn = document.getElementById('close-modal');
const receiptDetailContent = document.getElementById('receipt-detail-content');
const viewToggleButtons = document.querySelectorAll('.toggle-btn');
const receiptsContainer = document.querySelector('.receipts-container');
const receiptCheckboxes = document.querySelectorAll('.receipt-checkbox');
const bulkDownloadBtn = document.getElementById('bulk-download-btn');

// View/List toggle
viewToggleButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    viewToggleButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const view = btn.dataset.view;
    receiptsContainer.className = `receipts-container ${view}-view`;
  });
});

// Checkbox selection
receiptCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const anyChecked = Array.from(receiptCheckboxes).some(cb => cb.checked);
    bulkDownloadBtn.hidden = !anyChecked;
  });
});

// Bulk download
bulkDownloadBtn?.addEventListener('click', async () => {
  const selectedIds = Array.from(receiptCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  if (selectedIds.length === 0) {
    showToast('Please select receipts to download', 'error');
    return;
  }
  
  try {
    const response = await fetch('/receipts/download-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptIds: selectedIds })
    });
    
    const data = await response.json();
    if (data.success) {
      showToast(`Downloading ${selectedIds.length} receipt(s)`, 'success');
    }
  } catch (error) {
    showToast('Failed to download receipts', 'error');
  }
});

// View receipt details
viewReceiptButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const receiptId = btn.dataset.receiptId;
    receiptModal.hidden = false;
    
    try {
      const response = await fetch(`/receipts/${receiptId}`);
      const data = await response.json();
      
      if (data.success) {
        displayReceiptDetail(data.receipt);
      }
    } catch (error) {
      showToast('Failed to load receipt', 'error');
    }
  });
});

function displayReceiptDetail(receipt) {
  const content = `
    <div class="receipt-official">
      <div class="receipt-header-official">
        <h2>ZenoPay</h2>
        <div>
          <strong>Receipt #${receipt.receiptId}</strong>
          <p>${new Date(receipt.date).toLocaleString()}</p>
        </div>
      </div>
      
      <div class="receipt-body-official">
        <div class="receipt-section">
          <h3>Transaction Details</h3>
          <table class="receipt-table">
            <tr><td>Transaction ID:</td><td><strong>${receipt.transactionId}</strong></td></tr>
            <tr><td>Date:</td><td>${new Date(receipt.date).toLocaleString()}</td></tr>
            <tr><td>Type:</td><td><span class="status-badge status-${receipt.type}">${receipt.type.toUpperCase()}</span></td></tr>
          </table>
        </div>
        
        <div class="receipt-section">
          <h3>Parties</h3>
          <table class="receipt-table">
            <tr><td>From:</td><td>${receipt.senderName}<br><small>${receipt.senderEmail}</small></td></tr>
            <tr><td>To:</td><td>${receipt.recipientName}<br><small>${receipt.recipientEmail}</small></td></tr>
          </table>
        </div>
        
        <div class="receipt-section">
          <h3>Amount Breakdown</h3>
          <table class="receipt-table breakdown">
            <tr><td>Amount:</td><td>$${receipt.amount.toFixed(2)}</td></tr>
            <tr><td>Transaction Fee:</td><td>$${receipt.transactionFee.toFixed(2)}</td></tr>
            <tr class="total"><td><strong>Net Amount:</strong></td><td><strong>$${receipt.netAmount.toFixed(2)}</strong></td></tr>
          </table>
        </div>
        
        ${receipt.description ? `
          <div class="receipt-section">
            <h3>Description</h3>
            <p>${receipt.description}</p>
          </div>
        ` : ''}
        
        <div class="receipt-section">
          <h3>Payment Method</h3>
          <p>${receipt.paymentMethod.type === 'card' ? `Card ending in ${receipt.paymentMethod.last4}` : receipt.paymentMethod.name}</p>
        </div>
        
        ${receipt.referenceNumber ? `
          <div class="receipt-section">
            <p><small>Reference: ${receipt.referenceNumber}</small></p>
          </div>
        ` : ''}
      </div>
      
      <div class="receipt-actions-official">
        <button class="btn btn-primary" onclick="downloadReceiptPDF('${receipt.receiptId}')">
          <i class="fas fa-download"></i> Download PDF
        </button>
        <button class="btn btn-secondary" onclick="emailReceipt('${receipt.receiptId}')">
          <i class="fas fa-envelope"></i> Email Receipt
        </button>
        <button class="btn btn-secondary" onclick="window.print()">
          <i class="fas fa-print"></i> Print
        </button>
      </div>
    </div>
  `;
  
  receiptDetailContent.innerHTML = content;
}

// Download receipt
downloadReceiptButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const receiptId = btn.dataset.receiptId;
    downloadReceiptPDF(receiptId);
  });
});

async function downloadReceiptPDF(receiptId) {
  try {
    const response = await fetch(`/receipts/${receiptId}/download`);
    const data = await response.json();
    if (data.success) {
      showToast('Receipt download started', 'success');
    }
  } catch (error) {
    showToast('Failed to download receipt', 'error');
  }
}

// Email receipt
async function emailReceipt(receiptId) {
  const email = prompt('Enter email address:');
  if (!email) return;
  
  try {
    const response = await fetch(`/receipts/${receiptId}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    if (data.success) {
      showToast('Receipt emailed successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to email receipt', 'error');
  }
}

// Close modal
closeModalBtn?.addEventListener('click', () => {
  receiptModal.hidden = true;
});

receiptModal?.addEventListener('click', (e) => {
  if (e.target === receiptModal) {
    receiptModal.hidden = true;
  }
});

// Filters
document.getElementById('type-filter')?.addEventListener('change', applyFilters);
document.getElementById('status-filter')?.addEventListener('change', applyFilters);

function applyFilters() {
  const url = new URL(window.location.href);
  const type = document.getElementById('type-filter').value;
  const status = document.getElementById('status-filter').value;
  
  if (type) url.searchParams.set('type', type);
  else url.searchParams.delete('type');
  
  if (status) url.searchParams.set('status', status);
  else url.searchParams.delete('status');
  
  window.location.href = url.toString();
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  setTimeout(() => toast.hidden = true, 4000);
}
