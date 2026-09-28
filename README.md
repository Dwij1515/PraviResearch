# PRAVI INFRA — Municipal Infrastructure Asset Management System (IAMS)
### Authoritative Asset Ledger & Lifecycle Engine for Ahmedabad Municipal Corporation (AMC)

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Sharded-forestgreen.svg)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-purple.svg)](https://vitejs.dev/)

---

## 🏛️ Overview

**PRAVI INFRA** is an enterprise-grade municipal infrastructure governance platform and authoritative asset ledger built for the **Ahmedabad Municipal Corporation (AMC)**. It bridges physical infrastructure assets (roads, bridges, water treatment plants, municipal schools, hospitals, transit networks, and smart city grids) with real-time operational governance.

### Core Highlights
- ⚡ **Real-Time Loader Analytics & Telemetry Engine:** Live round-trip latency tracking, SWR in-memory caching delivering sub-millisecond (0ms) data retrieval, and automated 5-point benchmark stress tests.
- 🎨 **Next-Gen Curated Theme System:** 1-click theme switcher featuring **Cyber Obsidian** (Dark Glassmorphic), **Executive Daylight** (Crisp Light), and **Cyber Neon** (Technical Command Center).
- 🔄 **Deterministic 11-Stage Lifecycle State Machine:** Strict transitions (`PLANNING` → `PROCUREMENT` → `INSTALLATION` → `COMMISSIONING` → `OPERATIONAL` → `UNDER_INSPECTION` → `NEEDS_REPAIR` → `UNDER_MAINTENANCE` → `OUT_OF_SERVICE` → `DECOMMISSIONED` → `DISPOSED`).
- 🔒 **Tamper-Evident SHA-256 Audit Chaining:** Cryptographically linked immutable ledger verifying municipal actions and preventing retroactive data tampering.
- 🛡️ **Role-Based Access Control (RBAC):** Scoped access control for 6 municipal roles across AMC departments.
- 📍 **Geo-Spatial Mapping & QR Passports:** Leaflet GeoJSON mapping with cryptographic QR identifiers for field engineers.

---

## 👥 Demo Officer Credentials

> **Universal Demo Password:** `Password@123`

| Role | Email | Scope / Department | Responsibilities |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@amc.gov.in` | Global Citywide | Global user provisioning, audit compliance, system telemetry |
| **Director** | `director.pwd@amc.gov.in` | `AMC-PWD` | High-level condition heatmaps, budget vs expenditure, retirement sign-off |
| **Asset Manager** | `manager.pwd@amc.gov.in` | `AMC-PWD` | Asset registration, lifecycle transitions, work order dispatch |
| **Field Inspector**| `inspector.pwd@amc.gov.in`| `AMC-PWD` | Rapid mobile inspections, condition scoring, defect alerts |
| **Contractor** | `contractor.infra@amc.gov.in`| `AMC-PWD` | Work order updates, actual repair costs, completion logs |
| **Auditor** | `auditor.gujarat@amc.gov.in` | State Local Fund | Read-only tamper-evident audit logs and financial verification |

---

## 📁 Repository Structure

```
PraviResearch/
├── client/                     # React 19 + Vite Frontend SPA
│   ├── src/
│   │   ├── components/         # Dashboard, Assets, Analytics, Layout components
│   │   ├── context/            # AuthContext, ThemeContext, TelemetryContext
│   │   ├── pages/              # Dashboard, Assets, Inspections, WorkOrders, etc.
│   │   ├── services/           # api.js (SWR Cache), telemetry.js (Live Metrics)
│   │   └── index.css           # Design tokens, themes, glassmorphism, animations
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js + Express REST API Monolith
│   ├── src/
│   │   ├── config/             # MongoDB connection & lifecycle configuration
│   │   ├── controllers/        # Asset, auth, department, inspection controllers
│   │   ├── middleware/         # RBAC, audit logging, error handlers
│   │   ├── models/             # Mongoose schemas (Assets, Users, Audit, etc.)
│   │   └── routes/             # Versioned REST endpoints (/api/v1/...)
│   ├── seeds/                  # AMC municipal departments & demo accounts seed
│   ├── tests/                  # Automated 99-assertion verification test suites
│   └── package.json
│
├── .gitignore                  # Global ignore rules (node_modules, .env, dist)
└── README.md                   # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18+ (tested on Node v22)
- **MongoDB:** MongoDB Atlas cluster or local MongoDB instance (v6+)

### 2. Backend Setup
```bash
cd server
npm install

# Copy environment template and configure MONGODB_URI & JWT_SECRET
cp .env.example .env

# (Optional) Seed AMC municipal departments and demo accounts
npm run seed

# Run automated backend test suites (99 assertions)
npm test

# Start backend dev server (port 5000)
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install

# Start Vite dev server (port 5173)
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser to access the application.

---

## 🧪 Verification & Acceptance Tests

The backend includes a comprehensive 99-assertion acceptance test suite verifying:
1. **Phase 1 Verification:** Authentication, password hashing, JWT tokens, RBAC permissions, and SHA-256 genesis audit chaining (41 tests).
2. **Phase 2 Verification:** GeoJSON spatial validation, QR generation, 11-stage canonical lifecycle transitions, condition scoring, and soft-delete archiving (58 tests).

Run the full suite:
```bash
cd server
npm test
```

---

## 📄 License
ISC License — Developed for the Pravi Hackathon / Ahmedabad Municipal Corporation Infrastructure Initiative.
