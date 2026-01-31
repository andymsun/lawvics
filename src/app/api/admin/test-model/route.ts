import { NextRequest, NextResponse } from 'next/server';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { SYSTEM_CONFIG } from '@/lib/config';

export const runtime = 'edge';

interface TestRequest {
    model: string;
    password: string;
}

interface TestResponse {
    success: boolean;
    response?: string;
    latency?: number;
    error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<TestResponse>> {
    try {
        const body: TestRequest = await request.json();
        const { model, password } = body;

        // Verify admin password
        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword || password !== adminPassword) {
            return NextResponse.json(
                { success: false, error: 'Invalid admin password' },
                { status: 401 }
            );
        }

        if (!model) {
            return NextResponse.json(
                { success: false, error: 'Model is required' },
                { status: 400 }
            );
        }

        // Get OpenRouter API key
        const apiKey = SYSTEM_CONFIG.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'OpenRouter API key not configured' },
                { status: 500 }
            );
        }

        // Initialize OpenRouter
        const openrouter = createOpenAI({
            apiKey,
            baseURL: 'https://openrouter.ai/api/v1',
        });

        // Simple test prompt
        const startTime = Date.now();

        const { text } = await generateText({
            model: openrouter(model),
            prompt: 'Respond with exactly: "Model test successful. Ready for legal research."',
        });

        const latency = Date.now() - startTime;

        return NextResponse.json({
            success: true,
            response: text,
            latency,
        });

    } catch (error) {
        console.error('[Model Test API] Error:', error);
        const message = error instanceof Error ? error.message : 'Model test failed';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
