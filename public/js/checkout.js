/**
 * GovBank Payment Gateway SDK
 * A complete solution for Government Banking integration.
 */
class GovBank {
    constructor(credentials) {
        this.config = {
            key: credentials.key,
            secret: credentials.secret || null, // Optional on client-side
            baseUrl: '' // Relative path to your backend
        };
        this.state = {
            accounts: [],
            selectedAccount: null
        };
        
        // Initialize Styles immediately
        this._injectStyles();
    }

    // --- PUBLIC METHODS (Developer API) ---

    /**
     * Create an Order (Server-to-Server Simulation)
     * @param {number} amount - Amount in INR
     * @returns {Promise<Object>} Order details or error
     */
    async createOrder(amount) {
        if (!this.config.secret) {
            console.error("GovBank SDK: Secret Key required for Order Creation.");
            return { success: false, message: "Secret Key missing" };
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/gateway/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: this.config.key,
                    secret: this.config.secret,
                    amount: amount
                })
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Open the Payment Modal
     * @param {Object} options - Configuration for the checkout session
     */
    open(options) {
        if (!options.orderId) {
            console.error("GovBank SDK: Order ID is required.");
            if (options.onError) options.onError({ message: "Missing Order ID" });
            return;
        }

        this.session = options;
        this._createModal();
        this._bindEvents();
    }

