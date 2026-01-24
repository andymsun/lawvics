# Roadmap

## Phase 1: Setup (Week 0)
*   [ ] Initialize Next.js 14 project with TypeScript & Tailwind.
*   [ ] Setup ESLint/Prettier with strict type checking.
*   [ ] Configure `.agent` memory and roles.
*   [ ] CI/CD pipeline setup (GitHub Actions).

## Phase 2: Core Infrastructure (The Backend Swarm) - **PRIORITY**
*   [ ] **Type Definitions**: Implement the strict `Statute` schema in `src/types`.
*   [ ] **Agent: Translator**: Build the LLM prompt chain to convert natural language -> 50 boolean queries.
*   [ ] **Agent: Swarm**: Implement `Promise.allSettled` orchestration loop with rate-limiting chunker.
*   [ ] **Agent: Auditor**: Build the verification logic (Link checker + Text scraper).
*   [ ] **Unit Tests**: Test the orchestrator with mock data (ensure no race conditions).

## Phase 3: MVP Features (The UI)
*   [ ] **Map Component**: Implement `react-simple-maps` with dynamic coloring props.
*   [ ] **Search Bar**: Simple input that triggers the Swarm.
*   [ ] **Results Panel**: Side drawer to display the selected state's statute text.
*   [ ] **Export**: CSV export functionality.

## Phase 4: Polish & Launch
*   [ ] **End-to-End Testing**: Verify the full loop from Query -> Map Update.
*   [ ] **Performance Tuning**: Memoize map components to prevent re-renders.
*   [ ] **Error Handling**: Graceful degradation (e.g., "3 states failed to load" toast).
*   [ ] **Documentation**: Write usage guide for Junior Associates.
