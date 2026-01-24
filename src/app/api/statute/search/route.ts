import { NextRequest, NextResponse } from 'next/server';
import { StateCode, Statute } from '@/types/statute';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import * as cheerio from 'cheerio';

// Force edge runtime for Cloudflare Pages
export const runtime = 'edge';

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
// State Legislature URLs
// ============================================================

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

    // Fallback logic
    if (keys.openai) return createOpenAI({ apiKey: keys.openai })('gpt-4o-mini');
    if (keys.gemini) return createGoogleGenerativeAI({ apiKey: keys.gemini })('gemini-1.5-flash');

    throw new Error('No valid API key provided for LLM Scraper mode.');
}

// ============================================================
// Scraper Implementation
// ============================================================

const ScraperSchema = z.object({
    citation: z.string().describe('The legal citation (e.g., "CA Penal Code § 123")'),
    textSnippet: z.string().describe('The relevant snippet of the statute text'),
    effectiveDate: z.string().describe('The effective date if found, otherwise "Unknown"'),
    confidence: z.number().min(0).max(100).describe('Confidence score from 0-100'),
});

async function scrapeStateStatute(
    stateCode: StateCode,
    query: string,
    keys: { openai?: string; gemini?: string },
    activeProvider: 'openai' | 'gemini' = 'openai',
    aiModel?: string,
    scrapingApiKey?: string
): Promise<Statute> {
    const baseUrl = STATE_LEGISLATURE_URLS[stateCode];
    if (!baseUrl) throw new Error(`No URL for ${stateCode}`);

    // Proxy Logic (ZenRows / ScrapingBee compatible)
    let targetUrl = baseUrl;
    let headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    if (scrapingApiKey && scrapingApiKey.length > 5) {
        // Assume ZenRows format for now as default, or simple proxy param
        // Example: https://api.zenrows.com/v1/?apikey=KEY&url=URL
        targetUrl = `https://api.zenrows.com/v1/?apikey=${scrapingApiKey}&url=${encodeURIComponent(baseUrl)}`;
        // Clear headers for proxy if needed, or keep them. ZenRows handles UA.
        headers = {};
    }

    // Retry logic with exponential backoff
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            // 1. Fetch the page content
            const res = await fetch(targetUrl, {
                headers
            });

            // Handle rate limiting (429) and server errors (5xx)
            if (res.status === 429 || res.status >= 500) {
                const retryAfter = res.headers.get('Retry-After');
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
                console.log(`[Scraper] ${stateCode} got ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            if (res.status === 404) {
                throw new Error(`404: Resource not found for ${stateCode}`);
            }

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const html = await res.text();
            const $ = cheerio.load(html);

            // 2. Clean text (remove scripts, styles, etc.)
            $('script, style, nav, footer').remove();
            const cleanText = $('body').text().replace(/\s+/g, ' ').substring(0, 15000);

            // 3. LLM Extraction
            const model = getModel(keys, activeProvider, aiModel);
            const { object } = await generateObject({
                model,
                schema: ScraperSchema,
                prompt: `Extract statute information for the query "${query}" from the following text from ${stateCode}'s legislature website:
            
            TEXT:
            "${cleanText}"
            
            If no specific statute is found, return the best match or state "None found" in citation.`,
            });

            return {
                stateCode,
                citation: object.citation,
                textSnippet: object.textSnippet,
                effectiveDate: object.effectiveDate,
                confidenceScore: object.confidence,
                sourceUrl: baseUrl,
            };
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`[Scraper] Attempt ${attempt + 1} failed for ${stateCode}:`, error);

            // Wait before retry (exponential backoff)
            if (attempt < MAX_RETRIES - 1) {
                await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
            }
        }
    }

    throw lastError || new Error(`Failed to scrape ${stateCode} after ${MAX_RETRIES} attempts`);
}

// ============================================================
// Open States Client
// ============================================================

async function fetchOpenStates(stateCode: StateCode, query: string, apiKey: string): Promise<Statute> {
    const url = `https://v3.openstates.org/bills?jurisdiction=${stateCode}&q=${encodeURIComponent(query)}&sort=updated_desc&per_page=1&apikey=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) throw new Error('Invalid Open States API Key');
        throw new Error(`Open States API error: ${res.statusText}`);
    }

    const data = await res.json();
    const bill = data.results?.[0];

    if (!bill) throw new Error(`No statutes found for "${query}" in ${stateCode} via Open States`);

    return {
        stateCode,
        citation: bill.identifier || 'Unknown Citation',
        textSnippet: bill.title || 'No text available',
        effectiveDate: bill.updated_at || new Date().toISOString(),
        confidenceScore: 95,
        sourceUrl: bill.openstates_url || `https://openstates.org/jurisdictions/${stateCode.toLowerCase()}`,
    };
}

// ============================================================
// LegiScan Client
// ============================================================

async function fetchLegiScan(stateCode: StateCode, query: string, apiKey: string): Promise<Statute> {
    // LegiScan Search: https://api.legiscan.com/?key=KEY&op=getSearch&state=STATE&query=QUERY
    const url = `https://api.legiscan.com/?key=${apiKey}&op=getSearch&state=${stateCode}&query=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'ERROR') {
        throw new Error(`LegiScan API error: ${data.alert?.message || 'Unknown error'}`);
    }

    // Default to first result
    const result = data.searchresult?.[0]; // LegiScan returns array in 'searchresult' (check specific shape)
    // Note: LegiScan structure is { status: "OK", searchresult: { "0": {...}, "1": {...}, summary: {...} } }
    // We need to handle this quirky array-like object.

    // Safer extraction:
    const firstKey = Object.keys(data.searchresult || {}).find(k => k !== 'summary' && !isNaN(Number(k)));
    const doc = firstKey ? data.searchresult[firstKey] : null;

    if (!doc) throw new Error(`No statutes found for "${query}" in ${stateCode} via LegiScan`);

    // Fetch full text link if needed? LegiScan search gives text_url usually.
    return {
        stateCode,
        citation: doc.bill_number || 'Unknown Citation',
        textSnippet: doc.title || 'No text available', // LegiScan search snippet is limited
        effectiveDate: doc.last_action_date || new Date().toISOString(),
        confidenceScore: doc.relevance || 90,
        sourceUrl: doc.url || `https://legiscan.com/${stateCode}/bill/${doc.bill_number}`,
    };
}

