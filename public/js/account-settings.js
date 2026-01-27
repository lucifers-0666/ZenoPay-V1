/* ========================================
   ACCOUNT SETTINGS PAGE INTERACTIONS
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
});

/**
 * Initialize all settings page interactions
 */
function initializeSettings() {
    initializeTabNavigation();
    initializeAvatarUpload();
    initializeToggleSwitches();
    initializeFormSubmissions();
    initializeModalHandlers();
    initializeDeleteAccountFlow();
}

/* ========================================
   TAB NAVIGATION
   ======================================== */

/**
 * Initialize tab navigation for both desktop and mobile
 */
function initializeTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const mobileTabBtns = document.querySelectorAll('.mobile-tab-btn');
    
    // Desktop sidebar navigation
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Mobile tab buttons
    mobileTabBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

/**
 * Switch to a specific tab
 * @param {string} tabName - Name of the tab to switch to
 */
function switchTab(tabName) {
    // Remove active class from all nav items and tabs
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Add active class to current nav item and tab
    document.querySelector(`[data-tab="${tabName}"].nav-item`)?.classList.add('active');
    document.querySelector(`[data-tab="${tabName}"].mobile-tab-btn`)?.classList.add('active');
    document.querySelector(`#${tabName}-panel`)?.classList.add('active');
}

/* ========================================
   AVATAR UPLOAD
   ======================================== */

/**
 * Initialize avatar upload functionality
 */
function initializeAvatarUpload() {
    const uploadBtn = document.querySelector('.avatar-upload-btn');
    const fileInput = document.querySelector('#avatar-upload');
    const avatarPreview = document.querySelector('.avatar-preview img');
    
    if (!uploadBtn || !fileInput) return;
    
    // Trigger file input on button click
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        handleAvatarUpload(e);
    });
}

/**
 * Handle avatar file upload and preview
 * @param {Event} event - Change event from file input
 */
function handleAvatarUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('error', 'Please select an image file');
        return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('error', 'File size must be less than 5MB');
        return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarPreview = document.querySelector('.avatar-preview img');
        if (avatarPreview) {
            avatarPreview.src = e.target.result;
        }
        
        // Upload to server
        uploadAvatarToServer(file);
    };
    reader.readAsDataURL(file);
}

/**
 * Upload avatar to server
 * @param {File} file - Avatar file to upload
 */
function uploadAvatarToServer(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Show loading state
    const uploadBtn = document.querySelector('.avatar-upload-btn');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    uploadBtn.disabled = true;
    
    fetch('/account-settings/avatar', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Avatar updated successfully');
        } else {
            showToast('error', data.message || 'Failed to upload avatar');
        }
    })
    .catch(error => {
        console.error('Avatar upload error:', error);
        showToast('error', 'Failed to upload avatar');
    })
    .finally(() => {
        uploadBtn.innerHTML = originalText;
        uploadBtn.disabled = false;
    });
}

/* ========================================
   FORM SUBMISSIONS
   ======================================== */

/**
 * Initialize form submission handlers
 */
function initializeFormSubmissions() {
    const profileForm = document.querySelector('#profile-form');
    
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleProfileFormSubmit();
        });
    }
}

/**
 * Handle profile form submission
 */
function handleProfileFormSubmit() {
    const form = document.querySelector('#profile-form');
    const formData = new FormData(form);
    
    const submitBtn = form.querySelector('[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    fetch('/account-settings/profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(formData))
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Profile updated successfully');
            showSaveIndicator();
        } else {
            showToast('error', data.message || 'Failed to update profile');
        }
    })
    .catch(error => {
        console.error('Form submission error:', error);
        showToast('error', 'Failed to update profile');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

/**
 * Show save indicator after successful save
 */
function showSaveIndicator() {
    const form = document.querySelector('#profile-form');
    const existingIndicator = form.querySelector('.save-indicator');
    
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.innerHTML = '<i class="fas fa-check-circle"></i> Saved';
    
    const formActions = form.querySelector('.form-actions');
    if (formActions) {
        formActions.appendChild(indicator);
        
        setTimeout(() => {
            indicator.remove();
        }, 3000);
    }
}

/* ========================================
   TOGGLE SWITCHES
   ======================================== */

/**
 * Initialize all toggle switches
 */
function initializeToggleSwitches() {
    const toggles = document.querySelectorAll('.toggle-switch input');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            handleToggleChange(this);
        });
    });
}

/**
 * Handle toggle switch change
 * @param {HTMLInputElement} toggleInput - The toggle input element
 */
