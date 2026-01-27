/**
 * Central configuration for API keys.
 * 
 * Keys are read from environment variables (set in Vercel Dashboard).
 * In development, you can use a .env.local file.
 */
export const SYSTEM_CONFIG = {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
};
