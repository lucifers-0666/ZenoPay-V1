/**
 * ZenoPay Premium Micro-Interactions & Animations
 * Fintech-Grade User Experience Enhancements
 */

(function() {
  'use strict';

  // Initialize all premium features
  document.addEventListener('DOMContentLoaded', function() {
    initScrollReveal();
    initCounterAnimations();
    initButtonRipples();
    initSmoothScroll();
    initFormFocusAnimations();
    initGlowEffects();
    initAccessibilityFeatures();
  });

  /**
   * Scroll Reveal Animations
   * Fade-up elements as they enter viewport
   */
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card, .step-item, .stat-item');
    
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('fade-up', 'visible');
            }, index * 100); // Stagger effect
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });

      revealElements.forEach(el => {
        el.classList.add('fade-up');
        observer.observe(el);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      revealElements.forEach(el => el.classList.add('visible'));
    }
  }

  /**
   * Animated Number Counters
   * Count up numbers when they enter viewport
   */
  function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  }

  function animateCounter(element) {
    const text = element.textContent.trim();
    const hasPlus = text.includes('+');
    const hasDollar = text.includes('$');
    const hasPercent = text.includes('%');
    const hasLt = text.includes('<');
    
    // Extract number
    const match = text.match(/[\d,]+/);
    if (!match) return;
    
    const targetValue = parseInt(match[0].replace(/,/g, ''));
    const duration = 2000;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * targetValue);
      
      let displayValue = currentValue.toLocaleString();
      if (hasDollar) displayValue = '$' + displayValue;
      if (hasPlus) displayValue += '+';
      if (hasPercent) displayValue += '%';
      if (hasLt) displayValue = '<' + displayValue;
      
      element.textContent = displayValue;
      element.classList.add('counter-animated');
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }

  /**
   * Button Ripple Effect
   * Material Design-style ripple on click
   */
  function initButtonRipples() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .pricing-cta, .cta-button');
    
    buttons.forEach(button => {
      button.classList.add('ripple', 'btn-premium');
      
      button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  /**
   * Smooth Scroll for Anchor Links
   * Enhanced smooth scrolling with offset
   */
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          const headerOffset = 80;
          const elementPosition = targetElement.offsetTop;
          const offsetPosition = elementPosition - headerOffset;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  /**
   * Form Input Focus Animations
   * Gradient border animation on focus
   */
  function initFormFocusAnimations() {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      input.classList.add('input-premium');
      
      input.addEventListener('focus', function() {
        this.parentElement?.classList.add('focused');
      });
      
      input.addEventListener('blur', function() {
        this.parentElement?.classList.remove('focused');
      });
    });
  }

  /**
   * Glow Effects on Hover
   * Premium glow effect for featured elements
   */
  function initGlowEffects() {
    const glowElements = document.querySelectorAll('.pricing-card.featured, .cta-primary');
    glowElements.forEach(el => el.classList.add('glow-on-hover'));
  }

  /**
   * Accessibility Enhancements
   * Keyboard navigation and ARIA improvements
   */
  function initAccessibilityFeatures() {
    // Add keyboard navigation for FAQ
    const faqButtons = document.querySelectorAll('.faq-question');
    faqButtons.forEach((button, index) => {
      button.setAttribute('role', 'button');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', `faq-answer-${index}`);
      
      const answer = button.nextElementSibling;
      if (answer) {
        answer.setAttribute('id', `faq-answer-${index}`);
        answer.setAttribute('role', 'region');
      }
      
      button.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
      });
    });

    // Add ARIA labels to interactive elements
    const socialLinks = document.querySelectorAll('.social-link');
    socialLinks.forEach(link => {
      if (!link.getAttribute('aria-label')) {
        const iconClass = link.querySelector('i')?.className || '';
        if (iconClass.includes('linkedin')) link.setAttribute('aria-label', 'LinkedIn');
        else if (iconClass.includes('twitter')) link.setAttribute('aria-label', 'Twitter');
        else if (iconClass.includes('github')) link.setAttribute('aria-label', 'GitHub');
        else if (iconClass.includes('envelope')) link.setAttribute('aria-label', 'Email');
      }
    });

    // Ensure proper focus indicators
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', function() {
      document.body.classList.remove('keyboard-nav');
    });
  }

  /**
   * Lazy Load Images
   * Performance optimization
   */
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img.lazy').forEach(img => imageObserver.observe(img));
  }

  /**
   * Status Indicator Animation
   * Animated "Online" status indicator
   */
  const statusIndicators = document.querySelectorAll('.status-indicator');
  statusIndicators.forEach(indicator => {
    indicator.classList.add('status-pulse');
  });

  /**
   * Add hover lift to cards
   */
  const cards = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card');
  cards.forEach(card => card.classList.add('hover-lift'));

  /**
   * Link Underline Animation
   */
  const links = document.querySelectorAll('.footer-links a, .feature-link, .nav-link');
  links.forEach(link => link.classList.add('link-animated'));

  /**
   * Glass Morphism Effects
   */
  const glassElements = document.querySelectorAll('.trust-badge, .badge-item');
  glassElements.forEach(el => el.classList.add('glass-effect'));

})();

/**
 * Copy to Clipboard Functionality
 * For code snippets with success animation
 */
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.classList.add('success');
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.classList.remove('success');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}



/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} bounce-in`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  toast.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
