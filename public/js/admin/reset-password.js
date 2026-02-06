// Reset Password Page
document.addEventListener('DOMContentLoaded', function() {
    attachEventListeners();
});

function attachEventListeners() {
    const passwordInput = document.getElementById('passwordInput');
    const confirmInput = document.getElementById('confirmInput');

    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
        passwordInput.addEventListener('input', validatePasswords);
    }

    if (confirmInput) {
        confirmInput.addEventListener('input', validatePasswords);
    }
}

function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
}

function checkPasswordStrength() {
    const password = document.getElementById('passwordInput').value;
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    let strength = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%^&*]/.test(password)
    };

    strength = Object.values(checks).filter(Boolean).length;

    strengthFill.className = 'strength-fill';
    
    if (strength <= 2) {
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Password strength: Weak';
        strengthText.style.color = 'var(--error)';
    } else if (strength === 3 || strength === 4) {
        strengthFill.classList.add('medium');
        strengthText.textContent = 'Password strength: Medium';
        strengthText.style.color = 'var(--warning)';
    } else {
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Password strength: Strong';
        strengthText.style.color = 'var(--success)';
    }
}

function validatePasswords() {
    const password = document.getElementById('passwordInput').value;
    const confirm = document.getElementById('confirmInput').value;

    if (password && confirm && password !== confirm) {
        document.getElementById('confirmInput').style.borderColor = 'var(--error)';
    } else {
        document.getElementById('confirmInput').style.borderColor = '';
    }
}

function handleResetPassword(event) {
    event.preventDefault();

    const password = document.getElementById('passwordInput').value;
    const confirm = document.getElementById('confirmInput').value;

    // Validate
    if (!password || !confirm) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 8) {
        showError('Password must be at least 8 characters');
        return;
    }

    if (password !== confirm) {
        showError('Passwords do not match');
        return;
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        showError('Password must contain uppercase, lowercase, and numbers');
        return;
    }

    // Simulate API call
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Resetting...';

    setTimeout(() => {
        showToast('Password reset successfully!', 'success');
        setTimeout(() => {
            window.location.href = '/admin/login';
        }, 1500);
    }, 1500);
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
