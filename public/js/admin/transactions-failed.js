// Failed Transactions Page
let allFailedTransactions = [
    {
        id: 1,
        transactionId: 'TRX-2025-0901',
        user: {
            name: 'Arun Verma',
            userId: 'USER-112',
            phone: '9876543210'
        },
        amount: 45000,
        failureReason: 'network-error',
        failedTime: '2025-01-15 10:30',
        retryStatus: 'pending-retry',
        retriesAttempted: 0,
        maxRetries: 3,
        errorMessage: 'Connection timeout to bank gateway'
    },
    {
        id: 2,
        transactionId: 'TRX-2025-0902',
        user: {
            name: 'Deepak Singh',
            userId: 'USER-134',
            phone: '9988776655'
        },
        amount: 32000,
        failureReason: 'insufficient-balance',
        failedTime: '2025-01-15 09:45',
        retryStatus: 'no-retry',
        retriesAttempted: 0,
        maxRetries: 1,
        errorMessage: 'Bank account has insufficient balance'
    },
    {
        id: 3,
        transactionId: 'TRX-2025-0903',
        user: {
            name: 'Meera Kapoor',
            userId: 'USER-156',
            phone: '9123456789'
        },
        amount: 18500,
        failureReason: 'timeout',
        failedTime: '2025-01-15 08:20',
        retryStatus: 'retried',
        retriesAttempted: 2,
        maxRetries: 3,
        errorMessage: 'Request timeout after 30 seconds'
    }
];

let selectedTransactionForDetails = null;

document.addEventListener('DOMContentLoaded', function() {
    renderFailedTransactions();
});

