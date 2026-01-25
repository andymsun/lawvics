import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

// Force edge runtime for Cloudflare Pages
export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { statutes, provider, model, apiKey, openaiApiKey, geminiApiKey, openRouterApiKey } = body;

        if (!statutes || !Array.isArray(statutes) || statutes.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No statutes provided for summary.' },
                { status: 400 }
            );
        }

        // Determine effective API key based on provider
        let effectiveApiKey = apiKey;
        if (!effectiveApiKey) {
            if (provider === 'openai') effectiveApiKey = openaiApiKey || process.env.OPENAI_API_KEY;
            else if (provider === 'gemini') effectiveApiKey = geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
            else if (provider === 'openrouter') effectiveApiKey = openRouterApiKey || process.env.OPENROUTER_API_KEY;
        }

        if (!effectiveApiKey) {
            // Fallback for demo/public view if no keys are provided
            // In a real app, this might use a limited system key
            return NextResponse.json({
                success: true,
                summary: "AI Summary Unavailable: No API Key provided. Please add your API key in Settings to generate summaries."
            });
        }

        // Initialize AI Provider
        let aiModel;
        if (provider === 'google' || provider === 'gemini') {
            const google = createGoogleGenerativeAI({ apiKey: effectiveApiKey });
            aiModel = google(model || 'gemini-1.5-flash');
        } else if (provider === 'openrouter') {
            const openrouter = createOpenAI({
                apiKey: effectiveApiKey,
                baseURL: 'https://openrouter.ai/api/v1',
            });
            aiModel = openrouter(model || 'openai/gpt-4o-mini');
        } else {
            // Default to OpenAI
            const openai = createOpenAI({ apiKey: effectiveApiKey });
            aiModel = openai(model || 'gpt-4o-mini');
        }

        // Construct Prompt
        const statutesText = statutes.slice(0, 10).join('\n\n---\n\n'); // Limit to 10 for token safety
        const prompt = `
You are a legal research assistant. Synthesize the following statute snippets into a concise, professional executive summary.
Focus on the common themes, key regulations, and any notable exceptions found in the text.
Do not hallucinate. If the text is insufficient, state that.

STATUTES:
${statutesText}

SUMMARY:
`;

        const { text } = await generateText({
            model: aiModel,
            prompt: prompt,
            // maxTokens removed to fix type error
            temperature: 0.3,
        });

        return NextResponse.json({
            success: true,
            summary: text
        });

    } catch (error: any) {
        console.error('[Summary API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to generate summary' },
            { status: 500 }
        );
    }
}
