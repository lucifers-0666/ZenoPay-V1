// ========================================
// FORGOT PASSWORD PAGE INTERACTIONS
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initializeFormValidation();
    initializeFormSubmit();
    initializeResendButton();
});

// ========================================
// FORM VALIDATION
// ========================================

function initializeFormValidation() {
    const form = document.getElementById('forgot-password-form');
    const emailInput = document.getElementById('email');

    if (!emailInput) return;

    // Real-time validation on blur
    emailInput.addEventListener('blur', function() {
        validateEmailField();
    });

    // Remove error on input
    emailInput.addEventListener('input', function() {
        if (this.classList.contains('error')) {
            this.classList.remove('error');
            document.getElementById('email-error').classList.remove('show');
        }
    });
}

function validateEmailField() {
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    const email = emailInput.value.trim();

    // Reset error state
    emailInput.classList.remove('error');
    emailError.classList.remove('show');
    emailError.textContent = '';

    if (!email) {
        emailInput.classList.add('error');
        emailError.textContent = 'Email address is required';
        emailError.classList.add('show');
        return false;
    }

    if (!isValidEmail(email)) {
        emailInput.classList.add('error');
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.add('show');
        return false;
    }

    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ========================================
// FORM SUBMISSION
// ========================================

function initializeFormSubmit() {
    const form = document.getElementById('forgot-password-form');
    if (!form) return;

    form.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate email
    if (!validateEmailField()) {
        return;
    }

    const email = document.getElementById('email').value.trim();
    const submitBtn = document.querySelector('.btn-submit');
    const form = document.getElementById('forgot-password-form');

    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
        // Send password reset request
        const response = await fetch('/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok) {
            // Success: Show success section
            displaySuccessState(email);
            showToast('Reset link sent successfully!', 'success');
        } else {
            // Error from server
            showToast(data.message || 'Failed to send reset link. Please try again.', 'error');
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

function displaySuccessState(email) {
    // Hide form section
    const formSection = document.getElementById('form-section');
    const successSection = document.getElementById('success-section');
    
    formSection.classList.remove('active');
    successSection.classList.add('active');

    // Display email
    document.getElementById('display-email').textContent = email;

    // Start resend countdown
    startResendCountdown();
}

// ========================================
// RESEND BUTTON & COUNTDOWN
// ========================================

function initializeResendButton() {
    const resendBtn = document.getElementById('resend-btn');
    if (!resendBtn) return;

    resendBtn.addEventListener('click', handleResendClick);
}

async function handleResendClick(e) {
    e.preventDefault();

    const resendBtn = document.getElementById('resend-btn');
    const email = document.getElementById('display-email').textContent;

    // Show loading state
    resendBtn.classList.add('loading');
    resendBtn.disabled = true;

    try {
        const response = await fetch('/forgot-password/resend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Reset link resent successfully!', 'success');
            startResendCountdown();
        } else {
            showToast(data.message || 'Failed to resend reset link.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.', 'error');
    } finally {
        resendBtn.classList.remove('loading');
        resendBtn.disabled = false;
    }
}

function startResendCountdown() {
    const resendBtn = document.getElementById('resend-btn');
    const countdown = document.getElementById('resend-countdown');
    const timer = document.getElementById('countdown-timer');

    let seconds = 60;

    // Hide resend button
    resendBtn.style.display = 'none';
    countdown.classList.remove('hidden');

    const interval = setInterval(() => {
        seconds--;
        timer.textContent = seconds;

        if (seconds <= 0) {
            clearInterval(interval);
            resendBtn.style.display = 'flex';
            countdown.classList.add('hidden');
            resendBtn.disabled = false;
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

// ========================================
// UTILITY FUNCTIONS
// ========================================

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
