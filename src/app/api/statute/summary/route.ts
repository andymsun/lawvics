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

        // Construct structured prompt matching brief format
        const statutesText = statutes.slice(0, 10).join('\n\n---\n\n'); // Limit to 10 for token safety
        const prompt = `You are a legal research analyst. Generate an executive summary for exported statute research.

STATUTES TO SUMMARIZE:
${statutesText}

INSTRUCTIONS:
Write a structured executive summary using this EXACT markdown format:

## Executive Summary

**Legal Landscape Overview**
[1 paragraph describing majority vs minority approaches, general patterns across jurisdictions]

**Key Findings & Notable Variations**
• **[Category 1]**: [specific finding with jurisdiction examples]
• **[Category 2]**: [specific finding with jurisdiction examples]
• **[Category 3]**: [specific finding with jurisdiction examples]

**Compliance Recommendations**
[1 paragraph with practical guidance for multi-jurisdiction operations]

RULES:
- Use ## for the title, **bold** for section headers
- Use bullet points (•) with **bold** labels for key findings
- Include specific jurisdiction codes where relevant
- Be concise and professional
- NO preamble or commentary outside the structure
- If insufficient data, state that briefly`;

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
