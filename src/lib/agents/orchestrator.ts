import { StateCode } from '@/types/statute';
import { Statute } from '@/types/statute';
import { useStatuteStore, ALL_STATE_CODES, useSurveyHistoryStore, useSettingsStore, MAX_CONCURRENT_SURVEYS } from '@/lib/store';
import { useLegalStore } from '@/lib/store';
import { generateStateQueries } from './translator';
import { verifyStatute } from './auditor';
import { Statute as LegalStatute } from '@/types/legal';

// ============================================================
// Configuration
// ============================================================

/** Number of states to process concurrently */
const CHUNK_SIZE = 5;

/** Default mock mode setting (can be overridden by caller) */
const DEFAULT_MOCK_MODE = true;

// ============================================================
// Internal API Client
// ============================================================

interface SearchApiResponse {
    success: boolean;
    data?: Statute;
    error?: string;
}

/**
 * Generate mock statute data client-side.
 * Used as fallback when API is unavailable (e.g., on Cloudflare Pages static hosting).
 */
function generateClientMockStatute(stateCode: StateCode, query: string): Statute {
    const limitationYears = Math.random() > 0.5 ? 2 : 5;
    return {
        stateCode,
        citation: `${stateCode} Code § ${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 100)}`,
        textSnippet: `The limitation period for ${query} in ${stateCode} is ${limitationYears} years from the date of discovery...`,
        effectiveDate: '2024-01-01',
        confidenceScore: Math.floor(Math.random() * 20) + 80,
        sourceUrl: `https://legislature.${stateCode.toLowerCase()}.gov/statutes`,
    };
}

/**
 * Fetch statute data from our internal API route.
 * This route handles both mock mode and real scraping.
 * Passes the user's OpenAI API key for BYOK support.
 * 
 * HYBRID MODE: Falls back to client-side mock if API is unavailable (static hosting).
 */
async function fetchStatuteFromApi(
    stateCode: StateCode,
    query: string,
    useMockMode: boolean,
    openaiApiKey: string = ''
): Promise<Statute> {
    // 1. STRICT CLIENT-SIDE MOCK GUARD
    // If we are in mock mode, DO NOT attempt to hit the API at all.
    // This ensures the app works offline or when the backend is down/missing.
    if (useMockMode) {
        // Simulate network delay for realistic UX (500-1500ms)
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        return generateClientMockStatute(stateCode, query);
    }

    // 2. Real Mode: Must have API available
    // We only proceed potential network calls if we are NOT in mock mode
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (openaiApiKey) {
        headers['x-openai-key'] = openaiApiKey;
    }

    try {
        const response = await fetch('/api/statute/search', {
            method: 'POST',
            headers,
            body: JSON.stringify({ stateCode, query, useMockMode }),
        });

        if (response.status === 404) {
            throw new Error('Real Mode requires a backend server. Please run locally with `npm run dev`.');
        }

        if (!response.ok) {
            throw new Error(`API request failed for ${stateCode}: ${response.statusText}`);
        }

        const result: SearchApiResponse = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.error || `Failed to fetch statute for ${stateCode}`);
        }

        return result.data;
    } catch (error) {
        // If real mode fails, we throw the error so the UI shows it
        // We do NOT fallback to mock data in Real Mode, as that would be misleading
        throw error;
    }
}

// ============================================================
// Chunking Utility
// ============================================================

/**
 * Split an array into chunks of a given size
 */
function chunkArray<T>(array: readonly T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size) as T[]);
    }
    return chunks;
}

// ============================================================
// Main Orchestrator
// ============================================================

/**
 * Fetch a single state's statute data for a specific session
 * Returns true for success, false for error
 * 
 * @param stateCode - The 2-letter state code to fetch
 * @param query - The legal query to search for
 * @param surveyId - The survey session ID
 * @param useMockMode - Whether to use mock data (true) or real scraping (false)
 * @param openaiApiKey - User's OpenAI API key for BYOK support
 */
async function fetchStateStatute(
    stateCode: StateCode,
    query: string,
    surveyId: number,
    useMockMode: boolean = DEFAULT_MOCK_MODE,
    openaiApiKey: string = ''
): Promise<boolean> {
    const surveyStore = useSurveyHistoryStore.getState();

    try {
        // Call our internal API (handles both mock and real modes)
        const statute = await fetchStatuteFromApi(stateCode, query, useMockMode, openaiApiKey);

        // Update survey session with successful result
        surveyStore.setSessionStatute(surveyId, stateCode, statute);
        return true;
    } catch (error) {
        // Update survey session with error
        surveyStore.setSessionError(
            surveyId,
            stateCode,
            error instanceof Error ? error : new Error(String(error))
        );
        return false;
    }
}

