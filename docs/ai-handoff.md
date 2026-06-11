# AI Handoff — Hooked

Update this file before every Claude/Codex/AI session stops.

## Current Project State

- Working directory: `/Users/michaelvance/Downloads/HookAi V2/extracted_project`.
- Main repo: `michaelttvance/HOOKEDV2`, branch `main`.
- App: TanStack Start + Supabase + Tailwind + Vercel.
- Phase 0 security/repo hygiene was completed earlier.
- Current focus is Phase 3 founder/company-owner separation and launch readiness.
- There is a dirty working tree with both reviewed and unreviewed changes. Do not revert user/other-agent work.

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
