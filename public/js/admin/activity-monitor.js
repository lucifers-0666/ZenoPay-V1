/**
 * Activity Monitor JavaScript
 * Handles real-time activity feed, filters, auto-refresh, and infinite scroll
 */

let autoRefreshInterval = null;
let autoRefreshEnabled = false;
let currentPage = 1;
let isLoading = false;
let allActivities = [];

// Activity type configurations
const activityTypes = {
  login: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />',
    color: '#3B82F6',
    className: 'type-login'
  },
  transaction: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.125-1.125v.375c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-2.25a1.125 1.125 0 0 1 1.125-1.125H20.25M3.75 15h16.5v-3h-16.5z" />',
    color: '#10B981',
    className: 'type-transaction'
  },
  user_registration: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />',
    color: '#3B82F6',
    className: 'type-user'
  },
  merchant: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l4.318-4.318A4.5 4.5 0 0 1 12 3c1.178 0 2.267.452 3.068 1.215l4.318 4.318a3.004 3.004 0 0 1-.621 4.72" />',
    color: '#8B5CF6',
    className: 'type-merchant'
  },
  bank: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />',
    color: '#10B981',
    className: 'type-bank'
  },
  system: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />',
    color: '#64748B',
    className: 'type-system'
  },
  error: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />',
    color: '#EF4444',
    className: 'type-error'
  },
  security: {
    icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />',
    color: '#F59E0B',
    className: 'type-security'
  }
};

// Generate sample activity data
function generateSampleActivities() {
  const activities = [
    { type: 'login', action: 'Admin login', detail: 'from new location', user: 'Rajesh Kumar', ip: '192.168.1.100', time: 2 },
    { type: 'transaction', action: 'Transaction completed', detail: 'Payment of ₹12,500', user: 'Priya Sharma', ip: '192.168.1.105', time: 15 },
    { type: 'user_registration', action: 'New user registered', detail: 'Email verification pending', user: 'Amit Patel', ip: '192.168.1.112', time: 30 },
    { type: 'merchant', action: 'Merchant application', detail: 'submitted for review', user: 'TechStore Pro', ip: '192.168.1.120', time: 45 },
    { type: 'bank', action: 'Bank account verified', detail: 'HDFC Bank', user: 'Sneha Reddy', ip: '192.168.1.88', time: 60 },
    { type: 'system', action: 'System backup', detail: 'completed successfully', user: 'System', ip: 'Internal', time: 75 },
    { type: 'transaction', action: 'Transaction refunded', detail: 'Amount: ₹5,200', user: 'Vikram Singh', ip: '192.168.1.95', time: 90 },
    { type: 'error', action: 'Payment failed', detail: 'Insufficient funds', user: 'Anita Desai', ip: '192.168.1.102', time: 105 },
    { type: 'login', action: 'User login', detail: 'Mobile app', user: 'Ravi Kumar', ip: '192.168.1.115', time: 120 },
    { type: 'security', action: 'Security alert', detail: 'Multiple failed login attempts', user: 'Security System', ip: '192.168.1.200', time: 135 },
    { type: 'merchant', action: 'Merchant approved', detail: 'API keys generated', user: 'Fashion Hub', ip: '192.168.1.125', time: 150 },
    { type: 'transaction', action: 'Transaction initiated', detail: 'Payment of ₹8,900', user: 'Deepak Mehta', ip: '192.168.1.108', time: 180 },
    { type: 'user_registration', action: 'Email verified', detail: 'Account activated', user: 'Kavita Iyer', ip: '192.168.1.130', time: 210 },
    { type: 'bank', action: 'Bank added', detail: 'ICICI Bank account linked', user: 'Suresh Nair', ip: '192.168.1.90', time: 240 },
    { type: 'system', action: 'Database optimization', detail: 'Performance improved', user: 'System', ip: 'Internal', time: 270 },
    { type: 'error', action: 'API timeout', detail: 'Gateway not responding', user: 'Payment Gateway', ip: 'External', time: 300 },
    { type: 'transaction', action: 'Transaction pending', detail: 'Awaiting confirmation', user: 'Meera Joshi', ip: '192.168.1.110', time: 360 },
    { type: 'login', action: 'Admin logout', detail: 'Session ended', user: 'Admin User', ip: '192.168.1.100', time: 420 },
    { type: 'security', action: 'Password changed', detail: 'Security update', user: 'Rohit Gupta', ip: '192.168.1.118', time: 480 },
    { type: 'merchant', action: 'Merchant suspended', detail: 'Policy violation', user: 'BookWorld', ip: '192.168.1.122', time: 540 }
  ];

  return activities;
}

