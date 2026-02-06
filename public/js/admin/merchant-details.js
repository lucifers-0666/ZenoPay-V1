// Merchant Details Page
let merchantData = {
    id: 'MER-001',
    businessName: 'UrbanCart Retail Solutions',
    ownerName: 'Rajesh Kumar Sharma',
    email: 'rajesh@urbancart.com',
    phone: '+91 98765 43210',
    businessType: 'Retail Store',
    category: 'Electronics & Gadgets',
    status: 'active',
    verificationStatus: 'verified',
    registeredDate: '2025-08-15',
    lastActive: '2026-02-05T10:30:00',
    logo: '/Images/merchant-logos/urbancart.png',
    
    // Business Details
    gstNumber: '27AABCU9603R1ZM',
    panNumber: 'AABCU9603R',
    businessAddress: '123, MG Road, Bangalore, Karnataka - 560001',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    website: 'https://www.urbancart.com',
    
    // Owner Details
    ownerEmail: 'rajesh@urbancart.com',
    ownerPhone: '+91 98765 43210',
    ownerAadhaar: '****-****-8765',
    ownerPAN: 'AABCU9603R',
    ownerDOB: '1985-06-15',
    ownerAddress: '456, Whitefield, Bangalore, Karnataka - 560066',
    
    // Bank Details
    bankName: 'HDFC Bank',
    accountNumber: '****-****-4567',
    ifscCode: 'HDFC0001234',
    accountHolderName: 'Rajesh Kumar Sharma',
    accountType: 'Current',
    bankVerified: true,
    
    // Transaction Stats
    totalTransactions: 8547,
    totalVolume: 18524000,
    successRate: 98.5,
    avgTicketSize: 2167,
    todayTransactions: 47,
    todayVolume: 124500,
    
    // Settlement
    settlementCycle: 'T+1',
    nextSettlement: '2026-02-06',
    pendingSettlement: 156800,
    lastSettlement: '2026-02-05',
    lastSettlementAmount: 245600,
    
    // Commission
    commissionRate: 2.5,
    commissionEarned: 462600,
    thisMonthCommission: 45800,
    
    // Limits
    dailyLimit: 500000,
    monthlyLimit: 10000000,
    currentDailyUsage: 124500,
    currentMonthlyUsage: 3456000,
    
    // Documents
    documents: [
        { name: 'GST Certificate', status: 'verified', uploadedDate: '2025-08-15', fileSize: '245 KB' },
        { name: 'PAN Card', status: 'verified', uploadedDate: '2025-08-15', fileSize: '156 KB' },
        { name: 'Bank Statement', status: 'verified', uploadedDate: '2025-08-16', fileSize: '1.2 MB' },
        { name: 'Shop License', status: 'verified', uploadedDate: '2025-08-15', fileSize: '320 KB' },
        { name: 'Owner Aadhaar', status: 'verified', uploadedDate: '2025-08-15', fileSize: '180 KB' }
    ],
    
    // Recent Transactions
    recentTransactions: [
        { id: 'TXN-8547', amount: 4500, status: 'success', date: '2026-02-05T10:30:00', customer: 'Amit Singh' },
        { id: 'TXN-8546', amount: 1200, status: 'success', date: '2026-02-05T09:45:00', customer: 'Priya Sharma' },
        { id: 'TXN-8545', amount: 8900, status: 'success', date: '2026-02-05T08:20:00', customer: 'Vikram Reddy' },
        { id: 'TXN-8544', amount: 2300, status: 'failed', date: '2026-02-04T18:15:00', customer: 'Neha Kapoor' },
        { id: 'TXN-8543', amount: 5600, status: 'success', date: '2026-02-04T16:30:00', customer: 'Arjun Patel' }
    ],
    
    // Activity Log
    activityLog: [
        { type: 'transaction', message: 'Transaction of ₹4,500 completed', time: '2 hours ago' },
        { type: 'settlement', message: 'Settlement of ₹2,45,600 processed', time: '1 day ago' },
        { type: 'document', message: 'Bank statement updated', time: '3 days ago' },
        { type: 'login', message: 'Merchant logged in', time: '5 hours ago' },
        { type: 'update', message: 'Business details updated', time: '1 week ago' }
    ]
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadMerchantDetails();
    renderQuickStats();
    renderBusinessInfo();
    renderOwnerInfo();
    renderBankInfo();
    renderDocuments();
    renderSettlementInfo();
    renderCommissionInfo();
    renderRecentTransactions();
    renderActivityLog();
    initializeCharts();
});

