/**
 * Admin Users Management Page
 * Handles search, filter, pagination, bulk actions, and user interactions
 */

// Sample user data (15 users)
const sampleUsers = [
  {
    id: 'USR001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '+91 98765 43210',
    status: 'active',
    kyc: 'verified',
    balance: 45230,
    registered: '2025-09-15',
    lastActive: '2026-02-04 14:30',
    avatar: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=4F46E5&color=fff'
  },
  {
    id: 'USR002',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 43211',
    status: 'active',
    kyc: 'verified',
    balance: 28750,
    registered: '2025-10-22',
    lastActive: '2026-02-04 16:45',
    avatar: 'https://ui-avatars.com/api/?name=Priya+Sharma&background=10B981&color=fff'
  },
  {
    id: 'USR003',
    name: 'Amit Patel',
    email: 'amit.patel@example.com',
    phone: '+91 98765 43212',
    status: 'active',
    kyc: 'pending',
    balance: 12500,
    registered: '2025-11-05',
    lastActive: '2026-02-03 10:20',
    avatar: 'https://ui-avatars.com/api/?name=Amit+Patel&background=F59E0B&color=fff'
  },
  {
    id: 'USR004',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    phone: '+91 98765 43213',
    status: 'inactive',
    kyc: 'verified',
    balance: 8900,
    registered: '2025-08-18',
    lastActive: '2026-01-15 08:15',
    avatar: 'https://ui-avatars.com/api/?name=Sneha+Reddy&background=8B5CF6&color=fff'
  },
  {
    id: 'USR005',
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    phone: '+91 98765 43214',
    status: 'blocked',
    kyc: 'rejected',
    balance: 500,
    registered: '2025-07-30',
    lastActive: '2026-01-20 18:40',
    avatar: 'https://ui-avatars.com/api/?name=Vikram+Singh&background=EF4444&color=fff'
  },
  {
    id: 'USR006',
    name: 'Ananya Desai',
    email: 'ananya.desai@example.com',
    phone: '+91 98765 43215',
    status: 'active',
    kyc: 'verified',
    balance: 38450,
    registered: '2025-09-12',
    lastActive: '2026-02-04 12:00',
    avatar: 'https://ui-avatars.com/api/?name=Ananya+Desai&background=EC4899&color=fff'
  },
  {
    id: 'USR007',
    name: 'Rohit Mehta',
    email: 'rohit.mehta@example.com',
    phone: '+91 98765 43216',
    status: 'active',
    kyc: 'pending',
    balance: 15670,
    registered: '2025-11-28',
    lastActive: '2026-02-04 09:30',
    avatar: 'https://ui-avatars.com/api/?name=Rohit+Mehta&background=06B6D4&color=fff'
  },
  {
    id: 'USR008',
    name: 'Kavya Iyer',
    email: 'kavya.iyer@example.com',
    phone: '+91 98765 43217',
    status: 'active',
    kyc: 'verified',
    balance: 49820,
    registered: '2025-08-25',
    lastActive: '2026-02-04 15:20',
    avatar: 'https://ui-avatars.com/api/?name=Kavya+Iyer&background=14B8A6&color=fff'
  },
  {
    id: 'USR009',
    name: 'Arjun Nair',
    email: 'arjun.nair@example.com',
    phone: '+91 98765 43218',
    status: 'inactive',
    kyc: 'pending',
    balance: 3200,
    registered: '2025-10-10',
    lastActive: '2026-01-10 14:55',
    avatar: 'https://ui-avatars.com/api/?name=Arjun+Nair&background=84CC16&color=fff'
  },
  {
    id: 'USR010',
    name: 'Meera Joshi',
    email: 'meera.joshi@example.com',
    phone: '+91 98765 43219',
    status: 'active',
    kyc: 'verified',
    balance: 31250,
    registered: '2025-09-08',
    lastActive: '2026-02-04 11:40',
    avatar: 'https://ui-avatars.com/api/?name=Meera+Joshi&background=F97316&color=fff'
  },
  {
    id: 'USR011',
    name: 'Karthik Rao',
    email: 'karthik.rao@example.com',
    phone: '+91 98765 43220',
    status: 'active',
    kyc: 'pending',
    balance: 18900,
    registered: '2025-12-01',
    lastActive: '2026-02-04 13:15',
    avatar: 'https://ui-avatars.com/api/?name=Karthik+Rao&background=6366F1&color=fff'
  },
  {
    id: 'USR012',
    name: 'Divya Menon',
    email: 'divya.menon@example.com',
    phone: '+91 98765 43221',
    status: 'blocked',
    kyc: 'rejected',
    balance: 750,
    registered: '2025-07-15',
    lastActive: '2025-12-20 16:30',
    avatar: 'https://ui-avatars.com/api/?name=Divya+Menon&background=DC2626&color=fff'
  },
  {
    id: 'USR013',
    name: 'Sanjay Gupta',
    email: 'sanjay.gupta@example.com',
    phone: '+91 98765 43222',
    status: 'active',
    kyc: 'verified',
    balance: 27580,
    registered: '2025-10-18',
    lastActive: '2026-02-04 10:50',
    avatar: 'https://ui-avatars.com/api/?name=Sanjay+Gupta&background=059669&color=fff'
  },
  {
    id: 'USR014',
    name: 'Pooja Verma',
    email: 'pooja.verma@example.com',
    phone: '+91 98765 43223',
    status: 'inactive',
    kyc: 'pending',
    balance: 5400,
    registered: '2025-11-20',
    lastActive: '2026-01-25 09:10',
    avatar: 'https://ui-avatars.com/api/?name=Pooja+Verma&background=D946EF&color=fff'
  },
  {
    id: 'USR015',
    name: 'Aditya Kapoor',
    email: 'aditya.kapoor@example.com',
    phone: '+91 98765 43224',
    status: 'active',
    kyc: 'verified',
    balance: 42100,
    registered: '2025-09-30',
    lastActive: '2026-02-04 17:00',
    avatar: 'https://ui-avatars.com/api/?name=Aditya+Kapoor&background=0EA5E9&color=fff'
  }
];

