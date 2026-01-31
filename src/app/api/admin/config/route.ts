import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// ============================================================
// Types
// ============================================================

interface SystemConfigRow {
    key: string;
    value: string; // JSON string
    updated_at: string;
}

interface ConfigResponse {
    success: boolean;
    data?: Record<string, unknown>;
    error?: string;
}

// ============================================================
// Supabase Client
// ============================================================

function getSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('Supabase credentials not configured');
    }

    return createClient(url, key);
}

// ============================================================
// Default Config Values
// ============================================================

const DEFAULT_CONFIG: Record<string, unknown> = {
    search_model: 'deepseek/deepseek-chat:free',
    document_model: 'mistralai/mistral-small-3.1-24b-instruct:free',
    provider: 'openrouter',
    disable_parallel: false,
};

// ============================================================
// GET - Fetch all system config
// ============================================================

export async function GET(): Promise<NextResponse<ConfigResponse>> {
    try {
        const supabase = getSupabaseClient();

        const { data, error } = await supabase
            .from('system_config')
            .select('key, value');

        if (error) {
            console.error('[admin/config] Supabase error:', error);
            // Return defaults if table doesn't exist yet
            return NextResponse.json({ success: true, data: DEFAULT_CONFIG });
        }

        // Convert array of {key, value} to object
        const config: Record<string, unknown> = { ...DEFAULT_CONFIG };
        for (const row of (data as SystemConfigRow[]) || []) {
            try {
                config[row.key] = JSON.parse(row.value);
            } catch {
                config[row.key] = row.value;
            }
        }

        return NextResponse.json({ success: true, data: config });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[admin/config] GET error:', message);
        // Return defaults on any error
        return NextResponse.json({ success: true, data: DEFAULT_CONFIG });
    }
}

// ============================================================
// POST - Update system config (password protected)
// ============================================================

export async function POST(request: NextRequest): Promise<NextResponse<ConfigResponse>> {
    // Check admin password
    const password = request.headers.get('x-admin-password');
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
        return NextResponse.json(
            { success: false, error: 'Admin password not configured on server' },
            { status: 500 }
        );
    }

    if (password !== expectedPassword) {
        return NextResponse.json(
            { success: false, error: 'Invalid admin password' },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const supabase = getSupabaseClient();

        // Upsert each key-value pair
        const updates = Object.entries(body).map(([key, value]) => ({
            key,
            value: JSON.stringify(value),
            updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
            .from('system_config')
            .upsert(updates, { onConflict: 'key' });

        if (error) {
            console.error('[admin/config] Supabase upsert error:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to save config: ' + error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data: body });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[admin/config] POST error:', message);
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
