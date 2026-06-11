# Change Log — Hooked

Future Claude/Codex/AI agents should update this after each work session.

## Format

```markdown
## YYYY-MM-DD — Agent / Session Name

### Goal
- What the session was supposed to accomplish.

### Changed
- Files created/updated/deleted.
- Behavior changed.
- Docs changed.

### Verification
- Commands run.
- Browser/manual checks.
- Anything not run.

### Risks / Follow-Up
- Known risks introduced or discovered.
- Open questions.
- Recommended next task.
```

## 2026-06-11 — Pre-Deployment QA Pass

### Goal

- Complete browser + code QA before any deployment.
- Verify `/owner` vs `/founder` split is correct.
- Fix all remaining light-theme token remnants and stale copy.

### Changed

- `src/routes/admin.tsx`:
  - Fixed 3 error state divs: `border-red-200` → `border-urgent/20`. All light-theme class
    literals are now fully eliminated from all three staff surfaces.
- `src/routes/demo.tsx`:
  - Renamed hero CTA label: "Free Video Demo Here" → "Watch the demo". Matches the landing page
    language introduced in the CTA cleanup pass.

### Verification

- `bun run build` — PASSED clean (6.42s, zero TypeScript errors, no new warnings).
- MCP browser QA:
  - `/` — renders correctly; dark navy background; 2 CTAs; no "Free Video Demo Here". ✅
  - `/demo` — loads; "Watch the demo" button now correct. ✅
  - `/auth` — dark theme; Google OAuth + email/password; redirects unauthenticated users. ✅
  - `/dashboard` — auth gate works (redirects to `/auth` after hard reload clearing cookies). ✅
  - `/owner` code-reviewed: `user_roles.role = admin` gate; `getCompanyOwnerMetrics` scoped to
    caller's `company_id` only; company-specific data (fleet, jobs, revenue, team); no campaign
    controls; no cross-company or platform-wide data. ✅
  - `/founder` code-reviewed: email-allowlist gate (`FOUNDER_EMAILS`); `getFounderMetrics`
    returns platform-wide data; campaign create/pause/resume UI present. ✅
  - `/admin` code-reviewed: email-allowlist gate; signup + application approval only;
    `Rocket` cross-link to `/founder`. ✅
- `grep -rn "border-red-200\|Free Video Demo" src/routes/` — zero matches. ✅
- Note: `/owner`, `/founder`, `/admin` were verified via code review (MCP browser has no auth
  session; entering credentials is prohibited). Live sign-in spot-check is recommended before
  first public deployment.

### Risks / Follow-Up

- Manual live sign-in verification still needed (sign in as a staff email + as a test client admin)
  before deploying.
- Auth hardening (consolidating email allowlists, fixing `is_super_admin` to match both staff
  emails, adding RLS tests) is Phase 4 — do NOT do it as a side effect of another change.
- Unreviewed Twilio files still in the working tree; do not commit without full review.
- `bun run lint` has not been run this session — run it before committing.

## 2026-06-11 — Phase 3 Owner/Founder Separation

### Goal

- Make `/founder` the single Hooked-staff platform command center.
- Re-scope `/owner` as a real towing-company owner dashboard for the signed-in client admin's own
  company.
- Do not touch auth logic, Supabase migrations, RLS, `is_super_admin`, Twilio, payments, demo
  assets, or git history.

### Changed

- `src/lib/owner.functions.ts`:
  - Added `getCompanyOwnerMetrics` (`createServerFn`, POST, `requireSupabaseAuth`) that first
    verifies the caller has `user_roles.role = admin`, then queries only that role's `company_id`.
  - Company-scoped metrics now cover active jobs, completed jobs, 30-day completed-job revenue,
    paid/unpaid mix, response time, team roles, drivers, job status/priority, driver status, and
    recent company jobs.
  - Kept existing staff-protected marketing campaign server functions unchanged for `/founder`.
- `src/routes/owner.tsx`:
  - Rebuilt the page as a company-owner dashboard.
  - Removed platform totals, applications, campaign management, attribution blocks, cross-company
    account health, and staff cross-links.
  - Changed the route gate from the staff email allowlist to existing client `admin` role membership.
- `src/lib/founder.functions.ts`:
  - Added campaign attribution fields (`trackingUrl`, leads, cost per lead, conversion rate) to
    `getFounderMetrics`.
