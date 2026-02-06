// User Details Page JavaScript

// Sample User Data
const userData = {
  id: 'USR-001',
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@email.com',
  phone: '+91 98765 43210',
  status: 'active',
  kycStatus: 'verified',
  balance: 12450.00,
  joinedDate: '2025-01-15',
  lastLogin: '2025-02-04T12:30:00',
  dob: '1990-03-15',
  gender: 'Male',
  address: '123, MG Road, Koramangala',
  city: 'Bangalore',
  state: 'Karnataka',
  pinCode: '560034',
  totalTransactions: 156,
  totalSpent: 45230,
  totalReceived: 58680,
  avatar: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=4F46E5&color=fff&size=120'
};

// Sample Bank Accounts
const bankAccounts = [
  { id: 1, bankName: 'HDFC Bank', accountNumber: 'XXXX XXXX 5678', status: 'active' },
  { id: 2, bankName: 'ICICI Bank', accountNumber: 'XXXX XXXX 1234', status: 'active' }
];

// Sample Transactions
const transactions = [
  { id: 'TXN-156', date: '2026-02-04', type: 'Money Sent', amount: -2500, status: 'success', recipient: 'Priya Sharma' },
  { id: 'TXN-155', date: '2026-02-03', type: 'Money Received', amount: 5000, status: 'success', sender: 'Amit Patel' },
  { id: 'TXN-154', date: '2026-02-02', type: 'Money Sent', amount: -1200, status: 'success', recipient: 'Sunita Verma' },
  { id: 'TXN-153', date: '2026-02-01', type: 'Money Received', amount: 3400, status: 'success', sender: 'Vikram Singh' },
  { id: 'TXN-152', date: '2026-01-31', type: 'Money Sent', amount: -850, status: 'pending', recipient: 'Neha Gupta' },
  { id: 'TXN-151', date: '2026-01-30', type: 'Money Received', amount: 8000, status: 'success', sender: 'Karthik Reddy' },
  { id: 'TXN-150', date: '2026-01-29', type: 'Money Sent', amount: -4200, status: 'success', recipient: 'Anita Das' },
  { id: 'TXN-149', date: '2026-01-28', type: 'Money Received', amount: 2300, status: 'success', sender: 'Ravi Kumar' }
];

// Sample Activity Log
const activityLog = [
  { id: 1, type: 'login', description: 'User logged in', timestamp: '2025-02-04T12:30:00', ip: '49.207.192.45', device: 'Chrome on Windows' },
  { id: 2, type: 'transaction', description: 'Money sent to Priya Sharma', timestamp: '2025-02-04T11:15:00', ip: '49.207.192.45', device: 'Chrome on Windows' },
  { id: 3, type: 'profile', description: 'Profile updated', timestamp: '2025-02-03T16:45:00', ip: '49.207.192.45', device: 'Chrome on Windows' },
  { id: 4, type: 'login', description: 'User logged in', timestamp: '2025-02-03T09:20:00', ip: '49.207.192.45', device: 'Mobile App on Android' },
  { id: 5, type: 'transaction', description: 'Money received from Amit Patel', timestamp: '2025-02-03T08:30:00', ip: '49.207.192.45', device: 'Mobile App on Android' },
  { id: 6, type: 'kyc', description: 'KYC documents submitted', timestamp: '2025-01-20T14:00:00', ip: '49.207.192.45', device: 'Chrome on Windows' },
  { id: 7, type: 'register', description: 'Account created', timestamp: '2025-01-15T10:30:00', ip: '49.207.192.45', device: 'Chrome on Windows' }
];

// State Management
let currentTab = 'overview';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeUserData();
  initializeEventListeners();
});

