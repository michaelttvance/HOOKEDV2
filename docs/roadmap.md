# Roadmap — Hooked

This roadmap is organized by phases so Claude, Codex, ChatGPT, and future agents do not mix high-risk infrastructure work with product polish.

## Phase 0 — Security / Repo Hygiene Completed

Status: completed earlier.

Completed intent:

- Move Lovable-exported app into a normal standalone repo/deployment path.
- Remove Lovable platform dependencies.
- Configure Vercel deployability.
- Protect secrets and avoid committing `.env`.
- Establish baseline project instructions in `CLAUDE.md`.
- Identify high-risk areas: auth, migrations, Twilio, demo assets, nested repo structure, payments.

Do not reopen Phase 0 unless a concrete issue is found.

## Phase 1 — Launch-Readiness Cleanup

Goal: make the current product safer, cleaner, and easier to operate without changing deep architecture.

Recommended tasks:

- Resolve current uncommitted working tree into reviewed, intentional commits or explicitly parked work.
- Review and classify Twilio/missed-call files: keep, finish, or remove after founder decision.
- Review untracked demo/video assets and decide final source-of-truth location.
- Clean up app warnings that are low-risk and not auth/schema related.
- Confirm `.env.example` matches approved features only.
- Verify production landing page, apply flow, Google auth, dashboard, driver app, owner/admin pages.
- Add lightweight smoke-test checklist for launch.

Avoid during Phase 1:

- Auth model rewrites.
- RLS/migration changes.
- Payment integration.
- Major UI rewrites.

## Phase 2 — In-Depth Demo Page and "Free Video Demo Here" CTA

Goal: convert the marketing/demo work into a polished product-sales path.

Recommended tasks:

- Create a dedicated public demo route/page with the product video, screenshot sections, role walkthroughs, and CTA.
- Add a clear "Free Video Demo Here" CTA from the landing page hero/header.
- Decide whether `public/demo-product-video.html`, `public/videos/`, `artifacts/`, and `scripts/record-product-demo.mjs` stay in repo, move to a docs/demo package, or are replaced by hosted media.
- Ensure all demo data is fake.
- Add noindex/SEO decisions for internal demo-recording routes/assets.
- Validate mobile and desktop layout in production preview.

Avoid during Phase 2:

- Wiring demo pages to real customer data.
- Deleting demo source assets before the founder chooses storage/hosting.

## Phase 3 — Founder/Admin Analytics Command Center

Goal: make `/founder` the founder operating console for the platform, while `/owner` remains the towing-company owner dashboard scoped to one customer account.

Recommended tasks:

- Define founder KPIs: applications, signups, active companies, trial conversion, missed calls recovered, jobs booked, estimated revenue, marketing campaign ROI.
- Decide which metrics are real today versus placeholders.
- Add campaign tracking flows only after attribution schema is confirmed.
- Add support tickets/missed-call health when the supporting DB schema is approved.
- Keep founder analytics and client-admin analytics clearly separated.

Avoid during Phase 3:

- Giving client admins access to Hooked platform-wide data.
- Mixing `/owner`, `/founder`, and `/admin` responsibilities.

## Phase 4 — Auth/Admin Role Hardening

Goal: make access control robust and consistent.

Recommended tasks:

- Inventory every app-side staff allowlist and DB-side admin function.
- Decide final staff/admin model: DB role, staff table, Supabase claim, or explicit allowlist.
- Align `_authenticated/route.tsx`, `admin.tsx`, `founder.tsx`, `/owner` role gates, `is_super_admin()`, and RLS.
- Test driver/dispatcher/client-admin/founder paths.
- Add regression tests or a manual matrix for role routing.

This phase requires explicit approval before coding.

## Phase 5 — Standalone Driver App / App Store Path

Goal: move driver experience toward installable/native distribution.

Recommended tasks:

- First stabilize the web driver app and push notification behavior.
- Decide path: PWA only, Capacitor wrapper, React Native, or native apps.
- Audit driver app feature set: assigned jobs, status flow, navigation, tracking link, photos, signature, offline/resume, push notifications.
- Decide App Store/Play Store branding, accounts, privacy policy, and notification/location disclosures.
- Keep dispatcher/admin web app separate from driver app surface.

Do not start Phase 5 until Phase 1 and auth role clarity are complete.
