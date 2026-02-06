// Pending Banks Page
let allPendingBanks = [
    {
        id: 1,
        bankName: 'Federal Bank',
        bankCode: 'FDRL0000001',
        status: 'documents-pending',
        docsLodged: 4,
        docsRequired: 6,
        submittedDate: '2025-01-12',
        priority: 'high',
        contact: 'Rajesh Kumar',
        email: 'rajesh@federalbank.com'
    },
    {
        id: 2,
        bankName: 'Kotak Mahindra Bank',
        bankCode: 'KKBK0000001',
        status: 'verification-pending',
        docsLodged: 6,
        docsRequired: 6,
        submittedDate: '2025-01-10',
        priority: 'high',
        contact: 'Priya Singh',
        email: 'priya@kotakbank.com'
    },
    {
        id: 3,
        bankName: 'ICICI Bank',
        bankCode: 'ICIC0000001',
        status: 'awaiting-approval',
        docsLodged: 6,
        docsRequired: 6,
        submittedDate: '2025-01-08',
        priority: 'medium',
        contact: 'Amit Patel',
        email: 'amit@icicibank.com'
    },
    {
        id: 4,
        bankName: 'Axis Bank',
        bankCode: 'UTIB0000001',
        status: 'documents-pending',
        docsLodged: 2,
        docsRequired: 6,
        submittedDate: '2025-01-15',
        priority: 'low',
        contact: 'Neha Gupta',
        email: 'neha@axisbank.com'
    },
    {
        id: 5,
        bankName: 'HDFC Bank',
        bankCode: 'HDFC0000001',
        status: 'verification-pending',
        docsLodged: 6,
        docsRequired: 6,
        submittedDate: '2025-01-11',
        priority: 'medium',
        contact: 'Vikram Sharma',
        email: 'vikram@hdfcbank.com'
    }
];

let selectedBankForApproval = null;
let selectedBankForRejection = null;

document.addEventListener('DOMContentLoaded', function() {
    renderPendingBanks();
    attachEventListeners();
});

function attachEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterPendingBanks();
        });
    }
}

