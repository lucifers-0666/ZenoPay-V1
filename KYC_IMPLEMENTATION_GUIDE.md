# KYC (Know Your Customer) Implementation - Complete Summary

## Overview
A complete Know Your Customer verification system for ZenoPay fintech application with PAN (Permanent Account Number) and Aadhaar verification, admin review panel, and document management.

---

## FILE PATHS & IMPLEMENTATION

### 1. **Models** 
#### [d:\zenpay-V2\ZenoPay\Models\KYC.js](Models/KYC.js)
- New Mongoose schema for KYC submissions
- **Fields:**
  - `userId`: Reference to ZenoPayUser (indexed)
  - `panNumber`: Encrypted PAN string
  - `aadhaarLast4`: Last 4 digits of Aadhaar (plaintext, only stored)
  - `panCardImage`: File path to PAN card upload
  - `aadhaarFrontImage`: File path to Aadhaar front
  - `aadhaarBackImage`: File path to Aadhaar back
  - `status`: Enum ['pending', 'under_review', 'approved', 'rejected']
  - `submittedAt`: Submission timestamp
  - `reviewedAt`: Review completion timestamp
  - `rejectionReason`: Max 500 char reason for rejection
  - `reviewedBy`: Reference to admin user who reviewed
  - `resubmissionAllowed`: Boolean flag for rejected cases
  - `previousSubmissionId`: Reference to previous KYC for resubmissions
  
- **Security:**
  - PAN encrypted using AES-256-CBC (full PAN never stored plaintext)
  - Only Aadhaar last 4 digits stored (privacy compliant)
  - Encryption key from `process.env.ENCRYPTION_KEY` or derived from `SECRET_KEY`

#### [d:\zenpay-V2\ZenoPay\Models\ZenoPayUser.js](Models/ZenoPayUser.js) - UPDATED
- **New Fields Added:**
  - `kycStatus`: Enum ['not_submitted', 'pending', 'approved', 'rejected'] (default: 'not_submitted')
  - `kycTier`: Number (default: 0) - 0 = not submitted, 1 = approved, 2 = enhanced (future)

---

### 2. **Middleware**
#### [d:\zenpay-V2\ZenoPay\Middleware\kycUpload.js](Middleware/kycUpload.js) - NEW
- **Purpose:** Multer configuration for KYC document uploads
- **Configuration:**
  - Storage: `d:\zenpay-V2\ZenoPay\public\uploads\kyc\`
  - File naming: `{userId}_{fieldname}_{timestamp}.{ext}`
  - Accepted formats: JPG, PNG only
  - Max file size: 2MB per file
  - Validates all 3 files present (panCardImage, aadhaarFrontImage, aadhaarBackImage)
  - Auto-cleanup on validation failure

---

### 3. **Controllers**
#### [d:\zenpay-V2\ZenoPay\Controllers\KYCController.js](Controllers/KYCController.js) - UPDATED
- **User-Facing Functions:**
  - `getKYCStatus()`: GET `/user/kyc` - Display KYC verification status page
    - Shows: current status badge, submission timeline, rejection reasons, next actions
    - Conditional rendering based on status
    - Links to submit or resubmit
  
  - `getKYCForm()`: GET `/user/kyc/submit` - Display KYC submission form
    - Shows form for PAN number, Aadhaar number, 3 document uploads
    - Pre-fills user info when available
    - Prevents already-verified users from resubmitting
  
  - `submitKYC()`: POST `/user/kyc/submit` with `kycUpload` middleware
    - Validates PAN format: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$` (e.g., AAABB1234C)
    - Validates Aadhaar: 12 digits only
    - Stores only Aadhaar last 4 digits
    - Encrypts full PAN before saving
    - Creates KYC record with status='pending'
    - Updates user.kycStatus to 'pending'

- **Admin Functions:**
  - `adminListKYC()`: GET `/admin/kyc` - List pending KYC submissions
    - Filterable by status (pending, under_review, approved, rejected)
    - Pagination (20 per page)
    - Shows user details + submission date
  
  - `adminViewKYC()`: GET `/admin/kyc/:kycId` - View KYC details + document images
    - Displays user info, document images inline
    - Shows submission & review timestamps
    - Provides action buttons for approve/reject/mark-review
  
  - `adminApproveKYC()`: POST `/admin/kyc/:kycId/approve`
    - Sets status='approved'
    - Sets reviewedAt timestamp, reviewedBy admin reference
    - Updates user.kycStatus='approved', user.kycTier=1
    - Returns JSON response
  
  - `adminRejectKYC()`: POST `/admin/kyc/:kycId/reject`
    - Requires rejectionReason in body
    - Sets status='rejected', stores reason (max 500 chars)
    - Sets resubmissionAllowed=true
    - Updates user.kycStatus='rejected', user.kycTier=0
    - Returns JSON response
  
  - `adminMarkUnderReview()`: GET `/admin/kyc/:kycId/mark-review`
    - Sets status='under_review'
    - Marks reviewer (reviewedBy field)
    - Returns JSON response

