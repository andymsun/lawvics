import { NextRequest, NextResponse } from 'next/server';
import { StateCode, Statute } from '@/types/statute';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Force edge runtime for Cloudflare Pages
export const runtime = 'edge';

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

function getModel(keys: { openai?: string; gemini?: string }, providerPreference: 'openai' | 'gemini', modelName?: string) {
    if (providerPreference === 'openai' && keys.openai) {
        const provider = createOpenAI({ apiKey: keys.openai });
        return provider(modelName || 'gpt-4o-mini');
    }
    if (providerPreference === 'gemini' && keys.gemini) {
        const provider = createGoogleGenerativeAI({ apiKey: keys.gemini });
        return provider(modelName || 'gemini-1.5-flash');
    }

    // Fallback logic
    if (keys.openai) return createOpenAI({ apiKey: keys.openai })('gpt-4o-mini');
    if (keys.gemini) return createGoogleGenerativeAI({ apiKey: keys.gemini })('gemini-1.5-flash');

    throw new Error('No valid API key provided for LLM Scraper mode.');
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
    keys: { openai?: string; gemini?: string },
    activeProvider: 'openai' | 'gemini',
    aiModel?: string
): Promise<Record<string, Statute>> {
    const model = getModel(keys, activeProvider, aiModel);

    const stateList = stateCodes.join(', ');

    const { object } = await generateObject({
        model,
        schema: BatchStatuteSchema,
        system: SYSTEM_PROMPT,
        prompt: `For each of the following US states, find the statute that answers this query:

QUERY: "${query}"

STATES: ${stateList}

Return a result for EACH state listed above. If you don't know the answer for a state, use "None found" with confidence 0.`,
    });

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
    try {
        const body: BatchSearchRequest = await request.json();
        const { stateCodes, query } = body;

        if (!stateCodes || !Array.isArray(stateCodes) || stateCodes.length === 0 || !query) {
            return NextResponse.json({ success: false, error: 'Missing stateCodes array or query' }, { status: 400 });
        }

        const openaiApiKey = request.headers.get('x-openai-key') || undefined;
        const geminiApiKey = request.headers.get('x-gemini-key') || undefined;
        const activeProvider = request.headers.get('x-active-provider') as 'openai' | 'gemini' | null;
        const aiModel = request.headers.get('x-ai-model') || undefined;

        if (!openaiApiKey && !geminiApiKey) {
            return NextResponse.json({ success: false, error: 'No API key provided (OpenAI or Gemini required)' }, { status: 400 });
        }

        const results = await processBatch(
            stateCodes,
            query,
            { openai: openaiApiKey, gemini: geminiApiKey },
            activeProvider || (openaiApiKey ? 'openai' : 'gemini'),
            aiModel
        );

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error('Batch search error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
