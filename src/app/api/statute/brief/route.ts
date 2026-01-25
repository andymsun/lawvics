import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { SYSTEM_CONFIG } from '@/lib/config';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            query,
            statutes,
            metadata,
            dataSource,
            provider,
            model,
            openaiApiKey,
            geminiApiKey,
            openRouterApiKey
        } = body;

        if (!statutes || !Array.isArray(statutes) || statutes.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No statutes provided.' },
                { status: 400 }
            );
        }

        // Determine effective provider based on data source
        const isSystemApi = dataSource === 'system-api' || req.headers.get('x-data-source') === 'system-api';
        const effectiveProvider = isSystemApi ? 'openrouter' : provider;

        // Determine API key - system-api uses override or server-side env keys
        let apiKey: string | undefined;
        if (isSystemApi) {
            // System API mode: prefer client override, then env, then hardcoded config
            apiKey = openRouterApiKey || process.env.OPENROUTER_API_KEY || SYSTEM_CONFIG.OPENROUTER_API_KEY;
        } else if (effectiveProvider === 'openai') {
            apiKey = openaiApiKey || process.env.OPENAI_API_KEY;
        } else if (effectiveProvider === 'gemini') {
            apiKey = geminiApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        } else if (effectiveProvider === 'openrouter') {
            apiKey = openRouterApiKey || process.env.OPENROUTER_API_KEY;
        }

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: "No API key configured. Add your API key in Settings to generate AI summaries."
            });
        }

        // Initialize AI model
        let aiModel;
        const effectiveModel = isSystemApi ? 'openai/gpt-4o-mini' : model;
        if (effectiveProvider === 'gemini') {
            const google = createGoogleGenerativeAI({ apiKey });
            aiModel = google(effectiveModel || 'gemini-1.5-flash');
        } else if (effectiveProvider === 'openrouter') {
            const openrouter = createOpenAI({
                apiKey,
                baseURL: 'https://openrouter.ai/api/v1',
            });
            aiModel = openrouter(effectiveModel || 'openai/gpt-4o-mini');
        } else {
            const openai = createOpenAI({ apiKey });
            aiModel = openai(effectiveModel || 'gpt-4o-mini');
        }

        // Prompt to generate structured markdown summary like demo summaries
        const prompt = `You are a legal research analyst. Generate an executive summary for a 50-state statutory survey.

RESEARCH TOPIC: "${query}"

SURVEY DATA:
- Verified results: ${metadata?.verified || 0}/50 states
- Unverified results: ${metadata?.unverified || 0}/50 states  
- Errors: ${metadata?.errors || 0}/50 states
- Average Confidence: ${metadata?.avgConfidence || 0}%

SAMPLE STATUTES (${statutes.length} of 50):
${statutes.slice(0, 10).join('\n')}

INSTRUCTIONS:
Write a structured executive summary using this EXACT markdown format:

## Executive Summary: [Topic Title]

**Legal Landscape Overview**
[1 paragraph describing majority vs minority approaches, general patterns across states]

**Key Findings & Notable Variations**
• **[Category 1]**: [specific finding with state examples]
• **[Category 2]**: [specific finding with state examples]
• **[Category 3]**: [specific finding with state examples]
• **[Category 4]**: [specific finding with state examples]

**Compliance Recommendations**
[1 paragraph with practical guidance for multi-state operations]

RULES:
- Use ## for the title, **bold** for section headers
- Use bullet points (•) with **bold** labels for key findings
- Include specific state codes (e.g., CA, TX, NY) where relevant
- Be concise and professional
- NO preamble or commentary outside the structure`;

        const { text } = await generateText({
            model: aiModel,
            prompt,
            temperature: 0.2,
        });

        return NextResponse.json({
            success: true,
            summary: text
        });

    } catch (error: unknown) {
        console.error('[Brief API] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to generate brief';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
