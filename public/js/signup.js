(function () {
  const form = document.getElementById("signup-form");
  if (!form) return;

  const submitBtn = document.getElementById("submit-btn");
  const btnText = submitBtn?.querySelector(".btn-text");
  const btnLoader = submitBtn?.querySelector(".btn-loader");
  const toast = document.getElementById("toast");
  const successModal = document.getElementById("success-modal");
  const zenoPayIdEl = document.getElementById("display-zenopay-id");
  const proceedBtn = document.getElementById("proceed-btn");
  let successRedirectUrl = "/login";

  const fullName = document.getElementById("fullName");
  const email = document.getElementById("email");
  const phoneNumber = document.getElementById("phoneNumber");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");
  const agreeToTerms = document.getElementById("agreeToTerms");

  const passwordStrength = document.getElementById("password-strength");
  const strengthFill = document.getElementById("strength-fill");
  const strengthText = document.getElementById("strength-text");

  const errorEls = {
    fullName: document.getElementById("fullName-error"),
    email: document.getElementById("email-error"),
    phoneNumber: document.getElementById("phoneNumber-error"),
    password: document.getElementById("password-error"),
    confirmPassword: document.getElementById("confirmPassword-error"),
    terms: document.getElementById("terms-error"),
  };

  window.togglePasswordVisibility = function togglePasswordVisibility(id) {
    const input = document.getElementById(id);
    if (!input) return;
    const wrapper = input.closest(".password-input-wrapper");
    const icon = wrapper?.querySelector(".toggle-password i");

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    if (icon) {
      icon.classList.toggle("fa-eye", !isPassword);
      icon.classList.toggle("fa-eye-slash", isPassword);
    }
  };

  function showToast(message, type) {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type || ""}`.trim();
    setTimeout(() => {
      toast.className = "toast";
    }, 3200);
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (btnText) btnText.style.display = loading ? "none" : "inline";
    if (btnLoader) btnLoader.style.display = loading ? "inline" : "none";
  }

  function clearErrors() {
    Object.values(errorEls).forEach((el) => {
      if (el) el.textContent = "";
    });
  }

  function setError(key, message) {
    const el = errorEls[key];
    if (el) el.textContent = message;
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "").slice(-10);
  }

  function validateForm() {
    clearErrors();

    let isValid = true;

    if (!fullName.value.trim()) {
      setError("fullName", "Full name is required");
      isValid = false;
    }

    const emailVal = email.value.trim().toLowerCase();
    if (!emailVal) {
      setError("email", "Email is required");
      isValid = false;
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(emailVal)) {
      setError("email", "Please enter a valid email address");
      isValid = false;
    }

    const phone = normalizePhone(phoneNumber.value);
    if (!phone) {
      setError("phoneNumber", "Phone number is required");
      isValid = false;
    } else if (phone.length !== 10) {
      setError("phoneNumber", "Please enter a valid 10-digit phone number");
      isValid = false;
    }

    if (!password.value) {
      setError("password", "Password is required");
      isValid = false;
    } else if (password.value.length < 8) {
      setError("password", "Password must be at least 8 characters long");
      isValid = false;
    }

    if (!confirmPassword.value) {
      setError("confirmPassword", "Please confirm your password");
      isValid = false;
    } else if (password.value !== confirmPassword.value) {
      setError("confirmPassword", "Passwords do not match");
      isValid = false;
    }

    if (!agreeToTerms.checked) {
      setError("terms", "You must agree to Terms & Conditions");
      isValid = false;
    }

    return isValid;
  }

  function updatePasswordStrength() {
    if (!passwordStrength || !strengthFill || !strengthText) return;

    const value = password.value || "";
    let score = 0;

    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;

    const pct = (score / 4) * 100;
    strengthFill.style.width = `${pct}%`;

    if (!value.length) {
      strengthText.textContent = "Enter password";
      strengthFill.style.background = "#9CA3AF";
      return;
    }

    if (score <= 1) {
      strengthText.textContent = "Weak";
      strengthFill.style.background = "#EF4444";
    } else if (score <= 2) {
      strengthText.textContent = "Fair";
      strengthFill.style.background = "#F59E0B";
    } else if (score === 3) {
      strengthText.textContent = "Good";
      strengthFill.style.background = "#3B82F6";
    } else {
      strengthText.textContent = "Strong";
      strengthFill.style.background = "#10B981";
    }
  }

  password?.addEventListener("input", updatePasswordStrength);

  [fullName, email, phoneNumber, password, confirmPassword].forEach((input) => {
    input?.addEventListener("input", clearErrors);
  });
  agreeToTerms?.addEventListener("change", clearErrors);

  proceedBtn?.addEventListener("click", () => {
    window.location.href = successRedirectUrl;
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const payload = {
      fullName: fullName.value.trim(),
      email: email.value.trim().toLowerCase(),
      phoneNumber: normalizePhone(phoneNumber.value),
      password: password.value,
      confirmPassword: confirmPassword.value,
      agreeToTerms: agreeToTerms.checked,
    };

    setLoading(true);

    try {
      const response = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const message = data?.message || "Registration failed. Please try again.";
        showToast(message, "error");

        if (/email/i.test(message)) setError("email", message);
        else if (/phone/i.test(message)) setError("phoneNumber", message);
        else if (/password/i.test(message)) setError("password", message);
        else if (/terms/i.test(message)) setError("terms", message);

        return;
      }

      if (zenoPayIdEl) {
        zenoPayIdEl.textContent = data.zenoPayId || "Generated";
      }
      successRedirectUrl = data.redirect || "/login";

      showToast(data.message || "Signup successful! Redirecting to login...", "success");

      if (successModal) {
        successModal.classList.add("show");
      }

      setTimeout(() => {
        window.location.href = successRedirectUrl;
      }, 1200);
    } catch (error) {
      console.error("Signup error:", error);
      showToast("Unable to connect to server. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  });
})();
