/**
 * About Us Page - Interactive Features & Animations
 * Handles scroll animations, counter animations, and smooth transitions
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // ═══════════════════════════════════════════════════════════════════
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ═══════════════════════════════════════════════════════════════════
  
  const scrollIndicator = document.querySelector('.scroll-indicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', function() {
      const storySection = document.getElementById('story');
      if (storySection) {
        storySection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // INTERSECTION OBSERVER FOR FADE-IN ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe all sections and cards
  const elementsToAnimate = document.querySelectorAll(`
    .story-content,
    .story-visual,
    .mv-card,
    .value-card,
    .team-card,
    .timeline-item,
    .cert-badge,
    .partner-logo
  `);

  elementsToAnimate.forEach(element => {
    element.classList.add('fade-in');
    observer.observe(element);
  });

  // ═══════════════════════════════════════════════════════════════════
  // COUNTER ANIMATION FOR STATISTICS
  // ═══════════════════════════════════════════════════════════════════
  
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsAnimated = false;

  const animateCounter = (element, target, duration = 2000) => {
    const isDecimal = target % 1 !== 0;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        if (isDecimal) {
          element.textContent = current.toFixed(1);
        } else {
          element.textContent = Math.floor(current).toLocaleString();
        }
        requestAnimationFrame(updateCounter);
      } else {
        if (isDecimal) {
          element.textContent = target.toFixed(1);
        } else {
          element.textContent = Math.floor(target).toLocaleString();
        }
      }
    };

    updateCounter();
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !statsAnimated) {
        statsAnimated = true;
        
        statNumbers.forEach(stat => {
          const target = parseFloat(stat.getAttribute('data-target'));
          animateCounter(stat, target);
        });
      }
    });
  }, observerOptions);

  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  // ═══════════════════════════════════════════════════════════════════
  // PARALLAX EFFECT ON HERO SECTION
  // ═══════════════════════════════════════════════════════════════════
  
  const hero = document.querySelector('.about-hero');
  const heroContent = document.querySelector('.hero-content');
  
  if (hero && heroContent) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const heroHeight = hero.offsetHeight;
      
      if (scrolled < heroHeight) {
        const parallaxSpeed = 0.5;
        heroContent.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
        heroContent.style.opacity = 1 - (scrolled / heroHeight);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATE HERO BLOBS
  // ═══════════════════════════════════════════════════════════════════
  
  const heroBlobs = document.querySelectorAll('.hero-blob');
  
  heroBlobs.forEach((blob, index) => {
    blob.style.animationDelay = `${index * 5}s`;
  });

  // ═══════════════════════════════════════════════════════════════════
  // TIMELINE ANIMATION ON SCROLL
  // ═══════════════════════════════════════════════════════════════════
  
  const timelineItems = document.querySelectorAll('.timeline-item');
  
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateX(0)';
        }, index * 100);
      }
    });
  }, { threshold: 0.2 });

  timelineItems.forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateX(-30px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    timelineObserver.observe(item);
  });

  // ═══════════════════════════════════════════════════════════════════
  // STAGGERED ANIMATION FOR VALUE CARDS
  // ═══════════════════════════════════════════════════════════════════
  
  const valueCards = document.querySelectorAll('.value-card');
  
  const valueObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
      }
    });
  }, { threshold: 0.1 });

  valueCards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    valueObserver.observe(card);
  });

  // ═══════════════════════════════════════════════════════════════════
  // TEAM CARD HOVER EFFECTS
  // ═══════════════════════════════════════════════════════════════════
  
  const teamCards = document.querySelectorAll('.team-card');
  
  teamCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // CERTIFICATION BADGE ANIMATION
  // ═══════════════════════════════════════════════════════════════════
  
  const certBadges = document.querySelectorAll('.cert-badge');
  
  const certObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'scale(1)';
        }, index * 100);
      }
    });
  }, { threshold: 0.2 });

  certBadges.forEach(badge => {
    badge.style.opacity = '0';
    badge.style.transform = 'scale(0.8)';
    badge.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    certObserver.observe(badge);
  });

  // ═══════════════════════════════════════════════════════════════════
  // PARTNER LOGO HOVER EFFECTS
  // ═══════════════════════════════════════════════════════════════════
  
  const partnerLogos = document.querySelectorAll('.partner-logo');
  
  partnerLogos.forEach(logo => {
    logo.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1) rotate(2deg)';
    });
    
    logo.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1) rotate(0deg)';
    });
  });

  // ═══════════════════════════════════════════════════════════════════
  // HIDE SCROLL INDICATOR ON SCROLL
  // ═══════════════════════════════════════════════════════════════════
  
  window.addEventListener('scroll', () => {
    if (scrollIndicator) {
      if (window.pageYOffset > 100) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.pointerEvents = 'none';
      } else {
        scrollIndicator.style.opacity = '1';
        scrollIndicator.style.pointerEvents = 'auto';
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ANIMATE TIMELINE DOTS
  // ═══════════════════════════════════════════════════════════════════
  
  const markerDots = document.querySelectorAll('.marker-dot');
  
  markerDots.forEach((dot, index) => {
    setTimeout(() => {
      dot.style.animation = 'pulse 2s ease-in-out infinite';
      dot.style.animationDelay = `${index * 0.2}s`;
    }, 500);
  });

  // Add pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
      }
    }
  `;
  document.head.appendChild(style);

  // ═══════════════════════════════════════════════════════════════════
  // GRADIENT TEXT ANIMATION
  // ═══════════════════════════════════════════════════════════════════
  
  const gradientTexts = document.querySelectorAll('.gradient-text');
  
  gradientTexts.forEach(text => {
    text.style.backgroundSize = '200% auto';
    text.style.animation = 'gradientShift 3s ease-in-out infinite';
  });

  // Add gradient animation
  const gradientStyle = document.createElement('style');
  gradientStyle.textContent = `
    @keyframes gradientShift {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }
  `;
  document.head.appendChild(gradientStyle);

  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE OPTIMIZATION: LAZY LOADING IMAGES
  // ═══════════════════════════════════════════════════════════════════
  
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      img.src = img.dataset.src;
    });
  } else {
    // Fallback for browsers that don't support lazy loading
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
    document.body.appendChild(script);
  }

  // ═══════════════════════════════════════════════════════════════════
  // CONSOLE LOG
  // ═══════════════════════════════════════════════════════════════════
  
  console.log('About page initialized successfully');
  console.log('✨ Animations ready');
  console.log('📊 Statistics counter ready');
  console.log('🎯 Intersection observers active');
});

// ═══════════════════════════════════════════════════════════════════
// MOUSE PARALLAX EFFECT ON HERO
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('mousemove', (e) => {
  const hero = document.querySelector('.about-hero');
  if (!hero) return;

  const heroRect = hero.getBoundingClientRect();
  if (e.clientY < heroRect.bottom && e.clientY > heroRect.top) {
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;

    const heroLogo = document.querySelector('.hero-logo');
    if (heroLogo) {
      heroLogo.style.transform = `translate(${x * 20}px, ${y * 20}px)`;
    }
  }
});

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD NAVIGATION
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  // Press 'H' to go to hero
  if (e.key === 'h' || e.key === 'H') {
    if (!e.target.matches('input, textarea')) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
});
