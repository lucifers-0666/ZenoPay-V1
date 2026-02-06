// Pending Merchants Management
let pendingMerchantsData = [
    {
        id: 'PM-001',
        businessName: 'TechMart Electronics',
        ownerName: 'Arjun Patel',
        email: 'arjun@techmart.com',
        phone: '+91 98765 43210',
        businessType: 'retail',
        priority: 'urgent',
        documentsStatus: 'complete',
        estMonthlyRevenue: 2500000,
        appliedDate: '2026-02-03',
        waitTimeHours: 36,
        logo: '/Images/merchant-logos/techmart.png',
        documents: ['GST Certificate', 'PAN Card', 'Bank Statement', 'Shop License']
    },
    {
        id: 'PM-002',
        businessName: 'Café Aroma',
        ownerName: 'Priya Sharma',
        email: 'priya@cafearoma.com',
        phone: '+91 98123 45678',
        businessType: 'restaurant',
        priority: 'normal',
        documentsStatus: 'complete',
        estMonthlyRevenue: 850000,
        appliedDate: '2026-02-04',
        waitTimeHours: 18,
        logo: '/Images/merchant-logos/cafe-aroma.png',
        documents: ['FSSAI License', 'GST Certificate', 'PAN Card', 'Bank Statement']
    },
    {
        id: 'PM-003',
        businessName: 'FitGear Sports',
        ownerName: 'Rajesh Kumar',
        email: 'rajesh@fitgear.com',
        phone: '+91 99887 76655',
        businessType: 'online',
        priority: 'urgent',
        documentsStatus: 'incomplete',
        estMonthlyRevenue: 1850000,
        appliedDate: '2026-02-02',
        waitTimeHours: 62,
        logo: '/Images/merchant-logos/fitgear.png',
        documents: ['GST Certificate', 'PAN Card']
    },
    {
        id: 'PM-004',
        businessName: 'Green Valley Grocers',
        ownerName: 'Amit Singh',
        email: 'amit@greenvalley.com',
        phone: '+91 97654 32109',
        businessType: 'grocery',
        priority: 'normal',
        documentsStatus: 'complete',
        estMonthlyRevenue: 3200000,
        appliedDate: '2026-02-04',
        waitTimeHours: 12,
        logo: '/Images/merchant-logos/greenvalley.png',
        documents: ['GST Certificate', 'PAN Card', 'Bank Statement', 'Trade License', 'FSSAI']
    },
    {
        id: 'PM-005',
        businessName: 'StyleHub Fashion',
        ownerName: 'Neha Kapoor',
        email: 'neha@stylehub.com',
        phone: '+91 98321 45670',
        businessType: 'retail',
        priority: 'normal',
        documentsStatus: 'complete',
        estMonthlyRevenue: 1450000,
        appliedDate: '2026-02-03',
        waitTimeHours: 28,
        logo: '/Images/merchant-logos/stylehub.png',
        documents: ['GST Certificate', 'PAN Card', 'Bank Statement', 'Shop License']
    },
    {
        id: 'PM-006',
        businessName: 'QuickFix Services',
        ownerName: 'Vikram Reddy',
        email: 'vikram@quickfix.com',
        phone: '+91 96543 21098',
        businessType: 'service',
        priority: 'urgent',
        documentsStatus: 'complete',
        estMonthlyRevenue: 980000,
        appliedDate: '2026-02-01',
        waitTimeHours: 88,
        logo: '/Images/merchant-logos/quickfix.png',
        documents: ['GST Certificate', 'PAN Card', 'Bank Statement', 'Service License']
    },
    {
        id: 'PM-007',
        businessName: 'BookWorm Paradise',
        ownerName: 'Anjali Desai',
        email: 'anjali@bookworm.com',
        phone: '+91 94567 89012',
        businessType: 'retail',
        priority: 'normal',
        documentsStatus: 'incomplete',
        estMonthlyRevenue: 650000,
        appliedDate: '2026-02-04',
        waitTimeHours: 8,
        logo: '/Images/merchant-logos/bookworm.png',
        documents: ['PAN Card']
    },
    {
        id: 'PM-008',
        businessName: 'Digital Dreams Studio',
        ownerName: 'Karan Malhotra',
        email: 'karan@digitaldreams.com',
        phone: '+91 93456 78901',
        businessType: 'service',
        priority: 'normal',
        documentsStatus: 'complete',
        estMonthlyRevenue: 1250000,
        appliedDate: '2026-02-03',
        waitTimeHours: 32,
        logo: '/Images/merchant-logos/digitaldreams.png',
        documents: ['GST Certificate', 'PAN Card', 'Bank Statement']
    }
];

