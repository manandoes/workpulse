# Architecture.md — App Flow & Technical Architecture

## 1. Overview

WorkPulse is a multi-tenant SaaS web application. Each company (tenant) has isolated data. The app is composed of a frontend dashboard, a backend API, a relational database, and background jobs for computed metrics (workload %, performance scores, early-warning alerts).

## 2. Tech Stack

### Frontend

- **Framework:** Next.js (React, App Router)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix-based)
- **State/Data Fetching:** React Query (TanStack Query)
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod (validation)

### Backend

- **Runtime:** Node.js
- **Framework:** Next.js API routes (or a separate Express/Nest.js service if scale requires it later)
- **ORM:** Prisma
- **Auth:** NextAuth.js (or Clerk/Auth.js) with email/password + optional SSO (Google)
- **Background Jobs:** a queue (e.g., BullMQ + Redis) for nightly workload/performance recalculation and alert generation

### Database

- **Primary DB:** PostgreSQL
- **Caching:** Redis (session cache, job queue, dashboard cache)
- **File Storage:** S3-compatible object storage (attachments, documents, avatars)

### Infrastructure

- **Hosting:** Vercel (frontend + API routes) or a containerized deployment (Docker) on a cloud provider (AWS/GCP/Render)
- **Multi-tenancy model:** Shared database, tenant-scoped rows (every table has `companyId`)
- **Email:** Transactional email provider (e.g., Resend/SendGrid) for approvals, notifications

## 3. High-Level App Flow

```
Visitor hits root domain
   │
   ▼
Public Landing Page (features, how-it-works, FAQ, pricing)
   │
   ▼
Visitor clicks "Login" → Login Page shows two paths
   │
   ├── Company Login ──────────────┐
   │                                │
   └── Employee Login ──────────────┤
                                     ▼
                    Auth validated against the correct
                    schema (CompanyAccount vs Employee)
                                     │
                                     ▼
                    Role & Company resolved
                    (JWT/session includes companyId + role + accountType)
                                     │
                                     ▼
                            Dashboard loads (role-specific)
                                     │
   ├── Owner/Admin → Company Dashboard (org-wide metrics)
   ├── Manager      → Team Dashboard (team workload, approvals)
   ├── HR           → HR queue (leave, reimbursements, requests)
   └── Employee     → My Work / My Growth / My Requests
   │
   ▼
User interacts (create task, submit request, approve, view profile)
   │
   ▼
API validates request → writes to DB (scoped to companyId)
   │
   ▼
Background jobs recompute: workload %, performance score, alerts
   │
   ▼
Dashboard reflects updated state (via refetch or websocket/event)
```

### 3.1 Public Site vs. App Shell

The app is split into two distinct experiences at the routing level:

- **Public/Marketing routes** — no auth required, SEO-friendly, server-rendered (landing page, features, FAQ, pricing, login/register pages).
- **App routes** — behind auth middleware, role-aware shell (dashboard, employees, projects, tasks, performance, requests, my-space).

Middleware checks the session on every app route; unauthenticated users are redirected to `/login`.

## 4. Core Data Model (Entities)

- **Company** (tenant root)
- **CompanyAccount** — the login identity for Owner/Admin/Manager/HR users. Created at registration (Owner) or invited by an Owner/Admin (Manager/HR). Schema: `id, companyId, fullName, workEmail (unique per company), passwordHash, role [Owner|Admin|Manager|HR], createdAt`.
- **Employee** — the login identity for regular employees. Always created by a Company (never self-registers). Schema: `id, companyId, employeeCode (unique per company), fullName, companyEmail, passwordHash, department, jobRole, managerId (self-relation to CompanyAccount or Employee), status [Invited|Active|Suspended], joinedAt`. Employee also carries the HR profile fields (leave info, achievements, etc.) described in PRD.md § 6.2.
- **Department**
- **Project** (linked to Client, Company)
- **Client**
- **Task** (linked to Project, Assignee/Employee)
- **PerformanceRecord** (linked to Employee, computed periodically)
- **Goal** (linked to Employee)
- **Feedback** (linked to Employee, given by Manager)
- **Request** (polymorphic: Leave / Reimbursement / Equipment / WFH / HR / Complaint / Document / Suggestion)
- **Alert** (system-generated exception, linked to Company)
- **Attachment** (linked to Task/Request)
- **Comment** (linked to Task)

### Simplified Relationships

