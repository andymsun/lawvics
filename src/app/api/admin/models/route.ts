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
    isFree: boolean;
    tags: ('fastest' | 'smartest' | 'writing' | 'balanced')[];
    pricePerMillion?: number; // Price per million tokens (prompt)
}

// Curated list of recommended paid models with their strengths
const RECOMMENDED_PAID_MODELS: Record<string, { tags: ('fastest' | 'smartest' | 'writing' | 'balanced')[] }> = {
    // OpenAI
    'openai/gpt-4o': { tags: ['smartest', 'balanced'] },
    'openai/gpt-4o-mini': { tags: ['fastest', 'balanced'] },
    'openai/gpt-4-turbo': { tags: ['smartest', 'writing'] },
    'openai/o1': { tags: ['smartest'] },
    'openai/o1-mini': { tags: ['smartest', 'fastest'] },
    'openai/o3-mini': { tags: ['smartest', 'fastest'] },

    // Anthropic
    'anthropic/claude-3.5-sonnet': { tags: ['smartest', 'writing'] },
    'anthropic/claude-3.5-sonnet:beta': { tags: ['smartest', 'writing'] },
    'anthropic/claude-3-opus': { tags: ['smartest', 'writing'] },
    'anthropic/claude-3-sonnet': { tags: ['balanced', 'writing'] },
    'anthropic/claude-3-haiku': { tags: ['fastest'] },

    // Google
    'google/gemini-pro-1.5': { tags: ['smartest', 'balanced'] },
    'google/gemini-flash-1.5': { tags: ['fastest'] },
    'google/gemini-2.0-flash-001': { tags: ['fastest', 'balanced'] },

    // Meta
    'meta-llama/llama-3.1-405b-instruct': { tags: ['smartest'] },
    'meta-llama/llama-3.1-70b-instruct': { tags: ['balanced'] },

    // DeepSeek
    'deepseek/deepseek-chat': { tags: ['fastest', 'balanced'] },
    'deepseek/deepseek-r1': { tags: ['smartest'] },

    // Mistral
    'mistralai/mistral-large': { tags: ['smartest', 'writing'] },
    'mistralai/mistral-medium': { tags: ['balanced'] },
};

// Curated list of recommended free models with tags
// Models not in this list will still show but without tags
const RECOMMENDED_FREE_MODELS: Record<string, { tags: ('fastest' | 'smartest' | 'writing' | 'balanced')[] }> = {
    // Google
    'google/gemini-2.0-flash-exp:free': { tags: ['fastest'] },
    'google/gemini-2.0-flash-thinking-exp:free': { tags: ['smartest'] },
    'google/gemma-2-27b-it:free': { tags: ['fastest'] },
    'google/gemma-2-9b-it:free': { tags: ['fastest'] },

    // DeepSeek
    'deepseek/deepseek-chat:free': { tags: ['smartest', 'balanced'] },
    'deepseek/deepseek-r1:free': { tags: ['smartest'] },
    'deepseek/deepseek-r1-distill-llama-70b:free': { tags: ['smartest', 'balanced'] },
    'deepseek/deepseek-r1-distill-qwen-32b:free': { tags: ['smartest'] },

    // Mistral
    'mistralai/mistral-small-3.1-24b-instruct:free': { tags: ['writing', 'balanced'] },
    'mistralai/mistral-7b-instruct:free': { tags: ['fastest'] },
    'mistralai/mistral-nemo:free': { tags: ['balanced'] },

    // Meta Llama
    'meta-llama/llama-3.3-70b-instruct:free': { tags: ['balanced'] },
    'meta-llama/llama-3.2-11b-vision-instruct:free': { tags: ['balanced'] },
    'meta-llama/llama-3.2-3b-instruct:free': { tags: ['fastest'] },
    'meta-llama/llama-3.2-1b-instruct:free': { tags: ['fastest'] },
    'meta-llama/llama-3.1-70b-instruct:free': { tags: ['balanced'] },
    'meta-llama/llama-3.1-8b-instruct:free': { tags: ['fastest'] },

    // Qwen
    'qwen/qwen-2.5-72b-instruct:free': { tags: ['balanced'] },
    'qwen/qwen-2.5-32b-instruct:free': { tags: ['balanced'] },
    'qwen/qwen-2.5-coder-32b-instruct:free': { tags: ['balanced'] },
    'qwen/qwen-2.5-7b-instruct:free': { tags: ['fastest'] },
    'qwen/qwq-32b:free': { tags: ['smartest'] },
    'qwen/qwq-32b-preview:free': { tags: ['smartest'] },

    // Microsoft
    'microsoft/phi-3-medium-128k-instruct:free': { tags: ['fastest'] },
    'microsoft/phi-3-mini-128k-instruct:free': { tags: ['fastest'] },

    // Other
    'nvidia/llama-3.1-nemotron-70b-instruct:free': { tags: ['balanced'] },
    'huggingfaceh4/zephyr-7b-beta:free': { tags: ['fastest'] },
};

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

        const freeModels: ModelInfo[] = [];
        const paidModels: ModelInfo[] = [];

        for (const model of models) {
            const promptPrice = parseFloat(model.pricing?.prompt || '0');
            const completionPrice = parseFloat(model.pricing?.completion || '0');
            const isFree = promptPrice === 0 && completionPrice === 0;

            const contextK = Math.round((model.context_length || 0) / 1000);
            const maxOutput = model.top_provider?.max_completion_tokens || 4096;

            // Get tags from curated lists
            const tags = isFree
                ? (RECOMMENDED_FREE_MODELS[model.id]?.tags || [])
                : (RECOMMENDED_PAID_MODELS[model.id]?.tags || []);

            // Include ALL free models (even without tags), but only curated paid models
            if (!isFree && tags.length === 0) continue;

            const modelInfo: ModelInfo = {
                value: model.id,
                label: `${model.name} (${contextK}K context)`,
                description: model.description || 'No description available',
                contextLength: model.context_length || 0,
                maxOutput,
                isFree,
                tags,
                pricePerMillion: isFree ? 0 : promptPrice * 1000000,
            };

            if (isFree) {
                freeModels.push(modelInfo);
            } else {
                paidModels.push(modelInfo);
            }
        }

        // Sort: prioritize models with more tags, then by context length
        const sortModels = (a: ModelInfo, b: ModelInfo) => {
            if (b.tags.length !== a.tags.length) return b.tags.length - a.tags.length;
            return b.contextLength - a.contextLength;
        };

        freeModels.sort(sortModels);
        paidModels.sort(sortModels);

        return NextResponse.json({
            success: true,
            freeModels,
            paidModels,
            counts: {
                free: freeModels.length,
                paid: paidModels.length,
            },
        });

    } catch (error) {
        console.error('[OpenRouter Models API] Error:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch models';
        return NextResponse.json(
            { success: false, error: message, freeModels: [], paidModels: [] },
            { status: 500 }
        );
    }
}