let filteredData = [...pendingMerchantsData];
let currentPage = 1;
let pageSize = 10;
let selectedMerchants = new Set();
let currentMerchantId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    renderTable();
    
    // Search with debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const spinner = document.getElementById('searchSpinner');
        spinner.style.display = 'block';
        
        searchTimeout = setTimeout(() => {
            applyFilters();
            spinner.style.display = 'none';
        }, 400);
    });

    // Filter change handlers
    document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    document.getElementById('businessTypeFilter').addEventListener('change', applyFilters);
    document.getElementById('docsFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFromFilter').addEventListener('change', applyFilters);
});

function updateStats() {
    const pendingCount = pendingMerchantsData.length;
    const urgentCount = pendingMerchantsData.filter(m => m.priority === 'urgent').length;
    const totalEstRevenue = pendingMerchantsData.reduce((sum, m) => sum + m.estMonthlyRevenue, 0);
    const avgWaitTime = Math.round(pendingMerchantsData.reduce((sum, m) => sum + m.waitTimeHours, 0) / pendingCount);

    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('urgentCount').textContent = urgentCount;
    document.getElementById('estRevenue').textContent = formatCurrency(totalEstRevenue);
    document.getElementById('avgWaitTime').textContent = avgWaitTime + 'h';
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const priorityFilter = document.getElementById('priorityFilter').value;
    const typeFilter = document.getElementById('businessTypeFilter').value;
    const docsFilter = document.getElementById('docsFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;

    filteredData = pendingMerchantsData.filter(merchant => {
        const matchesSearch = !searchTerm || 
            merchant.businessName.toLowerCase().includes(searchTerm) ||
            merchant.ownerName.toLowerCase().includes(searchTerm) ||
            merchant.email.toLowerCase().includes(searchTerm);
        
        const matchesPriority = !priorityFilter || merchant.priority === priorityFilter;
        const matchesType = !typeFilter || merchant.businessType === typeFilter;
        const matchesDocs = !docsFilter || merchant.documentsStatus === docsFilter;
        const matchesDate = !dateFrom || merchant.appliedDate >= dateFrom;

        return matchesSearch && matchesPriority && matchesType && matchesDocs && matchesDate;
    });

    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('merchantsTableBody');
    const emptyState = document.getElementById('emptyState');
    const paginationWrapper = document.getElementById('paginationWrapper');

    if (filteredData.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'flex';
        paginationWrapper.style.display = 'none';
        document.getElementById('resultsCount').textContent = '0';
        return;
    }

    emptyState.style.display = 'none';
    paginationWrapper.style.display = 'flex';

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);

    tbody.innerHTML = pageData.map(merchant => createMerchantRow(merchant)).join('');

    // Update pagination info
    document.getElementById('resultsCount').textContent = filteredData.length;
    document.getElementById('showingFrom').textContent = startIndex + 1;
    document.getElementById('showingTo').textContent = endIndex;
    document.getElementById('totalRecords').textContent = filteredData.length;

    renderPagination();
}

