# RCM MVP – Agent-Executable Build Plan + UI Flow (Next.js 15, JS Only)

This document converts the requirements into a step-by-step, agent-executable implementation plan, and includes the full UI flow and page specifications.

---

## A) Hard Constraints (Non-Negotiable)

- JavaScript only (no TypeScript)
- Next.js 15 App Router for UI + backend (API routes + Server Actions)
- mysql only
- No Redis
- No async workers/queues/background jobs
- No real EDI parsing / no 837 file generation
- 837P *internal* claim JSON model only
- Human-in-the-loop AI (AI suggests; user applies; AI cannot mutate DB or submit)
- All DB queries filtered by `tenant_id`
- All mutations write `audit_logs`
- All logic synchronous and deterministic

---

## B) Implementation Plan (Step-by-Step Tasks)

### Phase 0 — Repo & Tooling Baseline
**Goal:** Create a runnable Next.js 15 monorepo-like structure with Postgres connectivity.

1. **Initialize Next.js 15 App Router project (JavaScript only)**
   - Create directories:
     - `app/`, `app/api/`, `lib/`, `services/`, `auth/`, `db/`
2. **Set up environment configuration**
   - `.env.local` with `DATABASE_URL`, `JWT_SECRET`
3. **Add database client**
   - Choose one minimal approach:
     - `pg` (node-postgres) + SQL files in `db/`
     - OR an ORM that supports JS (but keep minimal)
4. **Add migrations mechanism**
   - `db/migrations/*.sql`
   - A simple `db/migrate.js` script that applies migrations sequentially (no background jobs)

**Acceptance:** `npm run dev` starts; database connection test works.

---

### Phase 1 — Database Schema & Multi-Tenancy Guardrails
**Goal:** Implement the minimal schema and enforce tenant isolation everywhere.

1. **Create SQL migrations for tables**
   - `tenants`, `users`, `patients`, `insurances`, `encounters`, `charges`, `claims`, `denials`, `audit_logs`
2. **Add required indexes**
   - Index on `tenant_id` for every table
   - Index on foreign keys (`patient_id`, `encounter_id`, `claim_id`)
3. **Implement DB helpers**
   - `db/query.js` with `query(text, params)`
   - `db/tenantQuery.js` helpers to enforce `tenant_id` in WHERE clause
4. **Define status enums (application-level)**
   - Claims: `DRAFT | SUBMITTED | ACCEPTED | REJECTED | DENIED` (DENIED used via denials)
   - Encounters: `OPEN | READY | CLAIMED` (minimal; adjust as needed)

**Acceptance:** All tables exist; basic inserts/selects work; helper enforces tenant filtering.

---

### Phase 2 — AuthN/AuthZ (Email/Password + JWT Cookie)
**Goal:** Secure login and role-gated access.

1. **Auth utilities**
   - `auth/password.js` (bcrypt hash/verify)
   - `auth/jwt.js` (sign/verify)
   - `auth/cookies.js` (set/clear HTTP-only cookie)
2. **API routes**
   - `POST /api/auth/login`
     - Validate credentials
     - Create JWT payload `{ userId, tenantId, role }`
     - Set HTTP-only cookie
   - `GET /api/me`
     - Read cookie, verify JWT, return user context
3. **Route protection**
   - `lib/authGuard.js` for API routes: verify JWT, attach `req.user`
   - Role checks: `ADMIN | BILLER | CODER` per route as required

**Acceptance:** Login works; `/api/me` returns user context; unauthorized calls fail.

---

### Phase 3 — Audit Logging (Mandatory for Mutations + AI Calls)
**Goal:** Centralize audit logging and make it non-optional.

1. **Implement `lib/audit.js`**
   - `writeAudit({ tenantId, userId, entity, entityId, action, metadata })`
2. **Enforce in all create/update/delete API routes**
3. **Log AI calls**
   - Store prompt/input summary + structured output metadata (no excessive PHI duplication)

**Acceptance:** Every mutation creates an `audit_logs` record.

---

### Phase 4 — Core CRUD APIs (Patients, Encounters, Charges)
**Goal:** Build the minimal APIs to support the end-to-end workflow.

#### 4.1 Patients
1. `POST /api/patients`
   - Create or update patient + insurance (if included)
   - Tenant filter enforced
   - Audit log: `PATIENT_CREATED` / `PATIENT_UPDATED`
