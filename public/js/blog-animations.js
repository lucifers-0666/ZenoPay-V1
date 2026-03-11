(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-loaded');
  });

  document.querySelectorAll('a').forEach((a) => {
    if (
      a.hostname === window.location.hostname
      && !a.target
      && !a.hasAttribute('download')
      && a.getAttribute('href') !== '#'
      && a.href !== window.location.href
    ) {
      a.addEventListener('click', (e) => {
        const href = a.href;
        if (!href || href.startsWith('javascript:') || href.includes('#')) return;
        e.preventDefault();
        document.body.classList.add('page-exit');
        setTimeout(() => {
          window.location.href = href;
        }, 280);
      });
    }
  });

  const animTargets = document.querySelectorAll(
    '.blog-card, .search-result-card,'
      + '.trending-post-item, .sidebar-section,'
      + '.blog-featured, .tag-item,'
      + '.nl-benefit-item, .nl-what-to-expect li,'
      + '.no-results-cat-card, .nl-step, .related-cat-card'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const delay = Math.min(i * 60, 400);
            setTimeout(() => {
              entry.target.classList.add('is-visible');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    animTargets.forEach((el) => {
      el.classList.add('scroll-anim');
      observer.observe(el);
    });
  }

  document.querySelectorAll('.blog-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const tiltX = ((y - cy) / cy) * 4;
      const tiltY = ((cx - x) / cx) * 4;
      card.style.transform =
        `translateY(-6px) perspective(600px)`
        + ` rotateX(${tiltX}deg)`
        + ` rotateY(${tiltY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.4s ease';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease';
    });
  });

  const searchInputs = document.querySelectorAll('.blog-search-input, .sidebar-search-input');
  searchInputs.forEach((input) => {
    input.addEventListener('focus', () => {
      input.closest('.blog-search-box, .sidebar-search-box')?.classList.add('search-focused');
    });
    input.addEventListener('blur', () => {
      input.closest('.blog-search-box, .sidebar-search-box')?.classList.remove('search-focused');
    });
  });

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (Number.isNaN(target)) return;
    const duration = 1500;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.floor(current).toLocaleString('en-IN');
    }, 16);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('[data-count]').forEach((el) => counterObserver.observe(el));
  }

  document.querySelectorAll('.search-result-url').forEach((el) => {
    el.style.cursor = 'pointer';
    el.title = 'Click to copy';
    el.addEventListener('click', () => {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(el.textContent.trim()).then(() => {
        el.textContent = '✓ Copied!';
        el.style.color = '#10B981';
        setTimeout(() => {
          el.textContent = el.getAttribute('data-url') || el.textContent;
          el.style.color = '';
        }, 1500);
      });
    });
  });

  const btt = document.createElement('button');
  btt.className = 'back-to-top';
  btt.innerHTML = '<i class="fas fa-arrow-up"></i>';
  btt.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(btt);

  window.addEventListener('scroll', () => {
    btt.classList.toggle('btt-visible', window.scrollY > 400);
  });

  btt.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.querySelectorAll('.blog-breadcrumb a').forEach((a) => {
    if (a.href === window.location.href) {
      a.classList.add('breadcrumb-current');
    }
  });

  document.querySelectorAll(
    '.blog-card-img-wrap img,'
      + '.search-result-img img,'
      + '.trending-post-thumb'
  ).forEach((img) => {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.4s ease';
    if (img.complete) {
      img.style.opacity = '1';
    } else {
      img.addEventListener('load', () => {
        img.style.opacity = '1';
      });
    }
  });
})();
