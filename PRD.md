# Product Requirements Document (PRD)

## Elevator Pitch
Lawvics is a parallelized 50-state legal research engine that orchestrates autonomous agents to simultaneously retrieve, verify, and visualize jurisdiction-specific statutes in real-time, cutting 40+ hours of manual research down to seconds.

## User Personas
1.  **Junior Associate (The Grunt)**: Overwhelmed by volume, terrified of missing a state or citing bad law. Needs speed and absolute certainty to impress partners.
2.  **The Partner (The Reviewer)**: Doesn't trust tech easily. Needs "show your work" links and immediate visual summaries (maps) to explain risk to clients.
3.  **Knowledge Management Attorney**: Obsessed with consistency. Needs the data to be structured and exportable, not just a blob of text.

## Core Features (MVP)
1.  **Natural Language Query Translator**: Convert "Statute of limitations for fraud" into 50 specific boolean search strings automatically.
2.  **Swarm Orchestration**: Asynchronous parallel fetching of all 50 states without rate-limiting or browser crashes.
3.  **Real-Time Verification (Shepardizing)**: Automatic checking of "Effective Date" and "Source URL" to prevent hallucinations.
4.  **Interactive Legal Map**: Visual clustering of results (e.g., Red States = 2 years, Blue States = 3 years) for instant pattern recognition.

## Success Metrics
*   **Time to Result**: < 10 seconds for initial results, < 60 seconds for full 50-state completion.
*   **Accuracy**: 0% hallucination rate on citations (enforced by @auditor).
*   **Usability**: User can click "Export" and get a perfectly formatted CSV/Excel table.

## Non-Goals
*   **Case Law**: We are NOT searching judicial opinions (cases) yet, only Statutes/Regulations.
*   **Full International Support**: 50 US States only for MVP.
*   **Mobile App**: Desktop/Web focus for heavy research workflows.
