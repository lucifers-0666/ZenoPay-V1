/**
 * Terms page interactions:
 * - Sticky-aware TOC scroll spy
 * - Smooth section navigation with header offset
 * - Back-to-top + print actions
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const NAVBAR_HEIGHT = 80;
  const ACTIVE_OFFSET = NAVBAR_HEIGHT + 40;

  const tocLinks = Array.from(document.querySelectorAll('.toc-item[data-section]'));
  const sections = Array.from(document.querySelectorAll('.terms-section[id]'));
  const tocWrapper = document.querySelector('.terms-toc-wrapper');
  const backToTopBtn = document.getElementById('backToTop');

  if (!tocLinks.length || !sections.length) {
    return;
  }

  let currentActive = sections[0]?.id || '';

  function setActive(sectionId, shouldScrollToc = true) {
    tocLinks.forEach((link) => {
      const isActive = link.dataset.section === sectionId;
      link.classList.toggle('toc-active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (!shouldScrollToc || !tocWrapper) {
      return;
    }

    const activeLink = document.querySelector(`.toc-item[data-section="${sectionId}"]`);
    if (activeLink) {
      const targetScrollTop = activeLink.offsetTop - (tocWrapper.clientHeight / 2) + (activeLink.clientHeight / 2);
      tocWrapper.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          currentActive = entry.target.id;
          setActive(currentActive);
        }
      });
    },
    {
      root: null,
      rootMargin: `-${ACTIVE_OFFSET}px 0px -40% 0px`,
      threshold: 0
    }
  );

  sections.forEach((section) => observer.observe(section));

  let scrollTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const scrollY = window.scrollY;

      let closest = null;
      let closestDist = Infinity;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const distFromTop = Math.abs(rect.top - ACTIVE_OFFSET);

        if (rect.top <= ACTIVE_OFFSET && distFromTop < closestDist) {
          closest = section;
          closestDist = distFromTop;
        }
      });

      if (closest && closest.id !== currentActive) {
        currentActive = closest.id;
        setActive(currentActive);
      }

      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      if (scrollY + winHeight >= docHeight - 20) {
        const lastSection = sections[sections.length - 1];
        if (lastSection && lastSection.id !== currentActive) {
          currentActive = lastSection.id;
          setActive(currentActive);
        }
      }

      if (backToTopBtn) {
        backToTopBtn.classList.toggle('visible', scrollY > 300);
      }
    }, 10);
  }, { passive: true });

  tocLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const targetId = link.dataset.section;
      const target = document.getElementById(targetId);
      if (!target) {
        return;
      }

      currentActive = targetId;
      setActive(targetId);

      const targetPos = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT - 16;
      window.scrollTo({
        top: targetPos,
        behavior: 'smooth'
      });

      history.pushState(null, '', `#${targetId}`);
    });
  });

  if (window.location.hash) {
    const hashId = window.location.hash.slice(1);
    const target = document.getElementById(hashId);

    if (target) {
      setTimeout(() => {
        const targetPos = target.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT - 16;
        window.scrollTo({
          top: targetPos,
          behavior: 'smooth'
        });
        currentActive = hashId;
        setActive(hashId);
      }, 300);
    }
  }

  setActive(currentActive || 'section-1', false);

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const downloadBtn = document.querySelector('.download-btn');
  const printBtn = document.querySelector('.print-btn');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => window.print());
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }
});
