'use client';

// ============================================================
// Quota Check Utility
// ============================================================
// Pre-flight checks to verify API keys have available quota
// before starting a 50-state survey.

interface QuotaCheckResult {
    ok: boolean;
    provider: 'openai' | 'gemini' | 'openrouter';
    message: string;
    retryAfterMs?: number;
}

/**
 * Check if Gemini API key has available quota.
 * Gemini doesn't have a dedicated quota endpoint, so we make a minimal request.
 */
export async function checkGeminiQuota(apiKey: string): Promise<QuotaCheckResult> {
    if (!apiKey) {
        return { ok: false, provider: 'gemini', message: 'No Gemini API key provided' };
    }

    try {
        // Make a minimal request to check quota (list models is lightweight)
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (res.status === 429) {
            const data = await res.json().catch(() => ({}));
            const retryMatch = data.error?.message?.match(/retry in (\d+\.?\d*)/i);
            const retryAfterMs = retryMatch ? parseFloat(retryMatch[1]) * 1000 : 60000;

            return {
                ok: false,
                provider: 'gemini',
                message: 'Gemini API quota exhausted. Consider switching to OpenAI or waiting.',
                retryAfterMs
            };
        }

        if (res.status === 401 || res.status === 403) {
            return { ok: false, provider: 'gemini', message: 'Invalid Gemini API key' };
        }

        if (!res.ok) {
            return { ok: false, provider: 'gemini', message: `Gemini API error: ${res.statusText}` };
        }

        return { ok: true, provider: 'gemini', message: 'Gemini API ready' };
    } catch (error) {
        return { ok: false, provider: 'gemini', message: `Gemini check failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

/**
 * Check if OpenAI API key has available quota.
 * OpenAI doesn't have a quota check endpoint either, so we check /models.
 */
export async function checkOpenAIQuota(apiKey: string): Promise<QuotaCheckResult> {
    if (!apiKey) {
        return { ok: false, provider: 'openai', message: 'No OpenAI API key provided' };
    }

    try {
        const res = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (res.status === 429) {
            return {
                ok: false,
                provider: 'openai',
                message: 'OpenAI API rate limited. Wait a moment or check your billing.',
                retryAfterMs: 60000
            };
        }

        if (res.status === 401) {
            return { ok: false, provider: 'openai', message: 'Invalid OpenAI API key' };
        }

        if (res.status === 402) {
            return { ok: false, provider: 'openai', message: 'OpenAI billing issue - check your payment method' };
        }

        if (!res.ok) {
            return { ok: false, provider: 'openai', message: `OpenAI API error: ${res.statusText}` };
        }

        return { ok: true, provider: 'openai', message: 'OpenAI API ready' };
    } catch (error) {
        return { ok: false, provider: 'openai', message: `OpenAI check failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

/**
 * Check if OpenRouter API key has available quota.
 * OpenRouter uses OpenAI-compatible API.
 */
export async function checkOpenRouterQuota(apiKey: string): Promise<QuotaCheckResult> {
    if (!apiKey) {
        return { ok: false, provider: 'openrouter', message: 'No OpenRouter API key provided' };
    }

    try {
        const res = await fetch('https://openrouter.ai/api/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (res.status === 429) {
            return {
                ok: false,
                provider: 'openrouter',
                message: 'OpenRouter API rate limited. Wait a moment or check your credits.',
                retryAfterMs: 60000
            };
        }

        if (res.status === 401) {
            return { ok: false, provider: 'openrouter', message: 'Invalid OpenRouter API key' };
        }

        if (res.status === 402) {
            return { ok: false, provider: 'openrouter', message: 'OpenRouter credits exhausted - add credits to your account' };
        }

        if (!res.ok) {
            return { ok: false, provider: 'openrouter', message: `OpenRouter API error: ${res.statusText}` };
        }

        return { ok: true, provider: 'openrouter', message: 'OpenRouter API ready' };
    } catch (error) {
        return { ok: false, provider: 'openrouter', message: `OpenRouter check failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

/**
 * Run pre-flight quota check based on current settings.
 * Returns the check result for the active provider.
 */
export async function runQuotaCheck(
    activeProvider: 'openai' | 'gemini' | 'openrouter',
    openaiKey: string,
    geminiKey: string,
    openRouterKey?: string
): Promise<QuotaCheckResult> {
    if (activeProvider === 'gemini') {
        return checkGeminiQuota(geminiKey);
    } else if (activeProvider === 'openrouter') {
        return checkOpenRouterQuota(openRouterKey || '');
    } else {
        return checkOpenAIQuota(openaiKey);
    }
}
