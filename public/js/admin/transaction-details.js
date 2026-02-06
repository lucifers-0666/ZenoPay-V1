// Transaction Details Page
document.addEventListener('DOMContentLoaded', function() {
    loadTransactionDetails();
});

function loadTransactionDetails() {
    // Sample transaction data from URL params or API
    const transactionId = 'TRX-2025-0234';
    document.getElementById('transactionTitle').textContent = `Transaction ${transactionId}`;
}

function downloadReceipt() {
    showToast('Generating receipt...', 'success');
    
    // Simulate download
    setTimeout(() => {
        showToast('Receipt downloaded successfully', 'success');
    }, 1500);
}

function processRefund() {
    if (!confirm('Are you sure you want to process a refund for ₹50,000? This action cannot be undone.')) {
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Processing...';

    setTimeout(() => {
        document.getElementById('transactionStatus').textContent = 'Refunded';
        document.getElementById('transactionStatus').style.background = 'var(--warning-light)';
        document.getElementById('transactionStatus').style.color = 'var(--warning)';
        
        showToast('Refund processed successfully! Receipt sent to user.', 'success');
        
        setTimeout(() => {
            window.location.href = '/admin/transactions';
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
