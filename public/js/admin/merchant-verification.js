// Merchant Verification Page
let verificationState = {
    gstVerified: false,
    panVerified: false,
    licenseVerified: false,
    addressVerified: false,
    ownerPanVerified: false,
    aadhaarVerified: false,
    photoVerified: false,
    bankStatementVerified: false,
    cancelledChequeVerified: false
};

document.addEventListener('DOMContentLoaded', function() {
    updateProgress();
});

function updateProgress() {
    // Get all checkbox states
    Object.keys(verificationState).forEach(key => {
        const checkbox = document.getElementById(key);
        if (checkbox) {
            verificationState[key] = checkbox.checked;
        }
    });

    // Calculate progress
    const total = Object.keys(verificationState).length;
    const verified = Object.values(verificationState).filter(v => v).length;
    const percentage = Math.round((verified / total) * 100);

    // Update UI
    document.getElementById('progressPercentage').textContent = percentage + '%';
    document.getElementById('progressBar').style.width = percentage + '%';
    document.getElementById('verifiedCount').textContent = verified;

    // Update status badges
    const docsComplete = verificationState.gstVerified && verificationState.panVerified && 
                         verificationState.licenseVerified && verificationState.addressVerified;
    const kycComplete = verificationState.ownerPanVerified && verificationState.aadhaarVerified && 
                        verificationState.photoVerified;
    const bankComplete = verificationState.bankStatementVerified && verificationState.cancelledChequeVerified;

    updateStatusBadge('docsStatus', docsComplete);
    updateStatusBadge('kycStatus', kycComplete);
    updateStatusBadge('bankStatus', bankComplete);

    // Update overall status
    if (percentage === 100) {
        const overallStatus = document.getElementById('overallStatus');
        overallStatus.textContent = 'Ready for Approval';
        overallStatus.className = 'badge-success';
        document.getElementById('completeBtn').disabled = false;
    } else {
        const overallStatus = document.getElementById('overallStatus');
        overallStatus.textContent = 'In Progress';
        overallStatus.className = 'badge-warning';
        document.getElementById('completeBtn').disabled = true;
    }

    // Update progress steps
    updateProgressSteps(percentage);
}

function updateStatusBadge(elementId, isComplete) {
    const badge = document.getElementById(elementId);
    if (isComplete) {
        badge.textContent = 'Verified';
        badge.className = 'badge-success';
    } else {
        badge.textContent = 'Pending Review';
        badge.className = 'badge-warning';
    }
}

function updateProgressSteps(percentage) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
        if (percentage >= (index + 1) * 25) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function viewDocument(docType) {
    showToast('Opening document viewer...', 'info');
    // Implement document viewer
}

function verifyDocument(docType) {
    const mapping = {
        'gst': 'gstVerified',
        'pan': 'panVerified',
        'license': 'licenseVerified',
        'address': 'addressVerified',
        'owner-pan': 'ownerPanVerified',
        'aadhaar': 'aadhaarVerified',
        'photo': 'photoVerified',
        'bank-statement': 'bankStatementVerified',
        'cancelled-cheque': 'cancelledChequeVerified'
    };

    const checkboxId = mapping[docType];
    if (checkboxId) {
        document.getElementById(checkboxId).checked = true;
        updateProgress();
        showToast('Document verified successfully', 'success');
    }
}

function rejectDocument(docType) {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
        showToast('Document rejected. Merchant will be notified.', 'error');
    }
}

function initiatePennyDrop() {
    showToast('Initiating penny drop verification...', 'info');
    setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        if (success) {
            document.getElementById('bankStatementVerified').checked = true;
            document.getElementById('cancelledChequeVerified').checked = true;
            updateProgress();
            showToast('Penny drop successful! Bank account verified.', 'success');
        } else {
            showToast('Penny drop failed. Please verify manually.', 'error');
        }
    }, 2000);
}

function completeVerification() {
    const notes = document.getElementById('verificationNotes').value;
    
    if (confirm('Complete verification and approve this merchant? This action cannot be undone.')) {
        showToast('Merchant verification completed successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/admin/merchants';
        }, 1500);
    }
}

function rejectVerification() {
    const reason = prompt('Enter rejection reason (will be sent to merchant):');
    if (reason && reason.trim()) {
        showToast('Merchant application rejected', 'success');
        setTimeout(() => {
            window.location.href = '/admin/merchants/pending';
        }, 1500);
    }
}

function requestMoreInfo() {
    const message = prompt('What additional information do you need?');
    if (message && message.trim()) {
        showToast('Information request sent to merchant', 'success');
    }
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
