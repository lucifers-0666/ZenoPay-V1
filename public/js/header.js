/**
 * ═══════════════════════════════════════════════════════════════════
 * ZENOPAY MODERN HEADER - INTERACTIVE NAVIGATION SYSTEM
 * ═══════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  if (window.__ZENOPAY_HEADER_V2_ACTIVE) {
    return;
  }
  window.__ZENOPAY_HEADER_V2_ACTIVE = true;

  function ensureHeaderResources() {
    var rHref = '/css/responsive.css';
    var rLink = document.querySelector('link[href="' + rHref + '"]');
    if (!rLink) {
      rLink = document.createElement('link');
      rLink.rel = 'stylesheet';
      rLink.href = rHref;
    }

    var href = '/css/header.css';
    var link = document.querySelector('link[href="' + href + '"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
    }

    // Keep header.css last so page-specific :root blocks don't override header tokens.
    document.head.appendChild(rLink);
    document.head.appendChild(link);

    var faviconHref = '/Images/bgFavicon.png';
    var existingFavicon = document.querySelector('link[rel="icon"]');
    if (existingFavicon) {
      existingFavicon.href = faviconHref;
      existingFavicon.type = 'image/png';
    } else {
      var faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/png';
      faviconLink.href = faviconHref;
      document.head.appendChild(faviconLink);
    }

    var viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      var viewportContent = viewportMeta.getAttribute('content') || '';
      if (!/viewport-fit\s*=\s*cover/i.test(viewportContent)) {
        var normalized = viewportContent.trim().replace(/,+$/, '');
        viewportMeta.setAttribute(
          'content',
          normalized ? normalized + ', viewport-fit=cover' : 'width=device-width, initial-scale=1.0, viewport-fit=cover'
        );
      }
    } else {
      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover';
      document.head.appendChild(meta);
    }
  }

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
      this.header            = document.getElementById('zenoHeader') || document.getElementById('zenopayHeader');
      this.mobileMenuToggle  = document.getElementById('mobileToggle') || document.getElementById('mobileMenuToggle');
      this.mobileMenuOverlay = document.getElementById('mobileOverlay') || document.getElementById('mobileMenuOverlay');
      this.menuOpenIcon      = document.getElementById('mobOpenIcon') || document.getElementById('menuOpenIcon');
      this.menuCloseIcon     = document.getElementById('mobCloseIcon') || document.getElementById('menuCloseIcon');
      this.progressBar       = document.getElementById('scrollProgressBar');
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

      if (this.progressBar) {
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const pct = docHeight > 0 ? Math.min(100, (scrollY / docHeight) * 100) : 0;
        this.progressBar.style.width = pct + '%';
      }
    },

    // ═══ DROPDOWN MENU SYSTEM ══════════════════════════════════

    setupDropdowns() {
      const navItems = document.querySelectorAll('.header-nav .nav-item');

      navItems.forEach(navItem => {
        const button = navItem.querySelector('.nav-btn');
        const panel = navItem.querySelector('.mega-menu, .dropdown, .dropdown-menu');
        if (!panel) return;
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
      const button = navItem.querySelector('.nav-btn');
      if (button) button.setAttribute('aria-expanded', 'true');
      this.currentOpenDropdown = navItem;
    },

    closeDropdown(navItem) {
      navItem.classList.remove('open');
      const button = navItem.querySelector('.nav-btn');
      if (button) button.setAttribute('aria-expanded', 'false');
      if (this.currentOpenDropdown === navItem) this.currentOpenDropdown = null;
    },

    closeAllDropdowns() {
      document.querySelectorAll('.nav-item.open, .action-icon-wrapper.open, .action-wrapper.open').forEach(el => {
        el.classList.remove('open');
        const btn = el.querySelector('.nav-btn, .action-btn, .avatar-btn, button');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
      this.currentOpenDropdown = null;
    },

    setupDropdownKeyboardNav() {
      document.addEventListener('keydown', (e) => {
        if (!this.currentOpenDropdown) return;
        const dropdown = this.currentOpenDropdown
          .querySelector('.mega-menu, .dropdown, .dropdown-menu');
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
      const dropdown = navItem.querySelector('.mega-menu, .dropdown, .dropdown-menu');
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
      const notificationsBtn = document.getElementById('notifBtn') || document.getElementById('notificationsBtn');
      if (!notificationsBtn) return;
      const wrapper = notificationsBtn.closest('.action-wrapper, .action-icon-wrapper');
      if (!wrapper) return;

      notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-wrapper.open, .action-icon-wrapper.open').forEach(w => {
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
      const wrapper = profileBtn.closest('.action-wrapper, .action-icon-wrapper');
      if (!wrapper) return;

      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.action-wrapper.open, .action-icon-wrapper.open').forEach(w => {
          if (w !== wrapper) w.classList.remove('open');
        });
        wrapper.classList.toggle('open');
      });
    },

    // ═══ EVENT HANDLERS ══════════════════════════════════════════

    handleClickOutside(e) {
      if (!e.target.closest('.nav-item, .action-icon-wrapper')) {
        if (!e.target.closest('.nav-item, .action-wrapper')) {
          this.closeAllDropdowns();
        }
      }
      if (!e.target.closest('.nav-item, .action-wrapper, .action-icon-wrapper')) {
        this.closeAllDropdowns();
      }
      if (
        !e.target.closest('.mobile-toggle, .mobile-menu-toggle') &&
        !e.target.closest('.mobile-overlay, .mobile-menu-overlay') &&
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

  const NotificationLoader = {
    notifWrapper: null,
    notifBtn: null,
    notifList: null,
    notifBadge: null,
    markReadBtn: null,
    mobileBadge: null,
    NOTIF_POLL_INTERVAL_MS: 25000,
    isNotifLoading: false,
    notifPollTimer: null,

    init() {
      this.notifWrapper = document.getElementById('notifWrapper');
      this.notifBtn = document.getElementById('notifBtn');
      this.notifList = document.getElementById('notifList');
      this.notifBadge = document.getElementById('notifBadge');
      this.markReadBtn = document.getElementById('markReadBtn');
      this.mobileBadge = document.getElementById('mobileNavBadge');

      if (!this.notifList) return;

      this.notifList.innerHTML = `
        <a href="/notifications" class="notif-item">
          <div class="notif-icon info"><i class="fas fa-spinner fa-spin"></i></div>
          <div class="notif-body">
            <div class="notif-title">Loading notifications</div>
            <div class="notif-text">Please wait a moment...</div>
            <div class="notif-time">Now</div>
          </div>
        </a>
      `;

      if (this.notifBtn && this.notifWrapper) {
        this.notifBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.notifWrapper.classList.contains('open')) {
            this.loadNotifications(true);
          }
        });
      }

      if (this.markReadBtn) {
        this.markReadBtn.addEventListener('click', async (event) => {
          event.preventDefault();
          try {
            const response = await fetch('/api/notifications/mark-all-read', {
              method: 'POST',
              credentials: 'same-origin',
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok || !payload.success) {
              throw new Error(payload.message || 'Failed to mark notifications as read');
            }

            document.querySelectorAll('.notif-item.unread').forEach((node) => node.classList.remove('unread'));
            this.syncNotificationBadges(0);
            this.loadNotifications(true);
          } catch (error) {
            console.error('Failed to mark notifications as read:', error);
          }
        });
      }

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.loadNotifications();
          this.startNotificationPolling();
        } else {
          this.stopNotificationPolling();
        }
      });

      window.addEventListener('beforeunload', () => {
        this.stopNotificationPolling();
      });

      this.loadNotifications();
      this.startNotificationPolling();
    },

    escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    formatRelativeTime(isoDate) {
      const date = new Date(isoDate);
      if (Number.isNaN(date.getTime())) return 'Just now';

      const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
      if (diffSec < 60) return 'Just now';

      const mins = Math.floor(diffSec / 60);
      if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;

      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

      const days = Math.floor(hours / 24);
      if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    },

    getNotifUi(type) {
      const normalized = String(type || '').toLowerCase();
      if (normalized === 'credit' || normalized === 'success' || normalized === 'reward') {
        return { css: 'success', icon: 'fa-circle-check' };
      }
      if (normalized === 'debit' || normalized === 'warning' || normalized === 'security') {
        return { css: 'warning', icon: 'fa-triangle-exclamation' };
      }
      return { css: 'info', icon: 'fa-circle-info' };
    },

    syncNotificationBadges(count) {
      const safeCount = Math.max(0, Number(count || 0));
      if (this.notifBadge) {
        if (safeCount > 0) {
          this.notifBadge.textContent = safeCount > 99 ? '99+' : String(safeCount);
          this.notifBadge.style.display = 'flex';
        } else {
          this.notifBadge.textContent = '0';
          this.notifBadge.style.display = 'none';
        }
      }

      if (this.mobileBadge) {
        if (safeCount > 0) {
          this.mobileBadge.textContent = safeCount > 99 ? '99+' : String(safeCount);
          this.mobileBadge.style.display = 'flex';
        } else {
          this.mobileBadge.textContent = '0';
          this.mobileBadge.style.display = 'none';
        }
      }
    },

    renderNotifications(notifications) {
      if (!this.notifList) return;

      if (!Array.isArray(notifications) || notifications.length === 0) {
        this.notifList.innerHTML = `
          <a href="/notifications" class="notif-item">
            <div class="notif-icon info"><i class="fas fa-bell"></i></div>
            <div class="notif-body">
              <div class="notif-title">No notifications yet</div>
              <div class="notif-text">You'll see transaction alerts here in real time.</div>
              <div class="notif-time">Now</div>
            </div>
          </a>
        `;
        return;
      }

      this.notifList.innerHTML = notifications.map((notification) => {
        const ui = this.getNotifUi(notification.Type);
        const unreadClass = notification.IsRead ? '' : ' unread';

        return `
          <a href="/notifications" class="notif-item${unreadClass}">
            <div class="notif-icon ${ui.css}"><i class="fas ${ui.icon}"></i></div>
            <div class="notif-body">
              <div class="notif-title">${this.escapeHtml(notification.Title || 'Notification')}</div>
              <div class="notif-text">${this.escapeHtml(notification.Message || '')}</div>
              <div class="notif-time">${this.escapeHtml(this.formatRelativeTime(notification.createdAt || notification.updatedAt))}</div>
            </div>
          </a>
        `;
      }).join('');
    },

    async loadNotifications(force = false) {
      if (this.isNotifLoading && !force) return;

      try {
        this.isNotifLoading = true;

        const [countRes, recentRes] = await Promise.all([
          fetch('/api/notifications/count', { credentials: 'same-origin' }),
          fetch('/api/notifications/recent', { credentials: 'same-origin' }),
        ]);

        const countJson = await countRes.json().catch(() => ({}));
        const recentJson = await recentRes.json().catch(() => ({}));

        this.syncNotificationBadges(countJson?.success ? countJson.count : 0);
        this.renderNotifications(recentJson?.success ? recentJson.notifications : []);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        this.syncNotificationBadges(0);
        this.renderNotifications([]);
      } finally {
        this.isNotifLoading = false;
      }
    },

    startNotificationPolling() {
      if (this.notifPollTimer) return;

      this.notifPollTimer = window.setInterval(() => {
        if (document.hidden) return;
        this.loadNotifications();
      }, this.NOTIF_POLL_INTERVAL_MS);
    },

    stopNotificationPolling() {
      if (!this.notifPollTimer) return;
      window.clearInterval(this.notifPollTimer);
      this.notifPollTimer = null;
    },
  };

  const InactivityWarning = {
    init() {
      const headerNode = document.getElementById('zenoHeader') || document.getElementById('zenopayHeader');
      if (!headerNode) return;

      const isLoggedIn = headerNode.dataset.loggedIn === '1';
      if (!isLoggedIn) return;

      let timeoutMs = Number(headerNode.dataset.timeoutMs || 0);
      let warningMs = Number(headerNode.dataset.warningMs || 0);
      const pingUrl = headerNode.dataset.pingUrl || '/session/ping';
      const logoutUrl = headerNode.dataset.logoutUrl || '/login?timeout=1';

      if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return;
      if (!Number.isFinite(warningMs) || warningMs < 0 || warningMs >= timeoutMs) {
        warningMs = Math.min(60000, Math.max(30000, timeoutMs - 1000));
      }

      let warningTimer = null;
      let hardTimeoutTimer = null;
      let countdownInterval = null;
      let isPromptOpen = false;
      let remainingSeconds = 0;

      const ensureModalStyles = () => {
        if (document.getElementById('userSessionWarningStyles')) return;
        const style = document.createElement('style');
        style.id = 'userSessionWarningStyles';
        style.textContent = [
          '.user-session-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:12000;background:rgba(3,8,20,.55);backdrop-filter:blur(3px);}',
          '.user-session-card{width:min(92vw,430px);border-radius:16px;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.28);padding:20px 20px 16px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;}',
          '.user-session-title{margin:0 0 8px;font-size:1.05rem;font-weight:800;display:flex;align-items:center;gap:8px;}',
          '.user-session-title i{color:#f59e0b;}',
          '.user-session-text{margin:0 0 14px;font-size:.95rem;line-height:1.5;color:#334155;}',
          '.user-session-count{font-weight:800;color:#dc2626;}',
          '.user-session-actions{display:flex;gap:10px;justify-content:flex-end;}',
          '.user-session-btn{border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;}',
          '.user-session-btn.secondary{background:#f1f5f9;color:#0f172a;}',
          '.user-session-btn.primary{background:#0d9488;color:#fff;}',
          '.user-session-btn.primary:disabled{opacity:.75;cursor:not-allowed;}'
        ].join('');
        document.head.appendChild(style);
      };

      const ensureModal = () => {
        const existing = document.getElementById('userSessionWarningModal');
        if (existing) return existing;

        ensureModalStyles();
        const modal = document.createElement('div');
        modal.id = 'userSessionWarningModal';
        modal.className = 'user-session-modal';
        modal.innerHTML = [
          '<div class="user-session-card" role="dialog" aria-modal="true" aria-labelledby="userSessionWarningTitle">',
            '<h3 class="user-session-title" id="userSessionWarningTitle"><i class="fas fa-clock"></i> Session expiring soon</h3>',
            '<p class="user-session-text">For your security, you\'ll be logged out in <span class="user-session-count" id="userSessionCountdown">0</span> seconds due to inactivity.</p>',
            '<div class="user-session-actions">',
              '<button type="button" class="user-session-btn secondary" id="userSessionLogoutNow">Log out now</button>',
              '<button type="button" class="user-session-btn primary" id="userSessionStayBtn">Stay logged in</button>',
            '</div>',
          '</div>'
        ].join('');

        document.body.appendChild(modal);
        return modal;
      };

      const clearTimers = () => {
        if (warningTimer) {
          window.clearTimeout(warningTimer);
          warningTimer = null;
        }
        if (hardTimeoutTimer) {
          window.clearTimeout(hardTimeoutTimer);
          hardTimeoutTimer = null;
        }
        if (countdownInterval) {
          window.clearInterval(countdownInterval);
          countdownInterval = null;
        }
      };

      const pingSession = () => fetch(pingUrl, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      }).then((res) => {
        if (!res.ok) {
          throw new Error('Session ping failed');
        }
        return res.json().catch(() => ({}));
      });

      const closeModal = () => {
        const modal = document.getElementById('userSessionWarningModal');
        if (modal) {
          modal.style.display = 'none';
        }
        if (countdownInterval) {
          window.clearInterval(countdownInterval);
          countdownInterval = null;
        }
        isPromptOpen = false;
      };

      const showWarningPrompt = () => {
        if (isPromptOpen) return;
        isPromptOpen = true;

        const modal = ensureModal();
        const countdownEl = modal.querySelector('#userSessionCountdown');
        const stayBtn = modal.querySelector('#userSessionStayBtn');
        const logoutBtn = modal.querySelector('#userSessionLogoutNow');

        remainingSeconds = Math.max(1, Math.ceil(warningMs / 1000));
        if (countdownEl) countdownEl.textContent = String(remainingSeconds);
        modal.style.display = 'flex';

        if (countdownInterval) {
          window.clearInterval(countdownInterval);
        }
        countdownInterval = window.setInterval(() => {
          remainingSeconds = Math.max(0, remainingSeconds - 1);
          if (countdownEl) countdownEl.textContent = String(remainingSeconds);
          if (remainingSeconds <= 0) {
            window.clearInterval(countdownInterval);
            countdownInterval = null;
            window.location.assign(logoutUrl);
          }
        }, 1000);

        if (logoutBtn) {
          logoutBtn.onclick = () => {
            window.location.assign(logoutUrl);
          };
        }

        if (stayBtn) {
          stayBtn.disabled = false;
          stayBtn.textContent = 'Stay logged in';
          stayBtn.onclick = () => {
            stayBtn.disabled = true;
            stayBtn.textContent = 'Refreshing...';

            pingSession()
              .then(() => {
                closeModal();
                scheduleTimers();
              })
              .catch(() => {
                window.location.assign(logoutUrl);
              })
              .finally(() => {
                if (stayBtn) {
                  stayBtn.disabled = false;
                  stayBtn.textContent = 'Stay logged in';
                }
              });
          };
        }
      };

      const scheduleTimers = () => {
        clearTimers();
        warningTimer = window.setTimeout(showWarningPrompt, timeoutMs - warningMs);
        hardTimeoutTimer = window.setTimeout(() => {
          window.location.assign(logoutUrl);
        }, timeoutMs + 1000);
      };

      const interactionEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
      let lastInteractionAt = 0;

      const handleInteraction = () => {
        if (isPromptOpen) return;
        const now = Date.now();
        if (now - lastInteractionAt < 1000) return;
        lastInteractionAt = now;
        scheduleTimers();
      };

      interactionEvents.forEach((evt) => {
        window.addEventListener(evt, handleInteraction, { passive: true });
      });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          scheduleTimers();
        }
      });

      scheduleTimers();
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
          const parentBtn = link.closest('.nav-item')?.querySelector('.nav-btn');
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
      ensureHeaderResources();
      HeaderNav.init();
      NotificationLoader.init();
      InactivityWarning.init();
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