// State management
let state = {
  users: [...sampleUsers],
  filteredUsers: [...sampleUsers],
  selectedUsers: [],
  currentPage: 1,
  rowsPerPage: 25,
  sortColumn: 'name',
  sortDirection: 'asc',
  filters: {
    search: '',
    status: '',
    kyc: '',
    dateFrom: '',
    dateTo: '',
    balance: 100000
  },
  filterPanelOpen: false
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  initializeEventListeners();
  renderTable();
  updatePagination();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
  // Search input with debounce
  const searchInput = document.getElementById('userSearch');
  let searchTimeout;
  searchInput.addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    document.getElementById('searchSpinner').style.display = 'block';
    
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value;
      applyFilters();
      document.getElementById('searchSpinner').style.display = 'none';
    }, 500);
  });

  // Filter button
  document.getElementById('filterBtn').addEventListener('click', toggleFilterPanel);

  // Export button
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);

  // Add user button
  document.getElementById('addUserBtn').addEventListener('click', () => {
    window.location.href = '/admin/users/create';
  });

  // Filter controls
  document.getElementById('filterStatus').addEventListener('change', updateFilterBadge);
  document.getElementById('filterKYC').addEventListener('change', updateFilterBadge);
  document.getElementById('filterDateFrom').addEventListener('change', updateFilterBadge);
  document.getElementById('filterDateTo').addEventListener('change', updateFilterBadge);
  document.getElementById('filterBalance').addEventListener('input', function(e) {
    document.getElementById('filterBalanceValue').textContent = '₹' + parseInt(e.target.value).toLocaleString('en-IN');
    updateFilterBadge();
  });

  // Filter actions
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
  document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
  document.getElementById('resetFiltersBtn').addEventListener('click', clearFilters);

  // Select all checkbox
  document.getElementById('selectAll').addEventListener('change', toggleSelectAll);

  // Rows per page
  document.getElementById('rowsPerPage').addEventListener('change', function(e) {
    state.rowsPerPage = parseInt(e.target.value);
    state.currentPage = 1;
    renderTable();
    updatePagination();
  });

  // Pagination controls
  document.getElementById('prevPage').addEventListener('click', () => changePage(state.currentPage - 1));
  document.getElementById('nextPage').addEventListener('click', () => changePage(state.currentPage + 1));

  // Bulk actions
  document.getElementById('bulkExportBtn').addEventListener('click', exportSelected);
  document.getElementById('bulkSuspendBtn').addEventListener('click', bulkSuspend);
  document.getElementById('bulkDeleteBtn').addEventListener('click', bulkDelete);

  // Close actions dropdown when clicking outside
  document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('actionsDropdown');
    if (!e.target.closest('.actions-btn') && dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    }
  });
}

/**
 * Toggle filter panel
 */
function toggleFilterPanel() {
  state.filterPanelOpen = !state.filterPanelOpen;
  const panel = document.getElementById('filterPanel');
  panel.style.display = state.filterPanelOpen ? 'block' : 'none';
}

