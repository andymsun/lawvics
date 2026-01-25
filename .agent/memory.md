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
*   **Phase**: Maintenance
Functional Purity: UI components should be pure functions of their props. Side effects (data fetching) belong in hooks/services, not UI components.

## Changelog
*   **Feature**: Batch Settings (Completed)
*   **Feature**: Landing Page Chat Box (Completed) -- Replaced launch button with search input that auto-starts survey on dashboard.
*   **Feature**: Rotating Search Placeholders (Completed) -- Landing page search input rotates generically through prompts (6s interval, 0.3s fade) with smooth fading animation. Fixed visibility issue by adjusting DOM order.

## Current Task: None
*   **Goal**: Awaiting next instruction.
