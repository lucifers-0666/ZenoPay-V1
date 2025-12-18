/**
 * ZenoPay Payment Gateway SDK
 * Version: 1.0.0
 * 
 * Usage:
 * 1. Include this script in your HTML: <script src="https://zenopay.com/js/zenopay-sdk.js"></script>
 * 2. Initialize: ZenoPay.init({ apiKey: 'your_api_key', merchantName: 'Your Business' });
 * 3. Open payment: ZenoPay.openPayment({ amount: 1000, orderId: 'ORD123', ... });
 */

(function (window, document) {
  'use strict';

  // Configuration
  const ZENOPAY_BASE_URL = window.location.origin; // Change this in production

  // ZenoPay SDK
  const ZenoPay = {
    version: '1.0.0',
    config: {
      apiKey: null,
      merchantName: null,
      merchantId: null,
      baseUrl: ZENOPAY_BASE_URL,
    },

    /**
     * Initialize ZenoPay SDK
     * @param {Object} config - Configuration object
     * @param {string} config.apiKey - Your ZenoPay API key
     * @param {string} config.merchantName - Your business name
     * @param {string} config.baseUrl - Optional: Custom ZenoPay server URL
     */
    init: function (config) {
      if (!config.apiKey) {
        throw new Error('ZenoPay: API Key is required');
      }

      this.config = {
        ...this.config,
        ...config,
      };

      // Load payment gateway UI script
      this.loadGatewayUI();

      // Load payment CSS
      this.loadStyles();

      console.log(`ZenoPay SDK v${this.version} initialized`);
      return this;
    },

    /**
     * Load Gateway UI script dynamically
     */
    loadGatewayUI: function () {
      if (window.ZenoPayGatewayLoaded) return;

      const script = document.createElement('script');
      script.src = `${this.config.baseUrl}/js/GatewayUI.js`;
      script.async = true;
      script.onload = () => {
        window.ZenoPayGatewayLoaded = true;
        console.log('ZenoPay Gateway UI loaded');
      };
      document.head.appendChild(script);
    },

    /**
     * Load payment styles
     */
    loadStyles: function () {
      if (document.getElementById('zenopay-styles')) return;

      const link = document.createElement('link');
      link.id = 'zenopay-styles';
      link.rel = 'stylesheet';
      link.href = `${this.config.baseUrl}/css/payment.css`;
      document.head.appendChild(link);
    },

    /**
     * Open payment modal
     * @param {Object} options - Payment options
     * @param {number} options.amount - Payment amount
     * @param {string} options.orderId - Your order ID
     * @param {string} options.customerName - Customer name
     * @param {string} options.customerEmail - Customer email
     * @param {string} options.customerMobile - Customer mobile
     * @param {string} options.description - Payment description
     * @param {string} options.callbackUrl - URL to redirect after payment
     * @param {Object} options.metadata - Additional metadata
     */
    openPayment: function (options) {
      // Validate
      if (!this.config.apiKey) {
        throw new Error('ZenoPay: SDK not initialized. Call ZenoPay.init() first');
      }

      if (!options.amount || !options.orderId) {
        throw new Error('ZenoPay: amount and orderId are required');
      }

      // Merge with config
      const paymentConfig = {
        ...this.config,
        ...options,
      };

      // Wait for Gateway UI to load
      const openModal = () => {
        if (typeof window.openPaymentModal === 'function') {
          window.openPaymentModal(paymentConfig);
        } else {
          console.error('ZenoPay: Gateway UI not loaded yet');
        }
      };

      if (window.ZenoPayGatewayLoaded) {
        openModal();
      } else {
        // Wait for script to load
        setTimeout(() => {
          openModal();
        }, 500);
      }
    },

    /**
     * Verify payment status
     * @param {string} transactionId - Transaction ID to verify
     * @returns {Promise} Payment status
     */
    verifyPayment: async function (transactionId) {
      try {
        const response = await fetch(
          `${this.config.baseUrl}/api/payment/status?transactionId=${transactionId}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        return await response.json();
      } catch (error) {
        console.error('ZenoPay: Error verifying payment', error);
        throw error;
      }
    },

    /**
     * Get merchant configuration
     * @returns {Promise} Merchant config
     */
    getMerchantConfig: async function () {
      try {
        const response = await fetch(
          `${this.config.baseUrl}/api/payment/sdk-config?apiKey=${this.config.apiKey}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();
        if (result.success) {
          this.config.merchantId = result.config.merchantId;
          this.config.merchantName = result.config.merchantName || this.config.merchantName;
        }
        return result;
      } catch (error) {
        console.error('ZenoPay: Error fetching merchant config', error);
        throw error;
      }
    },
  };

  // Expose to window
  window.ZenoPay = ZenoPay;

  // Auto-initialize if data-api-key attribute exists
  document.addEventListener('DOMContentLoaded', function () {
    const script = document.querySelector('script[data-zenopay-key]');
    if (script) {
      const apiKey = script.getAttribute('data-zenopay-key');
      const merchantName = script.getAttribute('data-merchant-name') || 'Merchant';

      ZenoPay.init({
        apiKey: apiKey,
        merchantName: merchantName,
      });
    }
  });
})(window, document);
