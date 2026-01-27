/* ========================================
   VERIFICATION STATUS INTERACTIONS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    initRejectionToggle();
    initRefreshButton();
});

function initRejectionToggle() {
    const toggle = document.getElementById('toggle-reasons');
    const list = document.getElementById('rejection-list');
    if (!toggle || !list) return;

    let open = true;
    toggle.addEventListener('click', () => {
        open = !open;
        list.style.display = open ? 'grid' : 'none';
        toggle.querySelector('i').className = open ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
    });
}

function initRefreshButton() {
    const btn = document.getElementById('refresh-status');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing';
        try {
            const res = await fetch('/kyc/status');
            const data = await res.json();
            if (data.success) {
                const current = (window.__KYC_STATUS__ || {}).status;
                if (data.kycStatus !== current) {
                    window.location.reload();
                } else {
                    showToast('Status unchanged. Still ' + data.kycStatus);
                }
            } else {
                showToast(data.message || 'Unable to fetch status');
            }
        } catch (err) {
            showToast('Network error while refreshing');
        } finally {
            btn.disabled = false;
            btn.innerHTML = original;
        }
    });
}

function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
