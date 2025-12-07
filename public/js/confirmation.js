// ZenoPay Confirmation & Alert System (SweetAlert-like)
if (typeof window.ZenoAlert === "undefined") {
  window.ZenoAlert = {
    // Show success alert
    success: function (title, message, options = {}) {
      return this.show({
        type: "success",
        title: title,
        message: message,
        icon: "fa-check-circle",
        ...options,
      });
    },

    // Show error alert
    error: function (title, message, options = {}) {
      return this.show({
        type: "error",
        title: title,
        message: message,
        icon: "fa-times-circle",
        ...options,
      });
    },

    // Show warning alert
    warning: function (title, message, options = {}) {
      return this.show({
        type: "warning",
        title: title,
        message: message,
        icon: "fa-exclamation-triangle",
        ...options,
      });
    },

    // Show info alert
    info: function (title, message, options = {}) {
      return this.show({
        type: "info",
        title: title,
        message: message,
        icon: "fa-info-circle",
        ...options,
      });
    },

    // Show confirmation dialog
    confirm: function (title, message, options = {}) {
      return new Promise((resolve) => {
        this.show({
          type: "confirm",
          title: title,
          message: message,
          icon: "fa-question-circle",
          showCancelButton: true,
          confirmButtonText: options.confirmButtonText || "Yes, proceed",
          cancelButtonText: options.cancelButtonText || "Cancel",
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
          ...options,
        });
      });
    },

    // Main show function
    show: function (config) {
      const defaults = {
        type: "info",
        title: "",
        message: "",
        icon: "fa-info-circle",
        showCancelButton: false,
        confirmButtonText: "OK",
        cancelButtonText: "Cancel",
        timer: null,
        onConfirm: null,
        onCancel: null,
      };

      const settings = { ...defaults, ...config };

      // Create overlay
      const overlay = document.createElement("div");
      overlay.className = "zeno-alert-overlay";
      overlay.id = "zenoAlertOverlay";

      // Create alert box
      const alertBox = document.createElement("div");
      alertBox.className = `zeno-alert-box ${settings.type}`;

      // Create icon
      const iconDiv = document.createElement("div");
      iconDiv.className = `zeno-alert-icon ${settings.type}`;
      iconDiv.innerHTML = `<i class="fas ${settings.icon}"></i>`;

      // Create title
      const titleDiv = document.createElement("div");
      titleDiv.className = "zeno-alert-title";
      titleDiv.textContent = settings.title;

      // Create message
      const messageDiv = document.createElement("div");
      messageDiv.className = "zeno-alert-message";
      messageDiv.textContent = settings.message;

      // Create buttons container
      const buttonsDiv = document.createElement("div");
      buttonsDiv.className = "zeno-alert-buttons";

      // Confirm button
      const confirmBtn = document.createElement("button");
      confirmBtn.className = `zeno-alert-btn zeno-alert-btn-${settings.type}`;
      confirmBtn.textContent = settings.confirmButtonText;
      confirmBtn.onclick = function () {
        closeAlert();
        if (settings.onConfirm) settings.onConfirm();
      };

      buttonsDiv.appendChild(confirmBtn);

      // Cancel button
      if (settings.showCancelButton) {
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "zeno-alert-btn zeno-alert-btn-cancel";
        cancelBtn.textContent = settings.cancelButtonText;
        cancelBtn.onclick = function () {
          closeAlert();
          if (settings.onCancel) settings.onCancel();
        };
        buttonsDiv.appendChild(cancelBtn);
      }

      // Assemble alert box
      alertBox.appendChild(iconDiv);
      alertBox.appendChild(titleDiv);
      alertBox.appendChild(messageDiv);
      alertBox.appendChild(buttonsDiv);

      overlay.appendChild(alertBox);
      document.body.appendChild(overlay);

      // Trigger animation
      setTimeout(() => {
        overlay.classList.add("show");
        alertBox.classList.add("show");
      }, 10);

      // Auto close if timer is set
      if (settings.timer) {
        setTimeout(() => {
          closeAlert();
          if (settings.onConfirm) settings.onConfirm();
        }, settings.timer);
      }

      // Close alert function
      function closeAlert() {
        overlay.classList.remove("show");
        alertBox.classList.remove("show");
        setTimeout(() => {
          if (overlay.parentNode) {
            document.body.removeChild(overlay);
          }
        }, 300);
      }

      // Close on overlay click
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) {
          closeAlert();
          if (settings.onCancel) settings.onCancel();
        }
      });

      return {
        close: closeAlert,
      };
    },

    // Transaction specific alerts
    transaction: {
      success: function (transactionId, amount) {
        return ZenoAlert.success(
          "Transaction Successful!",
          `₹${parseFloat(amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}\nTransaction ID: ${transactionId}`,
          { timer: 3000 }
        );
      },

      failed: function (reason) {
        return ZenoAlert.error(
          "Transaction Failed",
          reason || "Unable to process your transaction. Please try again.",
          { confirmButtonText: "Try Again" }
        );
      },

      pending: function () {
        return ZenoAlert.warning(
          "Transaction Pending",
          "Your transaction is being processed. Please wait...",
          { confirmButtonText: "OK" }
        );
      },

      insufficientBalance: function () {
        return ZenoAlert.error(
          "Insufficient Balance",
          "You do not have enough balance to complete this transaction.",
          { confirmButtonText: "Close" }
        );
      },

      limitExceeded: function (limit) {
        return ZenoAlert.error(
          "Transaction Limit Exceeded",
          `Your daily transaction limit of ₹${parseFloat(limit).toLocaleString(
            "en-IN"
          )} has been reached.`,
          { confirmButtonText: "Close" }
        );
      },

      confirmTransfer: function (amount, recipient, onConfirm) {
        return ZenoAlert.confirm(
          "Confirm Transfer",
          `Are you sure you want to transfer ₹${parseFloat(
            amount
          ).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })} to ${recipient}?`,
          {
            confirmButtonText: "Yes, Transfer",
            cancelButtonText: "Cancel",
            onConfirm: onConfirm,
          }
        );
      },
    },
  };

  // Add CSS styles
  (function addAlertStyles() {
    if (!document.getElementById("zeno-alert-styles")) {
      const style = document.createElement("style");
      style.id = "zeno-alert-styles";
      style.textContent = `
      .zeno-alert-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(5px);
      }

      .zeno-alert-overlay.show {
        opacity: 1;
      }

      .zeno-alert-box {
        background: white;
        border-radius: 20px;
        padding: 2.5rem 2rem;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        text-align: center;
        transform: scale(0.8);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      .zeno-alert-box.show {
        transform: scale(1);
        opacity: 1;
      }

      .zeno-alert-icon {
        font-size: 4rem;
        margin-bottom: 1.5rem;
        animation: iconPop 0.5s ease;
      }

      @keyframes iconPop {
        0% { transform: scale(0); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      .zeno-alert-icon.success {
        color: #28a745;
      }

      .zeno-alert-icon.error {
        color: #dc3545;
      }

      .zeno-alert-icon.warning {
        color: #ffc107;
      }

      .zeno-alert-icon.info {
        color: #17a2b8;
      }

      .zeno-alert-icon.confirm {
        color: #456882;
      }

      .zeno-alert-title {
        font-size: 1.8rem;
        font-weight: 700;
        color: #1b3c53;
        margin-bottom: 1rem;
      }

      .zeno-alert-message {
        font-size: 1rem;
        color: #666;
        line-height: 1.6;
        margin-bottom: 2rem;
        white-space: pre-line;
      }

      .zeno-alert-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      .zeno-alert-btn {
        padding: 0.8rem 2rem;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 120px;
      }

      .zeno-alert-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      }

      .zeno-alert-btn:active {
        transform: translateY(0);
      }

      .zeno-alert-btn-success {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
      }

      .zeno-alert-btn-error {
        background: linear-gradient(135deg, #dc3545, #c82333);
        color: white;
      }

      .zeno-alert-btn-warning {
        background: linear-gradient(135deg, #ffc107, #ff9800);
        color: white;
      }

      .zeno-alert-btn-info {
        background: linear-gradient(135deg, #17a2b8, #138496);
        color: white;
      }

      .zeno-alert-btn-confirm {
        background: linear-gradient(135deg, #456882, #1b3c53);
        color: white;
      }

      .zeno-alert-btn-cancel {
        background: #e0e0e0;
        color: #333;
      }

      .zeno-alert-btn-cancel:hover {
        background: #d0d0d0;
      }

      @media (max-width: 768px) {
        .zeno-alert-box {
          padding: 2rem 1.5rem;
        }

        .zeno-alert-icon {
          font-size: 3rem;
        }

        .zeno-alert-title {
          font-size: 1.5rem;
        }

        .zeno-alert-message {
          font-size: 0.95rem;
        }

        .zeno-alert-buttons {
          flex-direction: column;
        }

        .zeno-alert-btn {
          width: 100%;
        }
      }
    `;
      document.head.appendChild(style);
    }
  })();
} // End of ZenoAlert definition guard
