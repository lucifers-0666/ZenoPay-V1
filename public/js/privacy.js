document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ------------------------------------------------------------------
     Element references
  ------------------------------------------------------------------ */
  const root         = document.documentElement;
  const tocWrapper   = document.getElementById('privacyTocPanel');
  const tocToggle    = document.getElementById('privacyMobileTocToggle');
  const tocLinks     = Array.from(document.querySelectorAll('.toc-item[data-section]'));
  const sections     = Array.from(document.querySelectorAll('.privacy-section[id]'));
  const backToTop    = document.getElementById('privacyBackToTop');
  const printBtn     = document.getElementById('privacyPrintButton');
  const downloadBtn  = document.getElementById('privacyDownloadButton');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileBreakpoint     = window.matchMedia('(max-width: 768px)');

  if (!tocWrapper || !tocLinks.length || !sections.length) {
    return;
  }

  /* ------------------------------------------------------------------
     State
  ------------------------------------------------------------------ */
  let currentActiveSection = sections[0].id;
  let observer             = null;
  let ticking              = false;

  /* ------------------------------------------------------------------
     CSS variable helpers
  ------------------------------------------------------------------ */
  function readCssPx(variable, fallback) {
    const raw = parseFloat(getComputedStyle(root).getPropertyValue(variable));
    return Number.isFinite(raw) ? raw : fallback;
  }

  /**
   * Measure the actual sticky header height from the DOM.
   * Falls back to the --header-offset CSS variable.
   */
  function resolveHeaderHeight() {
    const candidates = [
      'header',
      '.site-header',
      '.main-header',
      '.modern-header',
      '.header',
      '[data-sticky-header]',
    ];

    for (const selector of candidates) {
      const el = document.querySelector(selector);
      if (!el) continue;
      const { height } = el.getBoundingClientRect();
      if (height > 0) return Math.round(height);
    }

    return readCssPx('--header-offset', 72);
  }

  function updateHeaderOffset() {
    root.style.setProperty('--header-offset', `${resolveHeaderHeight()}px`);
  }

  function getOffsets() {
    const headerOffset = readCssPx('--header-offset', 72);
    const headerGap    = readCssPx('--header-gap', 24);
    const stickyTop    = headerOffset + headerGap;
    const scrollOffset = stickyTop + 12;
    return { headerOffset, headerGap, stickyTop, scrollOffset };
  }

  /* ------------------------------------------------------------------
     Mobile helpers
  ------------------------------------------------------------------ */
  function isMobile() {
    return mobileBreakpoint.matches;
  }

  function setTocOpen(isOpen) {
    if (isMobile()) {
      tocWrapper.classList.toggle('is-collapsed-mobile', !isOpen);
      tocToggle?.setAttribute('aria-expanded', String(isOpen));
    } else {
      tocWrapper.classList.remove('is-collapsed-mobile');
      tocToggle?.setAttribute('aria-expanded', 'false');
    }
  }

  function syncTocStateWithViewport() {
    if (isMobile()) {
      /* Keep collapsed state as-is on mobile; only expand if currently open */
      if (!tocWrapper.classList.contains('is-collapsed-mobile')) {
        setTocOpen(true);
      }
    } else {
      setTocOpen(true);
    }
  }

  /* ------------------------------------------------------------------
     Active section management
  ------------------------------------------------------------------ */
  function ensureActiveLinkVisible(activeLink) {
    if (!activeLink) return;

    const wrapperRect = tocWrapper.getBoundingClientRect();
    const linkRect    = activeLink.getBoundingClientRect();

    if (linkRect.top < wrapperRect.top + 16 || linkRect.bottom > wrapperRect.bottom - 16) {
      const targetTop = activeLink.offsetTop - (tocWrapper.clientHeight / 2) + (activeLink.clientHeight / 2);
      tocWrapper.scrollTo({
        top:      Math.max(0, targetTop),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  }

  function setActiveSection(sectionId, { scrollToc = true } = {}) {
    currentActiveSection = sectionId;
    let activeLink       = null;

    tocLinks.forEach((link) => {
      const isActive = link.dataset.section === sectionId;
      link.classList.toggle('toc-active', isActive);

      if (isActive) {
        activeLink = link;
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (scrollToc && activeLink) {
      ensureActiveLinkVisible(activeLink);
    }
  }

  /* ------------------------------------------------------------------
     Programmatic smooth scroll (click)
  ------------------------------------------------------------------ */
  function scrollToSection(sectionId, updateHistory = true) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    const { scrollOffset } = getOffsets();
    const top = target.getBoundingClientRect().top + window.scrollY - scrollOffset;

    window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

    if (updateHistory) {
      history.pushState(null, '', `#${sectionId}`);
    }
  }

  /* ------------------------------------------------------------------
     Scroll-based active-section fallback
  ------------------------------------------------------------------ */
  function findClosestSection() {
    const { scrollOffset } = getOffsets();
    let closest         = sections[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section) => {
      const rect     = section.getBoundingClientRect();
      const distance = Math.abs(rect.top - scrollOffset);

      if (rect.top <= scrollOffset + 40 && distance < closestDistance) {
        closest         = section;
        closestDistance = distance;
      }
    });

    /* When scrolled to the very bottom, highlight the last section */
    const docBottom = window.scrollY + window.innerHeight;
    const pageH     = document.documentElement.scrollHeight;
    if (docBottom >= pageH - 8) {
      closest = sections[sections.length - 1];
    }

    return closest;
  }

  function handleScrollFallback() {
    if (ticking) return;
    ticking = true;

    window.requestAnimationFrame(() => {
      const closest = findClosestSection();
      if (closest && closest.id !== currentActiveSection) {
        setActiveSection(closest.id);
      }

      if (backToTop) {
        backToTop.classList.toggle('is-visible', window.scrollY > 300);
      }

      ticking = false;
    });
  }

  /* ------------------------------------------------------------------
     IntersectionObserver (primary detection)
  ------------------------------------------------------------------ */
  function createObserver() {
    observer?.disconnect();

    const { scrollOffset } = getOffsets();

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio ||
              a.boundingClientRect.top - b.boundingClientRect.top,
          );

        if (visible.length > 0) {
          const nextId = visible[0].target.id;
          if (nextId !== currentActiveSection) {
            setActiveSection(nextId);
          }
        }
      },
      {
        root:       null,
        rootMargin: `-${scrollOffset}px 0px -55% 0px`,
        threshold:  [0, 0.12, 0.25, 0.45, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------
     Event listeners
  ------------------------------------------------------------------ */

  /* TOC link clicks — smooth scroll + mobile close */
  tocLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.dataset.section;

      setActiveSection(targetId);
      scrollToSection(targetId);

      if (isMobile()) {
        setTocOpen(false);
      }
    });
  });

  /* Mobile toggle */
  tocToggle?.addEventListener('click', () => {
    const isExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
    setTocOpen(!isExpanded);
  });

  /* Print / Download */
  printBtn?.addEventListener('click', () => window.print());
  downloadBtn?.addEventListener('click', () => window.print());

  /* Back to top */
  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* Viewport resize — recalculate header offset & observer margins */
  window.addEventListener(
    'resize',
    () => {
      updateHeaderOffset();
      createObserver();
      handleScrollFallback();
    },
    { passive: true },
  );

  /* Breakpoint change — sync TOC visibility mode */
  mobileBreakpoint.addEventListener('change', () => {
    syncTocStateWithViewport();
    createObserver();
  });

  /* Scroll — fallback active detection + back-to-top visibility */
  window.addEventListener('scroll', handleScrollFallback, { passive: true });

  /* ------------------------------------------------------------------
     Initialise
  ------------------------------------------------------------------ */
  updateHeaderOffset();
  syncTocStateWithViewport();
  createObserver();

  /* Handle deep-link hash on page load */
  if (window.location.hash) {
    const linkedId = window.location.hash.slice(1);
    if (document.getElementById(linkedId)) {
      setActiveSection(linkedId, { scrollToc: false });
      window.setTimeout(() => scrollToSection(linkedId, false), 120);
    }
  } else {
    setActiveSection(currentActiveSection, { scrollToc: false });
  }

  handleScrollFallback();
});
