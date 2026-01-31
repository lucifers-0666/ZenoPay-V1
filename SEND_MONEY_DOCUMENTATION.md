# ZenoPay - Modern Send Money Page

## 🎨 Overview
A modern, professional Send Money page for the ZenoPay payment gateway that matches the dashboard design language with gradient cards, clean layouts, and fintech aesthetics.

## ✨ Features Implemented

### 1. **Page Header Section**
- Breadcrumb navigation (Dashboard > Send Money)
- Page title with gradient icon
- Quick action buttons (Recent Recipients, Transaction History)

### 2. **Statistics Dashboard**
Four beautiful stat cards showing:
- Transactions Made Today (count with live updates)
- Total Amount Sent Today (formatted in ₹)
- Daily Limit (₹50,000 with progress bar)
- Remaining Limit (updates dynamically)

### 3. **Select Account Card (Left Column)**
- **With Accounts**: 
  - Selectable account cards with radio buttons
  - Shows bank icon, account holder name, masked account number
  - Displays available balance
  - Primary badge on default account
  - "Add New Account" button
- **Empty State**:
  - Large wallet icon
  - Clear messaging
  - "Open an Account" CTA button
  - "Learn how to link accounts" link

### 4. **Transfer Details Card (Right Column)**
Complete transfer form with:
- **Receiver Input**: ZenoPay ID / Email / Mobile with verify button
- **Verified Receiver Card**: Green success card showing verified recipient details
- **Amount Input**: With rupee icon and quick amount buttons (₹100, ₹500, ₹1000, ₹5000, ₹10000)
- **Info Card**: Transaction charges notice
- **Description Textarea**: Optional note field with character counter (200 max)
- **Transaction Summary**: Shows amount, charges, and total
- **Submit Button**: Large gradient button with icon
- **Security Notice**: Encrypted transaction badge

### 5. **Recent Recipients Section**
- Section header with "View All" link
- Grid layout for recipient cards
- Empty state when no recipients

### 6. **Success/Error Modals**
- **Success Modal**: 
  - Shows transaction details (ID, amount, recipient)
  - "Send Again" and "View Receipt" buttons
  - Optional confetti animation
- **Error Modal**:
  - Error message display
  - "Try Again" and "Contact Support" buttons

## 🎨 Design System

### Color Palette
- Primary Blue: #3B82F6
- Purple: #8B5CF6
- Green (Success): #10B981
- Red (Error): #EF4444
- Yellow (Warning): #F59E0B
- Background: #F9FAFB
- Text Primary: #0F172A
- Text Secondary: #64748B

### Typography
- Font Family: Inter
- Page Title: 32px, Bold
- Card Title: 20px, Bold
- Body: 15px
- Labels: 14px, Semi-bold
- Helper Text: 13px

### Spacing
- Container Max Width: 1280px
- Container Padding: 40px (desktop), 20px (mobile)
- Card Padding: 32px
- Gap between cards: 24px
- Gap between form fields: 24px

### Components
- **Cards**: White background, 16-20px border-radius, subtle shadows
- **Buttons**: Gradient backgrounds, 10-12px border-radius, hover lift effect
- **Inputs**: 52px height, light gray background, 12px border-radius, left icon padding
- **Icons**: Font Awesome 6.4.0 (Heroicons alternative)

## 📁 Files Created

### 1. **views/send-money.ejs**
Main view file with complete HTML structure

### 2. **public/css/send-money.css**
Complete stylesheet with:
- Responsive design (desktop, tablet, mobile)
- All component styles
- Animations and transitions
- Modal styles
- Utility classes

### 3. **public/js/send-money.js**
JavaScript functionality including:
- Account selection handling
- Receiver verification
- Amount calculation with charges
- Form validation
- Transaction submission
- Success/error handling
- Modal management
- Toast notifications
- Character counter
- Quick amount buttons
- Keyboard shortcuts (ESC to close, Ctrl+Enter to submit)

### 4. **Controllers/TransferMoney.js** (Updated)
Backend API handlers:
- `getTransferMoney()` - Render send money page
- `verifyReceiver()` - Verify receiver by ZenoPay ID/Email/Mobile
- `postTransferMoney()` - Process money transfer
- `getDailyTransactionSummary()` - Get today's transaction stats

### 5. **Routes/routes.js** (Updated)
New API routes:
- `GET /send-to` - Send money page
- `POST /api/send-money` - Submit transfer
- `POST /api/verify-receiver` - Verify receiver
- `GET /api/today-stats` - Daily transaction stats

