'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Save, Loader2, Check, X, Key, Lock, Cpu, FileText, RefreshCw, Zap } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// Types
// ============================================================

interface SystemConfig {
    search_model: string;
    document_model: string;
    provider: 'openai' | 'gemini' | 'openrouter';
    // Access Control
    force_system_api: boolean;
    allow_byok: boolean;
    // Operational Settings
    max_parallel_requests: number;
    rate_limit_per_hour: number;
    disable_parallel: boolean;
    // Feature Flags
    maintenance_mode: boolean;
    enable_demo_mode: boolean;
}

type ModelTag = 'fastest' | 'smartest' | 'writing' | 'balanced';

interface ModelInfo {
    value: string;
    label: string;
    description: string;
    contextLength: number;
    maxOutput: number;
    isFree?: boolean;
    tags?: ModelTag[];
    pricePerMillion?: number;
}

// Tag styling
const TAG_STYLES: Record<ModelTag, { bg: string; text: string; label: string }> = {
    fastest: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', label: '⚡ Fastest' },
    smartest: { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', label: '🧠 Smartest' },
    writing: { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', label: '✍️ Writing' },
    balanced: { bg: 'bg-gray-500/10', text: 'text-gray-600 dark:text-gray-400', label: '⚖️ Balanced' },
};

// Fallback free models if API fails
const FALLBACK_FREE_MODELS: ModelInfo[] = [
    { value: 'deepseek/deepseek-chat:free', label: 'DeepSeek Chat (64K)', description: 'GPT-4 level performance', contextLength: 64000, maxOutput: 8192, isFree: true, tags: ['smartest', 'balanced'] },
    { value: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (1M)', description: 'Ultra fast, massive context', contextLength: 1000000, maxOutput: 8192, isFree: true, tags: ['fastest'] },
    { value: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral Small 3.1 (128K)', description: 'Great for writing', contextLength: 128000, maxOutput: 8192, isFree: true, tags: ['writing', 'balanced'] },
];

// Fallback paid models if API fails
const FALLBACK_PAID_MODELS: ModelInfo[] = [
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (200K)', description: 'Best for legal writing', contextLength: 200000, maxOutput: 8192, isFree: false, tags: ['smartest', 'writing'], pricePerMillion: 3 },
    { value: 'openai/gpt-4o', label: 'GPT-4o (128K)', description: 'OpenAI flagship', contextLength: 128000, maxOutput: 16384, isFree: false, tags: ['smartest', 'balanced'], pricePerMillion: 5 },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (128K)', description: 'Fast and cheap', contextLength: 128000, maxOutput: 16384, isFree: false, tags: ['fastest', 'balanced'], pricePerMillion: 0.15 },
];

// ============================================================
// Admin Page Component
// ============================================================

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [testingModel, setTestingModel] = useState<'search' | 'document' | null>(null);
    const [testResults, setTestResults] = useState<{ search?: { success: boolean; latency?: number; error?: string }; document?: { success: boolean; latency?: number; error?: string } }>({});
    const [freeModels, setFreeModels] = useState<ModelInfo[]>(FALLBACK_FREE_MODELS);
    const [paidModels, setPaidModels] = useState<ModelInfo[]>(FALLBACK_PAID_MODELS);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [selectedModelInfo, setSelectedModelInfo] = useState<{ search?: ModelInfo; document?: ModelInfo }>({});
    const [config, setConfig] = useState<SystemConfig>({
        search_model: 'deepseek/deepseek-chat:free',
        document_model: 'mistralai/mistral-small-3.1-24b-instruct:free',
        provider: 'openrouter',
        force_system_api: false,
        allow_byok: true,
        max_parallel_requests: 10,
        rate_limit_per_hour: 0,
        disable_parallel: false,
        maintenance_mode: false,
        enable_demo_mode: true,
    });

    // All models combined for lookup
    const allModels = [...freeModels, ...paidModels];

    // Fetch current config and available models on mount
    useEffect(() => {
        fetchConfig();
        fetchAvailableModels();
    }, []);

    // Update selected model info when config or models change
    useEffect(() => {
        const searchModel = allModels.find(m => m.value === config.search_model);
        const documentModel = allModels.find(m => m.value === config.document_model);
        setSelectedModelInfo({ search: searchModel, document: documentModel });
    }, [config, freeModels, paidModels]);

    const fetchAvailableModels = async () => {
        setIsLoadingModels(true);
        try {
            const res = await fetch('/api/admin/models');
            const data = await res.json();
            if (data.success) {
                if (data.freeModels?.length > 0) {
                    setFreeModels(data.freeModels);
                }
                if (data.paidModels?.length > 0) {
                    setPaidModels(data.paidModels);
                }
                const total = (data.freeModels?.length || 0) + (data.paidModels?.length || 0);
                toast.success(`Loaded ${total} models (${data.freeModels?.length || 0} free, ${data.paidModels?.length || 0} paid)`);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            toast.error('Using fallback model list');
        } finally {
            setIsLoadingModels(false);
        }
    };

    const fetchConfig = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/config');
            const data = await res.json();
            if (data.success && data.data) {
                setConfig(prev => ({
                    ...prev,
                    search_model: data.data.search_model ?? prev.search_model,
                    document_model: data.data.document_model ?? prev.document_model,
                    provider: data.data.provider ?? prev.provider,
                    force_system_api: data.data.force_system_api ?? prev.force_system_api,
                    allow_byok: data.data.allow_byok ?? prev.allow_byok,
                    max_parallel_requests: data.data.max_parallel_requests ?? prev.max_parallel_requests,
                    rate_limit_per_hour: data.data.rate_limit_per_hour ?? prev.rate_limit_per_hour,
                    disable_parallel: data.data.disable_parallel ?? prev.disable_parallel,
                    maintenance_mode: data.data.maintenance_mode ?? prev.maintenance_mode,
                    enable_demo_mode: data.data.enable_demo_mode ?? prev.enable_demo_mode,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const testModel = async (type: 'search' | 'document') => {
        const model = type === 'search' ? config.search_model : config.document_model;
        setTestingModel(type);
        setTestResults(prev => ({ ...prev, [type]: undefined }));

        try {
            const res = await fetch('/api/admin/test-model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, password }),
            });
            const data = await res.json();

            setTestResults(prev => ({
                ...prev,
                [type]: {
                    success: data.success,
                    latency: data.latency,
                    error: data.error
                }
            }));

            if (data.success) {
                toast.success(`Model responsive! Latency: ${data.latency}ms`);
            } else {
                toast.error(`Model test failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Test error:', error);
            setTestResults(prev => ({ ...prev, [type]: { success: false, error: 'Network error' } }));
            toast.error('Failed to test model');
        } finally {
            setTestingModel(null);
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
                                {isLoadingModels && <Loader2 className="w-3 h-3 animate-spin" />}
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={config.search_model}
                                    onChange={(e) => setConfig({ ...config, search_model: e.target.value })}
                                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <optgroup label="🆓 Free Models">
                                        {freeModels.map((model: ModelInfo) => (
                                            <option key={model.value} value={model.value}>
                                                {model.label} {model.tags?.map(t => TAG_STYLES[t].label.split(' ')[0]).join('')}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="💰 Paid Models (Requires OPENROUTER_API_KEY)">
                                        {paidModels.map((model: ModelInfo) => (
                                            <option key={model.value} value={model.value}>
                                                {model.label} {model.tags?.map(t => TAG_STYLES[t].label.split(' ')[0]).join('')} ~${model.pricePerMillion?.toFixed(2)}/M
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                                <button
                                    onClick={() => testModel('search')}
                                    disabled={testingModel === 'search'}
                                    className="px-3 py-2 bg-muted border border-border rounded-lg text-sm hover:bg-muted/80 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                                    title="Test model responsiveness"
                                >
                                    {testingModel === 'search' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : testResults.search?.success ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : testResults.search?.error ? (
                                        <X className="w-4 h-4 text-red-500" />
                                    ) : (
                                        <Zap className="w-4 h-4" />
                                    )}
                                    Test
                                </button>
                            </div>
                            {selectedModelInfo.search && (
                                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                                    <p>{selectedModelInfo.search.description}</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {selectedModelInfo.search.tags?.map(tag => (
                                            <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TAG_STYLES[tag].bg} ${TAG_STYLES[tag].text}`}>
                                                {TAG_STYLES[tag].label}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-1 font-medium">
                                        Context: {Math.round(selectedModelInfo.search.contextLength / 1000)}K |
                                        Max output: {Math.round(selectedModelInfo.search.maxOutput / 1000)}K
                                        {selectedModelInfo.search.pricePerMillion ? ` | ~$${selectedModelInfo.search.pricePerMillion.toFixed(2)}/M tokens` : ' | FREE'}
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground flex-1">
                                    Used for 50-state surveys and individual searches. ⚡ = Fastest, 🧠 = Smartest, ✍️ = Best for Writing
                                </p>
                                {testResults.search?.latency && (
                                    <span className="text-xs text-green-500">✓ {testResults.search.latency}ms</span>
                                )}
                                {testResults.search?.error && (
                                    <span className="text-xs text-red-500 truncate max-w-[200px]">{testResults.search.error}</span>
                                )}
                            </div>
                        </div>

                        {/* Document Model */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                Document Model (Briefs & Surveys)
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={config.document_model}
                                    onChange={(e) => setConfig({ ...config, document_model: e.target.value })}
                                    className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <optgroup label="🆓 Free Models">
                                        {freeModels.map((model: ModelInfo) => (
                                            <option key={model.value} value={model.value}>
                                                {model.label} {model.tags?.map(t => TAG_STYLES[t].label.split(' ')[0]).join('')}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="💰 Paid Models (Requires OPENROUTER_API_KEY)">
                                        {paidModels.map((model: ModelInfo) => (
                                            <option key={model.value} value={model.value}>
                                                {model.label} {model.tags?.map(t => TAG_STYLES[t].label.split(' ')[0]).join('')} ~${model.pricePerMillion?.toFixed(2)}/M
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                                <button
                                    onClick={() => testModel('document')}
                                    disabled={testingModel === 'document'}
                                    className="px-3 py-2 bg-muted border border-border rounded-lg text-sm hover:bg-muted/80 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                                    title="Test model responsiveness"
                                >
                                    {testingModel === 'document' ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : testResults.document?.success ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                    ) : testResults.document?.error ? (
                                        <X className="w-4 h-4 text-red-500" />
                                    ) : (
                                        <Zap className="w-4 h-4" />
                                    )}
                                    Test
                                </button>
                            </div>
                            {selectedModelInfo.document && (
                                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
                                    <p>{selectedModelInfo.document.description}</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {selectedModelInfo.document.tags?.map(tag => (
                                            <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TAG_STYLES[tag].bg} ${TAG_STYLES[tag].text}`}>
                                                {TAG_STYLES[tag].label}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="mt-1 font-medium">
                                        Context: {Math.round(selectedModelInfo.document.contextLength / 1000)}K |
                                        Max output: {Math.round(selectedModelInfo.document.maxOutput / 1000)}K
                                        {selectedModelInfo.document.pricePerMillion ? ` | ~$${selectedModelInfo.document.pricePerMillion.toFixed(2)}/M tokens` : ' | FREE'}
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground flex-1">
                                    For briefs & surveys: ✍️ Writing models recommended. Use 🧠 Smartest for complex legal analysis.
                                </p>
                                {testResults.document?.latency && (
                                    <span className="text-xs text-green-500">✓ {testResults.document.latency}ms</span>
                                )}
                                {testResults.document?.error && (
                                    <span className="text-xs text-red-500 truncate max-w-[200px]">{testResults.document.error}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Access Control Section */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Lock className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Access Control</h2>
                            <p className="text-sm text-muted-foreground">Control user access to API features</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {/* Force System API */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Force System API Only</label>
                                <p className="text-xs text-muted-foreground">
                                    When enabled, users cannot use their own API keys. All requests use system API.
                                </p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, force_system_api: !config.force_system_api })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.force_system_api ? 'bg-red-500' : 'bg-muted'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.force_system_api ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Allow BYOK */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Allow Bring Your Own Key</label>
                                <p className="text-xs text-muted-foreground">
                                    Allow users to add their own API keys in Settings (ignored if Force System API is on).
                                </p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, allow_byok: !config.allow_byok })}
                                disabled={config.force_system_api}
                                className={`relative w-12 h-6 rounded-full transition-colors disabled:opacity-50 ${config.allow_byok && !config.force_system_api ? 'bg-green-500' : 'bg-muted'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.allow_byok && !config.force_system_api ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Operational Settings Section */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <RefreshCw className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Operational Settings</h2>
                            <p className="text-sm text-muted-foreground">Configure performance and limits</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Max Parallel Requests */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Max Parallel Requests</label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={config.max_parallel_requests}
                                onChange={(e) => setConfig({ ...config, max_parallel_requests: Math.min(50, Math.max(1, parseInt(e.target.value) || 10)) })}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground">
                                How many state searches run at once (1-50). Lower = slower but more reliable.
                            </p>
                        </div>

                        {/* Rate Limit */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rate Limit (per hour)</label>
                            <input
                                type="number"
                                min={0}
                                value={config.rate_limit_per_hour}
                                onChange={(e) => setConfig({ ...config, rate_limit_per_hour: Math.max(0, parseInt(e.target.value) || 0) })}
                                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <p className="text-xs text-muted-foreground">
                                Max API requests per user per hour. 0 = unlimited.
                            </p>
                        </div>

                        {/* Disable Parallelization */}
                        <div className="flex items-center justify-between md:col-span-2 pt-4 border-t border-border/50">
                            <div className="space-y-1">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    Disable Parallel Swarm
                                    {config.disable_parallel && (
                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs rounded-full">SLOW MODE</span>
                                    )}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    Force all searches to run sequentially (one by one). Drastically reduces server load and IP bans, but increases wait time (50 states ≈ 5 mins).
                                </p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, disable_parallel: !config.disable_parallel })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.disable_parallel ? 'bg-amber-500' : 'bg-muted'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.disable_parallel ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Feature Flags Section */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Zap className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold">Feature Flags</h2>
                            <p className="text-sm text-muted-foreground">Toggle features on or off</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {/* Maintenance Mode */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    Maintenance Mode
                                    {config.maintenance_mode && (
                                        <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs rounded-full">ACTIVE</span>
                                    )}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                    Disable all API calls. Shows maintenance message to users.
                                </p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, maintenance_mode: !config.maintenance_mode })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.maintenance_mode ? 'bg-red-500' : 'bg-muted'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.maintenance_mode ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Enable Demo Mode */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-sm font-medium">Enable Demo Mode</label>
                                <p className="text-xs text-muted-foreground">
                                    Allow demo queries with hardcoded responses (no API costs).
                                </p>
                            </div>
                            <button
                                onClick={() => setConfig({ ...config, enable_demo_mode: !config.enable_demo_mode })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${config.enable_demo_mode ? 'bg-green-500' : 'bg-muted'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.enable_demo_mode ? 'translate-x-7' : 'translate-x-1'
                                        }`}
                                />
                            </button>
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
