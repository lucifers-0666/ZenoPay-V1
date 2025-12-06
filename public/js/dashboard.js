// Dashboard JavaScript

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  initializeTime();
  initializeNotifications();
  initializeSidebar();
  initializeAnimations();
  initializeFooterNav();
});

// Update current time
function initializeTime() {
  const timeElement = document.getElementById("currentTime");

  function updateTime() {
    const now = new Date();
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    timeElement.textContent = now.toLocaleDateString("en-US", options);
  }

  updateTime();
  setInterval(updateTime, 60000); // Update every minute
}

// Notification functionality
function initializeNotifications() {
  const notificationBtn = document.getElementById("notificationBtn");
  const notificationDropdown = document.getElementById("notificationDropdown");
  const markReadBtn = document.querySelector(".mark-read");
  const notificationItems = document.querySelectorAll(".notification-item");

  // Toggle notification dropdown
  notificationBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    notificationDropdown.classList.toggle("show");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", function (e) {
    if (
      !notificationDropdown.contains(e.target) &&
      e.target !== notificationBtn
    ) {
      notificationDropdown.classList.remove("show");
    }
  });

  // Mark all as read
  markReadBtn.addEventListener("click", function () {
    notificationItems.forEach((item) => {
      item.classList.remove("unread");
    });

    const badge = document.querySelector(".notification-badge");
    badge.style.display = "none";
  });

  // Individual notification click
  notificationItems.forEach((item) => {
    item.addEventListener("click", function () {
      this.classList.remove("unread");
      updateNotificationBadge();
    });
  });
}

// Update notification badge count
function updateNotificationBadge() {
  const unreadCount = document.querySelectorAll(
    ".notification-item.unread"
  ).length;
  const badge = document.querySelector(".notification-badge");

  if (unreadCount > 0) {
    badge.textContent = unreadCount;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

// Sidebar toggle for mobile
function initializeSidebar() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const mainContent = document.querySelector(".main-content");

  menuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("active");
  });

  // Close sidebar when clicking outside on mobile
  mainContent.addEventListener("click", function () {
    if (window.innerWidth <= 768 && sidebar.classList.contains("active")) {
      sidebar.classList.remove("active");
    }
  });

  // Sidebar navigation
  const navLinks = document.querySelectorAll(".sidebar-nav a");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // Remove active class from all items
      document.querySelectorAll(".sidebar-nav li").forEach((li) => {
        li.classList.remove("active");
      });

      // Add active class to clicked item
      this.parentElement.classList.add("active");

      // Close sidebar on mobile after clicking
      if (window.innerWidth <= 768) {
        sidebar.classList.remove("active");
      }
    });
  });
}

// Initialize animations
function initializeAnimations() {
  // Animate cards on scroll
  const cards = document.querySelectorAll(".card");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }, index * 100);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  cards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    observer.observe(card);
  });
}

// Quick action buttons
const actionBtns = document.querySelectorAll(".action-btn");
actionBtns.forEach((btn) => {
  btn.addEventListener("click", function () {
    const action = this.querySelector("span").textContent;
    showNotification(`${action} clicked!`, "info");
  });
});

// New Transaction button
const newTransactionBtn = document.querySelector(".btn-primary");
if (newTransactionBtn) {
  newTransactionBtn.addEventListener("click", function () {
    showNotification("New transaction form would open here", "success");
  });
}

// Show notification toast
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `toast-notification toast-${type}`;
  notification.textContent = message;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: ${
          type === "success"
            ? "#28A745"
            : type === "danger"
            ? "#DC3545"
            : "#456882"
        };
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-size: 0.95rem;
    `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add CSS animations for toast
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Payment method interactions
const paymentMethods = document.querySelectorAll(".payment-method");
paymentMethods.forEach((method) => {
  method.addEventListener("click", function () {
    paymentMethods.forEach((m) => (m.style.outline = "none"));
    this.style.outline = "2px solid #456882";
    setTimeout(() => {
      this.style.outline = "none";
    }, 2000);
  });
});

// Transaction item interactions
const transactionItems = document.querySelectorAll(".transaction-item");
transactionItems.forEach((item) => {
  item.addEventListener("click", function () {
    const transactionName = this.querySelector(".transaction-name").textContent;
    showNotification(`Viewing details for: ${transactionName}`, "info");
  });
});

// Handle video error
const heroVideo = document.querySelector(".hero-video");
if (heroVideo) {
  heroVideo.addEventListener("error", function () {
    console.warn(
      "Video could not be loaded. Please ensure /zeno1.mp4 exists in the root directory."
    );
    // Add fallback background
    const videoContainer = document.querySelector(".video-container");
    videoContainer.style.background =
      "linear-gradient(135deg, #1B3C53 0%, #456882 100%)";
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Add loading state to buttons
function addLoadingState(button) {
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  button.disabled = true;

  setTimeout(() => {
    button.innerHTML = originalText;
    button.disabled = false;
  }, 1500);
}

// Mobile footer navigation
function initializeFooterNav() {
  const footerNavItems = document.querySelectorAll(".footer-nav-item");

  footerNavItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      // Remove active class from all items
      footerNavItems.forEach((nav) => nav.classList.remove("active"));

      // Add active class to clicked item
      this.classList.add("active");

      // Close sidebar if open
      const sidebar = document.querySelector(".sidebar");
      if (sidebar.classList.contains("active")) {
        sidebar.classList.remove("active");
      }

      // Get the href and scroll to section or handle navigation
      const target = this.getAttribute("href");
      if (target.startsWith("#")) {
        const section = document.querySelector(target);
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
}

// Handle window resize
let resizeTimer;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function () {
    // Reset sidebar on desktop view
    if (window.innerWidth > 768) {
      document.querySelector(".sidebar").classList.remove("active");
    }
  }, 250);
});

console.log("ZenoPay Dashboard initialized successfully!");
