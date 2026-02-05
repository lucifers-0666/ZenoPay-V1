/**
 * Admin Header JavaScript
 * Handles search, notifications, profile dropdown, and mobile menu
 */

document.addEventListener('DOMContentLoaded', function() {
  initHeader();
});

function initHeader() {
  // Mobile menu toggle
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('adminSidebar');
  
  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('mobile-open');
    });
  }
  
  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      location.reload();
    });
  }
  
  // Search functionality
  const searchInput = document.getElementById('headerSearch');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = this.value.trim();
        if (query) {
          // Redirect to search results page
          window.location.href = `/admin/search?q=${encodeURIComponent(query)}`;
        }
      }
    });
  }
  
  // Mark all notifications as read
  const markAllReadBtn = document.querySelector('.mark-all-read');
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', function() {
      // Mark all notifications as read
      const unreadItems = document.querySelectorAll('.notification-item.unread');
      unreadItems.forEach(item => {
        item.classList.remove('unread');
      });
      
      // Update badge
      const badge = document.querySelector('.notification-badge');
      if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
      }
      
      // TODO: Make API call to mark notifications as read
      console.log('Marking all notifications as read...');
    });
  }
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    const notificationDropdown = document.querySelector('.notification-dropdown');
    const notificationBtn = document.querySelector('.notification-btn');
    const profileDropdown = document.querySelector('.profile-dropdown');
    const profileBtn = document.querySelector('.profile-btn');
    
    // Close notification dropdown if clicking outside
    if (notificationDropdown && notificationBtn) {
      if (!notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
        // Dropdown closes via CSS :hover, no action needed
      }
    }
    
    // Close profile dropdown if clicking outside
    if (profileDropdown && profileBtn) {
      if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        // Dropdown closes via CSS :hover, no action needed
      }
    }
  });
  
  // Close mobile sidebar when clicking outside
  document.addEventListener('click', function(e) {
    if (sidebar && window.innerWidth < 768) {
      const isClickInsideSidebar = sidebar.contains(e.target);
      const isClickOnToggle = mobileMenuToggle && mobileMenuToggle.contains(e.target);
      
      if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
      }
    }
  });
}

/**
 * Load notifications from server
 */
async function loadNotifications() {
  try {
    const response = await fetch('/admin/api/notifications');
    const data = await response.json();
    
    if (data.success) {
      updateNotificationBadge(data.unreadCount);
      renderNotifications(data.notifications);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

/**
 * Update notification badge
 */
function updateNotificationBadge(count) {
  const badge = document.querySelector('.notification-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Render notifications in dropdown
 */
function renderNotifications(notifications) {
  const notificationList = document.querySelector('.notification-list');
  
  if (notificationList && notifications && notifications.length > 0) {
    notificationList.innerHTML = notifications.map(notification => `
      <a href="${notification.link}" class="notification-item ${notification.read ? '' : 'unread'}">
        <div class="notification-icon ${notification.type}">
          ${getNotificationIcon(notification.type)}
        </div>
        <div class="notification-content">
          <p class="notification-text">${notification.message}</p>
          <span class="notification-time">${formatTimeAgo(notification.createdAt)}</span>
        </div>
      </a>
    `).join('');
  }
}

/**
 * Get icon for notification type
 */
function getNotificationIcon(type) {
  const icons = {
    merchant: '<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" /></svg>',
    warning: '<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>',
    success: '<svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>'
  };
  
  return icons[type] || icons.success;
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
}