function createMerchantRow(merchant) {
    const isSelected = selectedMerchants.has(merchant.id);
    const priorityBadge = merchant.priority === 'urgent' 
        ? '<span class="badge-urgent">Urgent</span>' 
        : '<span class="badge-normal">Normal</span>';
    
    const docsBadge = merchant.documentsStatus === 'complete'
        ? '<span class="badge-success">Complete</span>'
        : '<span class="badge-warning">Incomplete</span>';

    const waitTimeClass = merchant.waitTimeHours > 48 ? 'text-error' : merchant.waitTimeHours > 24 ? 'text-warning' : 'text-slate-600';

    return `
        <tr>
            <td>
                <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelect('${merchant.id}')">
            </td>
            <td>
                <div class="merchant-cell">
                    <img src="${merchant.logo}" alt="${merchant.businessName}" class="merchant-logo" onerror="this.src='/Images/default-merchant.png'">
                    <div class="merchant-info">
                        <div class="merchant-name">${merchant.businessName}</div>
                        <div class="merchant-owner">${merchant.ownerName}</div>
                    </div>
                </div>
            </td>
            <td><span class="text-capitalize">${merchant.businessType.replace('_', ' ')}</span></td>
            <td>${priorityBadge}</td>
            <td>${docsBadge}</td>
            <td><strong>${formatCurrency(merchant.estMonthlyRevenue)}</strong></td>
            <td>${formatDate(merchant.appliedDate)}</td>
            <td><span class="${waitTimeClass}">${merchant.waitTimeHours}h</span></td>
            <td style="text-align: center;">
                <div class="action-buttons">
                    <button class="btn-icon-success" onclick="showApprovalModal('${merchant.id}')" title="Approve">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                    <button class="btn-icon-danger" onclick="showRejectionModal('${merchant.id}')" title="Reject">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginationControls = document.getElementById('paginationControls');
    
    let html = '';
    
    // Previous button
    html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    </button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Next button
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    </button>`;

    paginationControls.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderTable();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePageSize() {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    currentPage = 1;
    renderTable();
}

function toggleFilters() {
    const panel = document.getElementById('filterPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('priorityFilter').value = '';
    document.getElementById('businessTypeFilter').value = '';
    document.getElementById('docsFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    applyFilters();
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('#merchantsTableBody input[type="checkbox"]');
    checkboxes.forEach(cb => {
        const merchantId = cb.onchange.toString().match(/'([^']+)'/)[1];
        if (checkbox.checked) {
            selectedMerchants.add(merchantId);
            cb.checked = true;
        } else {
            selectedMerchants.delete(merchantId);
            cb.checked = false;
        }
    });
}

function toggleSelect(merchantId) {
    if (selectedMerchants.has(merchantId)) {
        selectedMerchants.delete(merchantId);
    } else {
        selectedMerchants.add(merchantId);
    }
}

// Approval Modal Functions
function showApprovalModal(merchantId) {
    currentMerchantId = merchantId;
    const merchant = pendingMerchantsData.find(m => m.id === merchantId);
    
    if (!merchant) return;

    const preview = document.getElementById('approvalMerchantPreview');
    preview.innerHTML = `
        <div class="merchant-cell">
            <img src="${merchant.logo}" alt="${merchant.businessName}" class="merchant-logo" onerror="this.src='/Images/default-merchant.png'">
            <div class="merchant-info">
                <div class="merchant-name">${merchant.businessName}</div>
                <div class="merchant-owner">${merchant.ownerName} • ${merchant.email}</div>
            </div>
        </div>
        <div style="margin-top: 12px; padding: 12px; background: var(--slate-50); border-radius: 8px;">
            <div style="font-size: 13px; color: var(--slate-600);">Business Type: <strong>${merchant.businessType}</strong></div>
            <div style="font-size: 13px; color: var(--slate-600); margin-top: 4px;">Est. Monthly Revenue: <strong>${formatCurrency(merchant.estMonthlyRevenue)}</strong></div>
            <div style="font-size: 13px; color: var(--slate-600); margin-top: 4px;">Documents: ${merchant.documents.join(', ')}</div>
        </div>
    `;

    // Reset form
    document.querySelectorAll('.checklist input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('commissionRate').value = '2.5';
    document.getElementById('approvalNotes').value = '';

    document.getElementById('approvalModal').style.display = 'flex';
}

function closeApprovalModal() {
    document.getElementById('approvalModal').style.display = 'none';
    currentMerchantId = null;
}

function confirmApproval() {
    const checkboxes = document.querySelectorAll('.checklist input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    if (!allChecked) {
        showToast('Please complete all verification checks', 'error');
        return;
    }

    const commissionRate = document.getElementById('commissionRate').value;
    const notes = document.getElementById('approvalNotes').value;

    // Simulate API call
    const btn = document.getElementById('approveBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing...';

    setTimeout(() => {
        // Remove from pending list
        pendingMerchantsData = pendingMerchantsData.filter(m => m.id !== currentMerchantId);
        filteredData = filteredData.filter(m => m.id !== currentMerchantId);
        
        showToast('Merchant approved successfully!', 'success');
        closeApprovalModal();
        updateStats();
        renderTable();
        
        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Approve Merchant';
    }, 1500);
}

// Rejection Modal Functions
function showRejectionModal(merchantId) {
    currentMerchantId = merchantId;
    const merchant = pendingMerchantsData.find(m => m.id === merchantId);
    
    if (!merchant) return;

    const preview = document.getElementById('rejectionMerchantPreview');
    preview.innerHTML = `
        <div class="merchant-cell">
            <img src="${merchant.logo}" alt="${merchant.businessName}" class="merchant-logo" onerror="this.src='/Images/default-merchant.png'">
            <div class="merchant-info">
                <div class="merchant-name">${merchant.businessName}</div>
                <div class="merchant-owner">${merchant.ownerName} • ${merchant.email}</div>
            </div>
        </div>
    `;

    // Reset form
    document.getElementById('rejectionReason').value = '';
    document.getElementById('rejectionDetails').value = '';
    document.getElementById('allowReapply').checked = true;

    document.getElementById('rejectionModal').style.display = 'flex';
}

function closeRejectionModal() {
    document.getElementById('rejectionModal').style.display = 'none';
    currentMerchantId = null;
}

function handleReasonChange() {
    const reason = document.getElementById('rejectionReason').value;
    const detailsTextarea = document.getElementById('rejectionDetails');
    
    const templates = {
        'incomplete_docs': 'The submitted documents are incomplete or invalid. Please resubmit with all required documents.',
        'business_unverified': 'We were unable to verify your business details. Please provide additional proof of business registration.',
        'kyc_failed': 'KYC verification could not be completed. Please ensure all identity documents are valid and clear.',
        'high_risk': 'Your business category is currently classified as high-risk and not eligible for onboarding.',
        'policy_violation': 'Your application violates our platform policies.',
        'duplicate': 'A merchant account with similar details already exists in our system.'
    };

    if (templates[reason]) {
        detailsTextarea.value = templates[reason];
    }
}

function confirmRejection() {
    const reason = document.getElementById('rejectionReason').value;
    const details = document.getElementById('rejectionDetails').value.trim();

    if (!reason || !details) {
        showToast('Please select a reason and provide details', 'error');
        return;
    }

    const allowReapply = document.getElementById('allowReapply').checked;

    // Simulate API call
    const btn = document.getElementById('rejectBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing...';

    setTimeout(() => {
        // Remove from pending list
        pendingMerchantsData = pendingMerchantsData.filter(m => m.id !== currentMerchantId);
        filteredData = filteredData.filter(m => m.id !== currentMerchantId);
        
        showToast('Application rejected and merchant notified', 'success');
        closeRejectionModal();
        updateStats();
        renderTable();
        
        btn.disabled = false;
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Reject Application';
    }, 1500);
}

// Bulk Actions
function bulkApprove() {
    if (selectedMerchants.size === 0) {
        showToast('Please select merchants to approve', 'warning');
        return;
    }

    if (confirm(`Approve ${selectedMerchants.size} merchant(s)? This action cannot be undone.`)) {
        // Simulate bulk approval
        showToast(`${selectedMerchants.size} merchant(s) approved successfully!`, 'success');
        
        pendingMerchantsData = pendingMerchantsData.filter(m => !selectedMerchants.has(m.id));
        filteredData = filteredData.filter(m => !selectedMerchants.has(m.id));
        selectedMerchants.clear();
        
        updateStats();
        renderTable();
    }
}

function bulkReject() {
    if (selectedMerchants.size === 0) {
        showToast('Please select merchants to reject', 'warning');
        return;
    }

    if (confirm(`Reject ${selectedMerchants.size} merchant(s)? This action cannot be undone.`)) {
        showToast(`${selectedMerchants.size} merchant(s) rejected`, 'success');
        
        pendingMerchantsData = pendingMerchantsData.filter(m => !selectedMerchants.has(m.id));
        filteredData = filteredData.filter(m => !selectedMerchants.has(m.id));
        selectedMerchants.clear();
        
        updateStats();
        renderTable();
    }
}

// CSV Export
function exportPendingToCSV() {
    const headers = ['ID', 'Business Name', 'Owner', 'Email', 'Phone', 'Type', 'Priority', 'Documents', 'Est Revenue', 'Applied Date', 'Wait Time'];
    const rows = filteredData.map(m => [
        m.id,
        m.businessName,
        m.ownerName,
        m.email,
        m.phone,
        m.businessType,
        m.priority,
        m.documentsStatus,
        m.estMonthlyRevenue,
        m.appliedDate,
        m.waitTimeHours + 'h'
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-merchants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