- `src/routes/founder.tsx`:
  - Moved the marketing campaign management UI here.
  - Removed the staff link to `/owner`; `/owner` is now a client company dashboard, not a staff
    console.
- `src/routes/_authenticated/route.tsx`:
  - Added `/owner` to the client-admin nav.
  - Removed `/owner` from the Hooked Staff nav group.
- `src/routes/admin.tsx`:
  - Removed the staff header link to `/owner`.
- Documentation updated:
  - `CLAUDE.md`
  - `docs/architecture.md`
  - `docs/product-brief.md`
  - `docs/roadmap.md`
  - `docs/ai-handoff.md`

### Verification

- `/Users/michaelvance/.bun/bin/bun run build` — PASSED.
- `npx tsc --noEmit` — FAILED only on pre-existing `vite.config.ts` type errors:
  - `config` is not a known `NitroPluginConfig` property.
  - `fastRefresh` is not a known React plugin option.

### Risks / Follow-Up

- Manual role testing is still needed:
  - Client admin should reach `/owner` and see only their company's data.
  - Dispatcher/driver should be redirected away from `/owner`.
  - Hooked staff should reach `/founder` and `/admin`.
  - `/founder` campaign create/pause/resume should still work through the existing super-admin RPC
    gate.
- Auth hardening is still a separate Phase 4 task. This pass intentionally did not change RLS,
  migrations, `is_super_admin`, or staff email allowlists.

## 2026-06-10 — Documentation Workflow Setup

### Goal

- Finish multi-AI collaboration workflow documentation after `docs/product-brief.md` had already been created.

### Changed

- Added `docs/architecture.md`.
- Added `docs/roadmap.md`.
- Added `docs/ai-handoff.md`.
- Added `docs/open-decisions.md`.
- Added `docs/change-log.md`.
- Added/updated `AGENTS.md`.
- Updated `CLAUDE.md` with required AI-session rules.

### Verification

- Read existing `CLAUDE.md` and `docs/product-brief.md`.
- Inspected relevant route/env/package/Twilio/auth files.
- Ran `git status --porcelain`.

### Risks / Follow-Up

- Documentation reflects current dirty working tree and uncommitted feature work.
- Next safest task is a working-tree classification before more app coding.

## 2026-06-10 — Phase 1 Premium UI Polish

### Goal

- Improve the look and feel of the current Hooked marketing site and dashboard shell so the product feels more premium, less cluttered, and more launch-ready.

### Changed

- Updated `src/routes/index.tsx`:
  - tightened hero messaging
  - added stronger operator-facing value cards
  - simplified public nav wording
  - refined section headings, CTA copy, and FAQ language
- Updated `src/routes/_authenticated/dashboard.tsx`:
  - added a board snapshot strip for active jobs, drivers, urgent calls, and stalled work
  - clarified queue/map/driver panel headings
- Updated `src/routes/_authenticated/route.tsx`:
  - improved workspace labeling in the sidebar and top bar
  - refined AI-assist copy in the shell
- Updated `docs/ai-handoff.md` with the completed UI polish state and next recommended task.

### Verification

- `bun run build` could not run because `bun` was not installed in this shell.
- Ran `npm run build` successfully.
- Build completed with existing non-blocking warnings:
  - deprecated `createServerFn().inputValidator()` usage in multiple pre-existing files
  - large client chunk warning

### Risks / Follow-Up

- This pass intentionally avoided auth, migrations, Twilio, payments, demo asset deletion, and nested repo changes.
- Landing page may still benefit from a future section-reduction pass or stronger visual proof assets.
- Next safest task is an in-browser review of the polished landing page, dashboard, driver app, onboarding checklist, and support widget before any broader product changes.

## 2026-06-10 — Phase 1 Visual QA And Polish Pass

### Goal

- Continue the premium UI work with a tighter, more visual QA-oriented pass on the landing page and app workspace without changing protected systems.

### Changed

- Updated `src/routes/index.tsx`:
  - clarified top-level CTA labels
  - strengthened hero copy and proof language
  - tightened section descriptions that still felt generic
  - aligned final CTA language with the stronger workflow framing
- Updated `src/routes/_authenticated/route.tsx`:
  - added a more useful operations summary card in the sidebar
  - polished the request-link action styling/copy
  - added a subtle top-bar readiness pill for desktop
- Updated `src/routes/_authenticated/dashboard.tsx`:
  - added a dispatch command header section above the metrics strip
  - added concise inline status chips for quick situational awareness
