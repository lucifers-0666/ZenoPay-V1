/**
 * ZenoPay Footer Interactions (Premium)
 * Handles newsletter subscription, stats counters, and smoother interactions
 */

(function() {
    'use strict';
  
    document.addEventListener('DOMContentLoaded', function() {
      initNewsletterForm();
      initFooterAnimations();
      initStatsCounter();
      initSmoothScroll();
      initGlobalModalFallback();
    });

    /**
     * Global modal close fallback
     * Handles inconsistent modal patterns across pages:
     * - close button clicks
     * - backdrop clicks
     * - Escape key
     */
    function initGlobalModalFallback() {
      if (window.__zenoGlobalModalFallbackBound) return;
      window.__zenoGlobalModalFallbackBound = true;

      const MODAL_SELECTOR = '.modal, .modal-overlay, [role="dialog"]';
      const CLOSE_TRIGGER_SELECTOR = [
        '[data-close-modal]',
        '[data-dismiss="modal"]',
        '.close-modal',
        '.modal-close',
        '.close-btn',
        '.inv-close',
        '.beneficiary-modal-close'
      ].join(',');

      function isVisibleModal(el) {
        if (!el || !el.matches) return false;
        if (!el.matches(MODAL_SELECTOR)) return false;
        if (el.hasAttribute('hidden')) return false;

        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;

        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      function findModalFromTrigger(trigger) {
        if (!trigger) return null;

        const explicitId = trigger.getAttribute('data-close-modal');
        if (explicitId) {
          return document.getElementById(explicitId);
        }

        const nearestModal = trigger.closest(MODAL_SELECTOR);
        if (nearestModal) return nearestModal;

        return null;
      }

      function closeModalElement(modalEl) {
        if (!modalEl) return;

        modalEl.classList.remove('open', 'active', 'show', 'visible', 'modal-open');
        modalEl.removeAttribute('open');
        modalEl.setAttribute('hidden', 'hidden');
        modalEl.style.display = 'none';
        modalEl.setAttribute('aria-hidden', 'true');

        document.body.classList.remove('modal-open', 'no-scroll');
        if (document.body.style.overflow === 'hidden') {
          document.body.style.overflow = '';
        }
      }

      document.addEventListener('click', function(event) {
        const closeTrigger = event.target.closest(CLOSE_TRIGGER_SELECTOR);
        if (closeTrigger) {
          const modal = findModalFromTrigger(closeTrigger);
          if (modal) {
            closeModalElement(modal);
          }
          return;
        }

        const clickedModalBackdrop = event.target.closest(MODAL_SELECTOR);
        if (clickedModalBackdrop && event.target === clickedModalBackdrop && isVisibleModal(clickedModalBackdrop)) {
          closeModalElement(clickedModalBackdrop);
        }
      });

      document.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') return;

        const visibleModals = Array.from(document.querySelectorAll(MODAL_SELECTOR)).filter(isVisibleModal);
        const topModal = visibleModals.pop();
        if (topModal) {
          closeModalElement(topModal);
        }
      });

      window.ZenoModal = window.ZenoModal || {};
      window.ZenoModal.closeById = function(modalId) {
        closeModalElement(document.getElementById(modalId));
      };
    }
  
    /**
     * Newsletter Form Handler
     */
    function initNewsletterForm() {
      const newsletterForm = document.querySelector('.newsletter-form');
      
      if (!newsletterForm) return;
  
      newsletterForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const form = event.target;
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput ? emailInput.value : '';
        
        if (!email || !email.includes('@')) {
          showToast('Please enter a valid email address', 'error');
          return;
        }
        
        // Simulate API call
        const button = form.querySelector('button');
        const originalContent = button.innerHTML;
        
        button.disabled = true;
        button.innerHTML = '<span class="spinner" style="display:inline-block;width:12px;height:12px;border:2px solid white;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></span>';
        
        // Add spinner animation style if not present
        if (!document.getElementById('spinner-style')) {
            const style = document.createElement('style');
            style.id = 'spinner-style';
            style.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(style);
        }

        setTimeout(() => {
          button.disabled = false;
          button.innerHTML = '<i class="fas fa-check"></i>';
          showToast('Successfully subscribed! Welcome aboard.', 'success');
          form.reset();
          
          setTimeout(() => {
            button.innerHTML = originalContent;
          }, 3000);
        }, 1500);
      });
    }

    /**
     * Stats Counter Animation
     * Animates numbers when they scroll into view
     */
    function initStatsCounter() {
        const stats = document.querySelectorAll('.stat-number');
        if (stats.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;
                    const finalValue = parseFloat(target.getAttribute('data-target'));
                    animateValue(target, 0, finalValue, 2000);
                    observer.unobserve(target);
                }
            });
        }, { threshold: 0.5 });

        stats.forEach(stat => observer.observe(stat));
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Handle integers vs floats
            const current = progress * (end - start) + start;
            if (end % 1 !== 0) {
                obj.innerHTML = current.toFixed(1);
            } else {
                obj.innerHTML = Math.floor(current);
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                 if (end % 1 !== 0) {
                    obj.innerHTML = end;
                } else {
                    obj.innerHTML = end;
                }
            }
        };
        window.requestAnimationFrame(step);
    }

    /**
     * Footer Animation Effects
     */
    function initFooterAnimations() {
        const socialIcons = document.querySelectorAll('.social-icon');
        socialIcons.forEach(icon => {
            icon.addEventListener('mouseenter', () => {
                // Additional JS animation if CSS transform isn't enough, 
                // but CSS is usually preferred for performance.
                // Keeping this for potential future JS logic.
            });
        });
    }

    function initSmoothScroll() {
        const backToTop = document.getElementById('brandLogoTop');
        if(backToTop) {
            backToTop.addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }
  
    /**
     * Toast Notification System (Self-contained)
     */
    function showToast(message, type = 'info') {
      let toastContainer = document.querySelector('.footer-toast-container');
      if (!toastContainer) {
          toastContainer = document.createElement('div');
          toastContainer.className = 'footer-toast-container';
          toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
          `;
          document.body.appendChild(toastContainer);
      }

      const toast = document.createElement('div');
      
      const bgColor = type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#3B82F6');
      const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-circle' : 'info-circle');
      
      toast.style.cssText = `
        padding: 12px 20px;
        background: white;
        color: #1E293B;
        border-left: 4px solid ${bgColor};
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.3s ease;
        min-width: 280px;
      `;
      
      toast.innerHTML = `
        <i class="fas fa-${icon}" style="color: ${bgColor}; font-size: 16px;"></i>
        <span>${message}</span>
      `;
      
      toastContainer.appendChild(toast);
      
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      });
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  
  })();
