/* ═══════════════════════════════════════════════════════════════════════════════════
   API Integration Page - JavaScript Functionality
   Modern Dashboard with Tab Navigation, Copy Functions, and Interactive Elements
   ═══════════════════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════════════════════
// TAB NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  initTabs();
  initKeyManagement();
  initCodeSyntaxHighlighting();
});

function initTabs() {
  const tabItems = document.querySelectorAll('.tab-item');
  const tabContents = document.querySelectorAll('.tab-content');

  tabItems.forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName);
      
      // Update URL hash
      window.history.pushState(null, null, `#${tabName}`);
    });
  });

  // Handle browser back/forward
  window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1);
    if (hash) {
      switchTab(hash);
    }
  });

  // Check for hash on page load
  const hash = window.location.hash.substring(1);
  if (hash) {
    switchTab(hash);
  }
}

function switchTab(tabName) {
  const tabItems = document.querySelectorAll('.tab-item');
  const tabContents = document.querySelectorAll('.tab-content');

  // Remove active class from all tabs
  tabItems.forEach(tab => {
    tab.classList.remove('active');
    tab.setAttribute('aria-selected', 'false');
  });

  // Hide all tab contents
  tabContents.forEach(content => {
    content.classList.remove('active');
  });

  // Add active class to clicked tab
  const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
  const activeContent = document.getElementById(tabName);

  if (activeTab) {
    activeTab.classList.add('active');
    activeTab.setAttribute('aria-selected', 'true');
  }

  if (activeContent) {
    activeContent.classList.add('active');
  }

  // Re-highlight code blocks if Prism is available
  if (typeof Prism !== 'undefined') {
    setTimeout(() => {
      Prism.highlightAllUnder(activeContent);
    }, 0);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// KEY MANAGEMENT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════

function initKeyManagement() {
  const toggleButtons = document.querySelectorAll('.toggle-visibility');
  
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const keyDisplay = this.closest('.key-display');
      const codeElement = keyDisplay.querySelector('code');
      const icon = this.querySelector('i');
      
      toggleKeyVisibility(codeElement, icon);
    });
  });
}

function toggleKeyVisibility(codeElement, icon) {
  const actualKey = codeElement.getAttribute('data-key');
  const isHidden = codeElement.textContent.includes('••');

  if (isHidden) {
    // Show key
    codeElement.textContent = actualKey;
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  } else {
    // Hide key
    const maskedKey = '•'.repeat(actualKey.length);
    codeElement.textContent = maskedKey;
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  }
}

function copyKey(button) {
  const keyDisplay = button.closest('.key-display');
  const codeElement = keyDisplay.querySelector('code');
  const actualKey = codeElement.getAttribute('data-key');
  
  copyToClipboard(actualKey, button);
}

// ═══════════════════════════════════════════════════════════════════════════════════
// COPY TO CLIPBOARD UTILITY
// ═══════════════════════════════════════════════════════════════════════════════════

function copyToClipboard(text, button) {
  const onSuccess = () => {
    const originalIcon = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.add('copied');
    showTooltip(button, 'Copied!');

    setTimeout(() => {
      button.innerHTML = originalIcon;
      button.classList.remove('copied');
    }, 2000);
  };

  const onError = (err) => {
    console.error('Failed to copy:', err);
    showTooltip(button, 'Failed to copy');
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onSuccess).catch(onError);
    return;
  }

  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  tempInput.setAttribute('readonly', '');
  tempInput.style.position = 'absolute';
  tempInput.style.left = '-9999px';
  document.body.appendChild(tempInput);
  tempInput.select();

  try {
    document.execCommand('copy');
    onSuccess();
  } catch (err) {
    onError(err);
  } finally {
    tempInput.remove();
  }
}

function showTooltip(element, message) {
  const tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = message;
  tooltip.style.cssText = `
    position: absolute;
    background: #1F2937;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    pointer-events: none;
    z-index: 1000;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    animation: fadeIn 0.2s ease;
  `;

  element.parentElement.style.position = 'relative';
  element.parentElement.appendChild(tooltip);

  setTimeout(() => {
    tooltip.remove();
  }, 2000);
}

function copyCode(button) {
  const codeCard = button.closest('.code-card');
  const codeElement = codeCard.querySelector('code');
  const code = codeElement.textContent;

  copyToClipboard(code, button);
}

// ═══════════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT TOGGLE
// ═══════════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  const envButtons = document.querySelectorAll('.env-btn');

  envButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const env = this.getAttribute('data-env');
      
      // Remove active class from all buttons
      envButtons.forEach(b => b.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');

      // Update displayed keys (in production, fetch from API)
      updateEnvironmentKeys(env);

      // Save preference
      localStorage.setItem('zenopay_env', env);
    });
  });

  // Load saved preference
  const savedEnv = localStorage.getItem('zenopay_env') || 'test';
  const savedButton = document.querySelector(`[data-env="${savedEnv}"]`);
  if (savedButton) {
    savedButton.click();
  }
});

function updateEnvironmentKeys(env) {
  const pubKey = document.getElementById('pubKey');
  const secretKey = document.getElementById('secretKey');

  if (env === 'live') {
    pubKey.textContent = 'pk_live_9z8y7x6w5v4u3t2s1r0q';
    pubKey.setAttribute('data-key', 'pk_live_9z8y7x6w5v4u3t2s1r0q');
    
    secretKey.textContent = 'sk_live_••••••••••••••••••••';
    secretKey.setAttribute('data-key', 'sk_live_1q0r2s3t4u5v6w7x8y9z');
  } else {
    pubKey.textContent = 'pk_test_4b5f6g7h8i9j0k1l2m3n4o5p';
    pubKey.setAttribute('data-key', 'pk_test_4b5f6g7h8i9j0k1l2m3n4o5p');
    
    secretKey.textContent = 'sk_test_••••••••••••••••••••';
    secretKey.setAttribute('data-key', 'sk_test_1a2b3c4d5e6f7g8h9i0j');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// CODE LANGUAGE SWITCHING
// ═══════════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  const langTabs = document.querySelectorAll('.lang-tab');

  langTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const lang = this.getAttribute('data-lang');
      const codeCard = this.closest('.code-card');
      
      // Remove active class from all language tabs
      codeCard.querySelectorAll('.lang-tab').forEach(t => {
        t.classList.remove('active');
      });

      // Add active class to clicked tab
      this.classList.add('active');

      // Update code block
      updateCodeExample(lang, codeCard);

      // Save preference
      localStorage.setItem('zenopay_lang', lang);

      // Highlight code if Prism is available
      if (typeof Prism !== 'undefined') {
        Prism.highlightAllUnder(codeCard);
      }
    });
  });

  // Load saved preference
  const savedLang = localStorage.getItem('zenopay_lang') || 'javascript';
  const savedTab = document.querySelector(`[data-lang="${savedLang}"]`);
  if (savedTab) {
    savedTab.click();
  }
});

function updateCodeExample(lang, codeCard) {
  const codeElement = codeCard.querySelector('code');
  
  const examples = {
    javascript: `const zenopay = require('zenopay-sdk');

// Initialize SDK
zenopay.init({
  apiKey: 'pk_test_...',
  secretKey: 'sk_test_...'
});

// Create payment
const payment = await zenopay.createPayment({
  amount: 5000,
  currency: 'INR',
  customer: {
    email: 'user@example.com'
  }
});

console.log(payment.id);`,

    python: `import zenopay

# Initialize SDK
zenopay.api_key = 'pk_test_...'
zenopay.secret_key = 'sk_test_...'

# Create payment
payment = zenopay.Payment.create(
    amount=5000,
    currency='INR',
    customer={
        'email': 'user@example.com'
    }
)

print(payment.id)`,

    php: `<?php
require_once 'vendor/autoload.php';

// Initialize SDK
\\Zenopay\\Zenopay::setApiKey('pk_test_...');
\\Zenopay\\Zenopay::setSecretKey('sk_test_...');

// Create payment
$payment = \\Zenopay\\Payment::create([
    'amount' => 5000,
    'currency' => 'INR',
    'customer' => [
        'email' => 'user@example.com'
    ]
]);

echo $payment->id;
?>`
  };

  codeElement.textContent = examples[lang] || examples.javascript;
  codeElement.className = `language-${lang}`;
}

// ═══════════════════════════════════════════════════════════════════════════════════
// ENDPOINT EXPANSION
// ═══════════════════════════════════════════════════════════════════════════════════

function expandEndpoint(element) {
  element.classList.toggle('expanded');
}

// ═══════════════════════════════════════════════════════════════════════════════════
// ACTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════════

function testPayment() {
  alert('Test Payment Flow\n\nThis would open a payment testing interface where you can simulate transactions without processing real payments.');
}

function regenerateKeys() {
  if (confirm('⚠️ Are you sure you want to regenerate your API keys?\n\nThis will invalidate your current keys and may break existing integrations.')) {
    alert('API keys regenerated successfully!\n\nNew keys have been generated and the old ones are no longer valid.');
    // In production, call API to regenerate keys
  }
}

function switchToLive() {
  if (confirm('⚠️ Switching to Live Mode\n\nYou are about to switch to Live Mode. All transactions will be real and will be processed.\n\nMake sure you have completed your KYC verification.')) {
    alert('Switched to Live Mode successfully!\n\nYou can now process real payments.');
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// CODE SYNTAX HIGHLIGHTING
// ═══════════════════════════════════════════════════════════════════════════════════

function initCodeSyntaxHighlighting() {
  if (typeof Prism !== 'undefined') {
    // Highlight all code blocks on page load
    Prism.highlightAll();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// SMOOTH SCROLL TO SECTION
// ═══════════════════════════════════════════════════════════════════════════════════

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// ANIMATIONS & TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════════════

// Add intersection observer for scroll animations
if ('IntersectionObserver' in window) {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeIn 0.6s ease forwards';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all stat cards and feature cards
  document.querySelectorAll('.stat-card, .feature-card, .content-card').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════════════════════

document.addEventListener('keydown', function(event) {
  // Cmd/Ctrl + K for search (can be extended later)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    console.log('Search feature placeholder');
  }

  // Escape key to close any modals (when implemented)
  if (event.key === 'Escape') {
    // Close modal logic here
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY ENHANCEMENTS
// ═══════════════════════════════════════════════════════════════════════════════════

// Add keyboard navigation for tabs
document.addEventListener('keydown', function(event) {
  const activeTab = document.querySelector('.tab-item.active');
  if (!activeTab) return;

  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    const allTabs = Array.from(document.querySelectorAll('.tab-item'));
    const currentIndex = allTabs.indexOf(activeTab);
    let nextIndex;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % allTabs.length;
    } else {
      nextIndex = (currentIndex - 1 + allTabs.length) % allTabs.length;
    }

    allTabs[nextIndex].click();
    allTabs[nextIndex].focus();
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════
// NEWSLETTER SIGNUP
// ═══════════════════════════════════════════════════════════════════════════════════

function handleNewsletterSignup(event) {
  event.preventDefault();
  const form = event.target;
  const email = form.querySelector('.newsletter-input').value;
  
  if (!email || !isValidEmail(email)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  // Disable button and show loading state
  const button = form.querySelector('.btn-newsletter');
  const originalHTML = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

  // Simulate API call
  setTimeout(() => {
    button.disabled = false;
    button.innerHTML = originalHTML;
    
    showToast('Thank you for subscribing! Check your email for confirmation.', 'success');
    form.reset();
  }, 1500);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);

  // Add toast styles if not already present
  if (!document.querySelector('style[data-toast]')) {
    const style = document.createElement('style');
    style.setAttribute('data-toast', 'true');
    style.textContent = `
      .toast {
        position: fixed;
        top: 24px;
        right: 24px;
        padding: 16px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .toast-success {
        background: #D1FAE5;
        border-left: 4px solid #10B981;
        color: #065F46;
      }

      .toast-error {
        background: #FEE2E2;
        border-left: 4px solid #EF4444;
        color: #991B1B;
      }

      .toast-info {
        background: #DBEAFE;
        border-left: 4px solid #3B82F6;
        color: #1E40AF;
      }

      .toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .toast-content i {
        font-size: 18px;
      }

      @media (max-width: 768px) {
        .toast {
          right: 16px;
          left: 16px;
          top: auto;
          bottom: 24px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PERFORMANCE MONITORING
// ═══════════════════════════════════════════════════════════════════════════════════

window.addEventListener('load', function() {
  if (window.performance && window.performance.timing) {
    const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
    console.log(`API Integration page loaded in ${loadTime}ms`);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════
// WELCOME MESSAGE
// ═══════════════════════════════════════════════════════════════════════════════════

console.log(
  '%c🚀 ZenoPay API Integration Dashboard',
  'font-size: 20px; font-weight: bold; color: #6366F1;'
);
console.log(
  '%cWelcome to the ZenoPay Developer Platform!\n\nFor help, visit our documentation at https://docs.zenopay.com\nOr contact support at support@zenopay.com',
  'font-size: 14px; color: #6B7280;'
);
