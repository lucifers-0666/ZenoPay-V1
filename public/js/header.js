/**
 * ═══════════════════════════════════════════════════════════════════
 * ZENOPAY MODERN HEADER - INTERACTIVE NAVIGATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Dropdown menu interactions
 * - Mega menu functionality
 * - Mobile menu toggle
 * - Scroll effects
 * - Keyboard navigation
 * - Click outside to close
 * - Accessibility support
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════

  const HeaderNav = {
    header: null,
    mobileMenuToggle: null,
    mobileMenuOverlay: null,
    menuOpenIcon: null,
    menuCloseIcon: null,
    currentOpenDropdown: null,
    scrollThreshold: 50,

    init() {
      this.cacheElements();
      this.bindEvents();
      this.setupDropdowns();
      this.setupMobileMenu();
      this.setupNotifications();
      this.setupProfileMenu();
      this.handleScroll(); // Initial check
    },

    cacheElements() {
      this.header = document.getElementById('zenopayHeader');
      this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
      this.mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
      this.menuOpenIcon = document.getElementById('menuOpenIcon');
      this.menuCloseIcon = document.getElementById('menuCloseIcon');
    },

    bindEvents() {
      // Scroll event for sticky header effects
      window.addEventListener('scroll', this.handleScroll.bind(this));
      
      // Click outside to close dropdowns
      document.addEventListener('click', this.handleClickOutside.bind(this));
      
      // ESC key to close dropdowns
      document.addEventListener('keydown', this.handleEscapeKey.bind(this));
      
      // Window resize
      window.addEventListener('resize', this.handleResize.bind(this));
    },

    // ═══════════════════════════════════════════════════════════════════
    // SCROLL EFFECTS
    // ═══════════════════════════════════════════════════════════════════

    handleScroll() {
      if (!this.header) return;

      const scrollY = window.scrollY || window.pageYOffset;
      
      if (scrollY > this.scrollThreshold) {
        this.header.classList.add('scrolled');
      } else {
        this.header.classList.remove('scrolled');
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // DROPDOWN MENU SYSTEM
    // ═══════════════════════════════════════════════════════════════════

    setupDropdowns() {
      const navItems = document.querySelectorAll('.nav-item.has-dropdown');
      
      navItems.forEach(navItem => {
        const button = navItem.querySelector('.nav-button');
        
        if (button) {
          button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleDropdown(navItem);
          });

          // Keyboard navigation
          button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              this.toggleDropdown(navItem);
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              this.openDropdown(navItem);
              this.focusFirstDropdownItem(navItem);
            }
          });
        }
      });

      // Setup keyboard navigation within dropdowns
      this.setupDropdownKeyboardNav();
    },

    toggleDropdown(navItem) {
      const isOpen = navItem.classList.contains('open');
      
      // Close any other open dropdowns
      this.closeAllDropdowns();
      
      if (!isOpen) {
        this.openDropdown(navItem);
      }
    },

    openDropdown(navItem) {
      navItem.classList.add('open');
      const button = navItem.querySelector('.nav-button');
      if (button) {
        button.setAttribute('aria-expanded', 'true');
      }
      this.currentOpenDropdown = navItem;
    },

    closeDropdown(navItem) {
      navItem.classList.remove('open');
      const button = navItem.querySelector('.nav-button');
      if (button) {
        button.setAttribute('aria-expanded', 'false');
      }
      if (this.currentOpenDropdown === navItem) {
        this.currentOpenDropdown = null;
      }
    },

    closeAllDropdowns() {
      const openDropdowns = document.querySelectorAll('.nav-item.open, .action-icon-wrapper.open');
      openDropdowns.forEach(dropdown => {
        dropdown.classList.remove('open');
        const button = dropdown.querySelector('button');
        if (button) {
          button.setAttribute('aria-expanded', 'false');
        }
      });
      this.currentOpenDropdown = null;
    },

    setupDropdownKeyboardNav() {
      // Handle arrow keys within dropdown menus
      document.addEventListener('keydown', (e) => {
        if (!this.currentOpenDropdown) return;

        const dropdown = this.currentOpenDropdown.querySelector('.dropdown-menu, .mega-menu-dropdown');
        if (!dropdown) return;

        const items = Array.from(dropdown.querySelectorAll('a, button'));
        const focusedIndex = items.findIndex(item => item === document.activeElement);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (focusedIndex + 1) % items.length;
          items[nextIndex]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = focusedIndex <= 0 ? items.length - 1 : focusedIndex - 1;
          items[prevIndex]?.focus();
        }
      });
    },

    focusFirstDropdownItem(navItem) {
      const dropdown = navItem.querySelector('.dropdown-menu, .mega-menu-dropdown');
      if (!dropdown) return;

      const firstItem = dropdown.querySelector('a, button');
      if (firstItem) {
        setTimeout(() => firstItem.focus(), 100);
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // MOBILE MENU
    // ═══════════════════════════════════════════════════════════════════

    setupMobileMenu() {
      if (!this.mobileMenuToggle || !this.mobileMenuOverlay) return;

      // Toggle mobile menu
      this.mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMobileMenu();
      });

      // Setup expandable sections in mobile menu
      this.setupMobileExpandableSections();
    },

    toggleMobileMenu() {
      const isOpen = this.mobileMenuOverlay.classList.contains('open');
      
      if (isOpen) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
    },

    openMobileMenu() {
      this.mobileMenuOverlay.classList.add('open');
      this.menuOpenIcon.style.display = 'none';
      this.menuCloseIcon.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    },

    closeMobileMenu() {
      this.mobileMenuOverlay.classList.remove('open');
      this.menuOpenIcon.style.display = 'block';
      this.menuCloseIcon.style.display = 'none';
      document.body.style.overflow = ''; // Restore scrolling
    },

    setupMobileExpandableSections() {
      const expandableItems = document.querySelectorAll('.mobile-nav-item.expandable');
      
      expandableItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const section = item.closest('.mobile-nav-section');
          section.classList.toggle('expanded');
        });
      });
    },

    // ═══════════════════════════════════════════════════════════════════
    // NOTIFICATIONS DROPDOWN
    // ═══════════════════════════════════════════════════════════════════

    setupNotifications() {
      const notificationsBtn = document.getElementById('notificationsBtn');
      if (!notificationsBtn) return;

      const wrapper = notificationsBtn.closest('.action-icon-wrapper');
      
      notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close other dropdowns
        const otherWrappers = document.querySelectorAll('.action-icon-wrapper.open');
        otherWrappers.forEach(w => {
          if (w !== wrapper) w.classList.remove('open');
        });
        
        // Toggle this dropdown
        wrapper.classList.toggle('open');
      });

      // Mark all as read functionality
      const markReadBtn = document.querySelector('.mark-read-btn');
      if (markReadBtn) {
        markReadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.markAllNotificationsRead();
        });
      }
    },

    markAllNotificationsRead() {
      const unreadItems = document.querySelectorAll('.notification-item.unread');
      unreadItems.forEach(item => {
        item.classList.remove('unread');
      });

      // Update badge
      const badge = document.querySelector('.notification-badge');
      if (badge) {
        badge.textContent = '0';
        badge.style.display = 'none';
      }

      // You can add AJAX call here to update server
      console.log('Marked all notifications as read');
    },

    // ═══════════════════════════════════════════════════════════════════
    // PROFILE MENU DROPDOWN
    // ═══════════════════════════════════════════════════════════════════

    setupProfileMenu() {
      const profileBtn = document.getElementById('profileBtn');
      if (!profileBtn) return;

      const wrapper = profileBtn.closest('.action-icon-wrapper');
      
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close other dropdowns
        const otherWrappers = document.querySelectorAll('.action-icon-wrapper.open');
        otherWrappers.forEach(w => {
          if (w !== wrapper) w.classList.remove('open');
        });
        
        // Toggle this dropdown
        wrapper.classList.toggle('open');
      });
    },

    // ═══════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════

    handleClickOutside(e) {
      // Close dropdowns when clicking outside
      const isInsideDropdown = e.target.closest('.nav-item, .action-icon-wrapper');
      const isMobileMenuToggle = e.target.closest('.mobile-menu-toggle');
      
      if (!isInsideDropdown) {
        this.closeAllDropdowns();
      }

      // Close mobile menu when clicking outside (but not on toggle button)
      if (!isMobileMenuToggle && !e.target.closest('.mobile-menu-overlay')) {
        if (this.mobileMenuOverlay && this.mobileMenuOverlay.classList.contains('open')) {
          this.closeMobileMenu();
        }
      }
    },

    handleEscapeKey(e) {
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
        
        if (this.mobileMenuOverlay && this.mobileMenuOverlay.classList.contains('open')) {
          this.closeMobileMenu();
        }
      }
    },

    handleResize() {
      // Close mobile menu when resizing to desktop
      if (window.innerWidth > 768) {
        this.closeMobileMenu();
      }
      
      // Close all dropdowns on resize to prevent positioning issues
      this.closeAllDropdowns();
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // ACTIVE PAGE DETECTION
  // ═══════════════════════════════════════════════════════════════════

  const ActivePageDetection = {
    init() {
      this.setActiveNavItem();
    },

    setActiveNavItem() {
      const currentPath = window.location.pathname;
      
      // Find matching nav links
      const navLinks = document.querySelectorAll('.nav-link, .dropdown-item, .mobile-nav-item');
      
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
          link.classList.add('active');
          
          // If it's in a dropdown, also highlight the parent
          const parentNavItem = link.closest('.nav-item');
          if (parentNavItem) {
            const parentButton = parentNavItem.querySelector('.nav-button');
            if (parentButton) {
              parentButton.classList.add('active');
            }
          }
        }
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ═══════════════════════════════════════════════════════════════════

  const SmoothScroll = {
    init() {
      this.setupSmoothScroll();
    },

    setupSmoothScroll() {
      const anchorLinks = document.querySelectorAll('a[href^="#"]');
      
      anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          
          // Skip if href is just "#"
          if (href === '#') return;
          
          const target = document.querySelector(href);
          
          if (target) {
            e.preventDefault();
            
            const headerHeight = document.getElementById('zenopayHeader')?.offsetHeight || 70;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (HeaderNav.mobileMenuOverlay?.classList.contains('open')) {
              HeaderNav.closeMobileMenu();
            }
          }
        });
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SEARCH FUNCTIONALITY (Optional - if search is added)
  // ═══════════════════════════════════════════════════════════════════

  const SearchFunctionality = {
    init() {
      this.setupSearchModal();
      this.setupKeyboardShortcut();
    },

    setupSearchModal() {
      const searchBtn = document.querySelector('.search-trigger');
      if (!searchBtn) return;

      searchBtn.addEventListener('click', () => {
        this.openSearchModal();
      });
    },

    setupKeyboardShortcut() {
      // Cmd/Ctrl + K to open search
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.openSearchModal();
        }
      });
    },

    openSearchModal() {
      // Implementation for search modal
      console.log('Search modal opened - implement as needed');
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // ACCESSIBILITY ENHANCEMENTS
  // ═══════════════════════════════════════════════════════════════════

  const AccessibilityEnhancements = {
    init() {
      this.setupSkipLink();
      this.setupFocusTrap();
    },

    setupSkipLink() {
      // Add skip to main content link for screen readers
      const skipLink = document.createElement('a');
      skipLink.href = '#main-content';
      skipLink.className = 'skip-link';
      skipLink.textContent = 'Skip to main content';
      skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--brand-blue);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        z-index: 10000;
      `;
      
      skipLink.addEventListener('focus', () => {
        skipLink.style.top = '0';
      });
      
      skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
      });
      
      document.body.insertBefore(skipLink, document.body.firstChild);
    },

    setupFocusTrap() {
      // Trap focus within mobile menu when open
      const mobileMenu = document.getElementById('mobileMenuOverlay');
      if (!mobileMenu) return;

      mobileMenu.addEventListener('keydown', (e) => {
        if (!mobileMenu.classList.contains('open')) return;
        
        if (e.key === 'Tab') {
          const focusableElements = mobileMenu.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // PERFORMANCE OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════════

  const Performance = {
    init() {
      this.throttleScrollEvent();
      this.lazyLoadDropdowns();
    },

    throttleScrollEvent() {
      let ticking = false;
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            HeaderNav.handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      });
    },

    lazyLoadDropdowns() {
      // Defer loading of dropdown content until first interaction
      // This can improve initial page load performance
      // Implementation depends on your specific needs
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // INITIALIZATION ON DOM READY
  // ═══════════════════════════════════════════════════════════════════

  function initializeHeader() {
    try {
      HeaderNav.init();
      ActivePageDetection.init();
      SmoothScroll.init();
      SearchFunctionality.init();
      AccessibilityEnhancements.init();
      Performance.init();
      
      console.log('✅ ZenoPay Modern Header initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing ZenoPay Header:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeader);
  } else {
    initializeHeader();
  }

  // ═══════════════════════════════════════════════════════════════════
  // EXPORT FOR EXTERNAL USE (if needed)
  // ═══════════════════════════════════════════════════════════════════

  window.ZenoPayHeader = {
    closeAllDropdowns: () => HeaderNav.closeAllDropdowns(),
    closeMobileMenu: () => HeaderNav.closeMobileMenu(),
    openMobileMenu: () => HeaderNav.openMobileMenu()
  };

})();
