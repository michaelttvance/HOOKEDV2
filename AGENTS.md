# AGENTS.md

Instructions for Codex, Claude, ChatGPT, and any future AI coding agent working on Hooked.

## Required Reading Before Coding

Read these files first, in order:

1. `CLAUDE.md`
2. `docs/product-brief.md`
3. `docs/architecture.md`
4. `docs/roadmap.md`
5. `docs/ai-handoff.md`
6. `docs/open-decisions.md`

Then inspect only the app files needed for the specific task.

## Working Rules

- Work in phases. Do not mix high-risk auth/schema work with UI cleanup.
- Do not change app functionality unless the user explicitly asks for code changes.
- Do not touch auth, migrations, Twilio, demo assets, payments, or nested repo/git structure unless explicitly approved.
- Do not delete uncommitted work from another agent.
- Update `docs/ai-handoff.md` before stopping.
- Update `docs/change-log.md` after meaningful work.
- Run verification appropriate to the change.

## Default Commands

Before edits:

```bash
pwd
git status --porcelain
git diff --stat
```

After documentation-only edits:

```bash
git status --porcelain
```

After app code edits:

```bash
npm run build
git status --porcelain
```

Use Bun equivalents when Bun is available and expected for the environment.
