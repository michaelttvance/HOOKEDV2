# Architecture — Hooked

## Current Tech Stack

- **App framework:** TanStack Start with TanStack Router file-based routes under `src/routes/`.
- **UI:** React 19, Tailwind CSS v4, Radix UI primitives, Lucide icons, Recharts.
- **Server functions:** TanStack Start `createServerFn` in `src/lib/*.functions.ts`.
- **Database/auth:** Supabase Postgres, Supabase Auth, RLS policies, server-side service-role access in `src/integrations/supabase/client.server.ts`.
- **Deployment:** Vercel via Nitro preset in `vite.config.ts`.
- **Package manager:** repo policy says Bun, but `package.json` also has npm-compatible scripts. Prefer `bun run build` when Bun is available; `npm run build` has been used locally when Bun was unavailable.
- **AI:** OpenAI-compatible AI SDK wrapper in `src/lib/ai-gateway.server.ts`, used by dispatch/chat/inbound parsing functions.
- **Email:** Resend direct API calls in `src/lib/emails.server.ts`.
- **Maps:** Google Maps JS API for browser maps and Google Routes API for server-side ETA/routing.
- **Push:** Web Push/VAPID support in `src/lib/push.functions.ts` and driver push subscription UI.
- **Video/demo workflow:** Playwright-based recording script in `scripts/record-product-demo.mjs`; static demo source page in `public/demo-product-video.html`; current video assets in `public/videos/`.

## Route Structure

Routes are file-based. Do not create Next.js/Remix directories such as `src/pages/` or `app/`.

- **Root/layout:** `src/routes/__root.tsx`.
- **Generated tree:** `src/routeTree.gen.ts` is generated. Do not hand-edit it.
- **Public marketing/onboarding:**
  - `/` → `src/routes/index.tsx`
  - `/apply` → `src/routes/apply.tsx`
  - `/auth` → `src/routes/auth.tsx`
  - `/accept-invite` → `src/routes/accept-invite.tsx`
  - `/forgot-password` → `src/routes/forgot-password.tsx`
  - `/reset-password` → `src/routes/reset-password.tsx`
  - `/request/$companyId` → public tow request page
  - `/track/$jobId` → public customer tracking page
  - `/statement/$accountId/$month` → customer account statement
  - `/sitemap.xml` → sitemap route
- **Approval/trial state pages:** `/pending`, `/rejected`, `/trial-expired`.
- **Authenticated app shell:** `src/routes/_authenticated/route.tsx`.
- **Authenticated product routes:**
  - `/dashboard`
  - `/driver`
  - `/owner` company owner/admin dashboard, scoped to the signed-in admin's company
  - `/impound`
  - `/rotations`
  - `/motor-clubs`
  - `/billing`
  - `/settings`
  - `/insights`
  - `/inbound-emails` hidden/no nav entry
- **Hooked staff routes:**
  - `/founder` platform KPIs/marketing/customer health
  - `/admin` signup/application approvals
- **Public API/webhooks:** `src/routes/api/public/*`, including approval action, inbound email, and uncommitted Twilio routes.

## Auth Flow

- Supabase Auth is the identity provider.
- `_authenticated/route.tsx` checks `supabase.auth.getUser()` before allowing authenticated routes.
- Profile approval gate:
  - Missing/unauthenticated user redirects to `/auth`.
  - `profiles.status = pending` redirects to `/pending`.
  - `profiles.status = rejected` redirects to `/rejected`.
- Trial gate:
  - Non-staff users are checked against `companies.trial_ends_at`.
  - Expired trial redirects to `/trial-expired`.
- Role routing:
  - `driver` users are pushed to `/driver`.
  - `dispatcher` users get dispatch/impound/rotations/motor-clubs.
  - `admin` client admins get dispatcher access plus `/owner`, billing/insights/settings/team invites.
  - Hooked staff access is currently hardcoded by email in multiple places.

## Supabase Setup

Important Supabase client files:

- Browser client: `src/integrations/supabase/client.ts`.
- Server/service-role client: `src/integrations/supabase/client.server.ts`.
- Auth middleware: `src/integrations/supabase/auth-middleware.ts`.

Migration files live in `supabase/migrations/`. They define companies, profiles, roles, invites, drivers, jobs, completed jobs, applications, billing, impound, motor clubs, police rotations, inbound email, push subscriptions, client-admin role support, and marketing attribution.

Do not casually edit migrations. Migration changes affect live data and RLS. Use a dedicated phase for any schema/RLS/auth changes.

## Environment Variables

From `.env.example` only:

Public/browser-safe:

- `SUPABASE_PROJECT_ID`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_VAPID_PUBLIC_KEY`

Server-only:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

Important: uncommitted Twilio code references `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`, and DB columns such as `companies.twilio_number`, `companies.forward_phone`, and table `missed_calls`, but those are not listed in `.env.example` yet. This is part of the open Twilio decision.

## Important Components and Modules

- `src/lib/dispatch-store.tsx` — central dispatch state/data orchestration; touches jobs, drivers, realtime-ish behavior, assignments, SMS, AI, billing history.
- `src/routes/_authenticated/dashboard.tsx` — dispatcher/admin dispatch board.
- `src/routes/_authenticated/driver.tsx` — real driver app, driver-role scoped.
- `src/components/job-detail-modal.tsx` — job details, assignment, timeline, customer tracking/actions.
- `src/components/dispatch-map.tsx` and `src/lib/maps.ts` — Google Maps rendering/loading.
- `src/components/driver-mini-map.tsx` — mobile driver map surface.
- `src/components/driver-features.tsx` — checklist/photos/signature/driver utilities.
- `src/routes/_authenticated/route.tsx` — auth/role shell and nav.
- `src/routes/admin.tsx` — Hooked staff approvals.
- `src/routes/founder.tsx` and `src/lib/founder.functions.ts` — Hooked staff platform command center, account health, feature usage, revenue placeholders, and marketing campaign UI.
- `src/routes/owner.tsx` and `src/lib/owner.functions.ts` — towing-company owner dashboard and company-scoped owner metrics. The same server file still contains staff-protected marketing campaign server actions used by `/founder`.
- `src/lib/applications.functions.ts` and `src/routes/apply.tsx` — public application flow.
- `src/lib/approval.functions.ts` — approval status workflows.
- `src/lib/billing.functions.ts`, `src/routes/_authenticated/billing.tsx`, `src/routes/statement.$accountId.$month.tsx` — billing/statements.
- `src/lib/impound.functions.ts`, `src/lib/motorclubs.functions.ts`, `src/lib/rotations.functions.ts` — operational modules.
- `src/components/support-widget.tsx` — in-app support/ticket helper, currently uncommitted.
- `src/components/onboarding-checklist.tsx` — onboarding helper, currently uncommitted.

## Risky Areas

- Auth/role hardening across `_authenticated/route.tsx`, `admin.tsx`, `founder.tsx`, `/owner` role gates, DB functions, and RLS.
- Supabase migrations and any live database schema/RLS changes.
- Service-role server functions; easy to bypass RLS if misused.
- `dispatch-store.tsx`, because small changes affect many screens.
- Google Maps loader/key handling and domain restrictions.
- Push notifications/VAPID because browser security context and service worker behavior can be subtle.
- Twilio/missed-call feature because it is uncommitted and may need DB/env/schema support.
- Demo assets/video generation because files are large and some are untracked.
- Nested repo/workspace structure: work only in `extracted_project` unless explicitly asked.

## Known Issues

- Hooked staff/admin access is hardcoded in multiple app files and may not match the DB `is_super_admin()` function.
- `src/routeTree.gen.ts` is generated and frequently changes during builds.
- TanStack Router auto code splitting was disabled in `vite.config.ts` after dev-overlay/compile issues around generated split references.
- Some server functions still use deprecated `createServerFn().inputValidator()` instead of `.validator()`. This is a warning, not currently blocking.
- Twilio/missed-call integration is not complete/reviewed and may reference missing env vars, DB columns, or migrations.
- `.env.example` does not list Twilio env vars even though Twilio code references them.
- `artifacts/`, `public/demo-product-video.html`, `public/videos/`, and `scripts/record-product-demo.mjs` are large/untracked demo workflow pieces. Do not delete casually.

## Uncommitted Twilio / Missed-Call Integration Context

Uncommitted files:

- `src/lib/twilio.server.ts`
- `src/lib/missed-calls.server.ts`
- `src/routes/api/public/twilio-voice.ts`
- `src/routes/api/public/twilio-voice-status.ts`
- `src/routes/api/public/twilio-sms.ts`

Intended behavior:

- Incoming call to a company Twilio number forwards to `companies.forward_phone`.
- If not answered, a missed-call record is created, an incoming lead job is inserted, and a recovery SMS is sent.
- Inbound SMS replies update the missed-call record and job location/notes.

Risks:

- Env vars and DB schema support need explicit approval and verification.
- Public webhooks need security/signature verification before real production use.
- Do not delete or finish this feature without a founder decision.

## Access Notes

- **Founder/Hooked staff:** hardcoded email allowlists in app code; access to `/founder` and `/admin`.
- **Client admin:** role `admin`; sees `/owner`, billing, insights, settings, team invites, plus dispatcher tools.
- **Dispatcher:** dispatch, impound, rotations, motor clubs. Some admin-only pages are redirected away.
- **Driver:** forced into `/driver`; should only see own assigned jobs.
- **End customer:** no app account; accesses tracking/statement/request links.

## Do Not Touch Casually

- Auth/role checks, approval gates, trial gate, or staff allowlists.
- Supabase migrations, RLS policies, DB functions.
- Twilio/missed-call code and related env/schema decisions.
- Demo assets/video files/scripts.
- Payment/revenue integration decisions.
- Nested repo structure or `.git`/remote settings.
- Generated `src/routeTree.gen.ts` by hand.
- Secrets or `.env` files.
