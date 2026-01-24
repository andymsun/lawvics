import { StateCode } from '@/types/statute';
import { Statute } from '@/types/statute';
import { useStatuteStore, ALL_STATE_CODES, useSurveyHistoryStore, MAX_CONCURRENT_SURVEYS } from '@/lib/store';
import { useLegalStore } from '@/lib/store';
import { generateStateQueries } from './translator';
import { verifyStatute } from './auditor';
import { Statute as LegalStatute } from '@/types/legal';

// ============================================================
// Configuration
// ============================================================

/** Number of states to process concurrently */
const CHUNK_SIZE = 5;

/** Enable mock mode (no real API calls) */
const MOCK_MODE = true;

// ============================================================
// Mock Data Generator
// ============================================================

/**
 * Generate mock statute data for testing
 */
function generateMockStatute(stateCode: StateCode, query: string): Statute {
    const limitationYears = Math.random() > 0.5 ? 2 : 5;
    return {
        stateCode,
        citation: `${stateCode} Code § ${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 100)}`,
        textSnippet: `The limitation period for ${query} in ${stateCode} is ${limitationYears} years from the date of discovery...`,
        effectiveDate: '2024-01-01',
        confidenceScore: Math.floor(Math.random() * 20) + 80, // 80-100
        sourceUrl: `https://legislature.${stateCode.toLowerCase()}.gov/statutes`,
    };
}

/**
 * Simulate an API fetch with random delay
 */
async function mockFetchStatute(
    stateCode: StateCode,
    query: string
): Promise<Statute> {
    // Random delay between 1-3 seconds
    const delay = Math.random() * 2000 + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Simulate 10% failure rate
    if (Math.random() < 0.1) {
        throw new Error(`Connection timeout for ${stateCode}`);
    }

    return generateMockStatute(stateCode, query);
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
 */
async function fetchStateStatute(
    stateCode: StateCode,
    query: string,
    surveyId: number
): Promise<boolean> {
    const surveyStore = useSurveyHistoryStore.getState();

    try {
        let statute: Statute;

        if (MOCK_MODE) {
            statute = await mockFetchStatute(stateCode, query);
        } else {
            // TODO: Implement real API call here
            throw new Error('Real API not implemented');
        }

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
 */
async function processChunk(
    stateCodes: StateCode[],
    queries: Record<StateCode, string>,
    surveyId: number
): Promise<[number, number]> {
    const promises = stateCodes.map((stateCode) =>
        fetchStateStatute(stateCode, queries[stateCode], surveyId)
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
 * 2. Translates the user query into 50 state-specific queries
 * 3. Processes states in chunks of CHUNK_SIZE to avoid rate limiting
 * 4. Updates the session-specific statute data as each result comes in
 * 5. Completes the survey and triggers a notification
 *
 * @param userQuery - Natural language legal query
 * @param surveyId - The ID of the survey session (created by caller)
 * @returns void
 * @throws MaxConcurrentSurveysError if 5 surveys already running
 */
export async function searchAllStates(userQuery: string, surveyId: number): Promise<void> {
    const surveyStore = useSurveyHistoryStore.getState();

    // 1. Check concurrency limit
    const runningCount = surveyStore.surveys.filter(s => s.status === 'running').length;
    if (runningCount > MAX_CONCURRENT_SURVEYS) {
        throw new MaxConcurrentSurveysError();
    }

    // 2. Generate state-specific queries
    const queries = await generateStateQueries(userQuery);

    // 3. Split states into chunks
    const chunks = chunkArray(ALL_STATE_CODES, CHUNK_SIZE);

    // 4. Process each chunk sequentially (chunks in series, states within chunk in parallel)
    let totalSuccesses = 0;
    let totalErrors = 0;

    for (const chunk of chunks) {
        const [successes, errors] = await processChunk(chunk, queries, surveyId);
        totalSuccesses += successes;
        totalErrors += errors;
    }

    // 5. Complete the survey and trigger notification
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
