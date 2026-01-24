# Building & Contribution Guide

This guide outlines the standards and structure for building and maintaining the Lawvics application. Follow these guidelines to ensure consistency.

## Tech Stack
*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **State Management**: Custom Store (`src/lib/store.ts`)
*   **Testing**: Playwright (E2E)

## Project Structure

```text
src/
├── app/            # Next.js App Router pages
│   ├── dashboard/  # Main application view
│   └── page.tsx    # Landing page
├── components/     # React Components
│   ├── dashboard/  # Dashboard-specific components
│   ├── map/        # Map visualization components
│   └── ui/         # Reusable UI primitives (buttons, inputs)
├── lib/            # Core Logic
│   ├── agents/     # AI Agents (Translator, Orchestrator, Auditor)
│   ├── store.ts    # Global state management
│   └── utils.ts    # Helper functions
└── types/          # TypeScript definitions (Statute, etc.)
```

## Development Standards

### 1. Component Design
*   Use functional components with TypeScript interfaces for props.
*   Keep components small and focused.
*   Place reusable UI elements in `src/components/ui`.

### 2. State Management
*   Use the central store (`src/lib/store.ts`) for global application state (e.g., active user, search results).
*   Use local state (`useState`) for transient UI states (e.g., modal visibility).

### 3. Styling
*   Use Tailwind CSS classes.
*   Follow the customized design system (colors, spacing) defined in `tailwind.config.ts`.
*   **Strict Minimalist Theme**: Use `slate`, `gray`, and `neutral` tones. Avoid gradients or "glassmorphism" unless specifically requested for a premium feature.

### 4. Agents & Logic
*   All business logic involving external data fetching or complex processing should reside in `src/lib/agents`.
*   Agents should be stateless where possible, relying on inputs and returning structured outputs.

### 5. Documentation
*   Update `docs/FEATURES.md` when adding new user-facing features.
*   Log significant bugs and architectural decisions in `docs/BUG_LOG.md`.
