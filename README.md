<div align="center">

<!-- LOGO / BANNER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f3460,50:16213e,100:0f3460&height=200&section=header&text=ZenoPay&fontSize=80&fontColor=4fc3f7&fontAlignY=38&desc=Modern%20Fintech%20Payment%20Platform&descAlignY=60&descSize=20&descColor=90caf9" width="100%" alt="ZenoPay Banner"/>

<br/>

<!-- TECH BADGES -->







<br/>

<!-- STATUS BADGES -->






<br/>

> ***⚡ A sleek, secure, and scalable fintech payment platform built for the modern web.***

<br/>

[
[
[

</div>

***

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Contributors](#-contributors)
- [Roadmap](#-roadmap)
- [License](#-license)

***

## 🧩 About the Project

**ZenoPay** is a full-stack fintech payment platform that simplifies digital transactions with a clean admin panel, secure authentication, and real-time transaction management. Built to handle payments, user wallets, and financial reporting — all from a beautiful, responsive dashboard.

### ✨ Key Highlights

- 💳 Seamless payment flow with real-time status updates
- 🔐 JWT-based secure authentication system
- 📊 Admin dashboard with live transaction analytics
- 👤 User wallet management with balance tracking
- 📱 Fully responsive — works on all devices
- 🌐 RESTful API architecture with clean MVC structure

***

## 📸 Screenshots

> Add your screenshots in the `assets/screenshots/` folder

| Dashboard | Transactions | User Panel |
|-----------|-------------|------------|
|  |  |  |

***

## 🛠️ Tech Stack

<table>
  <tr>
    <td><b>🌐 Frontend</b></td>
    <td>
      <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white"/>
      <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white"/>
      <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
      <img src="https://img.shields.io/badge/EJS-B4CA65?style=flat-square&logo=ejs&logoColor=black"/>
    </td>
  </tr>
  <tr>
    <td><b>⚙️ Backend</b></td>
    <td>
      <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white"/>
      <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td><b>🗄️ Database</b></td>
    <td>
      <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white"/>
      <img src="https://img.shields.io/badge/Mongoose-880000?style=flat-square&logo=mongoose&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td><b>🔧 Tools & DevOps</b></td>
    <td>
      <img src="https://img.shields.io/badge/Git-F05032?style=flat-square&logo=git&logoColor=white"/>
      <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white"/>
      <img src="https://img.shields.io/badge/Postman-FF6C37?style=flat-square&logo=postman&logoColor=white"/>
      <img src="https://img.shields.io/badge/VS_Code-007ACC?style=flat-square&logo=visualstudiocode&logoColor=white"/>
      <img src="https://img.shields.io/badge/Figma-F24E1E?style=flat-square&logo=figma&logoColor=white"/>
    </td>
  </tr>
  <tr>
    <td><b>🔐 Auth & Security</b></td>
    <td>
      <img src="https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white"/>
      <img src="https://img.shields.io/badge/bcrypt-003A70?style=flat-square&logo=letsencrypt&logoColor=white"/>
    </td>
  </tr>
</table>

***

## 🏗️ System Architecture

### Application Flow

```mermaid
flowchart TD
    A([👤 User / Admin]) --> B[Browser - EJS Frontend]
    B --> C{Authentication\nMiddleware}
    C -- ❌ Unauthorized --> D[Login Page]
    C -- ✅ Authorized --> E[Express.js Router]

    E --> F[Auth Controller]
    E --> G[Transaction Controller]
    E --> H[User Controller]
    E --> I[Admin Controller]

    F & G & H & I --> J[(MongoDB Database)]

    J --> K[Mongoose Models]
    K --> L{Response}

    L -- JSON API --> M[API Response]
    L -- EJS Render --> N[Dashboard View]

    N --> B
    M --> B

    style A fill:#0f3460,color:#fff
    style B fill:#16213e,color:#4fc3f7
    style J fill:#47A248,color:#fff
    style C fill:#1a1a2e,color:#ffd700
```

***

### User Journey — Payment Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend as 🌐 Frontend (EJS)
    participant Auth as 🔐 Auth Middleware
    participant API as ⚙️ Express API
    participant DB as 🗄️ MongoDB

    User->>Frontend: Login with credentials
    Frontend->>API: POST /api/auth/login
    API->>DB: Validate user credentials
    DB-->>API: User document
    API-->>Frontend: JWT Token + User data
    Frontend-->>User: Redirect to Dashboard

    User->>Frontend: Initiate Payment
    Frontend->>Auth: Attach JWT Token
    Auth->>API: Verified request → POST /api/transactions
    API->>DB: Create transaction record
    DB-->>API: Transaction ID + status
    API-->>Frontend: Transaction response
    Frontend-->>User: Payment confirmation + receipt
```

***

### Admin Dashboard Flow

```mermaid
flowchart LR
    A[Admin Login] --> B[Admin Dashboard]
    B --> C[User Management]
    B --> D[Transaction Monitor]
    B --> E[Analytics & Reports]
    B --> F[Settings]

    C --> C1[View All Users]
    C --> C2[Block / Unblock User]
    C --> C3[Reset User Password]

    D --> D1[Pending Transactions]
    D --> D2[Completed Transactions]
    D --> D3[Failed Transactions]
    D --> D4[Refund Processing]

    E --> E1[Revenue Charts]
    E --> E2[Transaction Volume]
    E --> E3[Export Reports]

    style A fill:#0f3460,color:#fff
    style B fill:#16213e,color:#4fc3f7
```

***

## 🗃️ Database Schema

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string name
        string email
        string password
        string role
        number walletBalance
        boolean isActive
        date createdAt
        date updatedAt
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId senderId FK
        ObjectId receiverId FK
        number amount
        string status
        string type
        string description
        date timestamp
    }

    WALLET {
        ObjectId _id PK
        ObjectId userId FK
        number balance
        string currency
        date lastUpdated
    }

    ADMIN {
        ObjectId _id PK
        ObjectId userId FK
        string permissions
        date lastLogin
    }

    USER ||--o{ TRANSACTION : "sends"
    USER ||--o{ TRANSACTION : "receives"
    USER ||--|| WALLET : "owns"
    USER ||--o| ADMIN : "can be"
```

***

## 🚀 Features

| Feature | Description | Added By | Status |
|---------|-------------|----------|--------|
| 🔐 User Authentication | JWT-based login/register with bcrypt password hashing | @lucifers-0666 | ✅ Done |
| 💳 Payment Processing | Send & receive money between user wallets | @lucifers-0666 | ✅ Done |
| 📊 Admin Dashboard | Full admin panel with user and transaction control | @lucifers-0666 | ✅ Done |
| 👤 User Management | View, block/unblock users from admin panel | @lucifers-0666 | ✅ Done |
| 📈 Transaction History | Paginated transaction logs with filter/search | @lucifers-0666 | ✅ Done |
| 💰 Wallet System | Per-user balance tracking and management | @lucifers-0666 | ✅ Done |
| 📱 Responsive UI | Mobile-first design for all screen sizes | @lucifers-0666 | ✅ Done |
| 📤 Report Export | Download transaction reports as CSV | — | 🚧 In Progress |
| 🔔 Notifications | Real-time alerts for payment events | — | 🔜 Planned |
| 🌍 Multi-currency | Support for INR, USD and other currencies | — | 🔜 Planned |

***

## 📁 Project Structure

```
📦 ZenoPay-V1/
│
├── 📁 public/                  # Static assets
│   ├── 📁 css/                 # Stylesheets
│   ├── 📁 js/                  # Client-side scripts
│   └── 📁 images/              # Images & icons
│
├── 📁 routes/                  # Express route handlers
│   ├── 📄 auth.routes.js       # Authentication routes
│   ├── 📄 user.routes.js       # User management routes
│   ├── 📄 transaction.routes.js # Payment/transaction routes
│   └── 📄 admin.routes.js      # Admin panel routes
│
├── 📁 controllers/             # Business logic
│   ├── 📄 auth.controller.js
│   ├── 📄 user.controller.js
│   ├── 📄 transaction.controller.js
│   └── 📄 admin.controller.js
│
├── 📁 models/                  # Mongoose schemas
│   ├── 📄 User.model.js
│   ├── 📄 Transaction.model.js
│   └── 📄 Wallet.model.js
│
├── 📁 views/                   # EJS templates
│   ├── 📁 layouts/             # Layout templates
│   ├── 📁 partials/            # Reusable components
│   ├── 📁 auth/                # Login / Register pages
│   ├── 📁 dashboard/           # Dashboard views
│   └── 📁 admin/               # Admin panel views
│
├── 📁 middleware/              # Custom middleware
│   ├── 📄 auth.middleware.js   # JWT verification
│   └── 📄 admin.middleware.js  # Admin role check
│
├── 📁 config/                  # Configuration files
│   └── 📄 db.js                # MongoDB connection
│
├── 📄 .env                     # Environment variables (not committed)
├── 📄 .env.example             # Environment variable template
├── 📄 .gitignore
├── 📄 package.json
└── 📄 server.js                # Entry point
```

***

## ⚙️ Getting Started

### Prerequisites

Make sure you have the following installed:

- 
- 
- 

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

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values (see Environment Variables section below)
   ```

4. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

***

## 🔑 Environment Variables

Create a `.env` file in the root directory. Reference `.env.example`:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port number | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/zenopay` |
| `JWT_SECRET` | Secret key for JWT signing | `your_super_secret_key` |
| `JWT_EXPIRE` | JWT token expiry duration | `7d` |
| `ADMIN_EMAIL` | Default admin email | `admin@zenopay.com` |
| `ADMIN_PASSWORD` | Default admin password | `Admin@123` |
| `NODE_ENV` | Environment mode | `development` |

> ⚠️ **Never commit your `.env` file.** Always use `.env.example` as the template.

***

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and get JWT token |
| `POST` | `/api/auth/logout` | Logout user |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions` | Get all transactions (paginated) |
| `POST` | `/api/transactions/send` | Initiate a payment |
| `GET` | `/api/transactions/:id` | Get single transaction |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | Get all users |
| `PATCH` | `/api/admin/users/:id/block` | Block/unblock a user |
| `GET` | `/api/admin/analytics` | Get dashboard analytics |

***

## 👥 Contributors

<div align="center">

### 🏆 Who Built What

| Contributor | Role | Unique Features Built |
|-------------|------|-----------------------|
| [@lucifers-0666](https://github.com/lucifers-0666) | 🧑‍💻 Lead Developer | Payment Engine, Auth System, Admin Panel, UI/UX Design |

***

### 📊 Contribution Stats

```
📌 Commit Activity:

@lucifers-0666  ████████████████████████████  Core Platform
```

***

### 🤝 Contributor Card

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/lucifers-0666">
        <img src="https://github.com/lucifers-0666.png" width="90px" style="border-radius:50%"/><br/>
        <b>lucifers-0666</b>
      </a><br/>
      <sub>🔧 Lead Developer</sub><br/>
      <sub>⭐ Payment System · Auth · Admin Panel</sub>
    </td>
    <!-- Add more contributors here as the project grows -->
  </tr>
</table>

***

### 🌐 Live Contributors Graph

[

</div>

***

## 🗺️ Roadmap

- [x] User authentication (JWT + bcrypt)
- [x] Wallet system with balance management
- [x] Admin dashboard with user control
- [x] Transaction history with filters
- [x] Responsive UI design
- [ ] Real-time notifications (Socket.io)
- [ ] CSV/PDF report export
- [ ] Payment gateway integration (Razorpay / Stripe)
- [ ] Multi-currency support
- [ ] Two-factor authentication (2FA)
- [ ] Mobile app (React Native / Kotlin)

***

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

```
MIT License — Copyright (c) 2025 lucifers-0666
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify, merge, publish, distribute, sublicense...
```

***

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f3460,50:16213e,100:0f3460&height=120&section=footer&text=Made%20with%20❤️%20by%20lucifers-0666&fontSize=18&fontColor=4fc3f7&fontAlignY=65" width="100%" alt="Footer"/>

**⭐ Star this repo if you found it helpful!**

[

</div>