2. `GET /api/patients/:id`
   - Return patient + insurance list

#### 4.2 Encounters
1. `POST /api/encounters`
   - Create encounter (patient_id required)
   - Audit log: `ENCOUNTER_CREATED`
2. `GET /api/encounters/:id`
   - Return encounter + charges + linked claim (if exists)

#### 4.3 Charges
1. `POST /api/charges`
   - Create charge for encounter
   - Audit log: `CHARGE_CREATED`
   - (Optional) update/delete endpoints later; MVP can be create-only + UI “edit” deferred

**Acceptance:** You can create patient+insurance, encounter, charges and fetch encounter detail with charges.

---

### Phase 5 — Claim Engine: Build Internal 837P Claim JSON
**Goal:** Generate a claim record from encounter context.

1. **Claim builder service**
   - `services/claimBuilder.js`
   - Input: `patient`, `insurance`, `encounter`, `charges`, `tenant`
   - Output: internal JSON model:
     ```json
     {
       "billingProvider": { "npi": "", "taxId": "" },
       "renderingProvider": { "npi": "" },
       "subscriber": { "name": "", "memberId": "", "dob": "" },
       "patient": { "name": "", "dob": "" },
       "serviceLines": [{ "cpt": "", "icd10": "", "modifier": "", "units": 1, "charge": 0 }]
     }
     ```
2. **API: `POST /api/claims/build`**
   - Input: `encounterId`
   - Create claim row with `status = DRAFT` and `claim_json`
   - Audit log: `CLAIM_BUILT`

**Acceptance:** Clicking “Build Claim” creates a `claims` row with populated `claim_json`.

---

### Phase 6 — Claim Scrubber (Synchronous, Blocking)
**Goal:** Validate claim JSON and produce error list; gate submission.

1. **Scrubber service**
   - `services/scrubber.js`
   - Rules:
     - Missing patient DOB
     - Missing insurance member ID
     - Missing provider NPI
     - Invalid CPT format
     - Invalid ICD-10 format
     - Modifier without CPT
   - Output:
     ```json
     { "valid": false, "errors": [{ "field": "", "message": "" }] }
     ```
2. **API: `POST /api/claims/:id/scrub`**
   - Load claim + required context
   - Run scrubber synchronously
   - Store scrub results in `claims.claim_json` under a reserved key (example):
     - `claim_json.scrubber = { valid, errors, ranAt }`
   - Do **not** change claim status if invalid (stays `DRAFT`)
   - Audit log: `CLAIM_SCRUBBED`

**Acceptance:** Scrubber runs; errors appear; submit is disabled when invalid.

---

### Phase 7 — AI Copilot (Synchronous, Human-in-the-Loop)
**Goal:** AI reviews and suggests changes; user must explicitly apply.

1. **AI service wrapper**
   - `services/aiReview.js`
   - Input:
     ```json
     { "patient": {}, "encounter": {}, "charges": [], "claim": {} }
     ```
   - Output:
     ```json
     { "summary": "", "risks": [], "suggestedChanges": [], "confidence": 0.0 }
     ```
2. **API: `POST /api/claims/:id/ai-review`**
   - Load context
   - Call AI synchronously
   - Store result in `claims.claim_json.aiReview = { ...output, ranAt }`
   - Audit log: `AI_REVIEW_RAN` (include metadata: confidence, counts)
3. **Apply suggestions (user-driven)**
   - Implement an API route or Server Action for applying diffs:
     - `POST /api/claims/:id/apply-suggestions` (recommended even if not in original list)
   - Must:
     - Show diff preview on UI first
     - Require explicit user confirmation
     - Write audit log: `AI_SUGGESTIONS_APPLIED`
   - AI itself never writes to DB; only this user action does.

**Acceptance:** AI review appears; suggested changes preview; user applies changes; audit log records it.

---

### Phase 8 — Claim Submission Stub + Admin Status Toggles
**Goal:** Allow “submit”, and manual accept/reject toggles.

1. **API: `POST /api/claims/:id/submit`**
   - Preconditions:
     - Scrubber must be valid (`claim_json.scrubber.valid === true`)
   - Set claim status `SUBMITTED`
   - Audit log: `CLAIM_SUBMITTED`