document.addEventListener('DOMContentLoaded', function() {
  initActivityMonitor();
});

function initActivityMonitor() {
  allActivities = generateSampleActivities();
  
  // Initial render
  renderActivityFeed();
  
  // Initialize auto-refresh toggle
  initAutoRefresh();
  
  // Initialize filters
  initFilters();
  
  // Initialize infinite scroll
  initInfiniteScroll();
  
  // Initialize manual refresh button
  initManualRefresh();
  
  // Update last update time
  updateLastUpdateTime();
}

/**
 * Render activity feed
 */
function renderActivityFeed() {
  const container = document.getElementById('activityFeedContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  allActivities.forEach(activity => {
    const activityItem = createActivityItem(activity);
    container.appendChild(activityItem);
  });
}

/**
 * Create activity item element
 */
function createActivityItem(activity) {
  const config = activityTypes[activity.type] || activityTypes.system;
  
  const item = document.createElement('div');
  item.className = 'activity-feed-item';
  
  item.innerHTML = `
    <div class="activity-timeline-marker ${config.className}"></div>
    <div class="activity-icon-badge ${config.className}">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        ${config.icon}
      </svg>
    </div>
    <div class="activity-body">
      <p class="activity-text">
        <strong>${activity.action}</strong> ${activity.detail}
      </p>
      <div class="activity-meta">
        <span class="activity-user">${activity.user}</span>
        <span class="activity-separator">•</span>
        <span class="activity-ip">${activity.ip}</span>
        <span class="activity-separator">•</span>
        <span class="activity-time">${getRelativeTime(activity.time)}</span>
      </div>
    </div>
    <button class="activity-action-btn" title="View details">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    </button>
  `;
  
  // Add click event for details
  const detailsBtn = item.querySelector('.activity-action-btn');
  detailsBtn.addEventListener('click', () => showActivityDetails(activity));
  
  return item;
}

/**
 * Get relative time string
 */
