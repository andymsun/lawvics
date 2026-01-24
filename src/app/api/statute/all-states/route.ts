import { NextRequest, NextResponse } from 'next/server';
import { StateCode, Statute } from '@/types/statute';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Force edge runtime for Cloudflare Pages
export const runtime = 'edge';

// ============================================================
// All 50 State Codes
// ============================================================

const ALL_STATES: StateCode[] = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// ============================================================
// Types
// ============================================================

interface AllStatesRequest {
    query: string;
}

interface AllStatesResponse {
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

    if (keys.openai) return createOpenAI({ apiKey: keys.openai })('gpt-4o-mini');
    if (keys.gemini) return createGoogleGenerativeAI({ apiKey: keys.gemini })('gemini-1.5-flash');

    throw new Error('No valid API key provided.');
}

// ============================================================
// Schema for 50-State Response
// ============================================================

const AllStatesSchema = z.object({
    results: z.array(z.object({
        stateCode: z.string().describe('2-letter state code (e.g., "CA", "NY")'),
        citation: z.string().describe('Legal citation (e.g., "Cal. Civ. Code § 335.1") or "Unknown"'),
        textSnippet: z.string().describe('Summary of the statute or "No specific statute found"'),
        effectiveDate: z.string().describe('Effective date or "Unknown"'),
        limitationPeriod: z.string().describe('The limitation period (e.g., "2 years", "5 years") or "Unknown"'),
        confidence: z.number().min(0).max(100).describe('Confidence 0-100'),
    }))
});

// ============================================================
// System Prompt - Query Transformer
// ============================================================

const SYSTEM_PROMPT = `You are a legal research API that transforms user queries into structured statute data for all 50 US states.

YOUR TASK:
1. Take the user's natural language legal query
2. Transform it into a precise legal search concept
3. For EACH of the 50 US states, provide the relevant statute information

QUERY TRANSFORMATION EXAMPLES:
- "statute of limitations for fraud" → Search for civil fraud limitation periods in each state's civil code
- "grand theft auto felony threshold" → Search for vehicle theft dollar thresholds in each state's penal code
- "adverse possession time limits" → Search for real property adverse possession statutes

OUTPUT RULES:
1. Return EXACTLY 50 results, one for each state
2. Use official legal citation format (e.g., "N.Y. C.P.L.R. § 213" not just "NY Law")
3. Include the actual limitation period or threshold value when applicable
4. Set confidence to 0 and use "Unknown" if you're not certain
5. NEVER hallucinate - if unsure, say "Unknown"

PRIORITY: Accuracy over completeness. "Unknown" is better than wrong.`;

// ============================================================
// Process All 50 States
// ============================================================

async function processAllStates(
    query: string,
    keys: { openai?: string; gemini?: string },
    activeProvider: 'openai' | 'gemini',
    aiModel?: string
): Promise<Record<string, Statute>> {
    const model = getModel(keys, activeProvider, aiModel);

    const stateList = ALL_STATES.join(', ');

    const { object } = await generateObject({
        model,
        schema: AllStatesSchema,
        system: SYSTEM_PROMPT,
        prompt: `USER QUERY: "${query}"

Provide statute information for ALL 50 US states: ${stateList}

Return one result object for each state with the relevant statute citation, limitation period, and confidence score.`,
    });

    // Convert array to map
    const resultMap: Record<string, Statute> = {};
    for (const result of object.results) {
        resultMap[result.stateCode] = {
            stateCode: result.stateCode as StateCode,
            citation: result.citation,
            textSnippet: result.textSnippet + (result.limitationPeriod !== 'Unknown' ? ` (${result.limitationPeriod})` : ''),
            effectiveDate: result.effectiveDate,
            confidenceScore: result.confidence,
            sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(result.citation + ' ' + result.stateCode + ' statute')}`,
        };
    }

    // Ensure all 50 states have entries (fill missing with defaults)
    for (const state of ALL_STATES) {
        if (!resultMap[state]) {
            resultMap[state] = {
                stateCode: state,
                citation: 'Unknown',
                textSnippet: 'No result returned from API',
                effectiveDate: 'Unknown',
                confidenceScore: 0,
                sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(query + ' ' + state + ' statute')}`,
            };
        }
    }

    return resultMap;
}

// ============================================================
// API Route Handler
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<AllStatesResponse>> {
    try {
        const body: AllStatesRequest = await request.json();
        const { query } = body;

        if (!query) {
            return NextResponse.json({ success: false, error: 'Missing query' }, { status: 400 });
        }

        const openaiApiKey = request.headers.get('x-openai-key') || undefined;
        const geminiApiKey = request.headers.get('x-gemini-key') || undefined;
        const activeProvider = request.headers.get('x-active-provider') as 'openai' | 'gemini' | null;
        const aiModel = request.headers.get('x-ai-model') || undefined;

        if (!openaiApiKey && !geminiApiKey) {
            return NextResponse.json({ success: false, error: 'No API key provided (OpenAI or Gemini required)' }, { status: 400 });
        }

        const results = await processAllStates(
            query,
            { openai: openaiApiKey, gemini: geminiApiKey },
            activeProvider || (openaiApiKey ? 'openai' : 'gemini'),
            aiModel
        );

        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error('All-states search error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
