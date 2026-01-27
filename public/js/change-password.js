// ========================================
// CHANGE PASSWORD PAGE INTERACTIONS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializePasswordValidation();
    initializePasswordToggle();
    initializeFormSubmit();
    initializeCheckbox();
});

// ========================================
// PASSWORD VALIDATION
// ========================================

function initializePasswordValidation() {
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-new-password');
    const currentPasswordInput = document.getElementById('current-password');

    if (!newPasswordInput) return;

    // New password input - real-time validation
    newPasswordInput.addEventListener('input', function() {
        validatePasswordStrength();
        checkPasswordsDifferent();
        checkPasswordMatch();
    });

    newPasswordInput.addEventListener('blur', function() {
        validateNewPasswordField();
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

    // Current password - validate on blur
    if (currentPasswordInput) {
        currentPasswordInput.addEventListener('blur', function() {
            validateCurrentPasswordField();
        });

        currentPasswordInput.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                this.classList.remove('error');
                document.getElementById('current-password-error').classList.remove('show');
            }
            checkPasswordsDifferent();
        });
    }
}

// Password strength validation
function validatePasswordStrength() {
    const password = document.getElementById('new-password').value;
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

// Check if new password is different from current
function checkPasswordsDifferent() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    
    if (currentPassword && newPassword && currentPassword === newPassword) {
        updateRequirement('requirement-different', false);
    } else if (newPassword && currentPassword !== newPassword) {
        updateRequirement('requirement-different', true);
    }
}

// Check if passwords match
function checkPasswordMatch() {
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-new-password');
    const matchIndicator = document.getElementById('match-indicator');

    if (!matchIndicator) return;

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Only show match indicator if both fields have values
    if (newPassword && confirmPassword && newPassword === confirmPassword) {
        matchIndicator.classList.add('show');
        confirmPasswordInput.classList.remove('error');
    } else {
        matchIndicator.classList.remove('show');
    }
}

// Validate current password field
function validateCurrentPasswordField() {
    const currentPasswordInput = document.getElementById('current-password');
    const currentPasswordError = document.getElementById('current-password-error');
    const password = currentPasswordInput.value.trim();

    // Reset error state
    currentPasswordInput.classList.remove('error');
    currentPasswordError.classList.remove('show');
    currentPasswordError.textContent = '';

    if (!password) {
        currentPasswordInput.classList.add('error');
        currentPasswordError.textContent = 'Current password is required';
        currentPasswordError.classList.add('show');
        return false;
    }

    return true;
}

// Validate new password field
function validateNewPasswordField() {
    const newPasswordInput = document.getElementById('new-password');
    const newPasswordError = document.getElementById('new-password-error');
    const currentPassword = document.getElementById('current-password').value.trim();
    const password = newPasswordInput.value.trim();

    // Reset error state
    newPasswordInput.classList.remove('error');
    newPasswordError.classList.remove('show');
    newPasswordError.textContent = '';

    if (!password) {
        newPasswordInput.classList.add('error');
        newPasswordError.textContent = 'New password is required';
        newPasswordError.classList.add('show');
        return false;
    }

    if (password.length < 8) {
        newPasswordInput.classList.add('error');
        newPasswordError.textContent = 'Password must be at least 8 characters long';
        newPasswordError.classList.add('show');
        return false;
    }

    if (!/[A-Z]/.test(password)) {
        newPasswordInput.classList.add('error');
        newPasswordError.textContent = 'Password must contain at least one uppercase letter';
        newPasswordError.classList.add('show');
        return false;
    }

    if (!/[0-9]/.test(password)) {
        newPasswordInput.classList.add('error');
        newPasswordError.textContent = 'Password must contain at least one number';
        newPasswordError.classList.add('show');
        return false;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        newPasswordInput.classList.add('error');
        newPasswordError.textContent = 'Password must contain at least one special character (!@#$%^&*)';
        newPasswordError.classList.add('show');
        return false;
    }

    if (currentPassword && password === currentPassword) {
        newPasswordInput.classList.add('error');
        newPasswordError.textContent = 'New password must be different from current password';
        newPasswordError.classList.add('show');
        return false;
    }

    return true;
}

// Validate confirm password field
function validateConfirmPasswordField() {
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-new-password');
    const confirmPasswordError = document.getElementById('confirm-new-password-error');
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

    if (newPasswordInput.value !== confirmPassword) {
        confirmPasswordInput.classList.add('error');
        confirmPasswordError.textContent = 'Passwords do not match';
        confirmPasswordError.classList.add('show');
        return false;
    }

    return true;
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
// CHECKBOX HANDLING
// ========================================

function initializeCheckbox() {
    const signOutCheckbox = document.getElementById('sign-out-all');
    if (!signOutCheckbox) return;

    signOutCheckbox.addEventListener('change', function() {
        const signOutDetail = document.getElementById('sign-out-detail');
        if (this.checked && signOutDetail) {
            signOutDetail.style.display = 'flex';
        } else if (signOutDetail) {
            signOutDetail.style.display = 'none';
        }
    });
}

// ========================================
// FORM SUBMISSION
// ========================================

function initializeFormSubmit() {
    const form = document.getElementById('change-password-form');
    if (!form) return;

    form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate all fields
    const isCurrentPasswordValid = validateCurrentPasswordField();
    const isNewPasswordValid = validateNewPasswordField();
    const isConfirmPasswordValid = validateConfirmPasswordField();

    if (!isCurrentPasswordValid || !isNewPasswordValid || !isConfirmPasswordValid) {
        return;
    }

    // Show confirmation modal
    openConfirmationModal();
}

// ========================================
// CONFIRMATION MODAL
// ========================================

function openConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    const signOutCheckbox = document.getElementById('sign-out-all');
    const signOutDetail = document.getElementById('sign-out-detail');

    // Update modal based on checkbox
    if (signOutCheckbox.checked) {
        signOutDetail.style.display = 'flex';
    } else {
        signOutDetail.style.display = 'none';
    }

    modal.classList.add('active');
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    modal.classList.remove('active');
}

async function confirmPasswordChange() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const signOutAll = document.getElementById('sign-out-all').checked;
    
    const confirmBtn = document.querySelector('.modal-footer .btn-primary');

    // Show loading state
    confirmBtn.classList.add('loading');
    confirmBtn.disabled = true;

    try {
        // Submit password change
        const response = await fetch('/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword,
                signOutAll: signOutAll
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Password changed successfully!', 'success');
            closeConfirmationModal();
            
            // Reset form
            document.getElementById('change-password-form').reset();
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = '/settings';
            }, 2000);
        } else {
            showToast(data.message || 'Failed to change password. Please try again.', 'error');
            confirmBtn.classList.remove('loading');
            confirmBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.', 'error');
        confirmBtn.classList.remove('loading');
        confirmBtn.disabled = false;
    }
}

// Close modal when clicking overlay
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('confirmation-modal');
    const overlay = document.querySelector('.modal-overlay');
    
    if (overlay) {
        overlay.addEventListener('click', closeConfirmationModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeConfirmationModal();
        }
    });
});

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
