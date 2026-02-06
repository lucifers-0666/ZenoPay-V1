// System Configuration Page
document.addEventListener('DOMContentLoaded', function() {
    attachEventListeners();
});

function attachEventListeners() {
    // Add any event listeners needed
}

function optimizeDatabase() {
    const btn = event.target.closest('button');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Optimizing...';

    setTimeout(() => {
        showToast('Database optimization started. This may take a few minutes.', 'success');
        btn.disabled = false;
        btn.innerHTML = '⚙️ Optimize Database';
    }, 2000);
}

function backupDatabase() {
    const btn = event.target.closest('button');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating Backup...';

    setTimeout(() => {
        showToast('Database backup created successfully at backup/db-2025-01-15.tar.gz', 'success');
        btn.disabled = false;
        btn.innerHTML = '📄 Create Backup';
    }, 2500);
}

function clearCache() {
    const btn = event.target.closest('button');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Clearing...';

    setTimeout(() => {
        showToast('Cache cleared successfully! (2.1 GB freed)', 'success');
        btn.disabled = false;
        btn.innerHTML = '🔄 Clear Cache';
    }, 1500);
}

function viewCacheStats() {
    const stats = `
    Cache Statistics:
    - Total Size: 2.1 GB / 5 GB
    - Keys: 45,230
    - Hit Rate: 87.3%
    - Evictions: 1,234
    - Uptime: 45 days 12 hours
    `;
    
    alert(stats);
}

function handleSaveConfiguration(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

    setTimeout(() => {
        showToast('System configuration updated successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = '/admin/settings';
        }, 1500);
    }, 1500);
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