- **Helpers:**
  - `resolveCurrentUser()`: Unified user resolution from session (handles legacy + new fields)
  - PAN regex: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`
  - Aadhaar regex: `/^[0-9]{12}$/`

---

### 4. **Views**
#### [d:\zenpay-V2\ZenoPay\views\user\kyc-status.ejs](views/user/kyc-status.ejs) - NEW
- **Display Logic:**
  - Icon changes based on status (⏳ pending, ✓ approved, ✗ rejected, ⓘ not submitted)
  - Color-coded badges (yellow for pending, green for approved, red for rejected)
  - Info boxes with status-specific messaging
  - Timeline showing submitted/reviewed dates
  - Conditional action buttons (Submit, Resubmit, or back to dashboard)
  - Shows rejection reason if rejected

#### [d:\zenpay-V2\ZenoPay\views\user\kyc-submit.ejs](views/user/kyc-submit.ejs) - NEW
- **Form Elements:**
  - PAN input: 10 chars, uppercase, pattern validation
  - Aadhaar input: 12 digits, numeric only
  - Three file upload dropzones (PAN card, Aadhaar front, Aadhaar back)
  - Client-side validation before submission
  - File size check (2MB max)
  - Type check (JPG/PNG only)
  
- **UX Features:**
  - Drag-drop or click-to-upload file UI
  - File name display on selection
  - Real-time validation feedback
  - Loading indicator during upload
  - Success message with redirect after submit

#### [d:\zenpay-V2\ZenoPay\views\admin\kyc-list.ejs](views/admin/kyc-list.ejs) - NEW
- **Features:**
  - Status filter buttons (Pending, Under Review, Approved, Rejected)
  - Table with: User avatar + name/phone, Email, Status badge, Submitted date, Review button
  - Pagination (20 items per page)
  - Empty state message
  - User avatars with initials + color background
  - Sortable by submission date (newest first)

#### [d:\zenpay-V2\ZenoPay\views\admin\kyc-detail.ejs](views/admin/kyc-detail.ejs) - NEW
- **Sections:**
  - User information card (name, email, phone)
  - Submission details (status, submitted date, reviewed date)
  - Document details (PAN: masked, Aadhaar last 4)
  - Document gallery (inline images of all 3 documents)
  - Action buttons: Approve, Mark Under Review, Reject
  - Rejection form with textarea for reason (expandable)
  
- **JavaScript:**
  - `approveKYC()`: Confirms, calls API, reloads
  - `rejectKYC()`: Validates reason, calls API, reloads
  - `markUnderReview()`: Calls API, reloads
  - Form toggle for rejection reason entry

#### [d:\zenpay-V2\ZenoPay\views\dashboard.ejs](views/dashboard.ejs) - UPDATED
- **KYC Banner Section:**
  - Conditional rendering based on `kycStatus`
  - If approved: Green success banner showing "KYC Verified ✓"
  - If pending/rejected: Yellow/red warning banners with action buttons
  - Dynamic messaging and links

---

### 5. **Routes**
#### [d:\zenpay-V2\ZenoPay\Routes\userRoutes.js](Routes/userRoutes.js) - UPDATED
- Added imports:
  - `const kycUpload = require("../Middleware/kycUpload");`

- **New Routes:**
  - `GET  /user/kyc`           → `KYCController.getKYCStatus()`
  - `GET  /user/kyc/submit`    → `KYCController.getKYCForm()`
  - `POST /user/kyc/submit`    → kycUpload middleware → `KYCController.submitKYC()`

#### [d:\zenpay-V2\ZenoPay\Routes\adminRoutes.js](Routes/adminRoutes.js) - UPDATED
- **New Admin Routes:**
  - `GET  /admin/kyc`                  → `KYCController.adminListKYC()`
  - `GET  /admin/kyc/:kycId`           → `KYCController.adminViewKYC()`
  - `POST /admin/kyc/:kycId/approve`   → `KYCController.adminApproveKYC()`
  - `POST /admin/kyc/:kycId/reject`    → `KYCController.adminRejectKYC()`
  - `GET  /admin/kyc/:kycId/mark-review` → `KYCController.adminMarkUnderReview()`

---

### 6. **Dashboard Enhancement**
#### [d:\zenpay-V2\ZenoPay\Controllers\DashboardController.js](Controllers/DashboardController.js) - UPDATED
- Added KYC model import
- **New Data Fetching:**
  - Fetches user's KYC status and tier
  - Retrieves latest KYC record for the user
  - Passes `kycStatus`, `kycTier`, `kycRecord` to view

- **Data Passed to View:**
  ```javascript
  kycStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected'
  kycTier: 0 | 1 | 2
  kycRecord: KYC document or null
  ```

---

## API REQUEST/RESPONSE EXAMPLES

### Submit KYC
```
POST /user/kyc/submit
Content-Type: multipart/form-data

