import { StateCode } from '@/types/statute';
import { Statute } from '@/types/statute';
import { useStatuteStore, ALL_STATE_CODES, useSurveyHistoryStore, useSettingsStore, MAX_CONCURRENT_SURVEYS } from '@/lib/store';
import { useLegalStore } from '@/lib/store';
import { generateStateQueries } from './translator';
import { verifyStatute, verifyStatuteV2 } from './auditor';
import { generateStatuteSuggestions, StatuteErrorWithSuggestions } from './suggester';
import { Statute as LegalStatute } from '@/types/legal';
import { getDemoStatute } from '@/data/demo-statutes';

// ============================================================
// Configuration
// ============================================================

/** Number of states to process concurrently (reduced to avoid rate limits) */
const CHUNK_SIZE = 2;

/** Delay in ms between processing chunks to avoid rate limits */
const INTER_CHUNK_DELAY_MS = 1500;

/** Default mock mode setting (can be overridden by caller) */
const DEFAULT_MOCK_MODE = true;

// ============================================================
// Demo Query Detection
// ============================================================

/**
 * Check if a query is a demo query that uses hardcoded data.
 * Demo queries should be processed one state at a time for smooth animation.
 */
export function isDemoQuery(query: string): boolean {
    const ql = query.toLowerCase();
    const isAdversePossession = ql.includes('adverse possession');
    const isFraudSol = ql.includes('fraud') && (ql.includes('statute of limitations') || ql.includes('sol') || ql.includes('time limit'));
    const isTheftThreshold = (ql.includes('theft') || ql.includes('larceny') || ql.includes('stealing')) && (ql.includes('grand') || ql.includes('felony') || ql.includes('threshold'));
    return isAdversePossession || isFraudSol || isTheftThreshold;
}

// ============================================================
// Debug Logger (client-side, checks localStorage)
// ============================================================

function isDebugMode(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('lawvics-debug') === 'true';
}

const debug = {
    log: (...args: unknown[]) => isDebugMode() && console.log('[Orchestrator]', ...args),
    error: (...args: unknown[]) => isDebugMode() && console.error('[Orchestrator]', ...args),
    time: (label: string) => isDebugMode() && console.time(`[Orchestrator] ${label}`),
    timeEnd: (label: string) => isDebugMode() && console.timeEnd(`[Orchestrator] ${label}`),
    group: (label: string) => isDebugMode() && console.group(`[Orchestrator] ${label}`),
    groupEnd: () => isDebugMode() && console.groupEnd(),
};

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
    const { dataSource, openaiApiKey: storeOpenAiKey, geminiApiKey, openRouterApiKey, openStatesApiKey, legiscanApiKey, scrapingApiKey } = settings;

    // 1. STRICT CLIENT-SIDE MOCK GUARD
    // If we are in mock mode, DO NOT attempt to hit the API at all...
    // EXCEPTION: For demo queries, always call the API to get researched data with staggered timing
    if (dataSource === 'mock' && !isDemoQuery(query)) {
        debug.log(`[${stateCode}] Using client-side mock`);
        return mockFetchStatute(stateCode, query);
    }

    // 2. Real Mode (LLM Scraper or Official API)
    // Determine which model to use based on provider
    let aiModel: string;
    if (settings.activeAiProvider === 'openrouter') {
        aiModel = settings.openRouterModel;
    } else if (settings.activeAiProvider === 'gemini') {
        aiModel = settings.geminiModel;
    } else {
        aiModel = settings.openaiModel;
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-data-source': dataSource,
        'x-active-provider': settings.activeAiProvider,
        'x-ai-model': aiModel
    };

    // Enable server-side debug if client-side debug is on
    if (isDebugMode()) {
        headers['x-debug-mode'] = 'true';
    }

    // Attach keys based on selected source
    if (dataSource === 'llm-scraper') {
        if (storeOpenAiKey) headers['x-openai-key'] = storeOpenAiKey;
        if (geminiApiKey) headers['x-gemini-key'] = geminiApiKey;
        if (openRouterApiKey) headers['x-openrouter-key'] = openRouterApiKey;
    } else if (dataSource === 'scraping-proxy') {
        if (scrapingApiKey) headers['x-scraping-key'] = scrapingApiKey;
        if (storeOpenAiKey) headers['x-openai-key'] = storeOpenAiKey;
        if (geminiApiKey) headers['x-gemini-key'] = geminiApiKey;
        if (openRouterApiKey) headers['x-openrouter-key'] = openRouterApiKey;
    } else if (dataSource === 'official-api') {
        if (openStatesApiKey) headers['x-openstates-key'] = openStatesApiKey;
        if (legiscanApiKey) headers['x-legiscan-key'] = legiscanApiKey;
    } else if (dataSource === 'system-api') {
        // System API Mode: Force OpenRouter and inherit env vars from server
        // We don't need to send keys from client since they are on server
        headers['x-active-provider'] = 'openrouter';
        // Optional: Hint to use OPENROUTER_API_KEY on server if needed

        // Allow client-side override if provided locally
        if (openRouterApiKey) headers['x-openrouter-key'] = openRouterApiKey;
    }

    debug.log(`[${stateCode}] Fetching with headers:`, {
        dataSource,
        hasOpenAI: !!storeOpenAiKey,
        hasGemini: !!geminiApiKey,
        hasOpenRouter: !!openRouterApiKey,
        hasOpenStates: !!openStatesApiKey,
        hasLegiscan: !!legiscanApiKey
    });
    debug.time(`fetch-${stateCode}`);

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

        debug.timeEnd(`fetch-${stateCode}`);
        debug.log(`[${stateCode}] Response status:`, response.status);

        if (response.status === 404) {
            debug.error(`[${stateCode}] 404 - API route not found`);
            throw new Error('Real Mode requires a backend server. Please run locally with `npm run dev`.');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            debug.error(`[${stateCode}] Error response:`, errorData);
            throw new Error(errorData.error || `API request failed for ${stateCode}: ${response.statusText}`);
        }

        const result: SearchApiResponse = await response.json();
        debug.log(`[${stateCode}] Result:`, { success: result.success, citation: result.data?.citation });

        if (!result.success || !result.data) {
            throw new Error(result.error || `Failed to fetch statute for ${stateCode}`);
        }

        return result.data;
    } catch (error) {
        debug.error(`[${stateCode}] Fetch error:`, error);
        throw error;
    }
}

