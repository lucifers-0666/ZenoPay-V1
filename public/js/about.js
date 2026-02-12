/**
 * About Us Page - Interactive Features & Animations
 * Enhanced version with smooth animations and accessibility
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // INITIALIZE ON DOM READY
  // ═══════════════════════════════════════════════════════════════════

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
    // FADE-UP ANIMATION ON SCROLL (INTERSECTION OBSERVER)
    // ═══════════════════════════════════════════════════════════════════
    
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15
    };

    const fadeUpObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          fadeUpObserver.unobserve(entry.target); // Animate once
        }
      });
    }, observerOptions);

    // Observe all elements with data-animate attribute
    document.querySelectorAll('[data-animate]').forEach(element => {
      fadeUpObserver.observe(element);
    });

    // ═══════════════════════════════════════════════════════════════════
    // COUNTER ANIMATION FOR STATISTICS (FIXED & IMPROVED)
    // ═══════════════════════════════════════════════════════════════════
    
    let statsAnimated = false;

    function animateCounter(element, target, duration = 2000, suffix = '') {
      if (!element) return;
      
      const isDecimal = target % 1 !== 0;
      const start = 0;
      const range = target - start;
      const increment = range / (duration / 16); // 60fps
      let current = start;

      const updateCounter = () => {
        current += increment;
        
        if (current < target) {
          if (isDecimal) {
            element.textContent = current.toFixed(1);
          } else if (target >= 1000) {
            element.textContent = Math.floor(current).toLocaleString('en-IN');
          } else {
            element.textContent = Math.floor(current);
          }
          requestAnimationFrame(updateCounter);
        } else {
          // Final value
          if (isDecimal) {
            element.textContent = target.toFixed(1);
          } else if (target >= 1000) {
            element.textContent = Math.floor(target).toLocaleString('en-IN');
          } else {
            element.textContent = Math.floor(target);
          }
        }
      };

      updateCounter();
    }

    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated) {
          statsAnimated = true;
          
          // Animate each stat counter
          const transactionVolume = document.getElementById('transaction-volume');
          const activeUsers = document.getElementById('active-users');
          const uptime = document.getElementById('uptime');
          const countries = document.getElementById('countries');

          if (transactionVolume) animateCounter(transactionVolume, 10, 2000);
          if (activeUsers) animateCounter(activeUsers, 50000, 2500);
          if (uptime) animateCounter(uptime, 99.9, 2000);
          if (countries) animateCounter(countries, 5, 1500);

          console.log('✨ Statistics counters animated');
        }
      });
    }, { threshold: 0.3 });

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
      statsObserver.observe(statsSection);
    }

    // ═══════════════════════════════════════════════════════════════════
    // CARD HOVER EFFECTS (LIFT & SHADOW)
    // ═══════════════════════════════════════════════════════════════════
    
    const interactiveCards = document.querySelectorAll('.founder-card, .value-card, .mv-card, .team-card');
    
    interactiveCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-12px)';
        this.style.boxShadow = '0 20px 40px rgba(59, 130, 246, 0.2)';
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '';
      });
    });

    // ═══════════════════════════════════════════════════════════════════
    // FOUNDER CARD IMAGE ZOOM ON HOVER
    // ═══════════════════════════════════════════════════════════════════
    
    const founderCards = document.querySelectorAll('.founder-card');
    founderCards.forEach(card => {
      const avatar = card.querySelector('.founder-avatar img, .team-avatar img');
      if (avatar) {
        card.addEventListener('mouseenter', function() {
          avatar.style.transform = 'scale(1.1)';
        });
        
        card.addEventListener('mouseleave', function() {
          avatar.style.transform = 'scale(1)';
        });
      }
    });

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
          const parallaxSpeed = 0.3;
          heroContent.style.transform = `translateY(${scrolled * parallaxSpeed}px)`;
          heroContent.style.opacity = Math.max(1 - (scrolled / heroHeight), 0.3);
        }
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // TIMELINE ANIMATION ON SCROLL
    // ═══════════════════════════════════════════════════════════════════
    
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('timeline-animate-in');
        }
      });
    }, { threshold: 0.2 });

    timelineItems.forEach((item, index) => {
      item.style.setProperty('--timeline-index', index);
      timelineObserver.observe(item);
    });

    // ═══════════════════════════════════════════════════════════════════
    // VALUE CARDS STAGGERED ANIMATION
    // ═══════════════════════════════════════════════════════════════════
    
    const valueCards = document.querySelectorAll('.value-card');
    
    const valueObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('value-animate-in');
          }, index * 100);
        }
      });
    }, { threshold: 0.1 });

    valueCards.forEach(card => {
      valueObserver.observe(card);
    });

    // ═══════════════════════════════════════════════════════════════════
    // CERTIFICATION BADGE ANIMATION
    // ═══════════════════════════════════════════════════════════════════
    
    const certBadges = document.querySelectorAll('.cert-badge');
    
    const certObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('cert-animate-in');
          }, index * 100);
        }
      });
    }, { threshold: 0.2 });

    certBadges.forEach(badge => {
      certObserver.observe(badge);
    });

    // ═══════════════════════════════════════════════════════════════════
    // PARTNER LOGO HOVER EFFECTS
    // ═══════════════════════════════════════════════════════════════════
    
    const partnerLogos = document.querySelectorAll('.partner-logo');
    
    partnerLogos.forEach(logo => {
      logo.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
      });
      
      logo.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
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
    // HERO ENTRANCE ANIMATIONS
    // ═══════════════════════════════════════════════════════════════════
    
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroCta = document.querySelector('.hero-cta');

    if (heroTitle) heroTitle.style.animation = 'fadeInUp 1s ease 0.2s both';
    if (heroSubtitle) heroSubtitle.style.animation = 'fadeInUp 1s ease 0.4s both';
    if (heroCta) heroCta.style.animation = 'fadeInUp 1s ease 0.6s both';

    // ═══════════════════════════════════════════════════════════════════
    // CONSOLE LOGS
    // ═══════════════════════════════════════════════════════════════════
    
    console.log('✅ About page initialized successfully');
    console.log('✨ All animations ready');
    console.log('📊 Statistics counter fixed and ready');
    console.log('🎯 Intersection observers active');
    console.log(`🗓️ Years of Innovation: ${calculateYearsOfInnovation()} years`);
    
  }); // End DOMContentLoaded

  // ═══════════════════════════════════════════════════════════════════
  // MOUSE PARALLAX EFFECT ON HERO LOGO
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
        heroLogo.style.transition = 'transform 0.3s ease-out';
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // KEYBOARD NAVIGATION SHORTCUTS
  // ═══════════════════════════════════════════════════════════════════

  document.addEventListener('keydown', (e) => {
    // Press 'H' to go to hero (top of page)
    if ((e.key === 'h' || e.key === 'H') && !e.target.matches('input, textarea')) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ACCESSIBILITY: REDUCED MOTION PREFERENCE
  // ═══════════════════════════════════════════════════════════════════

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('⚠️ Reduced motion preference detected - disabling animations');
    
    // Disable all animations
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    document.head.appendChild(style);
  }

})(); // End IIFE