Body:
  panNumber: "AAABB1234C"
  aadhaarNumber: "123456789012"
  panCardImage: <file>
  aadhaarFrontImage: <file>
  aadhaarBackImage: <file>

Response (201):
{
  "success": true,
  "message": "KYC submitted successfully. Your documents are under review.",
  "referenceId": "kycRecord._id"
}
```

### Approve KYC (Admin)
```
POST /admin/kyc/{kycId}/approve
Authorization: Admin session required

Response:
{
  "success": true,
  "message": "KYC approved successfully",
  "kycId": "{kycId}"
}
```

### Reject KYC (Admin)
```
POST /admin/kyc/{kycId}/reject
Content-Type: application/json

Body:
{
  "rejectionReason": "PAN number does not match Aadhaar details"
}

Response:
{
  "success": true,
  "message": "KYC rejected. User can resubmit.",
  "kycId": "{kycId}"
}
```

---

## FILE UPLOAD DETAILS

### Storage Location
- **Base Directory:** `d:\zenpay-V2\ZenoPay\public\uploads\kyc\`
- **File Naming Convention:** `{userId}_{fieldname}_{timestamp}.{extension}`
  - Example: `65a8b2c1d9e8f0001a2b3c4d_panCardImage_1711234567890.jpg`

### Served Paths
- Files accessible at: `/uploads/kyc/{filename}`
- Full URLs: `https://zenopay.com/uploads/kyc/65a8b2c1d9e8f0001a2b3c4d_panCardImage_1711234567890.jpg`

### Constraints
- **Max Size:** 2MB per file
- **Accepted Types:** JPG, JPEG, PNG
- **Validation:** MIME type + extension verification
- **Error Handling:** Auto-cleanup of uploaded files on validation failure

---

## SECURITY FEATURES

### PAN Encryption
```javascript
// Encryption (AES-256-CBC)
- Key: Derived from process.env.ENCRYPTION_KEY or SECRET_KEY
- IV: Random per encryption
- Stored format: "iv_hex:encrypted_hex"
- Never returned in JSON responses by default
```

### Aadhaar Privacy
- Only last 4 digits stored (never full number)
- Full number required only at submission time for validation
- Improves privacy compliance (GDPR/data minimization)

### Admin Authorization
- All admin routes require `isAdmin` middleware
- Only Admin/Super Admin roles can review KYC
- Audit trail via `reviewedBy` field

### Input Validation
- PAN: Strict regex pattern (AAAAA9999A format)
- Aadhaar: 12-digit numeric only
- File types: Whitelist approach (JPG/PNG only)
- File sizes: 2MB limit per file

---

## USER EXPERIENCE FLOW

### For Regular Users
1. User logs in → Dashboard shows KYC banner
2. Clicks "Verify Now" → Goes to `/user/kyc/submit`
3. Fills PAN, Aadhaar, uploads 3 documents
4. Submits → Redirect to `/user/kyc` with pending status
5. Waits 24-48 hours for admin review
6. Admin approves → KYC badge appears on dashboard
7. User gets access to higher limits + all features

### For Admins
1. Admin logs in → Can access `/admin/kyc`
2. Sees list of pending submissions with filters
3. Clicks on a submission → Views details + document images inline
4. Reviews documents → Clicks "Approve" or "Reject"
5. If reject: Enters reason → User sees reason on their profile
6. Approved users marked as `kycTier: 1`

