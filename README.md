<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1E3A8A,50:3B82F6,100:8B5CF6&height=220&section=header&text=ZenoPay&fontSize=90&fontColor=ffffff&fontAlignY=38&desc=Modern%20Fintech%20Payment%20Platform%20V1&descAlignY=60&descSize=18&descColor=93C5FD" width="100%" alt="ZenoPay Banner"/>

<br/>

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-1E3A8A?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-10B981?style=for-the-badge&logo=mongodb&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-3B82F6?style=for-the-badge&logo=ejs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F59E0B?style=for-the-badge&logo=javascript&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-8B5CF6?style=for-the-badge&logo=css3&logoColor=white)

<br/>

![GitHub last commit](https://img.shields.io/github/last-commit/lucifers-0666/ZenoPay-V1?style=flat-square&color=3B82F6&label=Last%20Commit)
![GitHub stars](https://img.shields.io/github/stars/lucifers-0666/ZenoPay-V1?style=flat-square&color=F59E0B&label=Stars)
![GitHub issues](https://img.shields.io/github/issues/lucifers-0666/ZenoPay-V1?style=flat-square&color=8B5CF6&label=Issues)
![License](https://img.shields.io/badge/License-MIT-10B981?style=flat-square)
![Commits](https://img.shields.io/badge/Commits-100%2B-3B82F6?style=flat-square)

<br/>

> ***⚡ A sleek, secure, and scalable fintech payment platform — built with precision for the modern web.***

<br/>

[![View Demo](https://img.shields.io/badge/🚀_View_Demo-3B82F6?style=for-the-badge)](https://github.com/lucifers-0666/ZenoPay-V1)
[![Report Bug](https://img.shields.io/badge/🐛_Report_Bug-8B5CF6?style=for-the-badge)](https://github.com/lucifers-0666/ZenoPay-V1/issues)
[![Request Feature](https://img.shields.io/badge/✨_Request_Feature-10B981?style=for-the-badge)](https://github.com/lucifers-0666/ZenoPay-V1/issues)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Contributors](#-contributors--commit-stats)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🧩 About the Project

**ZenoPay** is a full-stack fintech payment platform that simplifies digital transactions with a clean admin panel, secure session-based authentication, real-time notification polling, KYC verification flow, and a wallet system built for Indian payment workflows (UPI, QR, P2P).

### ✨ Key Highlights

- 💳 P2P wallet transfers with PIN-verified payment flow and confetti success screen
- 🔐 Session-based auth with OTP email verification + forgot password flow
- 📊 Admin dashboard with full user and transaction control
- 🔔 Real-time notification polling every 25 seconds
- 🪪 Multi-tier KYC verification with document upload
- 🗓️ Scheduled payments runner service with cron support
- 🔒 CSRF protection, separate admin/user session isolation
- 📱 Fully responsive — mobile bottom nav + desktop sidebar
- 🌐 Clean MVC architecture: Node.js + Express + MongoDB + EJS

---

## 🛠️ Tech Stack

<table>
  <tr>
    <td valign="top"><b>🌐 Frontend</b></td>
    <td>
      <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white"/>
      <img src="https://img.shields.io/badge/CSS3-8B5CF6?style=flat-square&logo=css3&logoColor=white"/>
      <img src="https://img.shields.io/badge/JavaScript-F59E0B?style=flat-square&logo=javascript&logoColor=black"/>
      <img src="https://img.shields.io/badge/EJS-3B82F6?style=flat-square&logo=ejs&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td valign="top"><b>⚙️ Backend</b></td>
    <td>
      <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white"/>
      <img src="https://img.shields.io/badge/Express.js-1E3A8A?style=flat-square&logo=express&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td valign="top"><b>🗄️ Database</b></td>
    <td>
      <img src="https://img.shields.io/badge/MongoDB-10B981?style=flat-square&logo=mongodb&logoColor=white"/>
      <img src="https://img.shields.io/badge/Mongoose-800000?style=flat-square&logo=mongoose&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td valign="top"><b>🔐 Auth & Security</b></td>
    <td>
      <img src="https://img.shields.io/badge/Session_Auth-3B82F6?style=flat-square&logo=shield&logoColor=white"/>
      <img src="https://img.shields.io/badge/bcrypt-1E3A8A?style=flat-square&logo=letsencrypt&logoColor=white"/>
      <img src="https://img.shields.io/badge/CSRF_Protection-8B5CF6?style=flat-square&logo=security&logoColor=white"/>
      <img src="https://img.shields.io/badge/OTP_via_Email-10B981?style=flat-square&logo=gmail&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td valign="top"><b>🔧 Tools</b></td>
    <td>
      <img src="https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white"/>
      <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white"/>
      <img src="https://img.shields.io/badge/Postman-FF6C37?style=flat-square&logo=postman&logoColor=white"/>
      <img src="https://img.shields.io/badge/Figma-F24E1E?style=flat-square&logo=figma&logoColor=white"/>
      <img src="https://img.shields.io/badge/VS_Code-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white"/>
    </td>
  </tr>
</table>

---

## 🏗️ System Architecture

### Application Flowchart

```mermaid
flowchart TD
    A([👤 User / Admin]) --> B[Browser — EJS Frontend]
    B --> C{Auth Middleware\nSession Check}

    C -- ❌ No Session --> D[Login / Register Page]
    D --> E[OTP Email Verification]
    E --> C

    C -- ✅ Session Valid --> F{Role Check}

    F -- 👤 User --> G[User Router]
    F -- 🛡️ Admin --> H[Admin Router]

    G --> G1[Auth Controller]
    G --> G2[Wallet Controller]
    G --> G3[Transaction Controller]
    G --> G4[KYC Controller]
    G --> G5[Notification Controller]

    H --> H1[Admin Auth Controller]
    H --> H2[User Management]
    H --> H3[Transaction Monitor]
    H --> H4[Analytics]

    G1 & G2 & G3 & G4 & G5 --> DB[(🗄️ MongoDB)]
    H1 & H2 & H3 & H4 --> DB

    DB --> RES{Response Type}
    RES -- EJS Render --> B
    RES -- JSON API --> B

    style A fill:#1E3A8A,color:#fff
    style DB fill:#10B981,color:#fff
    style C fill:#3B82F6,color:#fff
    style F fill:#8B5CF6,color:#fff
    style B fill:#2563EB,color:#fff
```

---

### 💳 Payment Flow — Sequence Diagram

```mermaid
sequenceDiagram
    actor User
    participant UI as 🌐 EJS Frontend
    participant MW as 🔐 Session Middleware
    participant API as ⚙️ Express API
    participant DB as 🗄️ MongoDB

    User->>UI: Enter credentials
    UI->>API: POST /auth/login
    API->>DB: Validate user + check email verified
    DB-->>API: User document
    API-->>UI: Set session cookie + redirect

    Note over User,DB: 🔐 All further requests carry session cookie

    User->>UI: Send Money → Enter amount + UPI/Wallet
    UI->>MW: Request with session
    MW->>API: Verified → POST /transactions/send
    API->>UI: Prompt Transaction PIN
    User->>UI: Enter 4-digit PIN
    UI->>API: POST /pin/verify
    API->>DB: Verify bcrypt PIN hash
    DB-->>API: PIN valid ✅
    API->>DB: Debit sender wallet, credit receiver
    DB-->>API: Transaction ID + updated balance
    API-->>UI: 200 OK + transaction data
    UI-->>User: 🎉 Confetti success screen + receipt
```

---

### 🔔 Notification Polling Flow

```mermaid
flowchart LR
    A[Page Load] --> B[Fetch Notifications]
    B --> C{Unread Count?}
    C -- gt 0 --> D[Show Badge + List]
    C -- 0 --> E[Hide Badge]
    D & E --> F[Wait 25 seconds]
    F --> B
    D --> G[User clicks Mark All Read]
    G --> H[POST /notifications/read-all]
    H --> B

    style A fill:#1E3A8A,color:#fff
    style H fill:#10B981,color:#fff
```

---

## 🗃️ Database Schema

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string name
        string email
        string password
        string phone
        string role
        boolean isEmailVerified
        boolean isActive
        string kycStatus
        date createdAt
    }

    WALLET {
        ObjectId _id PK
        ObjectId userId FK
        string walletId
        number balance
        string currency
        date lastUpdated
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId senderId FK
        ObjectId receiverId FK
        number amount
        string type
        string status
        string description
        string receiptId
        date timestamp
    }

    KYC {
        ObjectId _id PK
        ObjectId userId FK
        string documentType
        string documentNumber
        string status
        string tier
        date submittedAt
        date verifiedAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId userId FK
        string type
        string message
        boolean isRead
        date createdAt
    }

    SCHEDULEDPAYMENT {
        ObjectId _id PK
        ObjectId userId FK
        number amount
        string recipient
        string frequency
        date nextRunAt
        boolean isActive
    }

    LOGINHISTORY {
        ObjectId _id PK
        ObjectId userId FK
        string ipAddress
        string device
        date loginAt
    }

    USER ||--|| WALLET : "owns"
    USER ||--o{ TRANSACTION : "sends"
    USER ||--o{ TRANSACTION : "receives"
    USER ||--o| KYC : "submits"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ SCHEDULEDPAYMENT : "creates"
    USER ||--o{ LOGINHISTORY : "tracked by"
```

---

## 🚀 Features

| Feature | Description | Added By | Status |
|---------|-------------|----------|--------|
| 🔐 Session Auth | Login/register with session cookie + bcrypt | @lucifers-0666 | ✅ Done |
| 📧 OTP Verification | Email OTP for registration & login | @lucifers-0666 | ✅ Done |
| 💳 P2P Payments | Wallet-to-wallet with PIN confirm + confetti | @lucifers-0666 | ✅ Done |
| 💰 Wallet System | Top-up, withdraw, real-time balance | @lucifers-0666 | ✅ Done |
| 🔔 Live Notifications | Polling every 25s, mark-all-read API | @lucifers-0666 | ✅ Done |
| 🪪 KYC Flow | Multi-step doc upload, tier-based limits | @lucifers-0666 | ✅ Done |
| 🔒 Transaction PIN | bcrypt-hashed 4-digit PIN + lockout | @lucifers-0666 | ✅ Done |
| 🛡️ Admin Dashboard | User control, analytics, audit log | @lucifers-0666 | ✅ Done |
| 🗓️ Scheduled Payments | Cron-based recurring payment runner | @lucifers-0666 | ✅ Done |
| 📱 Mobile UI | Bottom nav, responsive across all screens | @lucifers-0666 | ✅ Done |
| 🔑 CSRF Protection | All POST routes csrf-protected | @lucifers-0666 | ✅ Done |
| 📤 Session Isolation | Separate admin/user sessions, no conflict | @lucifers-0666 | ✅ Done |
| 📊 Report Export | CSV download of transactions | — | 🚧 In Progress |
| 🌍 Multi-currency | INR, USD, and other currencies | — | 🔜 Planned |
| 🔑 2FA | TOTP-based two-factor authentication | — | 🔜 Planned |

---

## 📁 Project Structure

```
📦 ZenoPay-V1/
│
├── 📁 public/                      # Static assets
│   ├── 📁 css/                     # Per-page stylesheets
│   │   ├── dashboard.css
│   │   ├── auth.css
│   │   ├── kyc-verification.css
│   │   └── ...
│   ├── 📁 js/                      # Client-side scripts
│   └── 📁 images/                  # Icons, logos, SVGs
│
├── 📁 routes/                      # Express route files
│   ├── auth.routes.js
│   ├── user.routes.js
│   ├── transaction.routes.js
│   ├── admin.routes.js
│   └── notification.routes.js
│
├── 📁 controllers/                 # Business logic
│   ├── AuthController.js
│   ├── DashboardController.js
│   ├── TransactionController.js
│   ├── WalletController.js
│   ├── KYCController.js
│   ├── NotificationController.js
│   ├── AdminAuthController.js
│   └── ScheduledPaymentController.js
│
├── 📁 models/                      # Mongoose schemas
│   ├── User.js
│   ├── Wallet.js
│   ├── Transaction.js
│   ├── KYC.js
│   ├── Notification.js
│   ├── ScheduledPayment.js
│   ├── LoginHistory.js
│   └── PaymentGatewaySettings.js
│
├── 📁 views/                       # EJS templates
│   ├── 📁 partials/                # header.ejs, footer.ejs
│   ├── 📁 auth/                    # login, register, OTP, forgot-password
│   ├── 📁 dashboard/               # main dashboard, wallet, transactions
│   ├── 📁 admin/                   # admin panel views
│   ├── 📁 kyc/                     # kyc-submit, kyc-status, limits
│   └── 📁 user/                    # profile, settings, scheduled-payments
│
├── 📁 middleware/
│   ├── auth.middleware.js          # User session guard
│   ├── admin.middleware.js         # Admin session guard
│   └── pin.middleware.js           # PIN verification enforcer
│
├── 📁 services/
│   ├── EmailService.js             # OTP, welcome, password reset emails
│   └── ScheduledPaymentsRunner.js  # Cron job service
│
├── 📁 config/
│   └── db.js                       # MongoDB connection
│
├── 📄 .env.example
├── 📄 .gitignore
├── 📄 package.json
└── 📄 server.js                    # Entry point
```

---

## ⚙️ Getting Started

### Prerequisites

- ![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
- ![MongoDB](https://img.shields.io/badge/MongoDB-v6+-10B981?style=flat-square&logo=mongodb&logoColor=white)
- ![npm](https://img.shields.io/badge/npm-v9+-CB3837?style=flat-square&logo=npm&logoColor=white)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lucifers-0666/ZenoPay-V1.git
   cd ZenoPay-V1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Create admin user**
   ```bash
   npm run create-admin
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Visit in browser**
   ```
   http://localhost:3000        → Public/User app
   http://localhost:3000/admin  → Admin panel
   ```

---

## 🔑 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/zenopay` |
| `SESSION_SECRET` | Express session secret key | `your_super_secret` |
| `SESSION_EXPIRE` | Session max age (ms) | `86400000` |
| `EMAIL_HOST` | SMTP host for emails | `smtp.gmail.com` |
| `EMAIL_USER` | SMTP email address | `noreply@zenopay.com` |
| `EMAIL_PASS` | SMTP email password | `app_password_here` |
| `ADMIN_EMAIL` | Default admin email | `admin@zenopay.com` |
| `ADMIN_PASSWORD` | Default admin password | `Admin@123` |
| `NODE_ENV` | Environment mode | `development` |

> ⚠️ **Never commit `.env`** — use `.env.example` as reference only.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/login` | Login page |
| `POST` | `/login` | Authenticate user |
| `POST` | `/register` | Register new user |
| `POST` | `/verify-otp` | Verify email OTP |
| `POST` | `/forgot-password` | Send reset OTP |
| `POST` | `/logout` | Destroy session |

### Transactions & Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/dashboard` | User dashboard |
| `POST` | `/transactions/send` | P2P money transfer |
| `GET` | `/transactions/history` | Paginated history |
| `GET` | `/transactions/history/data` | JSON transaction data |
| `POST` | `/wallet/topup` | Add money to wallet |
| `POST` | `/wallet/withdraw` | Withdraw to bank |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/notifications` | Get all notifications |
| `POST` | `/notifications/read-all` | Mark all as read |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/dashboard` | Admin overview |
| `GET` | `/admin/users` | All users list |
| `PATCH` | `/admin/users/:id/block` | Block/unblock user |
| `GET` | `/admin/transactions` | All transactions |

---

## 👥 Contributors & Commit Stats

<div align="center">

### 🏆 Top Contributors

<table>
  <tr>
    <td align="center" width="220px">
      <a href="https://github.com/lucifers-0666">
        <img src="https://github.com/lucifers-0666.png" width="96px" style="border-radius:50%; border: 3px solid #3B82F6"/><br/>
        <b>lucifers-0666</b>
      </a><br/><br/>
      <img src="https://img.shields.io/badge/👑_Lead_Developer-3B82F6?style=flat-square"/>
      <br/><br/>
      <sub><b>100+ commits · Core Platform</b></sub><br/>
      <sub>Auth · Wallet · KYC · Admin · UI/UX</sub><br/>
      <sub>Notification System · Cron Runner</sub>
    </td>
    <td align="center" width="220px">
      <!-- ⚠️ Replace CONTRIBUTOR_USERNAME and CONTRIBUTOR_NAME below -->
      <a href="https://github.com/CONTRIBUTOR_USERNAME">
        <img src="https://github.com/CONTRIBUTOR_USERNAME.png" width="96px" style="border-radius:50%; border: 3px solid #8B5CF6"/><br/>
        <b>CONTRIBUTOR_NAME</b>
      </a><br/><br/>
      <img src="https://img.shields.io/badge/🤝_Contributor-8B5CF6?style=flat-square"/>
      <br/><br/>
      <sub><b>X commits · [Feature Area]</b></sub><br/>
      <sub>[What they built]</sub>
    </td>
  </tr>
</table>

---

### 📊 Commit Activity

```
📌 Contribution Breakdown (100+ commits scanned):

  lucifers-0666    ████████████████████████████████  100+ commits  🏆 Most Commits
                   Core Auth · Wallet Engine · KYC Flow
                   Admin Panel · Notification Polling
                   Session Security · Cron Runner · UI Design

  [Contributor 2]  ████████                           X commits
                   [Feature they worked on]
```

---

### 🔬 Who Built What

| Contributor | Feature | Area |
|-------------|---------|------|
| [@lucifers-0666](https://github.com/lucifers-0666) 👑 | P2P Wallet + Transaction PIN System | Backend + Frontend |
| [@lucifers-0666](https://github.com/lucifers-0666) | OTP Email Verification + Session Isolation | Security |
| [@lucifers-0666](https://github.com/lucifers-0666) | Multi-Tier KYC Flow + Limits Page | Compliance |
| [@lucifers-0666](https://github.com/lucifers-0666) | Real-time Notification Polling (25s) | Real-time |
| [@lucifers-0666](https://github.com/lucifers-0666) | Admin Panel + Dashboard Redesign | Admin |
| [@lucifers-0666](https://github.com/lucifers-0666) | Scheduled Payments Cron Runner | Automation |
| [@lucifers-0666](https://github.com/lucifers-0666) | ZenoPay Brand Design System | UI/UX |
| @CONTRIBUTOR_USERNAME | [Their unique feature] | [Area] |

---

### 🌐 Live Contributor Graph

[![Contributors](https://contrib.rocks/image?repo=lucifers-0666/ZenoPay-V1)](https://github.com/lucifers-0666/ZenoPay-V1/graphs/contributors)

</div>

---

## 🗺️ Roadmap

- [x] Session-based auth with OTP email verification
- [x] P2P wallet transfer with transaction PIN
- [x] KYC multi-step verification flow
- [x] Real-time notification polling
- [x] Scheduled payments cron service
- [x] Admin panel with user & transaction management
- [x] CSRF protection + session isolation
- [x] Mobile responsive with bottom nav
- [ ] CSV/PDF export for transaction reports
- [ ] Razorpay / Stripe payment gateway integration
- [ ] Multi-currency support (INR, USD)
- [ ] TOTP two-factor authentication (2FA)
- [ ] Real-time transactions with Socket.io
- [ ] Mobile app (React Native / Kotlin)

---

## 📄 License

Distributed under the **MIT License**.

```
MIT License — Copyright (c) 2026 lucifer's lab (lucifers-0666)
```

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:8B5CF6,50:3B82F6,100:1E3A8A&height=130&section=footer&text=Made%20with%20❤️%20by%20lucifer's%20lab&fontSize=18&fontColor=ffffff&fontAlignY=65" width="100%" alt="Footer"/>

**⭐ If ZenoPay helped you, give it a star!**

[![GitHub followers](https://img.shields.io/github/followers/lucifers-0666?style=social)](https://github.com/lucifers-0666)

</div>
