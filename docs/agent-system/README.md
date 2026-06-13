# Agent Operating System — Index

This folder defines the Hooked Agent Operating System: the rules, roles, and workflow that govern how multiple AI agents collaborate on this codebase.

**Read these files in order when starting a new agent session:**

---

## 1. [operating-rules.md](operating-rules.md)
**Start here.** Universal rules every agent must follow — what agents must do, what they must never do, escalation triggers, branch naming, commit format, and verification requirements.

## 2. [agent-roles.md](agent-roles.md)
Defines all 8 agents (4 executive, 4 build), their purpose, responsibilities, permitted actions, forbidden actions, escalation rules, and update message format.

**Executive agents:** CEO, CFO, CTO, CMO
**Build agents:** Frontend, Backend, QA, Security

## 3. [workflow.md](workflow.md)
The 9-stage workflow from Founder idea to production deployment. Shows which agent is responsible at each stage and where the Founder approval gates sit.

## 4. [roadmap.md](roadmap.md)
The first 10 launch-readiness tasks ordered by risk and priority. Each task has an owner, risk level, acceptance criteria, and Founder approval status.

## 5. [decisions.md](decisions.md)
Running decision log. Check here for pending Founder decisions before starting work that touches pricing, billing, auth, or production scope.

## 6. [handoff.md](handoff.md)
Standard handoff template. Every agent must complete a handoff at the end of each work session and post it as a PR comment or save it here.

## 7. [visual-workflow.md](visual-workflow.md)
Two Mermaid diagrams — the full system map (all agents and infrastructure) and the approval flow (idea to production gate-by-gate).

---

## Quick Reference

| Question | File to read |
|---|---|
| What am I allowed to do? | `operating-rules.md` |
| What is my role? | `agent-roles.md` |
| What stage is this task in? | `workflow.md` |
| What needs to ship before launch? | `roadmap.md` |
| Is there a pending decision I need? | `decisions.md` |
| How do I hand off to the next agent? | `handoff.md` |
| How does the whole system fit together? | `visual-workflow.md` |

---

## Key Rules (summary)

- Michael is the only person who approves production deployments.
- No code is written until Michael approves the plan (Stage 3).
- QA passes before CTO review. CTO approves before Michael sees the PR.
- Agents never touch: `.env`, Supabase migrations, RLS policies, auth config, billing files, or `src/routeTree.gen.ts`.
- Agents never run `git add .` — always stage by explicit file path.
