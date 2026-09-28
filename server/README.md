# Municipal Infrastructure Asset Management System (IAMS) — Backend API
## Ahmedabad Municipal Corporation (AMC) & Gujarat Urban Development Framework
**Specification Reference:** `Version 2.0.0-SEALED-SPEC + Amendment 1`  
**Current Milestone:** Phase 1 Complete (Backend Foundation, Database Schemas, Authentication & RBAC)

---

## 1. Overview
This backend provides the authoritative ledger of record and governance API for municipal infrastructure assets in Ahmedabad. Built as a clean, modular Express.js / Node.js monolith with MongoDB and Mongoose, it enforces strict canonical enums, tamper-evident SHA-256 audit chaining, role-based access control (RBAC), and departmental scoping.

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the `server` directory:

```bash
cp .env.example .env
```

### Environment Variables
| Variable | Description | Default / Example Value |
|:---|:---|:---|
| `PORT` | HTTP Server Port | `5000` |
| `MONGODB_URI` | MongoDB Connection String | `mongodb://127.0.0.1:27017/iams_amc_db` |
| `JWT_SECRET` | Secret key for signing HMAC-SHA256 JWTs | *(Set a strong secret in production)* |
| `JWT_EXPIRES_IN` | Token expiration period | `1d` |
| `CLIENT_ORIGIN` | Allowed CORS frontend origin | `http://localhost:5173` |
| `NODE_ENV` | Runtime environment mode | `development` |

---

## 3. Installation & Database Setup

### Prerequisites
- **Node.js:** v18+ (Verified on Node v22.14.0)
- **MongoDB:** v6+ Community/Enterprise (running locally on port 27017 or remote cluster)

### Installation
```bash
cd server
npm install
```

### Seed Database
Seeds the 6 Ahmedabad municipal departments, 7 demo user accounts across all roles, and seals the genesis audit record:
```bash
npm run seed
```

### Start Development Server
```bash
npm run dev
# or: npm start
```

### Run Phase 1 Verification Suite
Executes the automated 41-assertion acceptance test suite verifying schemas, auth, RBAC, and audit chaining:
```bash
npm test
```

---

## 4. Demo Credentials (Seeded)

All demo accounts share the password: **`Password@123`**

| Role | Email | Assigned Department | Permissions Scope |
|:---|:---|:---|:---|
| **`ADMIN`** | `admin@amc.gov.in` | *(None / Global)* | Global municipal write/read, user provisioning, audit access. |
| **`DIRECTOR`** | `director.pwd@amc.gov.in` | `AMC-PWD` | Department-wide read, inspection review, audit access. |
| **`ASSET_MANAGER`** | `manager.pwd@amc.gov.in` | `AMC-PWD` | Asset registration, work order dispatch, inspection review. |
| **`INSPECTOR`** | `inspector.pwd@amc.gov.in` | `AMC-PWD` | Field audit execution, condition rating submission. |
| **`CONTRACTOR`** | `contractor.infra@amc.gov.in`| `AMC-PWD` | Assigned work order progress and cost reporting. |
| **`AUDITOR`** | `auditor.gujarat@amc.gov.in` | *(State Local Fund)* | Read-only global access, tamper-evident audit ledger access. |
| *Inactive Test* | `inactive.officer@amc.gov.in`| `AMC-PWD` | Disabled account for testing HTTP 403 rejection. |

---

## 5. Seeded Municipal Departments (Ahmedabad)

| Department Code | Department Name | Zone | Annual Budget (INR) |
|:---|:---|:---:|:---|
| **`AMC-PWD`** | Public Works Department (Road & Building) | `CENTRAL` | ₹15,00,00,000 (₹15.00 Cr) |
| **`AMC-HEALTH`** | Health & Family Welfare Department | `WEST` | ₹12,00,00,000 (₹12.00 Cr) |
| **`AMC-EDU`** | Municipal School Board (Education Dept) | `SOUTH` | ₹8,50,00,000 (₹8.50 Cr) |
| **`AMC-WATER`** | Water Supply & Sewerage Department | `NORTH` | ₹14,00,00,000 (₹14.00 Cr) |
| **`AMC-SMARTCITY`** | Urban Development & Smart City Mission | `WEST` | ₹9,50,00,000 (₹9.50 Cr) |
| **`AMC-TRANS`** | Transport Department (AMTS / BRTS Janmarg) | `CENTRAL` | ₹11,00,00,000 (₹11.00 Cr) |

