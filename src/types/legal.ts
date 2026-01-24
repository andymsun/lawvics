export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface VerificationMetadata {
    is_link_valid: boolean;
    citation_verified_on_page: boolean;
    repeal_check_passed: boolean;
    last_checked: string; // ISO Datetime
}

export interface Statute {
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
    verification_status?: VerificationMetadata;
}

export interface StateResult {
    status: FetchStatus;
    data: Statute | null;
    error: string | null;
}

export interface LegalStore {
    /**
     * Map of US State Codes to their current fetch result.
     */
    results: Record<string, StateResult>;
}
