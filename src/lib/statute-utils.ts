import { StatuteEntry } from '@/lib/store';
import { StateCode } from '@/types/statute';

export type StatuteStatus = 'idle' | 'loading' | 'success' | 'suspicious' | 'error';

/**
 * Centralized logic for determining statute status.
 * Ensures verified/suspicious status is consistent across Map and Detail components.
 * 
 * Logic:
 * - Error -> 'error'
 * - TrustLevel 'verified' -> 'success'
 * - TrustLevel 'suspicious'/'unverified' -> Check confidence
 *    - Confidence >= 70 -> 'success' (Override)
 *    - Confidence < 70 -> 'suspicious'
 */
export function getStatuteStatus(entry: StatuteEntry | undefined | null, isSurveyRunning: boolean = false): StatuteStatus {
    if (!entry) {
        return isSurveyRunning ? 'loading' : 'idle';
    }

    if (entry instanceof Error) {
        return 'error';
    }

    // Check confirmed verified status first
    if (entry.trustLevel === 'verified') {
        return 'success';
    }

    // Handle suspicious/unverified with confidence override
    if (entry.trustLevel === 'suspicious' || entry.trustLevel === 'unverified') {
        // High confidence override
        if (entry.confidenceScore >= 70) {
            return 'success';
        }
        return 'suspicious';
    }

    // Fallback for missing trustLevel (legacy data)
    if (entry.confidenceScore < 70) {
        return 'suspicious';
    }

    return 'success';
}

/**
 * Human readable label for the status
 */
export function getStatusLabel(status: StatuteStatus): string {
    switch (status) {
        case 'success': return 'Verified';
        case 'suspicious': return 'Unverified';
        case 'error': return 'Error';
        case 'loading': return 'Verifying...';
        default: return 'Pending';
    }
}