/**
 * Update filter badge count
 */
function updateFilterBadge() {
  let activeFilters = 0;
  if (document.getElementById('filterStatus').value) activeFilters++;
  if (document.getElementById('filterKYC').value) activeFilters++;
  if (document.getElementById('filterDateFrom').value || document.getElementById('filterDateTo').value) activeFilters++;
  if (document.getElementById('filterBalance').value < 100000) activeFilters++;

  const badge = document.getElementById('filterBadge');
  if (activeFilters > 0) {
    badge.textContent = activeFilters;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Apply filters
 */
function applyFilters() {
  state.filters.status = document.getElementById('filterStatus').value;
  state.filters.kyc = document.getElementById('filterKYC').value;
  state.filters.dateFrom = document.getElementById('filterDateFrom').value;
  state.filters.dateTo = document.getElementById('filterDateTo').value;
  state.filters.balance = parseInt(document.getElementById('filterBalance').value);

  state.filteredUsers = state.users.filter(user => {
    // Search filter
    if (state.filters.search) {
      const search = state.filters.search.toLowerCase();
      const matchesSearch = user.name.toLowerCase().includes(search) ||
                           user.email.toLowerCase().includes(search) ||
                           user.phone.includes(search);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (state.filters.status && user.status !== state.filters.status) return false;

    // KYC filter
    if (state.filters.kyc && user.kyc !== state.filters.kyc) return false;

    // Date range filter
    if (state.filters.dateFrom && user.registered < state.filters.dateFrom) return false;
    if (state.filters.dateTo && user.registered > state.filters.dateTo) return false;

    // Balance filter
    if (user.balance > state.filters.balance) return false;

    return true;
  });

  state.currentPage = 1;
  renderTable();
  updatePagination();
  updateFilterBadge();
}

/**
 * Clear all filters
 */
function clearFilters() {
  document.getElementById('filterStatus').value = '';
  document.getElementById('filterKYC').value = '';
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  document.getElementById('filterBalance').value = 100000;
  document.getElementById('filterBalanceValue').textContent = '₹100,000';
  document.getElementById('userSearch').value = '';

  state.filters = {
    search: '',
    status: '',
    kyc: '',
    dateFrom: '',
    dateTo: '',
    balance: 100000
  };

  state.filteredUsers = [...state.users];
  state.currentPage = 1;
  renderTable();
  updatePagination();
  updateFilterBadge();
}

/**
 * Render users table
 */
function renderTable() {
  const tbody = document.getElementById('usersTableBody');
  const emptyState = document.getElementById('emptyState');
  const tableFooter = document.getElementById('tableFooter');

  // Sort users
  const sortedUsers = [...state.filteredUsers].sort((a, b) => {
    let aVal = a[state.sortColumn];
    let bVal = b[state.sortColumn];

    if (state.sortColumn === 'balance') {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }

    if (aVal < bVal) return state.sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return state.sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate
  const startIndex = (state.currentPage - 1) * state.rowsPerPage;
  const endIndex = startIndex + state.rowsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Show empty state if no users
  if (paginatedUsers.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'flex';
    tableFooter.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  tableFooter.style.display = 'flex';

  // Render rows
  tbody.innerHTML = paginatedUsers.map(user => createUserRow(user)).join('');

  // Attach event listeners to new elements
  attachRowEventListeners();
}

/**
 * Create user table row HTML
 */
function createUserRow(user) {
  const isSelected = state.selectedUsers.includes(user.id);
  
  const statusBadges = {
    active: { class: 'badge-success', text: 'Active' },
    inactive: { class: 'badge-secondary', text: 'Inactive' },
    suspended: { class: 'badge-warning', text: 'Suspended' },
    blocked: { class: 'badge-error', text: 'Blocked' }
  };

  const kycBadges = {
    verified: { 
      class: 'badge-success', 
      text: 'Verified',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />'
    },
    pending: { 
      class: 'badge-warning', 
      text: 'Pending',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />'
    },
    rejected: { 
      class: 'badge-error', 
      text: 'Rejected',
      icon: '<path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />'
    }
  };

  const statusBadge = statusBadges[user.status];
  const kycBadge = kycBadges[user.kyc];

  return `
    <tr class="table-row" data-user-id="${user.id}">
      <td class="td-checkbox">
        <input type="checkbox" class="checkbox row-checkbox" data-user-id="${user.id}" ${isSelected ? 'checked' : ''}>
      </td>
      <td class="td-user">
        <div class="user-cell">
          <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-email">${user.email}</div>
          </div>
        </div>
      </td>
      <td>${user.phone}</td>
      <td><span class="badge ${statusBadge.class}">${statusBadge.text}</span></td>
      <td>
        <span class="badge badge-with-icon ${kycBadge.class}">
          <svg class="icon-14" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            ${kycBadge.icon}
          </svg>
          ${kycBadge.text}
        </span>
      </td>
      <td class="td-balance">₹${user.balance.toLocaleString('en-IN')}</td>
      <td>${formatDate(user.registered)}</td>
      <td>${formatRelativeTime(user.lastActive)}</td>
      <td class="td-actions">
        <button class="actions-btn" data-user-id="${user.id}">
          <svg class="icon-20" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
          </svg>
        </button>
      </td>
    </tr>
  `;
}

/**
 * Attach event listeners to table rows
 */
function attachRowEventListeners() {
  // Row checkboxes
  document.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.addEventListener('change', function(e) {
      e.stopPropagation();
      const userId = this.dataset.userId;
      if (this.checked) {
        if (!state.selectedUsers.includes(userId)) {
          state.selectedUsers.push(userId);
        }
      } else {
        state.selectedUsers = state.selectedUsers.filter(id => id !== userId);
      }
      updateBulkActionsBar();
      updateSelectAllCheckbox();
    });
  });

  // Actions buttons
  document.querySelectorAll('.actions-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      showActionsDropdown(this, this.dataset.userId);
    });
  });

  // Row click (navigate to details)
  document.querySelectorAll('.table-row').forEach(row => {
    row.addEventListener('click', function(e) {
      if (!e.target.closest('.td-checkbox') && !e.target.closest('.td-actions')) {
        window.location.href = `/admin/users/${this.dataset.userId}`;
      }
    });
  });

  // Sortable columns
  document.querySelectorAll('.th-sortable').forEach(th => {
    th.addEventListener('click', function() {
      const sortBy = this.dataset.sort;
      if (state.sortColumn === sortBy) {
        state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortColumn = sortBy;
        state.sortDirection = 'asc';
      }
      updateSortIcons();
      renderTable();
    });
  });
}

/**
 * Show actions dropdown
 */
function showActionsDropdown(button, userId) {
  const dropdown = document.getElementById('actionsDropdown');
  const rect = button.getBoundingClientRect();
  
  dropdown.style.display = 'block';
  dropdown.style.position = 'absolute';
  dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
  dropdown.style.left = (rect.left - 150 + window.scrollX) + 'px';
  
  // Remove old listeners and add new ones
  const items = dropdown.querySelectorAll('.dropdown-item');
  items.forEach(item => {
    const newItem = item.cloneNode(true);
    item.replaceWith(newItem);
    
    newItem.addEventListener('click', function() {
      const action = this.dataset.action;
      handleUserAction(action, userId);
      dropdown.style.display = 'none';
    });
  });
}

/**
 * Handle user action from dropdown
 */
function handleUserAction(action, userId) {
  const user = state.users.find(u => u.id === userId);
  
  switch(action) {
    case 'view':
      window.location.href = `/admin/users/${userId}`;
      break;
    case 'edit':
      window.location.href = `/admin/users/${userId}/edit`;
      break;
    case 'suspend':
      if (confirm(`Suspend account for ${user.name}?`)) {
        console.log('Suspending user:', userId);
        // Add API call here
      }
      break;
    case 'block':
      if (confirm(`Block user ${user.name}? This action can be reversed later.`)) {
        console.log('Blocking user:', userId);
        // Add API call here
      }
      break;
    case 'delete':
      if (confirm(`Delete user ${user.name}? This action cannot be undone!`)) {
        console.log('Deleting user:', userId);
        // Add API call here
      }
      break;
  }
}

/**
 * Toggle select all
 */
function toggleSelectAll() {
  const checked = document.getElementById('selectAll').checked;
  const visibleUserIds = state.filteredUsers
    .slice((state.currentPage - 1) * state.rowsPerPage, state.currentPage * state.rowsPerPage)
    .map(u => u.id);
  
  if (checked) {
    visibleUserIds.forEach(id => {
      if (!state.selectedUsers.includes(id)) {
        state.selectedUsers.push(id);
      }
    });
  } else {
    state.selectedUsers = state.selectedUsers.filter(id => !visibleUserIds.includes(id));
  }
  
  renderTable();
  updateBulkActionsBar();
}

/**
 * Update select all checkbox state
 */
function updateSelectAllCheckbox() {
  const visibleUserIds = state.filteredUsers
    .slice((state.currentPage - 1) * state.rowsPerPage, state.currentPage * state.rowsPerPage)
    .map(u => u.id);
  
  const allSelected = visibleUserIds.length > 0 && visibleUserIds.every(id => state.selectedUsers.includes(id));
  document.getElementById('selectAll').checked = allSelected;
}

/**
 * Update bulk actions bar
 */
function updateBulkActionsBar() {
  const bar = document.getElementById('bulkActionsBar');
  const count = state.selectedUsers.length;
  
  if (count > 0) {
    bar.style.display = 'flex';
    document.getElementById('bulkSelectedCount').textContent = `${count} user${count > 1 ? 's' : ''} selected`;
  } else {
    bar.style.display = 'none';
  }
}

/**
 * Update sort icons
 */
function updateSortIcons() {
  document.querySelectorAll('.th-sortable').forEach(th => {
    const icon = th.querySelector('.sort-icon');
    if (th.dataset.sort === state.sortColumn) {
      icon.style.transform = state.sortDirection === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)';
      icon.style.opacity = '1';
    } else {
      icon.style.transform = 'rotate(0deg)';
      icon.style.opacity = '0.3';
    }
  });
}

