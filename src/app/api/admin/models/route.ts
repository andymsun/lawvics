import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface OpenRouterModel {
    id: string;
    name: string;
    description?: string;
    context_length: number;
    pricing: {
        prompt: string;
        completion: string;
    };
    top_provider?: {
        max_completion_tokens?: number;
    };
}

interface ModelInfo {
    value: string;
    label: string;
    description: string;
    contextLength: number;
    maxOutput: number;
}

export async function GET(): Promise<NextResponse> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Content-Type': 'application/json',
            },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        const models: OpenRouterModel[] = data.data || [];

        // Filter for free models (pricing is "0" for both prompt and completion)
        const freeModels = models.filter(model => {
            const promptPrice = parseFloat(model.pricing?.prompt || '1');
            const completionPrice = parseFloat(model.pricing?.completion || '1');
            return promptPrice === 0 && completionPrice === 0;
        });

        // Sort by context length (longer context = better for long documents)
        freeModels.sort((a, b) => (b.context_length || 0) - (a.context_length || 0));

        // Format for frontend
        const formattedModels: ModelInfo[] = freeModels.map(model => {
            const contextK = Math.round((model.context_length || 0) / 1000);
            const maxOutput = model.top_provider?.max_completion_tokens || 4096;

            return {
                value: model.id,
                label: `${model.name} (${contextK}K context)`,
                description: model.description || 'No description available',
                contextLength: model.context_length || 0,
                maxOutput,
            };
        });

        return NextResponse.json({
            success: true,
            models: formattedModels,
            count: formattedModels.length,
        });

    } catch (error) {
        console.error('[OpenRouter Models API] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch models';
        return NextResponse.json(
            { success: false, error: message, models: [] },
            { status: 500 }
        );
    }
}
