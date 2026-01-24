import { StateCode } from '@/types/statute';
import { Statute } from '@/types/statute';
import { useStatuteStore, ALL_STATE_CODES, useSurveyHistoryStore, useSettingsStore, MAX_CONCURRENT_SURVEYS } from '@/lib/store';
import { useLegalStore } from '@/lib/store';
import { generateStateQueries } from './translator';
import { verifyStatute, verifyStatuteV2 } from './auditor';
import { generateStatuteSuggestions, StatuteErrorWithSuggestions } from './suggester';
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
/**
 * Generate mock statute data client-side with CHAOS simulation.
 * Used as fallback when API is unavailable (e.g., on Cloudflare Pages static hosting).
 */
async function mockFetchStatute(stateCode: StateCode, query: string): Promise<Statute> {
    // 1. Random Latency (800ms - 2500ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1700 + 800));

    const rand = Math.random();


    // 2. Random Failures (20% chance)
    if (rand < 0.20) {
        if (Math.random() > 0.5) {
            throw new Error('Network Error: Connection reset by peer');
        } else {
            throw new Error('Timeout waiting for upstream legislature server');
        }
    }

    // 3. Suspicious Data (15% chance)
    if (rand < 0.35) { // 20% + 15% = 35% cumulative
        return {
            stateCode,
            citation: `${stateCode} Code § ???`,
            textSnippet: `[AMBIGUOUS] Search returned partial matches for "${query}" but no definitive statute could be cited. Requires manual review.`,
            effectiveDate: 'Unknown',
            confidenceScore: 45,
            sourceUrl: `https://legislature.${stateCode.toLowerCase()}.gov/search?q=${encodeURIComponent(query)}`,
            trustLevel: Math.random() > 0.5 ? 'suspicious' : 'unverified',
        };
    }

    // 4. Success (Remaining 65%)
    const limitationYears = Math.random() > 0.5 ? 2 : 5;
    return {
        stateCode,
        citation: `${stateCode} Code § ${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 100)}`,
        textSnippet: `The limitation period for ${query} in ${stateCode} is ${limitationYears} years from the date of discovery...`,
        effectiveDate: '2024-01-01',
        confidenceScore: Math.floor(Math.random() * 20) + 80,
        sourceUrl: `https://legislature.${stateCode.toLowerCase()}.gov/statutes`,
        trustLevel: 'verified',
    };
}

/**
 * Fetch statute data from our internal API route.
 * This route handles mock mode, LLM scraping, and official API calls.
 * Passes the user's API keys for BYOK support.
 * 
 * HYBRID MODE: Falls back to client-side mock if API is unavailable (static hosting).
 */
async function fetchStatuteFromApi(
    stateCode: StateCode,
    query: string,
    useMockMode: boolean, // Deprecated argument, kept for signature compatibility but ignored in favor of store
    openaiApiKey: string = '' // Deprecated argument
): Promise<Statute> {
    const settings = useSettingsStore.getState();
    const { dataSource, openaiApiKey: storeOpenAiKey, geminiApiKey, openStatesApiKey } = settings;

    // 1. STRICT CLIENT-SIDE MOCK GUARD
    // If we are in mock mode, DO NOT attempt to hit the API at all.
    if (dataSource === 'mock') {
        return mockFetchStatute(stateCode, query);
    }

    // 2. Real Mode (LLM Scraper or Official API)
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-data-source': dataSource,
        'x-active-provider': settings.activeAiProvider,
        'x-ai-model': settings.activeAiProvider === 'openai' ? settings.openaiModel : settings.geminiModel
    };

    // Attach keys based on selected source
    if (dataSource === 'llm-scraper') {
        if (storeOpenAiKey) headers['x-openai-key'] = storeOpenAiKey;
        if (geminiApiKey) headers['x-gemini-key'] = geminiApiKey;
    } else if (dataSource === 'official-api') {
        if (openStatesApiKey) headers['x-openstates-key'] = openStatesApiKey;
    }

    try {
        const response = await fetch('/api/statute/search', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                stateCode,
                query,
                dataSource, // Explicitly pass source in body too for ease of access
                useMockMode: false
            }),
        });

        if (response.status === 404) {
            throw new Error('Real Mode requires a backend server. Please run locally with `npm run dev`.');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API request failed for ${stateCode}: ${response.statusText}`);
        }

        const result: SearchApiResponse = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.error || `Failed to fetch statute for ${stateCode}`);
        }

        return result.data;
    } catch (error) {
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
export async function fetchStateStatute(
    stateCode: StateCode,
    query: string,
    surveyId: number,
    useMockMode: boolean = DEFAULT_MOCK_MODE,
    openaiApiKey: string = ''
): Promise<boolean> {
    const surveyStore = useSurveyHistoryStore.getState();
    const settings = useSettingsStore.getState();

    try {
        // 1. Fetch the statute from API or local mock
        let statute = await fetchStatuteFromApi(stateCode, query, useMockMode, openaiApiKey);

        // 2. Optional Auto-Verification (Paranoid Mode)
        if (settings.autoVerify && !useMockMode) {
            try {
                const verification = await verifyStatuteV2(
                    statute,
                    query,
                    false, // Real verification
                    { openai: settings.openaiApiKey, gemini: settings.geminiApiKey },
                    settings.activeAiProvider,
                    settings.activeAiProvider === 'openai' ? settings.openaiModel : settings.geminiModel
                );

                // Update statute with verification results
                statute = {
                    ...statute,
                    trustLevel: verification.trustLevel,
                    // Optionally update snippet if verification adds more content? 
                    // For now just trust the metadata.
                };
            } catch (vError) {
                console.warn(`Auto-verification failed for ${stateCode}:`, vError);
                // We keep the statute but maybe it stays 'unverified'
            }
        }

        // 3. Update survey session with successful result
        surveyStore.setSessionStatute(surveyId, stateCode, statute);
        return true;
    } catch (error) {
        // Generate suggestions for the error context
        const errorMessage = error instanceof Error ? error.message : String(error);

        const suggestions = await generateStatuteSuggestions(query, stateCode, errorMessage);
        const enhancedError = new StatuteErrorWithSuggestions(errorMessage, suggestions);

        // Update survey session with error
        surveyStore.setSessionError(
            surveyId,
            stateCode,
            enhancedError
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
        // Check for cancellation between chunks
        const currentSurvey = useSurveyHistoryStore.getState().surveys.find(s => s.id === surveyId);
        if (currentSurvey?.status === 'cancelled') {
            console.log(`[Orchestrator] Survey #${surveyId} cancelled. Stopping.`);
            return;
        }

        const [successes, errors] = await processChunk(chunk, queries, surveyId, useMockMode, openaiApiKey);
        totalSuccesses += successes;
        totalErrors += errors;
    }

    // Double check status before final completion (don't override cancellation)
    const finalSurvey = useSurveyHistoryStore.getState().surveys.find(s => s.id === surveyId);
    if (finalSurvey?.status === 'cancelled') return;

    // 6. Complete the survey and trigger notification
    surveyStore.completeSurvey(surveyId, totalSuccesses, totalErrors);
}