2. **Admin toggles**
   - Minimal endpoint (optional but recommended):
     - `POST /api/claims/:id/status`
   - Only `ADMIN`
   - Allowed transitions: `SUBMITTED -> ACCEPTED | REJECTED`
   - Audit log: `CLAIM_STATUS_UPDATED`

**Acceptance:** Claim can be submitted; admin can toggle accepted/rejected.

---

### Phase 9 — Denials (Minimal)
**Goal:** Add denial records linked to a claim.

1. **API: `POST /api/denials`**
   - Input: `claimId`, `reason`, `status (OPEN|CLOSED)`
   - Insert into `denials`
   - Optionally set claim status `DENIED` (application-level)
   - Audit log: `DENIAL_CREATED`

**Acceptance:** Denial can be created from Claim Detail; appears in worklists/reports.

---

### Phase 10 — Reporting & Worklists (Query-Based)
**Goal:** Summary stats + query-based worklists.

1. **API: `GET /api/reports/summary`**
   - Return:
     ```json
     { "totalClaims": 0, "submittedClaims": 0, "rejectedClaims": 0, "deniedClaims": 0 }
     ```
   - Implement using tenant-filtered counts
2. **Worklists (no DB entity)**
   - Implement via API query params and pre-defined filters
   - Example endpoints (recommended):
     - `GET /api/claims?status=DRAFT`
     - `GET /api/claims?status=SUBMITTED`
     - `GET /api/claims?hasScrubberErrors=true`
     - `GET /api/encounters?withoutClaim=true`

**Acceptance:** Dashboard metrics populate; worklists tabs show correct data.

---

### Phase 11 — Frontend Pages & UI Components (Next.js 15)
**Goal:** Implement pages using Server Components by default, Client Components only for forms/tables/modals.

- Pages:
  - `/login`
  - `/dashboard`
  - `/patients`
  - `/patients/new`
  - `/patients/[id]`
  - `/encounters/new`
  - `/encounters/[id]`
  - `/claims`
  - `/claims/[id]`
  - `/worklists`
  - `/reports`
  - `/settings`

**Acceptance:** A user can complete the end-to-end flow without using Postman.

---

### Phase 12 — End-to-End QA Against MVP Completion Criteria
**Goal:** Agent-verifiable final checklist.

1. Login
2. Create patient
3. Add insurance
4. Create encounter
5. Add charges
6. Build claim
7. Run scrubber
8. Run AI review
9. Apply fixes
10. Submit claim
11. Track claim status via worklists

**Acceptance:** If all steps work, MVP is complete.

---

## C) UI Flow Specification (Full)

### 0) Global UI Layout (Applies to All Pages)

**App Shell**
- Left Sidebar Navigation
  - Dashboard
  - Patients
  - Encounters
  - Claims
  - Worklists
  - Reports
  - Settings
- Top Bar
  - Practice name
  - Logged-in user
  - Logout

**Global Components**
- Data tables (sortable, filterable)
- Status badges (Draft, Submitted, Rejected, etc.)
- Primary actions (Create, Save, Submit)
- Confirmation modals
- Toast notifications

---

### 1) Authentication Pages

#### 1.1 Login Page
- **Route:** `/login`

**UI Components**
- Email input
- Password input
- Login button
- Error alert

**Actions**
- `POST /api/auth/login`
- On success → redirect `/dashboard`

---

### 2) Dashboard Page

#### 2.1 Dashboard
- **Route:** `/dashboard`

**Widgets**
- Total Claims
- Draft Claims
- Submitted Claims
- Rejected Claims
- Denied Claims

**Table: Recent Claims (last 10)**
- Claim ID
- Patient
- Status
- DOS
- Actions → View

**Actions**
- Navigate to Claims
- Navigate to Worklists

---

### 3) Patients Module

#### 3.1 Patient List
- **Route:** `/patients`

**Table Columns**
- Patient Name
- DOB
- Gender
- Actions → View

**Actions**
- Create Patient button

#### 3.2 Create / Edit Patient
- **Routes:** `/patients/new`, `/patients/[id]`

**Sections**
- Patient Info
  - First Name
  - Last Name
  - DOB
  - Gender
- Insurance Info
  - Payer Name
  - Member ID
  - Subscriber Name
  - Subscriber DOB

