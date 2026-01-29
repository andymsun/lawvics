import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { SYSTEM_CONFIG } from '@/lib/config';
import { SURVEY_DOCUMENT_SYSTEM_PROMPT } from '@/lib/prompts/survey-prompt';

export const runtime = 'edge';
export const maxDuration = 120; // Allow up to 2 minutes for full document generation

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
            apiKey = SYSTEM_CONFIG.OPENROUTER_API_KEY || openRouterApiKey || process.env.OPENROUTER_API_KEY;
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
                error: "No API key configured. Add your API key in Settings to generate professional surveys."
            });
        }

        // Initialize AI model - prefer larger context models for full survey
        let aiModel;
        // For full survey, prefer more capable models
        const effectiveModel = isSystemApi
            ? 'openai/gpt-4o-mini'  // Cost-effective but capable
            : model;

        if (effectiveProvider === 'gemini') {
            const google = createGoogleGenerativeAI({ apiKey });
            // Prefer 1.5 Pro for large context
            aiModel = google(effectiveModel || 'gemini-1.5-pro');
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

        // Format statutes data for the prompt
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Build comprehensive state results from statutes array
        const formattedStatutes = statutes.map((s: string, idx: number) => {
            // Parse the statute string format: "[STATE] Citation: Text..."
            const match = s.match(/^\[([A-Z]{2})\]\s*([^:]+):\s*(.*)$/);
            if (match) {
                return `State ${idx + 1}: ${match[1]}
Citation: ${match[2]}
Text: ${match[3]}`;
            }
            return s;
        }).join('\n\n');

        // Build the user prompt with actual data
        const userPrompt = `Generate a professional 50-state statutory survey document for the following research topic.

# INPUT DATA

## Research Specification
- **Topic:** "${query}"
- **Date:** ${currentDate}

## Survey Metadata
- **Verified Results:** ${metadata?.verified || 0}/50 states
- **Unverified Results:** ${metadata?.unverified || 0}/50 states
- **Errors:** ${metadata?.errors || 0}/50 states
- **Average Confidence:** ${metadata?.avgConfidence || 0}%

## State Results (${statutes.length} states with data)

${formattedStatutes}

---

Using the data above, generate a complete professional 50-state survey document following the exact structure and formatting in your instructions.

IMPORTANT:
- Use the actual state data provided above
- For states not in the data, mark as "Pending" or "No Data"
- Include all 14 sections as specified
- Use proper Bluebook citation format
- Quantify all findings with specific numbers and percentages
- Identify outliers by name (CA, TX, NY, etc.)
- Generate realistic analysis based on the topic and available data

Generate the complete document now:`;

        // Use streaming for progressive display
        const result = streamText({
            model: aiModel,
            system: SURVEY_DOCUMENT_SYSTEM_PROMPT,
            prompt: userPrompt,
            temperature: 0.3, // Lower temperature for more consistent legal analysis
        });

        // Return streaming response
        return result.toTextStreamResponse();

    } catch (error: unknown) {
        console.error('[Survey Document API] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to generate survey document';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
