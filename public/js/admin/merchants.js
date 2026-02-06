// Merchants List Page JavaScript

const merchantsData = [
  {
    id: 'MER-001',
    businessName: 'UrbanCart Retail',
    ownerName: 'Aarav Mehta',
    email: 'aarav@urbancart.in',
    businessType: 'retail',
    status: 'active',
    verification: 'verified',
    totalVolume: 1852400,
    commission: 2.5,
    registeredDate: '2025-01-10',
    logo: 'https://ui-avatars.com/api/?name=UrbanCart&background=4F46E5&color=fff&size=64'
  },
  {
    id: 'MER-002',
    businessName: 'Spice Route Kitchen',
    ownerName: 'Priya Nair',
    email: 'priya@spiceroute.in',
    businessType: 'restaurant',
    status: 'active',
    verification: 'verified',
    totalVolume: 1245600,
    commission: 3.0,
    registeredDate: '2024-12-22',
    logo: 'https://ui-avatars.com/api/?name=Spice+Route&background=10B981&color=fff&size=64'
  },
  {
    id: 'MER-003',
    businessName: 'Nova Digital Goods',
    ownerName: 'Rohan Kapoor',
    email: 'rohan@novadigital.com',
    businessType: 'online',
    status: 'pending',
    verification: 'unverified',
    totalVolume: 0,
    commission: 2.0,
    registeredDate: '2026-02-02',
    logo: 'https://ui-avatars.com/api/?name=Nova+Digital&background=F59E0B&color=fff&size=64'
  },
  {
    id: 'MER-004',
    businessName: 'BrightServe Solutions',
    ownerName: 'Ananya Das',
    email: 'ananya@brightserve.co',
    businessType: 'service',
    status: 'active',
    verification: 'verified',
    totalVolume: 845000,
    commission: 1.8,
    registeredDate: '2025-08-14',
    logo: 'https://ui-avatars.com/api/?name=BrightServe&background=3B82F6&color=fff&size=64'
  },
  {
    id: 'MER-005',
    businessName: 'Evergreen Mart',
    ownerName: 'Sanjay Rao',
    email: 'sanjay@evergreenmart.in',
    businessType: 'retail',
    status: 'suspended',
    verification: 'verified',
    totalVolume: 565000,
    commission: 2.2,
    registeredDate: '2024-09-03',
    logo: 'https://ui-avatars.com/api/?name=Evergreen&background=EF4444&color=fff&size=64'
  },
  {
    id: 'MER-006',
    businessName: 'CloudCafe',
    ownerName: 'Karan Malhotra',
    email: 'karan@cloudcafe.in',
    businessType: 'restaurant',
    status: 'pending',
    verification: 'unverified',
    totalVolume: 0,
    commission: 3.5,
    registeredDate: '2026-01-28',
    logo: 'https://ui-avatars.com/api/?name=CloudCafe&background=6366F1&color=fff&size=64'
  },
  {
    id: 'MER-007',
    businessName: 'Glow Online Studio',
    ownerName: 'Neha Sharma',
    email: 'neha@glowstudio.com',
    businessType: 'online',
    status: 'active',
    verification: 'verified',
    totalVolume: 2158000,
    commission: 2.0,
    registeredDate: '2025-03-18',
    logo: 'https://ui-avatars.com/api/?name=Glow+Studio&background=EC4899&color=fff&size=64'
  },
  {
    id: 'MER-008',
    businessName: 'Prime Service Hub',
    ownerName: 'Vikram Singh',
    email: 'vikram@primehub.in',
    businessType: 'service',
    status: 'rejected',
    verification: 'unverified',
    totalVolume: 0,
    commission: 2.7,
    registeredDate: '2025-11-11',
    logo: 'https://ui-avatars.com/api/?name=Prime+Hub&background=8B5CF6&color=fff&size=64'
  },
  {
    id: 'MER-009',
    businessName: 'Saffron Trails',
    ownerName: 'Meera Iyer',
    email: 'meera@saffrontrails.in',
    businessType: 'restaurant',
    status: 'active',
    verification: 'verified',
    totalVolume: 1320000,
    commission: 3.0,
    registeredDate: '2025-05-29',
    logo: 'https://ui-avatars.com/api/?name=Saffron+Trails&background=F97316&color=fff&size=64'
  },
  {
    id: 'MER-010',
    businessName: 'Swift Retailers',
    ownerName: 'Arjun Patel',
    email: 'arjun@swiftretail.in',
    businessType: 'retail',
    status: 'active',
    verification: 'verified',
    totalVolume: 980000,
    commission: 2.4,
    registeredDate: '2025-07-07',
    logo: 'https://ui-avatars.com/api/?name=Swift+Retail&background=14B8A6&color=fff&size=64'
  },
  {
    id: 'MER-011',
    businessName: 'ServePro Services',
    ownerName: 'Ishaan Verma',
    email: 'ishaan@servepro.in',
    businessType: 'service',
    status: 'pending',
    verification: 'unverified',
    totalVolume: 0,
    commission: 2.1,
    registeredDate: '2026-02-01',
    logo: 'https://ui-avatars.com/api/?name=ServePro&background=0EA5E9&color=fff&size=64'
  },
  {
    id: 'MER-012',
    businessName: 'ClickCart Online',
    ownerName: 'Pooja Jain',
    email: 'pooja@clickcart.in',
    businessType: 'online',
    status: 'active',
    verification: 'verified',
    totalVolume: 1765000,
    commission: 2.3,
    registeredDate: '2024-10-19',
    logo: 'https://ui-avatars.com/api/?name=ClickCart&background=22C55E&color=fff&size=64'
  }
];

