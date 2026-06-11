# Open Decisions — Hooked

Founder decisions required before coding high-risk or product-direction changes.

## 1. Twilio Integration

Decision needed: keep, finish, or remove.

Current state:

- Uncommitted Twilio voice/SMS webhook files exist.
- They reference Twilio env vars not currently in `.env.example`.
- They appear to require DB support for company Twilio numbers, forward phones, and `missed_calls`.

Options:

- Keep parked and document as future feature.
- Finish properly with migrations, env docs, Twilio signature validation, and tests.
- Remove from working tree if founder does not want missed-call recovery now.

Do not decide this by assumption.

## 2. Demo Assets

Decision needed: keep, move, wire into final demo page, or delete.

Current state:

- `public/demo-product-video.html`
- `public/videos/`
- `artifacts/`
- `scripts/record-product-demo.mjs`

Questions:

- Should generated videos live in Git or be hosted elsewhere?
- Should `artifacts/` be gitignored?
- Should the static recording page remain in `public/`?
- Should Phase 2 create a dedicated video demo route/page?

## 3. Auth/Admin Hardening

Decision needed: final staff/admin model.

Current state:

- Staff access uses hardcoded email allowlists in multiple app files.
- DB `is_super_admin()` may not match all staff emails.
- Client admin role exists separately from Hooked staff.

Options:

- Keep hardcoded allowlist short-term.
- Add a DB-backed staff table.
- Use Supabase custom claims.
- Add a platform role model.

This needs a dedicated Phase 4 pass.

## 4. Supabase Migrations

Decision needed: when and how to update schema safely.

Current state:

- Existing migrations define core app, approval flow, applications, billing, impound, motor clubs, inbound emails, push subscriptions, client admin, and marketing attribution.
- Twilio/missed-call schema may not be represented.

Questions:

- Should new migrations be created from local needs or applied manually via Supabase dashboard?
- Should there be a staging Supabase project before more migrations?
- Who approves RLS/security changes?

## 5. Nested Repo / Gitlink Structure

Decision needed: normalize or keep current local structure.

Current state:

- Real app repo is `extracted_project`.
- It lives inside an outer local folder `HookAi V2`.
- Future agents may confuse outer workspace state with app repo state.

Options:

- Keep as-is and document clearly.
- Move app repo to a cleaner path.
- Add guard docs/scripts to prevent work in the wrong folder.

## 6. Payment / Revenue Integration

Decision needed: payment provider and timing.

Current state:

- App has trial/billing/invoice concepts.
- No finalized payment processor integration is documented.

Options:

- Defer payment collection until manual onboarding.
- Add Stripe.
- Use invoices/manual ACH/card workflows.
- Integrate payment only after auth/admin hardening.

## 7. `/inbound-emails` Visibility

Decision needed: keep hidden or add to nav.

Current state:

- Route exists at `/inbound-emails`.
- It is hidden/no nav entry per `CLAUDE.md`.

Options:

- Keep hidden until inbound email workflow is fully validated.
- Add to admin/dispatcher nav.
- Restrict to client admins only.

## 8. Deleting or Changing Major Product Features

Decision needed: explicit founder approval before removal.

Protected areas:

- Driver app
- Owner console
- Admin approvals
- Billing/statements
- Impound
- Motor clubs
- Police rotations
- Customer tracking/request pages
- AI assistant
- Twilio/missed-call files
- Demo/video workflow

Rule: major features should be improved or hidden only with explicit approval, not deleted because they seem unused.