function loadMerchantDetails() {
    document.getElementById('merchantName').textContent = merchantData.businessName;
    document.getElementById('merchantId').textContent = merchantData.id + ' • Registered ' + formatDate(merchantData.registeredDate);
    
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.textContent = merchantData.status.charAt(0).toUpperCase() + merchantData.status.slice(1);
    statusBadge.className = `badge-${merchantData.status === 'active' ? 'success' : merchantData.status === 'suspended' ? 'error' : 'warning'}`;
}

function renderQuickStats() {
    const stats = [
        {
            label: 'Total Volume',
            value: formatCurrency(merchantData.totalVolume),
            icon: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
            color: 'var(--success)',
            bg: 'var(--success-light)'
        },
        {
            label: 'Total Transactions',
            value: merchantData.totalTransactions.toLocaleString(),
            icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
            color: 'var(--info)',
            bg: 'var(--info-light)'
        },
        {
            label: 'Success Rate',
            value: merchantData.successRate + '%',
            icon: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
            color: 'var(--warning)',
            bg: 'var(--warning-light)'
        },
        {
            label: 'Commission Earned',
            value: formatCurrency(merchantData.commissionEarned),
            icon: '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
            color: 'var(--primary)',
            bg: 'var(--primary-light)'
        }
    ];

    const html = stats.map(stat => `
        <div class="stat-mini-card">
            <div class="stat-mini-icon" style="background: ${stat.bg}; color: ${stat.color};">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${stat.icon}
                </svg>
            </div>
            <div class="stat-mini-content">
                <div class="stat-mini-label">${stat.label}</div>
                <div class="stat-mini-value">${stat.value}</div>
            </div>
        </div>
    `).join('');

    document.getElementById('quickStats').innerHTML = html;
}

function renderBusinessInfo() {
    const html = `
        <div class="detail-row">
            <div class="detail-label">Business Name</div>
            <div class="detail-value">${merchantData.businessName}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Business Type</div>
            <div class="detail-value">${merchantData.businessType}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Category</div>
            <div class="detail-value">${merchantData.category}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">GST Number</div>
            <div class="detail-value">
                ${merchantData.gstNumber}
                <span class="badge-success-sm">Verified</span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">PAN Number</div>
            <div class="detail-value">
                ${merchantData.panNumber}
                <span class="badge-success-sm">Verified</span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Business Address</div>
            <div class="detail-value">${merchantData.businessAddress}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">City / State</div>
            <div class="detail-value">${merchantData.city}, ${merchantData.state} - ${merchantData.pincode}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Website</div>
            <div class="detail-value">
                <a href="${merchantData.website}" target="_blank" style="color: var(--primary);">${merchantData.website}</a>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Registered On</div>
            <div class="detail-value">${formatDate(merchantData.registeredDate)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Last Active</div>
            <div class="detail-value">${formatRelativeTime(merchantData.lastActive)}</div>
        </div>
    `;
    document.getElementById('businessInfo').innerHTML = html;
}

function renderOwnerInfo() {
    const html = `
        <div class="detail-row">
            <div class="detail-label">Owner Name</div>
            <div class="detail-value">${merchantData.ownerName}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Email Address</div>
            <div class="detail-value">${merchantData.ownerEmail}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Phone Number</div>
            <div class="detail-value">${merchantData.ownerPhone}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">PAN Card</div>
            <div class="detail-value">
                ${merchantData.ownerPAN}
                <span class="badge-success-sm">Verified</span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Aadhaar Number</div>
            <div class="detail-value">
                ${merchantData.ownerAadhaar}
                <span class="badge-success-sm">Verified</span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Date of Birth</div>
            <div class="detail-value">${formatDate(merchantData.ownerDOB)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Address</div>
            <div class="detail-value">${merchantData.ownerAddress}</div>
        </div>
    `;
    document.getElementById('ownerInfo').innerHTML = html;
}

function renderBankInfo() {
    const html = `
        <div class="detail-row">
            <div class="detail-label">Bank Name</div>
            <div class="detail-value">${merchantData.bankName}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Account Number</div>
            <div class="detail-value">
                ${merchantData.accountNumber}
                ${merchantData.bankVerified ? '<span class="badge-success-sm">Verified</span>' : '<span class="badge-warning-sm">Pending</span>'}
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">IFSC Code</div>
            <div class="detail-value">${merchantData.ifscCode}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Account Holder</div>
            <div class="detail-value">${merchantData.accountHolderName}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Account Type</div>
            <div class="detail-value">${merchantData.accountType}</div>
        </div>
    `;
    document.getElementById('bankInfo').innerHTML = html;
}

