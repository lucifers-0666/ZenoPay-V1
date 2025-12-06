// ZenoPay Loader Utility
(function () {
  "use strict";

  // Create loader HTML structure
  const loaderHTML = `
    <div id="zenoPayLoader" class="zenopay-loader-overlay">
      <div class="zenopay-loader-container">
        <div class="zenopay-loader-logo">
          <img src="/Images/bgFavicon.png" alt="ZenoPay" class="loader-logo-img">
        </div>
        <div class="zenopay-loader-spinner"></div>
        <p class="zenopay-loader-text">Loading...</p>
      </div>
    </div>
  `;

  // Create loader CSS
  const loaderCSS = `
    .zenopay-loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(27, 60, 83, 0.95);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .zenopay-loader-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    .zenopay-loader-container {
      text-align: center;
      animation: fadeInUp 0.5s ease;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .zenopay-loader-logo {
      margin-bottom: 2rem;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.1);
        opacity: 0.8;
      }
    }

    .loader-logo-img {
      width: 100px;
      height: 100px;
      filter: drop-shadow(0 4px 20px rgba(234, 216, 192, 0.5));
    }

    .zenopay-loader-spinner {
      width: 60px;
      height: 60px;
      margin: 0 auto 1.5rem;
      border: 4px solid rgba(234, 216, 192, 0.3);
      border-top: 4px solid #ead8c0;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .zenopay-loader-text {
      color: #ead8c0;
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0;
      animation: textPulse 1.5s ease-in-out infinite;
    }

    @keyframes textPulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    /* Small loader for inline use */
    .zenopay-loader-small {
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(69, 104, 130, 0.3);
      border-top: 3px solid #456882;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-left: 0.5rem;
      vertical-align: middle;
    }

    /* Button loader state */
    .btn-loading {
      position: relative;
      pointer-events: none;
      opacity: 0.7;
    }

    .btn-loading::after {
      content: '';
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .loader-logo-img {
        width: 80px;
        height: 80px;
      }

      .zenopay-loader-spinner {
        width: 50px;
        height: 50px;
      }

      .zenopay-loader-text {
        font-size: 1rem;
      }
    }
  `;

  // Inject CSS into document
  function injectCSS() {
    const style = document.createElement("style");
    style.textContent = loaderCSS;
    document.head.appendChild(style);
  }

  // Inject loader HTML into document
  function injectLoader() {
    const loaderDiv = document.createElement("div");
    loaderDiv.innerHTML = loaderHTML;
    document.body.appendChild(loaderDiv.firstElementChild);
  }

  // Initialize loader on DOM ready
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        injectCSS();
        injectLoader();
      });
    } else {
      injectCSS();
      injectLoader();
    }
  }

  // Loader API
  window.ZenoPayLoader = {
    // Show loader with optional custom text
    show: function (text) {
      const loader = document.getElementById("zenoPayLoader");
      if (loader) {
        const textElement = loader.querySelector(".zenopay-loader-text");
        if (text && textElement) {
          textElement.textContent = text;
        }
        loader.classList.add("active");
        document.body.style.overflow = "hidden";
      }
    },

    // Hide loader
    hide: function () {
      const loader = document.getElementById("zenoPayLoader");
      if (loader) {
        loader.classList.remove("active");
        document.body.style.overflow = "";
        // Reset text to default after fade out
        setTimeout(() => {
          const textElement = loader.querySelector(".zenopay-loader-text");
          if (textElement) {
            textElement.textContent = "Loading...";
          }
        }, 300);
      }
    },

    // Show loader for a specific duration
    showFor: function (duration, text) {
      this.show(text);
      setTimeout(() => {
        this.hide();
      }, duration);
    },

    // Add loading state to a button
    buttonLoading: function (button, loading) {
      if (loading) {
        button.classList.add("btn-loading");
        button.disabled = true;
        button.setAttribute("data-original-text", button.innerHTML);
      } else {
        button.classList.remove("btn-loading");
        button.disabled = false;
        const originalText = button.getAttribute("data-original-text");
        if (originalText) {
          button.innerHTML = originalText;
          button.removeAttribute("data-original-text");
        }
      }
    },

    // Create small inline loader
    createSmallLoader: function () {
      const loader = document.createElement("span");
      loader.className = "zenopay-loader-small";
      return loader;
    },
  };

  // Auto-show loader on page load
  window.addEventListener("load", function () {
    // Hide initial page load loader if it exists
    if (document.getElementById("zenoPayLoader")) {
      setTimeout(() => {
        ZenoPayLoader.hide();
      }, 500);
    }
  });

  // Show loader on page navigation (back/forward)
  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      ZenoPayLoader.hide();
    }
  });

  // Show loader before page unload
  window.addEventListener("beforeunload", function () {
    ZenoPayLoader.show("Loading...");
  });

  // Intercept form submissions to show loader
  document.addEventListener(
    "submit",
    function (e) {
      const form = e.target;
      if (!form.hasAttribute("data-no-loader")) {
        const submitText =
          form.getAttribute("data-loader-text") || "Submitting...";
        ZenoPayLoader.show(submitText);
      }
    },
    true
  );

  // Intercept AJAX requests (fetch)
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const [url, config] = args;

    // Check if loader should be shown
    const showLoader = !config || config.showLoader !== false;
    const loaderText = (config && config.loaderText) || "Processing...";

    if (showLoader) {
      ZenoPayLoader.show(loaderText);
    }

    return originalFetch
      .apply(this, args)
      .then((response) => {
        if (showLoader) {
          ZenoPayLoader.hide();
        }
        return response;
      })
      .catch((error) => {
        if (showLoader) {
          ZenoPayLoader.hide();
        }
        throw error;
      });
  };

  // Intercept AJAX requests (XMLHttpRequest)
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (...args) {
    this._url = args[1];
    return originalOpen.apply(this, args);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    const xhr = this;

    // Check if loader should be shown
    if (!xhr._noLoader) {
      ZenoPayLoader.show("Processing...");
    }

    xhr.addEventListener("loadend", function () {
      if (!xhr._noLoader) {
        ZenoPayLoader.hide();
      }
    });

    return originalSend.apply(this, args);
  };

  // Initialize
  init();
})();

// Utility functions for easy access
function showLoader(text) {
  if (window.ZenoPayLoader) {
    window.ZenoPayLoader.show(text);
  }
}

function hideLoader() {
  if (window.ZenoPayLoader) {
    window.ZenoPayLoader.hide();
  }
}

function showLoaderFor(duration, text) {
  if (window.ZenoPayLoader) {
    window.ZenoPayLoader.showFor(duration, text);
  }
}

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ZenoPayLoader;
}
