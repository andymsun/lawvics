import { NextRequest, NextResponse } from 'next/server';
import { StateCode, Statute } from '@/types/statute';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { SYSTEM_CONFIG, getSystemConfig } from '@/lib/config';
// import * as cheerio from 'cheerio'; // Removed for now to fix unused warning. If needed later, uncomment and use correctly with Edge compat.
// import { PlaywrightCrawler } from 'crawlee'; // Removed for Edge compatibility

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getDemoStatute } from '@/data/demo-statutes';

// Force edge runtime for Cloudflare Pages
export const runtime = 'edge';

// ============================================================
// Debug Logger (hidden behind DEBUG_MODE)
// ============================================================

function createDebugLogger(enabled: boolean) {
    return {
        log: (...args: unknown[]) => enabled && console.log('[DEBUG][search]', ...args),
        error: (...args: unknown[]) => enabled && console.error('[DEBUG][search]', ...args),
        time: (label: string) => enabled && console.time(`[DEBUG][search] ${label}`),
        timeEnd: (label: string) => enabled && console.timeEnd(`[DEBUG][search] ${label}`),
    };
}

// ============================================================
// Supabase Client (Lazy Init)
// ============================================================

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
    if (supabase) return supabase;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.warn('[Cache] Supabase credentials not configured, caching disabled');
        return null;
    }

    supabase = createClient(url, key);
    return supabase;
}

// ============================================================
// Cache Helpers
// ============================================================

async function hashQuery(query: string): Promise<string> {
    // Use Web Crypto API (Edge-compatible) for consistent hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(query.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

interface CachedStatute {
    id: string;
    state_code: string;
    query_hash: string;
    citation: string;
    text_snippet: string | null;
    effective_date: string | null;
    confidence_score: number | null;
    source_url: string | null;
    updated_at: string;
}

async function getCachedStatute(stateCode: StateCode, queryHash: string): Promise<Statute | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        const { data, error } = await client
            .from('statutes')
            .select('*')
            .eq('state_code', stateCode)
            .eq('query_hash', queryHash)
            .single();

        if (error || !data) return null;

        const cached = data as CachedStatute;
        console.log(`[Cache] HIT for ${stateCode}:${queryHash.slice(0, 8)}...`);

        return {
            stateCode: cached.state_code as StateCode,
            citation: cached.citation,
            textSnippet: cached.text_snippet || '',
            effectiveDate: cached.effective_date || 'Unknown',
            confidenceScore: cached.confidence_score || 0,
            sourceUrl: cached.source_url || '',
        };
    } catch (err) {
        console.error('[Cache] Read error:', err);
        return null;
    }
}

async function cacheStatuteAsync(statute: Statute, queryHash: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    // Fire-and-forget: don't await, don't block response
    client
        .from('statutes')
        .upsert({
            state_code: statute.stateCode,
            query_hash: queryHash,
            citation: statute.citation,
            text_snippet: statute.textSnippet,
            effective_date: statute.effectiveDate,
            confidence_score: statute.confidenceScore,
            source_url: statute.sourceUrl,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'state_code,query_hash' })
        .then(({ error }) => {
            if (error) console.error('[Cache] Write error:', error);
            else console.log(`[Cache] STORED ${statute.stateCode}:${queryHash.slice(0, 8)}...`);
        });
}

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

type AiProvider = 'openai' | 'gemini' | 'openrouter';

