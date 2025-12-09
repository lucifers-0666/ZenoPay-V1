(function () {
  "use strict";

  if (window.notificationSystemInitialized) return;
  window.notificationSystemInitialized = true;

  let elements = {};
  let isInitialized = false;
  let countUpdateTimer = null;
  let isLoadingNotifications = false;

  function initialize() {
    if (isInitialized) return false;

    const wrapper = document.getElementById("notificationWrapper");
    if (!wrapper) return false;

    createUI(wrapper);
    attachEventListeners();
    loadNotificationCount();

    countUpdateTimer = setInterval(loadNotificationCount, 60000);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) loadNotificationCount();
    });

    isInitialized = true;
    return true;
  }

  function createUI(wrapper) {
    wrapper.innerHTML = "";

    elements.btn = createElement("button", {
      type: "button",
      className: "notification-btn",
      id: "notificationBtn",
      innerHTML:
        '<i class="fas fa-bell"></i><span class="notification-badge" id="notificationBadge">0</span>',
    });

    elements.dropdown = createElement("div", {
      className: "notification-dropdown",
      id: "notificationDropdown",
    });

    const header = createElement("div", {
      className: "notification-header",
      innerHTML:
        '<h3>Notifications</h3><button type="button" class="mark-read" id="markAllReadBtn">Mark all as read</button>',
    });

    elements.list = createElement("div", {
      className: "notification-list",
      id: "notificationList",
      innerHTML:
        '<div class="empty-notification"><i class="fas fa-bell-slash"></i><p>No notifications</p></div>',
    });

    elements.dropdown.appendChild(header);
    elements.dropdown.appendChild(elements.list);
    wrapper.appendChild(elements.btn);
    wrapper.appendChild(elements.dropdown);

    elements.badge = document.getElementById("notificationBadge");
    elements.markAllBtn = document.getElementById("markAllReadBtn");
  }

  function createElement(tag, attrs) {
    const el = document.createElement(tag);
    Object.assign(el, attrs);
    return el;
  }

  function attachEventListeners() {
    elements.btn.addEventListener("click", handleBtnClick, true);
    elements.markAllBtn.addEventListener("click", markAllAsRead);
    document.addEventListener("click", closeDropdownOutside);
  }

  function handleBtnClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const isVisible = elements.dropdown.classList.contains("show");

    if (isVisible) {
      elements.dropdown.classList.remove("show");
    } else {
      elements.dropdown.classList.add("show");
      if (!isLoadingNotifications) {
        loadNotifications();
      }
    }

    return false;
  }

  function closeDropdownOutside(e) {
    if (!elements.dropdown || !elements.btn) return;
    if (
      !elements.dropdown.contains(e.target) &&
      !elements.btn.contains(e.target)
    ) {
      elements.dropdown.classList.remove("show");
    }
  }

  async function loadNotificationCount() {
    if (!elements.badge) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("/api/notifications/count", {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
        showLoader: false,
      });

      clearTimeout(timeoutId);

      if (!response.ok) return;

      const data = await response.json();
      if (data.success) {
        const count = parseInt(data.count) || 0;
        elements.badge.textContent = count;
        elements.badge.style.display = count > 0 ? "flex" : "none";
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error loading notification count:", error);
      }
    }
  }

  async function loadNotifications() {
    if (!elements.list || isLoadingNotifications) return;

    isLoadingNotifications = true;
    elements.list.innerHTML =
      '<div class="loading-notification"><i class="fas fa-spinner fa-spin"></i><p>Loading...</p></div>';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/notifications/recent", {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
        showLoader: false,
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data.success && data.notifications?.length > 0) {
        renderNotifications(data.notifications);
      } else {
        elements.list.innerHTML =
          '<div class="empty-notification"><i class="fas fa-bell-slash"></i><p>No notifications</p></div>';
      }
    } catch (error) {
      if (error.name === "AbortError") {
        elements.list.innerHTML =
          '<div class="error-notification"><i class="fas fa-exclamation-circle"></i><p>Request timeout</p></div>';
      } else {
        elements.list.innerHTML =
          '<div class="error-notification"><i class="fas fa-exclamation-circle"></i><p>Failed to load</p></div>';
      }
    } finally {
      isLoadingNotifications = false;
    }
  }

  function renderNotifications(notifications) {
    if (!elements.list) return;

    elements.list.innerHTML = "";

    notifications.forEach((notif) => {
      const item = createElement("div", {
        className: `notification-item ${!notif.IsRead ? "unread" : ""}`,
      });

      const icon = getIcon(notif.Type);
      const time = getTimeAgo(new Date(notif.createdAt));
      const title = escapeHtml(notif.Title || "Notification");
      const message = escapeHtml(formatMessage(notif.Message || ""));
      const amount = notif.Amount
        ? `<div class="notification-amount ${notif.Type}">₹${parseFloat(
            notif.Amount
          ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>`
        : "";

      item.innerHTML = `
        <div class="notification-icon-circle ${notif.Type || "info"}">
          <i class="fas ${icon}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${title}</div>
          <div class="notification-message">${message}</div>
          <div class="notification-time">
            <i class="far fa-clock"></i> ${time}
          </div>
        </div>
        ${amount}
      `;

      elements.list.appendChild(item);
    });
  }

  function formatMessage(message) {
    return message.replace(/\(AC\d+\)/g, "").trim();
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function getIcon(type) {
    const icons = {
      credit: "fa-arrow-down",
      debit: "fa-arrow-up",
      info: "fa-info-circle",
      warning: "fa-exclamation-triangle",
      success: "fa-check-circle",
      reward: "fa-gift",
    };
    return icons[type] || "fa-bell";
  }

  function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];

    for (const { label, seconds: intervalSeconds } of intervals) {
      const interval = Math.floor(seconds / intervalSeconds);
      if (interval >= 1) {
        return `${interval} ${label}${interval > 1 ? "s" : ""} ago`;
      }
    }
    return "Just now";
  }

  async function markAllAsRead(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!elements.list) return false;

    elements.list.innerHTML =
      '<div class="loading-notification"><i class="fas fa-spinner fa-spin"></i><p>Marking as read...</p></div>';

    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        showLoader: false,
      });

      const data = await response.json();
      if (data.success) {
        await loadNotificationCount();
        await loadNotifications();

        if (typeof ZenoAlert !== "undefined") {
          ZenoAlert.success("Success", "All notifications marked as read");
        }
      } else {
        elements.list.innerHTML =
          '<div class="error-notification"><i class="fas fa-exclamation-circle"></i><p>Failed to mark as read</p></div>';
      }
    } catch (error) {
      elements.list.innerHTML =
        '<div class="error-notification"><i class="fas fa-exclamation-circle"></i><p>An error occurred</p></div>';
    }

    return false;
  }

  function startWatching() {
    if (initialize()) return;

    const observer = new MutationObserver(() => {
      if (initialize()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
    }, 3000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startWatching);
  } else {
    startWatching();
  }

  window.addEventListener("beforeunload", () => {
    if (countUpdateTimer) clearInterval(countUpdateTimer);
  });
})();
