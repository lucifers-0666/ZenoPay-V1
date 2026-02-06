// 2FA Setup Page
let current2FAMethod = 'authenticator';

document.addEventListener('DOMContentLoaded', function() {
    attachEventListeners();
});

function attachEventListeners() {
    const codeInput = document.getElementById('codeInput');
    if (codeInput) {
        codeInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
}

function selectMethod(method) {
    current2FAMethod = method;
    const step2Content = document.getElementById('step2Content');
    
    if (method === 'authenticator') {
        step2Content.innerHTML = `
            <p style="color: var(--slate-600); margin-bottom: 16px;">Install an authenticator app and scan the QR code</p>
            <div style="text-align: center; padding: 20px; background: var(--slate-50); border-radius: 8px; margin-bottom: 20px;">
                <div style="display: inline-block; width: 200px; height: 200px; background: white; border-radius: 8px; padding: 10px;">
                    <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
                        <rect width="200" height="200" fill="white"/>
                        <text x="100" y="100" text-anchor="middle" dy=".3em" style="font-size: 12px;">QR Code Here</text>
                    </svg>
                </div>
                <p style="margin-top: 12px; font-size: 13px; color: var(--slate-600);">Or enter this code manually:<br><code style="font-weight: 600;">JBSWY3DPEHPK3PXP</code></p>
            </div>
            <div class="form-actions" style="display: flex; gap: 12px; margin-top: 20px;">
                <button class="btn-secondary" onclick="goToStep(1)" style="flex: 1;">Back</button>
                <button class="btn-primary" onclick="goToStep(3)" style="flex: 1;">Continue</button>
            </div>
        `;
    } else if (method === 'sms') {
        step2Content.innerHTML = `
            <p style="color: var(--slate-600); margin-bottom: 16px;">We'll send verification codes to this number</p>
            <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input type="tel" id="phoneInput" class="form-input-edit" placeholder="+91 98765 43210" value="+91 ">
            </div>
            <div class="form-actions" style="display: flex; gap: 12px; margin-top: 20px;">
                <button class="btn-secondary" onclick="goToStep(1)" style="flex: 1;">Back</button>
                <button class="btn-primary" onclick="goToStep(3)" style="flex: 1;">Continue</button>
            </div>
        `;
    } else if (method === 'email') {
        step2Content.innerHTML = `
            <p style="color: var(--slate-600); margin-bottom: 16px;">We'll send codes to your registered email</p>
            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="form-input-edit" value="admin@zenopay.com" disabled>
            </div>
            <div class="form-actions" style="display: flex; gap: 12px; margin-top: 20px;">
                <button class="btn-secondary" onclick="goToStep(1)" style="flex: 1;">Back</button>
                <button class="btn-primary" onclick="goToStep(3)" style="flex: 1;">Continue</button>
            </div>
        `;
    }
}

function goToStep(stepNumber) {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        const step = document.getElementById('step' + i);
        if (step) {
            step.classList.remove('active');
        }
    }
    
    // Show target step
    const targetStep = document.getElementById('step' + stepNumber);
    if (targetStep) {
        targetStep.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function verify2FA() {
    const code = document.getElementById('codeInput').value;

    if (!code || code.length !== 6) {
        showError('Please enter a valid 6-digit code');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Verifying...';

    setTimeout(() => {
        showToast('Code verified successfully!', 'success');
        setTimeout(() => {
            goToStep(4);
        }, 1500);
    }, 1500);
}

function downloadBackupCodes() {
    const backupCodes = ['23A4-B5C6', 'D7E8-F9G0', 'H1I2-J3K4', 'L5M6-N7O8', 'P9Q0-R1S2', 'T3U4-V5W6'];
    const content = backupCodes.join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Backup codes downloaded', 'success');
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
