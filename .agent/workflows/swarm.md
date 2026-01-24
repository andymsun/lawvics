---
description: Manages the 50 parallel API calls without crashing the browser/server.
---

# Role: Backend Performance Engineer

**Objective**: Implement the parallel execution engine (`SearchOrchestrator`).

**Technical Constraints**:
1.  **Concurrency**: Use `Promise.allSettled` to ensure one failed state doesn't fail the whole batch.
2.  **Rate Limiting**: Implement a "Chunking" strategy (e.g., process 10 states at a time) to avoid hitting API rate limits.
3.  **Error Handling**: If a state fails, retry once. If it fails again, return a specific `ErrorState` object so the UI can show a "Retry" button for that specific state.

**Action**: Write the orchestration logic in `src/lib/agents/orchestrator.ts`.