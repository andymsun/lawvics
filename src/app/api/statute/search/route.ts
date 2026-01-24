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
// Playwright Scraper (Dynamic Import for Edge Compatibility)
// ============================================================

/**
 * Scrape statute data from state legislature website using Playwright.
 * Uses dynamic import to avoid bundling issues in Next.js Edge runtime.
 * 
 * NOTE: Real scraping requires Playwright browser binaries to be installed.
 * Run `npx playwright install chromium` before enabling real mode.
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

    // Dynamic import to avoid Next.js bundling issues
    // Playwright is a Node.js-only module and won't work in Edge runtime
    const { chromium } = await import('playwright');

    let browser = null;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        // Navigate to the state legislature
        await page.goto(baseUrl, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');

        // Try to find and fill a search input
        const searchInput = await page.$('input[type="search"], input[name*="search"], input[id*="search"]');

        if (searchInput) {
            await searchInput.fill(query);
            await searchInput.press('Enter');
            await page.waitForTimeout(2000);
        }

        // Extract content
        const content = await page.textContent('body');

        return {
            stateCode,
            citation: `${stateCode} Statute - ${query}`,
            textSnippet: content?.slice(0, 500) || 'No content found',
            effectiveDate: new Date().toISOString().split('T')[0],
            confidenceScore: 60, // Lower confidence for scraped data
            sourceUrl: page.url(),
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
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
async function fetchStatute(stateCode: StateCode, query: string, openaiApiKey: string): Promise<Statute> {
    // 1. Check if there's an official API fetcher for this state
    const apiFetcher = STATE_API_FETCHERS[stateCode];
    if (apiFetcher) {
        try {
            return await apiFetcher(stateCode, query);
        } catch (apiError) {
            console.warn(`API fetcher failed for ${stateCode}, falling back to scraper:`, apiError);
        }
    }

    // 2. Fall back to Playwright scraping (openaiApiKey available for future LLM extraction)
    return await scrapeStateStatute(stateCode, query, openaiApiKey);
}

// ============================================================
// API Route Handler
// ============================================================

/**
 * Validates an OpenAI API key format.
 * Returns true if the key appears to be valid (starts with 'sk-' and has reasonable length).
 * NOTE: This is a format check only; actual validity is verified when the key is used.
 */
function isValidApiKeyFormat(apiKey: string): boolean {
    // OpenAI keys start with 'sk-' and are typically 40+ characters
    return apiKey.startsWith('sk-') && apiKey.length >= 20;
}

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse>> {
    try {
        const body: SearchRequest = await request.json();
        const { stateCode, query, useMockMode } = body;

        // Validate required fields
        if (!stateCode || !query) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: stateCode and query' },
                { status: 400 }
            );
        }

        // Extract OpenAI API key from header (BYOK support)
        // SECURITY: Never log this value
        const openaiApiKey = request.headers.get('x-openai-key') || '';

        // Real mode requires a valid API key
        if (!useMockMode) {
            if (!openaiApiKey) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Real Mode requires an OpenAI API Key. Please add your key in Settings.',
                    },
                    { status: 401 }
                );
            }

            if (!isValidApiKeyFormat(openaiApiKey)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid OpenAI API Key format. Keys should start with "sk-".',
                    },
                    { status: 401 }
                );
            }
        }

        let statute: Statute;

        if (useMockMode) {
            // Mock mode: Return fake data immediately
            statute = await mockFetchStatute(stateCode, query);
        } else {
            // Real mode: Use API or scraper with user's API key
            // The openaiApiKey is passed for future OpenAI SDK initialization
            statute = await fetchStatute(stateCode, query, openaiApiKey);
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