function handleToggleChange(toggleInput) {
    const toggleName = toggleInput.getAttribute('name');
    const isChecked = toggleInput.checked;
    const cardDiv = toggleInput.closest('.settings-card');
    
    // Show loading indicator
    const toggleSwitch = toggleInput.closest('.toggle-switch');
    const originalState = isChecked;
    toggleInput.disabled = true;
    
    // Determine the endpoint based on context
    const tabPanel = cardDiv.closest('.tab-panel');
    let endpoint = '/account-settings';
    
    if (tabPanel.id === 'notifications-panel') {
        endpoint = '/account-settings/notifications';
    } else if (tabPanel.id === 'privacy-panel') {
        endpoint = '/account-settings/privacy';
    } else if (tabPanel.id === 'security-panel') {
        endpoint = '/account-settings/security';
    }
    
    // Send to server
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            [toggleName]: isChecked
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Settings updated');
        } else {
            // Revert toggle on error
            toggleInput.checked = !originalState;
            showToast('error', data.message || 'Failed to update settings');
        }
    })
    .catch(error => {
        console.error('Toggle error:', error);
        toggleInput.checked = !originalState;
        showToast('error', 'Failed to update settings');
    })
    .finally(() => {
        toggleInput.disabled = false;
    });
}

/* ========================================
   MODAL HANDLERS
   ======================================== */

/**
 * Initialize modal handlers
 */
function initializeModalHandlers() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeModal(modal.id);
            });
        }
        
        if (overlay) {
            overlay.addEventListener('click', function() {
                closeModal(modal.id);
            });
        }
    });
}

/**
 * Open a modal
 * @param {string} modalId - ID of the modal to open
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close a modal
 * @param {string} modalId - ID of the modal to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/* ========================================
   DELETE ACCOUNT FLOW
   ======================================== */

/**
 * Initialize delete account flow
 */
function initializeDeleteAccountFlow() {
    const deleteBtn = document.querySelector('.delete-account-btn');
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('delete-account-modal');
        });
    }
    
    // Handle confirm ID input
    const idInput = document.querySelector('#confirm-zenopay-id');
    const confirmDeleteBtn = document.querySelector('#confirm-delete-btn');
    const actualId = document.querySelector('[data-zenopay-id]')?.getAttribute('data-zenopay-id');
    
    if (idInput && confirmDeleteBtn && actualId) {
        idInput.addEventListener('input', function() {
            // Enable delete button only if ID matches
            const isMatch = this.value.trim() === actualId;
            confirmDeleteBtn.disabled = !isMatch;
        });
        
        // Handle confirm delete
        confirmDeleteBtn.addEventListener('click', function() {
            handleDeleteAccount(idInput.value);
        });
    }
}

/**
 * Handle account deletion
 * @param {string} confirmedId - The confirmed ZenoPay ID
 */
function handleDeleteAccount(confirmedId) {
    if (!confirmedId) {
        showToast('error', 'Please confirm your ZenoPay ID');
        return;
    }
    
    const confirmBtn = document.querySelector('#confirm-delete-btn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    confirmBtn.disabled = true;
    
    fetch('/account-settings/delete-account', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            confirmationId: confirmedId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('success', 'Account deleted successfully. Redirecting...');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else {
            showToast('error', data.message || 'Failed to delete account');
            confirmBtn.innerHTML = originalText;
            confirmBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Delete account error:', error);
        showToast('error', 'Failed to delete account');
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    });
}

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */

/**
 * Show a toast notification
 * @param {string} type - Type of toast ('success' or 'error')
 * @param {string} message - Message to display
 */
function showToast(type, message) {
    // Check if container exists, create if not
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    if (!date) return 'Never';
    
    const d = new Date(date);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return d.toLocaleDateString('en-US', options);
}

/**
 * Get device icon based on device type
 * @param {string} deviceType - Type of device
 * @returns {string} Font Awesome icon class
 */
function getDeviceIcon(deviceType) {
    const type = deviceType?.toLowerCase() || '';
    
    if (type.includes('mobile') || type.includes('phone')) {
        return 'fa-mobile-alt';
    } else if (type.includes('tablet') || type.includes('ipad')) {
        return 'fa-tablet-alt';
    } else if (type.includes('windows') || type.includes('linux') || type.includes('mac')) {
        return 'fa-laptop';
    }
    
    return 'fa-desktop';
}

/* ========================================
   KEYBOARD NAVIGATION
   ======================================== */

/**
 * Initialize keyboard navigation support
 */
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Close modal on Escape
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal.active');
            activeModals.forEach(modal => {
                closeModal(modal.id);
            });
        }
        
        // Navigate tabs with arrow keys
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const activeNav = document.querySelector('.nav-item.active');
            if (activeNav && activeNav.closest('.settings-sidebar')) {
                const allNavs = Array.from(document.querySelectorAll('.nav-item'));
                const currentIndex = allNavs.indexOf(activeNav);
                
                let nextIndex;
                if (e.key === 'ArrowLeft') {
                    nextIndex = Math.max(0, currentIndex - 1);
                } else {
                    nextIndex = Math.min(allNavs.length - 1, currentIndex + 1);
                }
                
                if (nextIndex !== currentIndex) {
                    allNavs[nextIndex].click();
                }
            }
        }
    });
}

// Initialize keyboard navigation on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKeyboardNavigation);
} else {
    initializeKeyboardNavigation();
}

/* ========================================
   PAGE READY EVENT
   ======================================== */

// Dispatch custom event when settings are fully loaded
window.addEventListener('load', function() {
    const event = new CustomEvent('accountSettingsReady', { detail: {} });
    window.dispatchEvent(event);
});