function renderPendingBanks() {
    const body = document.getElementById('banksTableBody');
    const pendingCount = document.getElementById('pendingCount');
    
    if (!body) return;

    body.innerHTML = allPendingBanks.map(bank => {
        const daysPending = Math.floor((new Date() - new Date(bank.submittedDate)) / (1000 * 60 * 60 * 24));
        const statusBadge = getStatusBadge(bank.status);
        const priorityBadge = getPriorityBadge(bank.priority);

        return `
            <tr>
                <td>
                    <div class="table-bank-name">
                        <strong>${bank.bankName}</strong>
                        <small style="display: block; color: var(--slate-600);">${bank.contact}</small>
                    </div>
                </td>
                <td><code style="background: var(--slate-100); padding: 4px 8px; border-radius: 4px;">${bank.bankCode}</code></td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="font-size: 13px;">
                            <strong>${bank.docsLodged}/${bank.docsRequired}</strong>
                            <div style="width: 120px; height: 4px; background: var(--slate-200); border-radius: 2px; margin-top: 4px;">
                                <div style="width: ${(bank.docsLodged/bank.docsRequired)*100}%; height: 100%; background: ${bank.docsLodged === bank.docsRequired ? 'var(--success)' : 'var(--warning)'}; border-radius: 2px;"></div>
                            </div>
                        </div>
                    </div>
                </td>
                <td>${formatDate(bank.submittedDate)}</td>
                <td><span style="background: var(--slate-100); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${daysPending} days</span></td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-icon-primary" title="View Details" onclick="viewBankDetails(${bank.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                        <button class="btn-icon-success" title="Approve" onclick="openApproveModal(${bank.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <button class="btn-icon-danger" title="Reject" onclick="openRejectModal(${bank.id})">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    pendingCount.textContent = allPendingBanks.length;
}

function filterPendingBanks() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const priorityFilter = document.getElementById('priorityFilter')?.value || '';

    const filtered = allPendingBanks.filter(bank => {
        const matchesSearch = bank.bankName.toLowerCase().includes(searchTerm) || 
                            bank.bankCode.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || bank.status === statusFilter;
        const matchesPriority = !priorityFilter || bank.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Update table with filtered results
    const body = document.getElementById('banksTableBody');
    if (filtered.length === 0) {
        body.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--slate-500);">No banks found</td></tr>';
        return;
    }

    const daysPending = Math.floor((new Date() - new Date('2025-01-15')) / (1000 * 60 * 60 * 24));
    body.innerHTML = filtered.map(bank => {
        const statusBadge = getStatusBadge(bank.status);
        const priorityBadge = getPriorityBadge(bank.priority);

        return `
            <tr>
                <td>
                    <div class="table-bank-name">
                        <strong>${bank.bankName}</strong>
                        <small style="display: block; color: var(--slate-600);">${bank.contact}</small>
                    </div>
                </td>
                <td><code style="background: var(--slate-100); padding: 4px 8px; border-radius: 4px;">${bank.bankCode}</code></td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="font-size: 13px;">
                            <strong>${bank.docsLodged}/${bank.docsRequired}</strong>
                        </div>
                    </div>
                </td>
                <td>${formatDate(bank.submittedDate)}</td>
                <td><span style="background: var(--slate-100); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${daysPending} days</span></td>
                <td>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button class="btn-icon-primary" onclick="viewBankDetails(${bank.id})">👁️</button>
                        <button class="btn-icon-success" onclick="openApproveModal(${bank.id})">✓</button>
                        <button class="btn-icon-danger" onclick="openRejectModal(${bank.id})">✕</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function viewBankDetails(bankId) {
    window.location.href = `/admin/banks/${bankId}/details`;
}

function openApproveModal(bankId) {
    selectedBankForApproval = allPendingBanks.find(b => b.id === bankId);
    if (!selectedBankForApproval) return;

    const infoDiv = document.getElementById('bankApproveInfo');
    infoDiv.innerHTML = `
        <div style="padding: 16px; background: var(--primary-light); border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px;">
                <strong>${selectedBankForApproval.bankName}</strong><br>
                <small style="color: var(--slate-600);">${selectedBankForApproval.bankCode}</small>
            </p>
        </div>
    `;

    document.getElementById('approveModal').style.display = 'flex';
}

function closeApproveModal() {
    document.getElementById('approveModal').style.display = 'none';
    selectedBankForApproval = null;
}

function approveBankRequest() {
    if (!selectedBankForApproval) return;

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Approving...';

    setTimeout(() => {
        // Remove from pending list
        allPendingBanks = allPendingBanks.filter(b => b.id !== selectedBankForApproval.id);
        
        showToast(`${selectedBankForApproval.bankName} approved successfully!`, 'success');
        closeApproveModal();
        renderPendingBanks();
        
        btn.disabled = false;
        btn.innerHTML = '✓ Approve Bank';
    }, 1500);
}

function openRejectModal(bankId) {
    selectedBankForRejection = allPendingBanks.find(b => b.id === bankId);
    if (!selectedBankForRejection) return;

    const infoDiv = document.getElementById('bankRejectInfo');
    infoDiv.innerHTML = `
        <div style="padding: 16px; background: var(--error-light); border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px;">
                <strong>${selectedBankForRejection.bankName}</strong><br>
                <small style="color: var(--slate-600);">${selectedBankForRejection.bankCode}</small>
            </p>
        </div>
    `;

    document.getElementById('rejectModal').style.display = 'flex';
}

function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
    selectedBankForRejection = null;
}

function rejectBankRequest() {
    if (!selectedBankForRejection) return;

    const reason = document.getElementById('rejectionReason').value;
    const details = document.getElementById('rejectionDetails').value;

    if (!reason) {
        showError('Please select a rejection reason');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Rejecting...';

    setTimeout(() => {
        // Remove from pending list
        allPendingBanks = allPendingBanks.filter(b => b.id !== selectedBankForRejection.id);
        
        showToast(`${selectedBankForRejection.bankName} request rejected.`, 'success');
        closeRejectModal();
        renderPendingBanks();
        
        btn.disabled = false;
        btn.innerHTML = '✕ Reject Request';
    }, 1500);
}

function getStatusBadge(status) {
    const badges = {
        'documents-pending': '<span style="background: var(--warning-light); color: var(--warning); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;">Docs Pending</span>',
        'verification-pending': '<span style="background: var(--primary-light); color: var(--primary); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;">Verifying</span>',
        'awaiting-approval': '<span style="background: #FEF3C7; color: #D97706; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;">Awaiting Approval</span>'
    };
    return badges[status] || '';
}

function getPriorityBadge(priority) {
    const badges = {
        'high': '<span style="color: var(--error);">● High</span>',
        'medium': '<span style="color: var(--warning);">● Medium</span>',
        'low': '<span style="color: var(--slate-600);">● Low</span>'
    };
    return badges[priority] || '';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
