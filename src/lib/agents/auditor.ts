import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Statute } from '@/types/legal';
import { Statute as StatuteV2 } from '@/types/statute';

// ============================================================
// Configuration
// ============================================================

/** Default mock mode setting (can be overridden by caller) */
const DEFAULT_MOCK_MODE = true;

/** OpenAI model for verification */
const VERIFICATION_MODEL = 'gpt-4o-mini';

// ============================================================
// Verification Types
// ============================================================

export type TrustLevel = 'verified' | 'unverified' | 'suspicious';

export interface VerificationResult {
    /** Trust level of the statute */
    trustLevel: TrustLevel;
    /** Whether the source URL is from a .gov domain */
    isOfficialSource: boolean;
    /** Whether the statute appears to be repealed */
    isRepealed: boolean;
    /** Whether hallucination was detected */
    isHallucinated: boolean;
    /** Human-readable status message */
    message: string;
    /** Timestamp of verification */
    verifiedAt: string;
    /** LLM's reasoning for the confidence/trust level */
    confidence_reasoning: string;
}

// ============================================================
// LLM Verification Schema
// ============================================================

/**
 * Schema for structured LLM verification output.
 * The LLM must provide boolean checks and reasoning.
 */
const LLMVerificationSchema = z.object({
    /** Does the statute text actually answer/support the user's original query? */
    supports_query: z.boolean().describe('True if the text directly addresses the legal question asked'),

    /** Is the citation format correct for this jurisdiction? */
    citation_format_valid: z.boolean().describe('True if citation follows proper legal format for the state'),

    /** Does this look like real legal statute text (not 404, ads, error pages)? */
    looks_like_legal_text: z.boolean().describe('True if this appears to be genuine legal/statute text'),

    /** Are there any indicators the statute has been repealed or superseded? */
    is_potentially_repealed: z.boolean().describe('True if text mentions repealed, superseded, or future effective dates'),

    /** Detailed reasoning explaining the verification decision */
    confidence_reasoning: z.string().describe('1-2 sentences explaining why the text is trustworthy or suspicious'),
});

type LLMVerificationResult = z.infer<typeof LLMVerificationSchema>;

// ============================================================
// Verification Functions
// ============================================================

/**
 * Check if a URL is from an official government source
 */
function checkOfficialSource(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.hostname.endsWith('.gov');
    } catch {
        return false;
    }
}

/**
 * Simulate verification for mock mode (no LLM call, saves tokens)
 */
function simulateMockVerification(): LLMVerificationResult {
    // 10% chance of being flagged as suspicious
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
        confidence_reasoning: '[MOCK] Text appears to be legitimate legal content from verified source.',
    };
}

/**
 * Verify statute text using LLM (Vercel AI SDK)
 * 
 * This is the "paranoid" verification - if anything is ambiguous,
 * we flag it as suspicious rather than trusting it.
 */
async function verifyWithLLM(
    textSnippet: string,
    citation: string,
    stateCode: string,
    userQuery: string
): Promise<LLMVerificationResult> {
    const { object } = await generateObject({
        model: openai(VERIFICATION_MODEL),
        schema: LLMVerificationSchema,
        prompt: `You are a paranoid legal verification assistant. Your job is to be SKEPTICAL and flag anything suspicious.

CONTEXT:
- User's original legal query: "${userQuery}"
- State/Jurisdiction: ${stateCode}
- Citation provided: "${citation}"

TEXT TO VERIFY:
"""
${textSnippet}
"""

VERIFICATION RULES:
1. supports_query: Only TRUE if the text DIRECTLY addresses the legal question. Tangential or vague references = FALSE.
2. citation_format_valid: Check if "${citation}" follows proper Bluebook or state-specific citation format.
3. looks_like_legal_text: FALSE if this looks like a 404 page, advertisement, navigation menu, or gibberish.
4. is_potentially_repealed: TRUE if you see words like "repealed", "superseded", "effective [future date]", or amendments.

BE PARANOID: When in doubt, flag as suspicious. False positives are better than missing bad data.

Provide your verification results:`,
    });

    return object;
}

/**
 * Determine trust level based on LLM verification checks
 * 
 * PARANOID LOGIC:
 * - If any check fails → 'suspicious'
 * - If not official source → 'unverified' 
 * - Only if ALL checks pass AND official source → 'verified'
 */
