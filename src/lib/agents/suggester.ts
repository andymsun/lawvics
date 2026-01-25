
import { StateCode } from '@/types/statute';

/**
 * Enhanced Error class that includes suggestions for alternative searches
 */
export class StatuteErrorWithSuggestions extends Error {
    suggestions: string[];

    constructor(message: string, suggestions: string[]) {
        super(message);
        this.name = 'StatuteErrorWithSuggestions';
        this.suggestions = suggestions;
    }
}

/**
 * Generate alternative search suggestions using a simple heuristic or LLM
 * For MVP, we'll use a deterministic approach + some randomization to simulate AI
 * In a real production app, this would call an LLM API.
 */
export async function generateStatuteSuggestions(
    originalQuery: string,
    stateCode: StateCode,
    errorContext: string
): Promise<string[]> {
    // 1. Simulate AI Latency
    await new Promise(resolve => setTimeout(resolve, 600));

    const suggestions: string[] = [];

    // 2. Base suggestions on the query
    const keywords = originalQuery.split(' ').filter(w => w.length > 3);

    if (keywords.length > 0) {
        suggestions.push(`${originalQuery} statute of limitations`);
        suggestions.push(`${keywords[0]} civil penalty`);
    } else {
        suggestions.push('Fraud statute of limitations');
        suggestions.push('Negligence time limit');
    }

    // 3. Add a state-specific suggestion
    suggestions.push(`${stateCode} ${originalQuery} laws`);

    return suggestions.slice(0, 3);
}
