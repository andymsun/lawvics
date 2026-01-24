# System Architecture

## Directory Structure
```
/
├── .agent/              # AI Agent Memory & Rules
├── src/
│   ├── app/             # Next.js App Router
│   ├── components/      # React Components
│   │   ├── map/         # Interactive Map (D3/React-Simple-Maps)
│   │   └── ui/          # Generic UI (shadcn)
│   ├── lib/
│   │   ├── agents/      # Autonomous Agents
│   │   │   ├── translator.ts  # Query -> 50 Booleans
│   │   │   ├── orchestrator.ts # Swarm Manager (Promise.allSettled)
│   │   │   └── auditor.ts      # Anti-Hallucination Verification
│   │   └── services/    # External API Wrappers
│   ├── types/           # Strict TypeScript Definitions
│   └── utils/           # Helper functions
├── public/
└── tests/               # Playwright/Vitest
```

## Data Model (The Golden Schema)

**Entity: Statute**
```typescript
interface Statute {
  /**
    * 2-letter state code (e.g., "NY", "CA", "TX")
    */
  jurisdiction_code: string;

  /**
    * Standard Bluebook format citation (e.g., "N.Y. Penal Law § 175.10")
    */
  official_citation: string;

  /**
    * Cleaned, raw text of the statute.
    * MUST NOT be confirmed summary unless explicitly tagged.
    */
  statute_text: string;

  /**
    * Date the statute became effective. ISO 8601 Date string.
    */
  effective_date: string;

  /**
    * Direct URL to the official government source.
    */
  source_link: string;

  /**
    * Categorization tags for clustering on the map.
    */
  tags: string[];

  /**
    * Verification metadata added by @auditor
    */
  verification_status?: {
      is_link_valid: boolean;
      citation_verified_on_page: boolean;
      repeal_check_passed: boolean;
      last_checked: string; // ISO Datetime
  }
}
```

## Data Flow (Request Lifecycle)
1.  **User Input**: "Statute of limitations for fraud" (Frontend).
2.  **Translation**: `@translator` agent converts input into 50 jurisdiction-specific search strings (e.g., NY: "fraud limitation", LA: "fraud prescription").
3.  **Orchestration**: `@swarm` agent initiates 50 parallel asynchronous jobs.
    *   Optimistic UI updates to "Loading" state for all 50 states on the map.
4.  **Retrieval**: Each job fetches data from its respective source.
5.  **Audit**: `@auditor` agent verifies the `effective_date` and `source_link` of the retrieved data *before* passing it back.
    *   If invalid: Retry or mark as Error.
    *   If valid: Pass to UI.
6.  **Visualization**:
    *   Data updates the `Store`.
    *   Map component re-renders specific state color based on result (e.g., "2 Years" = Red).
    *   Side panel updates with Statute details.

## External Integrations
*   **LLM Provider**: OpenAI / Anthropic (for Query Translation and initial parsing).
*   **Search**: Custom scrapers / Official State APIs / Legal Search APIs.
*   **Database**: Supabase (PostgreSQL) for caching valid results.
*   **Maps**: `react-simple-maps` (TopoJSON).
