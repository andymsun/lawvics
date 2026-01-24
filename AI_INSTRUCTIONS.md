# Master AI Instructions

**STOP. READ THIS FIRST.**

This document acts as the primary index and "Rule of Law" for any AI agent working on the Lawvics codebase. Following these references is mandatory to maintain project consistency and stability.

## 1. The Source of Truth Map

Before performing any task, consult the relevant authoritative documents:

| If you are... | Read this file FIRST | Key Information |
| :--- | :--- | :--- |
| **Understanding the Project** | `PRD.md` | Core mission, user personas, success metrics. |
| **Planning Features** | `ROADMAP.md` | Current phase, priorities, and future goals. |
| **Writing Code / UI** | `docs/BUILDING.md` | Tech stack, project structure, design system (Minimalist). |
| **Database / Data Types** | `SCHEMA.md` | The Strict `Statute` schema. **Do not deviate.** |
| **Fixing Bugs** | `docs/BUG_LOG.md` | Past issues and how they were solved. Log your fixes here. |
| **Understanding Agents** | `docs/FEATURES.md` | How the Orchestrator, Translator, and Auditor work. |
| **Designing Architecture** | `ARCHITECTURE.md` | System design, data flow, and component relationships. |

## 2. Core Directives

### A. The "Zero Hallucination" Standard
*   **Rule**: We are a legal tool. Accuracy is paramount.
*   **Action**: Never invent statutes or citations. If data is missing, report it as missing.
*   **Reference**: `src/lib/agents/auditor.ts` enforces this.

### B. The Minimalist UI Standard
*   **Rule**: No scrollbars on the body. No flashy gradients (unless "Liquid Glass" premium mode).
*   **Action**: Use `slate`, `gray`, and `neutral` tailwind colors.
*   **Reference**: `docs/BUILDING.md`.

### C. The "Swarm" Architecture
*   **Rule**: We fetch data in parallel, not sequentially.
*   **Action**: Any new data fetching logic must prioritize `Promise.all` or `Promise.allSettled` patterns.
*   **Reference**: `src/lib/agents/orchestrator.ts`.

## 3. Workflow for Agents

1.  **Read**: Identify the user's request. Find the matching category in the "Source of Truth Map" above. Read those files.
2.  **Plan**: Check `docs/BUG_LOG.md` to see if this has failed before. Check `docs/BUILDING.md` for the right folder structure.
3.  **Execute**: Implement changes.
4.  **Log**: If you fixed a bug, append an entry to `docs/BUG_LOG.md`.
5.  **Verify**: Ensure no new linting errors or type violations (Strict `SCHEMA.md` compliance).

---
*This file is maintained to ensure that every agent enters the codebase with the same context as the creator.*
