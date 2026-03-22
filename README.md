# ZenoPay V1

ZenoPay is a full-stack digital payments platform built with Node.js, Express, MongoDB, and EJS. It includes user-facing payment workflows, merchant capabilities, and a role-based admin back office.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![EJS](https://img.shields.io/badge/EJS-Templates-B4CA65)](https://ejs.co/)

## Live Demo

🔗 https://zenopay.me

## Core Features

### User Side

- User authentication and session management
- Wallet and bank account flows
- Send/request money workflows
- KYC and profile management
- Transaction history and receipts
- Referral and notifications support
- Blog and newsletter pages

### Admin Side

- Secure admin authentication and RBAC middleware
- Merchant and user management
- KYC review flows
- Bank/payment gateway operations
- Refund and transaction oversight
- Privacy policy and content/admin operations
- Dashboard and operational reporting pages

### Platform/Backend

- Express + EJS app with `express-ejs-layouts`
- MongoDB persistence via Mongoose
- Session storage with MongoDB fallback handling
- File upload support and static asset serving
- Jest test setup for controllers/services/middleware

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **Views:** EJS, express-ejs-layouts
- **Auth/Session:** express-session, connect-mongodb-session, bcryptjs
- **Utilities:** multer, nodemailer, axios, pdfkit, qrcode
- **Testing:** Jest, Supertest

## Project Structure (high level)

- `app.js` — main app bootstrap
- `Controllers/`, `Models/`, `Routes/`, `Services/` — core backend modules (inside `ZenoPay/`)
- `Admin/` — active admin controllers/middleware/routes/public assets (inside `ZenoPay/Admin`)
- `Merchant/` — active merchant routes/controllers (inside `ZenoPay/Merchant`)
- `views/` — EJS templates
- `public/` — static assets
- `tests/` — test suites

> Note: this README describes the runtime app under `ZenoPay/`.

## Local Setup

### 1) Clone and install

- Clone repository
- Move into `ZenoPay/`
- Install dependencies with `npm install`

### 2) Configure environment

- Copy `.env.example` to `.env`
- Fill required values (at minimum: database, session secret, and any provider keys you use)

### 3) Run the app

- Development: `npm start`
- Optional startup with template validation: `npm run start:checked`

The server runs on `PORT` (default `3000`).

## Available Scripts

- `npm start` — start app with nodemon
- `npm run start:checked` — run EJS checks then start
- `npm run check:ejs` — validate EJS templates
- `npm run seed:plans` — seed pricing plans
- `npm test` — run tests with coverage
- `npm run test:unit` — run unit tests
- `npm run test:integration` — run integration tests
- `npm run test:middleware` — run middleware tests

## Environment Variables

Use `.env.example` as the full reference. Common keys include:

### App & DB

- `NODE_ENV`
- `PORT`
- `MONGO_URI`
- `TEST_MONGO_URI`
- `SESSION_SECRET`

### Email/SMS

- `EMAIL_PROVIDER`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
- `SENDGRID_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_API_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### Payments

- `RAZORPAY_KEY`, `RAZORPAY_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`, `PAYPAL_MODE`

### Storage & Security

- `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`

### URLs & Feature Flags

- `FRONTEND_URL`, `ADMIN_URL`, `MERCHANT_URL`
- `ENABLE_2FA`, `ENABLE_EMAIL_VERIFICATION`, `ENABLE_KYC_VERIFICATION`

## Screenshots

Add screenshots/gifs here (recommended):

- User dashboard
- Admin dashboard
- Merchant dashboard
- Transaction flow

## Notes

- Do **not** commit `.env` files.
- Temporary audit artifacts are ignored via `.gitignore` (`tmp_cleanup_audit/`).

