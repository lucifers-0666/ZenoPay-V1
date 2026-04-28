/*
 * Landing page interactions for the redesigned ZenoPay about/home page.
 * Keeps behavior focused on tabs, pricing toggle, FAQ accordion, counters,
 * and accessible reveal animations.
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function formatCount(target, prefix = '', suffix = '') {
    const rounded = Number.isInteger(target) ? target.toLocaleString('en-IN') : target.toFixed(1);
    return `${prefix}${rounded}${suffix}`;
  }

  function animateCounter(el) {
    if (!el || el.dataset.animated === 'true') return;
    el.dataset.animated = 'true';

    const target = Number(el.dataset.count || 0);
    const prefix = el.dataset.countPrefix || '';
    const suffix = el.dataset.countSuffix || '';

    if (prefersReducedMotion) {
      el.textContent = formatCount(target, prefix, suffix);
      return;
    }

    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const value = target * (0.12 + progress * 0.88);
      const formatted = formatCount(value, prefix, suffix);
      el.textContent = progress < 1 ? formatted : formatCount(target, prefix, suffix);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }

  function setActiveTab(tabButtons, panels, activeId, shouldFocus = false) {
    tabButtons.forEach((button, index) => {
      const isActive = button.dataset.paymentTab === activeId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.setAttribute('tabindex', isActive ? '0' : '-1');
      if (isActive && shouldFocus) button.focus({ preventScroll: true });
    });

    panels.forEach((panel) => {
      const isActive = panel.id === `payment-panel-${activeId}`;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  }

  function setCodeTab(tabButtons, panels, activeId, shouldFocus = false) {
    tabButtons.forEach((button) => {
      const isActive = button.dataset.codeTab === activeId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.setAttribute('tabindex', isActive ? '0' : '-1');
      if (isActive && shouldFocus) button.focus({ preventScroll: true });
    });

    panels.forEach((panel) => {
      const isActive = panel.dataset.codePanel === activeId;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  }

  function updatePricing(period) {
    document.querySelectorAll('[data-price-monthly]').forEach((price) => {
      const monthly = price.dataset.priceMonthly;
      const annual = price.dataset.priceAnnual;
      price.textContent = period === 'annual' ? annual : monthly;
      const parent = price.closest('.pricing-card');
      if (parent) {
        const suffix = parent.querySelector('[data-price-suffix]');
        if (suffix) suffix.textContent = period === 'annual' ? '/yr' : '/mo';
      }
    });
  }

  function copyActiveCode(consoleRoot, feedbackBtn) {
    const activePanel = consoleRoot.querySelector('.developer-code.is-active pre code');
    if (!activePanel) return;

    const text = activePanel.textContent || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const original = feedbackBtn.innerHTML;
        feedbackBtn.innerHTML = '<i class="fas fa-check"></i><span>Copied</span>';
        window.setTimeout(() => {
          feedbackBtn.innerHTML = original;
        }, 1400);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const revealTargets = document.querySelectorAll('[data-reveal], .proof-card, .feature-card, .security-card, .pricing-card, .faq-item');

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

      revealTargets.forEach((target) => revealObserver.observe(target));
    } else {
      revealTargets.forEach((target) => target.classList.add('is-visible'));
    }

    // Smooth scroll for in-page anchors only.
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });

    // Social proof counters.
    const proofStrip = document.querySelector('.proof-strip');
    const counterTargets = document.querySelectorAll('[data-count]');
    let countersAnimated = false;

    if (proofStrip && 'IntersectionObserver' in window) {
      const proofObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !countersAnimated) {
            countersAnimated = true;
            counterTargets.forEach((counter) => animateCounter(counter));
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });

      proofObserver.observe(proofStrip);
    } else {
      counterTargets.forEach((counter) => animateCounter(counter));
    }

    // Payment tabs.
    const paymentTabs = Array.from(document.querySelectorAll('[data-payment-tab]'));
    const paymentPanels = Array.from(document.querySelectorAll('[role="tabpanel"][id^="payment-panel-"]'));
    if (paymentTabs.length && paymentPanels.length) {
      const activatePaymentTab = (tabId, shouldFocus = false) => setActiveTab(paymentTabs, paymentPanels, tabId, shouldFocus);

      paymentTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activatePaymentTab(tab.dataset.paymentTab, true));
        tab.addEventListener('keydown', (event) => {
          const currentIndex = paymentTabs.indexOf(tab);
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            let nextIndex = currentIndex;
            if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % paymentTabs.length;
            if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + paymentTabs.length) % paymentTabs.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = paymentTabs.length - 1;
            activatePaymentTab(paymentTabs[nextIndex].dataset.paymentTab, true);
          }
        });
        tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
      });
    }

    // Pricing toggle.
    const pricingButtons = Array.from(document.querySelectorAll('[data-billing]'));
    if (pricingButtons.length) {
      const setBilling = (period) => {
        pricingButtons.forEach((button) => {
          const isActive = button.dataset.billing === period;
          button.classList.toggle('is-active', isActive);
          button.setAttribute('aria-selected', String(isActive));
        });
        updatePricing(period);
      };

      pricingButtons.forEach((button) => {
        button.addEventListener('click', () => setBilling(button.dataset.billing));
      });

      setBilling('monthly');
    }

    // Developer console tabs and copy button.
    const codeTabs = Array.from(document.querySelectorAll('[data-code-tab]'));
    const codePanels = Array.from(document.querySelectorAll('[data-code-panel]'));
    const copyButton = document.querySelector('[data-copy-code]');
    const consoleRoot = document.querySelector('[data-code-console]');

    if (codeTabs.length && codePanels.length) {
      const activateCodeTab = (tabId, shouldFocus = false) => setCodeTab(codeTabs, codePanels, tabId, shouldFocus);

      codeTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => activateCodeTab(tab.dataset.codeTab, true));
        tab.addEventListener('keydown', (event) => {
          const currentIndex = codeTabs.indexOf(tab);
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            let nextIndex = currentIndex;
            if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % codeTabs.length;
            if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + codeTabs.length) % codeTabs.length;
            if (event.key === 'Home') nextIndex = 0;
            if (event.key === 'End') nextIndex = codeTabs.length - 1;
            activateCodeTab(codeTabs[nextIndex].dataset.codeTab, true);
          }
        });
        tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
      });

      if (copyButton && consoleRoot) {
        copyButton.addEventListener('click', () => copyActiveCode(consoleRoot, copyButton));
      }
    }

    // FAQ details keyboard polish.
    document.querySelectorAll('.faq-item > summary').forEach((summary) => {
      summary.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          summary.parentElement.open = !summary.parentElement.open;
        }
      });
    });

    // Ensure the first payment tab and code tab are active on load.
    if (paymentTabs.length) {
      setActiveTab(paymentTabs, paymentPanels, paymentTabs[0].dataset.paymentTab, false);
    }
    if (codeTabs.length) {
      setCodeTab(codeTabs, codePanels, codeTabs[0].dataset.codeTab, false);
    }
  });
})();