// Initialize User Data
function initializeUserData() {
  // Update page title
  document.getElementById('userName').textContent = userData.name;
  document.getElementById('userId').textContent = userData.id;
  document.getElementById('joinedDate').textContent = formatDate(userData.joinedDate);
  
  // Update profile card
  document.getElementById('userAvatar').src = userData.avatar;
  document.getElementById('profileName').textContent = userData.name;
  document.getElementById('profileEmail').textContent = userData.email;
  document.getElementById('statusBadge').textContent = capitalizeFirst(userData.status);
  document.getElementById('statusBadge').className = `badge badge-${getStatusColor(userData.status)} badge-lg`;
  
  // Update profile info list
  document.getElementById('infoPhone').textContent = userData.phone;
  document.getElementById('infoEmail').textContent = userData.email;
  document.getElementById('infoUserId').textContent = userData.id;
  document.getElementById('infoJoined').textContent = formatDate(userData.joinedDate);
  document.getElementById('infoLastLogin').textContent = formatRelativeTime(userData.lastLogin);
  
  // Update KYC status
  const kycBadge = document.getElementById('kycBadge');
  kycBadge.className = `badge badge-${getKycColor(userData.kycStatus)} badge-with-icon`;
  kycBadge.innerHTML = `
    <svg class="icon-16" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
    ${capitalizeFirst(userData.kycStatus)}
  `;
  
  // Update wallet balance
  document.getElementById('walletBalance').textContent = formatCurrency(userData.balance);
  
  // Update activity summary
  document.getElementById('totalTransactions').textContent = userData.totalTransactions;
  document.getElementById('totalSpent').textContent = formatCurrency(userData.totalSpent);
  document.getElementById('totalReceived').textContent = formatCurrency(userData.totalReceived);
  
  // Update Overview Tab - Personal Information
  document.getElementById('fullName').textContent = userData.name;
  document.getElementById('emailAddress').textContent = userData.email;
  document.getElementById('phoneNumber').textContent = userData.phone;
  document.getElementById('dob').textContent = formatDate(userData.dob);
  document.getElementById('gender').textContent = userData.gender;
  document.getElementById('fullAddress').textContent = userData.address;
  document.getElementById('city').textContent = userData.city;
  document.getElementById('state').textContent = userData.state;
  document.getElementById('pinCode').textContent = userData.pinCode;
}

// Initialize Event Listeners
function initializeEventListeners() {
  // Tab Navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tab = e.currentTarget.getAttribute('data-tab');
      switchTab(tab);
    });
  });
  
  // Top Action Bar Buttons
  document.getElementById('editUserBtn')?.addEventListener('click', () => handleEditUser());
  document.getElementById('suspendUserBtn')?.addEventListener('click', () => handleSuspendUser());
  document.getElementById('blockUserBtn')?.addEventListener('click', () => handleBlockUser());
  
  // More Actions Dropdown
  document.getElementById('moreActionsBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMoreActionsDropdown();
  });
  
  // Dropdown Items
  const dropdownItems = document.querySelectorAll('#moreActionsDropdown .dropdown-item');
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      handleMoreAction(action);
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('moreActionsDropdown');
    if (dropdown && !e.target.closest('.dropdown-wrapper')) {
      dropdown.style.display = 'none';
    }
  });
  
  // Quick Actions
  const quickActionBtns = document.querySelectorAll('.quick-action-btn');
  quickActionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      handleQuickAction(action);
    });
  });
  
  // Profile Card Buttons
  document.getElementById('viewKycBtn')?.addEventListener('click', () => switchTab('documents'));
  document.getElementById('viewTransactionsBtn')?.addEventListener('click', () => switchTab('transactions'));
  
  // Overview Tab Links
  document.getElementById('viewAllTransactionsLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('transactions');
  });
}

// Tab Switching
function switchTab(tabName) {
  currentTab = tabName;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    }
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`tab-${tabName}`)?.classList.add('active');
  
  // Load tab-specific content
  loadTabContent(tabName);
}

// Load Tab Content
function loadTabContent(tabName) {
  switch (tabName) {
    case 'overview':
      // Already loaded on initialization
      break;
    case 'transactions':
      loadTransactionsTab();
      break;
    case 'documents':
      loadDocumentsTab();
      break;
    case 'activityLog':
      loadActivityLogTab();
      break;
    case 'settings':
      loadSettingsTab();
      break;
  }
}

// Load Transactions Tab
function loadTransactionsTab() {
  const tabContent = document.getElementById('tab-transactions');
  
  let html = `
    <div class="content-section">
      <div class="section-header">
        <h3 class="section-title">All Transactions</h3>
        <button class="btn-primary btn-sm" id="exportTransactionsBtn">
          <svg class="icon-16" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export
        </button>
      </div>
      
      <div class="mini-table">
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Party</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
  `;
  
  transactions.forEach(txn => {
    const party = txn.recipient || txn.sender || 'N/A';
    const amountClass = txn.amount > 0 ? 'text-success' : 'text-error';
    const statusClass = txn.status === 'success' ? 'badge-success' : txn.status === 'pending' ? 'badge-warning' : 'badge-error';
    
    html += `
      <tr>
        <td><strong>${txn.id}</strong></td>
        <td>${formatDate(txn.date)}</td>
        <td>${txn.type}</td>
        <td>${party}</td>
        <td class="${amountClass}">${txn.amount > 0 ? '+' : ''}${formatCurrency(Math.abs(txn.amount))}</td>
        <td><span class="badge ${statusClass} badge-sm">${capitalizeFirst(txn.status)}</span></td>
      </tr>
    `;
  });
  
  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  tabContent.innerHTML = html;
  
  // Add export button listener
  document.getElementById('exportTransactionsBtn')?.addEventListener('click', () => {
    exportTransactionsToCsv();
  });
}