function renderFailedTransactions() {
    const body = document.getElementById('failedTableBody');
    const count = document.getElementById('failedCount');
    
    if (!body) return;

    body.innerHTML = allFailedTransactions.map(trx => {
        const reasonBadge = getReasonBadge(trx.failureReason);
        const retryBadge = getRetryBadge(trx.retryStatus);

        return `
            <tr>
                <td><strong>${trx.transactionId}</strong></td>
                <td>
                    <div>
                        <strong>${trx.user.name}</strong>
                        <small style="display: block; color: var(--slate-600);">${trx.user.phone}</small>
                    </div>
                </td>
                <td><strong>₹ ${trx.amount.toLocaleString()}</strong></td>
                <td>${reasonBadge}</td>
                <td>${trx.failedTime}</td>
                <td>${retryBadge}</td>
                <td><span style="background: var(--slate-100); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${trx.retriesAttempted}/${trx.maxRetries}</span></td>
                <td>
                    <button class="btn-icon-primary" onclick="openDetailsModal(${trx.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    count.textContent = allFailedTransactions.length;
}

function filterFailedTransactions() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const reasonFilter = document.getElementById('failureReasonFilter')?.value || '';
    const retryFilter = document.getElementById('retryFilter')?.value || '';

    const filtered = allFailedTransactions.filter(trx => {
        const matchesSearch = trx.transactionId.toLowerCase().includes(searchTerm) || 
                            trx.user.name.toLowerCase().includes(searchTerm);
        const matchesReason = !reasonFilter || trx.failureReason === reasonFilter;
        const matchesRetry = !retryFilter || trx.retryStatus === retryFilter;

        return matchesSearch && matchesReason && matchesRetry;
    });

    const body = document.getElementById('failedTableBody');
    if (filtered.length === 0) {
        body.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--slate-500);">No transactions found</td></tr>';
        return;
    }

    body.innerHTML = filtered.map(trx => {
        const reasonBadge = getReasonBadge(trx.failureReason);
        const retryBadge = getRetryBadge(trx.retryStatus);

        return `
            <tr>
                <td><strong>${trx.transactionId}</strong></td>
                <td>
                    <div>
                        <strong>${trx.user.name}</strong>
                        <small style="display: block; color: var(--slate-600);">${trx.user.phone}</small>
                    </div>
                </td>
                <td><strong>₹ ${trx.amount.toLocaleString()}</strong></td>
                <td>${reasonBadge}</td>
                <td>${trx.failedTime}</td>
                <td>${retryBadge}</td>
                <td><span style="background: var(--slate-100); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${trx.retriesAttempted}/${trx.maxRetries}</span></td>
                <td>
                    <button class="btn-icon-primary" onclick="openDetailsModal(${trx.id})">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openDetailsModal(transactionId) {
    selectedTransactionForDetails = allFailedTransactions.find(t => t.id === transactionId);
    if (!selectedTransactionForDetails) return;

    const infoDiv = document.getElementById('detailedInfo');
    infoDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; background: var(--slate-50); border-radius: 8px; margin-bottom: 20px;">
            <div>
                <small style="color: var(--slate-600); font-weight: 600;">Transaction ID</small>
                <div style="font-weight: 700; margin-top: 4px;">${selectedTransactionForDetails.transactionId}</div>
            </div>
            <div>
                <small style="color: var(--slate-600); font-weight: 600;">Amount</small>
                <div style="font-weight: 700; margin-top: 4px;">₹ ${selectedTransactionForDetails.amount.toLocaleString()}</div>
            </div>
            <div>
                <small style="color: var(--slate-600); font-weight: 600;">User</small>
                <div style="font-weight: 600; margin-top: 4px;">${selectedTransactionForDetails.user.name}</div>
            </div>
            <div>
                <small style="color: var(--slate-600); font-weight: 600;">Failed Time</small>
                <div style="margin-top: 4px;">${selectedTransactionForDetails.failedTime}</div>
            </div>
        </div>

        <div style="padding: 12px; background: var(--error-light); border-radius: 8px; margin-bottom: 20px; border-left: 4px solid var(--error);">
            <small style="color: var(--error); font-weight: 600;">Error Message</small>
            <div style="margin-top: 6px; font-size: 14px; color: var(--text-dark);">"${selectedTransactionForDetails.errorMessage}"</div>
        </div>

        <div style="padding: 12px; background: var(--slate-50); border-radius: 8px; margin-bottom: 20px;">
            <small style="color: var(--slate-600); font-weight: 600;">Retry Attempts</small>
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 12px;">
                <div style="flex: 1; height: 8px; background: var(--slate-200); border-radius: 4px; overflow: hidden;">
                    <div style="width: ${(selectedTransactionForDetails.retriesAttempted/selectedTransactionForDetails.maxRetries)*100}%; height: 100%; background: ${selectedTransactionForDetails.retriesAttempted >= selectedTransactionForDetails.maxRetries ? 'var(--error)' : 'var(--warning)'}; border-radius: 4px;"></div>
                </div>
                <span style="font-weight: 600; font-size: 13px;">${selectedTransactionForDetails.retriesAttempted}/${selectedTransactionForDetails.maxRetries}</span>
            </div>
        </div>
    `;

    const retryBtn = document.getElementById('retryBtn');
    if (selectedTransactionForDetails.retryStatus === 'pending-retry' && selectedTransactionForDetails.retriesAttempted < selectedTransactionForDetails.maxRetries) {
        retryBtn.style.display = 'block';
    } else {
        retryBtn.style.display = 'none';
    }

    document.getElementById('detailsModal').style.display = 'flex';
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
    selectedTransactionForDetails = null;
}

function retryTransaction() {
    if (!selectedTransactionForDetails) return;

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Retrying...';

    setTimeout(() => {
        selectedTransactionForDetails.retriesAttempted++;
        if (Math.random() > 0.3) {
            // Simulate 70% success rate
            selectedTransactionForDetails.retryStatus = 'retried';
            showToast('Transaction retry successful!', 'success');
        } else {
            showToast('Retry failed. Please try again or process refund.', 'error');
        }
        
        closeDetailsModal();
        renderFailedTransactions();
        
        btn.disabled = false;
        btn.innerHTML = '↻ Retry Transaction';
    }, 1500);
}

function refundTransaction() {
    if (!selectedTransactionForDetails) return;

    if (!confirm(`Process refund of ₹${selectedTransactionForDetails.amount.toLocaleString()} to user?`)) {
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing...';

    setTimeout(() => {
        // Remove from failed list
        allFailedTransactions = allFailedTransactions.filter(t => t.id !== selectedTransactionForDetails.id);
        
        showToast('Refund processed successfully!', 'success');
        closeDetailsModal();
        renderFailedTransactions();
        
        btn.disabled = false;
        btn.innerHTML = '💳 Process Refund';
    }, 1500);
}

function getReasonBadge(reason) {
    const badges = {
        'timeout': '<span style="background: var(--warning-light); color: var(--warning); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Timeout</span>',
        'invalid-account': '<span style="background: var(--error-light); color: var(--error); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Invalid Account</span>',
        'insufficient-balance': '<span style="background: var(--error-light); color: var(--error); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Low Balance</span>',
        'network-error': '<span style="background: var(--warning-light); color: var(--warning); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Network Error</span>',
        'bank-rejected': '<span style="background: var(--error-light); color: var(--error); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Bank Rejected</span>',
        'other': '<span style="background: var(--slate-200); color: var(--text-dark); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Other</span>'
    };
    return badges[reason] || '';
}

function getRetryBadge(status) {
    const badges = {
        'pending-retry': '<span style="background: var(--warning-light); color: var(--warning); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Pending</span>',
        'retried': '<span style="background: var(--primary-light); color: var(--primary); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Retried</span>',
        'no-retry': '<span style="background: var(--error-light); color: var(--error); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">No Retry</span>'
    };
    return badges[status] || '';
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
