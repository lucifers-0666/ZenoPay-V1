(function(window, document) {
  'use strict';

  class APIService {
    constructor(baseUrl) {
      this.baseUrl = baseUrl || window.location.origin;
    }

    async sendOTP(data) {
      const response = await fetch(`${this.baseUrl}/api/payment/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    }

    async verifyCustomer(data) {
      const response = await fetch(`${this.baseUrl}/api/payment/verify-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return response.json();
    }

    async processPayment(data, apiKey) {
      const response = await fetch(`${this.baseUrl}/api/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(data)
      });
      return response.json();
    }
  }

  class ModalLoader {
    constructor() {
      this.styleId = 'zenopay-modal-loader-styles';
      this.injectStyles();
    }

    injectStyles() {
      if (document.getElementById(this.styleId)) return;

      const style = document.createElement('style');
      style.id = this.styleId;
      style.textContent = `
        .zenopay-modal-loader {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          border-radius: 12px;
        }
        .zenopay-modal-loader-content {
          text-align: center;
        }
        .zenopay-modal-loader-logo {
          width: 80px;
          height: 80px;
          animation: zenoLogoPulse 2s ease-in-out infinite;
          margin-bottom: 20px;
        }
        @keyframes zenoLogoPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        .zenopay-modal-loader-spinner {
          width: 50px;
          height: 50px;
          margin: 0 auto 15px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #456882;
          border-radius: 50%;
          animation: zenoSpin 1s linear infinite;
        }
        @keyframes zenoSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .zenopay-modal-loader-text {
          color: #2c3e50;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
      `;
      document.head.appendChild(style);
    }

    create(modalElement) {
      const loaderHTML = `
        <div class="zenopay-modal-loader" style="display: none;">
          <div class="zenopay-modal-loader-content">
            <img src="${window.location.origin}/Images/bgFavicon.png" alt="ZenoPay" class="zenopay-modal-loader-logo">
            <div class="zenopay-modal-loader-spinner"></div>
            <p class="zenopay-modal-loader-text">Processing...</p>
          </div>
        </div>
      `;
      
      const loaderDiv = document.createElement('div');
      loaderDiv.innerHTML = loaderHTML;
      modalElement.appendChild(loaderDiv.firstElementChild);
    }

    show(modalElement, text) {
      const loader = modalElement.querySelector('.zenopay-modal-loader');
      if (loader) {
        const textEl = loader.querySelector('.zenopay-modal-loader-text');
        if (textEl && text) textEl.textContent = text;
        loader.style.display = 'flex';
      }
    }

    hide(modalElement) {
      const loader = modalElement.querySelector('.zenopay-modal-loader');
      if (loader) loader.style.display = 'none';
    }
  }

  class PaymentModal {
    constructor(options) {
      this.options = options;
      this.backdrop = null;
      this.modal = null;
      this.loader = new ModalLoader();
    }

    getModalHTML() {
      const amount = (this.options.amount / 100).toFixed(2);
      const color = this.options.theme.color;

      return `
        <div class="container">
          <div class="payment-card">
            <button id="zenoPayClose" style="position: absolute; top: 10px; right: 10px; background: #f44336; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; z-index: 10000;">&times;</button>
            
            <div class="main-content">
              <div class="sidebar" id="zenoSidebar">
                <div class="logo-container" style="display: flex; justify-content: center; margin-bottom: 20px;">
                  <img src="${window.location.origin}/Images/bgFavicon.png" alt="ZenoPay" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                </div>
                
                <h3 class="sidebar-title">Payment Methods</h3>
                <div class="payment-methods">
                  <button class="method-btn active" data-method="card">
                    <span class="icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </span>
                  <span class="text">Debit Card</span>
                  </button>
                  <button class="method-btn" data-method="upi">
                    <span class="icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" />
                        <line x1="9" y1="18" x2="15" y2="18" />
                      </svg>
                    </span>
                    <span class="text">ZenoPay ID</span>
                  </button>
                  <button class="method-btn" data-method="mobile">
                    <span class="icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <span class="text">Mobile Number</span>
                  </button>
                  <button class="method-btn" data-method="email">
                    <span class="icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <span class="text">Email</span>
                  </button>
                </div>
              </div>

              <div class="form-content">
                <h2>Payment Details</h2>

                <div id="zenoStepIdentifier">
                  <form id="zenoIdentifierForm">
                    <div id="cardFormZeno" class="payment-form active">
                      <div class="input-group">
                        <label>Card Number</label>
                        <input type="text" id="zenoCardNumber" placeholder="1234 5678 9012 3456" maxlength="19" />
                      </div>
                      <div class="input-group">
                        <label>Name on Card</label>
                        <input type="text" id="zenoNameOnCard" placeholder="Enter name on card" />
                      </div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                        <div class="input-group">
                          <label>Expiry (MM/YY)</label>
                          <input type="text" id="zenoCardExpiry" placeholder="MM/YY" maxlength="5" />
                        </div>
                        <div class="input-group">
                          <label>CVV</label>
                          <input type="password" id="zenoCardCVV" placeholder="CVV" maxlength="3" />
                        </div>
                        <div class="input-group">
                          <label>Card PIN</label>
                          <input type="password" id="zenoCardPIN" placeholder="4-digit PIN" maxlength="4" />
                        </div>
                      </div>
                    </div>

                    <div id="upiFormZeno" class="payment-form">
                      <div class="input-group">
                        <label>ZenoPay ID</label>
                        <input type="text" id="zenoUpiId" placeholder="Enter your ZenoPay ID" />
                      </div>
                    </div>

                    <div id="mobileFormZeno" class="payment-form">
                      <div class="input-group">
                        <label>Mobile Number</label>
                        <input type="tel" id="zenoMobile" placeholder="Enter mobile number" maxlength="10" />
                      </div>
                    </div>

                    <div id="emailFormZeno" class="payment-form">
                      <div class="input-group">
                        <label>Email Address</label>
                        <input type="email" id="zenoEmail" placeholder="Enter email address" />
                      </div>
                    </div>

                    <button type="button" class="submit-btn" id="zenoVerifyUserBtn" style="background: ${color};">
                      Verify
                    </button>
                    
                    <div id="zenoIdentifierError" style="display: none; background: #fff3f3; border: 1px solid #ffcdd2; border-radius: 6px; padding: 10px 12px; margin-top: 12px;">
                      <div style="display: flex; align-items: start; gap: 8px;">
                        <span style="color: #f44336; font-size: 16px;">⚠</span>
                        <div style="flex: 1;">
                          <div id="zenoIdentifierErrorMessage" style="color: #d32f2f; font-size: 13px;"></div>
                        </div>
                        <button id="zenoIdentifierErrorClose" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 0;">&times;</button>
                      </div>
                    </div>
                  </form>
                </div>

                <div id="zenoStepOTP" class="hidden">
                  <h3>Verify Payment</h3>
                  <p style="color: #666; margin-bottom: 15px;">Enter OTP sent to your registered contact</p>
                  <div class="input-group">
                    <input type="text" id="zenoOtpInput" placeholder="Enter 6-digit OTP" maxlength="6" />
                  </div>
                  <button class="submit-btn" id="zenoVerifyOtpBtn" style="background: ${color};">
                    Verify & Continue
                  </button>
                  
                  <div id="zenoOtpError" style="display: none; background: #fff3f3; border: 1px solid #ffcdd2; border-radius: 6px; padding: 10px 12px; margin-top: 12px;">
                    <div style="display: flex; align-items: start; gap: 8px;">
                      <span style="color: #f44336; font-size: 16px;">⚠</span>
                      <div style="flex: 1;">
                        <div id="zenoOtpErrorMessage" style="color: #d32f2f; font-size: 13px;"></div>
                      </div>
                      <button id="zenoOtpErrorClose" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 0;">&times;</button>
                    </div>
                  </div>
                </div>

                <div id="zenoStepUserInfo" class="hidden">
                  <div id="zenoUserProfile" style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                      <img id="zenoUserImage" src="" alt="Profile" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 3px solid #ead8c0;" onerror="this.src='/Images/bgFavicon.png'">
                      <div>
                        <h3 id="zenoUserName" style="margin: 0 0 5px 0; color: #2c3e50;"></h3>
                        <p id="zenoUserZenoId" style="margin: 0; color: #666; font-size: 14px;"></p>
                      </div>
                    </div>
                  </div>

                  <div class="input-group">
                    <label>Select Bank Account</label>
                    <select id="zenoBankAccountSelect" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                      <option value="">Select a bank account</option>
                    </select>
                  </div>

                  <button type="button" class="submit-btn" id="zenoNextBtn" style="background: ${color}; margin-top: 15px;">
                    Next
                  </button>
                  
                  <div id="zenoUserInfoError" style="display: none; background: #fff3f3; border: 1px solid #ffcdd2; border-radius: 6px; padding: 10px 12px; margin-top: 12px;">
                    <div style="display: flex; align-items: start; gap: 8px;">
                      <span style="color: #f44336; font-size: 16px;">⚠</span>
                      <div style="flex: 1;">
                        <div id="zenoUserInfoErrorMessage" style="color: #d32f2f; font-size: 13px;"></div>
                      </div>
                      <button id="zenoUserInfoErrorClose" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 0;">&times;</button>
                    </div>
                  </div>
                </div>

                <div id="zenoStepConfirmation" class="hidden">
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #2c3e50;">Payment Confirmation</h3>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px;">
                      <span style="color: #666;">Merchant:</span>
                      <strong id="zenoConfirmMerchant">${this.options.name}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px;">
                      <span style="color: #666;">Product:</span>
                      <strong id="zenoConfirmProduct">${this.options.description || 'Payment'}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px;">
                      <span style="color: #666;">Amount:</span>
                      <strong style="color: #27ae60; font-size: 18px;">₹${amount}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px;">
                      <span style="color: #666;">From Account:</span>
                      <strong id="zenoConfirmAccount"></strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 14px;">
                      <span style="color: #666;">Balance:</span>
                      <strong id="zenoConfirmBalance" style="color: #2c3e50;"></strong>
                    </div>
                  </div>

                  <button type="button" class="submit-btn" id="zenoConfirmBtn" style="background: ${color};">
                    Proceed to Payment
                  </button>
                  
                  <div id="zenoConfirmError" style="display: none; background: #fff3f3; border: 1px solid #ffcdd2; border-radius: 6px; padding: 10px 12px; margin-top: 12px;">
                    <div style="display: flex; align-items: start; gap: 8px;">
                      <span style="color: #f44336; font-size: 16px;">⚠</span>
                      <div style="flex: 1;">
                        <div id="zenoConfirmErrorMessage" style="color: #d32f2f; font-size: 13px;"></div>
                      </div>
                      <button id="zenoConfirmErrorClose" style="background: none; border: none; color: #f44336; cursor: pointer; font-size: 16px; padding: 0;">&times;</button>
                    </div>
                  </div>
                </div>

                <div id="zenoStepResult" class="hidden">
                  <div style="text-align: center; padding: 30px 0;">
                    <div id="zenoResultIcon" style="width: 80px; height: 80px; margin: 0 auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px;"></div>
                    <h3 id="zenoResultTitle"></h3>
                    <p id="zenoResultText" style="color: #666; margin: 10px 0;"></p>
                    <button class="submit-btn" id="zenoDoneBtn" style="background: ${color}; display: none;">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    open() {
      this.backdrop = document.createElement('div');
      this.backdrop.id = 'zenoPayBackdrop';
      this.backdrop.style.cssText = `
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

      this.modal = document.createElement('div');
      this.modal.id = 'zenoPayModal';
      this.modal.style.cssText = `
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

      this.modal.innerHTML = this.getModalHTML();

      document.body.appendChild(this.backdrop);
      document.body.appendChild(this.modal);

      this.loader.create(this.modal);

      return this.modal;
    }

    close() {
      if (this.backdrop) this.backdrop.remove();
      if (this.modal) this.modal.remove();
      if (this.options.modal.ondismiss) this.options.modal.ondismiss();
    }

    showLoader(text) {
      this.loader.show(this.modal, text);
    }

    hideLoader() {
      this.loader.hide(this.modal);
    }
  }

  class PaymentFlow {
    constructor(modal, options, apiKey) {
      this.modal = modal;
      this.options = options;
      this.apiKey = apiKey;
      this.api = new APIService();
      
      this.currentMethod = 'card';
      this.customerData = null;
      this.selectedBankAccount = null;
      this.userBankAccounts = [];
      this.verifiedOtp = null;
      this.userIdentifier = null;
    }

    initialize() {
      this.setupPaymentMethods();
      this.setupCardFormatting();
      this.setupErrorHandlers();
      this.setupStepHandlers();
    }

    setupPaymentMethods() {
      const methodBtns = this.modal.modal.querySelectorAll('.method-btn');
      const paymentForms = this.modal.modal.querySelectorAll('.payment-form');

      methodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          methodBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          paymentForms.forEach(form => form.classList.remove('active'));
          this.currentMethod = btn.dataset.method;
          
          const targetForm = document.getElementById(this.currentMethod + 'FormZeno');
          if (targetForm) targetForm.classList.add('active');
        });
      });
    }

    setupCardFormatting() {
      const cardInput = document.getElementById('zenoCardNumber');
      const expiryInput = document.getElementById('zenoCardExpiry');
      
      if (cardInput) {
        cardInput.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\s/g, '');
          e.target.value = value.match(/.{1,4}/g)?.join(' ') || value;
        });
      }

      if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
          }
          e.target.value = value;
        });
      }
    }

    setupErrorHandlers() {
      const errorIds = ['zenoIdentifierErrorClose', 'zenoOtpErrorClose', 'zenoUserInfoErrorClose', 'zenoConfirmErrorClose'];
      errorIds.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => this.hideAllErrors());
      });
    }

    setupStepHandlers() {
      document.getElementById('zenoVerifyUserBtn').addEventListener('click', () => this.handleSendOTP());
      document.getElementById('zenoVerifyOtpBtn').addEventListener('click', () => this.handleVerifyOTP());
      document.getElementById('zenoNextBtn').addEventListener('click', () => this.handleBankSelection());
      document.getElementById('zenoConfirmBtn').addEventListener('click', () => this.handlePayment());
    }

    showError(errorDivId, message, registrationUrl = null) {
      this.hideAllErrors();
      const errorDiv = document.getElementById(errorDivId);
      if (!errorDiv) return;
      
      const errorMessage = errorDiv.querySelector('[id$="ErrorMessage"]');
      if (registrationUrl) {
        errorMessage.innerHTML = `${message} <a href="${registrationUrl}" style="color: #d32f2f; text-decoration: underline; font-weight: 600;" target="_blank">Click here to register</a>`;
      } else {
        errorMessage.textContent = message;
      }
      errorDiv.style.display = 'block';
    }

    hideAllErrors() {
      ['zenoIdentifierError', 'zenoOtpError', 'zenoUserInfoError', 'zenoConfirmError'].forEach(id => {
        const errorDiv = document.getElementById(id);
        if (errorDiv) errorDiv.style.display = 'none';
      });
    }

    getUserIdentifier() {
      const inputs = {
        card: document.getElementById('zenoCardNumber'),
        upi: document.getElementById('zenoUpiId'),
        mobile: document.getElementById('zenoMobile'),
        email: document.getElementById('zenoEmail')
      };

      const input = inputs[this.currentMethod];
      if (!input || !input.value.trim()) {
        throw new Error('Please enter a valid identifier');
      }

      return input.value.trim().replace(/\s/g, '');
    }

    async handleSendOTP() {
      const btn = document.getElementById('zenoVerifyUserBtn');
      btn.disabled = true;
      const originalText = btn.textContent;
      btn.textContent = this.currentMethod === 'card' ? 'Verifying Card...' : 'Sending OTP...';

      try {
        this.userIdentifier = this.getUserIdentifier();

        if (this.currentMethod === 'card') {
          const nameOnCard = document.getElementById('zenoNameOnCard').value.trim();
          const cardExpiry = document.getElementById('zenoCardExpiry').value.trim();
          const cvv = document.getElementById('zenoCardCVV').value.trim();
          const pin = document.getElementById('zenoCardPIN').value.trim();

          if (!nameOnCard || !cardExpiry || !cvv || !pin) {
            this.showError('zenoIdentifierError', 'Please fill all card details');
            btn.disabled = false;
            btn.textContent = originalText;
            return;
          }

          this.modal.showLoader('Verifying card details...');
          
          const verifyResult = await this.api.verifyCustomer({
            cardNumber: this.userIdentifier,
            cvv: cvv,
            cardPin: pin,
            nameOnCard: nameOnCard,
            cardExpiry: cardExpiry
          });

          this.modal.hideLoader();

          if (!verifyResult.success) {
            this.showError('zenoIdentifierError', verifyResult.error);
            btn.disabled = false;
            btn.textContent = originalText;
            return;
          }

          this.customerData = verifyResult.data;
          this.verifiedOtp = 'CARD_VERIFIED';
          
          document.getElementById('zenoStepIdentifier').classList.add('hidden');
          
          if (verifyResult.data.isCardPayment) {
            this.showCardPaymentConfirmation(verifyResult.data);
          }
          
          return;
        }

        const payload = {
          zenoPayId: this.currentMethod === 'upi' ? this.userIdentifier : null,
          mobile: this.currentMethod === 'mobile' ? this.userIdentifier : null,
          email: this.currentMethod === 'email' ? this.userIdentifier : null,
        };

        this.modal.showLoader('Sending OTP...');
        const result = await this.api.sendOTP(payload);
        this.modal.hideLoader();

        if (!result.success) {
          const registrationUrl = result.message.includes('not registered') ? '/ZenoPay/Register' : null;
          this.showError('zenoIdentifierError', result.message, registrationUrl);
          btn.disabled = false;
          btn.textContent = originalText;
          return;
        }

        document.getElementById('zenoStepIdentifier').classList.add('hidden');
        document.getElementById('zenoStepOTP').classList.remove('hidden');

      } catch (error) {
        this.modal.hideLoader();
        this.showError('zenoIdentifierError', error.message || 'Failed to verify');
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }

    showCardPaymentConfirmation(data) {
      document.getElementById('zenoStepConfirmation').classList.remove('hidden');
      
      document.getElementById('zenoConfirmAccount').textContent = `${data.bankAccount.bankName} - ****${data.bankAccount.accountNumber.slice(-4)}`;
      document.getElementById('zenoConfirmBalance').textContent = `₹${data.bankAccount.balance.toFixed(2)}`;
    }

    async handleVerifyOTP() {
      const otp = document.getElementById('zenoOtpInput').value;

      if (!otp || otp.length !== 6) {
        this.showError('zenoOtpError', 'Please enter a valid 6-digit OTP');
        return;
      }

      const btn = document.getElementById('zenoVerifyOtpBtn');
      btn.disabled = true;
      btn.textContent = 'Verifying...';

      try {
        const payload = {
          zenoPayId: this.currentMethod === 'upi' ? this.userIdentifier : null,
          mobile: this.currentMethod === 'mobile' ? this.userIdentifier : null,
          email: this.currentMethod === 'email' ? this.userIdentifier : null,
          cardNumber: this.currentMethod === 'card' ? this.userIdentifier : null,
          otp: otp
        };

        this.modal.showLoader('Verifying OTP...');
        const result = await this.api.verifyCustomer(payload);
        this.modal.hideLoader();

        if (!result.success) {
          this.showError('zenoOtpError', result.message);
          btn.disabled = false;
          btn.textContent = 'Verify & Continue';
          return;
        }

        this.customerData = result.data;
        this.userBankAccounts = result.data.bankAccounts || [];
        this.verifiedOtp = otp;

        if (this.userBankAccounts.length === 0) {
          this.showError('zenoOtpError', 'No bank accounts found. Please add a bank account first.', '/BankAccount/Open');
          btn.disabled = false;
          btn.textContent = 'Verify & Continue';
          return;
        }

        this.showUserInfo();

      } catch (error) {
        this.modal.hideLoader();
        this.showError('zenoOtpError', 'Verification failed. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Verify & Continue';
      }
    }

    showUserInfo() {
      document.getElementById('zenoStepOTP').classList.add('hidden');
      
      if (this.customerData.isCardPayment) {
        this.showCardPaymentConfirmation(this.customerData);
        return;
      }

      document.getElementById('zenoStepUserInfo').classList.remove('hidden');

      document.getElementById('zenoUserName').textContent = this.customerData.name;
      document.getElementById('zenoUserZenoId').textContent = `ZenoPay ID: ${this.customerData.zenoPayId}`;
      document.getElementById('zenoUserImage').src = this.customerData.profileImage || '/Images/bgFavicon.png';

      const bankSelect = document.getElementById('zenoBankAccountSelect');
      bankSelect.innerHTML = '<option value="">Select a bank account</option>';
      
      this.userBankAccounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.accountNumber;
        option.textContent = `${acc.bankName} - ${acc.accountNumber} (Balance: ₹${acc.balance.toFixed(2)})`;
        option.dataset.balance = acc.balance;
        bankSelect.appendChild(option);
      });

      if (this.userBankAccounts.length === 1) {
        bankSelect.value = this.userBankAccounts[0].accountNumber;
      }
    }

    handleBankSelection() {
      const bankSelect = document.getElementById('zenoBankAccountSelect');
      this.selectedBankAccount = bankSelect.value;

      if (!this.selectedBankAccount) {
        this.showError('zenoUserInfoError', 'Please select a bank account');
        return;
      }

      const selectedOption = bankSelect.options[bankSelect.selectedIndex];
      const balance = parseFloat(selectedOption.dataset.balance);
      const bankText = selectedOption.text;

      document.getElementById('zenoStepUserInfo').classList.add('hidden');
      document.getElementById('zenoStepConfirmation').classList.remove('hidden');

      document.getElementById('zenoConfirmAccount').textContent = bankText.split('(Balance')[0].trim();
      document.getElementById('zenoConfirmBalance').textContent = `₹${balance.toFixed(2)}`;
    }

    async handlePayment() {
      const btn = document.getElementById('zenoConfirmBtn');
      btn.disabled = true;
      btn.textContent = 'Processing...';

      try {
        document.getElementById('zenoStepConfirmation').classList.add('hidden');
        this.modal.showLoader('Processing payment...');

        const accountNumber = this.customerData.isCardPayment 
          ? this.customerData.bankAccount.accountNumber 
          : this.selectedBankAccount;

        const payload = {
          transactionRef: `TXN_${Date.now()}`,
          paymentMethod: this.currentMethod,
          customerZenoPayId: this.customerData.zenoPayId,
          amount: this.options.amount / 100,
          orderId: this.options.order_id,
          description: this.options.description,
          otp: this.verifiedOtp,
          paymentDetails: {
            accountNumber: accountNumber
          }
        };

        const result = await this.api.processPayment(payload, this.apiKey);
        this.modal.hideLoader();

        if (result.success) {
          this.showSuccess(result);
        } else {
          // Pass error message and transaction ID if available
          const errorMsg = result.error || result.message || 'Payment failed';
          const transactionId = result.transactionId || null;
          this.showFailure(errorMsg, transactionId);
        }

      } catch (error) {
        this.modal.hideLoader();
        const errorMsg = error.message || 'Payment failed. Please try again.';
        this.showFailure(errorMsg);
        btn.disabled = false;
        btn.textContent = 'Proceed to Payment';
      }
    }

    showSuccess(result) {
      document.getElementById('zenoStepResult').classList.remove('hidden');
      
      const resultIcon = document.getElementById('zenoResultIcon');
      resultIcon.style.background = '#e8f5e9';
      resultIcon.style.border = '3px solid #4caf50';
      resultIcon.style.color = '#4caf50';
      resultIcon.innerHTML = '✓';

      // Extract transaction ID from the correct path in response
      const transactionId = result.data?.transactionId || result.transaction?.TransactionID;

      document.getElementById('zenoResultTitle').textContent = 'Payment Successful!';
      document.getElementById('zenoResultText').textContent = `Transaction ID: ${transactionId}`;

      const response = {
        razorpay_payment_id: transactionId,
        razorpay_order_id: this.options.order_id,
        razorpay_signature: this.generateSignature(this.options.order_id, transactionId),
        zenopay_payment_id: transactionId,
        zenopay_order_id: this.options.order_id,
        zenopay_signature: this.generateSignature(this.options.order_id, transactionId),
        zenopay_transaction_id: transactionId
      };

      setTimeout(() => {
        this.modal.close();
        if (this.options.handler) {
          this.options.handler(response);
        }
        if (this.options.callback_url) {
          window.location.href = this.options.callback_url + '?payment_id=' + transactionId;
        }
      }, 2000);
    }

    showFailure(message, transactionId = null) {
      document.getElementById('zenoStepConfirmation').classList.add('hidden');
      document.getElementById('zenoStepResult').classList.remove('hidden');

      const resultIcon = document.getElementById('zenoResultIcon');
      resultIcon.style.background = '#ffebee';
      resultIcon.style.border = '3px solid #f44336';
      resultIcon.style.color = '#f44336';
      resultIcon.innerHTML = '✕';

      document.getElementById('zenoResultTitle').textContent = 'Payment Failed';
      
      let resultText = message || 'Something went wrong';
      if (transactionId) {
        resultText += `\n\nTransaction ID: ${transactionId}`;
      }
      document.getElementById('zenoResultText').textContent = resultText;

      // Don't auto-close on failure - let user close manually
    }

    generateSignature(orderId, paymentId) {
      return btoa(`${orderId}|${paymentId}|${this.apiKey}`);
    }
  }

  class ZenoPay {
    constructor(options) {
      if (!options || !options.key) {
        throw new Error('ZenoPay: API key is required');
      }

      this.key = options.key;
      this.baseUrl = options.baseUrl || window.location.origin;
      this.merchantLogo = options.logo || null;
      this.merchantName = options.name || 'Merchant';
      this.options = null;
      
      this.loadStyles();
    }

    loadStyles() {
      if (document.getElementById('zenopay-checkout-styles')) return;

      const link = document.createElement('link');
      link.id = 'zenopay-checkout-styles';
      link.rel = 'stylesheet';
      link.href = this.baseUrl + '/css/payment.css';
      document.head.appendChild(link);
    }

    createPayment(options) {
      const required = ['amount', 'currency', 'order_id'];
      for (const field of required) {
        if (!options[field]) {
          console.warn(`ZenoPay: ${field} is recommended for payment`);
        }
      }

      this.options = {
        key: this.key,
        amount: options.amount || 0,
        currency: options.currency || 'INR',
        name: options.name || this.merchantName,
        description: options.description || 'Payment',
        image: options.image || this.merchantLogo || '',
        order_id: options.order_id,
        handler: options.handler || function() {},
        prefill: options.prefill || {},
        notes: options.notes || {},
        theme: options.theme || { color: '#456882' },
        modal: options.modal || {},
        callback_url: options.callback_url,
        redirect: options.redirect || false
      };

      return this;
    }

    open() {
      if (!this.options) {
        throw new Error('ZenoPay: No options provided. Call createPayment() first.');
      }

      const paymentModal = new PaymentModal(this.options);
      const modal = paymentModal.open();

      const paymentFlow = new PaymentFlow(paymentModal, this.options, this.key);
      paymentFlow.initialize();

      const closeBtn = document.getElementById('zenoPayClose');
      const backdrop = document.getElementById('zenoPayBackdrop');
      
      if (closeBtn) closeBtn.addEventListener('click', () => paymentModal.close());
      if (backdrop) backdrop.addEventListener('click', () => paymentModal.close());
    }
  }

  window.ZenoPay = ZenoPay;
  
  if (!window.Razorpay) {
    window.Razorpay = ZenoPay;
  }

})(window, document);
