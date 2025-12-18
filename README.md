# RCM Studio MVP

Multi-tenant RCM (revenue cycle management) MVP built on Next.js 15 (App Router, JS only). Supports patient/insurance, encounters, charges, claim build/scrub, AI review, submission stub, denials, worklists, reporting, audit logging, and role-based access.

## Prerequisites
- Node 18+ (uses ESM)
- npm
- Optional: MySQL for persistence (Prisma)
- Optional: GitHub Models PAT for AI (`GITHUB_TOKEN`)

## Quickstart (dev)
```bash
npm install
npm run dev
```
App serves under base path `/rcm-studio`: http://localhost:3000/rcm-studio/login

Demo users:
- Admin: `demo@rcmstudio.com` / `password`
- Biller: `biller@rcmstudio.com` / `password`
- Coder: `coder@rcmstudio.com` / `password`

## Production
```bash
npm run build
npm run start   # basePath /rcm-studio
```
Use `PORT=3001 npm run start` if 3000 is busy.

## Configuration
- Base path: `next.config.mjs`, `lib/clientConfig.js` (`/rcm-studio`)
- Auth: JWT cookie; roles `ADMIN | BILLER | CODER`
- AI Copilot: GitHub Models (GPT-4o). Set `GITHUB_TOKEN` (PAT). Optional `GITHUB_MODEL` (defaults to `openai/gpt-4o`).
- Database: set `DATABASE_URL="mysql://user:pass@host:3306/db"`, then:
  ```bash
  npm run prisma:migrate
  npm run prisma:generate
  npx prisma db execute --file db/seed.sql --schema prisma/schema.prisma
  ```

## Seeds
`db/seed.sql` creates demo tenant, users, patients, insurance, encounters, charges, claims, denials. Run after migrations (Prisma schema adds tenant address, insurance card URL, claim submittedAt).

## Features
- Multi-tenant schema with audit logs on all mutations
- Patients + primary insurance (card URL + upload to `/media/insurance-cards`)
- Encounters (manual + CSV import via `/api/encounters/import/file`)
- Charges per encounter
- Claim build (internal 837P JSON), scrubber (hard edits), submission stub (status + submittedAt)
- AI Copilot (GPT-4o) for claim review/suggestions/creation; human-in-the-loop apply
- Denials (manual)
- Worklists (draft, scrubber errors, submitted, rejected, denied)
- Reporting (summary + first-pass acceptance; CSV export `/api/reports/claims`)
- Role gating in API and UI (admin-only audit logs, users, settings)

## APIs (high level)
- Auth: `POST /api/auth/login`, `GET /api/me`
- Patients: `GET/POST /api/patients`, `GET /api/patients/:id`
- Encounters: `GET/POST /api/encounters`, `GET /api/encounters/:id`, `POST /api/encounters/import/file`
- Charges: `POST /api/charges`
- Claims: `POST /api/claims/build`, `GET /api/claims`, `GET /api/claims/:id`
  - Scrub: `POST /api/claims/:id/scrub`
  - AI review: `POST /api/claims/:id/ai-review`
  - Apply AI: `POST /api/claims/:id/apply-suggestions`
  - Submit: `POST /api/claims/:id/submit`
  - Status (admin): `POST /api/claims/:id/status`
- Denials: `POST /api/denials`
- Worklists: `GET /api/worklists`
- Reports: `GET /api/reports/summary`, `GET /api/reports/claims`
- Users (admin): `GET/POST /api/users`, `PUT/DELETE /api/users/:id`
- Settings (admin): `GET/POST /api/settings`
- Audit (admin): `GET /api/audit`
- Uploads: `POST /api/upload/insurance-card`

## UI Pages
- `/login`, `/dashboard`
- `/patients`, `/patients/new`, `/patients/[id]`
- `/encounters/new`, `/encounters/[id]`
- `/claims`, `/claims/[id]`
- `/worklists`, `/reports`
- `/settings` (admin), `/users` (admin), `/audit` (admin)

## File uploads & media
- Insurance card uploads saved under `media/insurance-cards/` and served via `/media/...`.
- Ensure `media/` exists and is writable in production.

## CSV Import
- Endpoint: `POST /api/encounters/import/file`
- Headers: `patient_id,date_of_service,provider_npi,place_of_service,notes`

## Role Enforcement
- Admin-only: users, settings, audit, claim status updates.
- Admin/Biller: patients, encounters, build/submit claims, denials.
- Admin/Biller/Coder: charges, scrubber, AI review/apply.
- UI gates actions based on role; API remains the final guardrail.

## Troubleshooting
- Port in use: run with `PORT=3001 npm run start`.
- Schema errors: run `npm run prisma:migrate` or `npx prisma db push`, then re-seed.
- AI 404/invalid model: set `GITHUB_TOKEN`, ensure `GITHUB_MODEL` is a model name (not the token).
