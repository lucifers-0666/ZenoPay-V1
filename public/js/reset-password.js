// ========================================
// RESET PASSWORD PAGE INTERACTIONS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializePasswordValidation();
    initializePasswordToggle();
    initializeFormSubmit();
});

// ========================================
// PASSWORD VALIDATION
// ========================================

function initializePasswordValidation() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    if (!passwordInput) return;

    // Password input - real-time validation
    passwordInput.addEventListener('input', function() {
        validatePasswordStrength();
        checkPasswordMatch();
    });

    passwordInput.addEventListener('blur', function() {
        validatePasswordField();
    });

    // Confirm password input - match check
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            checkPasswordMatch();
        });

        confirmPasswordInput.addEventListener('blur', function() {
            validateConfirmPasswordField();
        });
    }
}

// Password strength validation
function validatePasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthFill = document.getElementById('strength-fill');
    const strengthLabel = document.getElementById('strength-label');

    // Check requirements
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Update requirement checklist
    updateRequirement('requirement-length', requirements.length);
    updateRequirement('requirement-uppercase', requirements.uppercase);
    updateRequirement('requirement-number', requirements.number);
    updateRequirement('requirement-special', requirements.special);

    // Calculate strength percentage
    const metCount = Object.values(requirements).filter(Boolean).length;
    const strengthPercent = (metCount / 4) * 100;
    
    strengthFill.style.width = strengthPercent + '%';

    // Update strength label
    let label = 'Enter a password';
    let color = '';
    
    if (password.length > 0) {
        if (strengthPercent === 0) {
            label = 'Very Weak';
            color = 'var(--error-red)';
        } else if (strengthPercent <= 25) {
            label = 'Weak';
            color = 'var(--error-red)';
        } else if (strengthPercent <= 50) {
            label = 'Fair';
            color = 'var(--warning-yellow)';
        } else if (strengthPercent <= 75) {
            label = 'Good';
            color = 'var(--primary-blue)';
        } else {
            label = 'Strong';
            color = 'var(--success-green)';
        }
    }

    strengthLabel.textContent = label;
    strengthLabel.style.color = color;
}

function updateRequirement(id, isMet) {
    const requirementItem = document.getElementById(id);
    if (!requirementItem) return;

    if (isMet) {
        requirementItem.classList.add('met');
    } else {
        requirementItem.classList.remove('met');
    }
}

// Validate password field
function validatePasswordField() {
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('password-error');
    const password = passwordInput.value.trim();

    // Reset error state
    passwordInput.classList.remove('error');
    passwordError.classList.remove('show');
    passwordError.textContent = '';

    if (!password) {
        passwordInput.classList.add('error');
        passwordError.textContent = 'Password is required';
        passwordError.classList.add('show');
        return false;
    }

    if (password.length < 8) {
        passwordInput.classList.add('error');
        passwordError.textContent = 'Password must be at least 8 characters long';
        passwordError.classList.add('show');
        return false;
    }

    if (!/[A-Z]/.test(password)) {
        passwordInput.classList.add('error');
        passwordError.textContent = 'Password must contain at least one uppercase letter';
        passwordError.classList.add('show');
        return false;
    }

    if (!/[0-9]/.test(password)) {
        passwordInput.classList.add('error');
        passwordError.textContent = 'Password must contain at least one number';
        passwordError.classList.add('show');
        return false;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        passwordInput.classList.add('error');
        passwordError.textContent = 'Password must contain at least one special character (!@#$%^&*)';
        passwordError.classList.add('show');
        return false;
    }

    return true;
}

// Validate confirm password field
function validateConfirmPasswordField() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const confirmPasswordError = document.getElementById('confirm-password-error');
    const confirmPassword = confirmPasswordInput.value.trim();

    // Reset error state
    confirmPasswordInput.classList.remove('error');
    confirmPasswordError.classList.remove('show');
    confirmPasswordError.textContent = '';

    if (!confirmPassword) {
        confirmPasswordInput.classList.add('error');
        confirmPasswordError.textContent = 'Please confirm your password';
        confirmPasswordError.classList.add('show');
        return false;
    }

    if (passwordInput.value !== confirmPassword) {
        confirmPasswordInput.classList.add('error');
        confirmPasswordError.textContent = 'Passwords do not match';
        confirmPasswordError.classList.add('show');
        return false;
    }

    return true;
}

// Check if passwords match
function checkPasswordMatch() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const matchIndicator = document.getElementById('match-indicator');

    if (!matchIndicator) return;

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Only show match indicator if both fields have values
    if (password && confirmPassword && password === confirmPassword) {
        matchIndicator.classList.add('show');
        confirmPasswordInput.classList.remove('error');
    } else {
        matchIndicator.classList.remove('show');
    }
}

// ========================================
// PASSWORD TOGGLE VISIBILITY
// ========================================

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const toggle = event.target.closest('.password-toggle');
    const icon = toggle.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// ========================================
// FORM SUBMISSION
// ========================================

function initializeFormSubmit() {
    const form = document.getElementById('reset-password-form');
    if (!form) return;

    form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate both fields
    const isPasswordValid = validatePasswordField();
    const isConfirmPasswordValid = validateConfirmPasswordField();

    if (!isPasswordValid || !isConfirmPasswordValid) {
        return;
    }

    const token = document.getElementById('token').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitBtn = document.querySelector('.btn-submit');

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        // Submit password reset
        const response = await fetch('/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token,
                password: password,
                confirmPassword: confirmPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Success: Show success section
            displaySuccessState();
            showToast('Password reset successfully!', 'success');
        } else {
            // Error from server
            showToast(data.message || 'Failed to reset password. Please try again.', 'error');
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.', 'error');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// ========================================
// SUCCESS STATE
// ========================================

function displaySuccessState() {
    const formSection = document.getElementById('form-section');
    const successSection = document.getElementById('success-section');
    
    formSection.classList.remove('active');
    successSection.classList.add('active');

    // Start countdown
    startRedirectCountdown();
}

function startRedirectCountdown() {
    let seconds = 3;
    const countdownTimer = document.getElementById('countdown');

    const interval = setInterval(() => {
        seconds--;
        countdownTimer.textContent = seconds;

        if (seconds <= 0) {
            clearInterval(interval);
            window.location.href = '/login';
        }
    }, 1000);
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') {
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        icon = 'fa-exclamation-circle';
    }
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Add slideOutRight animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(400px);
        }
    }
`;
document.head.appendChild(style);
