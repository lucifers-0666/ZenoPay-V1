/* ========================================
   ACCOUNT SETTINGS PAGE INTERACTIONS
   ======================================== */

(function () {
  const ROUTES = {
    profile: "/settings/personal-info",
    avatar: "/settings/profile-picture",
    notifications: "/settings/notifications",
  };

  document.addEventListener("DOMContentLoaded", initializeSettings);

  function initializeSettings() {
    initializeTabNavigation();
    initializeAvatarUpload();
    initializeFormSubmissions();
    initializeNotificationToggles();
    initializeModalHandlers();
    initializeDeleteAccountFlow();
    initializeKeyboardNavigation();
  }

  function initializeTabNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const mobileTabBtns = document.querySelectorAll(".mobile-tab-btn");

    navItems.forEach((item) => {
      item.addEventListener("click", function (e) {
        e.preventDefault();
        switchTab(this.getAttribute("data-tab"));
      });
    });

    mobileTabBtns.forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        switchTab(this.getAttribute("data-tab"));
      });
    });
  }

  function switchTab(tabName) {
    document.querySelectorAll(".nav-item, .mobile-tab-btn, .tab-panel").forEach((el) => {
      el.classList.remove("active");
    });

    document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add("active");
    document.querySelector(`.mobile-tab-btn[data-tab="${tabName}"]`)?.classList.add("active");
    document.querySelector(`#${tabName}-panel`)?.classList.add("active");
  }

  function initializeAvatarUpload() {
    const fileInput = document.getElementById("avatar-input");
    const avatarPreview = document.getElementById("avatar-preview");

    if (!fileInput) return;

    fileInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showToast("error", "Please select a valid image file");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast("error", "File size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (avatarPreview) avatarPreview.src = e.target.result;
      };
      reader.readAsDataURL(file);

      await uploadAvatar(file);
    });
  }

  async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const response = await fetch(ROUTES.avatar, {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to upload profile picture");
      }

      showToast("success", "Profile picture updated");
    } catch (error) {
      showToast("error", error.message || "Failed to upload profile picture");
    }
  }

  function initializeFormSubmissions() {
    const profileForm = document.getElementById("profile-form");
    if (!profileForm) return;

    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      clearErrors();
      const payload = getProfilePayload(profileForm);
      const clientErrors = validateProfilePayload(payload);

      if (Object.keys(clientErrors).length) {
        Object.entries(clientErrors).forEach(([field, message]) => showFieldError(field, message));
        showToast("error", "Please correct the highlighted fields");
        return;
      }

      const submitBtn = profileForm.querySelector('[type="submit"]');
      const originalText = submitBtn?.innerHTML || "Save Changes";
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;
      }

      try {
        const response = await fetch(ROUTES.profile, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to update profile");
        }

        showToast("success", "Profile updated successfully");
        showSaveIndicator();
      } catch (error) {
        showToast("error", error.message || "Failed to update profile");
      } finally {
        if (submitBtn) {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      }
    });
  }

  function getProfilePayload(form) {
    const value = (id) => (document.getElementById(id)?.value || "").trim();

    return {
      fullName: value("full-name"),
      email: value("email"),
      phone: value("phone"),
      dob: value("dob"),
      address: value("address"),
      city: value("city"),
      state: value("state"),
      pincode: value("pincode"),
    };
  }

  function validateProfilePayload(payload) {
    const errors = {};

    if (!payload.fullName) errors["full-name"] = "Full name is required";
    if (!payload.email || !/^\S+@\S+\.\S+$/.test(payload.email)) errors["email"] = "Enter a valid email";
    if (!payload.phone || payload.phone.replace(/\D/g, "").length !== 10) errors["phone"] = "Enter a valid 10-digit phone number";
    if (payload.pincode && !/^\d{6}$/.test(payload.pincode)) errors["pincode"] = "Pincode must be 6 digits";

    return errors;
  }

  function showFieldError(fieldId, message) {
    const errorNode = document.getElementById(`${fieldId}-error`);
    const input = document.getElementById(fieldId);

    if (errorNode) {
      errorNode.textContent = message;
      errorNode.classList.add("show");
    }

    if (input) input.classList.add("has-error");
  }

  function clearErrors() {
    document.querySelectorAll(".error-message").forEach((node) => {
      node.textContent = "";
      node.classList.remove("show");
    });

    document.querySelectorAll(".form-input.has-error").forEach((node) => {
      node.classList.remove("has-error");
    });
  }

  function showSaveIndicator() {
    const indicator = document.getElementById("profile-save-indicator");
    if (!indicator) return;

    indicator.style.display = "inline-flex";
    setTimeout(() => {
      indicator.style.display = "none";
    }, 3000);
  }

  function initializeNotificationToggles() {
    const notificationToggles = Array.from(document.querySelectorAll(".notification-toggle"));
    if (!notificationToggles.length) return;

    notificationToggles.forEach((toggle) => {
      toggle.addEventListener("change", saveNotificationPreferencesFromUI);
    });
  }

  async function saveNotificationPreferencesFromUI() {
    const getChecked = (selector) => Array.from(document.querySelectorAll(selector)).some((el) => el.checked);

    const payload = {
      emailNotifications: String(getChecked('[data-type^="email-"]:not([data-type="email-marketing"])')),
      smsNotifications: String(getChecked('[data-type^="sms-"]')),
      transactionAlerts: String(getChecked('[data-type$="-transactions"]')),
      promotionalEmails: String(!!document.querySelector('[data-type="email-marketing"]')?.checked),
    };

    try {
      const response = await fetch(ROUTES.notifications, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update notification preferences");
      }

      showToast("success", "Notification preferences updated");
    } catch (error) {
      showToast("error", error.message || "Failed to update notification preferences");
    }
  }

  // FIX: initializeModalHandlers now uses event delegation on the document
  // so it works even if the modal HTML is rendered after DOMContentLoaded
  function initializeModalHandlers() {
    // Close button inside modal header
    document.addEventListener("click", function (e) {
      const closeBtn = e.target.closest(".modal-close");
      if (closeBtn) {
        const modal = closeBtn.closest(".modal");
        if (modal) closeModal(modal.id);
      }

      // Clicking the dark overlay background closes the modal
      if (e.target.classList.contains("modal-overlay")) {
        const modal = e.target.closest(".modal");
        if (modal) closeModal(modal.id);
      }
    });
  }

  function initializeDeleteAccountFlow() {
    const idInput = document.getElementById("confirm-zenopay-id");
    const confirmDeleteBtn = document.getElementById("delete-confirm-btn");
    const actualId = document.querySelector(".account-settings-container")?.dataset.zenopayId;

    if (idInput && confirmDeleteBtn && actualId) {
      idInput.addEventListener("input", function () {
        confirmDeleteBtn.disabled = this.value.trim() !== actualId;
      });
    }
  }

  // FIX: Escape key closes any open modal
  function initializeKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        document.querySelectorAll(".modal.active").forEach((modal) => closeModal(modal.id));
      }
    });
  }

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // FIX: closeModal now also resets the confirm input + re-enables delete button
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";

    // Reset delete account confirm field if it's in this modal
    const confirmInput = modal.querySelector("#confirm-zenopay-id");
    if (confirmInput) confirmInput.value = "";
    const confirmBtn = modal.querySelector("#delete-confirm-btn");
    if (confirmBtn) confirmBtn.disabled = true;
  }

  window.openDeleteAccountModal = function () {
    openModal("delete-account-modal");
  };

  window.closeDeleteAccountModal = function () {
    closeModal("delete-account-modal");
  };

  window.confirmDeleteAccount = function () {
    showToast("error", "Delete account flow is not configured yet.");
  };

  window.setupTFA = function () {
    showToast("success", "2FA setup flow will be available soon.");
  };

  function showToast(type, message) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const iconClass = type === "success" ? "fa-check-circle" : "fa-exclamation-circle";
    toast.innerHTML = `<i class="fas ${iconClass}"></i><span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
  }
})();
