/**
 * ═══════════════════════════════════════════════════════════════════
 * ZENOPAY MODERN HEADER - INTERACTIVE NAVIGATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

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

      // FIX 1: Always reset body overflow on every page load.
      // When user navigates away while mobile menu is open, the browser
      // never calls closeMobileMenu(), so overflow:hidden carries over
      // to the next page and locks scrolling. This resets it immediately.
      document.body.style.overflow = '';
      document.body.style.overflowX = 'hidden';

      this.bindEvents();
      this.setupDropdowns();
      this.setupMobileMenu();
      this.setupNotifications();
      this.setupProfileMenu();
      this.handleScroll();
    },

    cacheElements() {
      this.header            = document.getElementById('zenopayHeader');
      this.mobileMenuToggle  = document.getElementById('mobileMenuToggle');
      this.mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
      this.menuOpenIcon      = document.getElementById('menuOpenIcon');
      this.menuCloseIcon     = document.getElementById('menuCloseIcon');
    },

    bindEvents() {
      window.addEventListener('scroll', this.handleScroll.bind(this));
      document.addEventListener('click', this.handleClickOutside.bind(this));
      document.addEventListener('keydown', this.handleEscapeKey.bind(this));
      window.addEventListener('resize', this.handleResize.bind(this));

      // FIX 2: Restore body scroll BEFORE the browser navigates away
      // when user taps any real link inside the mobile menu overlay.
      if (this.mobileMenuOverlay) {
        const mobileLinks = this.mobileMenuOverlay
          .querySelectorAll('a[href]:not([href="#"])');
        mobileLinks.forEach(link => {
          link.addEventListener('click', () => {
            document.body.style.overflow = '';
          });
        });
      }
    },

    // ═══ SCROLL EFFECTS ═════════════════════════════════════════

    handleScroll() {
      if (!this.header) return;
      const scrollY = window.scrollY || window.pageYOffset;
      this.header.classList.toggle('scrolled', scrollY > this.scrollThreshold);
    },

    // ═══ DROPDOWN MENU SYSTEM ══════════════════════════════════

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

      this.setupDropdownKeyboardNav();
    },

    toggleDropdown(navItem) {
      const isOpen = navItem.classList.contains('open');
      this.closeAllDropdowns();
      if (!isOpen) this.openDropdown(navItem);
    },

    openDropdown(navItem) {
      navItem.classList.add('open');
      const button = navItem.querySelector('.nav-button');
      if (button) button.setAttribute('aria-expanded', 'true');
      this.currentOpenDropdown = navItem;
    },

    closeDropdown(navItem) {
      navItem.classList.remove('open');
      const button = navItem.querySelector('.nav-button');
      if (button) button.setAttribute('aria-expanded', 'false');
      if (this.currentOpenDropdown === navItem) this.currentOpenDropdown = null;
    },

    closeAllDropdowns() {
      document.querySelectorAll('.nav-item.open, .action-icon-wrapper.open').forEach(el => {
        el.classList.remove('open');
        const btn = el.querySelector('button');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
      this.currentOpenDropdown = null;
    },

    setupDropdownKeyboardNav() {
      document.addEventListener('keydown', (e) => {
        if (!this.currentOpenDropdown) return;
        const dropdown = this.currentOpenDropdown
          .querySelector('.dropdown-menu, .mega-menu-dropdown');
        if (!dropdown) return;
        const items = Array.from(dropdown.querySelectorAll('a, button'));
        const focusedIndex = items.findIndex(item => item === document.activeElement);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          items[(focusedIndex + 1) % items.length]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          items[focusedIndex <= 0 ? items.length - 1 : focusedIndex - 1]?.focus();
        }
      });
    },

    focusFirstDropdownItem(navItem) {
      const dropdown = navItem.querySelector('.dropdown-menu, .mega-menu-dropdown');
      if (!dropdown) return;
      setTimeout(() => dropdown.querySelector('a, button')?.focus(), 100);
    },

    // ═══ MOBILE MENU ════════════════════════════════════════════

    setupMobileMenu() {
      if (!this.mobileMenuToggle || !this.mobileMenuOverlay) return;

      this.mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMobileMenu();
      });

      this.setupMobileExpandableSections();
    },

    toggleMobileMenu() {
      this.mobileMenuOverlay.classList.contains('open')
        ? this.closeMobileMenu()
        : this.openMobileMenu();
    },

    openMobileMenu() {
      this.mobileMenuOverlay.classList.add('open');
      if (this.menuOpenIcon)  this.menuOpenIcon.style.display  = 'none';
      if (this.menuCloseIcon) this.menuCloseIcon.style.display = 'block';
      document.body.style.overflow = 'hidden';
    },

    closeMobileMenu() {
      // FIX 3: Guard null check on icons so this never throws,
      // and always restore body scroll reliably.
      if (!this.mobileMenuOverlay) return;
      this.mobileMenuOverlay.classList.remove('open');
      if (this.menuOpenIcon)  this.menuOpenIcon.style.display  = 'block';
      if (this.menuCloseIcon) this.menuCloseIcon.style.display = 'none';
      document.body.style.overflow = '';
    },

    setupMobileExpandableSections() {
      document.querySelectorAll('.mobile-nav-item.expandable').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          item.closest('.mobile-nav-section')?.classList.toggle('expanded');
        });
      });
    },

    // ═══ NOTIFICATIONS DROPDOWN ═════════════════════════════════

    setupNotifications() {
      const notificationsBtn = document.getElementById('notificationsBtn');
      if (!notificationsBtn) return;
      const wrapper = notificationsBtn.closest('.action-icon-wrapper');

      notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-icon-wrapper.open').forEach(w => {
          if (w !== wrapper) w.classList.remove('open');
        });
        wrapper.classList.toggle('open');
      });

      const markReadBtn = document.querySelector('.mark-read-btn');
      if (markReadBtn) {
        markReadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.markAllNotificationsRead();
        });
      }
    },

    markAllNotificationsRead() {
      document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
      });
      const badge = document.querySelector('.notification-badge');
      if (badge) { badge.textContent = '0'; badge.style.display = 'none'; }
    },

    // ═══ PROFILE MENU ════════════════════════════════════════════

    setupProfileMenu() {
      const profileBtn = document.getElementById('profileBtn');
      if (!profileBtn) return;
      const wrapper = profileBtn.closest('.action-icon-wrapper');

      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-icon-wrapper.open').forEach(w => {
          if (w !== wrapper) w.classList.remove('open');
        });
        wrapper.classList.toggle('open');
      });
    },

    // ═══ EVENT HANDLERS ══════════════════════════════════════════

    handleClickOutside(e) {
      if (!e.target.closest('.nav-item, .action-icon-wrapper')) {
        this.closeAllDropdowns();
      }
      if (
        !e.target.closest('.mobile-menu-toggle') &&
        !e.target.closest('.mobile-menu-overlay') &&
        this.mobileMenuOverlay?.classList.contains('open')
      ) {
        this.closeMobileMenu();
      }
    },

    handleEscapeKey(e) {
      if (e.key !== 'Escape') return;
      this.closeAllDropdowns();
      if (this.mobileMenuOverlay?.classList.contains('open')) this.closeMobileMenu();
    },

    handleResize() {
      if (window.innerWidth > 768) this.closeMobileMenu();
      this.closeAllDropdowns();
    }
  };

  // ═══ ACTIVE PAGE DETECTION ══════════════════════════════════════

  const ActivePageDetection = {
    init() {
      const currentPath = window.location.pathname;
      document.querySelectorAll('.nav-link, .dropdown-item, .mobile-nav-item').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
          link.classList.add('active');
          const parentBtn = link.closest('.nav-item')?.querySelector('.nav-button');
          if (parentBtn) parentBtn.classList.add('active');
        }
      });
    }
  };

  // ═══ SMOOTH SCROLL ═════════════════════════════════════════════

  const SmoothScroll = {
    init() {
      document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href === '#') return;
          const target = document.querySelector(href);
          if (!target) return;
          e.preventDefault();
          const headerHeight = document.getElementById('zenopayHeader')?.offsetHeight || 70;
          window.scrollTo({
            top: target.getBoundingClientRect().top + window.pageYOffset - headerHeight,
            behavior: 'smooth'
          });
          if (HeaderNav.mobileMenuOverlay?.classList.contains('open')) {
            HeaderNav.closeMobileMenu();
          }
        });
      });
    }
  };

  // ═══ SEARCH ══════════════════════════════════════════════════

  const SearchFunctionality = {
    init() {
      const searchBtn = document.querySelector('.search-trigger');
      if (searchBtn) searchBtn.addEventListener('click', () => this.openSearchModal());
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          this.openSearchModal();
        }
      });
    },
    openSearchModal() {
      console.log('Search modal opened - implement as needed');
    }
  };

  // ═══ ACCESSIBILITY ════════════════════════════════════════════

  const AccessibilityEnhancements = {
    init() {
      this.setupFocusTrap();
    },

    setupFocusTrap() {
      const mobileMenu = document.getElementById('mobileMenuOverlay');
      if (!mobileMenu) return;
      mobileMenu.addEventListener('keydown', (e) => {
        if (!mobileMenu.classList.contains('open') || e.key !== 'Tab') return;
        const focusable = mobileMenu.querySelectorAll(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      });
    }
  };

  // ═══ PERFORMANCE ══════════════════════════════════════════════

  const Performance = {
    init() {
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
    }
  };

  // ═══ BOOTSTRAP ═══════════════════════════════════════════════

  function initializeHeader() {
    try {
      HeaderNav.init();
      ActivePageDetection.init();
      SmoothScroll.init();
      SearchFunctionality.init();
      AccessibilityEnhancements.init();
      Performance.init();
      console.log('✅ ZenoPay Header initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing ZenoPay Header:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHeader);
  } else {
    initializeHeader();
  }

  window.ZenoPayHeader = {
    closeAllDropdowns: () => HeaderNav.closeAllDropdowns(),
    closeMobileMenu:   () => HeaderNav.closeMobileMenu(),
    openMobileMenu:    () => HeaderNav.openMobileMenu()
  };

})();
