(function () {
  const usersData = [
    { id: 'USR-00124', name: 'Rahul Sharma', initials: 'RS', email: 'rahul.sharma@zenopay.com', phone: '+91 98765 43210', kyc: 'Verified', role: 'User', balance: 2450, status: 'Active', joined: '2026-02-24', age: '6 days ago' },
    { id: 'USR-00125', name: 'Priya Mehta', initials: 'PM', email: 'priya.mehta@zenopay.com', phone: '+91 99881 11223', kyc: 'Pending', role: 'Merchant', balance: 18200, status: 'Active', joined: '2026-02-20', age: '10 days ago' },
    { id: 'USR-00126', name: 'Arjun Verma', initials: 'AV', email: 'arjun.verma@zenopay.com', phone: '+91 90123 44556', kyc: 'Rejected', role: 'User', balance: 540, status: 'Suspended', joined: '2026-02-18', age: '12 days ago' },
    { id: 'USR-00127', name: 'Sonia Kapoor', initials: 'SK', email: 'sonia.kapoor@zenopay.com', phone: '+91 93210 45678', kyc: 'Not Submitted', role: 'Admin', balance: 89200, status: 'Active', joined: '2026-02-11', age: '19 days ago' },
    { id: 'USR-00128', name: 'Nitin Rao', initials: 'NR', email: 'nitin.rao@zenopay.com', phone: '+91 92145 78901', kyc: 'Verified', role: 'Super Admin', balance: 305000, status: 'Inactive', joined: '2026-01-31', age: '1 month ago' },
    { id: 'USR-00129', name: 'Isha Jain', initials: 'IJ', email: 'isha.jain@zenopay.com', phone: '+91 91111 22334', kyc: 'Verified', role: 'Merchant', balance: 11990, status: 'Active', joined: '2026-02-26', age: '4 days ago' }
  ];

  const usersTableBody = document.getElementById('usersTableBody');
  const usersSkeletonBody = document.getElementById('usersSkeletonBody');
  const usersEmpty = document.getElementById('usersEmpty');
  const userSearchInput = document.getElementById('userSearchInput');
  const statusFilter = document.getElementById('statusFilter');
  const kycFilter = document.getElementById('kycFilter');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const clearFiltersEmptyBtn = document.getElementById('clearFiltersEmptyBtn');
  const bulkActionBar = document.getElementById('bulkActionBar');
  const bulkActionCount = document.getElementById('bulkActionCount');
  const bulkActionClose = document.getElementById('bulkActionClose');
  const selectAllUsers = document.getElementById('selectAllUsers');
  const rowsPerPage = document.getElementById('rowsPerPage');
  const paginationCenter = document.getElementById('paginationCenter');
  const paginationMeta = document.getElementById('paginationMeta');
  const resultsMeta = document.getElementById('resultsMeta');
  const addUserModal = document.getElementById('addUserModal');
  const closeAddUserModal = document.getElementById('closeAddUserModal');
  const cancelAddUser = document.getElementById('cancelAddUser');
  const addUserForm = document.getElementById('addUserForm');
  const passwordToggle = document.getElementById('passwordToggle');
  const passwordField = document.getElementById('passwordField');

  if (!usersTableBody) return;

  let filtered = [...usersData];
  let sortState = { key: 'name', dir: 'neutral' };
  let selectedIds = new Set();
  let currentPage = 1;

  function hashText(value) {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) hash = value.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash);
  }

  function avatarGradientClass(name) {
    return `users-avatar-grad-${hashText(name) % 6}`;
  }

  function pillKyc(kyc) {
    const map = {
      'Verified': 'users-pill users-pill-kyc-verified',
      'Pending': 'users-pill users-pill-kyc-pending',
      'Rejected': 'users-pill users-pill-kyc-rejected',
      'Not Submitted': 'users-pill users-pill-kyc-not'
    };
    const icon = {
      'Verified': 'fa-check-circle',
      'Pending': 'fa-clock',
      'Rejected': 'fa-times-circle',
      'Not Submitted': 'fa-minus-circle'
    };
    return `<span class="${map[kyc] || map['Not Submitted']}"><i class="fas ${icon[kyc] || icon['Not Submitted']}"></i>${kyc}</span>`;
  }

  function pillRole(role) {
    const map = {
      'User': { cls: 'users-pill users-pill-role-user', icon: '' },
      'Merchant': { cls: 'users-pill users-pill-role-merchant', icon: 'fa-store' },
      'Admin': { cls: 'users-pill users-pill-role-admin', icon: 'fa-shield-alt' },
      'Super Admin': { cls: 'users-pill users-pill-role-superadmin', icon: 'fa-crown' }
    };
    const item = map[role] || map.User;
    return `<span class="${item.cls}">${item.icon ? `<i class="fas ${item.icon}"></i>` : ''}${role}</span>`;
  }

  function pillStatus(status) {
    const map = {
      'Active': { cls: 'users-pill users-status-active', icon: 'fa-circle' },
      'Suspended': { cls: 'users-pill users-status-suspended', icon: 'fa-ban' },
      'Inactive': { cls: 'users-pill users-status-inactive', icon: 'fa-moon' }
    };
    const item = map[status] || map.Inactive;
    return `<span class="${item.cls}"><i class="fas ${item.icon}"></i>${status}</span>`;
  }

  function renderActions() {
    return `
      <div class="users-actions">
        <button class="users-action-btn" data-action="view" title="View profile"><i class="fas fa-eye"></i></button>
        <button class="users-action-btn" data-action="edit" title="Edit user"><i class="fas fa-user-edit"></i></button>
        <button class="users-action-btn" data-action="more" title="More"><i class="fas fa-ellipsis-v"></i></button>
        <div class="users-more-menu" hidden>
          <button class="users-more-item" type="button"><i class="fas fa-eye"></i>View Details</button>
          <button class="users-more-item" type="button"><i class="fas fa-user-edit"></i>Edit User</button>
          <button class="users-more-item" type="button"><i class="fas fa-key"></i>Reset Password</button>
          <button class="users-more-item warn" type="button"><i class="fas fa-ban"></i>Suspend User</button>
          <button class="users-more-item delete" type="button"><i class="fas fa-trash"></i>Delete Account</button>
        </div>
      </div>`;
  }

  function rowHtml(user, index) {
    const selected = selectedIds.has(user.id) ? 'users-row-selected' : '';
    return `
      <tr class="${selected}">
        <td>
          <label class="users-checkbox"><input type="checkbox" class="row-check" value="${user.id}" ${selected ? 'checked' : ''}><span class="users-checkbox-ui"><i class="fas fa-check"></i></span></label>
        </td>
        <td>
          <div class="users-cell-user">
            <div class="users-avatar ${avatarGradientClass(user.name)}">${user.initials}</div>
            <div>
              <a href="#" class="users-user-name">${user.name}</a>
              <p class="users-user-id">#${user.id}</p>
            </div>
          </div>
        </td>
        <td>
          <p class="users-contact-mail">${user.email}</p>
          <p class="users-contact-phone"><i class="fas fa-phone"></i>${user.phone}</p>
        </td>
        <td>${pillKyc(user.kyc)}</td>
        <td>${pillRole(user.role)}</td>
        <td class="users-align-right"><span class="users-balance">₹${user.balance.toLocaleString('en-IN')}.00</span></td>
        <td>${pillStatus(user.status)}</td>
        <td>
          <p class="users-joined-date">${new Date(user.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          <p class="users-joined-age">${user.age}</p>
        </td>
        <td>${renderActions(index)}</td>
      </tr>`;
  }

  function applyFilters() {
    const query = userSearchInput.value.trim().toLowerCase();
    const status = statusFilter.value.trim().toLowerCase();
    const kyc = kycFilter.value.trim().toLowerCase();
    const from = fromDate.value ? new Date(fromDate.value) : null;
    const to = toDate.value ? new Date(toDate.value) : null;

    filtered = usersData.filter((u) => {
      const matchQuery = !query || `${u.name} ${u.email} ${u.phone} ${u.id}`.toLowerCase().includes(query);
      const matchStatus = !status || u.status.toLowerCase() === status;
      const normalizedKyc = u.kyc.toLowerCase();
      const matchKyc = !kyc || normalizedKyc === kyc;
      const joinedDate = new Date(u.joined);
      const matchFrom = !from || joinedDate >= from;
      const matchTo = !to || joinedDate <= to;
      return matchQuery && matchStatus && matchKyc && matchFrom && matchTo;
    });

    const anyFilter = Boolean(query || status || kyc || fromDate.value || toDate.value);
    clearFiltersBtn.hidden = !anyFilter;
    currentPage = 1;
    renderTable();
  }

  function sortData(data) {
    if (sortState.dir === 'neutral') return data;
    const direction = sortState.dir === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = `${a[sortState.key] ?? ''}`.toLowerCase();
      const bv = `${b[sortState.key] ?? ''}`.toLowerCase();
      if (av < bv) return -1 * direction;
      if (av > bv) return 1 * direction;
      return 0;
    });
  }

  function renderPagination(total) {
    const pageSize = Number(rowsPerPage.value || 20);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (currentPage > pages) currentPage = pages;

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    const metaText = total === 0 ? 'Showing 0–0 of 0 users' : `Showing ${start}–${end} of ${total.toLocaleString('en-IN')} users`;
    paginationMeta.textContent = metaText;
    resultsMeta.textContent = metaText;

    const buttons = [];
    buttons.push(`<button class="users-page-btn" data-page="${Math.max(1, currentPage - 1)}"><i class="fas fa-chevron-left"></i></button>`);

    const windowStart = Math.max(1, currentPage - 1);
    const windowEnd = Math.min(pages, currentPage + 1);
    if (windowStart > 1) buttons.push('<button class="users-page-btn" data-page="1">1</button><span class="users-page-btn">...</span>');
    for (let p = windowStart; p <= windowEnd; p += 1) {
      buttons.push(`<button class="users-page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`);
    }
    if (windowEnd < pages) buttons.push(`<span class="users-page-btn">...</span><button class="users-page-btn" data-page="${pages}">${pages}</button>`);

    buttons.push(`<button class="users-page-btn" data-page="${Math.min(pages, currentPage + 1)}"><i class="fas fa-chevron-right"></i></button>`);
    paginationCenter.innerHTML = buttons.join('');

    paginationCenter.querySelectorAll('button[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentPage = Number(btn.dataset.page || currentPage);
        renderTable();
      });
    });

    return { start, end, pageSize };
  }

  function renderTable() {
    const sorted = sortData(filtered);
    const total = sorted.length;
    const { pageSize } = renderPagination(total);
    const offset = (currentPage - 1) * pageSize;
    const pageItems = sorted.slice(offset, offset + pageSize);

    usersEmpty.hidden = total !== 0;
    usersTable.hidden = total === 0;

    usersTableBody.innerHTML = pageItems.map(rowHtml).join('');
    bindRowEvents();
    refreshBulkBar();
  }

  function refreshBulkBar() {
    const size = selectedIds.size;
    bulkActionBar.hidden = size === 0;
    bulkActionCount.textContent = `${size} user${size === 1 ? '' : 's'} selected`;
  }

  function bindRowEvents() {
    usersTableBody.querySelectorAll('.row-check').forEach((check) => {
      check.addEventListener('change', () => {
        if (check.checked) selectedIds.add(check.value);
        else selectedIds.delete(check.value);
        check.closest('tr')?.classList.toggle('users-row-selected', check.checked);
        refreshBulkBar();
      });
    });

    usersTableBody.querySelectorAll('.users-action-btn[data-action="more"]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const menu = btn.parentElement.querySelector('.users-more-menu');
        const already = !menu.hidden;
        document.querySelectorAll('.users-more-menu').forEach((m) => { m.hidden = true; });
        menu.hidden = already;
      });
    });
  }

  function cycleSort(header) {
    const key = header.dataset.sort;
    if (!key) return;
    if (sortState.key !== key) sortState = { key, dir: 'asc' };
    else if (sortState.dir === 'asc') sortState.dir = 'desc';
    else if (sortState.dir === 'desc') sortState.dir = 'neutral';
    else sortState.dir = 'asc';

    document.querySelectorAll('.users-sortable').forEach((el) => el.classList.remove('active'));
    if (sortState.dir !== 'neutral') header.classList.add('active');
    renderTable();
  }

  function closeModal() {
    if (!addUserModal) return;
    if (window.AdminModal && typeof window.AdminModal.close === 'function') {
      window.AdminModal.close('addUserModal');
      return;
    }
    addUserModal.style.display = 'none';
    document.body.style.overflow = '';
    if (addUserForm) addUserForm.reset();
  }

  userSearchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  kycFilter.addEventListener('change', applyFilters);
  fromDate.addEventListener('change', applyFilters);
  toDate.addEventListener('change', applyFilters);

  clearFiltersBtn.addEventListener('click', () => {
    userSearchInput.value = '';
    statusFilter.value = '';
    kycFilter.value = '';
    fromDate.value = '';
    toDate.value = '';
    selectedIds.clear();
    applyFilters();
  });

  clearFiltersEmptyBtn.addEventListener('click', () => clearFiltersBtn.click());

  rowsPerPage.addEventListener('change', () => {
    currentPage = 1;
    renderTable();
  });

  selectAllUsers.addEventListener('change', () => {
    usersTableBody.querySelectorAll('.row-check').forEach((check) => {
      check.checked = selectAllUsers.checked;
      if (check.checked) selectedIds.add(check.value);
      else selectedIds.delete(check.value);
      check.closest('tr')?.classList.toggle('users-row-selected', check.checked);
    });
    refreshBulkBar();
  });

  bulkActionClose.addEventListener('click', () => {
    selectedIds.clear();
    selectAllUsers.checked = false;
    usersTableBody.querySelectorAll('.row-check').forEach((check) => {
      check.checked = false;
      check.closest('tr')?.classList.remove('users-row-selected');
    });
    refreshBulkBar();
  });

  document.querySelectorAll('.users-sortable').forEach((th) => {
    th.addEventListener('click', () => cycleSort(th));
  });

  closeAddUserModal?.addEventListener('click', closeModal);
  cancelAddUser?.addEventListener('click', closeModal);

  addUserForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const submitBtn = addUserForm.querySelector('[type="submit"]');
    const originalHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    }

    const payload = {
      fullName: addUserForm.querySelector('[name="fullName"]')?.value || '',
      email: addUserForm.querySelector('[name="email"]')?.value || '',
      phone: addUserForm.querySelector('[name="phone"]')?.value || '',
      role: addUserForm.querySelector('[name="role"]')?.value || '',
      kycStatus: addUserForm.querySelector('[name="kycStatus"]')?.value || '',
      password: addUserForm.querySelector('[name="password"]')?.value || ''
    };

    fetch('/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(async (res) => {
      let data = {};
      try {
        data = await res.json();
      } catch (_err) {
        data = {};
      }
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to create user');
      }
      return data;
    })
    .then(() => {
      closeModal();
      showToast('User created successfully', 'success');
      setTimeout(() => location.reload(), 800);
    })
    .catch(() => {
      showToast('Failed to create user. Try again.', 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml || '<i class="fas fa-check"></i> Create User';
      }
    });
  });

  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  passwordToggle.addEventListener('click', () => {
    const visible = passwordField.type === 'text';
    passwordField.type = visible ? 'password' : 'text';
    passwordToggle.innerHTML = visible ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.users-actions')) {
      document.querySelectorAll('.users-more-menu').forEach((m) => { m.hidden = true; });
    }
  });

  usersSkeletonBody.hidden = false;
  usersTableBody.innerHTML = '';
  setTimeout(() => {
    usersSkeletonBody.hidden = true;
    applyFilters();
  }, 500);
})();