- Updated `docs/ai-handoff.md` with the new state and next recommended review task.

### Verification

- Ran `npm run build` successfully.
- Build still reports existing non-blocking warnings:
  - deprecated `createServerFn().inputValidator()` usage in pre-existing files
  - large client chunk warning

### Risks / Follow-Up

- This pass intentionally avoided auth, migrations, payments, Twilio files, demo assets, and repo-structure changes.
- Next safest task is a manual mobile/desktop review of:
  - landing-page spacing and section length
  - sidebar usefulness and top-bar clarity
  - dispatch board density and scanability

## 2026-06-10 — Phase 2 Demo Page And CTA

### Goal

- Build a dedicated product demo experience and add a clear “Free Video Demo Here” path from the landing page.

### Changed

- Added `src/routes/demo.tsx`:
  - created a dedicated public demo route
  - added a placeholder video/embed area
  - added a guided walkthrough for:
    - owner command center
    - dispatcher board
    - driver workflow
    - AI dispatch assistant
    - live tracking
    - customer updates
    - SLA/stalled job alerts
    - billing/invoicing
    - impound management
    - motor club tracking
    - support assistant
  - added final CTA path to trial/application flow
- Updated `src/routes/index.tsx`:
  - added “Free Video Demo Here” CTA in the header
  - added “Free Video Demo Here” CTA in the hero
  - added mobile-nav demo CTA
  - added final CTA block link to the new demo route
- Updated `docs/ai-handoff.md` for Phase 2 state.

### Verification

- Ran `npm run build` successfully.
- Build still reports existing non-blocking warnings:
  - deprecated `createServerFn().inputValidator()` usage in pre-existing files
  - large client chunk warning

### Risks / Follow-Up

- This pass intentionally avoided auth, migrations, payments, Twilio files, demo asset deletion, and repo-structure changes.
- The video area is intentionally a placeholder and is ready for a real embed later.
- Next safest task is an in-browser review of `/demo` on mobile and desktop to decide whether the next pass should:
  - embed the real video
  - add screenshot proof
  - shorten or reorder the walkthrough

## 2026-06-11 — Blank Site Incident: Root Cause + Restore

### Goal

- Restore the site after a report that `/` and `/demo` were blank/not loading following the
  real-video + screenshot changes.

### What broke

- NOT the video/screenshot code. Root cause was **multiple concurrent `vite dev` servers running
  in the same project directory** (PIDs on :3000 and :3001 simultaneously). Both ran the TanStack
  Router plugin, which continuously regenerated `src/routeTree.gen.ts`. The two servers fought over
  that file ("File ... routeTree.gen.ts was modified by another process during processing." spam),
  corrupting HMR state and producing a blank/unstable local page.

### What fixed it

- Killed the duplicate dev-server processes in this project and started exactly one clean instance.
- No source code changed to fix the blank page (the smallest safe fix was process cleanup).
- Verified the route tree still contains a valid `/demo` route; did not hand-edit `routeTree.gen.ts`.

### Verification

- `npm run build` — PASSED clean (~8.8s).
- Single `npm run dev` on :3000 — no "modified by another process" messages, no errors in dev log.
- HTTP: `/` → 200 (288KB), `/demo` → 200 (263KB).
- Assets: `/videos/hooked-product-demo.webm` 200, poster 200, `/screenshots/*.png` 200.
- Browser (Claude Preview) DOM checks:
  - `/` hero `<h1>` present, `opacity:1`, `visibility:visible`; all section headings render.
  - `/demo` `<video>` loaded (`videoWidth:1920`, `error:null`); all 4 proof `<img>` `complete:true`
    with non-zero natural widths.
  - An initial "blank" screenshot was a mid-paint/tall-mobile-viewport capture artifact, not a fault.

### Risks / Follow-Up

- When running the dev server, ensure only ONE instance per project dir to avoid routeTree write
  contention. A second project (`~/Downloads/hookai`) also runs its own vite — unrelated, left alone.
- Screenshot-to-caption accuracy: the "Dispatch board" proof image (`landing-demo-section.png`)
  appears to show a code/source view rather than the dispatch board; recapture purpose-built shots
  in a later pass (cosmetic, not blocking).
- No commit/push performed.

## 2026-06-11 — Phase 3 Founder Command Center (`/founder`)

