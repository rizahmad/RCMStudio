0) Hard Constraints (Do Not Violate)

Language: JavaScript only

Frontend + Backend: Next.js 15 (App Router)

Backend style: API routes / server actions (no separate NestJS)

Database: PostgreSQL

No Redis

No async workers / queues

No real EDI parsing

837P only

Human-in-the-loop AI

1) System Architecture
1.1 Architecture pattern

Monorepo, single runtime

Next.js 15
├── app/            (UI routes)
├── app/api/        (REST API)
├── lib/            (domain logic)
├── db/             (SQL / migrations)
├── services/       (AI, claim engine)
└── auth/           (JWT helpers)


API routes handle all backend logic

Server Actions allowed for CRUD where appropriate

No message queues, no workers

2) Authentication & Authorization
2.1 Auth mechanism

Email + password

Password hashing (bcrypt)

JWT stored in HTTP-only cookie

JWT payload:

{
  "userId": "uuid",
  "tenantId": "uuid",
  "role": "ADMIN | BILLER | CODER"
}

2.2 Authorization rules

Every DB query MUST filter by tenant_id

Route-level role checks

No field-level PHI masking (post-MVP)

3) Database Models (PostgreSQL – Minimal)
3.1 tenants
tenants (
  id UUID PK,
  name TEXT,
  npi TEXT,
  tax_id TEXT,
  address TEXT,
  created_at TIMESTAMP
)

3.2 users
users (
  id UUID PK,
  tenant_id UUID FK,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT,
  created_at TIMESTAMP
)

3.3 patients
patients (
  id UUID PK,
  tenant_id UUID FK,
  first_name TEXT,
  last_name TEXT,
  dob DATE,
  gender TEXT
)

3.4 insurances
insurances (
  id UUID PK,
  tenant_id UUID FK,
  patient_id UUID FK,
  payer_name TEXT,
  member_id TEXT,
  subscriber_name TEXT,
  subscriber_dob DATE
)

3.5 encounters
encounters (
  id UUID PK,
  tenant_id UUID FK,
  patient_id UUID FK,
  dos DATE,
  provider_npi TEXT,
  place_of_service TEXT,
  notes TEXT,
  status TEXT
)

3.6 charges
charges (
  id UUID PK,
  tenant_id UUID FK,
  encounter_id UUID FK,
  cpt TEXT,
  icd10 TEXT,
  modifier TEXT,
  units INT,
  charge_amount NUMERIC
)

3.7 claims
claims (
  id UUID PK,
  tenant_id UUID FK,
  encounter_id UUID FK,
  status TEXT,
  claim_json JSONB,
  created_at TIMESTAMP
)

3.8 denials
denials (
  id UUID PK,
  tenant_id UUID FK,
  claim_id UUID FK,
  reason TEXT,
  status TEXT
)

3.9 audit_logs
audit_logs (
  id UUID PK,
  tenant_id UUID FK,
  user_id UUID FK,
  entity TEXT,
  entity_id UUID,
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMP
)

4) Core Functional Logic
4.1 Encounter → Claim Flow

User creates patient

User adds insurance

User creates encounter

User adds charges

User clicks Build Claim

System:

Pulls patient, insurance, charges

Builds internal claim JSON

Run scrubber

Run AI review

User submits claim

4.2 Claim Builder (Internal 837P Model)

No EDI file generation in MVP

{
  billingProvider: { npi, taxId },
  renderingProvider: { npi },
  subscriber: { name, memberId, dob },
  patient: { name, dob },
  serviceLines: [
    { cpt, icd10, modifier, units, charge }
  ]
}


Stored in claims.claim_json.

4.3 Claim Scrubber (Synchronous)
Rules (blocking)

Missing patient DOB

Missing insurance member ID

Missing provider NPI

Invalid CPT format

Invalid ICD-10 format

Modifier without CPT

Output
{
  valid: false,
  errors: [{ field, message }]
}


If errors exist → claim status remains DRAFT.

5) AI Copilot (Minimal, Synchronous)
5.1 AI Service

Implemented as a simple function call

Runs synchronously in API route

Uses structured JSON only

Input
{
  patient,
  encounter,
  charges,
  claim
}

Output
{
  summary,
  risks: [],
  suggestedChanges: [],
  confidence: 0.0
}

5.2 AI Constraints

AI cannot write to DB

AI cannot submit claims

Suggestions applied only via user action

All AI calls logged in audit_logs

6) Claim Submission (Stub)
Behavior

POST /claims/:id/submit

Sets status → SUBMITTED

Admin can manually toggle:

ACCEPTED

REJECTED

No clearinghouse logic in MVP.

7) Worklists (Query-Based)

Worklists are saved queries, not entities.

Examples:

Draft claims

Submitted claims

Rejected claims

Encounters without claims

8) Reporting (Very Minimal)
API

/api/reports/summary

Returns:

{
  totalClaims,
  submittedClaims,
  rejectedClaims,
  deniedClaims
}


CSV export optional.

9) API Routes (Final)
POST   /api/auth/login
GET    /api/me

POST   /api/patients
GET    /api/patients/:id

POST   /api/encounters
GET    /api/encounters/:id

POST   /api/charges

POST   /api/claims/build
POST   /api/claims/:id/scrub
POST   /api/claims/:id/ai-review
POST   /api/claims/:id/submit

POST   /api/denials
GET    /api/reports/summary

10) Frontend Pages (Next.js 15)
/login
/dashboard
/patients
/patients/[id]
/encounters/[id]
/claims/[id]
/worklists
/reports


Server Components by default

Client Components only for forms and tables

11) Non-Functional Rules

All DB access must include tenant_id

All mutations write audit logs

No background jobs

No async retries

All logic must be synchronous and deterministic

12) MVP Completion Criteria (Agent-Verifiable)

A user can:

Create patient

Create encounter

Add charges

Build claim

Run scrubber

Run AI review

Submit claim

See claim status

If all above works → MVP complete.