---

## 6. Database Collections (Exactly 8)

1. **`users`** — Accounts, bcrypt hashes, canonical roles, active state.
2. **`departments`** — Municipal departments, codes, zones, budgets in INR.
3. **`assets`** — Physical asset inventory, GeoJSON 2dsphere coordinates, condition scores, INR financials, QR tokens.
4. **`lifecycle_events`** — Historical state transition event log.
5. **`inspections`** — Field checklists, condition scores, defects, manager review metadata.
6. **`work_orders`** — Maintenance orders, contractor assignments, costs, safety clearance fields.
7. **`audit_logs`** — Tamper-evident ledger with SHA-256 hash chaining.
8. **`ai_insights`** — Explainable PADI risk scores and advisory records.

*(Notice: Standalone `documents` collection is deliberately excluded per Version 2.0.0-SEALED-SPEC Option B; evidence URLs are attached directly to relevant entities).*

---

## 7. Phase 1 Implemented API Endpoints

Base URL: `http://localhost:5000/api/v1`

| Method | Path | Auth Required | Authorized Roles | Description |
|:---|:---|:---:|:---:|:---|
| `GET` | `/health` | No | Public | Returns service status, uptime, and database connectivity. |
| `POST` | `/auth/login` | No | Public | Authenticates credentials; returns Bearer JWT + profile; logs audit record. |
| `GET` | `/auth/me` | Yes | All Roles | Returns authenticated officer profile and populated department. |
| `GET` | `/departments` | Yes | All Roles | Lists all 6 Ahmedabad municipal departments. |
| `GET` | `/departments/:id` | Yes | All Roles | Returns department details by ID. |
| `GET` | `/users` | Yes | `ADMIN`, `DIRECTOR` | Lists users (Director is department-scoped). |
| `POST` | `/users` | Yes | `ADMIN` | Provisions a new municipal user with bcrypt password hashing. |
| `PATCH`| `/users/:id/status` | Yes | `ADMIN` | Activates or deactivates a user account. |
| `PATCH`| `/users/:id/department` | Yes | `ADMIN` | Reassigns a user's home department. |
| `GET` | `/audit` | Yes | `ADMIN`, `AUDITOR`, `DIRECTOR` | Queries tamper-evident audit ledger with pagination. |
| `GET` | `/audit/verify` | Yes | `ADMIN`, `AUDITOR`, `DIRECTOR` | Verifies cryptographic SHA-256 hash chain integrity. |

---

## 8. Explicit Scope Boundaries (Features NOT Implemented in Phase 1)

In strict adherence to the implementation roadmap, the following capabilities belong to later phases and are **NOT** implemented in Phase 1:
- ❌ **Phase 2:** Asset REST CRUD, 11-state lifecycle transition machine, 18-asset Ahmedabad seed dataset.
- ❌ **Phase 3:** React frontend shell, GovOps navigation layout, command dashboard KPIs.
- ❌ **Phase 4:** Leaflet GIS map, marker clustering, spatial asset flyout drawer.
- ❌ **Phase 5:** Field inspection submission rubrics and manager review branching workflow.
- ❌ **Phase 6:** Work order Kanban board, transition-level tuple RBAC, context-aware recovery.
- ❌ **Phase 7:** Tokenized Secure QR code SVG generation and camera scanner.
- ❌ **Phase 8:** Straight-line financial depreciation engine and full TCO aggregation.
- ❌ **Phase 9:** Deterministic PADI risk engine and LLM inspection synthesis.
- ❌ **Phase 10:** Multi-tier verification and demo script rehearsal.
