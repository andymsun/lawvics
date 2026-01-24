# The Golden Schema

This document checks the strict contracts for data within Lawvics. All agents (`@translator`, `@swarm`, `@auditor`) must adhere to these definitions.

## 1. Core Entity: `Statute`

The atomic unit of our system is a single statute from a single jurisdiction.

```typescript
interface Statute {
  /**
   * 2-letter US state code (upper case).
   * Example: "NY", "TX", "CA"
   */
  jurisdiction_code: string;

  /**
   * Standard Bluebook format citation.
   * Example: "N.Y. Penal Law § 175.10"
   */
  official_citation: string;

  /**
   * Cleaned, raw text of the statute.
   * MUST NOT be confirmed summary unless explicitly tagged.
   */
  statute_text: string;

  /**
   * Date the statute became effective.
   * Format: ISO 8601 Date string (YYYY-MM-DD)
   */
  effective_date: string;

  /**
   * Direct URL to the official government source.
   */
  source_link: string;

  /**
   * Categorization tags for clustering on the map.
   * Example: ["Limitation: 2 Years", "Felony"]
   */
  tags: string[];

  /**
   * Verification metadata added by @auditor
   */
  verification_status?: VerificationMetadata
}

interface VerificationMetadata {
  is_link_valid: boolean;
  citation_verified_on_page: boolean;
  repeal_check_passed: boolean;
  last_checked: string; // ISO Datetime
}
```

## 2. Store & State Management

We use a normalized store to track the async status of all 50 states independently. This prevents one failed request from blocking the UI for others.

**Data Structure:**
```typescript
type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

interface StateResult {
    status: FetchStatus;
    data: Statute | null;
    error: string | null; // User-facing error message
}

interface LegalStore {
    /**
     * Map of US State Codes to their current fetch result.
     * Keys: "AL", "AK", ..., "WY"
     */
    results: Record<string, StateResult>;
}
```

## 3. Data Flow Rules

1.  **Initialization**: On query start, all 50 keys in `results` are set to `status: 'loading'`.
2.  **Partial Updates**: As each `@swarm` worker returns, the specific state key is updated to `'success'` or `'error'`.
3.  **Optimistic UI**: The Map component subscribes to `results`.
    *   `loading`: Grey/Spinner
    *   `success`: Color-coded based on `tags`
    *   `error`: Red/Warning Icon
