'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Zap, AlertTriangle, Key, Eye, EyeOff, Database, Bot, Globe, Monitor, Moon, Sun, Layout, Sliders, ExternalLink, Check, Loader2, X, Cloud } from 'lucide-react';
import { useSettingsStore, DataSource, SettingsStore } from '@/lib/store';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================
// Premium Toggle Switch Component
// ============================================================

interface PremiumToggleProps {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    warning?: string;
}

const PremiumToggle = ({
    id,
    label,
    description,
    checked,
    onChange,
    disabled = false,
    warning,
}: PremiumToggleProps) => {
    return (
        <div className="relative">
            <label
                htmlFor={id}
                className={`flex items-start gap-6 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
            >
                {/* Toggle Switch Container */}
                <div className="relative flex items-center justify-center mt-1">
                    <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        onChange={onChange}
                        disabled={disabled}
                        className="sr-only"
                    />

                    {/* Custom toggle switch */}
                    <motion.div
                        className={`
                            w-14 h-8 rounded-full flex items-center px-1
                            transition-colors duration-300
                            ${checked
                                ? 'bg-primary'
                                : 'bg-muted border border-border group-hover:border-muted-foreground'
                            }
                        `}
                        whileHover={!disabled ? { scale: 1.02 } : {}}
                        whileTap={!disabled ? { scale: 0.98 } : {}}
                    >
                        <motion.div
                            className={`
                                w-6 h-6 rounded-full shadow-md
                                ${checked ? 'bg-primary-foreground' : 'bg-foreground/80'}
                            `}
                            animate={{ x: checked ? 24 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    </motion.div>

                    {/* Glow effect on hover */}
                    {!disabled && (
                        <motion.div
                            className="absolute inset-0 rounded-full bg-primary opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-md"
                        />
                    )}
                </div>

                {/* Label and Description */}
                <div className="flex-1 space-y-2">
                    <div className="text-foreground font-medium text-lg tracking-wide">
                        {label}
                    </div>
                    {description && (
                        <div className="text-muted-foreground text-sm leading-relaxed">
                            {description}
                        </div>
                    )}
                    {warning && !checked && (
                        <div className="flex items-center gap-2 text-amber-500 text-sm mt-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{warning}</span>
                        </div>
                    )}
                </div>
            </label>
        </div>
    );
};

// ============================================================
// API Key Input Component
// ============================================================

interface ApiKeyInputProps {
    label: string;
    value: string;
    onChange: (key: string) => void;
    placeholder?: string;
    helperText?: string;
    required?: boolean;
    getKeyUrl?: string;
    onTest?: (key: string) => Promise<boolean>;
}

const ApiKeyInput = ({ label, value, onChange, placeholder = "sk-...", helperText, required = false, getKeyUrl, onTest }: ApiKeyInputProps) => {
    const [showKey, setShowKey] = React.useState(false);
    const [isTesting, setIsTesting] = React.useState(false);
    const [testStatus, setTestStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
    const hasKey = value.length > 0;

    const handleTest = async () => {
        if (!onTest || !value) return;
        setIsTesting(true);
        setTestStatus('idle');
        try {
            const success = await onTest(value);
            setTestStatus(success ? 'success' : 'error');
            if (success) {
                toast.success(`${label} verified successfully!`);
            } else {
                toast.error(`Failed to verify ${label}.`);
            }
        } catch {
            setTestStatus('error');
            toast.error(`Error verifying key.`);
        } finally {
            setIsTesting(false);
        }
    };



    return (
        <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-start gap-6">
                <div className="p-2 rounded-lg bg-amber-500/10 mt-1">
                    <Key className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-foreground font-medium text-lg tracking-wide">
                                {label}
                            </div>
                            {helperText && (
                                <div className="text-muted-foreground text-sm leading-relaxed mt-1">
                                    {helperText}
                                </div>
                            )}
                        </div>
                        {getKeyUrl && (
                            <a
                                href={getKeyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                            >
                                Get Key <ExternalLink className="w-3 h-3" />
                            </a>
                        )}
                    </div>

                    {/* Input with visibility toggle and test button */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={value}
                                onChange={(e) => {
                                    onChange(e.target.value);
                                    setTestStatus('idle');
                                }}
                                placeholder={placeholder}
                                className="w-full px-4 py-3 pr-12 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {onTest && (
                            <button
                                onClick={handleTest}
                                disabled={!value || isTesting}
                                className={`
                                    px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                                    ${testStatus === 'success'
                                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                        : testStatus === 'error'
                                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                            : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                                    }
                                    ${(!value || isTesting) ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                {isTesting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : testStatus === 'success' ? (
                                    <>
                                        <Check className="w-4 h-4" /> Verified
                                    </>
                                ) : testStatus === 'error' ? (
                                    <>
                                        <X className="w-4 h-4" /> Failed
                                    </>
                                ) : (
                                    'Test Key'
                                )}
                            </button>
                        )}
                    </div>

                    {/* Warning if empty & required */}
                    {required && !hasKey && (
                        <div className="flex items-center gap-2 text-amber-500 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{label} is required for this mode.</span>
                        </div>
                    )}

                    {/* Security helper text */}
                    <div className="text-xs text-muted-foreground italic">
                        Your key is stored locally in your browser and only used for verification.
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Data Source Selector
// ============================================================

interface DataSourceOption {
    id: DataSource;
    icon: React.ElementType;
    label: string;
    description: string;
}

const DataSourceSelector = () => {
    const { dataSource, setDataSource } = useSettingsStore();

    const sources: DataSourceOption[] = [
        {
            id: 'mock',
            icon: Zap,
            label: 'Mock Data',
            description: 'Instant, free, simulated data. Best for testing UI flows.'
        },
        {
            id: 'llm-scraper',
            icon: Bot,
            label: 'AI Scraper',
            description: 'Deep search using LLMs + Web Browsing. Slow but thorough.'
        },
        {
            id: 'scraping-proxy',
            icon: Globe,
            label: 'Scraping Proxy',
            description: 'Route through ZenRows/ScrapingBee to bypass blocks.'
        },
        {
            id: 'official-api',
            icon: Database,
            label: 'Official APIs',
            description: 'Open States or LegiScan data. Fast, accurate, and structured.'
        },
        {
            id: 'system-api',
            icon: Cloud,
            label: 'System API (Recommended)',
            description: 'Uses pre-configured server-side API keys. No setup needed.'
        }
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sources.map((source) => (
                    <div
                        key={source.id}
                        onClick={() => setDataSource(source.id)}
                        className={`
                            cursor-pointer p-4 rounded-xl border-2 transition-all duration-200
                            flex flex-col gap-3
                            ${dataSource === source.id
                                ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                                : 'border-border bg-card hover:border-muted-foreground/50 hover:bg-muted/30'
                            }
                        `}
                    >
                        <div className={`p-2 w-fit rounded-lg ${dataSource === source.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <source.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-semibold text-foreground">{source.label}</div>
                            <div className="text-xs text-muted-foreground mt-1 leading-snug">{source.description}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================================
// Model Selector Component (with Custom Model Support)
// ============================================================

// Preset models for each provider
const OPENAI_MODELS = [
    { value: 'gpt-4o', label: 'GPT-4o (Premium/Fast)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o-mini (Cost-Efficient)' },
    { value: 'o1-mini', label: 'o1-mini (Reasoning)' },
    { value: 'o3-mini', label: 'o3-mini (Latest Reasoning)' },
];

const GEMINI_MODELS = [
    { value: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro (Latest)' },
    { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash (Latest)' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Fast)' },
    { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (Budget)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (High Context)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (1M Tokens)' },
];

// Fallback models if API fails
const OPENROUTER_FALLBACK_MODELS = [
    { value: 'google/gemma-2-9b-it:free', label: 'Google Gemma 2 9B (Free)' },
    { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)' },
    { value: 'mistralai/mistral-7b-instruct:free', label: 'Mistral 7B (Free)' },
];

// Hook to fetch free OpenRouter models dynamically
interface OpenRouterModel {
    id: string;
    name: string;
    pricing: { prompt: string; completion: string };
    context_length: number;
}

function useOpenRouterFreeModels() {
    const [models, setModels] = React.useState<{ value: string; label: string }[]>(OPENROUTER_FALLBACK_MODELS);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let isMounted = true;

        async function fetchModels() {
            try {
                const res = await fetch('https://openrouter.ai/api/v1/models');
                if (!res.ok) throw new Error('Failed to fetch models');

                const data = await res.json();
                const allModels: OpenRouterModel[] = data.data || [];

                // Filter for free models (prompt and completion cost both "0")
                const freeModels = allModels
                    .filter(m => m.pricing?.prompt === '0' && m.pricing?.completion === '0')
                    .sort((a, b) => (b.context_length || 0) - (a.context_length || 0))
                    .map(m => ({
                        value: m.id,
                        label: `${m.name} (Free)`,
                    }));

                if (isMounted && freeModels.length > 0) {
                    setModels(freeModels);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                    // Keep fallback models
                }
            } finally {
                if (isMounted) setIsLoading(false);
            }
        }

        fetchModels();
        return () => { isMounted = false; };
    }, []);

    return { models, isLoading, error };
}

interface ModelSelectorProps {
    settings: SettingsStore;
    testOpenAIKey: (key: string) => Promise<boolean>;
    testGeminiKey: (key: string) => Promise<boolean>;
    testOpenRouterKey: (key: string) => Promise<boolean>;
}

const ModelSelector = ({ settings, testOpenAIKey, testGeminiKey, testOpenRouterKey }: ModelSelectorProps) => {
    // Fetch dynamic OpenRouter free models
    const { models: openRouterModels, isLoading: isLoadingModels } = useOpenRouterFreeModels();

    // Determine which models list to use based on active provider
    const getModelsList = () => {
        switch (settings.activeAiProvider) {
            case 'openai': return OPENAI_MODELS;
            case 'gemini': return GEMINI_MODELS;
            case 'openrouter': return openRouterModels;
            default: return OPENAI_MODELS;
        }
    };

    // Get current model value for active provider
    const getCurrentModel = () => {
        switch (settings.activeAiProvider) {
            case 'openai': return settings.openaiModel;
            case 'gemini': return settings.geminiModel;
            case 'openrouter': return settings.openRouterModel;
            default: return settings.openaiModel;
        }
    };

    // Set model for active provider
    const setCurrentModel = (value: string) => {
        switch (settings.activeAiProvider) {
            case 'openai': return settings.setOpenaiModel(value);
            case 'gemini': return settings.setGeminiModel(value);
            case 'openrouter': return settings.setOpenRouterModel(value);
        }
    };

    const modelsList = getModelsList();
    const currentModel = getCurrentModel();

    // Check if current model is a preset or custom (stored value not in presets)
    const isStoredCustomModel = !modelsList.some(m => m.value === currentModel) && currentModel !== '';

    // Local state to track if user has clicked "Custom" in dropdown
    const [isCustomSelected, setIsCustomSelected] = React.useState(isStoredCustomModel);

    // Determine what the select should show
    const selectValue = (isCustomSelected || isStoredCustomModel) ? 'custom' : currentModel;

    // Local state for custom model input
    const [customInput, setCustomInput] = React.useState(isStoredCustomModel ? currentModel : '');

    // Update custom input when switching to a custom model that was already set
    React.useEffect(() => {
        if (isStoredCustomModel) {
            setCustomInput(currentModel);
            setIsCustomSelected(true);
        }
    }, [isStoredCustomModel, currentModel]);

    // Reset custom state when switching providers
    React.useEffect(() => {
        const isCurrentCustom = !modelsList.some(m => m.value === currentModel);
        setIsCustomSelected(isCurrentCustom);
        setCustomInput(isCurrentCustom ? currentModel : '');
    }, [settings.activeAiProvider, modelsList, currentModel]);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'custom') {
            // User selected "Custom" - show the input
            setIsCustomSelected(true);
            setCustomInput('');
        } else {
            // User selected a preset model
            setIsCustomSelected(false);
            setCurrentModel(value);
            setCustomInput('');
        }
    };

    const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomInput(value);
        if (value.trim()) {
            setCurrentModel(value.trim());
        }
    };

    // Determine which API key to show
    const getApiKeyConfig = () => {
        switch (settings.activeAiProvider) {
            case 'openai':
                return {
                    label: 'OpenAI API Key',
                    value: settings.openaiApiKey,
                    onChange: settings.setOpenaiApiKey,
                    helperText: 'Required for OpenAI models like GPT-4o.',
                    placeholder: 'sk-...',
                    getKeyUrl: 'https://platform.openai.com/api-keys',
                    onTest: testOpenAIKey,
                };
            case 'gemini':
                return {
                    label: 'Gemini API Key',
                    value: settings.geminiApiKey,
                    onChange: settings.setGeminiApiKey,
                    helperText: 'Required for Google Gemini models.',
                    placeholder: 'AIza...',
                    getKeyUrl: 'https://aistudio.google.com/app/apikey',
                    onTest: testGeminiKey,
                };
            case 'openrouter':
                return {
                    label: 'OpenRouter API Key',
                    value: settings.openRouterApiKey,
                    onChange: settings.setOpenRouterApiKey,
                    helperText: 'Access 200+ models via one API (Claude, Llama, Mistral, etc.)',
                    placeholder: 'sk-or-v1-...',
                    getKeyUrl: 'https://openrouter.ai/keys',
                    onTest: testOpenRouterKey,
                };
            default:
                return {
                    label: 'OpenAI API Key',
                    value: settings.openaiApiKey,
                    onChange: settings.setOpenaiApiKey,
                    helperText: 'Required for OpenAI models like GPT-4o.',
                    placeholder: 'sk-...',
                    getKeyUrl: 'https://platform.openai.com/api-keys',
                    onTest: testOpenAIKey,
                };
        }
    };

    const apiKeyConfig = getApiKeyConfig();

    return (
        <div className="space-y-4">
            {/* Model Selection */}
            <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                    Model Selection
                </label>
                <select
                    value={selectValue}
                    onChange={handleSelectChange}
                    className="w-full max-w-xs px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    {modelsList.map((model) => (
                        <option key={model.value} value={model.value}>
                            {model.label}
                        </option>
                    ))}
                    <option value="custom">Custom Model...</option>
                </select>

                {/* Custom model input */}
                {(selectValue === 'custom' || isCustomSelected) && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <input
                            type="text"
                            value={customInput}
                            onChange={handleCustomInputChange}
                            placeholder={
                                settings.activeAiProvider === 'openai'
                                    ? 'e.g., gpt-4-turbo-preview'
                                    : settings.activeAiProvider === 'gemini'
                                        ? 'e.g., gemini-1.5-pro-latest'
                                        : 'e.g., anthropic/claude-opus-4'
                            }
                            className="w-full max-w-xs px-3 py-2 bg-muted border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground">
                            {settings.activeAiProvider === 'openrouter'
                                ? <>Enter any model ID from <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/models</a></>
                                : 'Enter the exact model identifier from the provider.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Single API Key Input based on Provider */}
            <ApiKeyInput
                label={apiKeyConfig.label}
                value={apiKeyConfig.value}
                onChange={apiKeyConfig.onChange}
                helperText={apiKeyConfig.helperText}
                placeholder={apiKeyConfig.placeholder}
                getKeyUrl={apiKeyConfig.getKeyUrl}
                onTest={apiKeyConfig.onTest}
                required={true}
            />
        </div>
    );
};

// ============================================================
// Settings Page Component
// ============================================================

type TabType = 'datasource' | 'preferences' | 'system';

export default function SettingsPage() {
    const settings = useSettingsStore();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<TabType>('datasource');

    const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
        { id: 'datasource', label: 'Data Source', icon: Database },
        { id: 'preferences', label: 'Search Prefs', icon: Sliders },
        { id: 'system', label: 'System', icon: Monitor },
    ];

    const searchOptions = [
        {
            id: 'parallelFetch',
            label: 'Parallel Fetching',
            description: 'Enable simultaneous queries across all 50 jurisdictions for maximum speed.',
        },
        {
            id: 'autoVerify',
            label: 'Auto-Verification',
            description: 'Automatically run Shepardizing checks on all returned statutes to detect hallucinations.',
        },
        {
            id: 'showConfidence',
            label: 'Confidence Scores',
            description: 'Display confidence percentages and trust badges on statute cards.',
        },
        {
            id: 'cacheResults',
            label: 'Cache Results',
            description: 'Store verified results locally to speed up repeat queries (experimental).',
        }
    ] as const;

    const testOpenAIKey = async (key: string) => {
        try {
            const res = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${key}` }
            });
            return res.ok;
        } catch {
            return false;
        }
    };

    const testGeminiKey = async (key: string) => {
        // Can't easily test without a complex payload, but we can try a list models endpoint if available or just assume non-empty
        // For now, let's just do a basic check or simulate for user
        try {
            // Gemini API check typically requires a specific endpoint with key
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
            return res.ok;
        } catch {
            return false;
        }
    };

    const testOpenStatesKey = async (key: string) => {
        try {
            const res = await fetch('https://v3.openstates.org/jurisdictions', {
                headers: { 'X-API-KEY': key }
            });
            return res.ok;
        } catch {
            return false;
        }
    };

    const testLegiScanKey = async (key: string) => {
        try {
            // LegiScan requires a session call or similar to test.
            // Example ping: https://api.legiscan.com/?key=KEY&op=getSessionList&state=CA
            const res = await fetch(`https://api.legiscan.com/?key=${key}&op=getSessionList&state=CA`);
            const data = await res.json();
            return data.status === 'OK';
        } catch {
            return false;
        }
    };

    const testScrapingKey = async (key: string) => {
        // Can't easily test generic keys without knowing provider.
        // We'll just assume non-empty is a pass for now, or users can verify by running a search.
        return key.length > 5;
    };

    const testOpenRouterKey = async (key: string) => {
        try {
            const res = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { Authorization: `Bearer ${key}` }
            });
            return res.ok;
        } catch {
            return false;
        }
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-6 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                    <p className="text-muted-foreground">Manage your Lawvics engine configuration and preferences.</p>
                </div>
            </div>

            <div className="flex-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                {/* Sidebar / Tabs */}
                <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border p-4 bg-muted/20">
                    <div className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                    ${activeTab === tab.id
                                        ? 'bg-primary/10 text-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }
                                `}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-auto">
                    <AnimatePresence mode="wait">
                        {activeTab === 'datasource' && (
                            <motion.div
                                key="datasource"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6 max-w-3xl"
                            >
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">Data Source</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Choose where Lawvics fetches legal data from.
                                    </p>
                                </div>
                                <DataSourceSelector />

                                {/* API Keys based on Data Source */}
                                {settings.dataSource === 'llm-scraper' && (
                                    <div className="space-y-6 pt-6 border-t border-border animate-in fade-in slide-in-from-top-4">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-1">Model Configuration</h3>
                                            <p className="text-muted-foreground text-sm">
                                                Select which AI provider and specific model to use for scraping.
                                            </p>
                                        </div>

                                        {/* Provider Selection (Dropdown) */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                Select AI Provider
                                            </label>
                                            <select
                                                value={settings.activeAiProvider}
                                                onChange={(e) => settings.setActiveAiProvider(e.target.value as 'openai' | 'gemini' | 'openrouter')}
                                                className="w-full max-w-xs px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                <option value="openai">OpenAI</option>
                                                <option value="gemini">Gemini</option>
                                                <option value="openrouter">OpenRouter</option>
                                            </select>
                                        </div>

                                        {/* Model Dropdown based on Provider */}
                                        <ModelSelector
                                            settings={settings}
                                            testOpenAIKey={testOpenAIKey}
                                            testGeminiKey={testGeminiKey}
                                            testOpenRouterKey={testOpenRouterKey}
                                        />

                                        <div className="pt-4 border-t border-border/50">
                                            <h4 className="text-md font-medium mb-1">Scraping Proxy (Optional)</h4>
                                            <p className="text-muted-foreground text-sm mb-3">
                                                Use a specialized service (ZenRows, ScrapingBee) to bypass strong blocks.
                                            </p>
                                            <ApiKeyInput
                                                label="Scraping Service Key"
                                                value={settings.scrapingApiKey}
                                                onChange={settings.setScrapingApiKey}
                                                helperText="If provided, we'll try to use this for web scraping."
                                                placeholder="Enter ZenRows or ScrapingBee key..."
                                                onTest={testScrapingKey}
                                            />
                                        </div>
                                    </div>
                                )}
                                {settings.dataSource === 'official-api' && (
                                    <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-4">
                                        <ApiKeyInput
                                            label="Open States API Key"
                                            value={settings.openStatesApiKey}
                                            onChange={settings.setOpenStatesApiKey}
                                            helperText="Get a free key at openstates.org"
                                            getKeyUrl="https://openstates.org/accounts/profile/"
                                            onTest={testOpenStatesKey}
                                            placeholder="os_..."
                                        />
                                        <ApiKeyInput
                                            label="LegiScan API Key"
                                            value={settings.legiscanApiKey}
                                            onChange={settings.setLegiscanApiKey}
                                            helperText="Get a free key at legiscan.com (30k queries/mo)"
                                            getKeyUrl="https://legiscan.com/legiscan"
                                            onTest={testLegiScanKey}
                                            placeholder="Your 32-character key"
                                        />
                                        <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                                            <span className="font-semibold text-foreground">Note:</span> Lawvics will try Open States first if both are provided.
                                        </div>
                                    </div>
                                )}
                                {settings.dataSource === 'scraping-proxy' && (
                                    <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-4">
                                        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                                            <span className="font-semibold text-foreground">How it works:</span> Requests are routed through a proxy (e.g., ZenRows) to bypass anti-bot detection. You also need an LLM key (OpenAI or Gemini) to parse the results.
                                        </div>
                                        <ApiKeyInput
                                            label="Scraping Service Key"
                                            value={settings.scrapingApiKey}
                                            onChange={settings.setScrapingApiKey}
                                            helperText="ZenRows, ScrapingBee, or similar"
                                            placeholder="Enter your proxy API key..."
                                            getKeyUrl="https://www.zenrows.com/"
                                            onTest={testScrapingKey}
                                            required={true}
                                        />
                                        <ApiKeyInput
                                            label="OpenAI API Key (for parsing)"
                                            value={settings.openaiApiKey}
                                            onChange={settings.setOpenaiApiKey}
                                            helperText="Used to extract statute from page content"
                                            getKeyUrl="https://platform.openai.com/api-keys"
                                            onTest={testOpenAIKey}
                                        />
                                        <ApiKeyInput
                                            label="Gemini API Key (alternative)"
                                            value={settings.geminiApiKey}
                                            onChange={settings.setGeminiApiKey}
                                            helperText="Use if you prefer Gemini for parsing"
                                            placeholder="AIzp..."
                                            getKeyUrl="https://aistudio.google.com/app/apikey"
                                            onTest={testGeminiKey}
                                        />
                                    </div>
                                )}

                                {settings.dataSource === 'system-api' && (
                                    <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-4">
                                        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                                            <span className="font-semibold text-foreground">Note:</span> System API uses the server-configured API key by default. You can override it here if needed.
                                        </div>

                                        <ApiKeyInput
                                            label="OpenRouter API Key (Override)"
                                            value={settings.openRouterApiKey}
                                            onChange={settings.setOpenRouterApiKey}
                                            helperText="Leave empty to use the system default."
                                            placeholder="sk-or-v1-..."
                                            getKeyUrl="https://openrouter.ai/keys"
                                            onTest={testOpenRouterKey}
                                            required={false}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === 'preferences' && (
                            <motion.div
                                key="preferences"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8 max-w-3xl"
                            >
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">Search Preferences</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Fine-tune the search engine behavior and performance.
                                    </p>
                                </div>
                                {searchOptions.map((option) => (
                                    <PremiumToggle
                                        key={option.id}
                                        id={option.id}
                                        label={option.label}
                                        description={option.description}
                                        checked={settings[option.id] as boolean}
                                        onChange={() => settings.toggleSetting(option.id)}
                                    />
                                ))}

                                {/* Batch Size Configuration */}
                                <div className="space-y-4 pt-6 border-t border-border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium flex items-center gap-2">
                                                <Database className="w-4 h-4 text-primary" />
                                                Batch Size Limit
                                            </h3>
                                            <p className="text-sm text-muted-foreground max-w-md mt-1">
                                                Control how many states are processed in a single API call.
                                                Lower values increase accuracy but take longer.
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-bold font-mono text-primary">
                                                {settings.batchSize}
                                            </span>
                                            <span className="text-xs text-muted-foreground block">
                                                states/batch
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="relative pt-6">
                                            {/* Custom Range Slider */}
                                            <input
                                                type="range"
                                                min="1"
                                                max="50"
                                                step="1"
                                                value={settings.batchSize}
                                                onChange={(e) => settings.setBatchSize(parseInt(e.target.value))}
                                                className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 accent-primary"
                                                style={{
                                                    backgroundSize: `${((settings.batchSize - 1) * 100) / 49}% 100%`
                                                }}
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-2 font-medium">
                                                <span>1 State (Max Quality)</span>
                                                <span>25 States</span>
                                                <span>50 States (Max Speed)</span>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-muted/40 border border-border/50 rounded-lg text-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="p-1.5 bg-primary/10 rounded-md mt-0.5">
                                                    <Zap className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-medium text-foreground">
                                                        Estimated Performance
                                                    </p>
                                                    <p className="text-muted-foreground leading-relaxed">
                                                        {settings.batchSize === 50
                                                            ? "Executes 1 massive API call. Fastest method, but LLMs may hallucinate details when processing 50 states at once."
                                                            : settings.batchSize === 1
                                                                ? "Executes 50 individual API calls. Extremely thorough and allows for real-time scraping per state, but much slower."
                                                                : `Executes ${Math.ceil(50 / settings.batchSize)} batches of ~${settings.batchSize} states each. A balance between specficity and speed.`}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'system' && (
                            <motion.div
                                key="system"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-8 max-w-3xl"
                            >
                                <div>
                                    <h2 className="text-xl font-semibold mb-1">System</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Customize the look and feel of the application.
                                    </p>
                                </div>

                                {/* Theme Toggle */}
                                <div className="space-y-4">
                                    <label className="text-foreground font-medium text-lg tracking-wide flex items-center gap-2">
                                        <Layout className="w-5 h-5 text-primary" />
                                        Mode
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                                                }`}
                                        >
                                            <Sun className="w-6 h-6" />
                                            <span className="text-sm font-medium">Light</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                                                }`}
                                        >
                                            <Moon className="w-6 h-6" />
                                            <span className="text-sm font-medium">Dark</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme('system')}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                                                }`}
                                        >
                                            <Monitor className="w-6 h-6" />
                                            <span className="text-sm font-medium">System</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Color Theme Picker */}
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div className="flex items-center justify-between">
                                        <label className="text-foreground font-medium text-lg tracking-wide flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-primary" />
                                            Primary Color
                                        </label>
                                        {settings.themeColor !== 'blue' && (
                                            <button
                                                onClick={() => settings.setThemeColor('blue')}
                                                className="text-xs text-primary hover:underline"
                                            >
                                                Reset to Default
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-5 gap-4">
                                        {(['blue', 'violet', 'green', 'rose', 'orange'] as const).map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => settings.setThemeColor(color)}
                                                className={`
                                                    group relative p-2 rounded-xl border-2 transition-all duration-200 aspect-square flex items-center justify-center
                                                    ${settings.themeColor === color
                                                        ? 'border-primary bg-muted shadow-md scale-105'
                                                        : 'border-border hover:border-border/80 hover:scale-105'
                                                    }
                                                `}
                                                title={color.charAt(0).toUpperCase() + color.slice(1)}
                                            >
                                                <div
                                                    className="w-full h-full rounded-lg shadow-sm"
                                                    style={{
                                                        background: color === 'blue' ? '#3b82f6' :
                                                            color === 'violet' ? '#7c3aed' :
                                                                color === 'green' ? '#10b981' :
                                                                    color === 'rose' ? '#f43f5e' : '#f97316'
                                                    }}
                                                />
                                                {settings.themeColor === color && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        <Check className="w-6 h-6 text-white drop-shadow-md" strokeWidth={3} />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Select an accent color for the entire application.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
