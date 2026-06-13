/**
 * System Command Center — plain-English project status.
 * Update this file between Claude sessions to keep the dashboard current.
 * No secrets, no API keys, no SQL, no raw source code here.
 */

export type AuditStatus =
  | "Ready"
  | "Needs Review"
  | "High Priority"
  | "Not Started"
  | "Blocked";

export type BuildStatus = "Live" | "In Progress" | "Not Started" | "Stub";
export type IntegrationStatus = "Integrated" | "Partial" | "Not Started" | "Blocked";

export interface WorkflowStep {
  step: number;
  label: string;
  description: string;
  status: BuildStatus;
}

export interface RouteEntry {
  path: string;
  label: string;
  description: string;
  status: BuildStatus;
}

export interface ServiceEntry {
  name: string;
  purpose: string;
  status: IntegrationStatus;
}

export interface SecurityAuditItem {
  area: string;
  item: string;
  status: AuditStatus;
  note: string;
}

export interface FocusItem {
  priority: "P0" | "P1" | "P2" | "P3";
  task: string;
  why: string;
}

export interface ClaudeWorkflowNotes {
  workedOn: string[];
  doNotTouch: string[];
  nextStep: string;
}

export interface OwnerSystemStatus {
  lastUpdated: string;
  productWorkflowMap: WorkflowStep[];
  frontendMap: RouteEntry[];
  backendMap: ServiceEntry[];
  securityAuditItems: SecurityAuditItem[];
  workflowSummary: string;
  recommendedFocus: FocusItem[];
  claudeWorkflowNotes: ClaudeWorkflowNotes;
  riskLegend: Record<"P0" | "P1" | "P2" | "P3", string>;
  statusLegend: Record<AuditStatus, string>;
}

