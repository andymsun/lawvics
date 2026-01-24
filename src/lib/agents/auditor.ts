import { z } from 'zod';
import { generateObject, LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Statute as StatuteV2 } from '@/types/statute';

// ============================================================
// Configuration
// ============================================================

/** Default mock mode setting (can be overridden by caller) */
const DEFAULT_MOCK_MODE = true;

// ============================================================
// Verification Types
// ============================================================

export type TrustLevel = 'verified' | 'unverified' | 'suspicious';

export interface VerificationResult {
    trustLevel: TrustLevel;
    isOfficialSource: boolean;
    isRepealed: boolean;
    isHallucinated: boolean;
    message: string;
    verifiedAt: string;
    confidence_reasoning: string;
}

// ============================================================
// LLM Verification Schema
// ============================================================

const LLMVerificationSchema = z.object({
    supports_query: z.boolean().describe('True if the text directly addresses the legal question asked'),
    citation_format_valid: z.boolean().describe('True if citation follows proper legal format for the state'),
    looks_like_legal_text: z.boolean().describe('True if this appears to be genuine legal/statute text'),
    is_potentially_repealed: z.boolean().describe('True if text mentions repealed, superseded, or future effective dates'),
    confidence_reasoning: z.string().describe('1-2 sentences explaining why the text is trustworthy or suspicious'),
});

type LLMVerificationResult = z.infer<typeof LLMVerificationSchema>;

// ============================================================
// Model Factory
// ============================================================

function getVerificationModel(keys: { openai?: string; gemini?: string }, providerPreference?: 'openai' | 'gemini', modelName?: string): LanguageModel {
    if ((providerPreference === 'openai' || !providerPreference) && keys.openai) {
        return createOpenAI({ apiKey: keys.openai })(modelName || 'gpt-4o-mini');
    }
    if ((providerPreference === 'gemini' || !providerPreference) && keys.gemini) {
        return createGoogleGenerativeAI({ apiKey: keys.gemini })(modelName || 'gemini-1.5-flash');
    }
    throw new Error('No API key provided for verification.');
}

// ============================================================
// Verification Functions
// ============================================================

function checkOfficialSource(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.hostname.endsWith('.gov');
    } catch {
        return false;
    }
}

function simulateMockVerification(): LLMVerificationResult {
    const random = Math.random();
    if (random < 0.05) {
        return {
            supports_query: true,
            citation_format_valid: true,
            looks_like_legal_text: true,
            is_potentially_repealed: true,
            confidence_reasoning: '[MOCK] Text contains repeal indicators - flagged for review.',
        };
    } else if (random < 0.10) {
        return {
            supports_query: false,
            citation_format_valid: true,
            looks_like_legal_text: false,
            is_potentially_repealed: false,
            confidence_reasoning: '[MOCK] Text does not appear to be legal statute content.',
        };
    }

    return {
        supports_query: true,
        citation_format_valid: true,
        looks_like_legal_text: true,
        is_potentially_repealed: false,
        confidence_reasoning: '[MOCK] Text appears to be legitimate legal content.',
    };
}

async function verifyWithLLM(
    textSnippet: string,
    citation: string,
    stateCode: string,
    userQuery: string,
    keys: { openai?: string; gemini?: string },
    providerPreference?: 'openai' | 'gemini',
    modelName?: string
): Promise<LLMVerificationResult> {
    const model = getVerificationModel(keys, providerPreference, modelName);

    const { object } = await generateObject({
        model,
        schema: LLMVerificationSchema,
        prompt: `You are a paranoid legal verification assistant.
        User Query: "${userQuery}"
        State: ${stateCode}
        Citation: "${citation}"
        Text: "${textSnippet}"
        
        Rules:
        1. supports_query: TRUE only if directly addresses query.
        2. citation_format_valid: TRUE if valid for ${stateCode}.
        3. looks_like_legal_text: FALSE if error page/ads.
        4. is_potentially_repealed: TRUE if "repealed" or "superseded" mentioned.`,
    });

    return object;
}

// ============================================================
// Internal Verification Logic
// ============================================================

function determineTrustLevel(
    llmResult: LLMVerificationResult,
    isOfficialSource: boolean
): TrustLevel {
    if (llmResult.is_potentially_repealed) return 'suspicious';
    if (!llmResult.looks_like_legal_text) return 'suspicious';
    if (!llmResult.supports_query) return 'suspicious';
    if (!llmResult.citation_format_valid) return 'suspicious';
    return isOfficialSource ? 'verified' : 'unverified';
}

function generateMessage(
    trustLevel: TrustLevel,
    llmResult: LLMVerificationResult,
    isOfficialSource: boolean
): string {
    if (!llmResult.looks_like_legal_text) return 'Content does not appear to be legal statute text';
    if (llmResult.is_potentially_repealed) return 'Statute may be repealed or superseded';
    if (!llmResult.supports_query) return 'Text does not directly address the legal query';
    if (!llmResult.citation_format_valid) return 'Citation format appears incorrect';
    if (!isOfficialSource) return 'Source is not from an official .gov domain';
    return 'Verified: Text supports query from official government source';
}

// ============================================================
// Main Verification Functions
// ============================================================

export async function verifyStatuteCitation(
    citation: string,
    url: string,
    textSnippet: string = '',
    stateCode: string = 'US',
    userQuery: string = '',
    mockMode: boolean = DEFAULT_MOCK_MODE,
    keys: { openai?: string; gemini?: string } = {},
    providerPreference?: 'openai' | 'gemini',
    modelName?: string
): Promise<VerificationResult> {
    const isOfficialSource = checkOfficialSource(url);
    let llmResult: LLMVerificationResult;

    if (mockMode) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100));
        llmResult = simulateMockVerification();
    } else {
        llmResult = await verifyWithLLM(textSnippet, citation, stateCode, userQuery, keys, providerPreference, modelName);
    }

    const trustLevel = determineTrustLevel(llmResult, isOfficialSource);
    const message = generateMessage(trustLevel, llmResult, isOfficialSource);

    return {
        trustLevel,
        isOfficialSource,
        isRepealed: llmResult.is_potentially_repealed,
        isHallucinated: !llmResult.looks_like_legal_text || !llmResult.supports_query,
        message,
        verifiedAt: new Date().toISOString(),
        confidence_reasoning: llmResult.confidence_reasoning,
    };
}

export async function verifyStatuteV2(
    statute: StatuteV2,
    userQuery: string = '',
    mockMode: boolean = DEFAULT_MOCK_MODE,
    keys: { openai?: string; gemini?: string } = {},
    providerPreference?: 'openai' | 'gemini',
    modelName?: string
): Promise<VerificationResult> {
    return verifyStatuteCitation(
        statute.citation,
        statute.sourceUrl,
        statute.textSnippet,
        statute.stateCode,
        userQuery,
        mockMode,
        keys,
        providerPreference,
        modelName
    );
}

// ============================================================
// Legacy Validation (Zod Schema)
// ============================================================

const StatuteSchema = z.object({
    jurisdiction_code: z.string().length(2).regex(/^[A-Z]{2}$/),
    official_citation: z.string().min(3),
    statute_text: z.string().min(10),
    effective_date: z.string().date(),
    source_link: z.string().url(),
    tags: z.array(z.string()),
});

export async function verifyStatute(
    data: unknown
): Promise<{ success: boolean; data?: StatuteV2; error?: string }> {
    const result = StatuteSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data as unknown as StatuteV2 };
    } else {
        return { success: false, error: result.error.message };
    }
}