function determineTrustLevel(
    llmResult: LLMVerificationResult,
    isOfficialSource: boolean
): TrustLevel {
    // Any failure = suspicious (paranoid approach)
    if (llmResult.is_potentially_repealed) {
        return 'suspicious';
    }
    if (!llmResult.looks_like_legal_text) {
        return 'suspicious';
    }
    if (!llmResult.supports_query) {
        return 'suspicious';
    }
    if (!llmResult.citation_format_valid) {
        return 'suspicious';
    }

    // All checks passed, but source matters
    if (!isOfficialSource) {
        return 'unverified';
    }

    return 'verified';
}

/**
 * Generate human-readable verification message
 */
function generateMessage(
    trustLevel: TrustLevel,
    llmResult: LLMVerificationResult,
    isOfficialSource: boolean
): string {
    if (!llmResult.looks_like_legal_text) {
        return 'Content does not appear to be legal statute text - possible hallucination or error page';
    }
    if (llmResult.is_potentially_repealed) {
        return 'Statute may be repealed or superseded - requires manual verification';
    }
    if (!llmResult.supports_query) {
        return 'Retrieved text does not directly address the legal query';
    }
    if (!llmResult.citation_format_valid) {
        return 'Citation format appears incorrect for this jurisdiction';
    }
    if (!isOfficialSource) {
        return 'Source is not from an official .gov domain';
    }
    return 'Verified: Text supports query from official government source';
}

// ============================================================
// Main Verification Functions
// ============================================================

/**
 * Verify a statute citation and URL
 * 
 * This function performs verification checks on a statute:
 * 1. Checks if URL is from .gov domain
 * 2. Uses LLM to verify content quality (or mocks if mockMode=true)
 * 3. Determines trust level based on paranoid logic
 * 
 * @param citation - The legal citation string
 * @param url - The source URL
 * @param textSnippet - The statute text content to verify
 * @param stateCode - The 2-letter state code
 * @param userQuery - The original user query (for relevance check)
 * @param mockMode - If true, skip LLM call to save tokens (default: true)
 * @returns VerificationResult with trust level and reasoning
 */
export async function verifyStatuteCitation(
    citation: string,
    url: string,
    textSnippet: string = '',
    stateCode: string = 'US',
    userQuery: string = '',
    mockMode: boolean = DEFAULT_MOCK_MODE
): Promise<VerificationResult> {
    const isOfficialSource = checkOfficialSource(url);

    let llmResult: LLMVerificationResult;

    if (mockMode) {
        // Mock mode: Skip LLM to save tokens
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100));
        llmResult = simulateMockVerification();
    } else {
        // Real mode: Use LLM for verification
        llmResult = await verifyWithLLM(textSnippet, citation, stateCode, userQuery);
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

/**
 * Verify a Statute V2 object
 * 
 * @param statute - The statute to verify
 * @param userQuery - The original user query
 * @param mockMode - If true, skip LLM call
 */
export async function verifyStatuteV2(
    statute: StatuteV2,
    userQuery: string = '',
    mockMode: boolean = DEFAULT_MOCK_MODE
): Promise<VerificationResult> {
    return verifyStatuteCitation(
        statute.citation,
        statute.sourceUrl,
        statute.textSnippet,
        statute.stateCode,
        userQuery,
        mockMode
    );
}

// ============================================================
// Legacy Validation (Zod Schema)
// ============================================================

const VerificationMetadataSchema = z.object({
    is_link_valid: z.boolean(),
    citation_verified_on_page: z.boolean(),
    repeal_check_passed: z.boolean(),
    last_checked: z.string().datetime(),
});

const StatuteSchema = z.object({
    jurisdiction_code: z.string().length(2).regex(/^[A-Z]{2}$/),
    official_citation: z.string().min(3),
    statute_text: z.string().min(10),
    effective_date: z.string().date(),
    source_link: z.string().url(),
    tags: z.array(z.string()),
    verification_status: VerificationMetadataSchema.optional(),
});

export type ValidatedStatute = z.infer<typeof StatuteSchema>;

export async function verifyStatute(
    data: unknown
): Promise<{ success: boolean; data?: Statute; error?: string }> {
    const result = StatuteSchema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data as Statute };
    } else {
        return { success: false, error: result.error.message };
    }
}
