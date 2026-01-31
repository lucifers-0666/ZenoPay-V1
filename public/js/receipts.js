// Receipts Page - Client-Side JavaScript
let currentPage = 1;
let currentView = 'grid';
let currentFilters = {
  type: 'all',
  status: 'all',
  date_from: '',
  date_to: '',
  search: ''
};
let selectedReceiptForEmail = null;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  loadReceipts();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('search-input');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.search = e.target.value;
      currentPage = 1;
      loadReceipts();
    }, 500);
  });

  // Filters
  document.getElementById('filter-type').addEventListener('change', (e) => {
    currentFilters.type = e.target.value;
    currentPage = 1;
    loadReceipts();
  });

  document.getElementById('filter-status').addEventListener('change', (e) => {
    currentFilters.status = e.target.value;
    currentPage = 1;
    loadReceipts();
  });

  document.getElementById('filter-date-from').addEventListener('change', (e) => {
    currentFilters.date_from = e.target.value;
    currentPage = 1;
    loadReceipts();
  });

  document.getElementById('filter-date-to').addEventListener('change', (e) => {
    currentFilters.date_to = e.target.value;
    currentPage = 1;
    loadReceipts();
  });
}

// Load receipts from API
async function loadReceipts() {
  try {
    const params = new URLSearchParams({
      page: currentPage,
      limit: 12,
      ...currentFilters
    });

    const response = await fetch(`/api/receipts?${params}`);
    const data = await response.json();

    if (data.success) {
      if (data.data.length === 0) {
        showEmptyState();
      } else {
        hideEmptyState();
        if (currentView === 'grid') {
          renderGridView(data.data);
        } else {
          renderListView(data.data);
        }
        renderPagination(data.pagination);
        updateResultsCount(data.pagination);
      }
    }
  } catch (error) {
    console.error('Error loading receipts:', error);
    showToast('Error loading receipts', 'error');
  }
}

// Render grid view
function renderGridView(receipts) {
  const grid = document.getElementById('receipts-grid');
  grid.innerHTML = receipts.map(receipt => `
    <div class="receipt-card ${receipt.transaction_type}" onclick="viewReceipt('${receipt._id}')">
      <div class="receipt-header">
        <span class="receipt-number">${receipt.receipt_number}</span>
        <span class="receipt-status ${receipt.status}">${receipt.status}</span>
      </div>
      <div class="receipt-type-icon">
        <i class="fas fa-arrow-${receipt.transaction_type === 'sent' ? 'up' : 'down'}"></i>
      </div>
      <div class="receipt-recipient">
        <div class="recipient-name">${receipt.transaction_type === 'sent' ? receipt.recipient_name : receipt.sender_name}</div>
        <div class="recipient-id">${receipt.transaction_type === 'sent' ? receipt.recipient_id : receipt.sender_id}</div>
      </div>
      <div class="receipt-amount">$${receipt.total_amount.toFixed(2)}</div>
      ${receipt.fee > 0 ? `<div class="receipt-fee">Fee: $${receipt.fee.toFixed(2)}</div>` : ''}
      <div class="receipt-date">
        <i class="fas fa-clock"></i> ${new Date(receipt.transaction_date).toLocaleString()}
      </div>
      <div class="receipt-actions" onclick="event.stopPropagation()">
        <button class="btn btn-small btn-secondary" onclick="downloadReceipt('${receipt._id}')">
          <i class="fas fa-download"></i> Download
        </button>
        <button class="btn btn-small btn-secondary" onclick="emailReceipt('${receipt._id}')">
          <i class="fas fa-envelope"></i> Email
        </button>
      </div>
    </div>
  `).join('');
}