// Load Documents Tab
function loadDocumentsTab() {
  const tabContent = document.getElementById('tab-documents');
  
  const html = `
    <div class="content-section">
      <h3 class="section-title">KYC Documents</h3>
      
      <div class="documents-grid">
        <div class="document-card">
          <div class="document-header">
            <svg class="icon-20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
            </svg>
            <h4>Aadhaar Card</h4>
          </div>
          <div class="document-body">
            <p class="document-info"><strong>Number:</strong> XXXX XXXX 5678</p>
            <p class="document-info"><strong>Status:</strong> <span class="badge badge-success badge-sm">Verified</span></p>
            <p class="document-info"><strong>Uploaded:</strong> Jan 16, 2025</p>
          </div>
          <div class="document-actions">
            <button class="btn-secondary btn-sm">View Document</button>
          </div>
        </div>
        
        <div class="document-card">
          <div class="document-header">
            <svg class="icon-20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
            </svg>
            <h4>PAN Card</h4>
          </div>
          <div class="document-body">
            <p class="document-info"><strong>Number:</strong> ABCDE1234F</p>
            <p class="document-info"><strong>Status:</strong> <span class="badge badge-success badge-sm">Verified</span></p>
            <p class="document-info"><strong>Uploaded:</strong> Jan 16, 2025</p>
          </div>
          <div class="document-actions">
            <button class="btn-secondary btn-sm">View Document</button>
          </div>
        </div>
        
        <div class="document-card">
          <div class="document-header">
            <svg class="icon-20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h4>Profile Photo</h4>
          </div>
          <div class="document-body">
            <p class="document-info"><strong>Status:</strong> <span class="badge badge-success badge-sm">Verified</span></p>
            <p class="document-info"><strong>Uploaded:</strong> Jan 16, 2025</p>
          </div>
          <div class="document-actions">
            <button class="btn-secondary btn-sm">View Document</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  tabContent.innerHTML = html;
}

// Load Activity Log Tab
function loadActivityLogTab() {
  const tabContent = document.getElementById('tab-activityLog');
  
  let html = `
    <div class="content-section">
      <h3 class="section-title">Activity Log</h3>
      
      <div class="activity-timeline">
  `;
  
  activityLog.forEach(activity => {
    const icon = getActivityIcon(activity.type);
    
    html += `
      <div class="activity-item">
        <div class="activity-icon">
          ${icon}
        </div>
        <div class="activity-content">
          <h4 class="activity-title">${activity.description}</h4>
          <p class="activity-meta">
            <span>${formatDateTime(activity.timestamp)}</span>
            <span>•</span>
            <span>IP: ${activity.ip}</span>
            <span>•</span>
            <span>${activity.device}</span>
          </p>
        </div>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  tabContent.innerHTML = html;
}

