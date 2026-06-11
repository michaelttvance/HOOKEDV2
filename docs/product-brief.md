# Product Brief — Hooked

## What it is

Hooked is an AI-powered dispatch SaaS for tow truck companies. It replaces the
mix of phone calls, paper logs, and dated dispatch software that small/medium
towing operators currently use, with a single real-time platform covering the
full job lifecycle: intake → dispatch → driver execution → billing → impound →
customer communication.

## Who it serves

- **Tow company owners / admins** — run the business, manage billing, staff,
  drivers, police-rotation contracts, and motor club relationships.
- **Dispatchers** — staff who triage incoming jobs (calls, SMS, motor club
  requests, web requests) and assign them to drivers in real time.
- **Drivers** — field staff using a mobile-first app to receive, navigate to,
  and complete jobs.
- **Hooked staff (founder/internal)** — operate the platform itself: review
  signup applications, approve/reject new tow companies, and monitor
  cross-company growth metrics.
- **End customers** (indirect) — people whose vehicle is being towed; they
  receive tracking links and statements, but don't have accounts.
- **Police departments / motor clubs** — external parties Hooked companies
  have rotation/contract relationships with; tracked inside the app but not
  themselves users.

## Main roles

| Role | Scope |
| --- | --- |
| `driver` | Own jobs only, full-screen mobile app (`/driver`) |
| `dispatcher` | Dispatch board, impound, rotations, motor clubs |
| `admin` (client admin) | Everything a dispatcher can do, plus `/owner`, billing, insights, settings, team invites |
| Hooked staff (hardcoded email allowlist) | `/founder` (platform KPIs/marketing/account health) and `/admin` (signup approvals) — cross-company, not tied to any one company |

## Core features

- **Dispatch board** — live job queue, map view, AI-assisted driver
  suggestions, smart notes, SLA/stall alerts.
- **Driver app** — mobile-first, scoped to the signed-in driver's own jobs,
  status updates, navigation.
- **Billing** — invoice tracking, payment status (paid/invoiced/pending),
  customer accounts, statements.
- **Impound lot management** — vehicle intake, storage tracking, release.
- **Motor clubs** — manage motor club accounts/contracts that feed jobs in.
- **Police rotations** — rotation queue for police-department tow contracts,
  accept/decline tracking, rotation history.
- **Customer-facing pages** — public job tracking (`/track/$jobId`), customer
  statements (`/statement/$accountId/$month`), and a request-a-tow page
  (`/request/$companyId`) that companies can share.
- **AI assistant** — in-dispatch assistant for driver suggestions and notes
  (OpenAI via `ai-gateway.server.ts`).
- **Onboarding** — guided setup for new companies with no drivers yet, plus an
  onboarding checklist component.
- **Inbound communications (in progress)** — Twilio voice/SMS webhooks and
  missed-call handling, inbound email parsing, to capture jobs from real-world
  channels (phone/SMS/email) directly into the dispatch queue.
- **Approvals & trials** — signup applications go through a `pending` →
  `approved`/`rejected` gate; approved companies get a trial period
  (`trial_ends_at`) before requiring a paid plan.

## Product promise

"Modern AI-powered tow truck dispatch board, driver app, and billing in one
place." The pitch to operators is: stop juggling radios, spreadsheets, and
legacy dispatch software — get a real-time board, an app your drivers will
actually use, and billing that doesn't require a separate tool, with AI
quietly doing the busywork (suggesting drivers, watching for stalled jobs,
summarizing notes).

## Brand style

- Dark-themed UI (`<html class="dark">`) — "Hooked" wordmark with a tow-hook /
  truck icon (Lucide `Truck`).
- Typography: Inter (UI) + JetBrains Mono (data/mono accents).
- Tone: direct, operator-facing, no corporate fluff — copy talks about trucks,
  drivers, dispatch, not generic "workflow management."
- Marketing surfaces (landing page `index.tsx`, `/apply`) use self-contained
  demo widgets with realistic-looking but hardcoded sample data.

## Long-term goal

Grow from a web dispatch board into the default operating system for
independent tow operators: real-time dispatch + driver app + billing +
inbound-communications automation (phone/SMS/email → job), eventually
expanding the driver experience into a standalone mobile app distributed via
the App Store / Play Store, alongside a founder-facing analytics command
center for managing the platform across all customer companies.
