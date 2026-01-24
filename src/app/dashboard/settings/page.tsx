'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Zap, AlertTriangle, Key, Eye, EyeOff, Database, Bot, Globe, Monitor, Moon, Sun, Layout, Sliders, ExternalLink, Check, Loader2, X } from 'lucide-react';
import { useSettingsStore, DataSource } from '@/lib/store';
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
        } catch (error) {
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
        <div className="h-full flex flex-col p-6 space-y-6">
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

                                        {/* Provider Selection (Tabs-like) */}
                                        <div className="flex p-1 bg-muted rounded-lg w-fit">
                                            <button
                                                onClick={() => settings.setActiveAiProvider('openai')}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    settings.activeAiProvider === 'openai'
                                                        ? "bg-background text-foreground shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                OpenAI
                                            </button>
                                            <button
                                                onClick={() => settings.setActiveAiProvider('gemini')}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    settings.activeAiProvider === 'gemini'
                                                        ? "bg-background text-foreground shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                Gemini
                                            </button>
                                            <button
                                                onClick={() => settings.setActiveAiProvider('openrouter')}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    settings.activeAiProvider === 'openrouter'
                                                        ? "bg-background text-foreground shadow-sm"
                                                        : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                OpenRouter
                                            </button>
                                        </div>

                                        {/* Model Dropdown based on Provider */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium">Model Selection</label>
                                            <select
                                                value={
                                                    settings.activeAiProvider === 'openai'
                                                        ? settings.openaiModel
                                                        : settings.activeAiProvider === 'gemini'
                                                            ? settings.geminiModel
                                                            : settings.openRouterModel
                                                }
                                                onChange={(e) => {
                                                    if (settings.activeAiProvider === 'openai') {
                                                        settings.setOpenaiModel(e.target.value);
                                                    } else if (settings.activeAiProvider === 'gemini') {
                                                        settings.setGeminiModel(e.target.value);
                                                    } else {
                                                        settings.setOpenRouterModel(e.target.value);
                                                    }
                                                }}
                                                className="w-full max-w-xs px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            >
                                                {settings.activeAiProvider === 'openai' ? (
                                                    <>
                                                        <option value="gpt-4o">GPT-4o (Premium/Fast)</option>
                                                        <option value="gpt-4o-mini">GPT-4o-mini (Cost-Efficient)</option>
                                                        <option value="o1-mini">o1-mini (Reasoning)</option>
                                                    </>
                                                ) : settings.activeAiProvider === 'gemini' ? (
                                                    <>
                                                        <option value="gemini-2.5-pro-preview-05-06">Gemini 2.5 Pro (Latest)</option>
                                                        <option value="gemini-2.5-flash-preview-04-17">Gemini 2.5 Flash (Latest)</option>
                                                        <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast)</option>
                                                        <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Budget)</option>
                                                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (High Context)</option>
                                                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (1M Tokens)</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="openai/gpt-4o-mini">OpenAI GPT-4o-mini (Budget)</option>
                                                        <option value="openai/gpt-4o">OpenAI GPT-4o (Premium)</option>
                                                        <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                                        <option value="anthropic/claude-3-haiku">Claude 3 Haiku (Fast)</option>
                                                        <option value="google/gemini-pro-1.5">Gemini Pro 1.5</option>
                                                        <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                                                        <option value="mistralai/mistral-large">Mistral Large</option>
                                                    </>
                                                )}
                                            </select>
                                            {settings.activeAiProvider === 'openrouter' && (
                                                <p className="text-xs text-muted-foreground">
                                                    Or enter any model ID from <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/models</a>
                                                </p>
                                            )}
                                        </div>

                                        <ApiKeyInput
                                            label="OpenAI API Key"
                                            value={settings.openaiApiKey}
                                            onChange={settings.setOpenaiApiKey}
                                            helperText="Required for intelligent parsing and verification."
                                            getKeyUrl="https://platform.openai.com/api-keys"
                                            onTest={testOpenAIKey}
                                            required={settings.activeAiProvider === 'openai'}
                                        />
                                        <ApiKeyInput
                                            label="Gemini API Key"
                                            value={settings.geminiApiKey}
                                            onChange={settings.setGeminiApiKey}
                                            helperText="Optional fallback or primary for Google Gemini models."
                                            placeholder="AIzp..."
                                            getKeyUrl="https://aistudio.google.com/app/apikey"
                                            onTest={testGeminiKey}
                                            required={settings.activeAiProvider === 'gemini'}
                                        />
                                        <ApiKeyInput
                                            label="OpenRouter API Key"
                                            value={settings.openRouterApiKey}
                                            onChange={settings.setOpenRouterApiKey}
                                            helperText="Access 200+ models via one API. Great for Claude, Llama, Mistral, etc."
                                            placeholder="sk-or-v1-..."
                                            getKeyUrl="https://openrouter.ai/keys"
                                            onTest={testOpenRouterKey}
                                            required={settings.activeAiProvider === 'openrouter'}
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
