import { NextRequest, NextResponse } from 'next/server';
import { StateCode, Statute } from '@/types/statute';

// ============================================================
// Types
// ============================================================

interface SearchRequest {
    stateCode: StateCode;
    query: string;
    useMockMode: boolean;
}

interface SearchResponse {
    success: boolean;
    data?: Statute;
    error?: string;
}

// ============================================================
// State Legislature URLs & Fetcher Registry
// ============================================================

/**
 * Base URLs for state legislature websites.
 * Used as fallback when no official API is available.
 */
const STATE_LEGISLATURE_URLS: Partial<Record<StateCode, string>> = {
    AL: 'https://alison.legislature.state.al.us/',
    AK: 'https://www.akleg.gov/',
    AZ: 'https://www.azleg.gov/',
    AR: 'https://www.arkleg.state.ar.us/',
    CA: 'https://leginfo.legislature.ca.gov/',
    CO: 'https://leg.colorado.gov/',
    CT: 'https://www.cga.ct.gov/',
    DE: 'https://legis.delaware.gov/',
    FL: 'http://www.leg.state.fl.us/',
    GA: 'https://www.legis.ga.gov/',
    HI: 'https://www.capitol.hawaii.gov/',
    ID: 'https://legislature.idaho.gov/',
    IL: 'https://www.ilga.gov/',
    IN: 'https://iga.in.gov/',
    IA: 'https://www.legis.iowa.gov/',
    KS: 'https://www.kslegislature.org/',
    KY: 'https://legislature.ky.gov/',
    LA: 'https://legis.la.gov/',
    ME: 'https://legislature.maine.gov/',
    MD: 'https://mgaleg.maryland.gov/',
    MA: 'https://malegislature.gov/',
    MI: 'https://www.legislature.mi.gov/',
    MN: 'https://www.revisor.mn.gov/',
    MS: 'http://www.legislature.ms.gov/',
    MO: 'https://www.house.mo.gov/',
    MT: 'https://leg.mt.gov/',
    NE: 'https://nebraskalegislature.gov/',
    NV: 'https://www.leg.state.nv.us/',
    NH: 'http://www.gencourt.state.nh.us/',
    NJ: 'https://www.njleg.state.nj.us/',
    NM: 'https://www.nmlegis.gov/',
    NY: 'https://www.nysenate.gov/',
    NC: 'https://www.ncleg.gov/',
    ND: 'https://www.ndlegis.gov/',
    OH: 'https://www.legislature.ohio.gov/',
    OK: 'https://www.oklegislature.gov/',
    OR: 'https://www.oregonlegislature.gov/',
    PA: 'https://www.legis.state.pa.us/',
    RI: 'http://www.rilegislature.gov/',
    SC: 'https://www.scstatehouse.gov/',
    SD: 'https://sdlegislature.gov/',
    TN: 'https://www.capitol.tn.gov/',
    TX: 'https://capitol.texas.gov/',
    UT: 'https://le.utah.gov/',
    VT: 'https://legislature.vermont.gov/',
    VA: 'https://virginiageneralassembly.gov/',
    WA: 'https://leg.wa.gov/',
    WV: 'https://www.wvlegislature.gov/',
    WI: 'https://legis.wisconsin.gov/',
    WY: 'https://www.wyoleg.gov/',
};

/**
 * Type for state-specific fetcher functions.
 * Can be swapped with official APIs like Open States when available.
 */
type StateFetcher = (stateCode: StateCode, query: string) => Promise<Statute>;

/**
 * Registry for state-specific API fetchers.
 * Add official API implementations here to bypass web scraping.
 * 
 * Example:
 * ```ts
 * STATE_API_FETCHERS['NY'] = async (stateCode, query) => {
 *   const response = await fetch(`https://api.openstates.org/v3/...`);
 *   return parseOpenStatesResponse(response);
 * };
 * ```
 */
const STATE_API_FETCHERS: Partial<Record<StateCode, StateFetcher>> = {
    // Add official API implementations here as they become available
};

// ============================================================
// Mock Data Generator
// ============================================================

function generateMockStatute(stateCode: StateCode, query: string): Statute {
    const limitationYears = Math.random() > 0.5 ? 2 : 5;
    return {
        stateCode,
        citation: `${stateCode} Code § ${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 100)}`,
        textSnippet: `The limitation period for ${query} in ${stateCode} is ${limitationYears} years from the date of discovery...`,
        effectiveDate: '2024-01-01',
        confidenceScore: Math.floor(Math.random() * 20) + 80,
        sourceUrl: `https://legislature.${stateCode.toLowerCase()}.gov/statutes`,
    };
}

async function mockFetchStatute(stateCode: StateCode, query: string): Promise<Statute> {
    // Random delay between 500ms-1.5s to simulate network latency
    const delay = Math.random() * 1000 + 500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Simulate 5% failure rate
    if (Math.random() < 0.05) {
        throw new Error(`Connection timeout for ${stateCode}`);
    }

    return generateMockStatute(stateCode, query);
}

// ============================================================
// Real Mode Fetcher (Fetch-based, no Playwright)
// ============================================================

/**
 * Fetch statute data from state legislature website using simple HTTP.
 * This is a placeholder for real scraping - returns enhanced mock data.
 * 
 * For production, you'd integrate with:
 * - Open States API (https://openstates.org/)
 * - State-specific official APIs
 * - A dedicated scraping service
 * 
 * @param stateCode - The 2-letter state code
 * @param query - The legal query to search for
 * @param openaiApiKey - User's OpenAI API key (for future LLM-based content extraction)
 */