/**
 * Update pagination
 */
function updatePagination() {
  const totalUsers = state.filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / state.rowsPerPage);
  const startIndex = (state.currentPage - 1) * state.rowsPerPage + 1;
  const endIndex = Math.min(startIndex + state.rowsPerPage - 1, totalUsers);

  // Update info text
  document.getElementById('paginationInfo').textContent = 
    `Showing ${startIndex} to ${endIndex} of ${totalUsers.toLocaleString('en-IN')} users`;

  // Update buttons
  document.getElementById('prevPage').disabled = state.currentPage === 1;
  document.getElementById('nextPage').disabled = state.currentPage === totalPages;

  // Render page numbers
  renderPageNumbers(totalPages);
}

/**
 * Render page numbers
 */
function renderPageNumbers(totalPages) {
  const container = document.getElementById('paginationNumbers');
  const maxVisible = 5;
  let pages = [];

  if (totalPages <= maxVisible) {
    pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    if (state.currentPage <= 3) {
      pages = [1, 2, 3, 4, '...', totalPages];
    } else if (state.currentPage >= totalPages - 2) {
      pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
      pages = [1, '...', state.currentPage - 1, state.currentPage, state.currentPage + 1, '...', totalPages];
    }
  }

  container.innerHTML = pages.map(page => {
    if (page === '...') {
      return '<span class="pagination-ellipsis">...</span>';
    }
    const active = page === state.currentPage ? 'active' : '';
    return `<button class="btn-pagination ${active}" onclick="changePage(${page})">${page}</button>`;
  }).join('');
}