    /**
     * Initiate a Refund (Merchant Operation)
     * @param {string} transactionId 
     * @param {string} reason 
     */
    async refund(transactionId, reason = "Customer Request") {
        if (!this.config.secret) {
            return { success: false, message: "Secret Key required for Refunds" };
        }
        try {
            const response = await fetch(`${this.config.baseUrl}/gateway/refund`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: this.config.key,
                    secret: this.config.secret,
                    transactionId: transactionId,
                    reason: reason
                })
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // --- PRIVATE METHODS (Internal Logic) ---

    _injectStyles() {
        if (document.getElementById('gb-styles')) return;
        const css = `
            .gb-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            .gb-overlay.active { opacity: 1; pointer-events: all; }
            .gb-card { background: white; width: 100%; max-width: 400px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; transform: translateY(20px); transition: transform 0.3s ease; }
            .gb-overlay.active .gb-card { transform: translateY(0); }
            
            .gb-header { background: #1e40af; padding: 20px; color: white; display: flex; justify-content: space-between; align-items: center; }
            .gb-logo { font-weight: 800; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
            .gb-amount { text-align: right; }
            .gb-amount-lbl { font-size: 10px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.5px; }
            .gb-amount-val { font-size: 18px; font-weight: 700; }

            .gb-body { padding: 24px; }
            .gb-step { display: none; animation: fadeIn 0.3s ease; }
            .gb-step.active { display: block; }
            
            .gb-label { display: block; font-size: 12px; font-weight: 600; color: #4b5563; margin-bottom: 6px; text-transform: uppercase; }
            .gb-input-wrapper { position: relative; margin-bottom: 16px; }
            .gb-input { width: 100%; padding: 12px 12px 12px 40px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; transition: all 0.2s; box-sizing: border-box; }
            .gb-input:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
            .gb-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; width: 18px; height: 18px; }

            .gb-btn { width: 100%; padding: 14px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; font-size: 14px; display: flex; justify-content: center; align-items: center; gap: 8px; }
            .gb-btn:hover { background: #1d4ed8; }
            .gb-btn:disabled { background: #9ca3af; cursor: not-allowed; }

            .gb-acc-list { max-height: 200px; overflow-y: auto; margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .gb-acc-item { padding: 12px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s; }
            .gb-acc-item:last-child { border-bottom: none; }
            .gb-acc-item:hover { background: #f9fafb; }
            .gb-acc-item.selected { background: #eff6ff; }
            .gb-acc-icon { width: 32px; height: 32px; background: #dbeafe; color: #1e40af; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; }
            
            .gb-loader { width: 16px; height: 16px; border: 2px solid #fff; border-bottom-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
            .gb-footer { background: #f8fafc; padding: 12px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; display: flex; justify-content: center; align-items: center; gap: 6px; }

            @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes spin { to { transform: rotate(360deg); } }
        `;
        const style = document.createElement('style');
        style.id = 'gb-styles';
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    _createModal() {
        if (document.getElementById('gb-modal-root')) document.getElementById('gb-modal-root').remove();

        const displayAmount = (this.session.amount || 0).toLocaleString('en-IN');

        const html = `
            <div class="gb-overlay active" id="gb-modal-root">
                <div class="gb-card">
                    <div class="gb-header">
                        <div class="gb-logo">
                            <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
                            GovBank
                        </div>
                        <div class="gb-amount">
                            <div class="gb-amount-lbl">Payable Amount</div>
                            <div class="gb-amount-val">₹${displayAmount}</div>
                        </div>
                    </div>

                    <div class="gb-body">
                        
                        <!-- VIEW 1: Aadhaar Input -->
                        <div id="gb-step-1" class="gb-step active">
                            <div style="margin-bottom: 20px;">
                                <h3 style="margin:0; font-size:16px; font-weight:700; color:#1f2937">Verify Identity</h3>
                                <p style="margin:4px 0 0; font-size:13px; color:#6b7280">Link your bank account via Aadhaar.</p>
                            </div>
                            <div class="gb-input-group">
                                <label class="gb-label">Aadhaar Number</label>
                                <div class="gb-input-wrapper">
                                    <svg class="gb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                                    <input type="text" id="gb-in-aadhaar" class="gb-input" placeholder="XXXX XXXX XXXX" maxlength="14">
                                </div>
                            </div>
                            <button id="gb-act-otp" class="gb-btn">Send OTP</button>
                        </div>

                        <!-- VIEW 2: OTP Input -->
                        <div id="gb-step-2" class="gb-step">
                            <div style="margin-bottom: 20px; text-align: center;">
                                <h3 style="margin:0; font-size:16px; font-weight:700; color:#1f2937">Enter OTP</h3>
                                <p style="margin:4px 0 0; font-size:13px; color:#6b7280">Sent to your registered email/mobile.</p>
                            </div>
                            <div class="gb-input-group">
                                <div class="gb-input-wrapper">
                                    <input type="text" id="gb-in-otp" class="gb-input" placeholder="• • • • • •" maxlength="6" style="text-align:center; font-size:24px; letter-spacing:8px; padding-left:12px;">
                                </div>
                            </div>
                            <button id="gb-act-verify" class="gb-btn">Verify Identity</button>
                            <button id="gb-act-back" style="width:100%; margin-top:12px; background:none; border:none; color:#6b7280; font-size:12px; cursor:pointer;">Change Aadhaar Number</button>
                        </div>

                        <!-- VIEW 3: Account Selection -->
                        <div id="gb-step-3" class="gb-step">
                             <div style="margin-bottom: 16px;">
                                <h3 style="margin:0; font-size:16px; font-weight:700; color:#1f2937">Select Account</h3>
                            </div>
                            <div id="gb-list-accounts" class="gb-acc-list"></div>
                            
                            <div class="gb-input-group">
                                <label class="gb-label">Enter Bank PIN</label>
                                <div class="gb-input-wrapper">
                                    <svg class="gb-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    <input type="password" id="gb-in-pin" class="gb-input" placeholder="••••" maxlength="4" style="text-align:center; letter-spacing:4px;">
                                </div>
                            </div>
                            <button id="gb-act-pay" class="gb-btn">Secure Pay ₹${displayAmount}</button>
                        </div>

                        <!-- VIEW 4: Success -->
                        <div id="gb-step-4" class="gb-step" style="text-align:center; padding:20px 0;">
                            <div style="width:64px; height:64px; background:#dcfce7; color:#16a34a; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
                                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 style="font-size:20px; font-weight:800; color:#111827; margin-bottom:8px;">Payment Successful</h3>
                            <p style="font-size:13px; color:#6b7280; margin-bottom:4px;">Transaction Reference ID</p>
                            <div id="gb-lbl-txnid" style="font-family:monospace; background:#f3f4f6; padding:6px 12px; border-radius:6px; display:inline-block; font-weight:bold; color:#374151;"></div>
                            <button id="gb-act-close" class="gb-btn" style="margin-top:24px; background:#1f2937;">Close Window</button>
                        </div>

                    </div>

                    <div class="gb-footer">
                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        100% Secure Payment by GovBank
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        this._setupInputMasks();
    }

    _setupInputMasks() {
        const el = document.getElementById('gb-in-aadhaar');
        if (el) {
            el.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '').match(/.{1,4}/g);
                e.target.value = v ? v.join(' ') : '';
            });
        }
    }

    _showStep(id) {
        document.querySelectorAll('.gb-step').forEach(el => el.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    _close() {
        const el = document.getElementById('gb-modal-root');
        if (el) {
            el.classList.remove('active');
            setTimeout(() => el.remove(), 300);
        }
        if (this.session.onDismiss) this.session.onDismiss();
    }

    _bindEvents() {
        const self = this;
        
        // Close on Overlay Click
        const root = document.getElementById('gb-modal-root');
        root.addEventListener('click', (e) => {
            if (e.target === root) self._close();
        });

        // 1. Send OTP
        document.getElementById('gb-act-otp').onclick = async function() {
            const btn = this;
            const aadhar = document.getElementById('gb-in-aadhaar').value.replace(/\s/g, '');
            
            if (aadhar.length !== 12) {
                alert("Please enter a valid 12-digit Aadhaar Number");
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<div class="gb-loader"></div> Sending OTP...';

            try {
                const res = await fetch(`${self.config.baseUrl}/gateway/send-otp`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ aadharNumber: aadhar })
                });
                const data = await res.json();
                
                if (data.success) {
                    self._showStep('gb-step-2');
                } else {
                    alert(data.message || "Failed to send OTP");
                }
            } catch (e) {
                console.error(e);
                alert("Connection Error");
            }
            btn.disabled = false;
            btn.innerHTML = 'Send OTP';
        };

        // Back Button
        document.getElementById('gb-act-back').onclick = () => this._showStep('gb-step-1');

        // 2. Verify OTP
        document.getElementById('gb-act-verify').onclick = async function() {
            const btn = this;
            const otp = document.getElementById('gb-in-otp').value;
            const aadhar = document.getElementById('gb-in-aadhaar').value.replace(/\s/g, '');

            if (otp.length !== 6) return alert("Please enter 6-digit OTP");

            btn.disabled = true;
            btn.innerHTML = '<div class="gb-loader"></div> Verifying...';

            try {
                const res = await fetch(`${self.config.baseUrl}/gateway/verify-otp`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ otp, aadharNumber: aadhar })
                });
                const data = await res.json();

                if (data.success) {
                    // Render Accounts
                    const list = document.getElementById('gb-list-accounts');
                    list.innerHTML = '';
                    
                    if (data.accounts && data.accounts.length > 0) {
                        data.accounts.forEach((acc, i) => {
                            const item = document.createElement('div');
                            item.className = `gb-acc-item ${i === 0 ? 'selected' : ''}`;
                            item.onclick = function() {
                                document.querySelectorAll('.gb-acc-item').forEach(e => e.classList.remove('selected'));
                                this.classList.add('selected');
                                self.state.selectedAccount = acc.accountNumber;
                            };
                            item.innerHTML = `
                                <div class="gb-acc-icon">${acc.bankName.charAt(0)}</div>
                                <div>
                                    <div style="font-weight:700; font-size:13px; color:#1f2937">${acc.bankName}</div>
                                    <div style="font-size:11px; color:#6b7280; font-family:monospace">${acc.maskedNumber}</div>
                                </div>
                            `;
                            list.appendChild(item);
                            // Auto-select first
                            if (i === 0) self.state.selectedAccount = acc.accountNumber;
                        });
                        self._showStep('gb-step-3');
                    } else {
                        alert("No linked accounts found.");
                    }
                } else {
                    alert(data.message || "Verification Failed");
                }
            } catch (e) {
                console.error(e);
                alert("Connection Error");
            }
            btn.disabled = false;
            btn.innerHTML = 'Verify Identity';
        };

        // 3. Pay
        document.getElementById('gb-act-pay').onclick = async function() {
            const btn = this;
            const pin = document.getElementById('gb-in-pin').value;

            if (!self.state.selectedAccount) return alert("Please select an account");
            if (!pin || pin.length < 4) return alert("Please enter your 4-digit PIN");

            btn.disabled = true;
            btn.innerHTML = '<div class="gb-loader"></div> Processing Payment...';

            try {
                const res = await fetch(`${self.config.baseUrl}/pay/process`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        apiKey: self.config.key,
                        amount: self.session.amount,
                        orderId: self.session.orderId,
                        customerId: self.state.selectedAccount,
                        pin: pin
                    })
                });
                const data = await res.json();

                if (data.success) {
                    document.getElementById('gb-lbl-txnid').innerText = data.transactionId;
                    self._showStep('gb-step-4');
                    
                    if (self.session.onSuccess) {
                        self.session.onSuccess(data);
                    }
                } else {
                    alert("Payment Failed: " + data.message);
                    if (self.session.onError) self.session.onError(data);
                }
            } catch (e) {
                console.error(e);
                alert("Transaction Failed");
                if (self.session.onError) self.session.onError({ message: "Network Error" });
            }
            btn.disabled = false;
            btn.innerHTML = `Secure Pay ₹${(self.session.amount || 0).toLocaleString('en-IN')}`;
        };

        // 4. Close Success
        document.getElementById('gb-act-close').onclick = () => self._close();
    }
}