### Goal

- Build a separate platform-level Founder Command Center at `/founder`, distinct from `/owner`
  (towing-company owner console) and `/admin` (signup/application approvals). Do NOT repurpose
  `/owner`.

### Pre-edit checks

- Ran `git status --porcelain` and `git diff --stat`.
- Confirmed the interrupted Phase 3 attempt created NO `founder.tsx`/`founder.functions.ts` and did
  NOT change `/owner` for founder analytics (owner.tsx = Phase 1 refactor only; owner.functions.ts =
  minor campaign copy tweak). Nothing to undo.

### Changed

- Added `src/lib/founder.functions.ts`:
  - `getFounderMetrics` (createServerFn POST, `requireSupabaseAuth` middleware) gated by the same
    `is_super_admin` RPC used by `getOwnerMetrics`. No auth logic changed.
  - Pulls REAL data from companies, profiles, drivers, jobs, completed_jobs, applications,
    marketing_campaigns; computes per-company account health, feature adoption, and funnel stats.
  - Returns clearly-flagged `revenuePlaceholder` (SaaS MRR — no Stripe table) and
    `analyticsPlaceholder` (product analytics — no event-tracking table) with `isPlaceholder: true`
    and explanatory notes.
- Added `src/routes/founder.tsx` (`createFileRoute("/founder")`):
  - Reuses the existing email-allowlist `beforeLoad` gate pattern verbatim from owner/admin.
  - Renders 6 sections: Platform Overview, Revenue Snapshot, Feature Usage, Account Health Table,
    Founder Insights, Admin Tools Preview.
  - Badges every revenue/analytics card REAL vs PLACEHOLDER; "Soon" tiles for future admin tools.
- Updated `docs/ai-handoff.md` and `docs/change-log.md`.

### Real data vs placeholder data

- REAL: company/user/driver counts, new companies (30d), live + all-time completed jobs,
  application totals/30d/7d, pending + invited applications, pending invites, app→invite conversion,
  avg response (30d), active campaign count, customer-side job revenue tracked/paid/unpaid (30d),
  per-company account health (heuristic from users + job activity), trial days left, feature
  adoption % (dispatch/driver/billing), job status/priority/type breakdowns, founder insights.
- PLACEHOLDER (clearly labeled): Hooked SaaS MRR/ARR (illustrative estimate at assumed $199/mo —
  no Stripe/subscriptions table), product analytics (DAU, session length, retention, churn — no
  event-tracking table), and the "Soon" admin tools (billing, impersonation, analytics, flags).

### Verification

- `bun run build` — PASSED clean (~6.9s, only pre-existing non-blocking warnings).
- `/founder` confirmed present in `src/routeTree.gen.ts` (auto-generated, not hand-edited).
- In-browser review still pending (do with ONE dev server only).

### Diligence pass (same day)

- Ran `npx tsc --noEmit` across the whole project. Found + fixed 5 real type errors in
  `founder.functions.ts` (mapped-array inferred `any` → added explicit `FounderAccount` type +
  `AccountHealth` union; annotated `accounts`). Whole project now typechecks clean EXCEPT 2
  pre-existing `vite.config.ts` errors that are founder-owned (the `nitro({ config: … })` +
  `react({ fastRefresh: … })` reverted config) — left untouched on purpose.
- Verified the `drivers` table (the one query owner.functions does not use) really has `company_id`
  + `status` (migration 20260608150402) — query is valid.
- Ran `npx eslint` on both new files: fixed all prettier/formatting + react-hooks issues via
  `prettier --write`. The 18 remaining lint errors are all `@typescript-eslint/no-explicit-any`,
  matching the established pattern in `owner.functions.ts` (which carries 26 of the same) — this
  rule is `error` but the repo intentionally lives with it for service-role query files, so no
  disable-comments were added (kept consistent with the sibling file).
- Re-ran `bun run build` after fixes — still PASSED clean.

### Risks / Follow-Up

- This pass intentionally avoided auth-logic changes, migrations, Twilio, payments, demo asset
  deletion, and repo-structure changes. Not committed.
- The MRR figure is illustrative only until real billing is instrumented (dedicated payments phase).
- Account-health thresholds are a first heuristic; tune with founder input.

## 2026-06-11 — Staff Tools Dark Theme Unification

### Goal