/**
 * Change page
 */
function changePage(page) {
  const totalPages = Math.ceil(state.filteredUsers.length / state.rowsPerPage);
  if (page < 1 || page > totalPages) return;
  
  state.currentPage = page;
  renderTable();
  updatePagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Export to CSV
 */
function exportToCSV() {
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'KYC Status', 'Balance', 'Registered', 'Last Active'];
  const rows = state.filteredUsers.map(user => [
    user.id,
    user.name,
    user.email,
    user.phone,
    user.status,
    user.kyc,
    user.balance,
    user.registered,
    user.lastActive
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export selected users
 */
function exportSelected() {
  const selectedUsersData = state.users.filter(u => state.selectedUsers.includes(u.id));
  const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'KYC Status', 'Balance'];
  const rows = selectedUsersData.map(user => [
    user.id,
    user.name,
    user.email,
    user.phone,
    user.status,
    user.kyc,
    user.balance
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `selected_users_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Bulk suspend users
 */
function bulkSuspend() {
  if (confirm(`Suspend ${state.selectedUsers.length} selected users?`)) {
    console.log('Suspending users:', state.selectedUsers);
    // Add API call here
    state.selectedUsers = [];
    updateBulkActionsBar();
    renderTable();
  }
}

/**
 * Bulk delete users
 */
function bulkDelete() {
  if (confirm(`Delete ${state.selectedUsers.length} selected users? This action cannot be undone!`)) {
    console.log('Deleting users:', state.selectedUsers);
    // Add API call here
    state.selectedUsers = [];
    updateBulkActionsBar();
    renderTable();
  }
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format relative time
 */
function formatRelativeTime(dateTimeString) {
  const date = new Date(dateTimeString);
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return formatDate(dateTimeString.split(' ')[0]);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min ago`;
  return 'Just now';
}

// Make changePage available globally
window.changePage = changePage;