// State
let filteredMerchants = [...merchantsData];
let currentPage = 1;
let rowsPerPage = 10;
let searchQuery = '';
let filters = {
  status: '',
  businessType: '',
  verification: '',
  dateFrom: '',
  dateTo: ''
};

let actionsDropdown = null;
let currentActionMerchantId = null;

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  renderTable();
  updateStats();
});

function initializeEventListeners() {
  const searchInput = document.getElementById('merchantSearch');
  const filterBtn = document.getElementById('filterBtn');
  const exportBtn = document.getElementById('exportBtn');
  const addMerchantBtn = document.getElementById('addMerchantBtn');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const rowsPerPageSelect = document.getElementById('rowsPerPage');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const selectAll = document.getElementById('selectAll');

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      const spinner = document.getElementById('searchSpinner');
      if (spinner) spinner.style.display = 'block';
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim().toLowerCase();
        applyFilters();
        if (spinner) spinner.style.display = 'none';
      }, 400);
    });
  }

  filterBtn?.addEventListener('click', () => {
    const panel = document.getElementById('filterPanel');
    if (!panel) return;
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  exportBtn?.addEventListener('click', exportToCSV);
  addMerchantBtn?.addEventListener('click', () => {
    alert('Add Merchant flow will be connected to the form page.');
  });

  applyFiltersBtn?.addEventListener('click', () => {
    filters.status = document.getElementById('filterStatus').value;
    filters.businessType = document.getElementById('filterBusinessType').value;
    filters.verification = document.getElementById('filterVerification').value;
    filters.dateFrom = document.getElementById('filterDateFrom').value;
    filters.dateTo = document.getElementById('filterDateTo').value;
    applyFilters();
    updateFilterBadge();
  });

  clearFiltersBtn?.addEventListener('click', () => {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterBusinessType').value = '';
    document.getElementById('filterVerification').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    filters = { status: '', businessType: '', verification: '', dateFrom: '', dateTo: '' };
    applyFilters();
    updateFilterBadge();
  });

  resetFiltersBtn?.addEventListener('click', () => {
    searchQuery = '';
    if (document.getElementById('merchantSearch')) {
      document.getElementById('merchantSearch').value = '';
    }
    filters = { status: '', businessType: '', verification: '', dateFrom: '', dateTo: '' };
    applyFilters();
    updateFilterBadge();
  });

  rowsPerPageSelect?.addEventListener('change', (e) => {
    rowsPerPage = parseInt(e.target.value, 10);
    currentPage = 1;
    renderTable();
  });

  prevPageBtn?.addEventListener('click', () => changePage(currentPage - 1));
  nextPageBtn?.addEventListener('click', () => changePage(currentPage + 1));

  selectAll?.addEventListener('change', (e) => {
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
    });
  });

  document.addEventListener('click', (e) => {
    if (actionsDropdown && !e.target.closest('.actions-menu-btn')) {
      actionsDropdown.style.display = 'none';
    }
  });
}

function applyFilters() {
  filteredMerchants = merchantsData.filter(merchant => {
    const matchesSearch = !searchQuery ||
      merchant.businessName.toLowerCase().includes(searchQuery) ||
      merchant.ownerName.toLowerCase().includes(searchQuery) ||
      merchant.email.toLowerCase().includes(searchQuery);

    const matchesStatus = !filters.status || merchant.status === filters.status;
    const matchesBusinessType = !filters.businessType || merchant.businessType === filters.businessType;
    const matchesVerification = !filters.verification || merchant.verification === filters.verification;

    let matchesDate = true;
    if (filters.dateFrom) {
      matchesDate = new Date(merchant.registeredDate) >= new Date(filters.dateFrom);
    }
    if (filters.dateTo && matchesDate) {
      matchesDate = new Date(merchant.registeredDate) <= new Date(filters.dateTo);
    }

    return matchesSearch && matchesStatus && matchesBusinessType && matchesVerification && matchesDate;
  });

  currentPage = 1;
  renderTable();
}

