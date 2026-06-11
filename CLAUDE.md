# CLAUDE.md

## Project

**Hooked** — AI-powered tow truck dispatch SaaS: dispatch board, driver app, owner console, billing, impound, motor clubs, rotations, and customer tracking/request pages.

- Stack: TanStack Start (file-based routing, React 19) + Supabase (Postgres/Auth/RLS) + Tailwind v4 + Vercel.
- Package manager: **bun** (`bun install`, `bun run dev`, `bun run build`, `bun run lint`, `bun run format`).

## Repo status

- This directory is the **real application repo** — git origin `https://github.com/michaelttvance/HOOKEDV2.git`, branch `main`. All app development happens here.
- It is currently nested inside a local-only outer folder (`HookAi V2/`). That outer folder is a scratch/container workspace, not part of the app — don't add app source there, and don't assume its `.gitignore`/git state applies here (this repo has its own).

## Routes

- File-based routing under `src/routes/` — see `src/routes/README.md` for naming conventions (no `src/pages/`, no Next/Remix-style `app/` dirs).
- `src/routeTree.gen.ts` is auto-generated — never hand-edit.
- Public: `/`, `/apply`, `/auth`, `/accept-invite`, `/forgot-password`, `/reset-password`, `/request/$companyId`, `/track/$jobId`, `/sitemap.xml`.
- Approval-gate pages: `/pending`, `/rejected`, `/trial-expired`.
- Authenticated app (role-gated by `_authenticated/route.tsx`): `/dashboard`, `/driver`, `/impound`, `/rotations`, `/motor-clubs`, `/billing`, `/settings`, `/insights`, `/inbound-emails` (hidden, no nav entry).
- Client-admin top-level route: `/owner` (company-scoped owner dashboard, gated by `user_roles.role = admin`).
- Staff-only (hardcoded email gate): `/founder`, `/admin`.
- Webhooks: `src/routes/api/public/*` (Twilio voice/SMS, inbound email, approval-action).

## Auth & roles — HANDLE WITH CARE

- Roles: `dispatcher`, `driver`, `admin` (`admin` added in a later migration; `has_role()` treats `admin` as satisfying `dispatcher` checks).
- Approval flow: signup → profile `status` of `pending`/`approved`/`rejected`, enforced in `_authenticated/route.tsx`, redirecting to `/pending`, `/rejected`, or `/trial-expired`.
- **Known fragility**: Hooked-staff super-admin access is hardcoded via email allowlists in `_authenticated/route.tsx`, `admin.tsx`, and `founder.tsx` plus a DB function `is_super_admin()` that currently only matches *one* of the two staff emails (existing mismatch). `/owner` is no longer a staff gate; it is a client-admin company dashboard.
- **Do not modify any access-control check, the `user_roles`/`has_role()` model, or related migrations as a side effect of an unrelated change.** This needs a dedicated, coordinated, tested pass across all locations at once — not an incidental edit.

## Demo / mock data

- `src/lib/seed-data.ts` is being trimmed to type-only definitions (`Job`, `Driver`, `HistoryJob`, etc.) used for typing across 12+ files. Don't reintroduce hardcoded demo data arrays here — verify `bun run build` / `bun run lint` still pass after further trims.
- `src/routes/index.tsx` (landing page) has self-contained demo widgets (`ProductDemoFilm`, `DispatchPanel`, `DriverPanel`, `AiPanel`, `BillingPanel`, `LiveDashboardPreview`) with hardcoded marketing copy — isolated, not wired to real data, fine to keep.
- Settings page has a founder-only "load/clear sample data" feature backed by `seed_demo_data` / `clear_demo_data` Supabase RPCs — intentional onboarding tool, keep.
- `public/demo-product-video.html`, `public/videos/`, `artifacts/`, `scripts/record-product-demo.mjs` are currently **untracked and not referenced by any route** (~27MB). Do not delete without checking — likely source material for a planned landing-page video embed.

## Dashboards

- `/dashboard` — dispatcher/admin dispatch board (job queue, live map, driver assignment, AI smart notes).
- `/driver` — driver-only full-screen mobile app, scoped to the driver's own jobs (the old dispatcher-side simulator was removed; don't re-add it).
- `/owner` — towing-company owner/admin dashboard: one company's fleet, jobs, revenue, response times, and team. Never platform-wide.
- `/founder` — Hooked staff only: platform KPIs, account health, revenue placeholders, feature usage, marketing campaigns.
- `/admin` — Hooked staff only: signup/application approvals. Distinct from `/founder`, not redundant with it.

## In-progress work (as of 2026-06-10)

- Working tree has uncommitted edits to: `seed-data.ts` (trim in progress), `ai.functions.ts`, `job-detail-modal.tsx`, `owner.functions.ts`, `applications.functions.ts`, `dashboard.tsx`, `driver.tsx`, `route.tsx`, `settings.tsx`, `admin.tsx`, `apply.tsx`, `index.tsx`, `owner.tsx`, `vite.config.ts`, `package.json`.
- New untracked files: a Twilio voice/SMS webhook integration (`src/lib/twilio.server.ts`, `src/lib/missed-calls.server.ts`, `src/routes/api/public/twilio-*.ts`) plus `onboarding-checklist.tsx` and `support-widget.tsx` components — appears to be in-progress feature work, not yet reviewed/committed.
- Run `bun run lint` and `bun run build` before committing any of the above.

## General rules

- Every Claude/Codex/AI session must read the collaboration docs before coding:
  1. `CLAUDE.md`
  2. `docs/product-brief.md`
  3. `docs/architecture.md`
  4. `docs/roadmap.md`
  5. `docs/ai-handoff.md`
  6. `docs/open-decisions.md`
- Work in the documented phases. Do not mix launch cleanup, auth hardening, migrations, Twilio, payments, demo/video assets, or driver-app strategy in one casual pass.
- Before stopping, update `docs/ai-handoff.md` with current state, changed files, known risks, and the exact next recommended task.
- Avoid auth, migrations, Twilio, demo assets, payments, and nested repo/git structure changes unless the founder explicitly approves that scope for the session.
- Never commit `.env`, `.mcp.json`, `.codex/config.toml`, or anything containing Supabase/Twilio/Resend/OpenAI/VAPID keys — these must stay gitignored.
- Don't delete marketing/demo assets or the Twilio feature files without explicit confirmation from the project owner.
- `.vercel/output` is regenerable build output — safe to delete locally; `.vercel/repo.json` holds the Vercel project link, keep it.
