// Transaction Disputes Page
let allDisputes = [
    {
        id: 1,
        disputeId: 'DISP-2025-0198',
        transactionId: 'TRX-2025-0198',
        amount: 25000,
        reason: 'duplicate',
        status: 'open',
        createdDate: '2025-01-12',
        updatedDate: '2025-01-15',
        customerName: 'Vikram Singh',
        description: 'Customer claims duplicate charge'
    },
    {
        id: 2,
        disputeId: 'DISP-2025-0199',
        transactionId: 'TRX-2025-0199',
        amount: 15000,
        reason: 'not-received',
        status: 'under-review',
        createdDate: '2025-01-10',
        updatedDate: '2025-01-14',
        customerName: 'Priya Sharma',
        description: 'Recipient claims money not received'
    },
    {
        id: 3,
        disputeId: 'DISP-2025-0200',
        transactionId: 'TRX-2025-0200',
        amount: 32000,
        reason: 'unauthorized',
        status: 'under-review',
        createdDate: '2025-01-14',
        updatedDate: '2025-01-15',
        customerName: 'Rajesh Kumar',
        description: 'Customer claims unauthorized transaction'
    },
    {
        id: 4,
        disputeId: 'DISP-2025-0201',
        transactionId: 'TRX-2025-0201',
        amount: 18000,
        reason: 'service',
        status: 'customer-credited',
        createdDate: '2025-01-08',
        updatedDate: '2025-01-12',
        customerName: 'Neha Patel',
        description: 'Service issue - customer already credited'
    },
    {
        id: 5,
        disputeId: 'DISP-2025-0202',
        transactionId: 'TRX-2025-0202',
        amount: 22000,
        reason: 'not-received',
        status: 'closed',
        createdDate: '2025-01-05',
        updatedDate: '2025-01-11',
        customerName: 'Amit Patel',
        description: 'Dispute resolved - transaction confirmed'
    },
    {
        id: 6,
        disputeId: 'DISP-2025-0203',
        transactionId: 'TRX-2025-0203',
        amount: 12000,
        reason: 'duplicate',
        status: 'open',
        createdDate: '2025-01-13',
        updatedDate: '2025-01-13',
        customerName: 'Suresh Singh',
        description: 'Possible duplicate charge'
    }
];

let selectedDispute = null;

document.addEventListener('DOMContentLoaded', function() {
    renderDisputes();
});

