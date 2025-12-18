## RCM Studio MVP – Runbook (Local)

1) Install dependencies  
`npm install`

2) Start dev server (uses basePath `/rcm-studio`)  
`npm run dev`

3) Open the app  
http://localhost:3000/rcm-studio/login

4) Login (demo users)  
Admin: `demo@rcmstudio.com` / `password`  
Biller: `biller@rcmstudio.com` / `password`  
Coder: `coder@rcmstudio.com` / `password`

5) End-to-end flow (happy path)  
- Create patient (adds insurance inline)  
- Create encounter for that patient  
- Add charges to the encounter  
- Build claim (button on encounter detail)  
- Run scrubber (on claim detail)  
- Run AI review, optionally apply suggestions (claim detail)  
- Submit claim (enabled after scrubber passes)  
- View worklists/reports for status

6) Start in production mode (build + start)  
`npm run build`  
`npm run start` (serves on the same basePath `/rcm-studio`)

Notes  
- Data is in-memory for demo; restart resets state.  
- MySQL + Prisma: set `DATABASE_URL="mysql://user:pass@host:3306/db"` then run `npm run prisma:migrate` and `npm run prisma:generate`.  
- Optional seed: apply `db/seed.sql` to create demo data and users.  
- Upload storage uses `/media` (insurance cards at `/media/insurance-cards`).  
- CSV import supports file upload at `/api/encounters/import/file` with headers: `patient_id,date_of_service,provider_npi,place_of_service,notes`.  
- AI Copilot uses GitHub Models; set `GITHUB_TOKEN` and optionally `GITHUB_MODEL` (defaults to `openai/gpt-4o`).  
- Base path is enforced in `next.config.mjs` and `lib/clientConfig.js`.  
- Custom server entry: `app.js` (used by `npm run start`).  
- No external services required; MySQL wiring would replace `lib/store.js` for persistence.
