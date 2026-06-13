# Agent Operating System — Visual Workflow

---

## Diagram 1 — Full System Map

How work moves from Founder idea to production, and which agents are involved at each stage.

```mermaid
flowchart TD
    MichaelTop(["👤 Michael\nFounder / Final Decision Maker"])

    subgraph Executive["Executive Layer"]
        CEO["CEO Agent\nProduct & Coordination"]
        CTO["CTO Agent\nArchitecture & Review"]
        CFO["CFO Agent\nBilling & Revenue"]
        CMO["CMO Agent\nGrowth & Marketing"]
        SEC["Security Agent\nCompliance & Risk"]
    end

    subgraph Build["Build Layer"]
        FE["Frontend Agent\nUI / React / Tailwind"]
        BE["Backend Agent\nAPI / Supabase"]
        QA["QA Agent\nTests & Verification"]
    end

    subgraph Infra["Infrastructure"]
        Issues["GitHub Issues\nTask Board"]
        PR["Pull Requests\nCode Review Stage"]
        Preview["Vercel Preview\nStaging & QA"]
        Prod["Production\nVercel Main"]
    end

    MichaelApprove(["👤 Michael\nApproval Gate"])

    MichaelTop -->|"Idea or direction"| CEO
    CEO -->|"Scoped task"| CTO
    CEO -->|"Billing review"| CFO
    CEO -->|"Copy / growth review"| CMO
    CEO -->|"Security review"| SEC
    CEO -->|"Creates"| Issues

    CTO -->|"Technical plan"| Issues
    CFO -->|"Billing sign-off"| Issues
    CMO -->|"Copy brief"| Issues
    SEC -->|"Security findings"| Issues

    Issues -->|"Assigned to"| FE
    Issues -->|"Assigned to"| BE

    FE -->|"Opens PR"| PR
    BE -->|"Opens PR"| PR

    PR -->|"QA runs tests"| QA
    QA -->|"Pass"| CTO
    QA -->|"Fail → returns to"| FE
    QA -->|"Fail → returns to"| BE

    CTO -->|"Approved"| MichaelApprove
    CTO -->|"Changes needed"| FE
    CTO -->|"Changes needed"| BE

    MichaelApprove -->|"Approves PR"| Preview
    MichaelApprove -->|"Changes needed"| FE
    Preview -->|"Verified"| Prod
    Preview -->|"Issues found"| FE

    style MichaelTop fill:#1a1a2e,color:#fff,stroke:#4a9eff
    style MichaelApprove fill:#1a1a2e,color:#fff,stroke:#4a9eff
    style Prod fill:#0d4f2f,color:#fff,stroke:#22c55e
    style Preview fill:#2d3748,color:#fff,stroke:#f59e0b
```

---

## Diagram 2 — Approval Flow

Sequential gate-by-gate view from idea to production.

```mermaid
flowchart LR
    A(["💡 Idea"])
    B["Planning\nCEO Agent"]
    C["Technical Review\nCTO Agent"]
    D["Business Review\nCFO / CMO / Security"]
    E["Implementation\nFrontend + Backend"]
    F["QA\nQA Agent"]
    G["CTO Review\nFinal technical check"]
    H["Founder Approval\nMichael"]
    I["Preview\nVercel staging"]
    J(["🚀 Production"])

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F -->|"Pass"| G
    F -->|"Fail"| E
    G -->|"Approved"| H
    G -->|"Changes needed"| E
    H -->|"Approved"| I
    H -->|"Changes needed"| E
    I -->|"Verified"| J
    I -->|"Issues found"| E

    style A fill:#1a1a2e,color:#fff,stroke:#4a9eff
    style H fill:#1a1a2e,color:#fff,stroke:#4a9eff
    style J fill:#0d4f2f,color:#fff,stroke:#22c55e
```

---

## Agent Color Key

| Color | Meaning |
|---|---|
| Dark blue | Michael (Founder / decision gate) |
| Green | Production (final destination) |
| Amber | Preview / staging (verification stage) |
| Default | Agents and process steps |

---

## Key Rules Shown in These Diagrams

1. Michael is the only person who can approve production deployment.
2. QA must pass before CTO review begins.
3. CTO must approve before Founder review.
4. Failures at any stage return to Implementation — not back to Founder.
5. Preview deployment is verified before production merge.
