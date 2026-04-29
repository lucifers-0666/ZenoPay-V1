(function () {
  'use strict';

  function formatValue(value, options) {
    const prefix = options.prefix || '';
    const suffix = options.suffix || '';
    const decimals = Number.isFinite(options.decimals) ? options.decimals : 0;
    const format = options.format || 'number';
    const numericValue = Number(value) || 0;

    if (format === 'currency') {
      return prefix + numericValue.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
    }

    if (decimals > 0) {
      return prefix + numericValue.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
    }

    return prefix + Math.round(numericValue).toLocaleString('en-IN') + suffix;
  }

  function createRevealObserver() {
    const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!revealItems.length) {
      return;
    }

    const revealNow = function (element) {
      const delay = Number(element.dataset.revealDelay || 0);
      window.setTimeout(function () {
        element.classList.add('is-revealed');
      }, delay);
    };

    if (!('IntersectionObserver' in window)) {
      revealItems.forEach(revealNow);
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        revealNow(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    revealItems.forEach(function (item) {
      observer.observe(item);
    });

    window.setTimeout(function () {
      revealItems.forEach(function (item) {
        item.classList.add('is-revealed');
      });
    }, 1400);
  }

  function initCounters() {
    const counters = Array.from(document.querySelectorAll('[data-count-to]'));
    if (!counters.length) {
      return;
    }

    const started = new WeakSet();

    function animateCounter(node) {
      if (started.has(node)) {
        return;
      }

      started.add(node);

      const target = Number(node.dataset.countTo || 0);
      const prefix = node.dataset.prefix || '';
      const suffix = node.dataset.suffix || '';
      const decimals = Number(node.dataset.decimals || 0);
      const format = node.dataset.format || 'number';
      const duration = 1400;
      const startTime = performance.now();

      function tick(now) {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = formatValue(target * eased, {
          prefix: prefix,
          suffix: suffix,
          decimals: decimals,
          format: format
        });

        if (progress < 1) {
          window.requestAnimationFrame(tick);
        } else {
          node.textContent = formatValue(target, {
            prefix: prefix,
            suffix: suffix,
            decimals: decimals,
            format: format
          });
        }
      }

      window.requestAnimationFrame(tick);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.2
    });

    counters.forEach(function (counter) {
      observer.observe(counter);
    });

    window.setTimeout(function () {
      counters.forEach(animateCounter);
    }, 1800);
  }

  function initPricingToggle() {
    const toggle = document.getElementById('billingToggle');
    if (!toggle) {
      return;
    }

    const monthlyLabel = document.getElementById('monthlyLabel');
    const annualLabel = document.getElementById('annualLabel');
    const prices = Array.from(document.querySelectorAll('.dash-pricing-price'));
    const periods = Array.from(document.querySelectorAll('.dash-pricing-period'));

    function updatePricing() {
      const annual = toggle.checked;

      if (monthlyLabel) {
        monthlyLabel.classList.toggle('is-active', !annual);
      }

      if (annualLabel) {
        annualLabel.classList.toggle('is-active', annual);
      }

      prices.forEach(function (price) {
        const nextValue = annual ? price.dataset.annual : price.dataset.monthly;
        price.textContent = nextValue || price.textContent;
      });

      periods.forEach(function (period) {
        period.textContent = annual ? '/month billed annually' : '/month';
      });
    }

    toggle.addEventListener('change', updatePricing);
    updatePricing();
  }

  function initProgressBars() {
    const bars = Array.from(document.querySelectorAll('.dash-progress > [data-progress]'));
    bars.forEach(function (bar) {
      const value = Number(bar.dataset.progress || 0);
      const width = Math.max(0, Math.min(100, value));
      bar.style.width = width + '%';
    });
  }

  function initPaymentTabs() {
    const tabs = Array.from(document.querySelectorAll('[data-pm-tab]'));
    const panels = Array.from(document.querySelectorAll('.dash-tab-panel'));

    if (!tabs.length || !panels.length) {
      return;
    }

    function activateTab(tab) {
      const target = tab.dataset.pmTab;
      tabs.forEach(function (item) {
        const active = item === tab;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      panels.forEach(function (panel) {
        panel.classList.toggle('is-active', panel.id === 'tab-' + target);
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        activateTab(tab);
      });
    });
  }

  function showTemporaryIcon(button, iconClass) {
    const icon = button.querySelector('i');
    if (!icon) {
      return;
    }

    const original = icon.className;
    icon.className = iconClass;

    window.setTimeout(function () {
      icon.className = original;
    }, 1400);
  }

  function copyText(text) {
    if (!text) {
      return Promise.resolve(false);
    }

    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }).catch(function () {
        return false;
      });
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textArea);
    return Promise.resolve(copied);
  }

  function initCopyActions() {
    const copyValueButtons = Array.from(document.querySelectorAll('[data-copy-value]'));
    const copyTargetButtons = Array.from(document.querySelectorAll('[data-copy-target]'));

    copyValueButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        copyText(button.dataset.copyValue || '').then(function (copied) {
          if (copied) {
            showTemporaryIcon(button, 'fas fa-check');
          }
        });
      });
    });

    copyTargetButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const target = document.getElementById(button.dataset.copyTarget || '');
        if (!target) {
          return;
        }

        copyText(target.textContent || '').then(function (copied) {
          if (copied) {
            showTemporaryIcon(button, 'fas fa-check');
          }
        });
      });
    });
  }

  function initDismissActions() {
    const dismissButtons = Array.from(document.querySelectorAll('[data-dismiss-target]'));

    dismissButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        const target = document.getElementById(button.dataset.dismissTarget || '');
        if (target) {
          target.style.display = 'none';
        }
      });
    });
  }

  function initRippleEffects() {
    const buttons = Array.from(document.querySelectorAll('[data-ripple]'));

    buttons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);

        ripple.className = 'dash-ripple';
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left) + 'px';
        ripple.style.top = (event.clientY - rect.top) + 'px';

        button.appendChild(ripple);

        window.setTimeout(function () {
          ripple.remove();
        }, 600);
      });
    });
  }

  function initSmoothAnchors() {
    const anchors = Array.from(document.querySelectorAll('a[href^="#"]'));

    anchors.forEach(function (anchor) {
      anchor.addEventListener('click', function (event) {
        const href = anchor.getAttribute('href');
        if (!href || href === '#') {
          return;
        }

        const target = document.querySelector(href);
        if (!target) {
          return;
        }

        event.preventDefault();

        const header = document.querySelector('header');
        const headerOffset = header ? header.getBoundingClientRect().height : 72;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset - 12;

        window.scrollTo({
          top: top,
          behavior: 'smooth'
        });
      });
    });
  }

  function initNewsletterValidation() {
    const forms = Array.from(document.querySelectorAll('form[data-validate]'));
    forms.forEach(function (form) {
      form.addEventListener('submit', function (event) {
        const email = form.querySelector('input[type="email"]');
        if (!email || email.value.trim()) {
          return;
        }

        event.preventDefault();
        email.focus();
      });
    });
  }

  function init() {
    createRevealObserver();
    initCounters();
    initProgressBars();
    initPricingToggle();
    initPaymentTabs();
    initCopyActions();
    initDismissActions();
    initRippleEffects();
    initSmoothAnchors();
    initNewsletterValidation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
