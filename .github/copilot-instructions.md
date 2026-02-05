# ZenoPay - AI Coding Agent Instructions

## Project Overview
ZenoPay is a fintech payment platform built with Express.js, MongoDB/Mongoose, and EJS templates. It handles digital payments, bank transfers, merchant integrations, KYC verification, and e-commerce features.

## Critical Architecture Patterns

### Session Management (req.session)
- **Session-based authentication** using `express-session` + `connect-mongodb-session`
- Session middleware creates QR codes on-the-fly: `req.session.qrCode` generated from ZenoPayID
- Admin routes use **fake sessions** (authentication temporarily disabled for design review - see [app.js](app.js#L92-L110))
- Always pass to views: `user: req.session.user || null`, `isLoggedIn: req.session.isLoggedIn || false`, `qrCode: req.session.qrCode || null`

### Dual Frontend Architecture
- **User Frontend**: EJS views in [views/](views/) with route prefix `/` 
- **Admin Panel**: Separate EJS templates in [Admin/Views/](Admin/Views/) with route prefix `/admin`
- **Modern Dashboard Migration**: New files use `-modern` suffix ([dashboard-modern.ejs](views/dashboard-modern.ejs), [dashboard-modern.css](public/css/dashboard-modern.css))
- PowerShell deployment scripts: [deploy-modern-dashboard.ps1](deploy-modern-dashboard.ps1), [rollback-modern-dashboard.ps1](rollback-modern-dashboard.ps1)

### MVC Structure
- **Models** ([Models/](Models/)): Mongoose schemas - Use [schema-index-best-practices.js](Models/schema-index-best-practices.js) to avoid duplicate index warnings
- **Controllers** ([Controllers/](Controllers/), [Admin/Controllers/](Admin/Controllers/)): Business logic, always async/await
- **Routes** ([Routes/routes.js](Routes/routes.js), [Admin/Routes/adminRoutes.js](Admin/Routes/adminRoutes.js)): Route definitions
- **Services** ([Services/](Services/)): Reusable utilities (email, Azure Blob Storage, PDF generation, QR codes)

### Key Models & Their Purposes
- **ZenoPayUser** ([Models/ZenoPayUser.js](Models/ZenoPayUser.js)): User accounts with fields like `ZenoPayID`, `Role` (user/merchant/admin), `KYCStatus`, `EmailVerified`, `NotificationPreferences`
- **TransactionHistory** ([Models/TransactionHistory.js](Models/TransactionHistory.js)): All payment transactions
- **Merchant** ([Models/Merchant.js](Models/Merchant.js)): Merchant accounts for payment gateway integration
- **Receipt** ([Models/Receipt.js](Models/Receipt.js)): Transaction receipts with PDF generation support

## Development Workflows

### Starting the Application
```powershell
npm start  # Uses nodemon, runs on PORT 3000 (or process.env.PORT)
```

### Database Scripts (run from project root)
```powershell
node scripts/test-mongodb-connection.js    # Test DB connectivity
node scripts/create-admin-user.js          # Create admin: ZP-ADMIN001 / Admin@123
node scripts/create-demo-user.js           # Create demo user for testing
node scripts/verify-indexes.js             # Check index definitions
node scripts/seed-shop-data.js             # Populate e-commerce data
```

### Environment Variables Required
- `MONGO_URI`: MongoDB connection string
- `SESSION_SECRET`: Session encryption key
- `AZURE_STORAGE_CONNECTION_STRING`: For profile image uploads
- `PORT`: Application port (default 3000)

## Critical Conventions

### Mongoose Schema Indexes
**NEVER define the same index twice** - causes duplicate warnings:
```javascript
// ❌ WRONG - duplicate index
email: { type: String, unique: true, index: true }  // Both create indexes!

// ✅ CORRECT - choose one approach
email: { type: String, unique: true }  // OR use schema.index() later
```
See [schema-index-best-practices.js](Models/schema-index-best-practices.js) for comprehensive examples.

### File Upload Pattern
- Use **Multer + Azure Blob Storage** ([Services/azureStorage.js](Services/azureStorage.js))
- Multer configured with `memoryStorage()` in [Routes/routes.js](Routes/routes.js#L38-L56)
- Upload directly to Azure without disk writes
- Allowed types: jpeg, jpg, png, gif, webp (5MB limit)

### Controller Response Pattern
Controllers follow this structure:
```javascript
// Render view
res.render("template-name", {
  pageTitle: "Page Title",
  currentPage: "page-name",
  user: req.session.user || null,
  qrCode: req.session.qrCode || null,
  isLoggedIn: req.session.isLoggedIn || false
});

// API response
res.json({ success: true, data: {...}, message: "..." });
```

### Error Handling
- Custom error pages: [error-403.ejs](views/error-403.ejs), [error-404.ejs](views/error-404.ejs), [error-500.ejs](views/error-500.ejs)
- 404 middleware in [app.js](app.js#L117-L122)
- 500 middleware with error ID generation in [app.js](app.js#L125-L132)

### Email Service
- Use [Services/EmailService.js](Services/EmailService.js) class-based approach (preferred) OR [Services/email.js](Services/email.js) (legacy)
- Templates for: Aadhaar registration, OTP verification, password reset, KYC updates

## Integration Points

### External Dependencies
- **Azure Blob Storage**: Profile images stored in `profile-images` container
- **MongoDB**: Primary database with connection retry logic (5 attempts with exponential backoff)
- **Nodemailer**: Gmail SMTP for transactional emails
- **PDFKit**: Generate statements and receipts ([Services/pdfGenerator.js](Services/pdfGenerator.js), [Services/receiptPdfGenerator.js](Services/receiptPdfGenerator.js))
- **QR Code**: Generate payment QR codes with logo ([Services/generateQR.js](Services/generateQR.js))

### Cross-Component Communication
- **User-Merchant Flow**: Users register → become merchants → get API keys → integrate payment gateway
- **KYC Workflow**: Document upload → admin review → status update in `ZenoPayUser.KYCStatus`
- **Transaction Flow**: Sender ZenoPayID → Receiver ZenoPayID → TransactionHistory record → both user balances updated

## Testing & Debugging Notes
- **Admin auth is DISABLED** - all `/admin` routes bypass authentication (see [adminAuth.js](Admin/Middleware/adminAuth.js#L8-L22))
- Some controllers have demo user fallback: `req.session.user?.ZenoPayID || "ZP-DEMO2024"`
- Server runs in "degraded mode" if MongoDB connection fails (sessions use memory store, not persistent)
- Check [server-log.txt](server-log.txt) for runtime logs

## Code Style
- Use `async/await` (not callbacks or raw promises)
- Error handling: `try/catch` blocks with descriptive console.error messages
- Variable naming: `camelCase` for JS, `PascalCase` for models
- Always validate user input before database operations
- Use Mongoose virtuals for computed properties (e.g., `PhoneNumber` getter/setter in ZenoPayUser)