// Load Settings Tab
function loadSettingsTab() {
  const tabContent = document.getElementById('tab-settings');
  
  const html = `
    <div class="content-section">
      <h3 class="section-title">Account Settings</h3>
      
      <div class="settings-section">
        <h4 class="settings-subtitle">Account Status</h4>
        <div class="form-group">
          <label class="form-label">Current Status</label>
          <select class="form-input" id="accountStatus">
            <option value="active" ${userData.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${userData.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            <option value="suspended" ${userData.status === 'suspended' ? 'selected' : ''}>Suspended</option>
            <option value="blocked" ${userData.status === 'blocked' ? 'selected' : ''}>Blocked</option>
          </select>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="settings-subtitle">Permissions</h4>
        <div class="settings-toggles">
          <div class="toggle-item">
            <label class="toggle-label">
              <input type="checkbox" class="toggle-input" checked>
              <span>Can Send Money</span>
            </label>
          </div>
          <div class="toggle-item">
            <label class="toggle-label">
              <input type="checkbox" class="toggle-input" checked>
              <span>Can Receive Money</span>
            </label>
          </div>
          <div class="toggle-item">
            <label class="toggle-label">
              <input type="checkbox" class="toggle-input" checked>
              <span>Can Add Bank Accounts</span>
            </label>
          </div>
          <div class="toggle-item">
            <label class="toggle-label">
              <input type="checkbox" class="toggle-input">
              <span>Can Request Money</span>
            </label>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="settings-subtitle">Transaction Limits</h4>
        <div class="form-group">
          <label class="form-label">Daily Transfer Limit</label>
          <input type="number" class="form-input" value="50000" placeholder="Enter daily limit">
        </div>
        <div class="form-group">
          <label class="form-label">Per Transaction Limit</label>
          <input type="number" class="form-input" value="25000" placeholder="Enter per transaction limit">
        </div>
      </div>
      
      <div class="settings-actions">
        <button class="btn-primary" id="saveSettingsBtn">Save Settings</button>
        <button class="btn-secondary" id="cancelSettingsBtn">Cancel</button>
      </div>
      
      <div class="settings-section danger-zone">
        <h4 class="settings-subtitle text-error">Danger Zone</h4>
        <p class="text-muted">These actions are irreversible. Please proceed with caution.</p>
        <div class="danger-actions">
          <button class="btn-error-outline" id="deleteAccountBtn">Delete Account</button>
          <button class="btn-error-outline" id="permanentBlockBtn">Permanent Block</button>
        </div>
      </div>
    </div>
  `;
  
  tabContent.innerHTML = html;
  
  // Add settings event listeners
  document.getElementById('saveSettingsBtn')?.addEventListener('click', () => handleSaveSettings());
  document.getElementById('cancelSettingsBtn')?.addEventListener('click', () => switchTab('overview'));
  document.getElementById('deleteAccountBtn')?.addEventListener('click', () => handleDeleteAccount());
  document.getElementById('permanentBlockBtn')?.addEventListener('click', () => handleBlockUser());
}

// Action Handlers
function handleEditUser() {
  alert('Edit user functionality will be implemented');
}

function handleSuspendUser() {
  if (confirm(`Are you sure you want to suspend ${userData.name}?`)) {
    alert('User suspended successfully');
  }
}

function handleBlockUser() {
  const reason = prompt(`Enter reason for blocking ${userData.name}:`);
  if (reason) {
    alert(`User blocked. Reason: ${reason}`);
  }
}

function toggleMoreActionsDropdown() {
  const dropdown = document.getElementById('moreActionsDropdown');
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function handleMoreAction(action) {
  const dropdown = document.getElementById('moreActionsDropdown');
  dropdown.style.display = 'none';
  
  switch (action) {
    case 'notify':
      alert('Send notification functionality');
      break;
    case 'resetPassword':
      if (confirm(`Send password reset email to ${userData.email}?`)) {
        alert('Password reset email sent');
      }
      break;
    case 'downloadData':
      alert('Downloading user data...');
      break;
    case 'deleteAccount':
      handleDeleteAccount();
      break;
  }
}

function handleQuickAction(action) {
  switch (action) {
    case 'sendMoney':
      alert('Send money to user functionality');
      break;
    case 'adjustBalance':
      const amount = prompt('Enter adjustment amount (+ or -):');
      if (amount) {
        alert(`Balance adjusted by ${amount}`);
      }
      break;
    case 'sendNotification':
      alert('Send notification functionality');
      break;
    case 'viewActivityLog':
      switchTab('activityLog');
      break;
  }
}

function handleSaveSettings() {
  alert('Settings saved successfully');
}

function handleDeleteAccount() {
  const confirmation = prompt(`Type "${userData.name}" to confirm permanent deletion:`);
  if (confirmation === userData.name) {
    alert('Account deleted successfully');
    window.location.href = '/admin/users';
  } else if (confirmation !== null) {
    alert('Confirmation failed. Account not deleted.');
  }
}

// Export Transactions to CSV
function exportTransactionsToCsv() {
  const csvRows = [];
  csvRows.push('Transaction ID,Date,Type,Party,Amount,Status');
  
  transactions.forEach(txn => {
    const party = txn.recipient || txn.sender || 'N/A';
    const row = [
      txn.id,
      formatDate(txn.date),
      txn.type,
      party,
      txn.amount,
      txn.status
    ];
    csvRows.push(row.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions_${userData.id}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(dateString);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getStatusColor(status) {
  const colors = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'warning',
    blocked: 'error'
  };
  return colors[status] || 'secondary';
}

function getKycColor(kycStatus) {
  const colors = {
    verified: 'success',
    pending: 'warning',
    rejected: 'error',
    not_submitted: 'secondary'
  };
  return colors[kycStatus] || 'secondary';
}

function getActivityIcon(type) {
  const icons = {
    login: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>`,
    transaction: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>`,
    profile: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`,
    kyc: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>`,
    register: `<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" /></svg>`
  };
  return icons[type] || icons.transaction;
}
