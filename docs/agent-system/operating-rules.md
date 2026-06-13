# Agent Operating System — Operating Rules

## Purpose

Rules every agent in the Hooked Agent Operating System must follow. These protect the product, protect Michael's time, and keep all AI-assisted work safe and auditable.

---

## Core Principles

1. **Documentation before code.** Every feature or change starts with a plan, not a commit.
2. **Branches isolate work.** Each agent works in its own branch. Nothing merges without review.
3. **Michael is the final approver.** No production deployment, billing change, auth change, or database migration happens without explicit Founder approval.
4. **Escalate early.** If an agent is uncertain, it stops and escalates. It does not guess.
5. **No scope creep.** Agents do only what is assigned. They flag unrelated issues rather than fixing them silently.

---

## What Every Agent Must Do

- State the branch and git status before making changes.
- List every file it plans to read or change before starting.
- For tasks touching more than 2 files, create a short plan first.
- Run the smallest relevant verification command available (typecheck, lint, or test).
- Report at the end of every task: branch, files changed, summary, verification result, commit status, and anything needing human review.

---

## What Every Agent Must Never Do

| Action | Reason |
|---|---|
| Edit `.env` or secrets | Security |
| Modify Supabase migrations, RLS, or auth config | Data integrity and compliance risk |
| Touch billing or Stripe integration files | Financial risk |
| Run `git add .` or `git add -A` | May include secrets or unrelated files |
| Merge to `main` without Founder approval | Production safety |
| Deploy to production | Requires Founder sign-off |
| Expand task scope without explaining why | Scope drift |
| Skip verification before committing | Quality risk |
| Commit `src/routeTree.gen.ts` | Auto-generated — always restore with `git checkout HEAD -- src/routeTree.gen.ts` after builds |

---

## Escalation Triggers

An agent must stop and escalate to Michael when:

- The task requires a database schema change.
- The task touches billing, payments, or Stripe.
- The task changes auth flows or security policies.
- The task requires a production deployment.
- The agent is blocked and cannot proceed safely.
- The plan would affect more than 5 files.
- There is ambiguity about the correct behavior.

---

## Branch Naming Convention

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<name>` | `feature/driver-login` |
| Fix | `fix/<name>` | `fix/dispatch-timeout` |
| Docs | `docs/<name>` | `docs/agent-system` |
| Agent work | `agent/<role>/<task>` | `agent/frontend/job-card-ui` |

---

## Commit Message Format

```
<type>(<scope>): <short description>

<optional body: what changed and why>
```

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`

---

## Verification Requirements

| Change type | Required verification |
|---|---|
| TypeScript/React changes | `bun run typecheck` |
| API route changes | Manual test or unit test |
| Database changes | SQL review + migration test on branch |
| Documentation only | File existence check |
| UI changes | Preview deployment review before production |
