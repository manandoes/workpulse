# Phases.md — Project Build Phases

Build one phase at a time. Do not start a phase until the previous one is functional and verified. Update Memory.md after each phase.

## Phase 0 — Project Setup

- Initialize Next.js project with TypeScript, Tailwind, shadcn/ui
- Set up Prisma + PostgreSQL connection
- Set up `.env` / `.env.example`
- Set up basic folder structure per Architecture.md
- Set up linting/formatting (ESLint, Prettier)
- Deploy a "hello world" version to confirm hosting pipeline works

## Phase 1 — Landing Page & Marketing Site

- Build public landing page: hero, features overview, how-it-works, FAQ, pricing placeholder, footer
- Apply Design.md brand theme (yellow/brown, minimalist) from the start, since this is the first thing visitors see
- Header nav includes "Company Login" and "Employee Login" entry points (routes can be stubbed initially)

**Done when:** the marketing site is live, responsive, and visually matches Design.md, even before auth exists.

## Phase 2 — Auth & Multi-Tenancy Foundation (Dual Login)

- Company registration flow (creates a new Company/tenant + first `CompanyAccount` with role Owner)
- Login page with two distinct paths: **Company Login** and **Employee Login**, each with its own form and its own schema (see Architecture.md § 4 and § 8)
- `CompanyAccount` login (work email + password) → authenticates against `CompanyAccount` table only
- `Employee` login (Company ID/slug + Employee ID or email + password) → authenticates against `Employee` table only
- Employee invite flow: Admin/HR adds an employee → invite email sent → employee sets password on first login (employees never self-register)
- Session handling encodes `companyId`, `role`, and `accountType` (CompanyAccount vs Employee)
- Basic role-aware dashboard shell (sidebar/nav differs by role, even if pages are empty)
- Tenant scoping helper (`companyId` filtering utility used by all future queries)

**Done when:** a visitor can register a company from the landing page, an Admin can invite an employee, both a Company login and an Employee login work independently through their own forms/schemas, and each lands on the correct role-appropriate empty dashboard shell.

## Phase 3 — Employee Management

- Employee profile model (personal + professional info, department, role, manager)
- Employee directory (list + search/filter)
- Employee profile detail page
- Invite/add employee flow (Admin/HR only)
- Org structure (manager → reports relationship)

**Done when:** Admin/HR can add, view, edit, and list employees with correct role-based visibility.

## Phase 4 — Projects & Clients

- Client model
- Project model (linked to client)
- Project list + detail page
- Assign employees to a project (team members)
- Basic project financials fields (project value, estimated cost)

**Done when:** a manager can create a client, create a project under that client, and assign a team.

## Phase 5 — Task Management

- Task model (assignee, project, priority, deadline, status, estimated effort, comments, attachments)
- Task board (Kanban) + list view
- Task status flow, overdue auto-flagging
- Comments and file attachments on tasks

**Done when:** tasks can be created, assigned, moved through statuses, and overdue tasks are auto-flagged.

## Phase 6 — Workload Intelligence

- Workload calculation logic (based on active tasks, estimated effort, deadlines)
- Workload display per employee (%, visual indicator)
- "Suggest next assignee" helper based on lowest workload
- Background job to recalculate workload periodically

**Done when:** the dashboard shows accurate, auto-updating workload % per employee.

## Phase 7 — Employee Requests & Approvals

- Request model (Leave, Reimbursement, Equipment, WFH, HR, Complaint, Document, Suggestion)
- Employee-facing request submission form
- Manager/HR approval queue (approve/reject/comment)
- Notifications on status change

**Done when:** an employee can submit any request type and a manager/HR can approve or reject it, with the employee notified.

## Phase 8 — Performance Tracking

- Performance scoring engine (task completion, on-time delivery, workload, feedback, goals)
- Goal creation/tracking per employee
- Manager feedback log
- Performance history timeline on employee profile

**Done when:** each employee has a computed performance score that updates as tasks/goals/feedback change, viewable on their profile.

## Phase 9 — Company Dashboard & Early-Warning Engine

- Aggregate dashboard: active employees/projects, task completion, overdue tasks, workload heatmap, pending approvals, reimbursement summary, performance trend
- Early-warning/exceptions engine (rule-based alerts: overdue tasks, overloaded employees, stalled projects, aging approvals)
- Configurable alert thresholds per company

**Done when:** Admin/Owner sees one dashboard with live counts and a red/yellow/green exceptions panel.

## Phase 10 — Employee Self-Service Dashboard

- "My Work" (today's tasks, deadlines, current projects, workload)
- "My Growth" (goals, performance, feedback, achievements)
- "My Requests" (leave, expenses, equipment, HR requests — status tracking)

**Done when:** an employee can log in and see their full picture without needing manager/HR views.

## Phase 11 — Client/Project Financial View (Agency-specific)

- Per-client rollup: project value, team size, task count, completion %, estimated cost, margin
- Agency-level aggregated revenue/cost/margin dashboard

**Done when:** an owner can view profitability per client and across the agency.

## Phase 12 — Polish & Hardening

- Notification system refinement (email + in-app)
- Permission audit across all routes
- Performance/query optimization for larger datasets
- Empty states, loading states, error states across all pages
- Basic automated tests for critical business logic

## Phase 13 (Post-v1 / Future)

- Native mobile apps
- Slack/Teams/WhatsApp integration
- AI-assisted task assignment
- Custom report builder
- Payroll integration
- Client-facing portal