// Render list view
function renderListView(receipts) {
  const tbody = document.getElementById('receipts-table-body');
  tbody.innerHTML = receipts.map(receipt => `
    <tr onclick="viewReceipt('${receipt._id}')" style="cursor: pointer;">
      <td><span class="receipt-number">${receipt.receipt_number}</span></td>
      <td>${new Date(receipt.transaction_date).toLocaleString()}</td>
      <td>${receipt.transaction_type === 'sent' ? receipt.recipient_name : receipt.sender_name}</td>
      <td><span class="receipt-status ${receipt.status}">${receipt.transaction_type}</span></td>
      <td style="color: ${receipt.transaction_type === 'sent' ? '#ef4444' : '#10b981'}; font-weight: 700;">$${receipt.total_amount.toFixed(2)}</td>
      <td>${receipt.fee > 0 ? '$' + receipt.fee.toFixed(2) : '-'}</td>
      <td><span class="receipt-status ${receipt.status}">${receipt.status}</span></td>
      <td onclick="event.stopPropagation()">
        <button class="btn btn-small btn-secondary" onclick="downloadReceipt('${receipt._id}')">
          <i class="fas fa-download"></i>
        </button>
        <button class="btn btn-small btn-secondary" onclick="emailReceipt('${receipt._id}')">
          <i class="fas fa-envelope"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// Render pagination
function renderPagination(pagination) {
  const paginationDiv = document.getElementById('pagination');
  const { current_page, total_pages } = pagination;

  if (total_pages <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }

  let html = `
    <button class="pagination-btn" ${current_page === 1 ? 'disabled' : ''} onclick="changePage(${current_page - 1})">
      <i class="fas fa-chevron-left"></i>
    </button>
  `;

  for (let i = 1; i <= total_pages; i++) {
    if (i === 1 || i === total_pages || (i >= current_page - 1 && i <= current_page + 1)) {
      html += `
        <button class="pagination-btn ${i === current_page ? 'active' : ''}" onclick="changePage(${i})">
          ${i}
        </button>
      `;
    } else if (i === current_page - 2 || i === current_page + 2) {
      html += `<span style="padding: 0.5rem;">...</span>`;
    }
  }

  html += `
    <button class="pagination-btn" ${current_page === total_pages ? 'disabled' : ''} onclick="changePage(${current_page + 1})">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationDiv.innerHTML = html;
}

// Update results count
function updateResultsCount(pagination) {
  const count = document.getElementById('results-count');
  count.textContent = `Showing ${(pagination.current_page - 1) * pagination.items_per_page + 1} - ${Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} of ${pagination.total_items} receipts`;
}

// Change page
function changePage(page) {
  currentPage = page;
  loadReceipts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Switch view
function switchView(view) {
  currentView = view;
  const gridBtn = document.getElementById('grid-view-btn');
  const listBtn = document.getElementById('list-view-btn');
  const grid = document.getElementById('receipts-grid');
  const list = document.getElementById('receipts-list');

  if (view === 'grid') {
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
    grid.classList.add('active');
    grid.classList.remove('hidden');
    list.classList.remove('active');
  } else {
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
    list.classList.add('active');
    grid.classList.add('hidden');
    grid.classList.remove('active');
  }
  
  loadReceipts();
}

// Apply quick filter
function applyQuickFilter(filter) {
  const buttons = document.querySelectorAll('.quick-filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  const today = new Date();
  let dateFrom = '';

  switch (filter) {
    case 'today':
      dateFrom = today.toISOString().split('T')[0];
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFrom = weekAgo.toISOString().split('T')[0];
      break;
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      dateFrom = monthAgo.toISOString().split('T')[0];
      break;
    case 'this-month':
      dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      break;
    default:
      dateFrom = '';
  }

  currentFilters.date_from = dateFrom;
  currentFilters.date_to = '';
  document.getElementById('filter-date-from').value = dateFrom;
  document.getElementById('filter-date-to').value = '';
  currentPage = 1;
  loadReceipts();
}

// View receipt detail
async function viewReceipt(receiptId) {
  try {
    const modal = document.getElementById('receipt-modal');
    const body = document.getElementById('receipt-detail-body');
    
    modal.classList.add('active');
    body.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';

    const response = await fetch(`/api/receipts/${receiptId}`);
    const data = await response.json();

    if (data.success) {
      const receipt = data.data;
      body.innerHTML = `
        <div class="receipt-detail">
          <div class="receipt-detail-header">
            <div class="receipt-logo">ZenoPay</div>
            <div class="receipt-title">PAYMENT RECEIPT</div>
            <div style="font-size: 1.125rem; font-weight: 700; color: #667eea; margin-top: 0.5rem;">${receipt.receipt_number}</div>
            <span class="receipt-status ${receipt.status}" style="display: inline-block; margin-top: 0.5rem;">${receipt.status}</span>
          </div>

          <div class="receipt-detail-grid">
            <div class="detail-section">
              <h3>From</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${receipt.sender_name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${receipt.sender_id}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3>To</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">${receipt.recipient_name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">${receipt.recipient_id}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Transaction Details</h3>
            <div class="detail-row">
              <span class="detail-label">Transaction Type:</span>
              <span class="detail-value">${receipt.transaction_type === 'sent' ? 'Money Sent' : 'Money Received'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${receipt.payment_method}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span>
              <span class="detail-value">${new Date(receipt.transaction_date).toLocaleString()}</span>
            </div>
            ${receipt.description ? `
              <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">${receipt.description}</span>
              </div>
            ` : ''}
          </div>

          <div class="amount-breakdown">
            <h3>Amount Breakdown</h3>
            <div class="amount-row">
              <span>Amount:</span>
              <span>$${receipt.amount.toFixed(2)}</span>
            </div>
            ${receipt.fee > 0 ? `
              <div class="amount-row">
                <span>Transaction Fee:</span>
                <span>$${receipt.fee.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="amount-row total" style="color: ${receipt.transaction_type === 'sent' ? '#ef4444' : '#10b981'};">
              <span>Total Amount:</span>
              <span>$${receipt.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Security & Verification</h3>
            <div style="font-size: 0.875rem; color: #6b7280;">
              <p style="margin-bottom: 0.5rem;">✓ Transaction verified and secured with SSL encryption</p>
              <p style="margin-bottom: 0.5rem;">✓ This receipt is digitally generated and legally valid</p>
              <p>✓ Generated on: ${new Date(receipt.generated_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" onclick="downloadReceipt('${receipt._id}')">
            <i class="fas fa-file-pdf"></i> Download PDF
          </button>
          <button class="btn btn-secondary" onclick="emailReceipt('${receipt._id}')">
            <i class="fas fa-envelope"></i> Email Receipt
          </button>
          <button class="btn btn-secondary" onclick="printReceipt()">
            <i class="fas fa-print"></i> Print
          </button>
          <button class="btn btn-secondary" onclick="shareReceipt('${receipt.receipt_number}')">
            <i class="fas fa-share"></i> Share Link
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading receipt:', error);
    showToast('Error loading receipt details', 'error');
  }
}

// Download receipt
async function downloadReceipt(receiptId) {
  try {
    showToast('Generating PDF...', 'info');
    
    const response = await fetch(`/api/receipts/${receiptId}/download`, {
      method: 'POST'
    });
    const data = await response.json();

    if (data.success) {
      const link = document.createElement('a');
      link.href = data.pdf_url;
      link.download = data.pdf_url.split('/').pop();
      link.click();
      showToast('Receipt downloaded successfully', 'success');
    } else {
      showToast('Error generating PDF', 'error');
    }
  } catch (error) {
    console.error('Error downloading receipt:', error);
    showToast('Error downloading receipt', 'error');
  }
}

// Email receipt
function emailReceipt(receiptId) {
  selectedReceiptForEmail = receiptId;
  closeReceiptModal();
  document.getElementById('email-modal').classList.add('active');
}

// Send email
async function sendEmail() {
  const email = document.getElementById('email-address').value;
  
  if (!email) {
    showToast('Please enter an email address', 'error');
    return;
  }

  if (!validateEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  try {
    showToast('Sending email...', 'info');
    
    const response = await fetch(`/api/receipts/${selectedReceiptForEmail}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      showToast('Receipt sent successfully!', 'success');
      closeEmailModal();
    } else {
      showToast(data.message || 'Error sending email', 'error');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    showToast('Error sending email', 'error');
  }
}

// Download all receipts
function downloadAllReceipts() {
  showToast('Feature coming soon: Download all receipts as ZIP', 'info');
}

// Print receipt
function printReceipt() {
  window.print();
}

// Share receipt
function shareReceipt(receiptNumber) {
  const url = `${window.location.origin}/verify-receipt/${receiptNumber}`;
  navigator.clipboard.writeText(url);
  showToast('Receipt verification link copied to clipboard!', 'success');
}

// Open email modal
function openEmailModal() {
  if (currentPage === 1) {
    showToast('Please select a receipt first', 'info');
    return;
  }
  document.getElementById('email-modal').classList.add('active');
}

// Close modals
function closeReceiptModal() {
  document.getElementById('receipt-modal').classList.remove('active');
}

function closeEmailModal() {
  document.getElementById('email-modal').classList.remove('active');
  document.getElementById('email-address').value = '';
}

// Show/hide empty state
function showEmptyState() {
  document.getElementById('empty-state').style.display = 'block';
  document.getElementById('receipts-grid').style.display = 'none';
  document.getElementById('receipts-list').style.display = 'none';
  document.getElementById('pagination').innerHTML = '';
  document.getElementById('results-count').textContent = 'No receipts found';
}

function hideEmptyState() {
  document.getElementById('empty-state').style.display = 'none';
}

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
  toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Validate email
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Close modals on outside click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});
