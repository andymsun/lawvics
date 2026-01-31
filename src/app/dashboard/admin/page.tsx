'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Save, Loader2, Check, X, Key, Lock, Cpu, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// Types
// ============================================================

interface SystemConfig {
    search_model: string;
    document_model: string;
    provider: 'openai' | 'gemini' | 'openrouter';
}

// ============================================================
// Recommended Free Models
// ============================================================

const RECOMMENDED_MODELS = [
    { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Fast, GPT-4 level)' },
    { value: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral Small 3.1 (128K context, great reasoning)' },
    { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (Ultra-fast fallback)' },
    { value: 'meta-llama/llama-4-maverick:free', label: 'Llama 4 Maverick (Multimodal, high accuracy)' },
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct:free', label: 'Nemotron 70B (High accuracy)' },
];

// ============================================================
// Admin Page Component
// ============================================================

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState<SystemConfig>({
        search_model: 'meta-llama/llama-3.3-70b-instruct:free',
        document_model: 'mistralai/mistral-small-3.1-24b-instruct:free',
        provider: 'openrouter',
    });

    // Fetch current config on mount
    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/config');
            const data = await res.json();
            if (data.success && data.data) {
                setConfig({
                    search_model: data.data.search_model || config.search_model,
                    document_model: data.data.document_model || config.document_model,
                    provider: data.data.provider || config.provider,
                });
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAuth = async () => {
        if (!password) {
            toast.error('Please enter the admin password');
            return;
        }

        setIsLoading(true);
        try {
            // Test the password by making a POST request
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': password,
                },
                body: JSON.stringify(config),
            });

            if (res.status === 401) {
                toast.error('Invalid admin password');
                setIsAuthenticated(false);
            } else if (res.ok) {
                toast.success('Authenticated successfully');
                setIsAuthenticated(true);
            } else {
                const data = await res.json();
                toast.error(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth error:', error);
            toast.error('Failed to authenticate');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isAuthenticated) {
            toast.error('Please authenticate first');
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': password,
                },
                body: JSON.stringify(config),
            });

            if (res.ok) {
                toast.success('Configuration saved successfully');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to save');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save configuration');
        } finally {
            setIsSaving(false);
        }
    };

    // Password gate UI
    if (!isAuthenticated) {
        return (
            <div className="h-full flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
                        <div className="flex items-center justify-center mb-6">
                            <div className="p-4 bg-primary/10 rounded-full">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-center mb-2">Admin Access</h1>
                        <p className="text-muted-foreground text-center text-sm mb-6">
                            Enter the admin password to manage system-wide settings.
                        </p>

                        <div className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                                    placeholder="Admin password"
                                    className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <button
                                onClick={handleAuth}
                                disabled={isLoading || !password}
                                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Key className="w-4 h-4" />
                                )}
                                Authenticate
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground text-center mt-6">
                            Password is set via ADMIN_PASSWORD environment variable.
                        </p>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Admin dashboard UI
    return (
        <div className="h-full overflow-auto p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto space-y-6"
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
                        <p className="text-muted-foreground">Manage system-wide AI settings for all users.</p>
                    </div>
                    <button
                        onClick={fetchConfig}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Refresh config"
                    >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* AI Models Card */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Cpu className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">AI Model Configuration</h2>
                            <p className="text-sm text-muted-foreground">These models are used for System API mode.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Search Model */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-muted-foreground" />
                                Search Model (Speed + Citations)
                            </label>
                            <select
                                value={config.search_model}
                                onChange={(e) => setConfig({ ...config, search_model: e.target.value })}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {RECOMMENDED_MODELS.map((model) => (
                                    <option key={model.value} value={model.value}>
                                        {model.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Used for 50-state surveys and individual searches.
                            </p>
                        </div>

                        {/* Document Model */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                Document Model (Briefs & Surveys)
                            </label>
                            <select
                                value={config.document_model}
                                onChange={(e) => setConfig({ ...config, document_model: e.target.value })}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {RECOMMENDED_MODELS.map((model) => (
                                    <option key={model.value} value={model.value}>
                                        {model.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Used for executive summaries and professional survey documents.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save Configuration
                    </button>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Authenticated as admin</span>
                    <span className="text-border">•</span>
                    <span>Changes affect all users in System API mode</span>
                </div>
            </motion.div>
        </div>
    );
}
