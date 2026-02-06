// Forgot Password Page
document.addEventListener('DOMContentLoaded', function() {
    attachEventListeners();
});

function attachEventListeners() {
    const emailInput = document.getElementById('emailInput');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            // Clear error if exists
            this.style.borderColor = '';
        });
    }
}

function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('emailInput').value.trim();
    const form = document.getElementById('forgotForm');
    const successMessage = document.getElementById('successMessage');

    // Validate email
    if (!email) {
        showError('Please enter your email address');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Simulate API call
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Sending...';

    setTimeout(() => {
        // Show success message
        form.style.display = 'none';
        successMessage.style.display = 'block';
        
        // Log for debugging
        console.log('Password reset email sent to:', email);
    }, 1500);
}

function showError(message) {
    const emailInput = document.getElementById('emailInput');
    emailInput.style.borderColor = 'var(--error)';
    
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
