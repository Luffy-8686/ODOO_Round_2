# 🏆 The Champions Club — Sports Club Management System

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![NextAuth](https://img.shields.io/badge/NextAuth-4.24-green?style=for-the-badge&logo=auth0)](https://next-auth.js.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-729B1B?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0C2451?style=for-the-badge&logo=razorpay)](https://razorpay.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **A unified, production-grade sports club management platform with server-enforced Role-Based Access Control (RBAC), dedicated role portals, high-throughput court scheduling, retail POS inventory, Kitchen Display System (KDS), member digital QR passes, and double-entry financial reconciliation.**

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [The Problem We Solve](#-the-problem-we-solve)
- [Key Features by Module](#-key-features-by-module)
- [Razorpay Payments & Deposit Refunds](#-razorpay-payments--deposit-refunds)
- [System Architecture & RBAC Flow](#-system-architecture--rbac-flow)
- [Dedicated Role Portals](#-dedicated-role-portals)
- [Hard Concurrency & Invariants](#-hard-concurrency--invariants)
- [Tech Stack & Architecture Decisions](#-tech-stack--architecture-decisions)
- [Data Model Overview](#-data-model-overview)
- [Role-Based Access Control Matrix](#-role-based-access-control-matrix)
- [Security Model](#-security-model)
- [Demo Credentials & Quick Login](#-demo-credentials--quick-login)
- [One-Command Quickstart](#-one-command-quickstart)
- [Environment Configuration](#-environment-configuration)
- [Available npm Scripts](#-available-npm-scripts)
- [Suggested Demo Walkthrough](#-suggested-demo-walkthrough)
- [Automated Vitest Test Suite](#-automated-vitest-test-suite)
- [Project Directory Structure](#-project-directory-structure)
- [Switching to PostgreSQL](#-switching-to-postgresql)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## 🎯 Executive Overview

**The Champions Club** is a busy sports and wellness destination in Bangalore featuring bookable courts (tennis, padel, badminton, cricket nets), a gear shop, a cafeteria/lounge, and front desk operations. This platform replaces fragmented WhatsApp bookings and Excel spreadsheets with **one unified database and application layer** providing dedicated, server-guarded portals for each distinct persona:

1. **Owner Command Center (`/app/owner`)**: Full executive governance, financial P&L, GST reports, staff payroll runs, user role management, and audit logs.
2. **Manager Operations (`/app/manager`)**: Daily facility execution, master court schedule, staff leave approvals, sales CRM pipeline, restock inventory.
3. **Front Desk Desk (`/app/desk`)**: Walk-in reservations, member onboarding, digital QR passes, member tab billing, CSV bulk migrations.
4. **Bar & F&B Operations (`/app/bar`)**: Touch POS terminal, Kitchen Display System (KDS), table floor maps, member tab charges, shift cash drawer.
5. **Pro Shop Retail (`/app/shop-admin`)**: Counter POS register, SKU inventory variants, racket stringing & repair service queue.
6. **Coach Command (`/app/coach`)**: Coaching schedule, private student player roster, skill development notes, court time allocations.
7. **Member Self-Service (`/portal`)**: Self-service court booking, digital QR membership card, personal tab balance, GST invoice history.
8. **Public Club Website (`/`)**: Real-time court availability, membership tier showcases, trial bookings, and corporate quote requests.

---

## 🧩 The Problem We Solve

Before this platform, a typical multi-revenue sports club runs on disconnected tools, and every disconnect creates a leak:

| Pain Point (Before) | Consequence | How The Champions Club Fixes It |
|---|---|---|
| Court bookings taken over WhatsApp, phone, and at the desk | Double-bookings, disputes, no-shows with no record | A single booking engine with mutex-serialized slot allocation and conflict errors |
| Membership details kept in spreadsheets | Expired members still playing, no renewal visibility | Memberships with start/end dates, auto-renew flags, and a background expiry worker |
| Separate cash registers for shop and café | Stock drifts from reality, tab balances get lost | One inventory ledger ("single shelf truth") and member tabs shared across Bar, Shop, and Courts |
| Staff all share one admin login | Anyone can see salaries, costs, and profit | Seven roles with a server-enforced permission matrix and field-level data redaction |
| GST invoices assembled by hand at month-end | Errors, penalties, slow reconciliation | Automatic CGST/SGST split invoices and a double-entry ledger |
| Enquiries scribbled on paper | Leads go cold and are never followed up | CRM pipeline with a 24-hour SLA monitor |

---

## ✨ Key Features by Module

### 🎾 Court Booking Engine
- Multiple sports (tennis, padel, badminton, cricket nets) with per-court surface type, indoor/outdoor flag, opening and closing hours, and ACTIVE / MAINTENANCE status.
- Bookings from four sources: front desk, member portal, public trial form, and phone.
- **Atomic slot reservation** so two people can never hold the same court and time.
- **Unpaid reservation holds** that expire automatically (`expiresAt`, 10-minute window) and release the slot.
- Maintenance blocks that remove a court from availability for a time range.
- **Waitlists** per court slot with a WAITING → NOTIFIED → CONVERTED / EXPIRED lifecycle.
- **Social sessions** (e.g., a Friday-night padel social) with capacity limits, per-person pricing, guest participants, and waitlisting.
- Coach assignment on a booking for private lessons.

### 💰 Dynamic Pricing
- Price is computed from **member tier × peak/off-peak window × sport/court rate**.
- Tier-specific benefits live on the `Plan` record: court rate per hour, shop discount %, bar discount %, maximum bookings per day, and how many days ahead a member may book.
- Payment methods tracked per booking: Cash, Card, UPI, Online, Tab Charge, or Free-Tier allowance.

### 🎟️ Membership & Digital Pass
- Three tiers: **Gold**, **Silver**, **Junior**, each with monthly and annual billing.
- Unique member IDs (e.g., `CC-2024-001`) and a **QR-code digital membership card** generated with the `qrcode` library.
- Check-in methods recorded in an attendance log: front desk, QR scan, or access gate.
- Member status lifecycle: ACTIVE → EXPIRING_SOON → EXPIRED, plus SUSPENDED and CANCELLED.
- Store credit balance, emergency contacts, and soft-delete support on member records.
- **Bulk CSV migration** for onboarding existing member lists from spreadsheets.

### 🛍️ Pro Shop & Inventory
- Products with category, brand, SKU, GST rate, cost price, selling price, and reorder level.
- Variants (size, colour, weight) each with their own stock and reserved quantity.
- **Every stock change creates an immutable stock-movement record** (purchase receive, POS sale, online sale, adjustment, return) with before and after quantities and the staff member responsible.
- Suppliers and purchase orders with partial-receive tracking.
- Shop orders supporting walk-in, click-and-collect, and home delivery fulfilment.
- **Racket stringing and repair queue** with ticket numbers, string type, tension, express option, ETA, and QUEUED → IN_PROGRESS → READY → DELIVERED status.
- Automatic low-stock alerts when a variant falls to its reorder level.

### ☕ Bar, Café & Kitchen
- Touch-friendly POS terminal with a categorized menu (hot and cold beverages, snacks, meals, desserts, health shakes).
- **"86'd" toggle** to instantly mark a menu item unavailable.
- **Table floor map** showing FREE, OCCUPIED, BILL_REQUESTED, and RESERVED states.
- **Live Kitchen Display System**: orders flow NEW → PREPARING → READY → SERVED.
- **Member tabs** that stay open across visits to the bar, shop, or courts and settle in one payment, including split-bill settlement.
- **Shift cash drawer** with an opening float, a closing count, and an automatic variance calculation.

### 💳 Finance, GST & Ledger
- **Double-entry general ledger** for every revenue and expense event across Courts, Memberships, Shop, Bar, Expenses, Payroll, and Refunds.
- GST-compliant invoices with line items and a **CGST / SGST split**.
- Receipt numbers for every payment, with a module tag (Court, Membership, Shop, Bar, Trial, Service).
- Vendor and expense management with an approval flow (Draft → Approved → Paid / Overdue).
- Executive **P&L dashboards** built with Recharts (Owner only).
- **Razorpay online payments**: order creation, HMAC signature verification, and automatic refunds, with a built-in simulation mode for offline demos (see [Razorpay Payments & Deposit Refunds](#-razorpay-payments--deposit-refunds)).
- **Automatic ₹100 security-deposit refund** when a court slot ends, recorded in the ledger, payments, notifications, and audit log in a single database transaction.

### 👥 HR & Payroll
- Employee records with role, join date, and salary (salary is redacted for everyone except the Owner).
- Daily attendance (present, half-day, absent, leave).
- Leave requests (casual, sick, paid, unpaid) with Manager/Owner approval.
- **Monthly payroll runs** that generate one payslip per employee with base, overtime, deductions, and net pay.

### 🎯 CRM & Public Enquiries
- Leads captured from the website, walk-ins, referrals, social, and phone.
- Pipeline stages: NEW → CONTACTED → QUOTE_SENT → TRIAL_BOOKED → CONVERTED / LOST.
- Activity timeline per lead (calls, emails, WhatsApp, notes, status changes).
- Quotes for corporate and group enquiries, with validity dates.
- **24-hour SLA monitor** that flags leads left uncontacted.

### 🔔 Platform Services
- Notification service (`src/lib/notifications.ts`) with typed events: booking confirmed, booking reminder, **booking cancelled**, membership expiring, **membership expired**, low stock, new lead, order status, tab alert, and **waitlist promoted**. Each notification records a channel (in-app, email, SMS, or WhatsApp) and can join the caller's database transaction so a notification is never saved for an action that rolled back. Notifications are currently stored as records; connect an email/SMS/WhatsApp provider to deliver them externally.
- **Immutable audit log** recording who did what, to which entity, when, and from which IP, with before/after details.
- Key-value `Setting` store for club-wide configuration.

---

## 💳 Razorpay Payments & Deposit Refunds

Online payments run through the Razorpay integration in `src/lib/razorpay.ts`. It works against the real Razorpay API when keys are configured and falls back to a safe simulation when they are not, so the full payment flow can be demoed offline.

### Two Operating Modes

| Mode | When It Activates | Behaviour |
|---|---|---|
| **`REAL_TRIAL`** | `RAZORPAY_KEY_ID` starts with `rzp_` and `RAZORPAY_KEY_SECRET` is set | Calls the live Razorpay API (use test-mode keys for a sandbox) to create orders and issue refunds |
| **`SIMULATION`** | Keys are missing or invalid, or the live API call fails | Generates trial order, payment, and refund IDs (`order_trial_…`, `pay_trial_…`, `rfnd_trial_…`) so the UI and ledger flow still complete |

### Exposed Functions

| Function | Purpose |
|---|---|
| `getRazorpayClient()` | Returns an initialized Razorpay SDK client, or `null` if keys are absent or invalid |
| `getRazorpayConfig()` | Reports configuration status, the active mode, and a **masked** key ID (for example `rzp_te••••ab12`) that is safe to show in an admin UI; the secret is never exposed |
| `createRazorpayOrder()` | Creates an order in paise (default currency INR) with a receipt and notes; returns the order ID, amount, key ID, and an `isSimulated` flag |
| `verifyRazorpaySignature()` | Verifies the payment signature using HMAC-SHA256 over `orderId\|paymentId` with the key secret |
| `refundRazorpayPayment()` | Issues a full or partial refund through the Razorpay API, or returns a simulated refund confirmation |
| `processSlotDepositRefund()` | Refunds the court security deposit after a slot ends (details below) |

### Payment Flow

```mermaid
sequenceDiagram
    participant U as Member / Front Desk
    participant API as Next.js API
    participant RZ as Razorpay (or Simulation)
    participant DB as Database

    U->>API: Request payment for a booking
    API->>RZ: createRazorpayOrder(amountPaise)
    RZ-->>API: orderId (real or order_trial_*)
    API-->>U: orderId + keyId for checkout
    U->>RZ: Complete payment
    RZ-->>U: paymentId + signature
    U->>API: Submit orderId, paymentId, signature
    API->>API: verifyRazorpaySignature()
    API->>DB: Mark booking paid, record payment, ledger entry
```

### ₹100 Security Deposit Auto-Refund

When a court slot ends, `processSlotDepositRefund(bookingId)` runs the whole refund inside **one database transaction** so nothing is half-applied:

1. **Guard checks**: the booking must exist and must have a security deposit; if the deposit was already refunded the call returns safely without refunding twice (**idempotent**).
2. **Refund the money**: if the booking has a Razorpay payment ID, a refund for the deposit amount is issued to the original payment method (live or simulated).
3. **Update the booking**: status becomes `COMPLETED` (a cancelled booking stays `CANCELLED`), the deposit refund status becomes `REFUNDED`, and the refund timestamp and refund ID are stored.
4. **Write the ledger**: a debit entry in the `COURTS` module is created with the next `TX-<year>-<number>` entry number, linked to the booking.
5. **Record the receipt**: a refund payment with an `RCP-RFND-<year>-<number>` receipt number and status `REFUNDED` is saved.
6. **Notify the member**: a "₹100 Security Deposit Refunded" notification is created on the WhatsApp channel.
7. **Audit**: a `STATUS_CHANGE` audit entry is logged under "System / Billing Gateway" with the refund ID and reason.

### Booking Fields Used by the Payment Flow

The integration reads and writes these fields on `Booking`. Make sure they exist in `prisma/schema.prisma`, then run `npm run db:push`:

| Field | Purpose |
|---|---|
| `securityDepositPaise` | Deposit amount held for the booking (in paise) |
| `depositRefundStatus` | Refund state; `REFUNDED` once the deposit is returned |
| `depositRefundedAt` | Timestamp of the refund |
| `razorpayPaymentId` | Razorpay payment ID used to issue the refund |
| `razorpayRefundId` | Refund ID returned by Razorpay |

### Setup

```bash
npm install razorpay
```

Add your Razorpay **test-mode** keys to `.env` (see [Environment Configuration](#-environment-configuration)). Without keys, the app runs in simulation mode automatically.

> **Production warning:** In simulation mode, signature verification intentionally passes for trial IDs (`order_trial_…`, `pay_trial_…`, `sig_trial_…`) and whenever `RAZORPAY_KEY_SECRET` is missing. **Always set real keys in production** and consider disabling simulation there, otherwise payments could be marked as verified without a genuine Razorpay signature.

---

## 🏗️ System Architecture & RBAC Flow

```mermaid
graph TD
    subgraph ClientLayer ["Client Interfaces (Next.js 14 App Router)"]
        PublicSite["🌐 Public Website (/)"]
        Login["🔑 Auth & Demo Switcher (/login)"]
        OwnerPortal["👑 Owner Executive (/app/owner)"]
        ManagerPortal["📋 Manager Operations (/app/manager)"]
        DeskPortal["🎟️ Front Desk (/app/desk)"]
        BarPortal["☕ Bar POS & KDS (/app/bar)"]
        ShopPortal["🛍️ Pro Shop (/app/shop-admin)"]
        CoachPortal["🎾 Coach Hub (/app/coach)"]
        MemberPortal["📱 Member Portal (/portal)"]
    end

    subgraph SecurityLayer ["Security & Authorization Gateway"]
        Middleware["🛡️ Next.js Edge Middleware (JWT Token Verification)"]
        NextAuth["🔐 NextAuth Credentials Provider (bcrypt & Rate-Limiter)"]
        RBAC["🛡️ RBAC Permissions Matrix & Data Sanitizer"]
        Audit["📝 Immutable Audit Logger (Before/After Diffs)"]
    end

    subgraph BusinessLayer ["Core Business Engines (src/lib)"]
        BookingEngine["🎾 Court Booking (AsyncMutex Serialization)"]
        PricingEngine["💰 Dynamic Pricing Matrix (Tier x Peak x Slot)"]
        InventoryEngine["🛍️ Inventory & POS Ledger (Single Shelf Truth)"]
        BarEngine["☕ Bar Tabs, Table Floor Map & Live KDS"]
        CRMEngine["🎯 CRM Pipeline & 24h SLA Monitor"]
        FinanceEngine["💳 Double-Entry General Ledger & GST Invoicing"]
        CronEngine["⏱️ Background Maintenance Worker"]
    end

    subgraph PersistenceLayer ["Database & Storage"]
        PrismaORM["⚡ Prisma ORM 5.22 (SQLite / PostgreSQL)"]
        DB[(🗄️ Relational Database)]
    end

    Login --> NextAuth
    NextAuth --> Middleware
    Middleware --> OwnerPortal & ManagerPortal & DeskPortal & BarPortal & ShopPortal & CoachPortal & MemberPortal
    OwnerPortal & ManagerPortal & DeskPortal & BarPortal & ShopPortal & CoachPortal & MemberPortal --> RBAC
    RBAC --> BusinessLayer
    BusinessLayer --> Audit
    BusinessLayer --> PrismaORM
    PrismaORM --> DB
```

### How a Request Flows Through the System

1. **Authenticate**: The user signs in at `/login`. NextAuth validates the bcrypt-hashed password, applies the rate limiter, and rejects deactivated accounts.
2. **Issue session**: A signed, HTTP-only JWT is issued containing the user ID, name, email, role, and (for members) their member ID and code.
3. **Gate the route**: Edge middleware verifies the JWT on every request to `/app/*` and `/portal/*` and redirects users who are in the wrong portal to the `/403` page.
4. **Authorize the action**: Each API route calls the permission check (`can()`) for the exact permission it needs, for example `booking:create` or `pos:bar`.
5. **Run business logic**: The relevant engine in `src/lib` (booking, pricing, inventory, tabs, finance) executes the rule, with writes serialized or wrapped in transactions where correctness demands it.
6. **Sanitize the response**: `sanitizeForRole()` strips fields the caller must not see, such as cost price and salary.
7. **Audit and persist**: The change is written through Prisma and an audit record captures who did what.

---

## 🚪 Dedicated Role Portals

Each persona gets an isolated portal with its own route prefix, accent colour, and navigation sidebar, so no role ever sees controls that do not belong to it.

| Role | Portal Path | Accent Theme | Key Responsibilities |
|---|---|---|---|
| **`OWNER`** | `/app/owner` | Violet | Full governance, Executive P&L, GST reconciliation, staff payroll runs, plan and court pricing configuration, user and role administration, immutable audit logs |
| **`MANAGER`** | `/app/manager` | Blue | Daily facility execution, master court schedule, staff leave approvals, sales CRM pipeline, restock inventory alerts, member directory |
| **`FRONT_DESK`** | `/app/desk` | Emerald | Walk-in reservations, member onboarding, digital QR passes, member tab billing and settlements, bulk CSV member migrations |
| **`BAR_STAFF`** | `/app/bar` | Rose | Touch POS terminal, Kitchen Display System, table floor maps, member tab charges, shift cash drawer balance |
| **`SHOP_STAFF`** | `/app/shop-admin` | Amber | Retail counter POS register, inventory variant stock, racket stringing and repair queue, equipment rentals |
| **`COACH`** | `/app/coach` | Cyan | Coaching schedule, private student roster, skill development notes, court time allocations |
| **`MEMBER`** | `/portal` | Teal | Self-service court booking, digital QR membership card, personal tab balance, GST invoice history |

The public website at `/` is open to everyone and offers live court availability, membership tier showcases, trial bookings, and corporate quote requests.

---

## ⚔️ Hard Concurrency & Invariants

A booking system is only trustworthy if it is correct under load. These invariants are enforced in code and verified by automated tests:

| # | Invariant | How It Is Enforced |
|---|---|---|
| 1 | **A court slot can only ever be booked once** | `src/lib/concurrency.ts` serializes booking attempts per court and slot using an `AsyncMutex`; the loser of a race receives a conflict error |
| 2 | **Stock never goes negative and never lies** | `src/lib/inventory.ts` performs sales as atomic decrements and records a stock-movement row with before and after quantities |
| 3 | **Every rupee is traceable** | Each payment produces a receipt number and a double-entry ledger transaction linked back to its source booking, order, tab, or invoice |
| 4 | **Members cannot exceed their tier limits** | Daily booking caps and advance-booking windows come from the member's `Plan` and are checked before a booking is accepted |
| 5 | **Junior members follow under-18 restrictions** | Tier rules are applied in the pricing and booking checks |
| 6 | **Unpaid holds do not block courts forever** | Reservations carry an `expiresAt` timestamp and the background worker (`src/lib/cron.ts`) releases expired holds |
| 7 | **Expired memberships are detected automatically** | The same worker moves memberships through EXPIRING_SOON and EXPIRED |
| 8 | **Sensitive fields never leave the server unredacted** | `sanitizeForRole()` removes cost prices and salaries for unauthorized roles |
| 9 | **Members only see their own data** | IDOR protection ties member record requests to the authenticated session |
| 10 | **A deposit can never be refunded twice** | `processSlotDepositRefund()` checks the refund status inside a database transaction and returns early if already `REFUNDED` |
| 11 | **Refunds are all-or-nothing** | Booking update, ledger debit, refund receipt, notification, and audit entry are committed in a single transaction |
| 12 | **Payments are cryptographically verified** | Razorpay signatures are checked with HMAC-SHA256 against the server-side key secret |

Run the race-condition proof on its own at any time:

```bash
npm run test:concurrency
```

---

## 🧱 Tech Stack & Architecture Decisions

| Layer | Technology | Version | Why We Chose It |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 14.2 | Server components, nested layouts per portal, and API routes in a single deployable app |
| Language | **TypeScript** | 5.6 | End-to-end type safety from database models to UI components |
| UI | **React** | 18.3 | Component model suited to dense operational dashboards |
| Styling | **Tailwind CSS** | 3.4 | Fast, consistent theming, including one accent colour per role portal |
| Icons | **lucide-react** | 0.454 | Lightweight, consistent icon set |
| Charts | **Recharts** | 2.13 | Revenue, occupancy, and P&L visualizations |
| Auth | **NextAuth** (Credentials, JWT) | 4.24 | Signed, HTTP-only session tokens with middleware verification |
| Password hashing | **bcryptjs** | 3.0 | Salted hashing with no native build step |
| ORM | **Prisma** | 5.22 | Typed queries and a portable schema |
| Database | **SQLite** (dev) / **PostgreSQL** (production) | n/a | Zero-setup demo experience with a clear path to production |
| Validation | **Zod** | 3.23 | Runtime validation of inputs and role definitions |
| Dates | **date-fns** | 3.6 | Slot, peak-window, and expiry calculations |
| QR codes | **qrcode** | 1.5 | Digital membership passes |
| Payments | **Razorpay** (Node SDK) | n/a | Online payment orders, signature verification, and refunds, with a built-in simulation mode |
| Testing | **Vitest** | 2.1 | Fast TypeScript-native test runner |
| Utilities | clsx, tailwind-merge, tsx | n/a | Class composition and running the TypeScript seed script |

### Key Architecture Decisions

- **Server-enforced authorization, never client trust.** Roles come from the signed JWT, not from anything the browser can edit. The earlier client-side persona switcher was replaced with isolated portals.
- **Money is stored as integers in paise.** Every amount field (for example `totalPricePaise`) is an integer, which avoids floating-point rounding errors in invoices, tax, and ledger totals.
- **One database, many portals.** All roles share the same data, so there is no sync problem between the shop, bar, courts, and finance views.
- **Business rules live in `src/lib`, not in UI components.** Booking, pricing, inventory, and tab logic can be tested without rendering anything, which is why the test suite can prove concurrency behaviour directly.
- **Portable schema.** Role and status values are stored as strings with documented allowed values, so the same Prisma schema runs on SQLite and PostgreSQL without enum migration friction.
- **Denormalization where it helps.** The membership tier is copied onto the membership record, and bookings keep the booker's details, so historical records stay accurate even if a member later changes.
- **Soft deletes for people and bookings.** `deletedAt` preserves history for audit and finance.

---

## 🗃️ Data Model Overview

The Prisma schema (`prisma/schema.prisma`) defines **44 models** grouped by domain:

| Domain | Models |
|---|---|
| **Users & Auth** | `User` |
| **Members & Plans** | `Plan`, `Member`, `Membership`, `MemberAttendance` |
| **Court Booking** | `Sport`, `Court`, `Booking`, `SocialSession`, `SocialParticipant`, `Waitlist`, `MaintenanceBlock` |
| **Gear Shop & Inventory** | `Product`, `ProductVariant`, `StockMovement`, `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `ShopOrder`, `OrderItem`, `ServiceJob` |
| **Bar & Café** | `MenuItem`, `Table`, `Tab`, `BarOrder`, `BarOrderItem`, `Shift` |
| **Finance** | `Payment`, `LedgerTransaction`, `Invoice`, `InvoiceLine`, `Vendor`, `Expense` |
| **HR & Payroll** | `Employee`, `Attendance`, `LeaveRequest`, `Payroll`, `Payslip` |
| **CRM** | `Lead`, `LeadActivity`, `Quote` |
| **Platform** | `Notification`, `AuditLog`, `Setting` |

### Core Relationships

```
User ──┬── Member ──┬── Membership ── Plan
       │            ├── Booking ── Court ── Sport
       │            ├── Tab ──┬── BarOrder ── BarOrderItem ── MenuItem
       │            │         └── Payment
       │            ├── ShopOrder ── OrderItem ── ProductVariant ── Product
       │            ├── ServiceJob            (racket stringing)
       │            └── Invoice ── InvoiceLine
       └── Employee ──┬── Shift              (cash drawer)
                      ├── Attendance / LeaveRequest
                      └── Payslip ── Payroll
```

### Conventions Used Across the Schema

- **Human-readable reference numbers** on business documents: bookings (`BK-`), shop orders (`SO-`), tabs (`TAB-`), bar orders (`BO-`), receipts (`RCP-`), invoices (`INV-`), ledger entries (`TX-`), purchase orders (`PO-`), expenses (`EXP-`), payroll (`PAY-`), payslips (`PS-`), leads (`LD-`), quotes (`QT-`), and stringing tickets (`ST-`).
- **Currency**: all amounts are integer paise (₹1 = 100 paise).
- **Default GST rates**: 18% on retail goods and invoice lines, 5% on café menu items.
- **Timestamps**: every major model carries `createdAt` and `updatedAt`.

---

## 🛡️ Role-Based Access Control Matrix

| Permission | `OWNER` | `MANAGER` | `FRONT_DESK` | `BAR_STAFF` | `SHOP_STAFF` | `COACH` | `MEMBER` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Executive P&L & Tax Reports** (`finance:pnl`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Financial Ledger Journal** (`finance:ledger`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Staff Salary & Payroll Run** (`hr:payroll`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User & Role Privileges** (`settings:users`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Staff Leave Approvals** (`hr:leaves_approve`) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Court Reservations & Calendar** (`booking:create`) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Bar POS & Kitchen KDS** (`pos:bar`, `kds:update`) | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Pro Shop Retail POS** (`pos:shop`) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Racket Stringing Queue** (`stringing:manage`) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Coaching Drills & Roster** (`coach:read_own`) | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Member Self-Service & Tab** (`booking:create_own`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

For complete documentation on field-level sanitization and IDOR rules, see [`docs/RBAC.md`](docs/RBAC.md).

### Additional Permission Keys

Beyond the headline permissions above, `docs/RBAC.md` defines these supporting keys:

| Permission | Granted To |
|---|---|
| `settings:plans` | Owner |
| `member:read_all` | Owner, Manager, Front Desk |
| `member:read_own` | All roles |
| `booking:create_own` | Owner, Manager, Front Desk, Member |

---

## 🔐 Security Model

| Control | Implementation |
|---|---|
| **Authentication** | NextAuth Credentials provider with bcrypt-hashed passwords |
| **Session** | Signed JWT; cookie is `httpOnly`, `sameSite: "lax"`, and `secure` in production |
| **Route protection** | Edge middleware verifies the token and role for every protected path; wrong-role access lands on `/403` |
| **Brute-force defence** | In-memory rate limiter rejects more than 5 failed attempts per 60 seconds per email |
| **Account deactivation** | Users with `isActive: false` are rejected at the authentication gateway |
| **Field-level redaction** | `costPricePaise` is visible only to Owner and Manager; `monthlySalaryPaise` only to Owner |
| **Ledger isolation** | Ledger transaction endpoints return HTTP 403 to every non-Owner role |
| **IDOR protection** | A member requesting `/api/members/:id` can only retrieve their own record, matched against the session |
| **Input validation** | Zod schemas validate role values and request payloads |
| **Auditability** | Immutable audit log stores user, role, action, entity, entity ID, details, and IP address |
| **Payment integrity** | Razorpay signature verification (HMAC-SHA256); the key secret is server-only and the UI only ever receives a masked key ID |
| **Refund traceability** | Every deposit refund writes a ledger debit, a refund receipt, and an audit entry attributed to the billing gateway |

> **Note for production:** The demo password and the sample `NEXTAUTH_SECRET` in `.env.example` are for local evaluation only. Replace them before any real deployment. The in-memory rate limiter is per-process; use a shared store such as Redis if you run multiple instances.

---

## 👥 Demo Credentials & Quick Login

All accounts are pre-seeded with password: **`Demo@1234`**

| Role | Name | Email | Password | Dedicated Portal |
|---|---|---|---|---|
| **👑 OWNER** | Vikram Malhotra | `owner@championsclub.in` | `Demo@1234` | `/app/owner` |
| **📋 MANAGER** | Ananya Sharma | `manager@championsclub.in` | `Demo@1234` | `/app/manager` |
| **🎟️ FRONT_DESK** | Rahul Verma | `frontdesk@championsclub.in` | `Demo@1234` | `/app/desk` |
| **☕ BAR_STAFF** | Sanjay Kumar | `bar@championsclub.in` | `Demo@1234` | `/app/bar` |
| **🛍️ SHOP_STAFF** | Pooja Patel | `shop@championsclub.in` | `Demo@1234` | `/app/shop-admin` |
| **🎾 COACH** | Rohan Bopanna | `coach@championsclub.in` | `Demo@1234` | `/app/coach` |
| **🥇 MEMBER (Gold)** | Arjun Reddy | `arjun.gold@gmail.com` | `Demo@1234` | `/portal` |
| **🥈 MEMBER (Silver)** | Priya Nair | `priya.silver@gmail.com` | `Demo@1234` | `/portal` |
| **🧒 MEMBER (Junior)** | Rohan Kapoor | `rohan.junior@gmail.com` | `Demo@1234` | `/portal` |

---

## ⚡ One-Command Quickstart

### Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### 1. Install Dependencies & Setup Database
```bash
# One-command full setup (generates Prisma client, pushes schema, and seeds demo data)
npm run setup
```

### 2. Launch Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser. Visit **`/login`** to authenticate directly as any staff role or member.

### Full First-Time Setup From Scratch

```bash
# 1. Clone the repository
git clone https://github.com/Luffy-8686/ODOO_Round_2.git
cd ODOO_Round_2

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env

# 4. Generate the Prisma client, create the SQLite database, and seed demo data
npm run setup

# 5. Start the app
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

---

## 🔧 Environment Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Example Value | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Prisma connection string (SQLite file by default) |
| `NEXTAUTH_SECRET` | *(long random string)* | Secret used to sign and verify JWT sessions. **Generate a new one for any real deployment.** |
| `NEXTAUTH_URL` | `http://localhost:3000` | Canonical URL of the app for NextAuth callbacks |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public base URL exposed to the browser |
| `RAZORPAY_KEY_ID` | `rzp_test_xxxxxxxxxxxx` | Razorpay key ID (must start with `rzp_`); enables live/test-mode payments |
| `RAZORPAY_KEY_SECRET` | *(from Razorpay dashboard)* | Razorpay key secret used to create orders and verify signatures. **Server-only; never expose it to the browser.** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_test_xxxxxxxxxxxx` | Optional public key ID for the browser checkout; used as a fallback if `RAZORPAY_KEY_ID` is not set |

The three Razorpay variables are optional. If they are omitted, payments run in **simulation mode** so the demo works with no external account. Get test keys from the Razorpay dashboard (Settings → API Keys, in test mode).

Generate a strong secret with:

```bash
openssl rand -base64 32
```

---

## 📜 Available npm Scripts

| Script | Command | What It Does |
|---|---|---|
| `npm run dev` | `next dev` | Starts the development server with hot reload |
| `npm run build` | `next build` | Creates an optimized production build |
| `npm run start` | `next start` | Serves the production build |
| `npm run lint` | `next lint` | Runs ESLint checks |
| `npm run test` | `vitest run` | Runs the full automated test suite once |
| `npm run test:watch` | `vitest` | Re-runs tests on file changes |
| `npm run test:concurrency` | `vitest run test/concurrency.test.ts` | Runs only the 10-way booking race test |
| `npm run db:generate` | `prisma generate` | Generates the typed Prisma client |
| `npm run db:push` | `prisma db push` | Syncs the schema to the database |
| `npm run db:seed` | `tsx prisma/seed.ts` | Loads the demo club data |
| `npm run setup` | generate → push → seed | Complete first-time database setup |

To wipe and rebuild the demo data at any time, delete the SQLite file (`prisma/dev.db`) and run `npm run setup` again.

---

## 🎬 Suggested Demo Walkthrough

A five-minute path that shows off every major capability:

1. **Public site (`/`)**: Browse court availability and membership tiers, then submit a trial booking or corporate quote request.
2. **Front Desk (`frontdesk@championsclub.in`)**: Create a walk-in reservation, onboard a new member, and open the member's QR pass.
3. **Try to break the booking engine**: Attempt to book the same court and time slot twice. The second attempt is rejected with a conflict.
4. **Member (`arjun.gold@gmail.com`)**: Book a court from the self-service portal, view the digital QR card, and check the tab balance and GST invoice history.
5. **Bar (`bar@championsclub.in`)**: Ring up an order on the touch POS, watch it appear on the Kitchen Display, advance it to READY, and charge it to a member tab.
6. **Pro Shop (`shop@championsclub.in`)**: Sell a racket variant at the counter and see the stock decrement, then add a stringing job to the queue.
7. **Coach (`coach@championsclub.in`)**: Review the day's coaching schedule and add a skill note to a student.
8. **Manager (`manager@championsclub.in`)**: Approve a staff leave request and check the CRM pipeline and restock alerts.
9. **Owner (`owner@championsclub.in`)**: Open the P&L and GST reports, run payroll, and review the audit log of everything done in the previous steps.
10. **Prove the security**: While signed in as Front Desk, visit `/app/owner`. You are redirected to the 403 page, and the ledger API returns HTTP 403.

---

## 🧪 Automated Vitest Test Suite

The platform includes **23 automated tests** covering hard concurrency, double-booking prevention, dynamic pricing, inventory stock integrity, and server RBAC boundaries:

```bash
npm run test
```

### Test Results Breakdown:
- **`test/concurrency.test.ts`**: Simulates **10 simultaneous booking attempts** at the EXACT same court and time slot using `Promise.all`. Verifies that exactly **1 request succeeds** and **9 requests fail with conflict errors**.
- **`test/business-rules.test.ts`**: Verifies dynamic pricing rules, peak hour multipliers, member tier discounts (Gold free courts, Silver reduced rate, Junior under-18 restrictions), daily booking limits, inventory auto-decrements, and double-entry ledger transactions.
- **`test/rbac.test.ts`**: Verifies role matrix bounds, permission checks (`can()`), route guards, field-level cost/salary data redaction (`sanitizeForRole()`), and bcrypt hash validation.

| Test File | Tests | Focus Area |
|---|:---:|---|
| `test/concurrency.test.ts` | 1 | Race-condition collision on a single slot |
| `test/business-rules.test.ts` | 10 | Pricing, tier rules, limits, inventory, ledger |
| `test/rbac.test.ts` | 12 | Permissions, route guards, redaction, password hashing |
| **Total** | **23** | |

---

## 📁 Project Directory Structure

```
the-champions-club/
├── docs/
│   └── RBAC.md                 # Full RBAC & Route Boundary Specification
├── prisma/
│   ├── schema.prisma           # 44 portable database models & relations
│   └── seed.ts                 # Full club seed (courts, sports, members, staff)
├── src/
│   ├── app/
│   │   ├── (public)/           # Landing page & public trial booker
│   │   ├── 403/                # Access Forbidden error page
│   │   ├── login/              # Credentials + OTP + Quick Demo login
│   │   ├── portal/             # Member Self-Service portal & digital pass
│   │   ├── app/
│   │   │   ├── owner/          # 👑 Owner Executive Governance & P&L
│   │   │   ├── manager/        # 📋 Manager Operations & Schedule
│   │   │   ├── desk/           # 🎟️ Front Desk Check-in & Onboarding
│   │   │   ├── bar/            # ☕ Bar POS, Tables & KDS Kitchen
│   │   │   ├── shop-admin/     # 🛍️ Pro Shop Counter POS & Stringing
│   │   │   └── coach/          # 🎾 Coach Dashboard & Student Roster
│   │   └── api/                # Protected Next.js REST API routes
│   ├── components/
│   │   ├── navbar.tsx          # Real session badge & logout button
│   │   ├── portal-sidebar.tsx  # Role-tailored dynamic navigation sidebar
│   │   └── role-guard.tsx      # Server-verified client role guard
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config & credentials authorize
│   │   ├── roles.ts            # Typed role consts, Zod schema & role metadata
│   │   ├── permissions.ts      # RBAC permissions matrix & data sanitizer
│   │   ├── concurrency.ts      # Atomic court booking Mutex lock engine
│   │   ├── pricing.ts          # Tier x Peak x Sport rate calculations
│   │   ├── inventory.ts        # Atomic POS stock sale & reorder engine
│   │   ├── tabs.ts             # Bar tab charge & split-bill settlement
│   │   ├── cron.ts             # Background membership expiry & auto-release
│   │   ├── audit.ts            # Immutable DB audit logging
│   │   ├── notifications.ts    # Typed notification recorder (transaction-aware)
│   │   └── razorpay.ts         # Razorpay orders, signature check, refunds & deposit auto-refund
│   └── types/
│       └── next-auth.d.ts      # NextAuth JWT session type extensions
└── test/
    ├── concurrency.test.ts     # 10-way race condition collision test
    ├── business-rules.test.ts  # 10 business logic invariant tests
    └── rbac.test.ts            # 12 RBAC & data redaction tests
```

### Root-Level Configuration Files

| File | Purpose |
|---|---|
| `package.json` | Dependencies and npm scripts |
| `next.config.mjs` | Next.js configuration |
| `tailwind.config.ts` / `postcss.config.mjs` | Tailwind and PostCSS setup |
| `tsconfig.json` | TypeScript compiler options |
| `vitest.config.ts` | Test runner configuration |
| `.env.example` | Template for local environment variables |
| `.gitignore` | Files excluded from version control |
| `LICENSE` | MIT license text |

---

## 🐘 Switching to PostgreSQL

The demo runs on SQLite for zero-setup evaluation, but the schema is portable. To move to PostgreSQL:

1. In `prisma/schema.prisma`, change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Point `DATABASE_URL` at your server, for example `postgresql://user:password@localhost:5432/champions_club`.
3. Run `npm run setup` to create the tables and reseed.

For production on PostgreSQL, consider adding database-level unique constraints or row locks for booking slots as defence in depth alongside the application-level mutex, especially if you run more than one server instance.

---

## 🩺 Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `@prisma/client did not initialize yet` | Prisma client was not generated | Run `npm run db:generate` (or `npm run setup`) |
| Login fails for every demo account | Database was not seeded | Run `npm run db:seed` |
| Redirect loop or "invalid JWT" after changing secrets | Old session cookie signed with a previous secret | Clear site cookies and sign in again |
| `NEXTAUTH_URL` or callback errors | Missing `.env` file | `cp .env.example .env` and restart the dev server |
| "Too many attempts" at login | Rate limiter tripped (5 failures per 60 seconds) | Wait a minute, or restart the dev server to reset the in-memory counter |
| Port 3000 already in use | Another process is using it | Run `npx next dev -p 3001` and update `NEXTAUTH_URL` |
| Stale or corrupted demo data | Manual experiments | Delete `prisma/dev.db` and run `npm run setup` |
| `Cannot find module 'razorpay'` | Razorpay SDK not installed | Run `npm install razorpay` |
| Prisma error about `securityDepositPaise`, `razorpayPaymentId`, or `depositRefundStatus` | Booking payment fields missing from the schema or database | Add the fields to `prisma/schema.prisma` and run `npm run db:push` |
| Orders show IDs like `order_trial_…` | Running in simulation mode (no valid Razorpay keys) | Set `RAZORPAY_KEY_ID` (starts with `rzp_`) and `RAZORPAY_KEY_SECRET` in `.env`, then restart |
| Razorpay refund falls back to a simulated refund | Live refund failed or the payment is not refundable in test mode | Check the server console warning; confirm the payment ID is a real captured payment |

---

## 🗺️ Roadmap

Ideas for taking the platform from hackathon-ready to club-ready:

- **Payments**: Razorpay orders, signature verification, and deposit refunds are in place. Next: extend online checkout to memberships, shop orders, and tabs, add webhook handling for asynchronous payment events, and disable simulation mode in production.
- **Notifications**: Connect the notification channels already modelled (email, SMS, WhatsApp) to real providers.
- **Access control hardware**: Link QR check-in to turnstiles or an access gate.
- **Odoo integration**: Sync invoices, inventory, and the ledger with Odoo Accounting and Inventory.
- **Distributed locking**: Replace the in-process mutex with database or Redis locks for multi-instance deployments.
- **Mobile app**: Wrap the member portal as a PWA or native app with push reminders.
- **Advanced analytics**: Court utilization heatmaps, member churn prediction, and peak-hour price optimization.
- **Multi-branch support**: Run several club locations from one owner account.
- **Internationalization**: Multi-language UI and multi-currency support.

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository and create a feature branch: `git checkout -b feature/my-improvement`
2. Make your changes, keeping business rules in `src/lib` and covering them with tests in `test/`.
3. Run `npm run lint` and `npm run test` and make sure everything passes.
4. Commit with a clear message and open a pull request describing what changed and why.

When adding a new protected feature, remember the three-step pattern: add the permission to `src/lib/permissions.ts`, guard the route in middleware and the API, and add a case to `test/rbac.test.ts`.

---

## 📜 License

This project is licensed under the MIT License — feel free to use and extend for club management deployments!
