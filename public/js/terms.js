/**
 * ZenoPay Terms Page — Sticky TOC + Scroll Spy
 * Clean rewrite: no transform on ancestors, pure viewport sticky
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ── Config ──────────────────────────────────────────
  // Must match --navbar-height in terms.css
  const NAVBAR_H = parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue('--navbar-height') || '72'
  );
  const OFFSET = NAVBAR_H + 24; // extra breathing room

  // ── Elements ─────────────────────────────────────────
  const tocLinks  = [...document.querySelectorAll('.toc-item[data-section]')];
  const sections  = [...document.querySelectorAll('.terms-section[id]')];
  const tocWrap   = document.querySelector('.terms-toc-wrapper');
  const backToTop = document.getElementById('backToTop');
  const mobileBtn = document.querySelector('.mobile-toc-toggle');

  if (!tocLinks.length || !sections.length) return;

  // ── Active state ──────────────────────────────────────
  let activeId = sections[0]?.id || '';

  function setActive(id, autoScrollToc = true) {
    tocLinks.forEach(link => {
      const on = link.dataset.section === id;
      link.classList.toggle('toc-active', on);
      on ? link.setAttribute('aria-current', 'true')
         : link.removeAttribute('aria-current');
    });

    if (!autoScrollToc || !tocWrap) return;
    const activeLink = tocWrap.querySelector(`.toc-item[data-section="${id}"]`);
    if (activeLink) {
      const target = activeLink.offsetTop - tocWrap.clientHeight / 2 + activeLink.clientHeight / 2;
      tocWrap.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }
  }

  // ── Intersection Observer (primary spy) ──────────────
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          activeId = e.target.id;
          setActive(activeId);
        }
      });
    },
    {
      root: null,
      rootMargin: `-${OFFSET}px 0px -45% 0px`,
      threshold: 0
    }
  );
  sections.forEach(s => io.observe(s));

  // ── Scroll fallback (catches edge cases) ─────────────
  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const y = window.scrollY;

      // Find section whose top is closest to & at/above OFFSET
      let best = null, bestDist = Infinity;
      sections.forEach(s => {
        const top = s.getBoundingClientRect().top;
        if (top <= OFFSET) {
          const dist = Math.abs(top - OFFSET);
          if (dist < bestDist) { best = s; bestDist = dist; }
        }
      });

      // Bottom of page → highlight last section
      const atBottom = y + window.innerHeight >= document.documentElement.scrollHeight - 20;
      if (atBottom) best = sections[sections.length - 1];

      if (best && best.id !== activeId) {
        activeId = best.id;
        setActive(activeId);
      }

      // Back to top button
      if (backToTop) backToTop.classList.toggle('visible', y > 300);
    }, 10);
  }, { passive: true });

  // ── TOC link clicks ───────────────────────────────────
  tocLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.dataset.section;
      const target = document.getElementById(id);
      if (!target) return;

      activeId = id;
      setActive(id);

      const pos = target.getBoundingClientRect().top + window.scrollY - NAVBAR_H - 16;
      window.scrollTo({ top: pos, behavior: 'smooth' });
      history.pushState(null, '', `#${id}`);

      // Close mobile TOC after click
      if (window.innerWidth <= 768 && tocWrap) {
        tocWrap.classList.add('toc-hidden');
        if (mobileBtn) mobileBtn.textContent = '☰ Table of Contents';
      }
    });
  });

  // ── Hash on load ──────────────────────────────────────
  if (window.location.hash) {
    const id = window.location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => {
        const pos = target.getBoundingClientRect().top + window.scrollY - NAVBAR_H - 16;
        window.scrollTo({ top: pos, behavior: 'smooth' });
        activeId = id;
        setActive(id);
      }, 300);
    }
  }

  // ── Init active ───────────────────────────────────────
  setActive(activeId, false);

  // ── Back to top ───────────────────────────────────────
  if (backToTop) {
    backToTop.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' })
    );
  }

  // ── Print buttons ─────────────────────────────────────
  document.querySelectorAll('.download-btn, .print-btn').forEach(btn => {
    btn.addEventListener('click', () => window.print());
  });

  // ── Mobile TOC toggle ─────────────────────────────────
  if (mobileBtn && tocWrap) {
    // Hide sidebar on mobile by default
    if (window.innerWidth <= 768) {
      tocWrap.classList.add('toc-hidden');
      mobileBtn.textContent = '☰ Table of Contents';
    }

    mobileBtn.addEventListener('click', () => {
      const hidden = tocWrap.classList.toggle('toc-hidden');
      mobileBtn.textContent = hidden ? '☰ Table of Contents' : '✕ Close Contents';
    });
  }
});