function renderTable() {
  const tableBody = document.getElementById('merchantsTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableFooter = document.getElementById('tableFooter');

  if (!tableBody) return;

  if (filteredMerchants.length === 0) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'flex';
    tableFooter.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  tableFooter.style.display = 'flex';

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredMerchants.slice(startIndex, endIndex);

  tableBody.innerHTML = paginatedData.map(merchant => createMerchantRow(merchant)).join('');

  updatePagination();
  updatePaginationInfo();
  attachRowActions();
}

function createMerchantRow(merchant) {
  const statusClass = getStatusClass(merchant.status);
  const verificationClass = merchant.verification === 'verified' ? 'badge-success' : 'badge-warning';

  return `
    <tr>
      <td class="td-checkbox" data-label="Select">
        <input type="checkbox" class="checkbox row-checkbox" data-id="${merchant.id}">
      </td>
      <td data-label="Merchant">
        <div class="merchant-cell">
          <img src="${merchant.logo}" alt="${merchant.businessName}" class="merchant-logo">
          <div class="merchant-info">
            <div class="merchant-name">${merchant.businessName}</div>
            <div class="merchant-owner">${merchant.ownerName}</div>
          </div>
        </div>
      </td>
      <td data-label="Business Type" class="text-capitalize">${merchant.businessType}</td>
      <td data-label="Status"><span class="badge ${statusClass}">${capitalizeFirst(merchant.status)}</span></td>
      <td data-label="Verification"><span class="badge ${verificationClass}">${capitalizeFirst(merchant.verification)}</span></td>
      <td data-label="Total Volume">${formatCurrency(merchant.totalVolume)}</td>
      <td data-label="Commission">${merchant.commission.toFixed(1)}%</td>
      <td data-label="Registered">${formatDate(merchant.registeredDate)}</td>
      <td class="td-actions" data-label="Actions">
        <button class="actions-menu-btn" data-id="${merchant.id}">
          <svg class="icon-18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </button>
      </td>
    </tr>
  `;
}

function attachRowActions() {
  const actionButtons = document.querySelectorAll('.actions-menu-btn');
  actionsDropdown = document.getElementById('actionsDropdown');

  actionButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentActionMerchantId = btn.getAttribute('data-id');
      showActionsDropdown(btn);
    });
  });

  if (actionsDropdown) {
    actionsDropdown.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        handleRowAction(action, currentActionMerchantId);
      });
    });
  }
}

function showActionsDropdown(button) {
  if (!actionsDropdown) return;
  const rect = button.getBoundingClientRect();
  actionsDropdown.style.display = 'block';
  actionsDropdown.style.position = 'fixed';
  actionsDropdown.style.top = `${rect.bottom + 6}px`;
  actionsDropdown.style.left = `${rect.left - 120}px`;
}

function handleRowAction(action, merchantId) {
  actionsDropdown.style.display = 'none';

  switch (action) {
    case 'view':
      alert(`View merchant details: ${merchantId}`);
      break;
    case 'verify':
      alert(`Verify merchant: ${merchantId}`);
      break;
    case 'suspend':
      alert(`Suspend merchant: ${merchantId}`);
      break;
    case 'edit':
      alert(`Edit merchant: ${merchantId}`);
      break;
    case 'delete':
      if (confirm('Are you sure you want to delete this merchant?')) {
        alert(`Merchant ${merchantId} deleted`);
      }
      break;
  }
}

function updatePagination() {
  const totalPages = Math.ceil(filteredMerchants.length / rowsPerPage);
  const paginationNumbers = document.getElementById('paginationNumbers');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');

  if (!paginationNumbers) return;

  paginationNumbers.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `btn-pagination-number ${i === currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => changePage(i));
    paginationNumbers.appendChild(pageBtn);
  }

  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
}

function updatePaginationInfo() {
  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, filteredMerchants.length);
  const info = document.getElementById('paginationInfo');
  if (info) {
    info.textContent = `Showing ${start} to ${end} of ${filteredMerchants.length} merchants`;
  }
}

function changePage(page) {
  const totalPages = Math.ceil(filteredMerchants.length / rowsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable();
}

function updateStats() {
  const total = merchantsData.length;
  const active = merchantsData.filter(m => m.status === 'active').length;
  const pending = merchantsData.filter(m => m.status === 'pending').length;
  const suspended = merchantsData.filter(m => m.status === 'suspended').length;

  document.getElementById('totalMerchants').textContent = total.toLocaleString();
  document.getElementById('activeMerchants').textContent = active.toLocaleString();
  document.getElementById('pendingMerchants').textContent = pending.toLocaleString();
  document.getElementById('suspendedMerchants').textContent = suspended.toLocaleString();
}

function updateFilterBadge() {
  const activeFilters = Object.values(filters).filter(value => value !== '').length;
  const badge = document.getElementById('filterBadge');
  if (!badge) return;

  if (activeFilters > 0) {
    badge.textContent = activeFilters;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

function exportToCSV() {
  const rows = [
    ['Merchant ID', 'Business Name', 'Owner Name', 'Email', 'Business Type', 'Status', 'Verification', 'Total Volume', 'Commission', 'Registered Date']
  ];

  filteredMerchants.forEach(m => {
    rows.push([
      m.id,
      m.businessName,
      m.ownerName,
      m.email,
      m.businessType,
      m.status,
      m.verification,
      m.totalVolume,
      m.commission,
      m.registeredDate
    ]);
  });

  const csvContent = rows.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `merchants_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getStatusClass(status) {
  const statusMap = {
    active: 'badge-success',
    pending: 'badge-warning',
    suspended: 'badge-error',
    rejected: 'badge-secondary'
  };
  return statusMap[status] || 'badge-secondary';
}
