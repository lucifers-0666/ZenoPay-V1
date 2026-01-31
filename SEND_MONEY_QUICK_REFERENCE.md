# 🎨 ZenoPay Send Money Page - Quick Reference

## 📸 Page Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Dashboard > Send Money                                   │
│                                                              │
│  ✈️  Send Money                    [Recent] [History]       │
│     Transfer funds instantly                                │
├─────────────────────────────────────────────────────────────┤
│  STATISTICS (4 Cards in Row)                                │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │  0   │  │ ₹0.00│  │50,000│  │50,000│                   │
│  │Trans │  │Sent  │  │Limit │  │Left  │                   │
│  └──────┘  └──────┘  └──────┘  └──────┘                   │
├─────────────────────────────────────────────────────────────┤
│  MAIN CONTENT (2 Columns)                                   │
│  ┌───────────────────┐  ┌────────────────────┐            │
│  │ Select Account    │  │ Transfer Details   │            │
│  │                   │  │                    │            │
│  │ [Account Cards]   │  │ Receiver: _______  │            │
│  │ ○ Account 1       │  │ [Verify Receiver]  │            │
│  │   •••• 1234       │  │                    │            │
│  │   ₹ 10,000        │  │ ✓ John Doe        │            │
│  │                   │  │   ZP-123456        │            │
│  │ ○ Account 2       │  │                    │            │
│  │   •••• 5678       │  │ Amount: ₹ _______  │            │
│  │   ₹ 5,000         │  │ [100][500][1000]   │            │
│  │                   │  │ [5000][10000]      │            │
│  │ [+ Add Account]   │  │                    │            │
│  │                   │  │ Description: _____ │            │
│  │                   │  │                    │            │
│  │                   │  │ ┌───────────────┐  │            │
│  │                   │  │ │ Summary       │  │            │
│  │                   │  │ │ Amount: 1,000 │  │            │
│  │                   │  │ │ Charges: 0    │  │            │
│  │                   │  │ │ Total: 1,000  │  │            │
│  │                   │  │ └───────────────┘  │            │
│  │                   │  │                    │            │
│  │                   │  │ [✈️ Send Money]    │            │
│  │                   │  │ 🛡️ Secure         │            │
│  └───────────────────┘  └────────────────────┘            │
├─────────────────────────────────────────────────────────────┤
│  RECENT RECIPIENTS                        [View All →]     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                   │
│  │ No recent recipients yet               │                │
│  └────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Features at a Glance

### ✅ Account Selection
- **With Accounts**: Radio selection with visual cards
- **Without Accounts**: Empty state with "Open Account" CTA
- Shows: Bank icon, name, masked number, balance
- Primary badge on default account

### 👤 Receiver Verification
- Input: ZenoPay ID / Email / Mobile
- Verify button triggers API check
- Success: Green card with verified details
- Error: Red border + error message

### 💰 Amount Entry
- Manual input with rupee icon
- Quick amount buttons (₹100 to ₹10,000)
- Active state on selected quick amount
- Transaction fee notice for amounts > ₹10,000

### 📝 Transaction Summary
- Real-time calculation
- Shows: Amount + Charges = Total
- Updates as user types
- Clear breakdown in gray card

### 🎉 Success Flow
```
Submit Form
    ↓
[Loading Spinner]
    ↓
API Call Success
    ↓
✅ Success Modal
    • Transaction ID
    • Amount
    • Recipient
    • [Send Again] [View Receipt]
```

### ❌ Error Flow
```
Submit Form
    ↓
API Call Failed
    ↓
❌ Error Modal
    • Error Message
    • [Try Again] [Contact Support]
```

## 🎨 Design Tokens

### Colors
```css
Primary Blue:    #3B82F6  /* Buttons, icons, borders */
Purple:          #8B5CF6  /* Gradients, accents */
Green Success:   #10B981  /* Success states */
Red Error:       #EF4444  /* Error states */
Yellow Warning:  #F59E0B  /* Warnings, limits */
Background:      #F9FAFB  /* Page background */
Card:            #FFFFFF  /* Card background */
Border:          #E5E7EB  /* Card borders */
Text Primary:    #0F172A  /* Headings */
Text Secondary:  #64748B  /* Labels, descriptions */
```

### Spacing
```css
Container:       1280px max, 40px padding
Card Padding:    32px
Card Gap:        24px
Form Field Gap:  24px
Button Height:   44-54px
Input Height:    52px
```

### Border Radius
```css
Cards:           16-20px
Buttons:         10-12px
Inputs:          12px
Badges:          6px
Avatar:          50% (circle)
```

### Shadows
```css
Card:            0 1px 3px rgba(0,0,0,0.05)
Card Hover:      0 10px 25px rgba(0,0,0,0.08)
Button:          0 4px 12px rgba(59,130,246,0.3)
Modal:           0 25px 50px rgba(0,0,0,0.25)
```

## 📱 Responsive Breakpoints

### Desktop (>1024px)
- 2-column main layout
- 4-column stats
- Full button text visible

### Tablet (768-1024px)
- 2-column maintained
- 2-column stats
- Reduced padding

