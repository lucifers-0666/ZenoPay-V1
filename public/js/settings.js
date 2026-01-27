// Settings Page JavaScript

// Tab Switching
document.addEventListener("DOMContentLoaded", function () {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");

      // Remove active class from all tabs and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked tab and corresponding content
      button.classList.add("active");
      document.getElementById(`${tabName}-tab`).classList.add("active");
    });
  });
});

// Personal Information Form
document
  .getElementById("personal-info-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      Email: document.getElementById("email").value,
      PhoneNumber: document.getElementById("phone").value,
      Address: document.getElementById("address").value,
    };

    try {
      const response = await fetch("/settings/personal-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, "success");
      } else {
        showToast(result.message || "Failed to update information", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("An error occurred while updating information", "error");
    }
  });

// Change Password Form
document
  .getElementById("change-password-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters long", "error");
      return;
    }

    const formData = {
      currentPassword,
      newPassword,
      confirmPassword,
    };

    try {
      const response = await fetch("/settings/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, "success");
        // Clear form
        document.getElementById("change-password-form").reset();
      } else {
        showToast(result.message || "Failed to change password", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("An error occurred while changing password", "error");
    }
  });

// Profile Picture Upload
document
  .getElementById("profile-picture-input")
  .addEventListener("change", async function (e) {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", "error");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      const response = await fetch("/settings/profile-picture", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, "success");
        // Update preview image
        document.getElementById("profile-preview").src = result.imageUrl;
      } else {
        showToast(result.message || "Failed to upload picture", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("An error occurred while uploading picture", "error");
    }
  });

// Notification Preferences Form
document
  .getElementById("notification-preferences-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      emailNotifications: document.querySelector(
        'input[name="emailNotifications"]'
      ).checked,
      smsNotifications: document.querySelector(
        'input[name="smsNotifications"]'
      ).checked,
      transactionAlerts: document.querySelector(
        'input[name="transactionAlerts"]'
      ).checked,
      promotionalEmails: document.querySelector(
        'input[name="promotionalEmails"]'
      ).checked,
    };

    try {
      const response = await fetch("/settings/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, "success");
      } else {
        showToast(
          result.message || "Failed to update notification preferences",
          "error"
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showToast(
        "An error occurred while updating notification preferences",
        "error"
      );
    }
  });

// Deactivate Account Modal
function showDeactivateModal() {
  document.getElementById("deactivate-modal").classList.add("active");
}

function closeDeactivateModal() {
  document.getElementById("deactivate-modal").classList.remove("active");
  document.getElementById("deactivate-form").reset();
}

// Close modal on outside click
document
  .getElementById("deactivate-modal")
  .addEventListener("click", function (e) {
    if (e.target === this) {
      closeDeactivateModal();
    }
  });

// Deactivate Account Form
document
  .getElementById("deactivate-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const password = document.getElementById("deactivate-password").value;
    const reason = document.getElementById("deactivate-reason").value;

    if (
      !confirm(
        "Are you absolutely sure you want to deactivate your account? This action cannot be undone."
      )
    ) {
      return;
    }

    const formData = {
      password,
      reason,
    };

    try {
      const response = await fetch("/settings/deactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        showToast(
          "Account deactivated. Redirecting to login...",
          "success"
        );
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        showToast(result.message || "Failed to deactivate account", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("An error occurred while deactivating account", "error");
    }
  });

// Toggle Password Visibility
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.parentElement.querySelector(".toggle-password i");

  if (input.type === "password") {
    input.type = "text";
    button.classList.remove("fa-eye");
    button.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    button.classList.remove("fa-eye-slash");
    button.classList.add("fa-eye");
  }
}

// Toast Notification Function
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Auto-hide alerts after 5 seconds
document.addEventListener("DOMContentLoaded", function () {
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.animation = "slideDown 0.3s ease reverse";
      setTimeout(() => {
        alert.style.display = "none";
      }, 300);
    }, 5000);
  });
});

// Prevent form resubmission on page reload
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}
