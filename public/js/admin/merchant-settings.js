// Merchant Settings Page
let originalSettings = {};
let hasUnsavedChanges = false;

document.addEventListener('DOMContentLoaded', function() {
    captureOriginalSettings();
    attachChangeListeners();
});

function captureOriginalSettings() {
    originalSettings = {
        commissionRate: document.getElementById('commissionRate').value,
        fixedFee: document.getElementById('fixedFee').value,
        settlementFee: document.getElementById('settlementFee').value,
        refundFee: document.getElementById('refundFee').value,
        dailyLimit: document.getElementById('dailyLimit').value,
        monthlyLimit: document.getElementById('monthlyLimit').value,
        perTxnLimit: document.getElementById('perTxnLimit').value,
        minTxnAmount: document.getElementById('minTxnAmount').value,
        settlementCycle: document.getElementById('settlementCycle').value,
        autoSettlement: document.getElementById('autoSettlement').checked,
        minSettlementAmount: document.getElementById('minSettlementAmount').value,
        cardPayments: document.getElementById('cardPayments').checked,
        upiPayments: document.getElementById('upiPayments').checked,
        netBanking: document.getElementById('netBanking').checked,
        walletPayments: document.getElementById('walletPayments').checked,
        refundsAllowed: document.getElementById('refundsAllowed').checked,
        dynamicQR: document.getElementById('dynamicQR').checked,
        apiAccess: document.getElementById('apiAccess').checked,
        webhooks: document.getElementById('webhooks').checked,
        riskLevel: document.getElementById('riskLevel').value,
        fraudDetection: document.getElementById('fraudDetection').checked,
        velocityChecks: document.getElementById('velocityChecks').checked,
        manualReviewThreshold: document.getElementById('manualReviewThreshold').value,
        txnAlerts: document.getElementById('txnAlerts').checked,
        settlementAlerts: document.getElementById('settlementAlerts').checked,
        disputeAlerts: document.getElementById('disputeAlerts').checked
    };
}

function attachChangeListeners() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            hasUnsavedChanges = true;
        });
    });

    // Warn before leaving if unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

function saveSettings() {
    // Validate inputs
    if (!validateSettings()) {
        return;
    }

    // Show confirmation
    if (!confirm('Save all changes to merchant settings?')) {
        return;
    }

    // Simulate API call
    showToast('Saving settings...', 'info');
    
    setTimeout(() => {
        hasUnsavedChanges = false;
        captureOriginalSettings();
        showToast('Settings saved successfully!', 'success');
    }, 1500);
}

function validateSettings() {
    const commissionRate = parseFloat(document.getElementById('commissionRate').value);
    const dailyLimit = parseFloat(document.getElementById('dailyLimit').value);
    const monthlyLimit = parseFloat(document.getElementById('monthlyLimit').value);
    const perTxnLimit = parseFloat(document.getElementById('perTxnLimit').value);

    if (commissionRate < 0 || commissionRate > 10) {
        showToast('Commission rate must be between 0% and 10%', 'error');
        return false;
    }

    if (perTxnLimit > dailyLimit) {
        showToast('Per transaction limit cannot exceed daily limit', 'error');
        return false;
    }

    if (dailyLimit > monthlyLimit) {
        showToast('Daily limit cannot exceed monthly limit', 'error');
        return false;
    }

    return true;
}

function resetToDefaults() {
    if (!confirm('Reset all settings to default values? This will discard all current changes.')) {
        return;
    }

    // Default values
    document.getElementById('commissionRate').value = '2.5';
    document.getElementById('fixedFee').value = '0';
    document.getElementById('settlementFee').value = '0';
    document.getElementById('refundFee').value = '0';
    document.getElementById('dailyLimit').value = '500000';
    document.getElementById('monthlyLimit').value = '10000000';
    document.getElementById('perTxnLimit').value = '50000';
    document.getElementById('minTxnAmount').value = '10';
    document.getElementById('settlementCycle').value = 'T+1';
    document.getElementById('autoSettlement').checked = true;
    document.getElementById('minSettlementAmount').value = '1000';
    
    // Features
    document.getElementById('cardPayments').checked = true;
    document.getElementById('upiPayments').checked = true;
    document.getElementById('netBanking').checked = true;
    document.getElementById('walletPayments').checked = true;
    document.getElementById('refundsAllowed').checked = true;
    document.getElementById('dynamicQR').checked = true;
    document.getElementById('apiAccess').checked = true;
    document.getElementById('webhooks').checked = false;
    
    // Risk
    document.getElementById('riskLevel').value = 'low';
    document.getElementById('fraudDetection').checked = true;
    document.getElementById('velocityChecks').checked = true;
    document.getElementById('manualReviewThreshold').value = '100000';
    
    // Notifications
    document.getElementById('txnAlerts').checked = true;
    document.getElementById('settlementAlerts').checked = true;
    document.getElementById('disputeAlerts').checked = true;

    hasUnsavedChanges = true;
    showToast('Settings reset to defaults', 'success');
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
