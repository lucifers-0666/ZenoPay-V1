// Admin Settings
let hasUnsavedChanges = false;

document.addEventListener('DOMContentLoaded', function() {
    attachChangeListeners();
});

function attachChangeListeners() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            hasUnsavedChanges = true;
        });
    });

    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

function saveAllSettings() {
    if (!confirm('Save all platform settings? This will affect all users.')) {
        return;
    }

    showToast('Saving settings...', 'info');
    
    setTimeout(() => {
        hasUnsavedChanges = false;
        showToast('Settings saved successfully!', 'success');
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
