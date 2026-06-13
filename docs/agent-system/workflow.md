# Agent Operating System — Workflow

This document describes how work moves through the Hooked Agent Operating System from Founder idea to production deployment.

---

## Stages

### Stage 1 — Idea Intake

**Who:** Michael (Founder) → CEO Agent

Michael shares an idea, feature request, or problem. The CEO Agent:
- Clarifies scope and acceptance criteria.
- Identifies which agents need to be involved.
- Creates a roadmap item or GitHub issue.
- Flags any decisions that need Founder input before work begins.

**Output:** Scoped roadmap item or GitHub issue with acceptance criteria.

---

### Stage 2 — Technical Planning

**Who:** CTO Agent (+ CFO, CMO, Security agents as needed)

The CTO Agent creates a technical plan:
- Files that will change.
- New API routes or schema changes needed.
- Risks and dependencies.
- Estimated complexity.

If the plan touches billing → CFO Agent reviews.
If the plan touches marketing copy or landing page → CMO Agent reviews.
If the plan touches auth, storage, or sensitive data → Security Agent reviews.

**Output:** Technical plan in `docs/` or attached to the GitHub issue.

---

### Stage 3 — Founder Approval to Build

**Who:** Michael

Before any code is written, Michael reviews:
- The scoped plan.
- Any flagged risks from CFO, CMO, or Security.
- Confirms the work is approved to proceed.

**Gate:** Work does not start until Michael approves.

---

### Stage 4 — Implementation

**Who:** Frontend Agent and/or Backend Agent

Each agent works in its own branch:
- Branch name: `agent/<role>/<task>` or `feature/<task>`.
- Agents stage only their assigned files — never `git add .`.
- Agents run typecheck before committing.
- Agents do not merge their own PRs.

**Output:** Open PR against `main` with description, files changed, and typecheck status.

---

### Stage 5 — QA Review

**Who:** QA Agent

The QA Agent reviews the open PR:
- Runs tests and typecheck.
- Verifies against acceptance criteria.
- Posts results as a PR comment.
- Flags any regressions or missing coverage.

If QA passes → moves to Stage 6.
If QA fails → returns to Stage 4 with findings.

---

### Stage 6 — CTO Review

**Who:** CTO Agent

CTO Agent reviews the PR for:
- Architecture and code quality.
- Security and performance concerns.
- Alignment with the technical plan.

If CTO approves → moves to Stage 7.
If CTO requests changes → returns to Stage 4.

---

### Stage 7 — Founder Approval

**Who:** Michael

Michael reviews:
- The PR summary and diff.
- QA and CTO sign-off.
- Any remaining open decisions.

If Michael approves → moves to Stage 8.
If Michael requests changes → returns to Stage 4.

**Gate:** Nothing deploys without Michael's explicit approval.

---

### Stage 8 — Preview Deployment

**Who:** Vercel (automated) + Michael + QA Agent

The PR triggers a Vercel preview deployment. Michael and the QA Agent:
- Review the feature in the preview environment.
- Confirm it matches acceptance criteria.
- Confirm no regressions in adjacent features.

If preview passes → moves to Stage 9.
If preview fails → returns to Stage 4.

---

### Stage 9 — Production Deployment

**Who:** Michael

After preview approval, Michael:
- Merges the PR to `main`.
- Confirms production deployment on Vercel.
- Notifies relevant agents that the feature is live.

**Gate:** Only Michael merges to main and approves production.

---

## Escalation Path

At any stage, any agent can pause work and escalate to Michael if:
- Scope has grown beyond the approved plan.
- A new risk is discovered.
- A decision is needed that wasn't anticipated.
- The agent is blocked.

Escalation format: agent posts a structured update (see `agent-roles.md`) and tags it `[ESCALATION]`.

---

## Branch and PR Hygiene

- One feature per branch. No multi-feature branches.
- PR title format: `[Agent] Short description of change`
- PRs must include: files changed, typecheck status, QA status, CTO approval.
- Delete branches after merge.
- Never commit secrets, generated files, or `.env` content.

---

## Communication Between Agents

Agents communicate through:
1. GitHub PR comments (primary).
2. Structured update messages in `docs/agent-system/handoff.md` format.
3. CEO Agent session summaries after each work session.

Agents do not directly modify each other's work without coordination through the CEO Agent.
