/**
 * Sidebar Navigation JavaScript
 * Handles sidebar toggle, dropdowns, and active state management
 */

document.addEventListener('DOMContentLoaded', function() {
  initSidebar();
});

function initSidebar() {
  // Initialize dropdown toggles
  const dropdownTriggers = document.querySelectorAll('.dropdown-trigger');
  
  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      toggleDropdown(this);
    });
  });
  
  // Initialize sidebar collapse button
  const collapseBtn = document.getElementById('sidebarCollapseBtn');
  if (collapseBtn) {
    collapseBtn.addEventListener('click', toggleSidebarCollapse);
  }
  
  // Set active menu item based on current page
  setActiveMenuItem();
  
  // Restore sidebar state from localStorage
  restoreSidebarState();
}

/**
 * Toggle dropdown menu
 */
function toggleDropdown(trigger) {
  const dropdown = trigger.closest('.nav-item-dropdown');
  const isOpen = dropdown.classList.contains('open');
  
  // Close other open dropdowns
  document.querySelectorAll('.nav-item-dropdown.open').forEach(item => {
    if (item !== dropdown) {
      item.classList.remove('open');
    }
  });
  
  // Toggle current dropdown
  if (isOpen) {
    dropdown.classList.remove('open');
  } else {
    dropdown.classList.add('open');
  }
}

/**
 * Toggle sidebar collapse/expand
 */
function toggleSidebarCollapse() {
  const sidebar = document.getElementById('adminSidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    
    // Save state to localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('adminSidebarCollapsed', isCollapsed);
  }
}

/**
 * Restore sidebar state from localStorage
 */
function restoreSidebarState() {
  const sidebar = document.getElementById('adminSidebar');
  const isCollapsed = localStorage.getItem('adminSidebarCollapsed') === 'true';
  
  if (sidebar && isCollapsed) {
    sidebar.classList.add('collapsed');
  }
}

/**
 * Set active menu item based on current location
 */
function setActiveMenuItem() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-item, .dropdown-item');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    
    if (href && (currentPath === href || currentPath.startsWith(href + '/'))) {
      // Mark as active
      link.classList.add('active');
      
      // Expand parent dropdown if dropdown item
      if (link.classList.contains('dropdown-item')) {
        const dropdown = link.closest('.nav-item-dropdown');
        if (dropdown) {
          dropdown.classList.add('open');
        }
      }
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Toggle sidebar on mobile
 */
function toggleSidebarMobile() {
  const sidebar = document.getElementById('adminSidebar');
  if (sidebar) {
    sidebar.classList.toggle('mobile-open');
  }
}

/**
 * Close sidebar when clicking outside on mobile
 */
document.addEventListener('click', function(e) {
  const sidebar = document.getElementById('adminSidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  
  if (sidebar && window.innerWidth < 768) {
    if (sidebarToggle && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('mobile-open');
    }
  }
});

/**
 * Handle window resize
 */
window.addEventListener('resize', function() {
  if (window.innerWidth >= 768) {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) {
      sidebar.classList.remove('mobile-open');
    }
  }
});
