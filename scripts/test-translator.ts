/**
 * Test script for the Query Translator
 * Run with: npx ts-node --esm scripts/test-translator.ts
 * Or: npx tsx scripts/test-translator.ts
 */

// Simple inline implementation for testing without module resolution issues
type StateCode = 'NY' | 'LA' | 'TX';

const THESAURUS: Record<string, Record<StateCode, string>> = {
    'statute of limitations': {
        LA: 'liberative prescription',
        NY: 'statute of limitations',
        TX: 'statute of limitations',
    },
};

const STATE_TERMS: Record<StateCode, string> = {
    NY: 'Consolidated Laws',
    LA: 'Louisiana Civil Code',
    TX: 'Texas Statutes',
};

function expandTerm(term: string, stateCode: StateCode): string {
    const lowerTerm = term.toLowerCase();
    const entry = THESAURUS[lowerTerm];
    return entry?.[stateCode] ?? term;
}

function buildSearchQuery(userPrompt: string, stateCode: StateCode): string {
    let query = userPrompt.toLowerCase();

    // Replace "statute of limitations" with state-specific term
    if (query.includes('statute of limitations')) {
        const replacement = expandTerm('statute of limitations', stateCode);
        query = query.replace(/statute of limitations/gi, replacement);
    }

    // Convert to boolean format
    const words = query.split(/\s+/).filter((w) => w.length > 2);
    const booleanQuery = words.join(' /s ');

    return `(${booleanQuery}) AND (${STATE_TERMS[stateCode]})`;
}

// ============================================================
// TEST EXECUTION
// ============================================================

const testPrompt = 'Statute of limitations for fraud';

console.log('='.repeat(60));
console.log('Query Translator Test');
console.log('='.repeat(60));
console.log(`\nInput: "${testPrompt}"\n`);
console.log('-'.repeat(60));

const statesToTest: StateCode[] = ['NY', 'LA', 'TX'];

for (const stateCode of statesToTest) {
    const query = buildSearchQuery(testPrompt, stateCode);
    console.log(`[${stateCode}] ${query}`);
}

console.log('-'.repeat(60));
console.log('\n✓ Test complete!');
