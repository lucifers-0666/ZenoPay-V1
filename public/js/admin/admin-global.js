/**
 * Admin Global JavaScript
 * Global functions and utilities for admin panel
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips, popovers, etc.
  initializeUI();
  
  // Setup AJAX defaults
  setupAjax();
  
  // Setup event listeners
  setupEventListeners();
});

/**
 * Initialize UI components
 */
function initializeUI() {
  // Initialize any plugins or custom UI
  console.log('Admin UI initialized');
}

/**
 * Setup AJAX defaults
 */
function setupAjax() {
  // Setup CSRF token for AJAX requests
  const token = document.querySelector('meta[name="csrf-token"]');
  if (token) {
    fetch.defaults = {
      headers: {
        'X-CSRF-Token': token.content
      }
    };
  }
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
  // Sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
  }
  
  // Form submission handlers
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
  });
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    
    // Store preference
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  const alertClass = {
    'success': 'alert-success',
    'error': 'alert-error',
    'warning': 'alert-warning',
    'info': 'alert-info'
  }[type] || 'alert-info';
  
  const alert = document.createElement('div');
  alert.className = `alert ${alertClass}`;
  alert.innerHTML = message;
  alert.style.position = 'fixed';
  alert.style.top = '20px';
  alert.style.right = '20px';
  alert.style.maxWidth = '400px';
  alert.style.zIndex = '9999';
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 5000);
}

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
  // Add loading state
  const submitBtn = this.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
  }
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = '₦') {
  return currency + ' ' + parseFloat(amount).toLocaleString();
}

/**
 * Format date
 */
function formatDate(date, format = 'short') {
  const options = format === 'long' 
    ? { year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' };
  
  return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Confirm action
 */
function confirmAction(message) {
  return confirm(message || 'Are you sure?');
}

// Restore sidebar state on page load
window.addEventListener('load', function() {
  const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  const sidebar = document.getElementById('adminSidebar');
  if (sidebar && sidebarCollapsed) {
    sidebar.classList.add('collapsed');
  }
});
