// Bank Edit Page
document.addEventListener('DOMContentLoaded', function() {
    attachEventListeners();
});

function attachEventListeners() {
    // Add input validation listeners
    const inputs = document.querySelectorAll('.form-input-edit');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            this.style.borderColor = '';
        });
    });
}

function handleSaveBank(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Saving...';

    setTimeout(() => {
        showToast('Bank configuration updated successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = '/admin/banks';
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