/**
 * Process a chunk of states in parallel for a specific session
 * Returns count of [successes, errors]
 * 
 * @param stateCodes - Array of state codes to process in this chunk
 * @param queries - Map of state codes to their specific search queries
 * @param surveyId - The survey session ID
 * @param useMockMode - Whether to use mock data (true) or real scraping (false)
 * @param openaiApiKey - User's OpenAI API key for BYOK support
 */
async function processChunk(
    stateCodes: StateCode[],
    queries: Record<StateCode, string>,
    surveyId: number,
    useMockMode: boolean = DEFAULT_MOCK_MODE,
    openaiApiKey: string = ''
): Promise<[number, number]> {
    const promises = stateCodes.map((stateCode) =>
        fetchStateStatute(stateCode, queries[stateCode], surveyId, useMockMode, openaiApiKey)
    );

    // Use Promise.allSettled to ensure all complete regardless of failures
    const results = await Promise.allSettled(promises);

    let successes = 0;
    let errors = 0;

    results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value === true) {
            successes++;
        } else {
            errors++;
        }
    });

    return [successes, errors];
}

/** Error thrown when max concurrent surveys reached */
export class MaxConcurrentSurveysError extends Error {
    constructor() {
        super('Maximum of 5 concurrent surveys reached. Please wait for one to complete.');
        this.name = 'MaxConcurrentSurveysError';
    }
}

/**
 * Search all 50 states for statute data
 *
 * This function:
 * 1. Checks concurrency limit (max 5 running surveys)
 * 2. Retrieves the user's OpenAI API key from settings
 * 3. Translates the user query into 50 state-specific queries
 * 4. Processes states in chunks of CHUNK_SIZE to avoid rate limiting
 * 5. Updates the session-specific statute data as each result comes in
 * 6. Completes the survey and triggers a notification
 *
 * @param userQuery - Natural language legal query
 * @param surveyId - The ID of the survey session (created by caller)
 * @param useMockMode - Whether to use mock data (true) or real scraping (false). Defaults to true.
 * @returns void
 * @throws MaxConcurrentSurveysError if 5 surveys already running
 */
export async function searchAllStates(
    userQuery: string,
    surveyId: number,
    useMockMode: boolean = DEFAULT_MOCK_MODE
): Promise<void> {
    const surveyStore = useSurveyHistoryStore.getState();
    const settingsStore = useSettingsStore.getState();

    // 1. Check concurrency limit
    const runningCount = surveyStore.surveys.filter(s => s.status === 'running').length;
    if (runningCount > MAX_CONCURRENT_SURVEYS) {
        throw new MaxConcurrentSurveysError();
    }

    // 2. Get user's API key for BYOK support
    const openaiApiKey = settingsStore.openaiApiKey || '';

    // 3. Generate state-specific queries
    const queries = await generateStateQueries(userQuery);

    // 4. Split states into chunks
    const chunks = chunkArray(ALL_STATE_CODES, CHUNK_SIZE);

    // 5. Process each chunk sequentially (chunks in series, states within chunk in parallel)
    let totalSuccesses = 0;
    let totalErrors = 0;

    for (const chunk of chunks) {
        const [successes, errors] = await processChunk(chunk, queries, surveyId, useMockMode, openaiApiKey);
        totalSuccesses += successes;
        totalErrors += errors;
    }

    // 6. Complete the survey and trigger notification
    surveyStore.completeSurvey(surveyId, totalSuccesses, totalErrors);
}

// ============================================================
// Legacy Orchestrator (for backward compatibility)
// ============================================================

const generateMockLegalStatute = (stateCode: string, query: string): LegalStatute => {
    return {
        jurisdiction_code: stateCode,
        official_citation: `${stateCode} Code § ${Math.floor(Math.random() * 1000)}`,
        statute_text: `This is a simulated result for query "${query}" in ${stateCode}. The law states that...`,
        effective_date: '2024-01-01',
        source_link: `https://legislature.${stateCode.toLowerCase()}.gov/statutes`,
        tags: Math.random() > 0.5 ? ['Limitation: 2 Years'] : ['Limitation: 5 Years', 'Severity: High'],
        verification_status: {
            is_link_valid: true,
            citation_verified_on_page: true,
            repeal_check_passed: true,
            last_checked: new Date().toISOString(),
        },
    };
};

const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export async function orchestrateSearch(query: string) {
    const store = useLegalStore.getState();

    store.reset();
    US_STATES.forEach((state) => store.setLoading(state));

    US_STATES.forEach(async (state) => {
        const delay = Math.random() * 7000 + 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        if (Math.random() > 0.1) {
            const mockData = generateMockLegalStatute(state, query);
            const verification = await verifyStatute(mockData);

            if (verification.success && verification.data) {
                store.setSuccess(state, verification.data);
            } else {
                store.setError(state, verification.error || 'Validation Failed');
            }
        } else {
            store.setError(state, 'Connection Timeout or Source Unavailable');
        }
    });
}
