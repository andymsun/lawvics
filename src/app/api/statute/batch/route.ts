import { NextRequest, NextResponse } from 'next/server';
import { StateCode, Statute } from '@/types/statute';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { SYSTEM_CONFIG, getSystemConfig } from '@/lib/config';
import { getDemoStatute, normalizeQueryForDemo } from '@/data/demo-statutes';

// All 50 US states in alphabetical order (for staggered demo timing)
const ALL_STATES: StateCode[] = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
    'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Force edge runtime for Cloudflare Pages
export const runtime = 'edge';

// ============================================================
// Debug Logger
// ============================================================

function createDebugLogger(enabled: boolean) {
    return {
        log: (...args: unknown[]) => enabled && console.log('[DEBUG][batch]', ...args),
        error: (...args: unknown[]) => enabled && console.error('[DEBUG][batch]', ...args),
        time: (label: string) => enabled && console.time(`[DEBUG][batch] ${label}`),
        timeEnd: (label: string) => enabled && console.timeEnd(`[DEBUG][batch] ${label}`),
    };
}

// ============================================================
// Types
// ============================================================

interface BatchSearchRequest {
    stateCodes: StateCode[];
    query: string;
}

interface BatchSearchResponse {
    success: boolean;
    data?: Record<string, Statute>;
    error?: string;
}

// ============================================================
// AI Model Factory
// ============================================================

type AiProvider = 'openai' | 'gemini' | 'openrouter';

function getModel(
    keys: { openai?: string; gemini?: string; openrouter?: string },
    providerPreference: AiProvider,
    modelName?: string
) {
    // Trim keys to prevent whitespace issues
    const trimmedKeys = {
        openai: keys.openai?.trim(),
        gemini: keys.gemini?.trim(),
        openrouter: keys.openrouter?.trim(),
    };

    // OpenRouter - uses OpenAI-compatible API with required headers
    if (providerPreference === 'openrouter' && trimmedKeys.openrouter) {
        const provider = createOpenAI({
            apiKey: trimmedKeys.openrouter,
            baseURL: 'https://openrouter.ai/api/v1',
            headers: {
                'HTTP-Referer': 'https://lawvics.com',
                'X-Title': 'Lawvics',
            },
        });
        return provider(modelName || 'openai/gpt-4o-mini');
    }

    if (providerPreference === 'openai' && trimmedKeys.openai) {
        const provider = createOpenAI({ apiKey: trimmedKeys.openai });
        return provider(modelName || 'gpt-4o-mini');
    }
    if (providerPreference === 'gemini' && trimmedKeys.gemini) {
        const provider = createGoogleGenerativeAI({ apiKey: trimmedKeys.gemini });
        return provider(modelName || 'gemini-1.5-flash');
    }

    // Fallback logic
    if (trimmedKeys.openrouter) {
        const provider = createOpenAI({
            apiKey: trimmedKeys.openrouter,
            baseURL: 'https://openrouter.ai/api/v1',
            headers: {
                'HTTP-Referer': 'https://lawvics.com',
                'X-Title': 'Lawvics',
            },
        });
        return provider('openai/gpt-4o-mini');
    }
    if (trimmedKeys.openai) return createOpenAI({ apiKey: trimmedKeys.openai })('gpt-4o-mini');
    if (trimmedKeys.gemini) return createGoogleGenerativeAI({ apiKey: trimmedKeys.gemini })('gemini-1.5-flash');

    throw new Error('No valid API key provided. Please add an OpenAI, Gemini, or OpenRouter API key.');
}

// ============================================================
// Batch Schema - Multiple states in one response
// ============================================================

const BatchStatuteSchema = z.object({
    results: z.array(z.object({
        stateCode: z.string().describe('2-letter state code (e.g., "CA", "NY")'),
        citation: z.string().describe('Legal citation or "None found"'),
        textSnippet: z.string().describe('Relevant statute text'),
        effectiveDate: z.string().describe('Effective date or "Unknown"'),
        confidence: z.number().min(0).max(100).describe('Confidence 0-100'),
    }))
});

// ============================================================
// Batch LLM Processor
// ============================================================

const SYSTEM_PROMPT = `You are a legal research assistant specializing in US state statutory law. You will receive a legal query and a list of US states. For EACH state, provide the relevant statute citation if known.

RULES:
1. Always use the EXACT citation format for each state (e.g., "Cal. Civ. Code § 335.1", "N.Y. Gen. Bus. Law § 349").
2. For limitation periods, include the EXACT years/days and trigger event.
3. If you don't know the exact statute for a state, use "None found" for citation and set confidence to 0.
4. Do NOT hallucinate. Accuracy is critical.
5. Return one result object for EACH state requested.

PRIORITY: Accuracy over completeness.`;

