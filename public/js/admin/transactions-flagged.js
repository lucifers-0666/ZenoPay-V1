// Flagged Transactions Page
let allFlaggedTransactions = [
    {
        id: 1,
        transactionId: 'TRX-2025-0845',
        user: {
            name: 'Vikram Singh',
            userId: 'USER-001',
            phone: '9876543210'
        },
        amount: 75000,
        riskLevel: 'critical',
        reason: 'High velocity + Large amount',
        reasons: ['velocity', 'amount'],
        flaggedOn: '2025-01-15 14:30',
        status: 'pending',
        indicators: [
            '3 transactions in last 10 minutes',
            'Amount is 5x user average',
            'New device detected',
            'Transaction from unusual location'
        ]
    },
    {
        id: 2,
        transactionId: 'TRX-2025-0846',
        user: {
            name: 'Priya Sharma',
            userId: 'USER-045',
            phone: '9123456789'
        },
        amount: 50000,
        riskLevel: 'high',
        reason: 'Large amount',
        reasons: ['amount'],
        flaggedOn: '2025-01-15 13:20',
        status: 'pending',
        indicators: [
            'Amount exceeds user limit',
            'First transaction of this size',
            'International destination'
        ]
    },
    {
        id: 3,
        transactionId: 'TRX-2025-0847',
        user: {
            name: 'Rajesh Kumar',
            userId: 'USER-023',
            phone: '9988776655'
        },
        amount: 12500,
        riskLevel: 'medium',
        reason: 'Duplicate transaction',
        reasons: ['duplicate'],
        flaggedOn: '2025-01-15 12:45',
        status: 'pending',
        indicators: [
            'Exact same amount within 2 minutes',
            'Same recipient',
            'Possible accidental duplicate'
        ]
    },
    {
        id: 4,
        transactionId: 'TRX-2025-0848',
        user: {
            name: 'Neha Patel',
            userId: 'USER-089',
            phone: '8765432109'
        },
        amount: 35000,
        riskLevel: 'low',
        reason: 'Location mismatch',
        reasons: ['location'],
        flaggedOn: '2025-01-15 11:30',
        status: 'approved',
        indicators: [
            'IP location different from usual',
            'But within reasonable range'
        ]
    }
];

let selectedTransactionForReview = null;

document.addEventListener('DOMContentLoaded', function() {
    renderFlaggedTransactions();
});

function renderFlaggedTransactions() {
    const body = document.getElementById('flaggedTableBody');
    const count = document.getElementById('flaggedCount');
    
    if (!body) return;

    body.innerHTML = allFlaggedTransactions.map(trx => {
        const riskBadge = getRiskBadge(trx.riskLevel);
        const statusBadge = getStatusBadge(trx.status);

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
                <td>${riskBadge}</td>
                <td><small>${trx.reason}</small></td>
                <td>${trx.flaggedOn}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-icon-primary" onclick="openReviewModal(${trx.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    count.textContent = allFlaggedTransactions.length;
}

function filterFlaggedTransactions() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const riskFilter = document.getElementById('riskFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const reasonFilter = document.getElementById('reasonFilter')?.value || '';

    const filtered = allFlaggedTransactions.filter(trx => {
        const matchesSearch = trx.transactionId.toLowerCase().includes(searchTerm) || 
                            trx.user.name.toLowerCase().includes(searchTerm);
        const matchesRisk = !riskFilter || trx.riskLevel === riskFilter;
        const matchesStatus = !statusFilter || trx.status === statusFilter;
        const matchesReason = !reasonFilter || trx.reasons.includes(reasonFilter);

        return matchesSearch && matchesRisk && matchesStatus && matchesReason;
    });

    if (filtered.length === 0) {
        document.getElementById('flaggedTableBody').innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--slate-500);">No transactions found</td></tr>';
        return;
    }

    const body = document.getElementById('flaggedTableBody');
    body.innerHTML = filtered.map(trx => {
        const riskBadge = getRiskBadge(trx.riskLevel);
        const statusBadge = getStatusBadge(trx.status);

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
                <td>${riskBadge}</td>
                <td><small>${trx.reason}</small></td>
                <td>${trx.flaggedOn}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-icon-primary" onclick="openReviewModal(${trx.id})">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openReviewModal(transactionId) {
    selectedTransactionForReview = allFlaggedTransactions.find(t => t.id === transactionId);
    if (!selectedTransactionForReview) return;

    const infoDiv = document.getElementById('transactionInfo');
    infoDiv.innerHTML = `
        <div style="padding: 16px; background: var(--slate-50); border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <small style="color: var(--slate-600); font-weight: 600;">Transaction ID</small>
                    <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">${selectedTransactionForReview.transactionId}</div>
                </div>
                <div>
                    <small style="color: var(--slate-600); font-weight: 600;">Amount</small>
                    <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">₹ ${selectedTransactionForReview.amount.toLocaleString()}</div>
                </div>
                <div>
                    <small style="color: var(--slate-600); font-weight: 600;">User</small>
                    <div style="font-size: 15px; font-weight: 600; margin-top: 4px;">${selectedTransactionForReview.user.name}</div>
                </div>
                <div>
                    <small style="color: var(--slate-600); font-weight: 600;">Risk Level</small>
                    <div style="margin-top: 4px;">${getRiskBadge(selectedTransactionForReview.riskLevel)}</div>
                </div>
            </div>
        </div>
    `;

    const indicatorsDiv = document.getElementById('riskIndicators');
    indicatorsDiv.innerHTML = selectedTransactionForReview.indicators.map(ind => `<li>${ind}</li>`).join('');

    document.getElementById('reviewModal').style.display = 'flex';
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
    selectedTransactionForReview = null;
}

function submitReview() {
    const decision = document.getElementById('decisionSelect').value;
    if (!decision) {
        showError('Please select a decision');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Submitting...';

    setTimeout(() => {
        // Update status
        const index = allFlaggedTransactions.findIndex(t => t.id === selectedTransactionForReview.id);
        if (index !== -1) {
            if (decision === 'approved') {
                allFlaggedTransactions[index].status = 'approved';
            } else if (decision === 'declined') {
                allFlaggedTransactions[index].status = 'declined';
            }
        }

        showToast('Review submitted successfully!', 'success');
        closeReviewModal();
        renderFlaggedTransactions();

        btn.disabled = false;
        btn.innerHTML = '✓ Submit Decision';
    }, 1500);
}

function getRiskBadge(level) {
    const badges = {
        'critical': '<span style="background: var(--error); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">CRITICAL</span>',
        'high': '<span style="background: var(--error-light); color: var(--error); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">High</span>',
        'medium': '<span style="background: var(--warning-light); color: var(--warning); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Medium</span>',
        'low': '<span style="background: var(--success-light); color: var(--success); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Low</span>'
    };
    return badges[level] || '';
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span style="background: #FEF3C7; color: #D97706; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Pending</span>',
        'approved': '<span style="background: var(--success-light); color: var(--success); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Approved</span>',
        'declined': '<span style="background: var(--error-light); color: var(--error); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Declined</span>',
        'blocked': '<span style="background: var(--error); color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Blocked</span>'
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