export const OWNER_SYSTEM_STATUS: OwnerSystemStatus = {
  lastUpdated: "2026-06-12",

  workflowSummary:
    "Hooked is a tow-truck dispatch platform that helps towing companies manage jobs, drivers, and billing in one place. The core dispatch flow is live and functional. Drivers can receive jobs and update status on mobile. Company owners can see revenue and fleet health. Outstanding items before go-live: Twilio SMS registration, Stripe billing connection, a full demo smoke test, and a review of the media storage security settings.",

  productWorkflowMap: [
    {
      step: 1,
      label: "Customer Request",
      description:
        "A customer submits a tow request via the public request page or a dispatcher creates it manually. The job appears on the dispatch board immediately.",
      status: "Live",
    },
    {
      step: 2,
      label: "Dispatch Board",
      description:
        "Dispatchers see all active jobs in a live queue. They can view job details, set priority, and monitor status. AI-generated smart notes summarize the job context automatically.",
      status: "Live",
    },
    {
      step: 3,
      label: "Assign Driver",
      description:
        "A dispatcher picks a driver from the available fleet and assigns the job. The driver's status updates to 'On Job' and the ETA is set.",
      status: "Live",
    },
    {
      step: 4,
      label: "Driver Updates Status",
      description:
        "The driver uses the Hooked driver app on their phone. They accept the job, mark it en route, and mark it complete. Each status change is reflected live on the dispatch board.",
      status: "Live",
    },
    {
      step: 5,
      label: "Customer Tracking",
      description:
        "Customers can track their driver in real time via a unique tracking link sent by the dispatcher. No login required for the customer.",
      status: "Live",
    },
    {
      step: 6,
      label: "Job Completion & Records",
      description:
        "When a job is completed, revenue is recorded, payment status is tracked, and the job moves to the completed history. Billing reports are available in the owner dashboard.",
      status: "Live",
    },
    {
      step: 7,
      label: "Billing & Invoicing",
      description:
        "Stripe integration will handle subscription billing for towing companies using Hooked. Currently a placeholder — Stripe has not been connected yet.",
      status: "Not Started",
    },
  ],

  frontendMap: [
    {
      path: "/",
      label: "Landing Page",
      description:
        "The public homepage with marketing copy, a product demo video section, and a 'Apply to join' call-to-action for towing companies.",
      status: "Live",
    },
    {
      path: "/apply",
      label: "Application Form",
      description:
        "Towing companies fill out a form to request access to Hooked. After submitting, their account goes into a pending state until approved.",
      status: "Live",
    },
    {
      path: "/auth",
      label: "Login / Sign Up",
      description: "The login and account creation page. Powered by Supabase Auth.",
      status: "Live",
    },
    {
      path: "/dashboard",
      label: "Dispatch Board",
      description:
        "The main dispatcher screen. Shows the live job queue, a real-time map, driver availability, AI smart notes, and job assignment controls.",
      status: "Live",
    },
    {
      path: "/driver",
      label: "Driver App",
      description:
        "A full-screen mobile-first view for drivers. Shows the driver's active job, status controls (Accept, En Route, Complete), and basic job details.",
      status: "Live",
    },
    {
      path: "/owner",
      label: "Company Owner Dashboard",
      description:
        "For the owner of each towing company. Shows fleet stats, job history, revenue, team members, and driver roster — scoped to that company only.",
      status: "Live",
    },
    {
      path: "/impound",
      label: "Impound Yard",
      description: "Tracks vehicles held in the impound yard. Separate from the active job queue.",
      status: "Live",
    },
    {
      path: "/rotations",
      label: "Driver Rotations",
      description:
        "Manages driver rotation schedules so dispatchers know who is next in line for a job.",
      status: "Live",
    },
    {
      path: "/motor-clubs",
      label: "Motor Clubs",
      description:
        "Tracks jobs coming in from motor club accounts (AAA, insurance companies, etc.).",
      status: "Live",
    },
    {
      path: "/billing",
      label: "Billing",
      description:
        "Company billing and invoice management. Stripe integration pending — currently shows basic payment status from job records.",
      status: "In Progress",
    },
    {
      path: "/settings",
      label: "Company Settings",
      description:
        "Lets admins configure their company profile, team members, and load sample data for demos.",
      status: "Live",
    },
    {
      path: "/insights",
      label: "Insights",
      description: "Business analytics and performance reports for the company.",
      status: "Live",
    },
    {
      path: "/track/$jobId",
      label: "Customer Tracking Page",
      description:
        "A public page customers can visit to track their driver in real time using a unique link. No login required.",
      status: "Live",
    },
    {
      path: "/founder",
      label: "Founder Command Center (this page)",
      description:
        "Michael's private dashboard showing platform-wide metrics, account health, campaigns, and this System Command Center. Founder-only.",
      status: "Live",
    },
    {
      path: "/admin",
      label: "Application Approvals",
      description:
        "Michael's page for reviewing and approving or rejecting towing company applications.",
      status: "Live",
    },
  ],

  backendMap: [
    {
      name: "Supabase — Database",
      purpose:
        "Stores all app data: jobs, drivers, companies, users, billing records, motor club accounts, impound logs, and event tracking.",
      status: "Integrated",
    },
    {
      name: "Supabase — Auth",
      purpose:
        "Handles login, signup, password reset, and session management for all user types (dispatcher, driver, admin, founder).",
      status: "Integrated",
    },
    {
      name: "Supabase — Storage",
      purpose:
        "Stores photos and files attached to jobs (damage photos, tow receipts, etc.). The job-media bucket currently needs a security review — it may allow public access.",
      status: "Partial",
    },
    {
      name: "AI Smart Notes (via AI Gateway)",
      purpose:
        "Uses Claude to automatically generate plain-English summaries of jobs for dispatchers. Called when a job is created or updated.",
      status: "Integrated",
    },
    {
      name: "Twilio — SMS & Voice",
      purpose:
        "Sends SMS notifications to drivers and customers. Voice call logging for missed call tracking. Code is written and tested locally. A2P 10DLC campaign registration is required before SMS messages can be sent reliably to customers.",
      status: "Partial",
    },
    {
      name: "Stripe — Billing",
      purpose:
        "Will handle monthly subscription billing for towing companies using Hooked. Not yet connected — no products, prices, or webhooks configured.",
      status: "Not Started",
    },
    {
      name: "Resend — Transactional Email",
      purpose:
        "Sends onboarding emails, invite emails, and notification emails. Connected, but the webhook verification secret needs a review to confirm it is set correctly.",
      status: "Partial",
    },
    {
      name: "Push Notifications (VAPID)",
      purpose:
        "Sends browser push notifications to dispatchers for urgent job updates. Partially implemented.",
      status: "Partial",
    },
    {
      name: "Google Maps",
      purpose:
        "Powers the live job map on the dispatch board. Shows driver locations and job addresses.",
      status: "Integrated",
    },
  ],

  securityAuditItems: [
    {
      area: "Auth",
      item: "Super-admin email mismatch",
      status: "Needs Review",
      note:
        "The founder page uses one email list (FOUNDER_EMAILS) and there is a separate database function (is_super_admin) that may reference a different email. Both need to match. This requires a coordinated fix across all locations — do not edit auth checks casually.",
    },
    {
      area: "Storage / RLS",
      item: "Job-media storage bucket may allow public read access",
      status: "High Priority",
      note:
        "Photos attached to jobs (damage photos, receipts) may be readable by anyone with the URL. This needs to be locked down to authenticated users only before going live with real customers.",
    },
    {
      area: "Billing",
      item: "Stripe not connected",
      status: "Not Started",
      note:
        "No subscription billing is wired. Towing companies cannot be charged for using Hooked yet. This is intentional for the current phase but must be in place before any paid launch.",
    },
    {
      area: "SMS / Twilio",
      item: "A2P 10DLC campaign registration",
      status: "Not Started",
      note:
        "Before Hooked can send SMS messages to customers in the US, the phone number must be registered under an approved 10DLC campaign. Without this, carriers may block or filter messages. Registration takes 2–4 weeks.",
    },
    {
      area: "Email",
      item: "Resend webhook secret verification",
      status: "Needs Review",
      note:
        "The RESEND_WEBHOOK_SECRET environment variable may not be set correctly. This means inbound email webhooks could potentially be spoofed. Needs a quick check to confirm the secret is configured and validated in the code.",
    },
    {
      area: "Error Handling",
      item: "safePublicError() coverage across server functions",
      status: "Needs Review",
      note:
        "All server-side errors shown to users should go through safePublicError() to avoid leaking stack traces or internal details. Most functions have been updated but not all have been audited.",
    },
    {
      area: "Demo Flow",
      item: "End-to-end demo smoke test",
      status: "Not Started",
      note:
        "No documented end-to-end test walkthrough exists. Before any investor or customer demo, a full flow should be walked through: create a job, assign a driver, complete it, view billing. The seed_demo_data function exists but the full path has not been smoke-tested.",
    },
    {
      area: "Build Health",
      item: "Clean build on feature/dispatch-core-v1",
      status: "Needs Review",
      note:
        "Several files have uncommitted edits. The build should be run and verified clean before committing. Run 'bun run build' and 'bun run lint' to confirm.",
    },
  ],

  recommendedFocus: [
    {
      priority: "P1",
      task: "Review and lock down job-media storage bucket permissions",
      why: "Customer photos and job documents may be publicly accessible. This is a security gap that must be closed before any real customers use the platform.",
    },
    {
      priority: "P1",
      task: "Start A2P 10DLC SMS registration for Twilio",
      why: "This takes 2–4 weeks to process. The sooner it is submitted, the sooner SMS can go live. SMS notifications are core to the product.",
    },
    {
      priority: "P1",
      task: "Verify and fix super-admin email consistency",
      why: "The founder access email list and the database function need to match. A mismatch could accidentally grant or block access to the wrong accounts.",
    },
    {
      priority: "P2",
      task: "Run a full demo smoke test",
      why: "Walk the complete flow — new company, create job, assign driver, complete job — and document any gaps before showing to investors or customers.",
    },
    {
      priority: "P2",
      task: "Confirm Resend webhook secret is set correctly",
      why: "Unverified webhooks are a minor security gap. Quick to fix once confirmed.",
    },
    {
      priority: "P2",
      task: "Run bun run build and bun run lint — commit clean working tree",
      why: "There are many uncommitted changes across core files. Getting to a clean, passing commit is important for stability and makes future sessions cleaner.",
    },
    {
      priority: "P3",
      task: "Begin Stripe billing integration planning",
      why: "Not urgent for a demo, but required before any paying customers. Map out the plan so it is ready to implement when needed.",
    },
  ],

  claudeWorkflowNotes: {
    workedOn: [
      "Phase 1 dispatch core cleanup — job flow, driver assignment, status updates",
      "Error handling pass — safePublicError() applied across server functions",
      "Twilio SMS/Voice integration files created (not yet committed or registered)",
      "Seed data trimming — removing hardcoded demo arrays from seed-data.ts",
      "System Command Center tab added to /founder page",
    ],
    doNotTouch: [
      "Supabase migrations — any schema change needs a dedicated coordinated session",
      "RLS policies — do not edit row-level security rules without explicit approval",
      "Auth config and user_roles checks — fragile, must be changed together across all locations",
      "Stripe files — not started, do not wire without a dedicated billing session",
      "routeTree.gen.ts — auto-generated, never hand-edit, restore with git checkout if changed by build",
      ".env files and any file containing API keys or secrets",
      "The public/demo-product-video.html and video assets — untracked, do not delete",
    ],
    nextStep:
      "Run bun run build and bun run lint on the current branch to confirm the working tree is clean. Then commit the in-progress dispatch-core work as a single clean commit. After that, start the job-media storage bucket security review.",
  },

  riskLegend: {
    P0: "On fire — stop everything and fix this first. The app is broken or real customer data is at risk right now.",
    P1: "Do this week — will block the demo or go-live if ignored. Not an emergency but very high priority.",
    P2: "Do before launch — real issue but the app still works without it. Should be done before any paying customers.",
    P3: "Eventually — nice to have, low urgency, will not block anything today.",
  },

  statusLegend: {
    Ready: "This area is working correctly and safe for a demo or live use.",
    "Needs Review": "Probably fine but has not been fully verified. Worth a quick check before go-live.",
    "High Priority": "Known gap that needs to be fixed before showing to real customers or investors.",
    "Not Started": "Has not been built or configured yet. Expected for this stage.",
    Blocked: "Cannot proceed until something else is resolved first.",
  },
};
