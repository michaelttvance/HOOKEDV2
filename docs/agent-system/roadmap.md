# Hooked SaaS — Launch Readiness Roadmap

First 10 tasks required before commercial launch. Ordered by priority and dependency.

---

## Task 1 — Fix Public Storage Bucket (Critical Security)

**Status:** Not started
**Owner:** Security Agent → Backend Agent → Founder approval
**Risk:** Critical — any guessable URL exposes job media without auth
**Description:** `job-media` Supabase bucket is `public = true`. Migrate to signed URLs for all media reads. Requires RLS review and a migration.
**Acceptance criteria:** No job media is accessible without a valid signed URL. All existing media reads updated to use signed URLs.
**Founder approval required:** Yes — schema and storage policy change.

---

## Task 2 — Resolve Super-Admin Email Allowlist Mismatch

**Status:** Not started
**Owner:** Security Agent → Backend Agent → Founder approval
**Risk:** High — one staff email may lack super-admin access in production
**Description:** `is_super_admin()` DB function only matches one of the two known staff emails. Verify the full allowlist and update the function.
**Acceptance criteria:** All intended staff emails have correct super-admin access. Function is tested.
**Founder approval required:** Yes — auth and RLS change.

---

## Task 3 — Resolve Twilio Integration (Keep / Finish / Remove)

**Status:** Pending Founder decision
**Owner:** CEO Agent (decision) → Backend Agent (implementation)
**Risk:** Medium — unreviewed server files in production branch
**Description:** `src/lib/twilio.server.ts` and related files are in-progress and unreviewed. Founder must decide: finish Twilio SMS, remove it for now, or park it in a feature branch.
**Acceptance criteria:** Decision made. Either Twilio is fully implemented and tested, or the files are cleanly removed from main.
**Founder approval required:** Yes — product direction decision.

---

## Task 4 — Fix TypeScript Errors (Non-Blocking Cleanup)

**Status:** Not started
**Owner:** Frontend Agent + Backend Agent
**Risk:** Low — non-blocking for build but increases tech debt
**Description:** Fix known TS errors in `dispatch-store.tsx`, `public-request.functions.ts`, and `vite.config.ts`. See `project_hooked.md` for line references.
**Acceptance criteria:** `bun run typecheck` passes with zero errors.
**Founder approval required:** No.

---

## Task 5 — End-to-End Dispatch Flow QA

**Status:** Not started
**Owner:** QA Agent
**Risk:** High — core product flow must be reliable before launch
**Description:** Full QA pass on the dispatch flow: job creation → driver assignment → status updates → completion → media proof. Cover happy path and failure cases.
**Acceptance criteria:** All dispatch flow states tested. No blocking bugs. QA report attached to GitHub issue.
**Founder approval required:** No — but Founder reviews findings.

---

## Task 6 — Stripe Billing Flow Verification

**Status:** Not started
**Owner:** CFO Agent → QA Agent → Founder approval
**Risk:** High — revenue depends on billing working correctly
**Description:** Verify Stripe plan structure, webhook handling, subscription lifecycle (trial → paid → cancel → reactivate), and billing portal access.
**Acceptance criteria:** Billing flow tested end-to-end in Stripe test mode. Webhooks confirmed. CFO Agent sign-off.
**Founder approval required:** Yes — billing flow approval before launch.

---

## Task 7 — Launch Landing Page Review

**Status:** Not started
**Owner:** CMO Agent → Frontend Agent → Founder approval
**Risk:** Medium — first impression for potential customers
**Description:** Review landing page copy, CTA placement, pricing section, and testimonials. Ensure messaging matches target customer (tow company owners).
**Acceptance criteria:** CMO Agent produces a copy and UX brief. Frontend Agent implements approved changes. Founder reviews final preview.
**Founder approval required:** Yes — marketing and copy decisions.

---

## Task 8 — Auth and Onboarding Flow QA

**Status:** Not started
**Owner:** QA Agent + Security Agent
**Risk:** High — broken auth or onboarding blocks all new customers
**Description:** Test sign-up, email verification, login, password reset, and first-login onboarding flow. Verify RLS prevents cross-account data access.
**Acceptance criteria:** All auth flows pass. RLS verified. No cross-account data leaks.
**Founder approval required:** No — but Security Agent escalates any findings.

---

## Task 9 — Production Environment Checklist

**Status:** Not started
**Owner:** CTO Agent → Founder approval
**Risk:** High — pre-launch production hygiene
**Description:** Verify all environment variables are set correctly in Vercel production. Confirm Supabase project is on the correct plan. Confirm domain and SSL are configured. Confirm Sentry error tracking is active.
**Acceptance criteria:** CTO Agent produces a signed-off production checklist. No open items.
**Founder approval required:** Yes — final pre-launch sign-off.

---

## Task 10 — Soft Launch Approval

**Status:** Pending all above tasks
**Owner:** Michael (Founder) — final decision
**Risk:** N/A — this is the gate
**Description:** After Tasks 1–9 are complete and verified, Founder reviews the full launch readiness checklist and makes the go/no-go decision for soft launch.
**Acceptance criteria:** All prior tasks complete. No open Critical or High risk items. Founder explicitly approves.
**Founder approval required:** Yes — this is the launch gate.

---

## Summary Table

| # | Task | Owner | Risk | Founder Approval |
|---|---|---|---|---|
| 1 | Fix public storage bucket | Security + Backend | Critical | Yes |
| 2 | Super-admin email fix | Security + Backend | High | Yes |
| 3 | Twilio decision | Founder + Backend | Medium | Yes |
| 4 | TypeScript cleanup | Frontend + Backend | Low | No |
| 5 | Dispatch flow QA | QA | High | No |
| 6 | Stripe billing verification | CFO + QA | High | Yes |
| 7 | Landing page review | CMO + Frontend | Medium | Yes |
| 8 | Auth and onboarding QA | QA + Security | High | No |
| 9 | Production env checklist | CTO | High | Yes |
| 10 | Soft launch approval | Michael | Gate | Yes |
