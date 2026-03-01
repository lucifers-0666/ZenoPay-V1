// 1. Sidebar collapse toggle (bottom button)
const collapseBtn = document.getElementById('sidebar-collapse-btn');
const wrapper = document.querySelector('.admin-wrapper') || document.querySelector('.admin-layout') || document.getElementById('adminLayout');

// Restore saved state on page load
if (localStorage.getItem('adminSidebarCollapsed') === 'true') {
  wrapper?.classList.add('sidebar-collapsed');
}

// Toggle on click
collapseBtn?.addEventListener('click', () => {
  if (!wrapper) return;
  wrapper.classList.toggle('sidebar-collapsed');
  const isCollapsed = wrapper.classList.contains('sidebar-collapsed');
  localStorage.setItem('adminSidebarCollapsed', isCollapsed);
});

// 2. Submenu toggle
document.querySelectorAll('.sidebar-link.has-sub').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.dataset.submenu;
    const submenu = document.getElementById(targetId);
    if (!submenu) return;
    link.classList.toggle('open');
    submenu.classList.toggle('open');
  });
});

// 3. User dropdown
document.getElementById('userMenuBtn')?.addEventListener('click', () => {
  document.getElementById('userDropdown')?.classList.toggle('show');
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('#userMenuBtn') && !e.target.closest('#userDropdown')) {
    document.getElementById('userDropdown')?.classList.remove('show');
  }
});

// 4. Toast function
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-circle' };
  const colors = { success: 'var(--green)', error: 'var(--red)', warning: 'var(--amber)' };
  toast.innerHTML = `<i class="fas ${icons[type] || icons.success}" style="color:${colors[type] || colors.success};font-size:16px"></i><span style="font-size:14px;font-weight:500">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// 5. Refresh button
document.getElementById('refreshBtn')?.addEventListener('click', function() {
  const icon = this.querySelector('i');
  if (!icon) return;

  icon.style.animation = 'spin 0.6s linear infinite';
  setTimeout(() => {
    icon.style.animation = '';
    showToast('Dashboard refreshed', 'success');
  }, 800);
});

