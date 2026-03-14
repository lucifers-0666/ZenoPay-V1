document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const root = document.documentElement;
  const tocWrapper = document.getElementById('termsTocPanel');
  const tocToggle = document.getElementById('mobileTocToggle');
  const tocLinks = Array.from(document.querySelectorAll('.toc-item[data-section]'));
  const sections = Array.from(document.querySelectorAll('.terms-section[id]'));
  const backToTopButton = document.getElementById('backToTop');
  const printButton = document.getElementById('termsPrintButton');
  const downloadButton = document.getElementById('termsDownloadButton');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileBreakpoint = window.matchMedia('(max-width: 768px)');

  if (!tocWrapper || !tocLinks.length || !sections.length) {
    return;
  }

  let currentActiveSection = sections[0].id;
  let observer = null;
  let ticking = false;

  function readCssPx(variableName, fallbackValue) {
    const value = parseFloat(getComputedStyle(root).getPropertyValue(variableName));
    return Number.isFinite(value) ? value : fallbackValue;
  }

  function resolveHeaderHeight() {
    const selectors = [
      'header',
      '.site-header',
      '.main-header',
      '.modern-header',
      '.header',
      '[data-sticky-header]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) {
        continue;
      }

      const rect = element.getBoundingClientRect();
      if (rect.height > 0) {
        return Math.round(rect.height);
      }
    }

    return readCssPx('--header-offset', 72);
  }

  function updateHeaderOffset() {
    root.style.setProperty('--header-offset', `${resolveHeaderHeight()}px`);
  }

  function getOffsets() {
    const headerOffset = readCssPx('--header-offset', 72);
    const headerGap = readCssPx('--header-gap', 24);
    const stickyTop = headerOffset + headerGap;
    const scrollOffset = stickyTop + 12;
    return { headerOffset, headerGap, stickyTop, scrollOffset };
  }

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
      setTocOpen(false);
    } else {
      setTocOpen(true);
    }
  }

  function ensureActiveLinkVisible(activeLink) {
    if (!activeLink) {
      return;
    }

    const wrapperRect = tocWrapper.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    if (linkRect.top < wrapperRect.top + 16 || linkRect.bottom > wrapperRect.bottom - 16) {
      const targetTop = activeLink.offsetTop - (tocWrapper.clientHeight / 2) + (activeLink.clientHeight / 2);
      tocWrapper.scrollTo({
        top: Math.max(0, targetTop),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    }
  }

  function setActiveSection(sectionId, options = {}) {
    const { scrollToc = true } = options;
    currentActiveSection = sectionId;

    let activeLink = null;

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

  function scrollToSection(sectionId, updateHistory = true) {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    const { scrollOffset } = getOffsets();
    const top = target.getBoundingClientRect().top + window.scrollY - scrollOffset;

    window.scrollTo({
      top,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });

    if (updateHistory) {
      history.pushState(null, '', `#${sectionId}`);
    }
  }

  function findClosestSection() {
    const { scrollOffset } = getOffsets();
    let closest = sections[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top - scrollOffset);

      if (rect.top <= scrollOffset + 40 && distance < closestDistance) {
        closest = section;
        closestDistance = distance;
      }
    });

    const documentBottom = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;
    if (documentBottom >= pageHeight - 8) {
      closest = sections[sections.length - 1];
    }

    return closest;
  }

  function handleScrollFallback() {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(() => {
      const closest = findClosestSection();
      if (closest && closest.id !== currentActiveSection) {
        setActiveSection(closest.id);
      }

      if (backToTopButton) {
        backToTopButton.classList.toggle('is-visible', window.scrollY > 480);
      }

      ticking = false;
    });
  }

  function createObserver() {
    observer?.disconnect();

    const { scrollOffset } = getOffsets();

    observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio || a.boundingClientRect.top - b.boundingClientRect.top);

      if (visibleEntries.length > 0) {
        const nextSectionId = visibleEntries[0].target.id;
        if (nextSectionId !== currentActiveSection) {
          setActiveSection(nextSectionId);
        }
      }
    }, {
      root: null,
      rootMargin: `-${scrollOffset}px 0px -55% 0px`,
      threshold: [0, 0.12, 0.25, 0.45, 0.7]
    });

    sections.forEach((section) => observer.observe(section));
  }

  tocLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetSectionId = link.dataset.section;

      setActiveSection(targetSectionId);
      scrollToSection(targetSectionId);

      if (isMobile()) {
        setTocOpen(false);
      }
    });
  });

  tocToggle?.addEventListener('click', () => {
    const currentlyExpanded = tocToggle.getAttribute('aria-expanded') === 'true';
    setTocOpen(!currentlyExpanded);
  });

  printButton?.addEventListener('click', () => {
    window.print();
  });

  downloadButton?.addEventListener('click', () => {
    window.print();
  });

  backToTopButton?.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  });

  mobileBreakpoint.addEventListener('change', () => {
    syncTocStateWithViewport();
    createObserver();
  });

  window.addEventListener('resize', () => {
    updateHeaderOffset();
    createObserver();
    handleScrollFallback();
  }, { passive: true });

  window.addEventListener('scroll', handleScrollFallback, { passive: true });

  updateHeaderOffset();
  syncTocStateWithViewport();
  createObserver();

  if (window.location.hash) {
    const sectionId = window.location.hash.slice(1);
    if (document.getElementById(sectionId)) {
      setActiveSection(sectionId, { scrollToc: false });
      window.setTimeout(() => {
        scrollToSection(sectionId, false);
      }, 120);
    }
  } else {
    setActiveSection(currentActiveSection, { scrollToc: false });
  }

  handleScrollFallback();
});
