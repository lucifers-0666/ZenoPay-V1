// Transaction History Module
let currentTransaction = null;

function parseTransactionFromElement(element) {
  if (!element) return null;
  const encoded = element.getAttribute('data-txn');
  if (!encoded) return null;

  try {
    return JSON.parse(decodeURIComponent(encoded));
  } catch (error) {
    console.error('Failed to parse transaction data', error);
    return null;
  }
}

function formatAmount(amount) {
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  return safeAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/**
 * Search Transactions
 */
function searchTransactions() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const tableRows = document.querySelectorAll('.transactions-table tbody tr');
  const mobileCards = document.querySelectorAll('.transaction-card-mobile');
  
  tableRows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? 'table-row' : 'none';
  });

  mobileCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(searchTerm) ? 'block' : 'none';
  });
}

/**
 * View Transaction Details in Drawer
 */
function viewTransactionDetails(txn) {
  if (!txn) {
    console.error('Transaction data not provided');
    return;
  }

  currentTransaction = txn;
  const drawer = document.getElementById('transactionDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerBody = document.getElementById('drawerBody');

  if (!drawer || !drawerOverlay || !drawerBody) {
    console.error('Drawer elements not found in DOM');
    return;
  }

  const status = txn.status || 'pending';
  const type = txn.type || 'transaction';
  const statusColor = status === 'success' ? '#10B981' : status === 'pending' ? '#D97706' : '#EF4444';
  const amountColor = txn.isCredit ? '#10B981' : '#EF4444';

  drawerBody.innerHTML = `
    <div class="drawer-section">
      <h4>Transaction Details</h4>
      <div class="drawer-detail-row">
        <span class="drawer-label">Transaction ID</span>
        <span class="drawer-value">${txn.transactionId || 'N/A'}</span>
      </div>
      <div class="drawer-detail-row">
        <span class="drawer-label">Date & Time</span>
        <span class="drawer-value">${txn.date || 'N/A'} ${txn.time || ''}</span>
      </div>
      <div class="drawer-detail-row">
        <span class="drawer-label">Type</span>
        <span class="drawer-value">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
      </div>
      <div class="drawer-detail-row">
        <span class="drawer-label">Status</span>
        <span class="drawer-value" style="color: ${statusColor}">
          <i class="fas ${status === 'success' ? 'fa-check-circle' : status === 'pending' ? 'fa-clock' : 'fa-times-circle'}"></i>
          ${status.toUpperCase()}
        </span>
      </div>
    </div>

    <div class="drawer-section">
      <h4>${txn.isCredit ? 'Received From' : 'Sent To'}</h4>
      ${txn.isCredit && txn.senderName ? `
      <div class="drawer-detail-row">
        <span class="drawer-label">Name</span>
        <span class="drawer-value">${txn.senderName}</span>
      </div>
      ` : ''}
      ${!txn.isCredit && txn.receiverName ? `
      <div class="drawer-detail-row">
        <span class="drawer-label">Name</span>
        <span class="drawer-value">${txn.receiverName}</span>
      </div>
      ` : ''}
      ${txn.isCredit && txn.senderAccountNumber ? `
      <div class="drawer-detail-row">
        <span class="drawer-label">Account Number</span>
        <span class="drawer-value">${txn.senderAccountNumber}</span>
      </div>
      ` : ''}
      ${!txn.isCredit && txn.receiverAccountNumber ? `
      <div class="drawer-detail-row">
        <span class="drawer-label">Account Number</span>
        <span class="drawer-value">${txn.receiverAccountNumber}</span>
      </div>
      ` : ''}
      ${txn.isCredit && txn.senderBank ? `
      <div class="drawer-detail-row">
        <span class="drawer-label">Bank</span>
        <span class="drawer-value">${txn.senderBank}</span>
      </div>
      ` : ''}
      ${!txn.isCredit && txn.receiverBank ? `
      <div class="drawer-detail-row">
        <span class="drawer-label">Bank</span>
        <span class="drawer-value">${txn.receiverBank}</span>
      </div>
      ` : ''}
    </div>

    <div class="drawer-section">
      <h4>Payment Details</h4>
      <div class="drawer-detail-row">
        <span class="drawer-label">Description</span>
        <span class="drawer-value">${txn.description || 'N/A'}</span>
      </div>
      ${txn.paymentMethod ? `
      <div class="drawer-detail-row">
        <span class="drawer-label">Payment Method</span>
        <span class="drawer-value">${txn.paymentMethod}</span>
      </div>
      ` : ''}
      ${txn.reference ? `
      <div class="drawer-detail-row">
        <span class="drawer-label">Reference</span>
        <span class="drawer-value">${txn.reference}</span>
      </div>
      ` : ''}
      <div class="drawer-detail-row">
        <span class="drawer-label">Amount</span>
        <span class="drawer-value highlight" style="color: ${amountColor}">
          ${txn.isCredit ? '+' : '-'}₹${formatAmount(txn.amount)}
        </span>
      </div>
    </div>
  `;

  drawer.classList.add('show');
  drawerOverlay.classList.add('show');
}

/**
 * Close Transaction Drawer
 */
function closeDrawer() {
  const drawer = document.getElementById('transactionDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  
  if (drawer) {
    drawer.classList.remove('show');
  }
  
  if (drawerOverlay) {
    drawerOverlay.classList.remove('show');
  }
}

/**
 * Reset All Filters
 */
function resetFilters() {
  const typeSelect = document.getElementById('transactionType');
  const statusSelect = document.getElementById('status');
  const methodSelect = document.getElementById('paymentMethod');
  const datInput = document.getElementById('dateFrom');
  const searchInput = document.getElementById('searchInput');

  if (typeSelect) typeSelect.value = '';
  if (statusSelect) statusSelect.value = '';
  if (methodSelect) methodSelect.value = '';
  if (datInput) datInput.value = '';
  if (searchInput) searchInput.value = '';
  
  const tableRows = document.querySelectorAll('.transactions-table tbody tr');
  const mobileCards = document.querySelectorAll('.transaction-card-mobile');
  
  tableRows.forEach(row => {
    row.style.display = 'table-row';
  });

  mobileCards.forEach(card => {
    card.style.display = 'block';
  });

  showToast('Filters reset', 'info');
}

/**
 * Show Time Filter Options
 */
function showTimeFilterOptions() {
  showToast('Time filter feature coming soon', 'info');
}

/**
 * Export Transactions to CSV
 */
function exportTransactions() {
  showToast('Export CSV feature coming soon', 'info');
}

/**
 * Download Receipt
 */
function downloadReceipt() {
  if (currentTransaction) {
    showToast('Downloading receipt for transaction ' + (currentTransaction.transactionId || 'N/A'), 'success');
  } else {
    showToast('No transaction selected', 'error');
  }
}

/**
 * Raise Dispute for Transaction
 */
function raiseDispute() {
  if (currentTransaction) {
    showToast('Opening dispute form for transaction ' + (currentTransaction.transactionId || 'N/A'), 'info');
    closeDrawer();
  } else {
    showToast('No transaction selected', 'error');
  }
}

/**
 * Show Action Menu
 */
function showActionMenu(event, txn) {
  if (event) {
    event.stopPropagation();
  }
  const transactionRef = String(txn?.transactionId || '').replace(/^TXN-/i, '').trim();
  if (!transactionRef) {
    showToast('Unable to open transaction details', 'error');
    return;
  }

  window.location.href = `/transaction/${encodeURIComponent(transactionRef)}`;
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  } else {
    console.log(`Toast [${type}]: ${message}`);
  }
}

/**
 * Document Ready - Initialize Event Listeners
 */
document.addEventListener('DOMContentLoaded', function() {
  const drawerOverlay = document.getElementById('drawerOverlay');
  const transactionRows = document.querySelectorAll('.transaction-row[data-txn]');
  const transactionCards = document.querySelectorAll('.transaction-card-mobile[data-txn]');
  const actionButtons = document.querySelectorAll('.action-menu[data-txn]');
  
  // Click handlers for transaction rows/cards
  transactionRows.forEach(row => {
    row.addEventListener('click', () => {
      const txn = parseTransactionFromElement(row);
      if (txn) {
        viewTransactionDetails(txn);
      }
    });
  });

  transactionCards.forEach(card => {
    card.addEventListener('click', () => {
      const txn = parseTransactionFromElement(card);
      if (txn) {
        viewTransactionDetails(txn);
      }
    });
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      const txn = parseTransactionFromElement(button);
      showActionMenu(event, txn);
    });
  });

  // Close drawer on overlay click
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeDrawer);
  }

  // Close drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
    }
  });
});
