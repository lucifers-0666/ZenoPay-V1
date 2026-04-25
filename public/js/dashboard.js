/**
 * ZenoPay Modern Dashboard JavaScript
 * Handles all interactive features: mobile menu, FAQ accordion, 
 * counter animations, copy-to-clipboard, scroll animations
 */

(function () {
  'use strict';

  // ====================================
  // 1. MOBILE MENU FUNCTIONALITY
  // ====================================
  function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (!mobileMenuBtn || !mobileMenuOverlay) return;

    // Open mobile menu
    mobileMenuBtn.addEventListener('click', function () {
      mobileMenuOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    // Close mobile menu
    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', function () {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    // Close menu when clicking nav links
    mobileNavLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close menu when clicking overlay background
    mobileMenuOverlay.addEventListener('click', function (e) {
      if (e.target === mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenuOverlay.classList.contains('active')) {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ====================================
  // 2. FAQ ACCORDION FUNCTIONALITY
  // ====================================
  function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function (item) {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');

      if (!question || !answer) return;

      question.addEventListener('click', function () {
        const isActive = item.classList.contains('active');

        // Close all other FAQs
        faqItems.forEach(function (otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            if (otherAnswer) {
              otherAnswer.style.maxHeight = null;
            }
          }
        });

        // Toggle current FAQ
        if (isActive) {
          item.classList.remove('active');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  }

  // ====================================
  // 2.5 PRICING CARD CLICK HANDLER
  // ====================================
  function initPricingCardSelection() {
    const pricingCards = document.querySelectorAll('.pricing-card');

    pricingCards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        // Don't trigger if clicking a button or link
        if (e.target.tagName === 'BUTTON' || e.target.closest('button') ||
          e.target.tagName === 'A' || e.target.closest('a')) {
          return;
        }

        // Remove selected class from all cards
        pricingCards.forEach(function (c) {
          c.classList.remove('selected');
        });

        // Add selected class to clicked card
        card.classList.add('selected');

        // Optional: Show console log for debugging
        const planName = card.querySelector('.pricing-plan-name');
        if (planName) {
          console.log(planName.textContent + ' plan selected!');
        }
      });

      // Add keyboard accessibility
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Select pricing plan');

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  // ====================================
  // 3. COUNTER ANIMATIONS
  // ====================================
  function initCounterAnimations() {
    function animateCounters() {
      const counters = document.querySelectorAll('[data-target]');

      counters.forEach((counter) => {
        const target = parseFloat(counter.dataset.target);

        if (isNaN(target)) {
          console.warn('Counter has invalid target:', counter.dataset.target);
          counter.textContent =
            (counter.dataset.prefix || '') +
            (counter.dataset.target || '0') +
            (counter.dataset.suffix || '');
          return;
        }

        const prefix = counter.dataset.prefix || '';
        const suffix = counter.dataset.suffix || '';
        const isDecimal = target % 1 !== 0;
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
          step += 1;
          current += increment;

          if (step >= steps) {
            current = target;
            clearInterval(timer);
          }

          counter.textContent =
            prefix +
            (isDecimal
              ? current.toFixed(1)
              : Math.floor(current).toLocaleString('en-IN')) +
            suffix;
        }, duration / steps);
      });
    }

    const statsSection = document.querySelector('.stats-section, #stats, .stats-grid');

    if (statsSection) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounters();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(statsSection);
    } else {
      window.addEventListener('load', animateCounters);
    }
  }

  // ====================================
  // 4. COPY TO CLIPBOARD
  // ====================================
  function initCopyToClipboard() {
    const copyButtons = document.querySelectorAll('.copy-code-btn');

    copyButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const targetId = button.getAttribute('data-copy-target');
        const targetElement = document.getElementById(targetId);

        if (!targetElement) return;

        const textToCopy = targetElement.textContent || targetElement.innerText;

        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(textToCopy).then(function () {
            showCopyFeedback(button);
          }).catch(function (err) {
            console.error('Failed to copy:', err);
            fallbackCopy(textToCopy, button);
          });
        } else {
          fallbackCopy(textToCopy, button);
        }
      });
    });
  }

  function fallbackCopy(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      showCopyFeedback(button);
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }

    document.body.removeChild(textArea);
  }

  function showCopyFeedback(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.style.background = '#10B981';
    button.style.color = 'white';

    setTimeout(function () {
      button.innerHTML = originalHTML;
      button.style.background = '';
      button.style.color = '';
    }, 2000);
  }

  // ====================================
  // 5. SCROLL ANIMATIONS
  // ====================================
  function initScrollAnimations() {
    const revealElements = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card, .step-item');

    if (revealElements.length === 0) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal', 'active');
        }
      });
    }, observerOptions);

    revealElements.forEach(function (element) {
      element.classList.add('reveal');
      observer.observe(element);
    });
  }

  // ====================================
  // 6. SMOOTH SCROLL FOR ANCHOR LINKS
  // ====================================
  function initSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        const href = link.getAttribute('href');

        // Skip if it's just "#"
        if (href === '#') return;

        const targetElement = document.querySelector(href);

        if (targetElement) {
          e.preventDefault();

          const headerHeight = 72; // Height of fixed header
          const targetPosition = targetElement.offsetTop - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ====================================
  // 7. HEADER SCROLL EFFECT
  // ====================================
  function initHeaderScroll() {
    const header = document.querySelector('.modern-header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', function () {
      const currentScroll = window.pageYOffset;

      // Add shadow when scrolled
      if (currentScroll > 10) {
        header.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.07)';
      } else {
        header.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
      }

      lastScroll = currentScroll;
    });
  }

  // ====================================
  // 8. SHOW TOAST NOTIFICATION
  // ====================================
  function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-' + type;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    `;

    // Add toast styles dynamically if not in CSS
    toast.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
      z-index: 9999;
      animation: slideInUp 0.3s ease-out;
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(function () {
      toast.style.animation = 'slideOutDown 0.3s ease-out';
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Add toast animations to document
  function addToastAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes slideOutDown {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(100px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ====================================
  // 9. FORM VALIDATION (IF NEEDED)
  // ====================================
  function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');

    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(function (input) {
          if (!input.value.trim()) {
            isValid = false;
            input.style.borderColor = '#EF4444';
          } else {
            input.style.borderColor = '';
          }
        });

        if (isValid) {
          showToast('Form submitted successfully!', 'success');
          // Actual form submission logic here
        } else {
          showToast('Please fill in all required fields', 'error');
        }
      });
    });
  }

  // ====================================
  // 10. LAZY LOADING IMAGES
  // ====================================
  function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    if (images.length === 0 || !('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.getAttribute('data-src');
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      });
    });

    images.forEach(function (img) {
      imageObserver.observe(img);
    });
  }

  // ====================================
  // 11. UTILITY FUNCTIONS
  // ====================================

  // Debounce function for performance
  function debounce(func, wait) {
    let timeout;
    return function executedFunction() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        func.apply(context, args);
      }, wait);
    };
  }

  // Throttle function for scroll events
  function throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function () {
          inThrottle = false;
        }, limit);
      }
    };
  }

  // Check if element is in viewport
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  // ====================================
  // 12. PERFORMANCE MONITORING
  // ====================================
  function logPerformance() {
    if ('performance' in window) {
      window.addEventListener('load', function () {
        setTimeout(function () {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          console.log('Page Load Time:', pageLoadTime + 'ms');
        }, 0);
      });
    }
  }

  // ====================================
  // 13. ERROR HANDLING
  // ====================================
  function initErrorHandling() {
    window.addEventListener('error', function (e) {
      console.error('Global error:', e.message);
      // You can send errors to analytics service here
    });

    window.addEventListener('unhandledrejection', function (e) {
      console.error('Unhandled promise rejection:', e.reason);
    });
  }

  // ====================================
  // 14. DASHBOARD PAGE HELPERS (MOVED FROM INLINE)
  // ====================================
  function initTicker() {
    const items = document.querySelectorAll('.ticker-item');
    if (!items.length) return;
    let current = 0;
    items[0].classList.add('active');
    setInterval(() => {
      items[current].classList.remove('active');
      current = (current + 1) % items.length;
      items[current].classList.add('active');
    }, 2800);
  }

  function toggleBilling(cb) {
    const isAnnual = cb.checked;
    const ml = document.getElementById('monthlyLabel');
    const al = document.getElementById('annualLabel');
    if (ml) ml.style.cssText = isAnnual ? 'color:#94A3B8;font-weight:500' : 'color:#0F172A;font-weight:700';
    if (al) al.style.cssText = isAnnual ? 'color:#0F172A;font-weight:700' : 'color:#94A3B8;font-weight:500';
    document.querySelectorAll('[data-monthly][data-annual]').forEach(el => {
      el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly;
    });
  }

  function switchPMTab(tab, btn) {
    document.querySelectorAll('.pm-content').forEach(c => c.classList.remove('pm-content-active'));
    document.querySelectorAll('.pm-tab').forEach(b => b.classList.remove('pm-tab-active'));
    const target = document.getElementById('tab-' + tab);
    if (target) target.classList.add('pm-content-active');
    if (btn) btn.classList.add('pm-tab-active');
  }

  function initCopyZenoPayId() {
    document.querySelectorAll('.zd-acct-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.previousElementSibling?.textContent?.trim();
        if (val) {
          navigator.clipboard.writeText(val).then(() => {
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i>', 1500);
          });
        }
      });
    });
  }

  function animateWalletBalance() {
    const node = document.getElementById('walletBalanceAnimated');
    if (!node) return;

    const target = Number(node.dataset.balance || 0);
    const duration = 1200;
    const start = performance.now();

    const formatINR = (value) => `₹${Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = formatINR(target * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  // ====================================
  // INITIALIZATION
  // ====================================
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        initializeAll();
      });
    } else {
      initializeAll();
    }
  }

  function initializeAll() {
    console.log('Initializing ZenoPay Modern Dashboard...');

    // Initialize all features
    initMobileMenu();
    initFAQAccordion();
    initPricingCardSelection();

    // Ensure stat numbers are visible before animation
    ensureStatNumbersAreVisible();
    initCounterAnimations();

    initCopyToClipboard();
    initScrollAnimations();
    initSmoothScroll();
    initHeaderScroll();
    initFormValidation();
    initLazyLoading();
    initErrorHandling();
    addToastAnimations();
    initTicker();
    initCopyZenoPayId();
    animateWalletBalance();

    // Expose functions used by inline onclick attributes in templates.
    window.toggleBilling = toggleBilling;
    window.switchPMTab = switchPMTab;

    // Performance monitoring (development only)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      logPerformance();
    }

    console.log('✓ ZenoPay Modern Dashboard initialized successfully');
  }

  // ====================================
  // ENSURE STAT NUMBERS ARE VISIBLE
  // ====================================
  function ensureStatNumbersAreVisible() {
    // Fallback to ensure all stat numbers show their content immediately
    const allStatNumbers = document.querySelectorAll('.stat-number');
    allStatNumbers.forEach(function (element) {
      const hasDataTarget = element.hasAttribute('data-target');
      const currentText = element.textContent.trim();

      if (hasDataTarget) {
        // Will be animated, start with 0
        if (!currentText || currentText === '') {
          element.textContent = '0';
        }
      } else {
        // Static content - ensure it's visible
        if (currentText && currentText !== '0') {
          element.style.visibility = 'visible';
          element.style.opacity = '1';
        }
      }
    });
  }

  // Start initialization
  init();

// ====================================
// EXPORT PUBLIC API (IF NEEDED)
// ====================================
window.ZenoPayDashboard = {
  showToast: showToast,
  debounce: debounce,
  throttle: throttle,
  isInViewport: isInViewport,
  toggleBilling: toggleBilling,
  switchPMTab: switchPMTab
};

}) ();