function renderDocuments() {
    const html = merchantData.documents.map(doc => `
        <div class="document-item">
            <div class="document-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
            </div>
            <div class="document-info">
                <div class="document-name">${doc.name}</div>
                <div class="document-meta">${doc.fileSize} • Uploaded ${formatDate(doc.uploadedDate)}</div>
            </div>
            <span class="badge-success-sm">${doc.status}</span>
        </div>
    `).join('');
    document.getElementById('documentsList').innerHTML = html;
}

function renderSettlementInfo() {
    const html = `
        <div class="detail-row">
            <div class="detail-label">Settlement Cycle</div>
            <div class="detail-value"><strong>${merchantData.settlementCycle}</strong> (Next Day)</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Next Settlement</div>
            <div class="detail-value">${formatDate(merchantData.nextSettlement)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Pending Amount</div>
            <div class="detail-value"><strong>${formatCurrency(merchantData.pendingSettlement)}</strong></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Last Settlement</div>
            <div class="detail-value">${formatDate(merchantData.lastSettlement)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Last Amount</div>
            <div class="detail-value">${formatCurrency(merchantData.lastSettlementAmount)}</div>
        </div>
    `;
    document.getElementById('settlementInfo').innerHTML = html;
}

function renderCommissionInfo() {
    const html = `
        <div class="detail-row">
            <div class="detail-label">Commission Rate</div>
            <div class="detail-value"><strong>${merchantData.commissionRate}%</strong></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Total Earned</div>
            <div class="detail-value"><strong>${formatCurrency(merchantData.commissionEarned)}</strong></div>
        </div>
        <div class="detail-row">
            <div class="detail-label">This Month</div>
            <div class="detail-value">${formatCurrency(merchantData.thisMonthCommission)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Daily Limit</div>
            <div class="detail-value">
                ${formatCurrency(merchantData.currentDailyUsage)} / ${formatCurrency(merchantData.dailyLimit)}
                <div class="progress-bar-small">
                    <div class="progress-fill" style="width: ${(merchantData.currentDailyUsage / merchantData.dailyLimit * 100)}%; background: var(--success);"></div>
                </div>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Monthly Limit</div>
            <div class="detail-value">
                ${formatCurrency(merchantData.currentMonthlyUsage)} / ${formatCurrency(merchantData.monthlyLimit)}
                <div class="progress-bar-small">
                    <div class="progress-fill" style="width: ${(merchantData.currentMonthlyUsage / merchantData.monthlyLimit * 100)}%; background: var(--info);"></div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('commissionInfo').innerHTML = html;
}

function renderRecentTransactions() {
    const html = merchantData.recentTransactions.map(txn => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-id">${txn.id}</div>
                <div class="transaction-customer">${txn.customer}</div>
            </div>
            <div class="transaction-details">
                <div class="transaction-amount">${formatCurrency(txn.amount)}</div>
                <span class="badge-${txn.status === 'success' ? 'success' : 'error'}-sm">${txn.status}</span>
            </div>
        </div>
    `).join('');
    document.getElementById('recentTransactions').innerHTML = html;
}

function renderActivityLog() {
    const icons = {
        transaction: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
        settlement: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
        document: '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline>',
        login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line>',
        update: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>'
    };

    const html = merchantData.activityLog.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    ${icons[activity.type]}
                </svg>
            </div>
            <div class="activity-content">
                <div class="activity-message">${activity.message}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
    document.getElementById('activityLog').innerHTML = html;
}

function initializeCharts() {
    // Transaction Chart
    const ctx = document.getElementById('transactionChart');
    if (ctx && typeof Chart !== 'undefined') {
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Transaction Volume',
                    data: [4200000, 5100000, 4800000, 5200000],
                    borderColor: 'rgb(79, 70, 229)',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

// Action Functions
function editMerchant() {
    window.location.href = '/admin/merchants/edit?id=' + merchantData.id;
}

function suspendMerchant() {
    if (confirm('Are you sure you want to suspend this merchant?')) {
        showToast('Merchant suspended successfully', 'success');
    }
}

function exportMerchantData() {
    showToast('Exporting merchant data...', 'info');
}

function verifyBankAccount() {
    showToast('Bank account verification initiated', 'success');
}

function viewAllDocuments() {
    showToast('Opening documents viewer...', 'info');
}

function editCommission() {
    showToast('Opening commission settings...', 'info');
}

function viewAllTransactions() {
    window.location.href = '/admin/transactions?merchant=' + merchantData.id;
}

function sendNotification() {
    showToast('Opening notification composer...', 'info');
}

function adjustLimits() {
    showToast('Opening limits adjustment...', 'info');
}

function viewDisputes() {
    window.location.href = '/admin/disputes?merchant=' + merchantData.id;
}

function generateStatementReport() {
    showToast('Generating statement report...', 'info');
}

function updateTransactionCharts() {
    showToast('Updating charts...', 'info');
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateString);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
