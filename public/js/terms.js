/**
 * Terms & Conditions Page - Interactive Features
 * Handles smooth scrolling, active section highlighting, and back-to-top button
 */

document.addEventListener('DOMContentLoaded', function() {
  
  // ═══════════════════════════════════════════════════════════════════
  // SMOOTH SCROLL TO SECTIONS
  // ═══════════════════════════════════════════════════════════════════
  
  const tocLinks = document.querySelectorAll('.toc-link');
  
  tocLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        const headerOffset = 100;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Update active state
        updateActiveLink(this);
      }
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════
  // ACTIVE SECTION HIGHLIGHTING ON SCROLL
  // ═══════════════════════════════════════════════════════════════════
  
  const sections = document.querySelectorAll('.terms-section');
  const observerOptions = {
    root: null,
    rootMargin: '-100px 0px -66%',
    threshold: 0
  };
  
  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        const correspondingLink = document.querySelector(`.toc-link[href="#${sectionId}"]`);
        if (correspondingLink) {
          updateActiveLink(correspondingLink);
        }
      }
    });
  };
  
  const observer = new IntersectionObserver(observerCallback, observerOptions);
  
  sections.forEach(section => {
    observer.observe(section);
  });
  
  function updateActiveLink(activeLink) {
    // Remove active class from all links
    tocLinks.forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to current link
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // BACK TO TOP BUTTON
  // ═══════════════════════════════════════════════════════════════════
  
  const backToTopBtn = document.getElementById('backToTop');
  
  if (backToTopBtn) {
    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });
    
    // Scroll to top on click
    backToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // PRINT FUNCTIONALITY
  // ═══════════════════════════════════════════════════════════════════
  
  const downloadBtn = document.querySelector('.download-btn');
  const printBtn = document.querySelector('.print-btn');
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      window.print();
    });
  }
  
  if (printBtn) {
    printBtn.addEventListener('click', function() {
      window.print();
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // MOBILE TOC TOGGLE (Optional Enhancement)
  // ═══════════════════════════════════════════════════════════════════
  
  const sidebar = document.getElementById('termsSidebar');
  
  if (sidebar && window.innerWidth < 1024) {
    // Create toggle button for mobile
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-toc-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i> Table of Contents';
    toggleBtn.style.cssText = `
      display: block;
      width: 100%;
      padding: 12px 20px;
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 16px;
    `;
    
    const stickyContent = sidebar.querySelector('.sidebar-sticky');
    const tocNav = sidebar.querySelector('.toc-nav');
    
    if (tocNav) {
      // Hide TOC by default on mobile
      tocNav.style.display = 'none';
      
      // Insert toggle button
      stickyContent.insertBefore(toggleBtn, tocNav);
      
      // Toggle TOC visibility
      toggleBtn.addEventListener('click', function() {
        if (tocNav.style.display === 'none') {
          tocNav.style.display = 'flex';
          toggleBtn.innerHTML = '<i class="fas fa-times"></i> Close';
        } else {
          tocNav.style.display = 'none';
          toggleBtn.innerHTML = '<i class="fas fa-bars"></i> Table of Contents';
        }
      });
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // READING PROGRESS BAR (Optional)
  // ═══════════════════════════════════════════════════════════════════
  
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress-bar';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 4px;
    background: linear-gradient(90deg, #3B82F6, #8B5CF6);
    z-index: 9999;
    transition: width 0.1s ease;
  `;
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', function() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    
    progressBar.style.width = scrollPercent + '%';
  });
  
  // ═══════════════════════════════════════════════════════════════════
  // SECTION ANIMATION ON SCROLL (Optional)
  // ═══════════════════════════════════════════════════════════════════
  
  const animateOnScrollOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const animateOnScrollCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  };
  
  const animateObserver = new IntersectionObserver(animateOnScrollCallback, animateOnScrollOptions);
  
  // Apply animation to sections
  sections.forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    animateObserver.observe(section);
  });
  
  // ═══════════════════════════════════════════════════════════════════
  // COPY SECTION LINK TO CLIPBOARD
  // ═══════════════════════════════════════════════════════════════════
  
  const sectionTitles = document.querySelectorAll('.section-title');
  
  sectionTitles.forEach(title => {
    const section = title.closest('.terms-section');
    if (section && section.id) {
      title.style.cursor = 'pointer';
      title.title = 'Click to copy link to this section';
      
      title.addEventListener('click', function() {
        const sectionUrl = `${window.location.origin}${window.location.pathname}#${section.id}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(sectionUrl).then(() => {
          // Show tooltip
          const tooltip = document.createElement('span');
          tooltip.textContent = '✓ Link copied!';
          tooltip.style.cssText = `
            position: absolute;
            background: #10B981;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            margin-left: 12px;
            animation: fadeInOut 2s ease;
          `;
          
          title.style.position = 'relative';
          title.appendChild(tooltip);
          
          setTimeout(() => {
            tooltip.remove();
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy link:', err);
        });
      });
    }
  });
  
  // Add fade in/out animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateX(-10px); }
      15% { opacity: 1; transform: translateX(0); }
      85% { opacity: 1; transform: translateX(0); }
      100% { opacity: 0; transform: translateX(10px); }
    }
  `;
  document.head.appendChild(style);
  
  // ═══════════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ═══════════════════════════════════════════════════════════════════
  
  document.addEventListener('keydown', function(e) {
    // Press 'T' to jump to top
    if (e.key === 't' || e.key === 'T') {
      if (!e.target.matches('input, textarea')) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    
    // Press 'P' to print
    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
      // Browser will handle print dialog
    }
  });
  
  console.log('Terms & Conditions page initialized');
  console.log('Keyboard shortcuts: Press "T" to scroll to top');
});
