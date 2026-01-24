# Agent Memory

## Project Context
LexState is a high-performance 50-state survey engine designed for legal professionals. It uses a swarm of autonomous agents to fetch, verify, and visualize legal statutes across all 50 US jurisdictions simultaneously. The core value prop is "Accuracy > Speed" — we verify every citation to prevent hallucinations.

## Tech Stack
*   **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
*   **Visualization**: react-simple-maps or D3.js
*   **State Management**: React Query (TanStack Query) for async data streams
*   **Validation**: Zod (Strict Schema Validation)
*   **Language**: TypeScript (Strict Mode)

## Current Status
*   **Phase**: Planning
*   **Active Task**: Genesis / System Architecture

## Architecture Rules
1.  **Accuracy > Speed**: Any result that fails specific verification (source URL check, date check) MUST be flagged or discarded. Never guess a statute text.
2.  **Strict Typing**: All data flowing between agents (Translator -> Swarm -> Auditor) must adhere to the shared JSON Schema. No `any`.
3.  **Functional Purity**: UI components should be pure functions of their props. Side effects (data fetching) belong in hooks/services, not UI components.
