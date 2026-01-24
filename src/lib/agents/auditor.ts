import { z } from 'zod';
import { Statute } from '@/types/legal';
import { Statute as StatuteV2 } from '@/types/statute';

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
}

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
 * Simulate hallucination/repeal detection (mocked for now)
 * In production, this would scrape the page and verify content
 */
function simulateContentVerification(): { isRepealed: boolean; isHallucinated: boolean } {
    // 10% chance of being flagged as repealed or hallucinated
    const random = Math.random();
    if (random < 0.05) {
        return { isRepealed: true, isHallucinated: false };
    } else if (random < 0.10) {
        return { isRepealed: false, isHallucinated: true };
    }
    return { isRepealed: false, isHallucinated: false };
}

/**
 * Determine trust level based on verification checks
 */
function determineTrustLevel(
    isOfficialSource: boolean,
    isRepealed: boolean,
    isHallucinated: boolean
): TrustLevel {
    if (isRepealed || isHallucinated) {
        return 'suspicious';
    }
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
    isOfficialSource: boolean,
    isRepealed: boolean,
    isHallucinated: boolean
): string {
    if (isHallucinated) {
        return 'Citation not found on source page - possible hallucination';
    }
    if (isRepealed) {
        return 'Statute appears to be repealed or superseded';
    }
    if (!isOfficialSource) {
        return 'Source is not from an official .gov domain';
    }
    return 'Verified from official government source';
}

/**
 * Verify a statute citation and URL (NEW API for Statute V2)
 * 
 * This function performs verification checks on a statute:
 * 1. Checks if URL is from .gov domain
 * 2. Simulates hallucination detection
 * 3. Simulates repeal detection
 * 
 * @param citation - The legal citation string
 * @param url - The source URL
 * @returns VerificationResult with trust level and details
 */
export async function verifyStatuteCitation(
    citation: string,
    url: string
): Promise<VerificationResult> {
    // Simulate network delay (100-300ms)
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100));

    const isOfficialSource = checkOfficialSource(url);
    const { isRepealed, isHallucinated } = simulateContentVerification();
    const trustLevel = determineTrustLevel(isOfficialSource, isRepealed, isHallucinated);
    const message = generateMessage(trustLevel, isOfficialSource, isRepealed, isHallucinated);

    return {
        trustLevel,
        isOfficialSource,
        isRepealed,
        isHallucinated,
        message,
        verifiedAt: new Date().toISOString(),
    };
}

/**
 * Verify a Statute V2 object
 */
export async function verifyStatuteV2(
    statute: StatuteV2
): Promise<VerificationResult> {
    return verifyStatuteCitation(statute.citation, statute.sourceUrl);
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
