// ZenoPay Payment Gateway SDK
(function (window) {
  "use strict";

  // ZenoPay Gateway Configuration
  const ZenoPay = {
    config: {
      apiKey: null,
      merchantName: null,
      amount: null,
      orderId: null,
      customerName: null,
      customerEmail: null,
      customerMobile: null,
      description: null,
      callbackUrl: null,
      metadata: {},
    },
    
    // Initialize the payment gateway
    init: function (config) {
      this.config = { ...this.config, ...config };
      
      // Load payment CSS
      if (!document.getElementById("zenopay-styles")) {
        const link = document.createElement("link");
        link.id = "zenopay-styles";
        link.rel = "stylesheet";
        link.href = this.getBaseUrl() + "/css/payment.css";
        document.head.appendChild(link);
      }
      
      return this;
    },
    
    // Get base URL
    getBaseUrl: function () {
      // In production, this should be your ZenoPay domain
      return window.location.origin;
    },
    
    // Open payment modal
    openPayment: function (paymentConfig) {
      if (paymentConfig) {
        this.config = { ...this.config, ...paymentConfig };
      }
      
      // Validate required fields
      if (!this.config.apiKey) {
        console.error("ZenoPay: API Key is required");
        return;
      }
      
      if (!this.config.amount || !this.config.orderId) {
        console.error("ZenoPay: Amount and Order ID are required");
        return;
      }
      
      openPaymentModal(this.config);
    },
  };

  // Expose ZenoPay to window
  window.ZenoPay = ZenoPay;

  // Internal function to open modal
  function openPaymentModal(config) {
    // Create modal backdrop
    const backdrop = document.createElement("div");
    backdrop.id = "paymentBackdrop";
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    // Create modal container
    const modalContainer = document.createElement("div");
    modalContainer.id = "paymentModal";
    modalContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      width: 900px;
      max-width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    
    // Add fixed height styling to form content
    if (!document.getElementById("zenopay-modal-styles")) {
      const style = document.createElement("style");
      style.id = "zenopay-modal-styles";
      style.textContent = `
        #paymentModal .form-content {
          min-height: 450px;
          display: flex;
          flex-direction: column;
        }
        #paymentModal .payment-form {
          min-height: 300px;
        }
        #paymentModal .order-info {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        #paymentModal .order-info h4 {
          margin: 0 0 10px 0;
          color: #2c4a5e;
        }
        #paymentModal .order-info p {
          margin: 5px 0;
          color: #666;
        }
      `;
      document.head.appendChild(style);
    }

    // Create payment card HTML
    modalContainer.innerHTML = `
      <div class="container">
        <div class="payment-card">
          <button id="closePaymentModal" style="position: absolute; top: 10px; right: 10px; background: #f44336; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; z-index: 10000;">×</button>
          <div class="main-content">
            <div class="sidebar">
              <div class="order-info">
                <h4>Order Details</h4>
                <p><strong>Order ID:</strong> ${config.orderId || "N/A"}</p>
                <p><strong>Merchant:</strong> ${config.merchantName || "Merchant"}</p>
                <p><strong>Amount:</strong> ₹${config.amount || 0}</p>
                <p><strong>Description:</strong> ${config.description || "Payment"}</p>
              </div>
              <div class="logo-container">
                <svg
                  width="50"
                  height="50"
                  viewBox="0 0 50 50"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="25" cy="25" r="23" fill="#d4c4b8" opacity="0.9" />
                  <path
                    d="M18 25 L23 30 L32 20"
                    stroke="#2c4a5e"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
              <h3 class="sidebar-title">Payment Methods</h3>
              <div class="payment-methods">
                <button class="method-btn active" data-method="card">
                  <span class="icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </span>
                  <span class="text">Debit Card</span>
                </button>
                <button class="method-btn" data-method="upi">
                  <span class="icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="5" y="2" width="14" height="20" rx="2" />
                      <line x1="9" y1="18" x2="15" y2="18" />
                    </svg>
                  </span>
                  <span class="text">UPI ID</span>
                </button>
                <button class="method-btn" data-method="mobile">
                  <span class="icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                      />
                    </svg>
                  </span>
                  <span class="text">Mobile Number</span>
                </button>
                <button class="method-btn" data-method="gmail">
                  <span class="icon">
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                      />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <span class="text">Gmail</span>
                </button>
              </div>
            </div>

            <div class="form-content">
              <h2>Payment Details</h2>

              <form id="paymentForm">
                <!-- Debit Card Form -->
                <div id="cardForm" class="payment-form active">
                  <div class="input-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      maxlength="19"
                    />
                  </div>
                  <div class="input-row">
                    <div class="input-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        id="expiryDate"
                        placeholder="MM/YY"
                        maxlength="5"
                      />
                    </div>
                    <div class="input-group">
                      <label>CVV</label>
                      <input
                        type="password"
                        id="cvv"
                        placeholder="123"
                        maxlength="3"
                      />
                    </div>
                  </div>
                  <div class="input-group">
                    <label>Cardholder Name</label>
                    <input type="text" id="cardName" placeholder="John Doe" />
                  </div>
                </div>

                <!-- UPI Form -->
                <div id="upiForm" class="payment-form">
                  <div class="input-group">
                    <label>UPI ID / ZenoPay ID</label>
                    <input type="text" id="upiId" placeholder="yourname@upi or ZenoPay ID" />
                  </div>
                </div>

                <!-- Mobile Form -->
                <div id="mobileForm" class="payment-form">
                  <div class="input-group">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      id="mobile"
                      placeholder="+91 1234567890"
                      maxlength="15"
                    />
                  </div>
                </div>

                <!-- Gmail Form -->
                <div id="gmailForm" class="payment-form">
                  <div class="input-group">
                    <label>Gmail Address</label>
                    <input
                      type="email"
                      id="gmail"
                      placeholder="yourname@gmail.com"
                    />
                  </div>
                </div>

                <button type="submit" class="submit-btn" id="sendOtpBtn">
                  Send OTP
                </button>
              </form>

              <!-- OTP Verification Section -->
              <div id="otpSection" class="otp-section hidden">
                <h3>Enter OTP</h3>
                <div class="input-group">
                  <input
                    type="text"
                    id="otpInput"
                    placeholder="Enter 6-digit OTP"
                    maxlength="6"
                  />
                </div>
                <button class="submit-btn" id="verifyOtpBtn">Verify OTP</button>
              </div>

              <!-- Success/Failed Message -->
              <div id="resultMessage" class="result-message hidden">
                <div class="result-icon" id="resultIcon"></div>
                <h3 id="resultTitle"></h3>
                <p id="resultText"></p>
                <button class="submit-btn" id="tryAgainBtn">Try Again</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append to body
    document.body.appendChild(backdrop);
    document.body.appendChild(modalContainer);

    // Initialize payment functionality
    initializePaymentFunctionality(config);

    // Close modal functionality
    const closeBtn = document.getElementById("closePaymentModal");
    const closeModal = () => {
      backdrop.remove();
      modalContainer.remove();
    };

    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);
  }

  function initializePaymentFunctionality(config) {
    let currentMethod = "card";
    let zenoPayId = null;

    // Payment method switching
    const methodBtns = document.querySelectorAll(".method-btn");
    const paymentForms = document.querySelectorAll(".payment-form");

    methodBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        methodBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        paymentForms.forEach((form) => form.classList.remove("active"));
        const method = btn.dataset.method;
        currentMethod = method;
        document.getElementById(`${method}Form`).classList.add("active");
      });
    });

    // Form submission - Send OTP
    document.getElementById("paymentForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const submitBtn = document.getElementById("sendOtpBtn");
        submitBtn.disabled = true;
        submitBtn.textContent = "Verifying...";

        // Get payment details based on method
        let paymentData = {};
        
        if (currentMethod === "card") {
          paymentData = {
            cardNumber: document.getElementById("cardNumber").value,
            expiryDate: document.getElementById("expiryDate").value,
            cvv: document.getElementById("cvv").value,
            cardName: document.getElementById("cardName").value,
          };
        } else if (currentMethod === "upi") {
          zenoPayId = document.getElementById("upiId").value;
        } else if (currentMethod === "mobile") {
          paymentData.mobile = document.getElementById("mobile").value;
        } else if (currentMethod === "gmail") {
          paymentData.email = document.getElementById("gmail").value;
        }

        // For UPI (ZenoPay ID), verify customer first
        if (currentMethod === "upi") {
          const verifyResponse = await fetch("/api/payment/verify-customer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ zenoPayId }),
          });

          const verifyResult = await verifyResponse.json();

          if (!verifyResult.success) {
            alert(verifyResult.error || "Invalid ZenoPay ID");
            submitBtn.disabled = false;
            submitBtn.textContent = "Send OTP";
            return;
          }

          // Check if customer has sufficient balance
          if (verifyResult.data.balance < config.amount) {
            alert("Insufficient balance in your ZenoPay account");
            submitBtn.disabled = false;
            submitBtn.textContent = "Send OTP";
            return;
          }
        }

        // Send OTP
        const otpResponse = await fetch("/api/payment/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zenoPayId,
            mobile: paymentData.mobile,
            email: paymentData.email,
          }),
        });

        const otpResult = await otpResponse.json();

        if (!otpResult.success) {
          alert(otpResult.error || "Failed to send OTP");
          submitBtn.disabled = false;
          submitBtn.textContent = "Send OTP";
          return;
        }

        // Show demo OTP for testing
        if (otpResult.demo_otp) {
          alert(`Demo OTP: ${otpResult.demo_otp}`);
        }

        // Hide form, show OTP section
        document.getElementById("paymentForm").classList.add("hidden");
        document.getElementById("otpSection").classList.remove("hidden");
        document.querySelector(".form-content h2").textContent = "Verify Payment";
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
        const submitBtn = document.getElementById("sendOtpBtn");
        submitBtn.disabled = false;
        submitBtn.textContent = "Send OTP";
      }
    });

    // OTP Verification
    document.getElementById("verifyOtpBtn").addEventListener("click", async () => {
      const otp = document.getElementById("otpInput").value;

      if (!otp || otp.length !== 6) {
        alert("Please enter a valid 6-digit OTP");
        return;
      }

      const verifyBtn = document.getElementById("verifyOtpBtn");
      verifyBtn.disabled = true;
      verifyBtn.textContent = "Processing...";

      try {
        // Process payment
        const paymentResponse = await fetch("/api/payment/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionRef: `TXN_${Date.now()}`,
            paymentMethod: currentMethod,
            customerZenoPayId: zenoPayId || config.customerEmail,
            amount: config.amount,
            orderId: config.orderId,
            description: config.description,
            merchantId: config.merchantId,
            otp: otp,
            paymentDetails: {},
          }),
        });

        const paymentResult = await paymentResponse.json();

        // Hide OTP section
        document.getElementById("otpSection").classList.add("hidden");

        // Show result
        showResult(paymentResult.success, paymentResult);

        // If success and callback URL exists, redirect
        if (paymentResult.success && config.callbackUrl) {
          setTimeout(() => {
            window.location.href = `${config.callbackUrl}?transactionId=${paymentResult.data.transactionId}&status=success&amount=${config.amount}`;
          }, 3000);
        }
      } catch (error) {
        console.error("Payment error:", error);
        document.getElementById("otpSection").classList.add("hidden");
        showResult(false);
        verifyBtn.disabled = false;
        verifyBtn.textContent = "Verify OTP";
      }
    });

    // Show success or failed result
    function showResult(success, paymentResult = {}) {
      const resultMessage = document.getElementById("resultMessage");
      const resultIcon = document.getElementById("resultIcon");
      const resultTitle = document.getElementById("resultTitle");
      const resultText = document.getElementById("resultText");

      resultMessage.classList.remove("hidden");

      if (success) {
        resultMessage.className = "result-message success";
        resultIcon.innerHTML = "✓";
        resultTitle.textContent = "Payment Successful!";
        resultText.textContent = paymentResult.data 
          ? `Transaction ID: ${paymentResult.data.transactionId}. Amount: ₹${paymentResult.data.amount}`
          : "Your payment has been processed successfully.";
      } else {
        resultMessage.className = "result-message failed";
        resultIcon.innerHTML = "✗";
        resultTitle.textContent = "Payment Failed!";
        resultText.textContent = paymentResult.error || "Unable to process your payment. Please try again.";
      }
    }

    // Try Again button
    document.getElementById("tryAgainBtn").addEventListener("click", () => {
      document.getElementById("resultMessage").classList.add("hidden");
      document.getElementById("paymentForm").classList.remove("hidden");
      document.getElementById("paymentForm").reset();
      document.getElementById("otpInput").value = "";
      document.querySelector(".form-content h2").textContent = "Payment Details";
    });

    // Card number formatting
    const cardNumberInput = document.getElementById("cardNumber");
    if (cardNumberInput) {
      cardNumberInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\s/g, "");
        let formattedValue = value.match(/.{1,4}/g)?.join(" ") || value;
        e.target.value = formattedValue;
      });
    }

    // Expiry date formatting
    const expiryDateInput = document.getElementById("expiryDate");
    if (expiryDateInput) {
      expiryDateInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length >= 2) {
          value = value.slice(0, 2) + "/" + value.slice(2, 4);
        }
        e.target.value = value;
      });
    }
  }

  // Export for both browser and module usage
  if (typeof module !== "undefined" && module.exports) {
    module.exports = window.ZenoPay;
  }

})(window);
