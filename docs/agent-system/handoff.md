# Agent Handoff Template

Use this template at the end of every agent work session. Post as a comment on the relevant PR or GitHub issue, or save to this file for cross-session continuity.

---

## Handoff

### Status
Not started / In progress / Blocked / Ready for review

### Agent Owner
_Which agent completed or is handing off this work._

### Task
_One-sentence description of the task._

### What changed
_Summary of what was done in this session._

### Files changed
_List every file that was modified, created, or deleted._

```
- path/to/file.ts — reason for change
- path/to/other.tsx — reason for change
```

### Tests run
_List verification commands run and their results._

```
bun run typecheck — Pass / Fail
bun run test — Pass / Fail / Not run
```

### Risks
_Any concerns, edge cases, or known issues introduced or left open._

### Blockers
_What is preventing this task from moving forward, if anything._

### Founder decision needed?
Yes / No — if Yes, describe what decision is needed and why.

### Recommended next step
_What the next agent or session should do first._

---

## Example Handoff

### Status
Ready for review

### Agent Owner
Frontend Agent

### Task
Implement job card UI with driver assignment dropdown.

### What changed
Added `JobCard` component with status badge and driver dropdown. Wired to existing dispatch store. Responsive on mobile.

### Files changed
```
- src/components/JobCard.tsx — new component
- src/routes/dispatch/index.tsx — import and render JobCard
```

### Tests run
```
bun run typecheck — Pass
```

### Risks
Driver list is fetched on component mount — no loading state yet if fetch is slow.

### Blockers
None.

### Founder decision needed?
No.

### Recommended next step
QA Agent should test job card rendering with 0, 1, and 10+ drivers assigned. Then CTO review.
