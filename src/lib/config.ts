import { createClient } from '@supabase/supabase-js';

/**
 * Central configuration for API keys.
 * 
 * Keys are read from environment variables (set in Vercel Dashboard).
 * In development, you can use a .env.local file.
 */
export const SYSTEM_CONFIG = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
};

// ============================================================
// System Config Types (for admin-controlled settings)
// ============================================================

export interface SystemConfig {
    search_model: string;
    document_model: string;
    provider: 'openai' | 'gemini' | 'openrouter';
}

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
    search_model: 'deepseek/deepseek-chat:free',
    document_model: 'mistralai/mistral-small-3.1-24b-instruct:free',
    provider: 'openrouter',
};

// ============================================================
// In-Memory Cache for System Config
// ============================================================

let cachedConfig: SystemConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60000; // 60 seconds

// ============================================================
// Fetch System Config from Supabase
// ============================================================

/**
 * Get system configuration from Supabase.
 * Cached for 60 seconds to reduce database calls.
 * Falls back to defaults if Supabase is unavailable.
 */
export async function getSystemConfig(): Promise<SystemConfig> {
    // Return cached config if still valid
    const now = Date.now();
    if (cachedConfig && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return cachedConfig;
    }

    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            console.warn('[config] Supabase not configured, using defaults');
            return DEFAULT_SYSTEM_CONFIG;
        }

        const supabase = createClient(url, key);
        const { data, error } = await supabase
            .from('system_config')
            .select('key, value');

        if (error) {
            console.error('[config] Supabase error:', error.message);
            return cachedConfig || DEFAULT_SYSTEM_CONFIG;
        }

        // Parse config from database rows
        const config: SystemConfig = { ...DEFAULT_SYSTEM_CONFIG };
        for (const row of data || []) {
            try {
                const value = JSON.parse(row.value);
                if (row.key in config) {
                    (config as unknown as Record<string, unknown>)[row.key] = value;
                }
            } catch {
                // Skip invalid JSON
            }
        }

        // Update cache
        cachedConfig = config;
        cacheTimestamp = now;

        return config;
    } catch (error) {
        console.error('[config] Failed to fetch system config:', error);
        return cachedConfig || DEFAULT_SYSTEM_CONFIG;
    }
}

/**
 * Clear the config cache (call after admin updates)
 */
export function clearConfigCache(): void {
    cachedConfig = null;
    cacheTimestamp = 0;
}