function renderDisputes() {
    const body = document.getElementById('disputesTableBody');
    const count = document.getElementById('disputeCount');
    
    if (!body) return;

    body.innerHTML = allDisputes.map(dispute => {
        const daysOpen = Math.floor((new Date(dispute.updatedDate) - new Date(dispute.createdDate)) / (1000 * 60 * 60 * 24));
        const reasonBadge = getReasonBadge(dispute.reason);
        const statusBadge = getStatusBadge(dispute.status);

        return `
            <tr>
                <td><strong>${dispute.disputeId}</strong></td>
                <td>${dispute.transactionId}</td>
                <td><strong>₹ ${dispute.amount.toLocaleString()}</strong></td>
                <td>${reasonBadge}</td>
                <td>${statusBadge}</td>
                <td>${daysOpen} days</td>
                <td>${dispute.updatedDate}</td>
                <td>
                    <button class="btn-icon-primary" onclick="openDisputeModal(${dispute.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    const openDisputes = allDisputes.filter(d => d.status === 'open' || d.status === 'under-review').length;
    count.textContent = openDisputes;
}

function filterDisputes() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const reasonFilter = document.getElementById('reasonFilter')?.value || '';

    const filtered = allDisputes.filter(dispute => {
        const matchesSearch = dispute.disputeId.toLowerCase().includes(searchTerm) || 
                            dispute.transactionId.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || dispute.status === statusFilter;
        const matchesReason = !reasonFilter || dispute.reason === reasonFilter;

        return matchesSearch && matchesStatus && matchesReason;
    });

    const body = document.getElementById('disputesTableBody');
    if (filtered.length === 0) {
        body.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--slate-500);">No disputes found</td></tr>';
        return;
    }

    body.innerHTML = filtered.map(dispute => {
        const daysOpen = Math.floor((new Date() - new Date(dispute.createdDate)) / (1000 * 60 * 60 * 24));
        const reasonBadge = getReasonBadge(dispute.reason);
        const statusBadge = getStatusBadge(dispute.status);

        return `
            <tr>
                <td><strong>${dispute.disputeId}</strong></td>
                <td>${dispute.transactionId}</td>
                <td><strong>₹ ${dispute.amount.toLocaleString()}</strong></td>
                <td>${reasonBadge}</td>
                <td>${statusBadge}</td>
                <td>${daysOpen} days</td>
                <td>${dispute.updatedDate}</td>
                <td>
                    <button class="btn-icon-primary" onclick="openDisputeModal(${dispute.id})">👁️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function openDisputeModal(disputeId) {
    selectedDispute = allDisputes.find(d => d.id === disputeId);
    if (!selectedDispute) return;

    const daysOpen = Math.floor((new Date() - new Date(selectedDispute.createdDate)) / (1000 * 60 * 60 * 24));
    
    const detailsDiv = document.getElementById('disputeDetails');
    detailsDiv.innerHTML = `
        <div style="padding: 16px; background: var(--slate-50); border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <small style="color: var(--slate-600); font-weight: 600;">Dispute ID</small>
                    <div style="font-weight: 700; margin-top: 4px;">${selectedDispute.disputeId}</div>
                </div>
                <div>
                    <small style="color: var(--slate-600); font-weight: 600;">Transaction ID</small>
                    <div style="font-weight: 700; margin-top: 4px;">${selectedDispute.transactionId}</div>
                </div>
                <div>
                    <small style="color: var(--slate-600); font-weight: 600;">Amount</small>
                    <div style="font-weight: 700; margin-top: 4px;">₹ ${selectedDispute.amount.toLocaleString()}</div>
                </div>
                <div>
                    <small style="color: var(--slate-600); font-weight: 600;">Days Open</small>
                    <div style="font-weight: 700; margin-top: 4px;">${daysOpen} days</div>
                </div>
            </div>
        </div>

        <div style="padding: 12px; background: var(--warning-light); border-radius: 8px; margin-bottom: 20px; border-left: 4px solid var(--warning);">
            <smallstyle="color: var(--warning); font-weight: 600;">Reason for Dispute</small>
            <div style="margin-top: 6px; font-size: 14px; color: var(--text-dark);">${selectedDispute.description}</div>
        </div>

        <div style="padding: 12px; background: var(--slate-50); border-radius: 8px; margin-bottom: 20px;">
            <small style="color: var(--slate-600); font-weight: 600;">Customer Name</small>
            <div style="font-weight: 600; margin-top: 4px;">${selectedDispute.customerName}</div>
        </div>
    `;

    document.getElementById('disputeModal').style.display = 'flex';
}

function closeDisputeModal() {
    document.getElementById('disputeModal').style.display = 'none';
    document.getElementById('creditAmountField').style.display = 'none';
    selectedDispute = null;
}

function updateReasonField() {
    const action = document.getElementById('resolutionAction').value;
    const creditField = document.getElementById('creditAmountField');
    
    if (action === 'partial') {
        creditField.style.display = 'block';
    } else {
        creditField.style.display = 'none';
    }
}

function submitDisputeResolution() {
    const action = document.getElementById('resolutionAction').value;
    const notes = document.getElementById('resolutionNotes').value;

    if (!action || !notes) {
        showError('Please complete all required fields');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Submitting...';

    setTimeout(() => {
        // Update dispute status
        const index = allDisputes.findIndex(d => d.id === selectedDispute.id);
        if (index !== -1) {
            if (action === 'accept' || action === 'partial') {
                allDisputes[index].status = 'customer-credited';
            } else if (action === 'reject') {
                allDisputes[index].status = 'closed';
            } else if (action === 'escalate') {
                allDisputes[index].status = 'under-review';
            }
        }

        showToast('Dispute resolution submitted successfully!', 'success');
        closeDisputeModal();
        renderDisputes();

        btn.disabled = false;
        btn.innerHTML = '✓ Submit Resolution';
    }, 1500);
}

function getReasonBadge(reason) {
    const badges = {
        'duplicate': '<span style="background: var(--warning-light); color: var(--warning); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Duplicate</span>',
        'unauthorized': '<span style="background: var(--error-light); color: var(--error); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Unauthorized</span>',
        'not-received': '<span style="background: var(--error-light); color: var(--error); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Not Received</span>',
        'service': '<span style="background: var(--primary-light); color: var(--primary); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Service Issue</span>'
    };
    return badges[reason] || '';
}

function getStatusBadge(status) {
    const badges = {
        'open': '<span style="background: var(--error-light); color: var(--error); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Open</span>',
        'under-review': '<span style="background: var(--warning-light); color: var(--warning); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Under Review</span>',
        'customer-credited': '<span style="background: var(--success-light); color: var(--success); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Credited</span>',
        'closed': '<span style="background: var(--slate-200); color: var(--text-dark); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Closed</span>'
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