function getRelativeTime(seconds) {
  if (seconds < 60) return `${seconds} seconds ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Initialize auto-refresh toggle
 */
function initAutoRefresh() {
  const toggle = document.getElementById('autoRefreshToggle');
  if (!toggle) return;
  
  toggle.addEventListener('click', function() {
    autoRefreshEnabled = !autoRefreshEnabled;
    toggle.classList.toggle('active');
    
    if (autoRefreshEnabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  });
}

/**
 * Start auto-refresh
 */
function startAutoRefresh() {
  stopAutoRefresh(); // Clear any existing interval
  
  autoRefreshInterval = setInterval(() => {
    refreshActivityFeed();
  }, 5000); // Refresh every 5 seconds
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

/**
 * Refresh activity feed
 */
function refreshActivityFeed() {
  // In a real application, fetch new activities from server
  // For demo, we'll just update the timestamp
  updateLastUpdateTime();
  
  // Optionally add a new random activity
  if (Math.random() > 0.5) {
    const newActivity = generateSampleActivities()[Math.floor(Math.random() * 5)];
    newActivity.time = 0; // Just now
    
    const container = document.getElementById('activityFeedContainer');
    if (container) {
      const newItem = createActivityItem(newActivity);
      newItem.style.opacity = '0';
      container.insertBefore(newItem, container.firstChild);
      
      // Fade in animation
      setTimeout(() => {
        newItem.style.transition = 'opacity 0.3s';
        newItem.style.opacity = '1';
      }, 10);
    }
  }
}

/**
 * Initialize filters
 */
function initFilters() {
  const activityTypeFilter = document.getElementById('activityTypeFilter');
  const timeRangeFilter = document.getElementById('timeRangeFilter');
  const searchInput = document.getElementById('activitySearch');
  
  if (activityTypeFilter) {
    activityTypeFilter.addEventListener('change', applyFilters);
  }
  
  if (timeRangeFilter) {
    timeRangeFilter.addEventListener('change', applyFilters);
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', debounce(applyFilters, 300));
  }
}

/**
 * Apply filters to activity feed
 */
function applyFilters() {
  const activityType = document.getElementById('activityTypeFilter')?.value || 'all';
  const timeRange = parseInt(document.getElementById('timeRangeFilter')?.value || '24');
  const searchQuery = document.getElementById('activitySearch')?.value.toLowerCase() || '';
  
  let filtered = allActivities;
  
  // Filter by activity type
  if (activityType !== 'all') {
    filtered = filtered.filter(a => a.type === activityType);
  }
  
  // Filter by time range (in hours)
  const maxSeconds = timeRange * 3600;
  filtered = filtered.filter(a => a.time <= maxSeconds);
  
  // Filter by search query
  if (searchQuery) {
    filtered = filtered.filter(a => 
      a.action.toLowerCase().includes(searchQuery) ||
      a.detail.toLowerCase().includes(searchQuery) ||
      a.user.toLowerCase().includes(searchQuery) ||
      a.ip.toLowerCase().includes(searchQuery)
    );
  }
  
  // Re-render feed
  const container = document.getElementById('activityFeedContainer');
  if (container) {
    container.innerHTML = '';
    filtered.forEach(activity => {
      const item = createActivityItem(activity);
      container.appendChild(item);
    });
  }
}

/**
 * Initialize infinite scroll
 */
function initInfiniteScroll() {
  const container = document.getElementById('activityFeedContainer');
  if (!container) return;
  
  container.addEventListener('scroll', () => {
    if (isLoading) return;
    
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    // Check if scrolled near bottom
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMoreActivities();
    }
  });
}

/**
 * Load more activities (for infinite scroll)
 */
function loadMoreActivities() {
  const loader = document.getElementById('feedLoader');
  if (!loader) return;
  
  isLoading = true;
  loader.style.display = 'block';
  
  // Simulate loading delay
  setTimeout(() => {
    // In real app, fetch more activities from server
    // For demo, just hide loader
    loader.style.display = 'none';
    isLoading = false;
  }, 1000);
}

/**
 * Initialize manual refresh button
 */
function initManualRefresh() {
  const btn = document.getElementById('manualRefreshBtn');
  if (!btn) return;
  
  btn.addEventListener('click', function() {
    // Add spin animation
    this.style.transform = 'rotate(360deg)';
    this.style.transition = 'transform 0.5s';
    
    refreshActivityFeed();
    
    setTimeout(() => {
      this.style.transform = '';
    }, 500);
  });
}

/**
 * Update last update time
 */
function updateLastUpdateTime() {
  const timeElement = document.getElementById('lastUpdateTime');
  if (timeElement) {
    timeElement.textContent = 'just now';
  }
}

/**
 * Show activity details
 */
function showActivityDetails(activity) {
  // In real app, show modal or navigate to detail page
  alert(`Activity Details:\n\nType: ${activity.type}\nAction: ${activity.action}\nDetail: ${activity.detail}\nUser: ${activity.user}\nIP: ${activity.ip}\nTime: ${getRelativeTime(activity.time)}`);
}

/**
 * Debounce utility
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