// ============================================================
// Batch Fetch (Multi-State in Single LLM Call)
// ============================================================

interface BatchApiResponse {
    success: boolean;
    data?: Record<string, Statute>;
    error?: string;
}

/**
 * Fetch statutes for multiple states in a single API call.
 * Uses the batch endpoint which makes ONE LLM call for all states.
 * Falls back to individual calls if batch fails.
 */
async function fetchBatchStatutes(
    stateCodes: StateCode[],
    query: string
): Promise<Record<string, Statute>> {
    const settings = useSettingsStore.getState();
    const { openaiApiKey, geminiApiKey, openRouterApiKey, activeAiProvider, openaiModel, geminiModel, openRouterModel } = settings;

    // Determine which model to use based on provider
    let aiModel: string;
    let effectiveProvider = activeAiProvider;

    if (settings.dataSource === 'system-api') {
        // FORCE OpenRouter for System API
        effectiveProvider = 'openrouter';
        aiModel = 'openai/gpt-4o-mini';
    } else if (activeAiProvider === 'openrouter') {
        aiModel = openRouterModel;
    } else if (activeAiProvider === 'gemini') {
        aiModel = geminiModel;
    } else {
        aiModel = openaiModel;
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-active-provider': effectiveProvider,
        'x-ai-model': aiModel
    };

    if (openaiApiKey) headers['x-openai-key'] = openaiApiKey;
    if (geminiApiKey) headers['x-gemini-key'] = geminiApiKey;
    if (openRouterApiKey) headers['x-openrouter-key'] = openRouterApiKey;

    const response = await fetch('/api/statute/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify({ stateCodes, query }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Batch API failed: ${response.statusText}`);
    }

    const result: BatchApiResponse = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Batch API returned no data');
    }

    return result.data;
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
    openaiApiKey: string = '',
    isRetry: boolean = false
): Promise<boolean> {
    const surveyStore = useSurveyHistoryStore.getState();
    const settings = useSettingsStore.getState();

    try {
        // 1. Handle Demo Queries Locally (Client-Side)
        if (isDemoQuery(query)) {
            // Artificial delay for feel
            await new Promise(resolve => setTimeout(resolve, 800));

            const demoStatute = getDemoStatute(stateCode, query, isRetry);
            if (demoStatute) {
                surveyStore.setSessionStatute(surveyId, stateCode, demoStatute);
                return true;
            } else {
                throw new Error("No data found");
            }
        }

        // 2. Fetch the statute from API or local mock
        let statute = await fetchStatuteFromApi(stateCode, query, useMockMode, openaiApiKey);

        // 3. Optional Auto-Verification (Paranoid Mode)
        if (settings.autoVerify && !useMockMode) {
            try {
                // Determine which model to use for verification
                let verificationModel: string;
                if (settings.activeAiProvider === 'openrouter') {
                    verificationModel = settings.openRouterModel;
                } else if (settings.activeAiProvider === 'gemini') {
                    verificationModel = settings.geminiModel;
                } else {
                    verificationModel = settings.openaiModel;
                }

                const verification = await verifyStatuteV2(
                    statute,
                    query,
                    false, // Real verification
                    { openai: settings.openaiApiKey, gemini: settings.geminiApiKey, openrouter: settings.openRouterApiKey },
                    settings.activeAiProvider,
                    verificationModel
                );

                // Update statute with verification results
                statute = {
                    ...statute,
                    trustLevel: verification.trustLevel,
                };
            } catch (vError) {
                console.warn(`Auto-verification failed for ${stateCode}:`, vError);
            }
        }

        // 4. Update survey session with successful result
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
 * Process a chunk of states for a specific session.
 * For LLM-based modes, uses BATCH API (1 call for all states in chunk).
 * For mock/official-api, uses individual calls.
 * 
 * @param stateCodes - Array of state codes to process in this chunk
 * @param query - The user's legal query
 * @param surveyId - The survey session ID
 * @param useMockMode - Whether to use mock data
 */
async function processChunk(
    stateCodes: StateCode[],
    query: string,
    surveyId: number,
    useMockMode: boolean = DEFAULT_MOCK_MODE
): Promise<[number, number]> {
    const settings = useSettingsStore.getState();
    const { dataSource, openaiApiKey } = settings;
    const surveyStore = useSurveyHistoryStore.getState();

    let successes = 0;
    let errors = 0;

    // 0. Handle Demo Queries Locally (Client-Side)
    // To ensure "pop up one by one" animation without network lag/limits
    if (isDemoQuery(query)) {
        for (const stateCode of stateCodes) {
            const demoStatute = getDemoStatute(stateCode, query);
            if (demoStatute) {
                surveyStore.setSessionStatute(surveyId, stateCode, demoStatute);
                successes++;
            } else {
                // Should not happen if demo data is complete, but fallback safely
                surveyStore.setSessionError(surveyId, stateCode, new Error("No data found"));
                errors++;
            }
        }
        return [successes, errors];
    }

    // For LLM-based modes:
    // If chunk has only 1 state, use individual fetch (enables scraping/proxy).
    // If chunk has >1 state, use batch API (pure LLM generation, no scraping).
    if (dataSource === 'llm-scraper' || dataSource === 'scraping-proxy' || dataSource === 'system-api') {
        if (stateCodes.length === 1) {
            // Single state -> Use scraping logic
            const stateCode = stateCodes[0];
            const result = await fetchStateStatute(stateCode, query, surveyId, useMockMode, openaiApiKey);
            return result ? [1, 0] : [0, 1];
        } else {
            // Multiple states -> Use Batch LLM logic
            try {
                // Make ONE batch call for all states in chunk
                const batchResults = await fetchBatchStatutes(stateCodes, query);

                // Process results for each state
                for (const stateCode of stateCodes) {
                    const statute = batchResults[stateCode];
                    if (statute) {
                        surveyStore.setSessionStatute(surveyId, stateCode, statute);
                        successes++;
                    } else {
                        surveyStore.setSessionError(surveyId, stateCode, new Error(`No result returned for ${stateCode}`));
                        errors++;
                    }
                }
            } catch (error) {
                // Batch failed - mark all states as error
                const errorObj = error instanceof Error ? error : new Error('Batch request failed');
                for (const stateCode of stateCodes) {
                    surveyStore.setSessionError(surveyId, stateCode, errorObj);
                    errors++;
                }
            }
        }
    } else {
        // Mock mode or official-api: use individual calls (existing behavior)
        const promises = stateCodes.map((stateCode) =>
            fetchStateStatute(stateCode, query, surveyId, useMockMode)
        );

        const results = await Promise.allSettled(promises);
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value === true) {
                successes++;
            } else {
                errors++;
            }
        });
    }

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
 * Uses settings.batchSize to determine how many states to process in parallel/batch.
 */