## 🔌 API Endpoints

### POST /api/verify-receiver
Verify receiver by ZenoPay ID, email, or mobile number.

**Request:**
```json
{
  "receiverId": "ZP-123456" // or email or mobile
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Receiver verified successfully",
  "receiver": {
    "Name": "John Doe",
    "ZenoPayID": "ZP-123456",
    "Email": "john@example.com",
    "Mobile": "9876543210",
    "accounts": [...]
  }
}
```

### POST /api/send-money
Process money transfer.

**Request:**
```json
{
  "sourceAccountId": "account_id",
  "receiverId": "ZP-123456",
  "amount": 1000,
  "charges": 20,
  "total": 1020,
  "description": "Payment for services"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Transfer Successful!",
  "transaction": {
    "transactionId": "TXN123456789",
    "amount": 1000,
    "charges": 20,
    "total": 1020,
    "receiverName": "John Doe",
    "newBalance": 4980
  }
}
```

### GET /api/today-stats
Get today's transaction statistics.

**Response:**
```json
{
  "success": true,
  "transactions": 5,
  "amount": 15000,
  "remainingLimit": 35000,
  "dailyLimit": 50000
}
```

## 🎯 Key Features

### Transaction Flow
1. User selects source account
2. Enters receiver ID/Email/Mobile and verifies
3. Enters amount (with quick amount buttons)
4. Adds optional description
5. Reviews transaction summary
6. Submits transaction
7. Views success modal with transaction details

### Validation
- Receiver verification before transfer
- Amount validation (not zero, not exceeding limit)
- Daily limit check (₹50,000)
- Insufficient balance check
- Character limit on description (200)

### Transaction Charges
- Free for amounts ≤ ₹10,000
- 2% fee for amounts > ₹10,000
- Charges displayed in summary before submission

### User Experience
- Real-time form validation
- Loading states on buttons
- Toast notifications for quick feedback
- Success/error modals with details
- Smooth animations and transitions
- Keyboard shortcuts support
- Mobile responsive design

## 📱 Responsive Design

### Desktop (>1024px)
- 2-column layout for main content
- 4-column stats grid
- Full navigation visible

### Tablet (768-1024px)
- 2-column maintained
- 2-column stats grid
- Slightly reduced padding

### Mobile (<768px)
- Single column stack
- 1-column stats grid
- Full-width forms
- Touch-friendly buttons (44px minimum)
- Hamburger menu

## 🚀 Usage

1. **Navigate to Send Money page:**
   ```
   http://localhost:3000/send-to
   ```

2. **Select your source account** (if you have multiple accounts)

3. **Enter receiver details** and click "Verify Receiver"

4. **Enter amount** (use quick buttons or type custom amount)

5. **Add description** (optional)

6. **Review summary** and click "Send Money"

7. **View success modal** with transaction details

## 🔒 Security Features

- All transactions encrypted
- Session-based authentication required
- Daily transaction limit (₹50,000)
- Balance verification before transfer
- Duplicate transaction prevention
- Secure API endpoints

## 🎨 Design Consistency

This page matches the existing ZenoPay dashboard design:
- Same gradient colors (blue to purple)
- Same card styles and shadows
- Same button styles
- Same typography (Inter font)
- Same spacing system
- Same icon style (Font Awesome)

## 📝 Notes

- Page requires user to be logged in
- User must have at least one bank account linked
- Daily limit is set to ₹50,000 (configurable)
- Transaction charges: 2% for amounts > ₹10,000
- Notifications are created for both sender and receiver
- Transaction history is automatically recorded

## 🐛 Error Handling

- Network errors: Shows error modal with "Try Again" option
- Receiver not found: Inline error message + toast
- Insufficient balance: Error modal with balance info
- Daily limit exceeded: Warning with remaining limit
- Server errors: User-friendly error messages

## 🎉 Enhancements (Optional)

The following enhancements can be easily added:

1. **Confetti Animation**: Uncomment `createConfetti()` in success modal
2. **Recent Recipients**: Add recipient cards in bottom section
3. **Transaction History**: Link to full transaction history
4. **Receipts**: Generate downloadable PDF receipts
5. **Recurring Transfers**: Schedule automatic transfers
6. **Favorites**: Save frequent recipients

## 📊 Performance

- Lazy loading for large account lists
- Debounced input validation
- Optimized animations (GPU-accelerated)
- Minimal re-renders
- Efficient DOM manipulation

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

**Created:** January 28, 2026  
**Version:** 1.0.0  
**Author:** ZenoPay Development Team
