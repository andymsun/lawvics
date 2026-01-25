# Saved Branch - Completely Seperate

# Lawvics (MVP)

The 50-State Autonomous Legal Research Engine.

Lawvics orchestrates parallel autonomous agents to retrieve, verify, and visualize jurisdiction-specific statutes in real-time.

## Features (MVP)
*   **Interactive US Map**: Visualizes real-time status of 50 simultaneous research jobs.
*   **Swarm Orchestration**: Simulates parallelized fetching of legal statutes (Mocked for MVP, ready for Crawlee integration).
*   **Auditor Agent**: Verifies incoming data against a strict Zod schema to prevent hallucinations.
*   **Optimistic UI**: Real-time feedback loop (Loading -> Success/Error) for each jurisdiction.

## Tech Stack
*   **Framework**: Next.js 16 (App Router)
*   **State Management**: Zustand
*   **Validation**: Zod
*   **Map Visualization**: React Simple Maps + D3
*   **Styling**: Tailwind CSS

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```

3.  **Use the App**
    *   Enter a query (e.g., "Statute of limitations for fraud").
    *   Watch the map light up as the "swarm" fetches data.

## Project Structure
*   `src/lib/agents`: Core AI logic (Orchestrator, Auditor).
*   `src/lib/store.ts`: Global state for the 50-state array.
*   `src/components/map`: Visualization components.