export async function searchAllStates(
    userQuery: string,
    surveyId: number,
    useMockMode: boolean = DEFAULT_MOCK_MODE
): Promise<void> {
    const surveyStore = useSurveyHistoryStore.getState();
    const settingsStore = useSettingsStore.getState();
    const { batchSize } = settingsStore;

    // 1. Check concurrency limit
    const runningCount = surveyStore.surveys.filter(s => s.status === 'running').length;
    if (runningCount > MAX_CONCURRENT_SURVEYS) {
        throw new MaxConcurrentSurveysError();
    }

    // 2. Determine effective batch size
    // For demo queries, force batch size 1 so states appear one by one with smooth animation
    const isDemo = isDemoQuery(userQuery);
    const effectiveBatchSize = isDemo ? 1 : batchSize;

    // 3. Process in chunks based on effective batch size
    let totalSuccesses = 0;
    let totalErrors = 0;

    // Chunk the 50 states according to effective batch size
    const chunks = chunkArray(ALL_STATE_CODES, effectiveBatchSize);

    for (const chunk of chunks) {
        const currentSurvey = useSurveyHistoryStore.getState().surveys.find(s => s.id === surveyId);
        if (currentSurvey?.status === 'cancelled') {
            console.log(`[Orchestrator] Survey #${surveyId} cancelled. Stopping.`);
            return;
        }

        const [successes, errors] = await processChunk(chunk, userQuery, surveyId, useMockMode);
        totalSuccesses += successes;
        totalErrors += errors;

        // Small delay between chunks to prevent overwhelming browser/network if batchSize is small
        // For demo queries, use a randomized delay (100-500ms) to create natural/staggered "pop one by one" animation
        // Average 300ms * 50 states = ~15 seconds total duration
        if (chunks.length > 1) {
            const delay = isDemo
                ? Math.floor(Math.random() * 400) + 100 // 100ms to 500ms
                : INTER_CHUNK_DELAY_MS;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    const finalSurvey = useSurveyHistoryStore.getState().surveys.find(s => s.id === surveyId);
    if (finalSurvey?.status === 'cancelled') return;

    surveyStore.completeSurvey(surveyId, totalSuccesses, totalErrors);
}

// ============================================================
// Single API Call for All 50 States
// ============================================================

interface AllStatesApiResponse {
    success: boolean;
    data?: Record<string, Statute>;
    error?: string;
}

/**
 * Fetch statute data for ALL 50 states in a SINGLE API call.
 * Uses the all-states endpoint which makes ONE LLM call.
 */
async function fetchAllStatesAtOnce(query: string): Promise<Record<string, Statute>> {
    const settings = useSettingsStore.getState();
    const { openaiApiKey, geminiApiKey, openRouterApiKey, activeAiProvider, openaiModel, geminiModel, openRouterModel } = settings;

    // Determine which model to use based on provider
    let aiModel: string;
    let effectiveProvider = activeAiProvider;

    if (settings.dataSource === 'system-api') {
        // FORCE OpenRouter for System API
        effectiveProvider = 'openrouter';
        aiModel = 'openai/gpt-4o-mini';
    } else if (activeAiProvider === 'openrouter') {
        aiModel = openRouterModel;
    } else if (activeAiProvider === 'gemini') {
        aiModel = geminiModel;
    } else {
        aiModel = openaiModel;
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-active-provider': effectiveProvider,
        'x-ai-model': aiModel
    };

    if (openaiApiKey) headers['x-openai-key'] = openaiApiKey;
    if (geminiApiKey) headers['x-gemini-key'] = geminiApiKey;
    if (openRouterApiKey) headers['x-openrouter-key'] = openRouterApiKey;

    const response = await fetch('/api/statute/all-states', {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API failed: ${response.statusText}`);
    }

    const result: AllStatesApiResponse = await response.json();

    if (!result.success || !result.data) {
        throw new Error(result.error || 'API returned no data');
    }

    return result.data;
}