**Actions**
- Save Patient
- Save & Create Encounter

---

### 4) Encounters Module

#### 4.1 Create Encounter
- **Route:** `/encounters/new`

**Fields**
- Patient (dropdown)
- Date of Service
- Provider NPI
- Place of Service
- Notes (textarea)

**Actions**
- Save Encounter
- Add Charges

#### 4.2 Encounter Detail
- **Route:** `/encounters/[id]`

**Sections**
- Encounter Summary
  - Patient
  - DOS
  - Provider
  - Status
- Charges Table
  - CPT
  - ICD-10
  - Modifier
  - Units
  - Charge Amount
  - Actions → Edit / Delete

**Actions**
- Add Charge
- Build Claim (primary CTA)

---

### 5) Charges (Inline Workflow)

Charges are inline only inside Encounter Detail.

**Add/Edit Charge Modal**
- CPT
- ICD-10
- Modifier
- Units
- Charge Amount
- Save

---

### 6) Claims Module

#### 6.1 Claims List
- **Route:** `/claims`

**Table Columns**
- Claim ID
- Patient
- DOS
- Status
- Actions → View

**Filters**
- Status
- Patient

#### 6.2 Claim Detail (Core Page)
- **Route:** `/claims/[id]`

This is the most important MVP page.

**Section 1: Claim Header**
- Claim ID
- Encounter
- Patient
- Payer
- Status badge

**Section 2: Service Lines Table (Read-only in MVP)**
- CPT
- ICD-10
- Modifier
- Units
- Charge Amount

**Section 3: Scrubber Results Panel**
- Button: Run Scrubber
- Errors list:
  - Field
  - Message
- Status effects:
  - Errors → disable submit

**Section 4: AI Copilot Panel (Right Sidebar)**
Buttons:
- Review Claim
- Apply Suggestions

Display:
- Summary
- Risks list
- Suggested Changes (field-level)

**UX Rules**
- Show diff preview before apply
- User must confirm

**Section 5: Actions**
- Save
- Submit Claim (enabled only if scrubber passes)

---

### 7) Worklists

#### 7.1 Worklists Page
- **Route:** `/worklists`

**Tabs**
- Draft Claims
- Scrubber Errors
- Submitted Claims
- Rejected Claims
- Denied Claims

Each Tab = Table:
- Claim ID
- Patient
- Status
- Action → Open Claim

---

### 8) Denials

#### 8.1 Add Denial
- **Route:** Inline from Claim Detail

**Modal Fields**
- Reason (textarea)
- Status (Open/Closed)

**Actions**
- Save Denial

#### 8.2 Denials List
- **Route:** `/claims?status=DENIED`
- Same UI as Claims List, filtered

---

### 9) Reports

#### 9.1 Reports Dashboard
- **Route:** `/reports`

**Metrics Cards**
- Total Claims
- Submitted
- Rejected
- Denied

**Table**
- Claim ID
- Status
- DOS
- Actions
- Export CSV

---

### 10) Settings

#### 10.1 Practice Settings
- **Route:** `/settings`

**Fields**
- Practice Name
- NPI
- Tax ID
- Address

**Actions**
- Save

---

### 11) End-to-End MVP Workflow (User Journey)

Primary Billing Flow:
1. Login
2. Create Patient
3. Add Insurance
4. Create Encounter
5. Add Charges
6. Build Claim
7. Run Scrubber
8. Run AI Review
9. Apply Fixes
10. Submit Claim
11. Track Status via Worklists

---

## D) Suggested Build Order (Developer-Optimized)

1. DB migrations + tenant guardrails  
2. Auth (login + /me)  
3. Patients (create + view)  
4. Encounters (create + detail)  
5. Charges (inline modal + API)  
6. Build claim  
7. Scrubber + submit gating  
8. Claims list + claim detail page  
9. AI review + apply suggestions  
10. Worklists  
11. Reports summary + CSV  
12. Settings  

---

## E) Agent-Verifiable Done Definition

MVP is complete when a BILLER can:
- Create patient + insurance
- Create encounter
- Add charges
- Build claim
- Run scrubber and see errors
- Run AI review and see suggestions
- Apply suggestions with confirmation
- Submit claim (only when scrubber passes)
- View claim status and track via worklists