```
Company  1---* CompanyAccount   (Owner/Admin/Manager/HR logins)
Company  1---* Employee         (Employee logins)
Company  1---* Client
Company  1---* Project
Client   1---* Project
Project  1---* Task
Employee 1---* Task (assignee)
Employee 1---* Request
Employee 1---* PerformanceRecord
Employee 1---* Goal
Employee 1---* Feedback (received, given by a CompanyAccount)
Task     1---* Comment
Task     1---* Attachment
Request  1---* Attachment
```

> Note: both `CompanyAccount` and `Employee` are tenant-scoped by `companyId`, but they are **separate tables with separate login schemas** — a Company login never authenticates against the Employee table and vice versa. This keeps permissions and data shape clean instead of forcing one polymorphic "User" table to serve two very different access patterns.

## 5. Folder & File Structure

```
agency-os/
├── app/                          # Next.js App Router
│   ├── (marketing)/               # Public site — no auth required
│   │   ├── page.tsx                # Landing page (hero, features, how-it-works)
│   │   ├── features/
│   │   ├── pricing/
│   │   ├── faq/
│   │   └── layout.tsx              # Public nav/footer shell
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx            # Login page — choice of Company vs Employee
│   │   │   ├── company/            # Company login form
│   │   │   └── employee/           # Employee login form
│   │   └── register/               # Company registration (creates tenant + Owner CompanyAccount)
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Role-aware shell (sidebar/nav)
│   │   ├── dashboard/            # Company/Team dashboard
│   │   ├── employees/            # Employee directory & profiles
│   │   ├── projects/             # Projects & clients
│   │   ├── tasks/                # Task board / list
│   │   ├── performance/          # Performance tracking
│   │   ├── requests/             # Employee requests & approvals
│   │   └── my-space/             # Employee self-service (My Work/Growth/Requests)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── company/            # Company registration/login/reset
│   │   │   └── employee/           # Employee login/reset (invite-based)
│   │   ├── employees/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── performance/
│   │   ├── requests/
│   │   └── alerts/
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── dashboard/                # Widgets: workload chart, alert panel, etc.
│   ├── employees/
│   ├── tasks/
│   └── requests/
├── lib/
│   ├── db.ts                     # Prisma client
│   ├── auth.ts                   # Auth config/helpers
│   ├── permissions.ts            # Role-based access checks
│   ├── workload.ts               # Workload calculation logic
│   ├── performance.ts            # Performance scoring logic
│   └── alerts.ts                 # Early-warning rule engine
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── jobs/
│   ├── recalculateWorkload.ts
│   ├── recalculatePerformance.ts
│   └── generateAlerts.ts
├── types/
├── public/
├── PRD.md
├── Architecture.md
├── Rules.md
├── Phases.md
├── Design.md
├── Memory.md
└── package.json
```

## 6. Key Architectural Decisions

- **Multi-tenancy via shared DB + `companyId` scoping** — simplest to build and scale for v1; every query is filtered by the authenticated user's company.
- **Computed metrics (workload, performance, alerts) run as background jobs**, not on every page load, to keep dashboards fast. Cached results are stored and refreshed on a schedule (e.g., every 15–60 minutes) plus on key events (task status change, new request).
- **Role-based rendering** — the dashboard shell adapts its navigation and widgets based on the logged-in user's role, rather than maintaining separate apps.
- **Polymorphic Request model** — all employee request types share a common table/shape with a `type` field, keeping the approval workflow logic in one place instead of duplicating per request type.

## 7. Notifications Flow

```
Event occurs (task assigned, request submitted, request approved/rejected, task overdue)
   │
   ▼
Event handler creates in-app notification + queues email (if enabled)
   │
   ▼
User sees notification bell / receives email
```

## 8. Security Considerations

- All API routes verify session + tenant scoping before any DB read/write
- Role checks enforced server-side (never trust client-side role display alone)
- File uploads scanned/validated by type and size before storage
- Passwords hashed (bcrypt/argon2) if not using a managed auth provider
- **Login routing is enforced server-side, not just via UI choice**: the `/api/auth/company` endpoint only ever checks the `CompanyAccount` table, and `/api/auth/employee` only ever checks the `Employee` table — the two never cross-check, so credentials from one cannot be used to authenticate as the other.
- Employees cannot self-register; an `Employee` row is only created by a `CompanyAccount` with Admin/HR role, via an invite-link flow (temporary token → employee sets password on first login).