### Mobile (<768px)
- Single column stack
- 1-column stats
- Full-width forms
- Icon-only buttons (text hidden)

## 🔑 API Routes

### Frontend Calls
```javascript
POST /api/verify-receiver     // Verify recipient
POST /api/send-money          // Submit transfer
GET  /api/today-stats         // Load daily stats
```

### Route Mapping
```javascript
GET  /send-to                 // Main page
POST /api/verify-receiver     // Verify receiver
POST /api/send-money          // Process transfer
GET  /api/today-stats         // Daily summary
```

## 🎭 States & Interactions

### Input States
- **Default**: Light gray background, gray border
- **Focus**: Blue border, blue glow shadow
- **Error**: Red border, shake animation
- **Success**: Green border, checkmark icon
- **Disabled**: Gray background, cursor not-allowed

### Button States
- **Default**: Gradient background
- **Hover**: Lift 2px, shadow increase
- **Active**: Press down effect
- **Loading**: Spinner, "Processing..."
- **Disabled**: Gray, no interaction

### Card States
- **Default**: White, subtle shadow
- **Hover**: Shadow increase, lift 2px
- **Selected**: Blue border, gradient background
- **Active**: Border color change

## 🎬 Animations

### Page Load
```css
Cards: fade-in + slide-up (0.4s stagger)
Stats: count-up animation from 0
```

### Interactions
```css
Button Hover:  translateY(-2px) 0.3s
Input Focus:   border-color 0.2s + glow
Card Hover:    shadow 0.3s
Success:       checkmark + confetti (optional)
Error:         shake 0.3s
```

### Transitions
```css
Fast:    150ms ease
Base:    300ms ease
Slow:    500ms ease
```

## 🛡️ Validation Rules

### Receiver
- ✅ Required field
- ✅ Must verify before proceeding
- ✅ Format: ZenoPay ID / Email / Mobile

### Amount
- ✅ Required, must be > 0
- ✅ Cannot exceed daily limit
- ✅ Cannot exceed account balance
- ⚠️ Fee warning for amounts > ₹10,000

### Description
- ✅ Optional
- ✅ Max 200 characters
- ✅ Real-time character counter

## 💡 Pro Tips

### For Users
1. Use quick amount buttons for common values
2. Verify receiver before entering amount
3. Check transaction summary before submitting
4. Daily limit resets at midnight
5. Keep description for record-keeping

### For Developers
1. All animations use GPU acceleration
2. Form state managed in JavaScript
3. API calls use async/await
4. Error handling on all endpoints
5. Toast notifications for quick feedback

## 🎯 User Flow

```
1. Land on Send Money page
       ↓
2. Select source account (if multiple)
       ↓
3. Enter receiver ID/email/mobile
       ↓
4. Click "Verify Receiver"
       ↓
5. See verified receiver card ✓
       ↓
6. Enter amount (or use quick buttons)
       ↓
7. Add optional description
       ↓
8. Review transaction summary
       ↓
9. Click "Send Money"
       ↓
10. Loading state...
       ↓
11. Success modal appears ✅
       ↓
12. Options: Send Again / View Receipt
```

## 📊 Statistics Display

### Card 1: Transactions Today
- Icon: Exchange arrows (blue circle)
- Value: Count (animated)
- Subtitle: "Updated now"

### Card 2: Total Sent Today
- Icon: Rupee sign (green circle)
- Value: ₹ amount (2 decimals)
- Trend: Percentage increase

### Card 3: Daily Limit
- Icon: Chart line (yellow circle)
- Value: ₹ 50,000
- Progress bar below

### Card 4: Remaining Limit
- Icon: Wallet (gray circle)
- Value: Calculated remaining
- Percentage available

## 🎨 Empty States

### No Accounts
```
    [Wallet Icon]
    
No bank accounts linked

Link your bank account to start
sending money securely

    [Open an Account]
    
    Learn how to link accounts
```

### No Recipients
```
    [Users Icon]
    
No recent recipients yet

Recipients you've sent money to
will appear here
```

## 🚀 Quick Start

1. **Access page**: Navigate to `/send-to`
2. **Select account**: Choose from list or use default
3. **Verify receiver**: Enter ID and click verify
4. **Enter amount**: Type or use quick buttons
5. **Submit**: Click "Send Money" button
6. **Confirm**: View success modal

---

**File Structure:**
```
views/
  └── send-money.ejs          ← Main view
public/
  ├── css/
  │   └── send-money.css      ← Styles
  └── js/
      └── send-money.js       ← Interactions
Controllers/
  └── TransferMoney.js        ← Backend logic
Routes/
  └── routes.js               ← API routes
```

**Dependencies:**
- Font Awesome 6.4.0 (icons)
- Inter font (typography)
- MongoDB (database)
- Express.js (routing)
- EJS (templating)

**Browser Support:** Chrome, Firefox, Safari, Edge (latest)

**Mobile:** Fully responsive, touch-optimized

---

✨ **Built with modern fintech design principles**  
🎨 **Matches ZenoPay dashboard design language**  
🚀 **Ready for production use**