async function processBatch(
    stateCodes: StateCode[],
    query: string,
    keys: { openai?: string; gemini?: string; openrouter?: string },
    activeProvider: AiProvider,
    aiModel?: string
): Promise<Record<string, Statute>> {
    const model = getModel(keys, activeProvider, aiModel);

    const stateList = stateCodes.join(', ');

    // Wrap generateObject in a timeout promise (90s for batch)
    const llmTimeout = 90000;
    const llmResult = await Promise.race([
        generateObject({
            model,
            schema: BatchStatuteSchema,
            system: SYSTEM_PROMPT,
            prompt: `For each of the following US states, find the statute that answers this query:

QUERY: "${query}"

STATES: ${stateList}

Return a result for EACH state listed above. If you don't know the answer for a state, use "None found" with confidence 0.`,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('LLM request timed out after 90 seconds')), llmTimeout))
    ]) as { object: z.infer<typeof BatchStatuteSchema> };

    const { object } = llmResult;

    // Convert array to map
    const resultMap: Record<string, Statute> = {};
    for (const result of object.results) {
        resultMap[result.stateCode] = {
            stateCode: result.stateCode as StateCode,
            citation: result.citation,
            textSnippet: result.textSnippet,
            effectiveDate: result.effectiveDate,
            confidenceScore: result.confidence,
            sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(result.citation + ' ' + result.stateCode + ' law')}`,
        };
    }

    return resultMap;
}

// ============================================================
// API Route Handler
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<BatchSearchResponse>> {
    const debugMode = request.headers.get('x-debug-mode') === 'true' || process.env.DEBUG_MODE === 'true';
    const debug = createDebugLogger(debugMode);

    debug.log('=== BATCH REQUEST START ===');
    debug.time('batch-total');

    try {
        const body: BatchSearchRequest = await request.json();
        const { stateCodes, query } = body;

        debug.log('Request:', { stateCount: stateCodes?.length, query: query?.substring(0, 50) + '...' });

        if (!stateCodes || !Array.isArray(stateCodes) || stateCodes.length === 0 || !query) {
            debug.error('Invalid request body');
            return NextResponse.json({ success: false, error: 'Missing stateCodes array or query' }, { status: 400 });
        }

        // ============================================================
        // DEMO MODE: Check if this is a demo query and return hardcoded data
        // Uses staggered timing to create smooth ~10 second map animation
        // ============================================================
        const demoType = normalizeQueryForDemo(query);
        if (demoType) {
            debug.log('Using DEMO hardcoded data for batch:', query.substring(0, 50));

            const demoResults: Record<string, Statute> = {};

            // Process all states and collect demo data
            const statePromises = stateCodes.map(async (stateCode) => {
                const demoResult = getDemoStatute(stateCode, query);
                if (demoResult) {
                    // Calculate staggered delay based on state position
                    const stateIndex = ALL_STATES.indexOf(stateCode);
                    const baseDelay = stateIndex >= 0 ? Math.floor((stateIndex / 50) * 9000) : 0;
                    const jitter = Math.floor(Math.random() * 400);
                    const totalDelay = baseDelay + jitter + 100;

                    await new Promise(r => setTimeout(r, totalDelay));
                    return { stateCode, statute: demoResult };
                }
                return null;
            });

            // Wait for all states to complete with staggered timing
            const results = await Promise.all(statePromises);

            for (const result of results) {
                if (result) {
                    demoResults[result.stateCode] = result.statute;
                }
            }

            debug.log('Demo results:', { statesReturned: Object.keys(demoResults).length });
            debug.timeEnd('batch-total');
            return NextResponse.json({ success: true, data: demoResults });
        }

        const activeProvider = request.headers.get('x-active-provider') as AiProvider | null;
        const aiModel = request.headers.get('x-ai-model') || undefined;

        // Read from headers, or fall back to environment variables (for system-api mode)
        const openaiApiKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY || undefined;
        const geminiApiKey = request.headers.get('x-gemini-key') || process.env.GOOGLE_GENERATIVE_AI_API_KEY || undefined;

        // IMPORTANT: Prioritize user's key from headers over system config
        const headerOpenRouterKey = request.headers.get('x-openrouter-key');
        const openRouterApiKey = headerOpenRouterKey || SYSTEM_CONFIG.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || undefined;

        // Debug logging for key source
        console.log('[batch] OpenRouter key source:', {
            fromHeader: !!headerOpenRouterKey,
            headerKeyPrefix: headerOpenRouterKey?.substring(0, 10) + '...',
            fromSystemConfig: !!SYSTEM_CONFIG.OPENROUTER_API_KEY,
            fromEnv: !!process.env.OPENROUTER_API_KEY,
            finalKeyPrefix: openRouterApiKey?.substring(0, 10) + '...',
        });

        debug.log('API Keys:', {
            hasOpenAI: !!openaiApiKey,
            hasGemini: !!geminiApiKey,
            hasOpenRouter: !!openRouterApiKey,
            activeProvider,
            aiModel
        });

        // Note: API key validation is handled in getModel() which throws descriptive error if needed

        // Determine provider based on available keys
        const detectedProvider: AiProvider = activeProvider ||
            (openRouterApiKey ? 'openrouter' : openaiApiKey ? 'openai' : 'gemini');

        debug.time('llm-call');
        const results = await processBatch(
            stateCodes,
            query,
            { openai: openaiApiKey, gemini: geminiApiKey, openrouter: openRouterApiKey },
            detectedProvider,
            aiModel
        );
        debug.timeEnd('llm-call');

        debug.log('Results:', { statesReturned: Object.keys(results).length });
        debug.log('=== BATCH REQUEST SUCCESS ===');
        debug.timeEnd('batch-total');

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('[batch] Error:', errorMessage);
        if (debugMode) {
            console.error('[DEBUG][batch] Full error:', error);
        }
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
