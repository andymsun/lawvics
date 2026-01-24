import { StateCode } from '@/types/statute';
import { US_STATES, getStateByCode } from '@/lib/constants/states';

/**
 * Common legal term mappings for thesaurus expansion
 */
const THESAURUS: Record<string, Record<StateCode, string>> = {
    'statute of limitations': {
        // Louisiana uses Civil Law terminology
        LA: 'liberative prescription',
        // All other states use common law terminology
        AL: 'statute of limitations', AK: 'statute of limitations', AZ: 'statute of limitations',
        AR: 'statute of limitations', CA: 'statute of limitations', CO: 'statute of limitations',
        CT: 'statute of limitations', DE: 'statute of limitations', FL: 'statute of limitations',
        GA: 'statute of limitations', HI: 'statute of limitations', ID: 'statute of limitations',
        IL: 'statute of limitations', IN: 'statute of limitations', IA: 'statute of limitations',
        KS: 'statute of limitations', KY: 'statute of limitations', ME: 'statute of limitations',
        MD: 'statute of limitations', MA: 'statute of limitations', MI: 'statute of limitations',
        MN: 'statute of limitations', MS: 'statute of limitations', MO: 'statute of limitations',
        MT: 'statute of limitations', NE: 'statute of limitations', NV: 'statute of limitations',
        NH: 'statute of limitations', NJ: 'statute of limitations', NM: 'statute of limitations',
        NY: 'statute of limitations', NC: 'statute of limitations', ND: 'statute of limitations',
        OH: 'statute of limitations', OK: 'statute of limitations', OR: 'statute of limitations',
        PA: 'statute of limitations', RI: 'statute of limitations', SC: 'statute of limitations',
        SD: 'statute of limitations', TN: 'statute of limitations', TX: 'statute of limitations',
        UT: 'statute of limitations', VT: 'statute of limitations', VA: 'statute of limitations',
        WA: 'statute of limitations', WV: 'statute of limitations', WI: 'statute of limitations',
        WY: 'statute of limitations',
    },
    'limitation': {
        LA: 'prescription',
        AL: 'limitation', AK: 'limitation', AZ: 'limitation', AR: 'limitation', CA: 'limitation',
        CO: 'limitation', CT: 'limitation', DE: 'limitation', FL: 'limitation', GA: 'limitation',
        HI: 'limitation', ID: 'limitation', IL: 'limitation', IN: 'limitation', IA: 'limitation',
        KS: 'limitation', KY: 'limitation', ME: 'limitation', MD: 'limitation', MA: 'limitation',
        MI: 'limitation', MN: 'limitation', MS: 'limitation', MO: 'limitation', MT: 'limitation',
        NE: 'limitation', NV: 'limitation', NH: 'limitation', NJ: 'limitation', NM: 'limitation',
        NY: 'limitation', NC: 'limitation', ND: 'limitation', OH: 'limitation', OK: 'limitation',
        OR: 'limitation', PA: 'limitation', RI: 'limitation', SC: 'limitation', SD: 'limitation',
        TN: 'limitation', TX: 'limitation', UT: 'limitation', VT: 'limitation', VA: 'limitation',
        WA: 'limitation', WV: 'limitation', WI: 'limitation', WY: 'limitation',
    },
};

/**
 * Expand a term using the thesaurus for a specific state
 */
function expandTerm(term: string, stateCode: StateCode): string {
    const lowerTerm = term.toLowerCase();
    const thesaurusEntry = THESAURUS[lowerTerm];
    if (thesaurusEntry && thesaurusEntry[stateCode]) {
        return thesaurusEntry[stateCode];
    }
    return term;
}

/**
 * Build a boolean search query for a specific state
 */
function buildSearchQuery(userPrompt: string, stateCode: StateCode): string {
    const state = getStateByCode(stateCode);
    let query = userPrompt.toLowerCase();

    // Replace "statute of limitations" with state-specific term
    if (query.includes('statute of limitations')) {
        const replacement = expandTerm('statute of limitations', stateCode);
        query = query.replace(/statute of limitations/gi, replacement);
    }

    // Replace standalone "limitation" with state-specific term
    if (query.includes('limitation') && !query.includes('prescription')) {
        const replacement = expandTerm('limitation', stateCode);
        query = query.replace(/\blimitation\b/gi, replacement);
    }

    // Convert natural language to boolean search format
    // "fraud limitation" -> "fraud /s limitation"
    const words = query.split(/\s+/).filter((w) => w.length > 2);
    const booleanQuery = words.join(' /s ');

    // Add state-specific code context if available
    if (state && state.terms.length > 0) {
        return `(${booleanQuery}) AND (${state.terms[0]})`;
    }

    return booleanQuery;
}

/**
 * Generate 50 state-specific search queries from a user prompt
 * 
 * @param userPrompt - Natural language legal query (e.g., "Statute of limitations for fraud")
 * @returns Promise resolving to a Record mapping StateCode to search string
 */
export async function generateStateQueries(
    userPrompt: string
): Promise<Record<StateCode, string>> {
    const queries: Partial<Record<StateCode, string>> = {};

    for (const state of US_STATES) {
        queries[state.code] = buildSearchQuery(userPrompt, state.code);
    }

    return queries as Record<StateCode, string>;
}

/**
 * Synchronous version for testing
 */
export function generateStateQueriesSync(
    userPrompt: string
): Record<StateCode, string> {
    const queries: Partial<Record<StateCode, string>> = {};

    for (const state of US_STATES) {
        queries[state.code] = buildSearchQuery(userPrompt, state.code);
    }

    return queries as Record<StateCode, string>;
}