---

## VALIDATION RULES

### PAN Format
- Pattern: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- Example: `AAABB1234C`, `BBCCC5678D`
- Always uppercase
- No special characters or spaces

### Aadhaar Format
- Exactly 12 digits
- No hyphens or spaces (user can input, backend strips)
- Pattern: `^[0-9]{12}$`
- Example: `123456789012`

### Document Requirements
- **All 3 files required:** PAN card, Aadhaar front, Aadhaar back
- **Format:** JPG or PNG only
- **Size:** Maximum 2MB per file
- **No corrupted files allowed**

---

## DATABASE INDEXES

### KYC Collection
- `userId` (indexed) - Fast lookup by user
- `status` (indexed) - Fast filtering by status
- `createdAt` (implicit from timestamps) - Sorting by submission date

### User Collection
- `kycStatus` - Indexed for dashboard queries
- `kycTier` - Indexed for feature access control

---

## NEXT STEPS (NOT IMPLEMENTED)

1. **Email Notifications**
   - Notify user when KYC submitted
   - Notify when approved/rejected with reason
   - Notify admin to review

2. **KYC Expiry/Renewal**
   - Set expiry dates (e.g., re-verify every 5 years)
   - Auto-trigger renewal flow

3. **Enhanced Document Validation**
   - OCR for PAN recognition
   - Facial recognition for Aadhaar selfie
   - Liveness detection during submission

4. **Bulk Admin Actions**
   - Approve/reject multiple KYCs at once
   - Export KYC data to reports

5. **API Integration**
   - Connect to actual PAN/Aadhaar verification APIs
   - Real-time validation with government databases

---

## TESTING CHECKLIST

- [ ] User can view KYC status page
- [ ] User can submit KYC documents (all 3 files)
- [ ] PAN validation works (reject invalid formats)
- [ ] Aadhaar validation works (reject non-numeric/wrong length)
- [ ] File upload works with size/type limits
- [ ] Admin can list pending KYC submissions
- [ ] Admin can view KYC details with document preview
- [ ] Admin can approve KYC
- [ ] Admin can reject KYC with reason
- [ ] Dashboard shows KYC badge when approved
- [ ] Dashboard shows "Under Review" when pending
- [ ] Dashboard shows error message when rejected
- [ ] User can resubmit after rejection
- [ ] PAN is encrypted in database (not plaintext)
- [ ] Aadhaar only stores last 4 digits
- [ ] File cleanup on upload error
- [ ] Pagination works on admin KYC list
- [ ] Status filters work on admin KYC list

---

## Configuration Requirements

### Environment Variables
```
ENCRYPTION_KEY=<32-byte key for AES-256-CBC> (optional, derives from SECRET_KEY)
SECRET_KEY=<secret key for APP>
NODE_ENV=production
```

### Folder Permissions
- `d:\zenpay-V2\ZenoPay\public\uploads\kyc\` must be writable by Node process

---

## File Summary Table

| File Path | Type | Status | Purpose |
|-----------|------|--------|---------|
| Models/KYC.js | NEW | ✓ | KYC schema with encryption |
| Models/ZenoPayUser.js | UPDATED | ✓ | Added kycStatus, kycTier |
| Middleware/kycUpload.js | NEW | ✓ | Multer config for uploads |
| Controllers/KYCController.js | UPDATED | ✓ | All KYC logic (user + admin) |
| views/user/kyc-status.ejs | NEW | ✓ | User KYC status page |
| views/user/kyc-submit.ejs | NEW | ✓ | KYC submission form |
| views/admin/kyc-list.ejs | NEW | ✓ | Admin KYC list |
| views/admin/kyc-detail.ejs | NEW | ✓ | Admin KYC review page |
| views/dashboard.ejs | UPDATED | ✓ | KYC badge section |
| Routes/userRoutes.js | UPDATED | ✓ | User KYC routes |
| Routes/adminRoutes.js | UPDATED | ✓ | Admin KYC routes |
| Controllers/DashboardController.js | UPDATED | ✓ | KYC data fetching |

---

## Compliance Notes

✓ PAN stored encrypted (never plaintext in DB)
✓ Aadhaar only last 4 digits stored (data minimization)
✓ Document storage in isolated folder
✓ Admin audit trail (reviewedBy, timestamps)
✓ User can resubmit after rejection
✓ Clear status tracking and transparency
✓ Secure file upload with validation
✓ Session-based admin access control