async function scrapeStateStatute(stateCode: StateCode, query: string, openaiApiKey: string): Promise<Statute> {
    const baseUrl = STATE_LEGISLATURE_URLS[stateCode];

    if (!baseUrl) {
        throw new Error(`No legislature URL configured for state: ${stateCode}`);
    }

    // For now, return enhanced mock data with the real source URL
    // In the future, this would use fetch() + LLM to extract statute info
    const limitationYears = Math.random() > 0.5 ? 2 : 5;

    // Simulate some network latency for realistic feel
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    return {
        stateCode,
        citation: `${stateCode} Code § ${Math.floor(Math.random() * 1000)}.${Math.floor(Math.random() * 100)}`,
        textSnippet: `[Real Mode Placeholder] The limitation period for ${query} in ${stateCode} is ${limitationYears} years. Source: ${baseUrl}`,
        effectiveDate: new Date().toISOString().split('T')[0],
        confidenceScore: 50, // Lower confidence - placeholder data
        sourceUrl: baseUrl,
    };
}

// ============================================================
// Main Fetcher with Fallback Chain
// ============================================================

/**
 * Fetch statute data for a state using the best available method.
 * 
 * @param stateCode - The 2-letter state code
 * @param query - The legal query to search for
 * @param openaiApiKey - User's OpenAI API key for BYOK (used for LLM verification)
 */
// ============================================================
// Open States API Client
// ============================================================

const STATE_NAMES: Record<StateCode, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
    CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
    HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
    KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
    MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "Newsey",
    NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
    OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
    VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};

async function fetchOpenStates(stateCode: StateCode, query: string, apiKey: string): Promise<Statute> {
    const stateName = STATE_NAMES[stateCode]; // Open States uses full names for jurisdictions often

    // Using the bills endpoint (simplified)
    const url = `https://v3.openstates.org/bills?jurisdiction=${encodeURIComponent(stateName)}&q=${encodeURIComponent(query)}&sort=updated_desc&per_page=1&apikey=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new Error('Invalid Open States API Key');
        }
        throw new Error(`Open States API error: ${response.statusText}`);
    }

    const data = await response.json();
    const bill = data.results?.[0];

    if (!bill) {
        throw new Error(`No statutes found for "${query}" in ${stateName}`);
    }

    return {
        stateCode,
        citation: bill.identifier || 'Unknown Citation',
        textSnippet: bill.title || 'No text available',
        effectiveDate: bill.updated_at || new Date().toISOString(),
        confidenceScore: 95, // High confidence for official data
        sourceUrl: bill.openstates_url || `https://openstates.org/${stateCode.toLowerCase()}/bills`,
    };
}

// ============================================================
// Main Fetcher with Fallback Chain
// ============================================================

/**
 * Fetch statute data using the configured data source.
 */
async function fetchStatute(
    stateCode: StateCode,
    query: string,
    dataSource: string,
    keys: { openai?: string; gemini?: string; openStates?: string }
): Promise<Statute> {

    // 1. Official API (Open States)
    if (dataSource === 'official-api') {
        if (!keys.openStates) {
            throw new Error('Open States API Key is required for this mode.');
        }
        try {
            return await fetchOpenStates(stateCode, query, keys.openStates);
        } catch (error) {
            console.warn(`Open States fetch failed for ${stateCode}:`, error);
            throw error; // Propagate error for UI
        }
    }

    // 2. LLM Scraper (Placeholder / Fetch-based fallback)
    if (dataSource === 'llm-scraper') {
        const apiKey = keys.openai || keys.gemini;
        if (!apiKey) {
            throw new Error('OpenAI or Gemini API Key is required for AI Scraper mode.');
        }
        // Use existing scraper logic (modified to accept generic key)
        return await scrapeStateStatute(stateCode, query, apiKey as string);
    }

    // 3. Fallback / Mock
    return await mockFetchStatute(stateCode, query);
}

// ============================================================
// API Route Handler
// ============================================================

/**
 * Validates an OpenAI/Gemini API key format.
 */
function isValidApiKeyFormat(apiKey: string): boolean {
    return apiKey.length >= 20; // Simplified check
}

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse>> {
    try {
        const body: SearchRequest = await request.json();
        const { stateCode, query } = body;

        // Validate required fields
        if (!stateCode || !query) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: stateCode and query' },
                { status: 400 }
            );
        }

        // Extract headers
        const dataSource = request.headers.get('x-data-source') || 'mock';
        const openaiApiKey = request.headers.get('x-openai-key') || undefined;
        const geminiApiKey = request.headers.get('x-gemini-key') || undefined;
        const openStatesApiKey = request.headers.get('x-openstates-key') || undefined;
        const useMockMode = dataSource === 'mock';

        let statute: Statute;

        if (useMockMode) {
            statute = await mockFetchStatute(stateCode, query);
        } else {
            // Real mode with data source switching
            statute = await fetchStatute(stateCode, query, dataSource, {
                openai: openaiApiKey,
                gemini: geminiApiKey,
                openStates: openStatesApiKey
            });
        }

        return NextResponse.json({
            success: true,
            data: statute,
        });
    } catch (error) {
        // SECURITY: Generic error message to avoid leaking sensitive info
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

        // Only log non-sensitive error info (never log API keys)
        console.error('Statute search error:', errorMessage);

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
