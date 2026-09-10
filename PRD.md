# PRD.md — Product Requirements Document

## 1. Product Name

**Talking Lens Media** (working title) — Agency Operations & Employee Management Platform

## 2. One-Line Pitch

An all-in-one operating dashboard for agencies that connects employees, projects, tasks, performance, expenses, and internal operations in one place.

## 3. Problem Statement

As agencies and small/mid-sized teams grow, internal operations become fragmented across:

- Spreadsheets for employee data
- Separate project management tools for tasks
- WhatsApp/email for reimbursements and requests
- Manual, occasional performance reviews

There is no single place for a manager to answer basic questions like "what is everyone working on," "who is overloaded," or "which projects are falling behind."

## 4. Target Users

### Primary Users

- **Agency Owners / Founders** — need a bird's-eye view of company health
- **Managers / Team Leads** — assign work, track workload, approve requests
- **HR / Ops Admins** — manage employee records, leave, reimbursements
- **Employees** — view their tasks, submit requests, track their own growth

### Target Company Profile

- Startups, digital/creative/marketing agencies, and growing teams
- Typically 5–200 employees
- Currently juggling 3+ disconnected tools for people + work management

## 5. Goals & Success Metrics

| Goal                               | Metric                                                 |
| ---------------------------------- | ------------------------------------------------------ |
| Replace scattered tracking tools   | % of employee/task data centralized in-platform        |
| Reduce overload / burnout          | Reduction in employees at >90% workload                |
| Faster issue detection             | Time from problem occurrence to manager visibility     |
| Simplify approvals                 | Average approval turnaround time for requests          |
| Improve retention of ops knowledge | % of internal requests resolved without email/WhatsApp |

## 6. Core Modules & Features

### 6.0 Public Landing / Marketing Page

- Publicly accessible marketing site (no login required) at the root domain
- **Hero section** — one-line pitch + primary CTA ("Get Started" / "Login")
- **Features section** — visual breakdown of core modules (Dashboard, Employee Management, Task & Project Management, Workload Intelligence, Performance Tracking, Employee Requests, Client Financials)
- **How it works** — simple 3–4 step visual (e.g., Add your team → Assign projects & tasks → Track workload & performance → Approve requests, all from one dashboard)
- **Pricing section** (placeholder/plans structure for v1, even if only one tier initially)
- **FAQ section** — common questions (e.g., "Is this an HRMS replacement?", "Can employees see each other's performance?", "Is my company's data isolated from others?", "Can I invite employees after signing up?")
- **Testimonials/social proof** placeholder section (for future use)
- **Footer** — links to login, contact, terms/privacy
- Two distinct CTAs in the header/nav: **Company Login** and **Employee Login** (see 6.0.1)

#### 6.0.1 Login Page — Dual Login Paths

The login page presents two clearly separated options, since the two audiences authenticate differently and land in different experiences:

