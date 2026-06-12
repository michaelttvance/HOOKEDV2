# Open Decisions — Hooked

Founder decisions required before coding high-risk or product-direction changes.

## 1a. Outbound Status SMS — DECIDED / IMPLEMENTED (env vars required)

Decision: keep and ship.

Current state (as of 2026-06-12):

- Outbound status SMS is implemented and deployed to production.
- Live smoke test (2026-06-12) confirmed all dispatcher/driver operations succeed; SMS failure is non-blocking.
- The `sms_messages` table exists in the live DB.
- Three SMS sends are wired: job assigned, driver on scene, job complete.
- Console warning during smoke test: `"SMS send failed: Twilio is not configured"` — caused by missing env vars only.

Action required (Vercel environment variables — no code or schema changes needed):

1. Set `TWILIO_ACCOUNT_SID` in Vercel → Project Settings → Environment Variables (Production + Preview).
2. Set `TWILIO_AUTH_TOKEN` in Vercel → Project Settings → Environment Variables (Production + Preview).
3. Set `TWILIO_PHONE_NUMBER` in Vercel → Project Settings → Environment Variables (E.164 format, e.g. `+15551234567`).
4. Trigger a new Vercel deployment after adding vars (existing running instances do not pick up new env vars).

This decision is closed. No further code or schema work needed for outbound SMS.

## 1b. Inbound Voice/SMS Webhook Recovery — OPEN (DB schema required before enabling)

Decision needed: finish in Phase 4 or park longer.

Current state (as of 2026-06-12):

- Webhook route files are deployed to production but NOT configured in Twilio console.
- Inbound webhooks will 500 if pointed at the live app because required DB objects are missing.

Prerequisite DB objects (do not enable webhooks until all three exist in live DB):

- `companies.twilio_number` column — per-company inbound Twilio number
- `companies.forward_phone` column — per-company forward-to phone number
- `missed_calls` table — lead records for unanswered calls

Additional requirements before production traffic:

- Twilio webhook request signature validation (currently absent — security gap).
- Settings UI `as never` TypeScript casts for the two missing columns need real generated types once columns are migrated.

Options:

- Finish properly: write a dedicated migration PR adding the three DB objects, add signature validation, update TypeScript types, test end-to-end.
- Park: keep files deployed but unconfigured; document as Phase 4+ feature; add a note to Twilio console setup docs.
- Remove: delete the four inbound files — only with explicit founder approval.

Do not point Twilio inbound webhook URLs at the production app until this decision is acted on and the DB migration is applied.

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
