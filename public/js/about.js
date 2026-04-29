'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function getInitials(name) {
  return (name || 'ZenoPay')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function getAvatarGradient(name) {
  const palettes = [
    ['#2563eb', '#1d4ed8'],
    ['#7c3aed', '#5b21b6'],
    ['#10b981', '#047857'],
    ['#0ea5e9', '#0369a1'],
    ['#f59e0b', '#d97706'],
    ['#ec4899', '#be185d']
  ];
  const seed = Array.from(name || 'ZenoPay').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[seed % palettes.length];
}

function injectInitialsAvatar(wrapper, img) {
  if (!wrapper || wrapper.querySelector('.initials-avatar')) return;

  const alt = img.getAttribute('alt') || 'ZenoPay';
  const initials = getInitials(alt);
  const [from, to] = getAvatarGradient(alt);
  const avatar = document.createElement('div');

  avatar.className = 'initials-avatar';
  avatar.textContent = initials;
  avatar.style.background = `linear-gradient(135deg, ${from}, ${to})`;
  avatar.style.fontSize = wrapper.classList.contains('founder-avatar') ? '1.25rem' : '1rem';

  img.style.display = 'none';
  wrapper.appendChild(avatar);
}

function setupAvatarFallbacks() {
  document.querySelectorAll('.founder-avatar img, .team-avatar img').forEach((img) => {
    const wrapper = img.closest('.founder-avatar, .team-avatar');
    const handleFailure = () => injectInitialsAvatar(wrapper, img);

    img.addEventListener('error', handleFailure, { once: true });

    if (img.complete && img.naturalWidth === 0) {
      handleFailure();
    }
  });
}

function animateCounter(el) {
  if (!el || el.dataset.counted === 'true') return;
  el.dataset.counted = 'true';

  const target = parseFloat(el.dataset.target || '0');
  const suffix = el.dataset.suffix || '';
  const isDecimal = String(el.dataset.target || '').includes('.');
  const duration = 1800;
  const start = performance.now();

  const render = (value, forceFinal = false) => {
    let output;

    if (isDecimal) {
      output = forceFinal ? target.toFixed(1) : value.toFixed(1);
    } else if (Math.abs(target) >= 1000) {
      output = forceFinal
        ? Math.round(target).toLocaleString('en-IN')
        : Math.floor(value).toLocaleString('en-IN');
    } else {
      output = forceFinal ? String(Math.round(target)) : String(Math.floor(value));
    }

    el.textContent = `${output}${suffix}`;
  };

  if (prefersReducedMotion || !('requestAnimationFrame' in window)) {
    render(target, true);
    return;
  }

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    render(target * easeOutQuart(progress), progress === 1);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function createRevealObserver() {
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    return null;
  }

  return new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      if (entry.target.classList.contains('timeline-item')) {
        entry.target.classList.add('timeline-animate-in');
      } else {
        entry.target.classList.add('animate-in');
      }

      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });
}

function revealTargetsImmediately(elements) {
  elements.forEach((el) => {
    if (el.classList.contains('timeline-item')) {
      el.classList.add('timeline-animate-in');
    } else {
      el.classList.add('animate-in');
    }
  });
}

function setupRevealAnimations() {
  const elements = Array.from(document.querySelectorAll('[data-animate], .value-card, .founder-card, .team-card, .timeline-item, .cert-badge'));
  if (!elements.length) return;

  [
    '.values-grid .value-card',
    '.founders-grid .founder-card',
    '.team-grid .team-card',
    '.certifications-grid .cert-badge'
  ].forEach((selector) => {
    document.querySelectorAll(selector).forEach((item, index) => {
      item.style.setProperty('--reveal-delay', `${index * 0.08}s`);
    });
  });

  document.querySelectorAll('.timeline-item').forEach((item, index) => {
    item.style.setProperty('--timeline-delay', `${index * 0.08}s`);
  });

  const observer = createRevealObserver();

  if (!observer) {
    revealTargetsImmediately(elements);
    return;
  }

  elements.forEach((el) => observer.observe(el));

  window.setTimeout(() => {
    document.querySelectorAll('.timeline-item:not(.timeline-animate-in), .value-card:not(.animate-in), .founder-card:not(.animate-in), .team-card:not(.animate-in), .cert-badge:not(.animate-in), [data-animate]:not(.animate-in)')
      .forEach((el) => {
        if (el.classList.contains('timeline-item')) {
          el.classList.add('timeline-animate-in');
        } else {
          el.classList.add('animate-in');
        }
      });
  }, 2000);
}

function setupCounters() {
  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) return;

  const counters = Array.from(statsSection.querySelectorAll('.stat-number'));
  if (!counters.length) return;

  const run = () => counters.forEach(animateCounter);

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    run();
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      run();
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -40px 0px'
  });

  observer.observe(statsSection);
}

function setupSmoothScroll() {
  const offset = 80;

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();

      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupAvatarFallbacks();
  setupRevealAnimations();
  setupCounters();
  setupSmoothScroll();

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