- **Company Login** — for Owners/Admins/Managers/HR who manage the account. Registration creates a new Company workspace. Login fields: **Company work email + password** (optionally + Company ID/slug for disambiguation if email isn't unique across tenants).
- **Employee Login** — for regular employees who were invited/added by their company. Employees do not self-register. Login fields: **Company ID (or company-specific login slug/domain) + Employee ID or Employee email + password** (password set via an invite link sent by the company).

These two paths use **different login schemas** (see Architecture.md § 4 for data model) because a Company login authenticates an account that owns/administers a tenant, while an Employee login authenticates a member scoped to an existing tenant with a narrower permission set.

After successful login, the user is routed to the role-appropriate dashboard (Company/Manager/HR dashboard vs. Employee self-service dashboard).

### 6.1 Company Dashboard

- Real-time counts: active employees, active projects, task completion %
- Overdue tasks widget
- Team workload heatmap
- Pending approvals queue
- Reimbursement summary
- Employee request summary
- Performance trend snapshot
- Early-warning / exceptions panel (red/yellow/green alerts)

### 6.2 Employee Management

- Employee profile: personal + professional info, department, role, manager
- Linked data: current projects, assigned tasks, performance history, goals, feedback, leave, reimbursements, requests, achievements
- Org chart / reporting structure
- Role-based access control (Admin, Manager, Employee, HR)

### 6.3 Task & Project Management

- Projects contain multiple tasks; tasks link to employees and projects
- Task fields: assignee, project, priority, deadline, status, estimated effort, actual completion, comments, attachments
- Kanban / list / calendar views
- Task status flow: To Do → In Progress → In Review → Done → Overdue (auto-flag)

### 6.4 Workload Intelligence

- Calculates per-employee workload % based on active tasks, estimated effort, and deadlines
- Visual indicators (e.g., Rahul 92%, Priya 61%, Aman 38%)
- Suggests next-assignee based on lowest workload + relevant skill/role

### 6.5 Performance Tracking

- Continuous scoring engine using: task completion rate, on-time delivery, workload carried, project contribution, manager feedback, goal progress, rework/quality indicators
- Performance history timeline per employee
- Goal-setting and tracking (OKR-style, simple)
- Manager feedback log

### 6.6 Employee Requests

- Request types: Reimbursement, Leave, Equipment, Work-from-home, HR request, Complaint/Issue, Document request, Suggestion
- Each request: status (Pending/Approved/Rejected), approver, comments, attachments
- Approval workflow with notifications

### 6.7 Client & Project Financials (Agency-specific)

- Per-client view: project value, team assigned, task count, completion %, estimated cost, margin
- Aggregated agency-level revenue/cost/margin view

### 6.8 Early-Warning / Exceptions Engine

- Rule-based alerts: overdue tasks, overloaded employees, stalled projects, pending approvals aging beyond X days
- Configurable thresholds per company

### 6.9 Employee Self-Service Dashboard

- **My Work**: today's tasks, upcoming deadlines, current projects, workload
- **My Growth**: goals, performance, feedback, achievements
- **My Requests**: leave, expenses, equipment, HR requests

## 7. Non-Goals (Out of Scope for v1)

- Full payroll processing / tax compliance
- Deep HRMS features (e.g., statutory compliance, biometric attendance)
- Native mobile apps (web-responsive only for v1)
- Replacing dedicated PM tools' advanced features (e.g., Gantt-level resource planning)
- Multi-currency accounting

## 8. Authentication Model Summary

| Aspect              | Company Login                                                                                    | Employee Login                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Who uses it         | Owner, Admin, Manager, HR                                                                        | Employee                                                                        |
| Account creation    | Self-registration (creates new Company/tenant)                                                   | Invited by company (Admin/HR adds them; employee sets password via invite link) |
| Login identifier    | Work email (+ optional Company ID/slug)                                                          | Company ID/slug + Employee ID or email                                          |
| Landing after login | Company/Team Dashboard                                                                           | Employee Self-Service Dashboard (My Work/Growth/Requests)                       |
| Password reset      | Standard email-based reset                                                                       | Standard email-based reset, scoped to their company                             |
| Underlying schema   | `CompanyAccount` (linked 1:1 with Company as owner, or N Admin/Manager/HR users under a Company) | `Employee` (always linked to an existing `Company`, cannot exist without one)   |

## 9. User Roles & Permissions (v1)

| Role        | Permissions                                                           |
| ----------- | --------------------------------------------------------------------- |
| Owner/Admin | Full access: company settings, all employees, all projects, approvals |
| Manager     | Manage own team's tasks, projects, requests, performance              |
| HR          | Manage employee records, leave, reimbursements, HR requests           |
| Employee    | View/manage own tasks, submit requests, view own performance          |

## 10. Key User Stories

- As a manager, I want to see my team's current workload so I can assign new tasks fairly.
- As an owner, I want a single dashboard showing overdue tasks and stalled projects so I can intervene early.
- As an employee, I want to submit a reimbursement request and track its approval status without emailing anyone.
- As HR, I want to see all pending leave requests in one queue.
- As a manager, I want to see which client projects are profitable and which are over-budget.

## 11. Assumptions & Constraints

- Initial version is web-based, multi-tenant (one instance serves many companies)
- Each company's data is isolated (tenant-scoped)
- Performance scoring is directional/indicative, not a certified HR compliance tool
- Currency defaults to INR but should be configurable per company

## 12. Future Roadmap (Post v1)

- Native mobile apps
- Slack/Teams/WhatsApp integrations for notifications
- AI-assisted task assignment recommendations
- Advanced analytics & custom report builder
- Payroll integration (third-party)
- Client-facing portal