function getModel(
    keys: { openai?: string; gemini?: string; openrouter?: string },
    providerPreference: AiProvider,
    modelName?: string
) {
    // Trim keys to prevent whitespace issues
    const trimmedKeys = {
        openai: keys.openai?.trim(),
        gemini: keys.gemini?.trim(),
        openrouter: keys.openrouter?.trim(),
    };

    // OpenRouter - uses OpenAI-compatible API with required headers
    if (providerPreference === 'openrouter' && trimmedKeys.openrouter) {
        const provider = createOpenAI({
            apiKey: trimmedKeys.openrouter,
            baseURL: 'https://openrouter.ai/api/v1',
            headers: {
                'HTTP-Referer': 'https://lawvics.com',
                'X-Title': 'Lawvics',
            },
        });
        return provider(modelName || 'openai/gpt-4o-mini');
    }

    if (providerPreference === 'openai' && trimmedKeys.openai) {
        const provider = createOpenAI({ apiKey: trimmedKeys.openai });
        return provider(modelName || 'gpt-4o-mini');
    }
    if (providerPreference === 'gemini' && trimmedKeys.gemini) {
        const provider = createGoogleGenerativeAI({ apiKey: trimmedKeys.gemini });
        return provider(modelName || 'gemini-1.5-flash');
    }

    // Fallback logic - try any available key, preserving modelName if provided
    if (trimmedKeys.openrouter) {
        const provider = createOpenAI({
            apiKey: trimmedKeys.openrouter,
            baseURL: 'https://openrouter.ai/api/v1',
            headers: {
                'HTTP-Referer': 'https://lawvics.com',
                'X-Title': 'Lawvics',
            },
        });
        // Use provided modelName or default - was previously ignoring modelName in fallback
        return provider(modelName || 'openai/gpt-4o-mini');
    }
    if (trimmedKeys.openai) {
        return createOpenAI({ apiKey: trimmedKeys.openai })(modelName || 'gpt-4o-mini');
    }
    if (trimmedKeys.gemini) {
        return createGoogleGenerativeAI({ apiKey: trimmedKeys.gemini })(modelName || 'gemini-1.5-flash');
    }

    throw new Error('No valid API key provided for LLM Scraper mode. Please add an OpenAI, Gemini, or OpenRouter API key in Settings.');
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

/**
 * Use Crawlee + Playwright to fetch page content (handles JS rendering)
 */
/**
 * Fetch page content (Edge compatible)
 */
// async function fetchPageContent(url: string): Promise<string> {
//     // Playwright won't work on Edge. Using fetch instead.
//     return ""; 
// }


async function scrapeStateStatute(
    stateCode: StateCode,
    query: string,
    keys: { openai?: string; gemini?: string; openrouter?: string },
    activeProvider: AiProvider = 'openai',
    aiModel?: string,
    scrapingApiKey?: string
): Promise<Statute> {
    const baseUrl = STATE_LEGISLATURE_URLS[stateCode];
    if (!baseUrl) throw new Error(`No URL for ${stateCode}`);


    // Proxy Logic (ZenRows / ScrapingBee compatible)
    let targetUrl = baseUrl;
    // Enhanced headers to look like a real browser
    let headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1'
    };

    // Check Admin Config for Proxy Toggle
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: configData } = await supabase.from('system_config').select('key, value');
    const proxyConfig = configData?.find(r => r.key === 'enable_proxy');
    let enableProxy = true;
    if (proxyConfig?.value) {
        try { enableProxy = JSON.parse(proxyConfig.value); } catch { /* default true */ }
    }

    const genericProxyUrl = process.env.SCRAPING_PROXY_URL; // e.g. "http://api.scraperapi.com/?api_key=XXX&url="

    if (genericProxyUrl && enableProxy) {
        // Generic Proxy Support (ScraperAPI, ScrapingBee, etc.)
        // The proxy URL should end with &url= or ?url= so we can append the target
        targetUrl = `${genericProxyUrl}${encodeURIComponent(baseUrl)}`;
        // Most proxies ignore headers unless passed specifically, but we keep them just in case
        // Some proxies might require clearing standard headers, but usually it's fine.
    } else if (scrapingApiKey && scrapingApiKey.length > 5) {
        // Assume ZenRows format for now as default, or simple proxy param
        // Example: https://api.zenrows.com/v1/?apikey=KEY&url=URL
        targetUrl = `https://api.zenrows.com/v1/?apikey=${scrapingApiKey}&url=${encodeURIComponent(baseUrl)}&js_render=true&premium_proxy=true`;
        // ZenRows typically handles headers, but keeping basic ones helps
        headers = {};
    }

    // Retry logic with exponential backoff
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            // 1. Fetch the page content with timeout
            const fetchController = new AbortController();
            const fetchTimeout = setTimeout(() => fetchController.abort(), 30000); // 30s timeout

            let res: Response;
            try {
                res = await fetch(targetUrl, {
                    headers,
                    signal: fetchController.signal
                });
            } finally {
                clearTimeout(fetchTimeout);
            }

            // Handle rate limiting (429) and server errors (5xx)
            // 403 Forbidden is also common with WAFs - we can try to retry, but usually it persists.
            if (res.status === 429 || res.status >= 500) {
                const retryAfter = res.headers.get('Retry-After');
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
                console.log(`[Scraper] ${stateCode} got ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            if (res.status === 403) {
                // If using proxy, maybe retry? If direct, we are blocked.
                if (attempt < MAX_RETRIES - 1) {
                    console.log(`[Scraper] ${stateCode} got 403 (WAF block), retrying...`);
                    await new Promise(r => setTimeout(r, 2000));
                    continue;
                }
                throw new Error(`Access Denied (WAF Block) by ${stateCode} legislature`);
            }

            if (res.status === 404) {
                throw new Error(`404: Resource not found for ${stateCode}`);
            }

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const html = await res.text();

            // WAF / Cloudflare Check (sometimes returns 200 OK with block page)
            if (html.includes('Access Denied') || html.includes('Cloudflare') || html.includes('Verify you are human')) {
                throw new Error(`Access Denied (Cloudflare/WAF) for ${stateCode}`);
            }

            // 2. Clean text (remove scripts, styles, etc.) without Cheerio
            const cleanText = html
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "") // Remove scripts
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")   // Remove styles
                .replace(/<nav\b[^>]*>([\s\S]*?)<\/nav>/gim, "")       // Remove nav
                .replace(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gim, "") // Remove footer
                .replace(/<[^>]+>/g, " ")                              // Remove all other tags
                .replace(/\s+/g, ' ')                                  // Collapse whitespace
                .trim()
                .substring(0, 15000);

            // 3. LLM Extraction with specialized legal system prompt (with timeout)
            const model = getModel(keys, activeProvider, aiModel);

            // Wrap generateObject in a timeout promise
            const llmTimeout = 60000; // 60s timeout for LLM

            let object: z.infer<typeof ScraperSchema>;

            try {
                const llmResult = await Promise.race([
                    generateObject({
                        model,
                        schema: ScraperSchema,
                        // @ts-ignore - 'json' mode hint for some providers
                        mode: 'json',
                        system: `You are a legal research assistant specializing in US state statutory law. Your task is to extract precise statute citations and text from state legislature websites.

RULES:
1. Always provide the EXACT citation format used by the state (e.g., "Cal. Civ. Code § 335.1" or "N.Y. Gen. Bus. Law § 349").
2. For limitation periods, extract the EXACT number of years/days and the trigger event (e.g., "from date of discovery").
3. If multiple statutes are relevant, choose the one most directly answering the query.
4. If the text discusses a statute but doesn't cite it, mark confidence as LOW (below 60).
5. Always include the effective date if mentioned in the text.
6. Do NOT hallucinate citations. If unsure, use "None found" and set confidence to 0.
7. The textSnippet should be the actual statute text, not a summary.
8. OUTPUT PURE JSON ONLY. NO PREAMBLE, NO POSTSCRIPT, NO THINKING BLOCKS.

PRIORITY: Accuracy over completeness. A "None found" with 0 confidence is better than a hallucinated citation.`,
                        prompt: `Extract the statute that answers the query "${query}" from this ${stateCode} legislature webpage content:

---
${cleanText}
---

If you find a specific statute section number and text, extract it. If the page is a search results page or index, report "None found".`,
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM request timed out after 60 seconds')), llmTimeout))
                ]) as { object: z.infer<typeof ScraperSchema> };

                object = llmResult.object;
            } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : String(err);
                console.error(`[Scraper] generateObject failed for ${stateCode}: ${errMsg}`);

                // If it's the "No object generated" error, it means parsing failed (likely due to reasoning tokens or bad JSON)
                // We could fallback to text generation, but for now let's just retry
                throw new Error(`LLM output parsing failed: ${errMsg}`);
            }

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
    // Check for debug mode via header or env
    const debugMode = request.headers.get('x-debug-mode') === 'true' || process.env.DEBUG_MODE === 'true';
    const debug = createDebugLogger(debugMode);

    debug.log('=== REQUEST START ===');
    debug.time('total-request');

    try {
        const body: SearchRequest = await request.json();
        const { stateCode, query } = body;

        debug.log('Parsed body:', { stateCode, query: query?.substring(0, 50) + '...' });

        if (!stateCode || !query) {
            debug.error('Missing required fields:', { stateCode: !!stateCode, query: !!query });
            return NextResponse.json({ success: false, error: 'Missing stateCode or query' }, { status: 400 });
        }

        // ============================================================
        // DEMO MODE: Researched hardcoded responses for specific queries
        // Uses staggered timing to create smooth 10-second map animation
        // ============================================================
        const demoResult = getDemoStatute(stateCode, query);
        if (demoResult) {
            debug.log('Using DEMO hardcoded data for:', query.substring(0, 50));

            // Derive stateIndex from state code position (alphabetical order)
            const ALL_STATES: StateCode[] = [
                'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
                'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
                'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
            ];
            const stateIndex = ALL_STATES.indexOf(stateCode);

            // Calculate delay: spread 50 states across ~9 seconds + random jitter
            // Each state gets a base delay of (stateIndex / 50) * 9000ms + random 0-400ms
            const baseDelay = stateIndex >= 0 ? Math.floor((stateIndex / 50) * 9000) : 0;
            const jitter = Math.floor(Math.random() * 400);
            const totalDelay = baseDelay + jitter + 100; // Min 100ms delay

            await new Promise(r => setTimeout(r, totalDelay));
            return NextResponse.json({ success: true, data: demoResult });
        }

        const dataSource = request.headers.get('x-data-source') || 'system-api';

        // Read from headers, or fall back to environment variables (for system-api mode)
        const openaiApiKey = request.headers.get('x-openai-key') || process.env.OPENAI_API_KEY || undefined;
        const geminiApiKey = request.headers.get('x-gemini-key') || process.env.GOOGLE_GENERATIVE_AI_API_KEY || undefined;
        // BYOK: Prioritize user's header key over system config
        const headerOpenRouterKey = request.headers.get('x-openrouter-key');
        const openRouterApiKey = headerOpenRouterKey || SYSTEM_CONFIG.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || undefined;
        const openStatesApiKey = request.headers.get('x-openstates-key') || process.env.OPENSTATES_API_KEY || undefined;
        const legiscanApiKey = request.headers.get('x-legiscan-key') || process.env.LEGISCAN_API_KEY || undefined;
        const scrapingApiKey = request.headers.get('x-scraping-key') || process.env.ZENROWS_API_KEY || process.env.SCRAPINGBEE_API_KEY || undefined;
        const activeProvider = request.headers.get('x-active-provider') as AiProvider | null;
        const aiModel = request.headers.get('x-ai-model') || undefined;

        debug.log('Headers parsed:', {
            dataSource,
            hasOpenAI: !!openaiApiKey,
            hasGemini: !!geminiApiKey,
            hasOpenRouter: !!openRouterApiKey,
            hasOpenStates: !!openStatesApiKey,
            hasLegiscan: !!legiscanApiKey,
            hasScraping: !!scrapingApiKey,
            activeProvider,
            aiModel
        });

        // Generate query hash for cache lookups
        const queryHash = await hashQuery(query);

        // ============================================================
        // STEP A: Check cache first (skip for mock mode)
        // ============================================================
        if (dataSource !== 'mock') {
            const cachedResult = await getCachedStatute(stateCode, queryHash);
            if (cachedResult) {
                return NextResponse.json({ success: true, data: cachedResult });
            }
            console.log(`[Cache] MISS for ${stateCode}:${queryHash.slice(0, 8)}... proceeding to fetch`);
        }

        // ============================================================
        // STEP B: Fetch from source (existing logic)
        // ============================================================
        if (dataSource === 'mock') {
            debug.log('Using MOCK mode');
            // Simplified mock delay
            await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
            const limitationYears = Math.random() > 0.5 ? 2 : 5;
            const mockData = {
                stateCode,
                citation: `${stateCode} Code § ${Math.floor(Math.random() * 1000)}`,
                textSnippet: `[MOCK] The limitation period for ${query} is ${limitationYears} years.`,
                effectiveDate: '2024-01-01',
                confidenceScore: 85,
                sourceUrl: STATE_LEGISLATURE_URLS[stateCode] || 'https://example.gov',
            };
            debug.log('Mock response:', mockData.citation);
            debug.timeEnd('total-request');
            return NextResponse.json({ success: true, data: mockData });
        }

        let statute: Statute;

        if (dataSource === 'official-api') {
            debug.log('Using OFFICIAL-API mode');
            if (openStatesApiKey) {
                debug.log('Fetching from Open States...');
                debug.time('openstates-fetch');
                statute = await fetchOpenStates(stateCode, query, openStatesApiKey);
                debug.timeEnd('openstates-fetch');
            } else if (legiscanApiKey) {
                debug.log('Fetching from LegiScan...');
                debug.time('legiscan-fetch');
                statute = await fetchLegiScan(stateCode, query, legiscanApiKey);
                debug.timeEnd('legiscan-fetch');
            } else {
                debug.error('No API keys provided for official-api mode');
                throw new Error('Official API mode requires Open States OR LegiScan API Key');
            }
        } else if (dataSource === 'llm-scraper' || dataSource === 'system-api') {
            debug.log(`Using ${dataSource.toUpperCase()} mode`);
            debug.time('llm-scrape');

            // For system-api mode, ALWAYS use config from database (ignore client-sent model)
            let effectiveModel = aiModel;
            let effectiveProvider: AiProvider = activeProvider ||
                (openRouterApiKey ? 'openrouter' : openaiApiKey ? 'openai' : 'gemini');

            if (dataSource === 'system-api') {
                try {
                    const systemConfig = await getSystemConfig();
                    // System-api mode ALWAYS uses system config (not fallback)
                    effectiveModel = systemConfig.search_model;
                    effectiveProvider = systemConfig.provider;
                    debug.log(`Using system config: model=${effectiveModel}, provider=${effectiveProvider}`);
                } catch (configError) {
                    debug.log('Failed to fetch system config, using defaults');
                    effectiveModel = 'meta-llama/llama-3.3-70b-instruct:free'; // Llama 3.3 is more reliable for JSON than DeepSeek
                    effectiveProvider = 'openrouter';
                }
            }

            if (!openaiApiKey && !geminiApiKey && !openRouterApiKey) {
                throw new Error(`No API key provided for ${dataSource}. Please check your environment variables or Settings.`);
            }

            statute = await scrapeStateStatute(
                stateCode,
                query,
                { openai: openaiApiKey, gemini: geminiApiKey, openrouter: openRouterApiKey },
                effectiveProvider,
                effectiveModel,
                undefined // No proxy for these modes
            );
            debug.timeEnd('llm-scrape');
        } else if (dataSource === 'scraping-proxy') {
            debug.log('Using SCRAPING-PROXY mode');
            if (!scrapingApiKey) {
                debug.error('No scraping API key provided');
                throw new Error('Scraping Proxy mode requires a ZenRows or ScrapingBee API Key');
            }
            debug.time('proxy-scrape');
            const detectedProvider: AiProvider = activeProvider ||
                (openRouterApiKey ? 'openrouter' : openaiApiKey ? 'openai' : 'gemini');
            statute = await scrapeStateStatute(
                stateCode,
                query,
                { openai: openaiApiKey, gemini: geminiApiKey, openrouter: openRouterApiKey },
                detectedProvider,
                aiModel,
                scrapingApiKey
            );
            debug.timeEnd('proxy-scrape');
        } else {
            debug.error('Unsupported data source:', dataSource);
            throw new Error(`Unsupported data source: ${dataSource}`);
        }

        debug.log('Statute fetched:', { citation: statute.citation, confidence: statute.confidenceScore });

        // ============================================================
        // STEP C: Cache result asynchronously (if confidence > 80)
        // ============================================================
        if (statute.confidenceScore && statute.confidenceScore > 80) {
            debug.log('Caching result (confidence > 80)');
            // Fire-and-forget: don't await, don't block response
            cacheStatuteAsync(statute, queryHash);
        }

        debug.log('=== REQUEST SUCCESS ===');
        debug.timeEnd('total-request');
        return NextResponse.json({ success: true, data: statute });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        console.error('[search] Error:', errorMessage);
        if (debugMode) {
            console.error('[DEBUG][search] Full error:', error);
        }
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}