// ============================================================
// API Route Handler
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse>> {
    try {
        const body: SearchRequest = await request.json();
        const { stateCode, query } = body;

        if (!stateCode || !query) {
            return NextResponse.json({ success: false, error: 'Missing stateCode or query' }, { status: 400 });
        }

        const dataSource = request.headers.get('x-data-source') || 'mock';
        const openaiApiKey = request.headers.get('x-openai-key') || undefined;
        const geminiApiKey = request.headers.get('x-gemini-key') || undefined;
        const openStatesApiKey = request.headers.get('x-openstates-key') || undefined;
        const legiscanApiKey = request.headers.get('x-legiscan-key') || undefined;
        const scrapingApiKey = request.headers.get('x-scraping-key') || undefined;
        const activeProvider = request.headers.get('x-active-provider') as 'openai' | 'gemini' | null;
        const aiModel = request.headers.get('x-ai-model') || undefined;

        if (dataSource === 'mock') {
            // Simplified mock delay
            await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
            const limitationYears = Math.random() > 0.5 ? 2 : 5;
            return NextResponse.json({
                success: true,
                data: {
                    stateCode,
                    citation: `${stateCode} Code § ${Math.floor(Math.random() * 1000)}`,
                    textSnippet: `[MOCK] The limitation period for ${query} is ${limitationYears} years.`,
                    effectiveDate: '2024-01-01',
                    confidenceScore: 85,
                    sourceUrl: STATE_LEGISLATURE_URLS[stateCode] || 'https://example.gov',
                }
            });
        }

        let statute: Statute;

        if (dataSource === 'official-api') {
            if (openStatesApiKey) {
                statute = await fetchOpenStates(stateCode, query, openStatesApiKey);
            } else if (legiscanApiKey) {
                statute = await fetchLegiScan(stateCode, query, legiscanApiKey);
            } else {
                throw new Error('Official API mode requires Open States OR LegiScan API Key');
            }
        } else if (dataSource === 'llm-scraper') {
            statute = await scrapeStateStatute(
                stateCode,
                query,
                { openai: openaiApiKey, gemini: geminiApiKey },
                activeProvider || (openaiApiKey ? 'openai' : 'gemini'),
                aiModel,
                undefined // No proxy for llm-scraper
            );
        } else if (dataSource === 'scraping-proxy') {
            if (!scrapingApiKey) throw new Error('Scraping Proxy mode requires a ZenRows or ScrapingBee API Key');
            statute = await scrapeStateStatute(
                stateCode,
                query,
                { openai: openaiApiKey, gemini: geminiApiKey },
                activeProvider || (openaiApiKey ? 'openai' : 'gemini'),
                aiModel,
                scrapingApiKey
            );
        } else {
            throw new Error(`Unsupported data source: ${dataSource}`);
        }

        return NextResponse.json({ success: true, data: statute });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}

