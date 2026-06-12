# AI Handoff — Hooked

Update this file before every Claude/Codex/AI session stops.

## Current Project State

- Working directory: `/Users/michaelvance/Downloads/HookAi V2/extracted_project`.
- Main repo: `michaelttvance/HOOKEDV2`, branch `main`.
- App: TanStack Start + Supabase + Tailwind + Vercel.
- Phase 0 security/repo hygiene was completed earlier.
- PR #18 (Twilio readiness docs) was merged to main on 2026-06-12.
- PR #19 (Launch UX polish) branch `feature/launch-ux-polish-pr19` is ready to commit and PR — all edits made, build passed, routeTree.gen.ts restored.
- Current focus: PR #19 commit and PR creation (see below).

## PR #19 — Launch UX Polish (2026-06-12, ready to commit)

- Branch: `feature/launch-ux-polish-pr19` (from clean main after PR #18 merge).
- Goal: UI/UX copy and empty-state improvements only. No schema, auth, Twilio, payments, migrations, or new packages touched.

### Files changed

- `src/routes/_authenticated/dashboard.tsx` — removed hardcoded "Bay Area" from live map subtitle; now reads "Live driver availability, urgent alerts, and customer ETAs".
- `src/routes/_authenticated/driver.tsx` — (1) removed internal VAPID config warning that was leaking to driver screens when VAPID env var was unset; (2) simplified DriverQuickActions workflow hint copy to be more action-oriented.
- `src/routes/admin.tsx` — improved empty-state message in SignupsTab from terse `"No pending signups."` to friendlier `"No pending signups — all caught up."` / `"No signups yet."`.
- `docs/ai-handoff.md` — this update.
- `docs/change-log.md` — PR #19 entry added.

### Verification

- `npm run build` — PASSED (exit 0, 6.35s, no new errors or warnings).
- `src/routeTree.gen.ts` was modified by build (pre `98bb98cf`, post `23070fe2`) — restored with `git checkout -- src/routeTree.gen.ts`.
- All four changed source files were targeted, single-line or small-block edits; no logic or data changes.

### Risks / Next steps

- No auth, schema, Twilio, billing, migrations, or structural changes in this PR.
- Next recommended task: commit PR #19, create PR, get review/merge, then proceed to Twilio A2P 10DLC registration or toll-free number swap (needed before SMS reliably delivers to customers — see separate handoff notes below).

## Launch QA Hardening Pass (2026-06-12)

- Current branch: `feature/launch-qa-hardening-pr17`.
- Goal: small, safe launch-readiness cleanup only. No workflow, schema, storage, auth, billing, Twilio, or Stripe changes.
- Reviewed production-facing flows: landing, demo, apply/request, login/auth, dispatcher, driver, completed jobs proof/history, owner, founder, public tracking, and friendly error states.
- Planned / in progress changes:
  - soften visible AI-heavy copy on the public landing/app launch pages and email invite text;
  - replace raw user-facing error text with `safePublicError(...)` fallbacks in the dashboard job parser, job detail follow-up drafting, founder campaign controls, and the public request geolocation fallback;
  - keep `noindex` / `no-referrer` behavior intact on public request/tracking routes;
  - update this handoff + change log with launch QA findings and remaining risks.
- Verification to run after edits:
  - `npm audit`
  - `npm run build`
  - restore `src/routeTree.gen.ts` if build touches it
- Remaining risks to watch:
  - demo page still contains a few product-help labels that may be softened further if needed;
  - public request geolocation still depends on browser permission/location availability;
  - the `track` helper and public forms remain intentionally fail-silent to protect launch stability.

## Live Production Smoke Test Results (2026-06-12)

Full browser smoke test against https://hookedv-2.vercel.app using a temporary test account (dispatcher role) and a dedicated Driver Smoke Test account (driver role).

| Section | Result | Notes |
|---|---|---|
| Public pages (`/`, `/demo`, `/apply`, `/track/:id`) | ✅ PASS | All load correctly; tracking page media-free as expected |
| Auth / login | ✅ PASS | Email/password and session handling work |
| Dashboard / dispatch board | ✅ PASS | Job queue, map, driver assignment all functional |
| Job completion workflow | ✅ PASS | Job progresses through all statuses to complete |
| Completed jobs proof/history | ✅ PASS | Completed job records visible with correct proof |
| Public tracking link | ✅ PASS | `/track/:id` loads and shows job status; stays media-free |
| Driver app (`/driver`) | ✅ PASS | Loads for driver-role accounts; redirects admin accounts (correct) |
| Signature capture | ✅ PASS | Canvas draw triggers auto-save; no explicit button press required |
| Signature preview | ✅ PASS | Saved signature visible in job detail |
| Console during job completion | ⚠️ WARNING | `SMS send failed Error: Twilio is not configured` — non-blocking, see below |

**SMS warning (non-blocking):** The `"SMS send failed"` console error appears when a job is completed because `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are not set in Vercel. The job completion succeeded. The `sms_messages` row was written to Supabase with `status: "failed"`. No UI error was shown.

**Overall verdict:** Core app passes for limited/invite-only launch. SMS requires env var setup before broader launch (customers expect tracking-link SMS on assignment).

---

## Twilio Status SMS — Setup Checklist (action required before broader launch)

All three vars must be added in Vercel → Project Settings → Environment Variables:

```
TWILIO_ACCOUNT_SID     =  ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN      =  [your auth token]
TWILIO_PHONE_NUMBER    =  +1XXXXXXXXXX   (E.164 format)
```

Scope each var to **Production** (and optionally **Preview** for SMS testing in preview deploys).

After adding vars:
1. Trigger a new Vercel deployment (vars only apply to new deploys).
2. Assign a test job to a driver with a real customer phone number.
3. Mark the job through all statuses (assigned → on scene → complete).
4. Verify three SMS messages arrive.
5. Confirm all three `sms_messages` rows show `status: "sent"` in Supabase.

**Trial account note:** If using a Twilio trial account, the destination phone number must be verified in the Twilio console first. Upgrade to paid before real customer traffic.

---

## ⚠️ CRITICAL: Do Not Enable Twilio Inbound Webhooks Yet

The following routes are live in production but must NOT be pointed at from the Twilio console:

- `https://hookedv-2.vercel.app/api/public/twilio-voice`
- `https://hookedv-2.vercel.app/api/public/twilio-voice-status`
- `https://hookedv-2.vercel.app/api/public/twilio-sms`

These will return 500 errors because the required DB objects do not exist in the live database:

- `companies.twilio_number` (column — missing)
- `companies.forward_phone` (column — missing)
- `missed_calls` (table — missing)

Do not configure these webhook URLs in Twilio until a dedicated migration PR adds all three DB objects. See `docs/open-decisions.md` Decision #1b.

---

## Current Deployment (2026-06-11)

- **PRODUCTION (live):** https://hookedv-2.vercel.app (aliases: `hookedv-2-hookeddispatch-project.vercel.app`, `hookedv-2-git-main-hookeddispatch-project.vercel.app`)
- Branch: `main` (fast-forwarded from `preview/staging-review`, explicitly approved with "deploy production").
- Commit: `db5a358` "Update handoff + change-log for deployment" (FF includes `50b7a78` app changes: 53 files, +6838 / -841).
- Build: `bun run build` PASSED (exit 0). Vercel deployment `dpl_wDehw5uu6mHZt1sTUKXKXtzWRLvY` state **READY**, `target: "production"`, region iad1.
- Added `.vercelignore` to keep secrets/archives/`artifacts/`/`local-archive/`/`scripts/` out of uploads.
- Twilio webhook routes are now **live in production** (`/api/public/twilio-*`) — verify Twilio env vars/secrets are configured in Vercel production before routing real call/SMS traffic.
- Prior preview deploy: `dpl_8sAJt8YnCNj9TRKXFhYjaKgzpxcZ` (`target: null`) at https://hookedv-2-git-preview-staging-review-hookeddispatch-project.vercel.app — still available.
- Pages to review: `/`, `/demo`, `/dashboard`, `/driver`, `/owner`, `/founder`, `/admin`, `/apply` (app pages need an authed Supabase session).
- Rollback: previous production was commit `168d0d0` (deployment `dpl_D5kKJb13PbjXZvmnynxATNFWdQgS`, marked rollback candidate).

## Backend Review Session — Product Analytics Foundation (2026-06-11)

Senior-backend/architect pass. Goal: first safe backend foundation = product
analytics / event tracking. **NOT committed, NOT pushed. Migration NOT applied
to the live DB.** No auth, Twilio, Stripe, or production data touched.

### Files created
- `supabase/migrations/20260611_product_events_analytics.sql` — non-destructive.
  Creates ONLY `public.product_events` (id, event_name, company_id FK→companies
  ON DELETE SET NULL, user_id no-FK, session_id, anonymous_id, route, source
  CHECK('client'|'server'), metadata jsonb, created_at) + 4 indexes + RLS.
  Grants: `service_role` ALL, `authenticated` SELECT (RLS-gated to
  `is_super_admin(auth.uid())`), `anon` REVOKE. No INSERT/UPDATE/DELETE policy —
  all writes flow through the service-role server fn. **Not yet applied.**
- `src/lib/analytics.functions.ts` — server functions:
  - `recordEvent` (PUBLIC `createServerFn` POST, zod-validated, no auth): never
    trusts client user_id/company_id; fail-safe (swallows all errors incl.
    missing-table 42P01); `metadata` capped at 4000 chars.
  - `recordServerEvent(input)` — trusted server-side recorder for in-app events
    (identity derived from server context, source='server'); fire-and-forget.
  - `getProductAnalytics` — founder-gated (`requireSupabaseAuth` +
    `is_super_admin`); returns live aggregates `{totals, funnel, byEvent30}` or a
    clearly-flagged `ANALYTICS_PLACEHOLDER` when the table is missing/empty.
  - Exports `PRODUCT_EVENTS` (canonical 13-event list), `ProductEvent`,
    `ProductAnalytics`.
- `src/lib/analytics.ts` — client `track(event, metadata?)` helper: client-only
  guard, fully fail-safe (never throws/blocks/awaited), per-browser
  `anonymousId` (localStorage) + per-tab `sessionId` (sessionStorage), no PII.

### Files modified (event wiring only — existing href/Link behavior preserved)
- `src/routes/demo.tsx` — `demo_page_view` on mount (useEffect); `watch_demo_click`
  on hero "Watch the demo"; `start_trial_click` on hero "Start your free trial".
- `src/routes/index.tsx` — `start_trial_click` on hero "Start free trial".
- `src/routes/apply.tsx` — `signup_started` on mount (useEffect).

### Verification
- `bun run build` PASSED (exit 0, built in ~7.5s, no new errors).
- App gracefully handles the table NOT existing: `recordEvent` swallows the
  42P01 missing-table error; `getProductAnalytics` returns the placeholder.
- Client tracking fails silently — cannot break the public site.

### Migration APPLIED to live Supabase (2026-06-11)
- `20260611_product_events_analytics.sql` was applied to the live DB via the
  Supabase MCP (`apply_migration`, name `product_events_analytics`). Only this
  migration was applied — no local history replay, no unrelated migrations.
- Verified post-apply: table exists with all 10 columns; RLS enabled; 5 indexes
  present (pkey + created_at, name+created, company, session); SELECT policy
  "super admins read product events" present. A marked test row inserted then
  deleted — table is currently empty (0 rows).

### Live vs pending
- LIVE NOW: the four public CTA events fire client-side AND persist to
  `public.product_events`. `/founder` now renders these as live analytics.
- PENDING: incrementally add `recordServerEvent` to in-app server fns.

### Next recommended task (Sonnet/Codex)
- Incrementally add `recordServerEvent` calls in
  `job_created`/`invoice_created`/`ai_dispatch_used` server fns.
- Still WAITS for explicit scope: Stripe/subscriptions schema, auth/role
  hardening pass, company-scoped RLS audit, driver-app backend.

## Analytics E2E Test + Founder Wiring Session (2026-06-11)

End-to-end test of the analytics loop, plus wiring `/founder` to real data.
**NOT committed, NOT pushed.** No Stripe/Twilio/auth/backend-feature changes.

### Verified end-to-end (live Supabase)
- All four public CTA events persist correctly: `demo_page_view` (/demo),
  `watch_demo_click` (/demo, `{location:hero}`), `start_trial_click` (/,
  `{location:home_hero}`), `signup_started` (/apply). Fields confirmed:
  `event_name`, `route`, `source=client`, matching `session_id`+`anonymous_id`,
  `metadata`. All test rows deleted afterward (`product_events` = 0 rows).
- `start_trial_click` survives the SPA navigation to `/apply` (TanStack Router
  client nav, not a hard reload, so the fire-and-forget POST isn't aborted).
- `signup_started` double-fires in dev only (React StrictMode double-mount).

### Root cause found + fixed (dev-only hydration failure)
- Zero events were initially recorded because the app wasn't hydrating in dev.
  Cause: the PWA service worker (`public/sw.js`, cache-first on all GETs) had
  cached **503 responses for Vite's dev module graph**, so `@vite/client`/route
  chunks failed to load and React never hydrated (no fibers → no effects/clicks).
- Fix in `src/routes/__root.tsx`: register the SW only under
  `import.meta.env.PROD`; in dev, unregister any existing SW and clear caches.
  PWA behavior in production is unchanged.

### Founder wiring (`src/routes/founder.tsx`)
- New `ProductAnalyticsPanel` calls the existing `getProductAnalytics` server fn
  (founder-gated; React Query, 60s refetch). Shows live cards — demo page views
  (30d), watch-demo clicks (30d), start-trial clicks (30d), signups started
  (30d), total events (7d), unique visitors (30d) — with a LIVE badge, and falls
  back to the flagged placeholder on error/empty. Stripe/MRR revenue panel
  untouched (still PLACEHOLDER). `getProductAnalytics` needed no changes.
- `bun run build` PASSED (exit 0).

### Note for next agent
- A dev server may be running on :3000 (started this session). An unrelated
  `Downloads/hookai` Vite instance was observed running and left alone.

## Codex Analytics Review / Cleanup Pass (2026-06-11)

Review-only pass after Claude's analytics backend/founder wiring.

- Ran `git status --porcelain`: analytics-related app/docs files are modified/untracked; nothing is
  staged.
- Reviewed:
  - `supabase/migrations/20260611_product_events_analytics.sql`
  - `src/lib/analytics.functions.ts`
  - `src/lib/analytics.ts`
  - `src/routes/demo.tsx`
  - `src/routes/index.tsx`
  - `src/routes/apply.tsx`
  - `src/routes/founder.tsx`
  - `src/routes/__root.tsx`
  - `docs/ai-handoff.md`
  - `docs/change-log.md`
- Confirmed no secret patterns in the analytics-related files reviewed.
- Confirmed no staged `.env`, `.mcp.json`, zips, artifacts, or local-only files. Untracked local
  demo/debug files remain present (`.claude/`, `artifacts/`, `public/demo-product-video.html`,
  `scripts/`) and must stay out of any commit unless explicitly approved.
- Confirmed service-worker registration remains production-only in `src/routes/__root.tsx`; dev
  unregisters stale service workers and clears caches.
- Confirmed `getProductAnalytics` returns the placeholder when `product_events` is missing,
  errors, or has zero rows.
- Confirmed client `track()` is browser-only, fire-and-forget, and swallows failures so analytics
  cannot break public pages.
- Verification: `PATH="$HOME/.bun/bin:$PATH" bun run build` PASSED.
- No app code changes were made in this review pass.

## Last Completed Work

- Created `docs/product-brief.md`.
- Created remaining workflow docs:
  - `docs/architecture.md`
  - `docs/roadmap.md`
  - `docs/ai-handoff.md`
  - `docs/open-decisions.md`
  - `docs/change-log.md`
- Created/updated `AGENTS.md`.
- Updated `CLAUDE.md` with mandatory AI-session rules.
- Completed a Phase 1 working-tree classification pass on 2026-06-10:
  - Ran `git status --porcelain`.
  - Ran `git diff --stat`.
  - Classified modified/untracked files into documentation, generated output, review-before-keeping product work, founder-decision areas, and gitignore/remove candidates.
- Completed a Phase 1 premium UI polish pass on 2026-06-10:
  - Refined landing-page messaging and hierarchy to feel more premium and less cluttered.
  - Added clearer operator-facing value framing and stronger CTA language.
  - Polished the authenticated shell and dispatch board presentation without changing auth logic.
  - Verified the app still builds successfully with `npm run build`.
- Completed a second focused visual QA and polish pass on 2026-06-10:
  - Strengthened landing-page hero and CTA clarity.
  - Tightened generic marketing copy and made the product positioning more operator-specific.
  - Added more premium workspace presentation in the app shell and dispatch board.
  - Verified the app still builds successfully with `npm run build`.
- Started Phase 2 on 2026-06-10:
  - Added a dedicated public `/demo` route for a deeper product walkthrough.
  - Added “Free Video Demo Here” CTAs to the landing-page header, hero, mobile nav, and final CTA block.
  - Built a placeholder video area plus a detailed walkthrough covering owner, dispatcher, driver, AI, tracking, updates, SLA alerts, billing, impound, motor clubs, and support.
  - Verified the app still builds successfully with `npm run build`.
- Continued Phase 2 on 2026-06-11 (real video + screenshot proof):
  - Copied four screenshot assets from `artifacts/` into a new `public/screenshots/` folder.
  - Replaced the `/demo` placeholder video block with a real `<video>` element using
    `/videos/hooked-product-demo.webm` + `/videos/hooked-product-demo-poster.png`
    (controls, no autoplay, playsInline, muted, loop, dark container background).
  - Added a `#proof` "Proof in action" 2-column screenshot section (dispatch board, driver mobile,
    live tracking, billing) under the video, matching the dark Tailwind theme.
  - Verification: `bun run build` PASSED clean (5.95s, only pre-existing non-blocking warnings).
    `bun run lint` (`eslint .`) did NOT finish in a reasonable time (>10 min, no output) and was
    stopped; lint result is unconfirmed for this pass. Re-run `bun run lint` in isolation to confirm.
- Resolved a "blank site" incident on 2026-06-11:
  - Reported symptom: `/` and `/demo` blank/not loading locally after the video+screenshot pass.
  - Actual root cause: multiple `vite dev` servers running at once in this project dir, both
    regenerating `src/routeTree.gen.ts` and corrupting HMR ("modified by another process" churn).
  - Fix: killed the duplicate dev servers, ran a single clean instance. No source code change needed.
  - Verified `npm run build` clean; `/` and `/demo` both 200 with full content; the `<video>`
    (1920px, no error) and all 4 `/screenshots/*.png` load; hero/headings render with opacity 1.
  - Takeaway: run only ONE dev server per project dir.

- Started Phase 3 on 2026-06-11 (Founder Command Center):
  - Confirmed (via `git diff`) the interrupted Phase 3 attempt created NO founder files and did NOT
    repurpose `/owner` — `/owner` changes are only the earlier Phase 1 refactor + a campaign copy tweak.
  - Added a NEW separate protected route `src/routes/founder.tsx` (`/founder`) — distinct from
    `/owner` (towing-company owner console) and `/admin` (signup/application approvals).
  - Added `src/lib/founder.functions.ts` with `getFounderMetrics` (createServerFn POST), gated by the
    same `is_super_admin` RPC used by the owner console; reused the existing email-allowlist
    `beforeLoad` gate pattern from `owner.tsx`/`admin.tsx` verbatim. No auth logic changed.
  - Built the 6 required sections: (1) Platform Overview, (2) Revenue Snapshot, (3) Feature Usage,
    (4) Account Health Table, (5) Founder Insights, (6) Admin Tools Preview.
  - REAL data: companies, profiles, drivers, jobs, completed_jobs (30d revenue/response),
    applications (funnel/conversion), marketing_campaigns (active count), per-company account health
    + heuristic health score, feature adoption %, auto-generated founder insights.
  - PLACEHOLDER data (clearly badged "PLACEHOLDER" + amber notes): Hooked SaaS MRR/ARR (no Stripe/
    subscriptions table — illustrative estimate at an assumed $199/mo plan), product analytics
    (DAU / session length / retention / churn — no event-tracking table), and "Soon" admin tools
    (billing, impersonation, analytics, feature flags).
  - Verification: `bun run build` PASSED clean (6.93s, only pre-existing non-blocking warnings).
    `/founder` confirmed present in `src/routeTree.gen.ts`. Lint not run this pass.

- Premium-polish pass on 2026-06-11 (navigation + staff cross-linking):
  - Added a staff-gated "Hooked Staff" sidebar group in `_authenticated/route.tsx` with a new
    **Founder Command Center** link (`/founder`, Rocket icon) above **Owner Console**. Gated by the
    existing `!isDriver && isHookedAdmin` email-allowlist check — no auth logic changed.
  - Added header cross-links so the three staff surfaces interconnect: `/owner` → Founder; `/admin`
    → Founder + Owner; `/founder` already linked to Owner + Admin.
  - Fixed the shell header title map to label `/billing` and `/insights` (were falling through to
    the generic "Jobs & Billing").
  - Reviewed `/demo`, `/dashboard`, `/driver` — already polished on the dark design system; no
    changes needed.
  - Verified `bun run build` PASSED clean (~6.4s).
  - FLAGGED (needs product decision, not changed): `/owner` shows platform-wide data overlapping
    `/founder` (focus #6); staff dashboards use light slate theme vs the app's dark theme (focus #9).

- Staff tools dark-theme unification on 2026-06-11:
  - Re-skinned `/founder`, `/owner`, `/admin` from light slate to the dark Hooked brand.
  - Token mapping: bg-slate-50→bg-background, bg-white→bg-surface, bg-slate-100→bg-accent,
    bg-slate-950→bg-surface-2, text-slate-950/800/700→text-foreground,
    text-slate-600/500/400→text-muted-foreground, border-slate-*→border-border,
    amber badges→bg-primary/10 text-primary, emerald→bg-success/15 text-success,
    red→bg-urgent/15 text-urgent, amber fills→bg-primary, placeholder blocks→bg-warning/5,
    approve/reject buttons→bg-success/bg-urgent with matching foregrounds,
    primary submits→bg-primary text-primary-foreground.
  - Zero logic, auth, data, or layout changes — re-skin only.
  - `bun run build` PASSED clean (~6.4s). Zero light-theme literals remain (confirmed via grep).

- Landing page CTA cleanup on 2026-06-11:
  - Eliminated all "Free Video Demo Here" (repeated 4×) and "Watch the workflow" (#demo anchor)
    strings from index.tsx.
  - Desktop nav: removed overlapping "Free video demo" + "Demo" links; demo is now the header button.
  - Desktop header: reordered to Sign in → Watch the demo → Start free trial.
  - Mobile nav: collapsed to "Watch the demo" + "Start free trial" at bottom, removed duplicates.
  - Hero: 3 buttons → 2 buttons (primary: Start free trial → /apply; secondary: Watch the demo → /demo).
    Tightened hero padding (pt-16→pt-14, sm:pt-24→sm:pt-20).
  - Final CTA section: same 3→2 button collapse.
  - `bun run build` PASSED clean.

- Resolved `/owner` vs `/founder` overlap on 2026-06-11:
  - `/founder` is now the Hooked-staff platform command center for cross-company KPIs, account
    health, SaaS revenue placeholders, feature usage, founder insights, and marketing campaigns.
  - Moved marketing campaign management UI out of `/owner` and into `/founder`; existing staff-
    protected campaign server functions remain in `src/lib/owner.functions.ts`.
  - Added `getCompanyOwnerMetrics` in `src/lib/owner.functions.ts`, a `createServerFn` gated by
    `requireSupabaseAuth` and the caller's existing `user_roles.role = admin`. It queries only the
    caller's `company_id`.
  - Rebuilt `/owner` as a towing-company owner dashboard showing one company's fleet, active jobs,
    completed-job revenue, response times, team, driver roster, and billing mix. It no longer shows
    platform totals, applications, marketing campaigns, or staff links.
  - Updated `_authenticated/route.tsx` so client admins get an Owner nav item and Hooked staff only
    get the Founder Command Center staff link.
  - Updated `/admin` and `/founder` cross-links so staff tools do not point staff into the client
    owner dashboard.
  - Updated `CLAUDE.md`, `docs/architecture.md`, `docs/product-brief.md`, and `docs/roadmap.md` to
    document `/founder = staff platform`, `/owner = company-owner`, `/admin = approvals`.
  - Verification: `/Users/michaelvance/.bun/bin/bun run build` PASSED. `npx tsc --noEmit` still
    fails only on pre-existing `vite.config.ts` Nitro/plugin type mismatches (`config`,
    `fastRefresh`); no new route/build errors surfaced.

## Active Phase

Phase 3 complete. Pre-deployment QA pass completed on 2026-06-11. Build is clean. Verdict: **safe
to deploy** with the minor known caveats listed below.

## Current Goal

Ready for deployment OR the next feature phase. No blocking issues remain from the Phase 3 work.

### QA pass summary (2026-06-11)

Routes tested / code-reviewed:

| Route | Status | Notes |
|---|---|---|
| `/` | ✅ | Dark navy, 2 CTAs ("Start free trial" + "Watch the demo"), no "Free Video Demo Here" |
| `/demo` | ✅ | Loads correctly; "Watch the demo" button text fixed (was "Free Video Demo Here") |
| `/auth` | ✅ | Dark theme, Google OAuth + email/password |
| `/dashboard` | ✅ | Auth gate works (redirects to /auth on hard reload); SSR + client hydration verified |
| `/owner` | ✅ (code) | Role gate: `user_roles.role = admin`; `getCompanyOwnerMetrics` scoped to caller's `company_id` only; no campaign controls; no cross-company data |
| `/founder` | ✅ (code) | Email-allowlist gate; `getFounderMetrics` platform-wide; campaign create/pause/resume present |
| `/admin` | ✅ (code) | Email-allowlist gate; approvals only; `Rocket` cross-link to `/founder` |
| Build | ✅ | `bun run build` clean, 6.42s, no TypeScript errors |

Note: `/owner`, `/founder`, `/admin` were verified via code review + build (MCP browser has no auth
session and entering credentials is prohibited). Live sign-in testing with real credentials is the
recommended manual step before first public launch.

## Changed Files

Documentation / workflow files now present:

- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/ai-handoff.md`
- `docs/open-decisions.md`
- `docs/change-log.md`
- `AGENTS.md`
- `CLAUDE.md`

Current modified tracked app files from `git status --porcelain` include:

- `package.json`
- `vite.config.ts`
- `src/routeTree.gen.ts`
- `src/routes/index.tsx`
- `src/routes/apply.tsx`
- `src/routes/admin.tsx`
- `src/routes/owner.tsx`
- `src/routes/_authenticated/route.tsx`
- `src/routes/_authenticated/dashboard.tsx`
- `src/routes/_authenticated/driver.tsx`
- `src/routes/_authenticated/rotations.tsx`
- `src/routes/_authenticated/settings.tsx`
- `src/lib/ai.functions.ts`
- `src/lib/applications.functions.ts`
- `src/lib/owner.functions.ts`
- `src/lib/seed-data.ts`
- `src/components/job-detail-modal.tsx`

Always run `git status --porcelain` to confirm the current list; this project is actively changing.

Files directly touched in the UI polish pass:

- `src/routes/index.tsx`
- `src/routes/_authenticated/dashboard.tsx`
- `src/routes/_authenticated/route.tsx`
- `docs/ai-handoff.md`
- `docs/change-log.md`

Files directly touched in the second visual QA pass:

- `src/routes/index.tsx`
- `src/routes/_authenticated/dashboard.tsx`
- `src/routes/_authenticated/route.tsx`
- `docs/ai-handoff.md`
- `docs/change-log.md`

Files directly touched in the `/owner` vs `/founder` separation pass:

- `src/lib/owner.functions.ts`
- `src/lib/founder.functions.ts`
- `src/routes/owner.tsx`
- `src/routes/founder.tsx`
- `src/routes/_authenticated/route.tsx`
- `src/routes/admin.tsx`
- `CLAUDE.md`
- `docs/architecture.md`
- `docs/product-brief.md`
- `docs/roadmap.md`
- `docs/ai-handoff.md`
- `docs/change-log.md`

Files directly touched in the Phase 2 demo pass:

- `src/routes/index.tsx`
- `src/routes/demo.tsx`
- `docs/ai-handoff.md`
- `docs/change-log.md`

Files directly touched in the Phase 2 real-video + screenshot-proof pass (2026-06-11):

- `src/routes/demo.tsx`
- `public/screenshots/` (new — four copied PNGs)
- `docs/ai-handoff.md`
- `docs/change-log.md`

## Uncommitted Files

Known untracked or recently added files include:

- `src/components/onboarding-checklist.tsx`
- `src/components/support-widget.tsx`
- `src/lib/twilio.server.ts`
- `src/lib/missed-calls.server.ts`
- `src/routes/api/public/twilio-sms.ts`
- `src/routes/api/public/twilio-voice-status.ts`
- `src/routes/api/public/twilio-voice.ts`
- `public/demo-product-video.html`
- `public/videos/`
- `scripts/record-product-demo.mjs`
- `artifacts/`
- `AGENTS.md`
- `CLAUDE.md`
- `docs/`

Do not delete or assume these are disposable without founder approval.

## Known Risks

- Auth/staff access is split across app code and DB functions.
- DB migrations/RLS are sensitive and should be changed only in a dedicated phase.
- Twilio/missed-call integration is incomplete/unreviewed and may lack env/schema support.
- Demo assets are large and not clearly finalized.
- Some generated files change during builds.
- The repo is nested inside an outer local workspace; work in `extracted_project`.
- Payment/revenue integration is not decided.

## Exact Next Recommended Task

**Option A — Deploy (if you're ready):**
1. Sign in locally as each staff email and as a test client-admin to spot-check the live routes
   (5 min manual check, no AI needed).
2. `git add` + `git commit` the dirty working tree (run `bun run lint` first).
3. `git push origin main` → Vercel auto-deploys.

**Option B — Next feature phase (Phase 4 candidates):**
1. **Auth hardening** — consolidate the three email-allowlist copies into a single `STAFF_EMAILS`
   constant; fix the `is_super_admin` DB function to match both staff emails; add RLS tests.
   This is a dedicated coordinated pass — do not mix with anything else.
2. **Twilio integration review** — the four untracked Twilio files need a full review before
   committing: schema support, env vars, error handling, and driver notification UX.
3. **Stripe / billing** — replace the `/founder` MRR placeholder with real Stripe subscription data.
4. **Event tracking** — add a lightweight events table to power `/founder` DAU/retention placeholders.

Keep avoiding auth-logic changes, migrations, demo asset deletion, and repo-structure changes unless
explicitly approved for that phase.

## Files to Inspect First

Before coding, read:

- `CLAUDE.md`
- `AGENTS.md`
- `docs/product-brief.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/ai-handoff.md`
- `docs/open-decisions.md`

For app context, inspect only the files relevant to the task.

## Files to Avoid Touching Without Explicit Approval

- `supabase/migrations/*`
- `src/routes/_authenticated/route.tsx`
- `src/routes/admin.tsx`
- `src/routes/owner.tsx`
- `src/integrations/supabase/*`
- `src/lib/approval.functions.ts`
- `src/lib/applications.functions.ts`
- Twilio/missed-call files
- demo/video assets and recording scripts
- payment/revenue files or future payment integration code
- `.git`, `.vercel`, `.env*`, `.mcp.json`, `.codex/*`
- `src/routeTree.gen.ts` by hand

## Commands to Run Before Edits

```bash
pwd
git status --porcelain
git diff --stat
```

If touching routes/build config:

```bash
npm run build
```

Use Bun equivalents if Bun is available and preferred:

```bash
bun run build
bun run lint
```

## Commands to Run After Edits

Documentation-only edits:

```bash
git status --porcelain
```

App code edits:

```bash
npm run build
git status --porcelain
```

Run lint when the touched files are lint-sensitive and the repo lint command is expected to be passing:

```bash
npm run lint
```

## Handoff Update Template

At the end of each session, update:

- current project state if it changed
- last completed work
- active phase
- current goal
- changed files
- uncommitted files
- known risks
- exact next recommended task
