export type StateCode =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY';

export interface Statute {
  /**
   * The 2-letter US State Code (e.g., "NY", "TX").
   */
  stateCode: StateCode;

  /**
   * Standard legal citation (e.g., "N.Y. Penal Law § 175.10").
   */
  citation: string;

  /**
   * Relevant text snippet from the statute.
   */
  textSnippet: string;

  /**
   * The effective date of the statute (ISO 8601 string).
   */
  effectiveDate: string;

  /**
   * Confidence score (0-100) based on verification checks.
   */
  confidenceScore: number;

  /**
   * Direct URL to the official government source.
   */
  sourceUrl: string;

  /**
   * Google search URL for the citation (fallback for verification).
   */
  googleSearchUrl?: string;

  /**
   * Optional override for trust level (useful for mock/chaos modes).
   */
  trustLevel?: 'verified' | 'unverified' | 'suspicious';
}