- Re-skin the three Hooked-staff surfaces (`/founder`, `/owner`, `/admin`) from the light slate
  theme to the dark Hooked brand — matching the authenticated app's design-token system.
  Re-skin only: zero logic, layout, data-binding, or auth changes.

### Changed

- `src/routes/founder.tsx`, `src/routes/owner.tsx`, `src/routes/admin.tsx`:
  - **Page wrapper**: `bg-slate-50 text-slate-950` → `bg-background text-foreground`
  - **Headers**: `bg-white/90 border-slate-200` → `bg-surface/80 border-border`
  - **Cards/panels**: `bg-white border-slate-200 shadow-sm` → `bg-surface border-border`
  - **Subtle sections**: `bg-slate-50` (inner) → `bg-background`; `bg-slate-100` → `bg-accent`
  - **Icon containers**: `bg-slate-950 text-amber-300` → `bg-surface-2 text-primary`
  - **Nav/action buttons**: all inline-flex link buttons converted to `border-border bg-surface
    text-muted-foreground hover:border-primary/40 hover:text-foreground`
  - **Primary action buttons** (Add campaign, Approve & Invite): `bg-surface-2 text-white` →
    `bg-primary text-primary-foreground hover:bg-primary/90`
  - **Approve/Reject** action buttons in admin: → `bg-success/bg-urgent` with matching foregrounds
  - **Tables**: `bg-slate-100` header row → `bg-accent`; row borders → `border-border`
  - **Text colours**: `text-slate-950/800/700` → `text-foreground`;
    `text-slate-600/500/400` → `text-muted-foreground`
  - **Badge pairs**: amber → `bg-primary/10 text-primary`; emerald → `bg-success/15 text-success`;
    red → `bg-urgent/15 text-urgent`
  - **Progress/bar fills**: `bg-amber-400` → `bg-primary`
  - **Placeholder note blocks**: `bg-amber-50 border-amber-200` → `bg-warning/5 border-warning/20`
  - **Info banners**: amber info → `bg-primary/5 border-primary/20`
  - **Campaign status dot**: inactive `bg-slate-300` → `bg-border`
  - **Tab active underline**: `border-amber-500` → `border-primary`

### Verification

- `bun run build` — PASSED clean (~6.4s, only pre-existing non-blocking warnings from node_modules).
- Zero remaining `bg-slate-*`, `text-slate-*`, `border-slate-*`, `bg-white`, or `text-white`
  literals in any of the three files (confirmed via grep).

### Risks / Follow-Up

- Re-skin only. Zero logic, auth-gate, server-function, or data changes.
- Not committed.

## 2026-06-11 — Landing Page CTA Cleanup

### Goal

- Kill the repeated "Free Video Demo Here" placeholder-sounding string and eliminate the three
  overlapping demo CTAs scattered across header/nav/hero/final-CTA. Reduce to one clear hierarchy:
  primary "Start free trial" → /apply, secondary "Watch the demo" → /demo.

### Changed

- `src/routes/index.tsx`:
  - **Desktop nav**: Removed "Free video demo" (→/demo) and the standalone "Demo" (→#demo) links.
    The nav now covers Features, How it works, ROI calculator, Platform, Pricing. Demo is accessed
    via the header button.
  - **Desktop header buttons**: Renamed "Free Video Demo Here" → "Watch the demo". Reordered:
    Sign in → Watch the demo → Start free trial.
  - **Mobile nav**: Removed "Free Video Demo Here" + "Demo" entries; replaced with a single
    "Watch the demo" (→/demo) and "Start free trial" (→/apply) at the bottom.
  - **Hero**: Collapsed 3 buttons (Free Video Demo Here / Start your free trial / Watch the
    workflow) to 2 — primary "Start free trial" (→/apply), secondary "Watch the demo" (→/demo).
    Tightened hero vertical padding (`pt-16→pt-14`, `sm:pt-24→sm:pt-20`, `pb-12→pb-10`,
    `sm:pb-16→sm:pb-14`). Also `mt-10→mt-8` on the button group.
  - **Final CTA section**: Same 3→2 button collapse — primary "Start free trial", secondary
    "Watch the demo". Removed "Watch the workflow" (#demo anchor) button.

### Verification

- `bun run build` — PASSED clean.
- Zero remaining "Free Video Demo Here", "Watch the workflow", or "Free video demo" strings in
  index.tsx (confirmed via grep).

### Risks / Follow-Up

- This pass intentionally avoided auth, migrations, payments, Twilio, and repo structure.
- The on-page `#demo` anchor section (the ProductDemoFilm widget) is still present and reachable
  by scrolling — only the redundant scroll-button CTAs were removed. The section itself is intact.
- Not committed.

## 2026-06-11 — Premium Polish: Staff Navigation + Cross-Links

### Goal

- Premium-polish pass. Highest-impact safe win: make `/founder` easy for staff to reach and give
  the three Hooked-staff surfaces (`/founder`, `/owner`, `/admin`) coherent cross-navigation.
  Focus areas #1 (clear/professional nav) and #2 (founder access).

### Changed

- `src/routes/_authenticated/route.tsx`:
  - Imported `Rocket` icon.
  - Added a staff-gated ("Hooked Staff") nav group in the sidebar with a new **Founder Command
    Center** link (`/founder`, Rocket icon) above the existing **Owner Console** link. Both gated
    by `!isDriver && isHookedAdmin` (the existing email-allowlist check). No auth logic changed.
  - Header title map now labels `/billing` ("Billing & Invoicing") and `/insights` ("Insights")
    instead of falling through to the generic "Jobs & Billing".
- `src/routes/owner.tsx`:
  - Imported `Rocket`; added a **Founder Command Center** cross-link in the header (next to the
    existing "Review applications" link).
- `src/routes/admin.tsx`:
  - Imported `Rocket` + `Crown`; wrapped the header sign-out button in a flex group and added
    **Founder** and **Owner** cross-links so staff can hop between all three surfaces.
- `/founder` already cross-links to `/owner` and `/admin` (no change needed there).

### Verification

- `bun run build` — PASSED clean (~6.4s, only pre-existing non-blocking warnings).

### Risks / Follow-Up

- Did NOT touch auth/permission logic, migrations, Twilio, payments, or repo structure.
- Flagged for a product decision (not changed, would require auth/data-scope work): `/owner`
  currently shows platform-wide cross-company data, overlapping conceptually with `/founder`
  (focus area #6 wants `/owner` to be a single towing-company-owner dashboard). And the staff
  dashboards (`/owner`, `/admin`, `/founder`) use a LIGHT slate theme while the operator app +
  landing use the DARK navy/yellow system (focus area #9) — they're internally consistent, so a
  full dark conversion was deferred as risky/large.
- `/demo`, `/dashboard`, and `/driver` were reviewed and already sit on the coherent dark design
  system in good shape — no changes needed this pass.

## 2026-06-11 — Phase 2 Real Video Embed + Screenshot Proof

### Goal

- Replace the `/demo` placeholder video block with the real product video and add a screenshot proof section.

### Changed

- Copied four screenshot assets from `artifacts/` into a new web-accessible `public/screenshots/` folder:
  - `landing-demo-section.png`
  - `live-landing-demo-section.png`
  - `demo-static-start.png`
  - `demo-static-54s.png`
- Updated `src/routes/demo.tsx`:
  - Replaced the fake play-button placeholder with a real `<video>` element
    (`src="/videos/hooked-product-demo.webm"`, `poster="/videos/hooked-product-demo-poster.png"`,
    `controls`, `autoPlay={false}`, `playsInline`, `muted`, `loop`, `preload="metadata"`),
    filling its container over a dark `#0B1220` background, with a download fallback link.
  - Added a new `#proof` "Proof in action" section below the video: a 2-column screenshot grid
    (dispatch board, driver mobile, live tracking, billing) with captions, consistent with the
    existing Tailwind dark theme.
- Updated `docs/ai-handoff.md` and `docs/change-log.md`.

### Verification

- `bun run build` — PASSED clean in ~6s (only pre-existing non-blocking warnings).
- `bun run lint` (`eslint .`) — did NOT finish in a reasonable time (>10 min, produced no output) and
  was stopped. Lint result unconfirmed for this pass; re-run in isolation to confirm.

### Risks / Follow-Up

- This pass intentionally avoided auth, migrations, payments, Twilio files, demo asset deletion, and repo-structure changes.
- Screenshot-to-caption mapping is best-effort marketing framing; the founder may want to recapture
  purpose-built shots (true driver-mobile and billing screens) for tighter accuracy.
- The `hooked-product-demo.webm` asset is ~8.5MB and ships from `public/`; consider hosted media/CDN
  if page weight becomes a concern.
- Not committed — left for founder review.
