import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { LegalStore, StateResult, Statute } from '@/types/legal';
import { StateCode, Statute as StatuteType } from '@/types/statute';
import type { ReactNode } from 'react';

// Re-export useShallow for consumers
export { useShallow };

// ============================================================
// Statute Store (useStatuteStore)
// ============================================================

/** Entry in the statute store: either a valid Statute or an Error */
export type StatuteEntry = StatuteType | Error;

/** All 50 US State Codes */
export const ALL_STATE_CODES: readonly StateCode[] = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

const TOTAL_STATES = 50;

interface StatuteStoreState {
    /** Map of StateCode to Statute or Error */
    statutes: Partial<Record<StateCode, StatuteEntry>>;
}

interface StatuteStoreActions {
    /** Set a successful statute result for a state */
    setStatute: (state: StateCode, data: StatuteType) => void;
    /** Set an error result for a state */
    setError: (state: StateCode, error: Error) => void;
    /** Reset all state data */
    resetAll: () => void;
}

export type StatuteStore = StatuteStoreState & StatuteStoreActions;

export const useStatuteStore = create<StatuteStore>((set) => ({
    statutes: {},

    setStatute: (stateCode, data) =>
        set((state) => ({
            statutes: { ...state.statutes, [stateCode]: data }
        })),

    setError: (stateCode, error) =>
        set((state) => ({
            statutes: { ...state.statutes, [stateCode]: error }
        })),

    resetAll: () => set({ statutes: {} })
}));

/** Selector: Get the percentage of states that have returned data (0-100) */
export const getPercentComplete = (state: StatuteStore): number => {
    const count = Object.keys(state.statutes).length;
    return Math.round((count / TOTAL_STATES) * 100);
};

// ============================================================
// Notification Store (useNotificationStore)
// ============================================================

export interface Activity {
    id: number;
    icon: 'survey' | 'error' | 'success' | 'info';
    title: string;
    description: string;
    time: string;
    timestamp: number;
}

interface NotificationStoreState {
    notifications: Activity[];
}

interface NotificationStoreActions {
    addNotification: (notification: Omit<Activity, 'id' | 'timestamp'>) => void;
    clearNotifications: () => void;
    removeNotification: (id: number) => void;
}

export type NotificationStore = NotificationStoreState & NotificationStoreActions;

let notificationId = 0;

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],

    addNotification: (notification) =>
        set((state) => ({
            notifications: [
                {
                    ...notification,
                    id: ++notificationId,
                    timestamp: Date.now(),
                },
                ...state.notifications,
            ].slice(0, 20), // Keep max 20 notifications
        })),

    clearNotifications: () => set({ notifications: [] }),

    removeNotification: (id) =>
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        })),
}));

// ============================================================
// Survey History Store (useSurveyHistoryStore)
// ============================================================

/** Maximum concurrent surveys allowed */
export const MAX_CONCURRENT_SURVEYS = 5;

export interface SurveyRecord {
    id: number;
    query: string;
    startedAt: number;
    completedAt?: number;
    successCount: number;
    errorCount: number;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    /** Per-session statute data - each survey owns its results */
    statutes: Partial<Record<StateCode, StatuteEntry>>;
}

interface SurveyHistoryState {
    surveys: SurveyRecord[];
    activeSurveyId: number | null;
    activeStateCode: StateCode | null;
}

interface SurveyHistoryActions {
    startSurvey: (query: string) => number;
    updateSurvey: (id: number, update: Partial<SurveyRecord>) => void;
    completeSurvey: (id: number, successCount: number, errorCount: number) => void;
    setActiveSurvey: (id: number | null) => void;
    setActiveState: (code: StateCode | null) => void;
    /** Set a statute result for a specific session */
    setSessionStatute: (surveyId: number, stateCode: StateCode, data: StatuteType) => void;
    /** Set an error for a specific session */
    setSessionError: (surveyId: number, stateCode: StateCode, error: Error) => void;
    /** Cancel a running survey */
    cancelSurvey: (id: number) => void;
}

export type SurveyHistoryStore = SurveyHistoryState & SurveyHistoryActions;

let surveyId = 100; // Start from 100 for "Survey #101" etc.

export const useSurveyHistoryStore = create<SurveyHistoryStore>((set, get) => ({
    surveys: [],
    activeSurveyId: null,
    activeStateCode: null,

    startSurvey: (query) => {
        const id = ++surveyId;
        const survey: SurveyRecord = {
            id,
            query,
            startedAt: Date.now(),
            successCount: 0,
            errorCount: 0,
            status: 'running',
            statutes: {}, // Initialize empty statutes map
        };
        set((state) => ({
            surveys: [survey, ...state.surveys].slice(0, 50), // Keep max 50
            activeSurveyId: id,
        }));
        return id;
    },

    updateSurvey: (id, update) =>
        set((state) => ({
            surveys: state.surveys.map((s) =>
                s.id === id ? { ...s, ...update } : s
            ),
        })),

    completeSurvey: (id, successCount, errorCount) => {
        set((state) => ({
            surveys: state.surveys.map((s) =>
                s.id === id
                    ? {
                        ...s,
                        completedAt: Date.now(),
                        successCount,
                        errorCount,
                        status: errorCount > successCount ? 'failed' : 'completed',
                    }
                    : s
            ),
        }));

        // Add notification
        const survey = get().surveys.find((s) => s.id === id);
        if (survey) {
            useNotificationStore.getState().addNotification({
                icon: errorCount > successCount ? 'error' : 'success',
                title: `Survey #${id} Completed`,
                description: `${successCount} states verified, ${errorCount} errors`,
                time: 'Just now',
            });
        }
    },

    setActiveSurvey: (id) => set({ activeSurveyId: id }),

    setSessionStatute: (surveyId, stateCode, data) =>
        set((state) => ({
            surveys: state.surveys.map((s) =>
                s.id === surveyId
                    ? { ...s, statutes: { ...s.statutes, [stateCode]: data } }
                    : s
            ),
        })),

    setSessionError: (surveyId, stateCode, error) =>
        set((state) => ({
            surveys: state.surveys.map((s) =>
                s.id === surveyId
                    ? { ...s, statutes: { ...s.statutes, [stateCode]: error } }
                    : s
            ),
        })),

    cancelSurvey: (id) => {
        set((state) => ({
            surveys: state.surveys.map((s) =>
                s.id === id ? { ...s, status: 'cancelled', completedAt: Date.now() } : s
            ),
        }));

        useNotificationStore.getState().addNotification({
            icon: 'info',
            title: `Survey #${id} Cancelled`,
            description: `The 50-state survey was stopped by the user.`,
            time: 'Just now',
        });
    },

    // UI Actions
    setActiveState: (code) => set({ activeStateCode: code }),
}));

/** Selector: Count of currently running surveys */
export const getRunningCount = (state: SurveyHistoryStore): number =>
    state.surveys.filter((s) => s.status === 'running').length;

/** Selector: Get statutes for the active session */
export const getActiveSessionStatutes = (state: SurveyHistoryStore): Partial<Record<StateCode, StatuteEntry>> => {
    const activeSurvey = state.surveys.find((s) => s.id === state.activeSurveyId);
    return activeSurvey?.statutes ?? {};
};

/** Selector: Get progress percentage for a specific session */
export const getSessionPercentComplete = (state: SurveyHistoryStore, surveyId: number): number => {
    const survey = state.surveys.find((s) => s.id === surveyId);
    if (!survey) return 0;
    const count = Object.keys(survey.statutes).length;
    return Math.round((count / 50) * 100);
};

// ============================================================
// Legacy Legal Store (useLegalStore)
// ============================================================

interface StoreActions {
    setLoading: (jurisdiction: string) => void;
    setSuccess: (jurisdiction: string, data: Statute) => void;
    setError: (jurisdiction: string, error: string) => void;
    reset: () => void;
}

const initialState: Record<string, StateResult> = {};

// Initialize all 50 states to IDLE
const US_STATES_LEGACY = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

US_STATES_LEGACY.forEach(code => {
    initialState[code] = { status: 'idle', data: null, error: null };
});

export const useLegalStore = create<LegalStore & StoreActions>((set) => ({
    results: initialState,

    setLoading: (jurisdiction) => set((state) => ({
        results: {
            ...state.results,
            [jurisdiction]: { status: 'loading', data: null, error: null }
        }
    })),

    setSuccess: (jurisdiction, data) => set((state) => ({
        results: {
            ...state.results,
            [jurisdiction]: { status: 'success', data, error: null }
        }
    })),

    setError: (jurisdiction, error) => set((state) => ({
        results: {
            ...state.results,
            [jurisdiction]: { status: 'error', data: null, error }
        }
    })),

    reset: () => set({ results: initialState })
}));

// ============================================================
// Settings Store (useSettingsStore)
// ============================================================

export type DataSource = 'mock' | 'llm-scraper' | 'official-api' | 'scraping-proxy';
export type ThemeColor = 'blue' | 'violet' | 'green' | 'rose' | 'orange';

export interface SettingsState {
    /** USource of statute data */
    dataSource: DataSource;
    /** User's OpenAI API key for BYOK (stored in localStorage) */
    openaiApiKey: string;
    /** User's Gemini API key for BYOK */
    geminiApiKey: string;
    /** User's Open States API key for official data */
    openStatesApiKey: string;
    /** User's LegiScan API key for official data */
    legiscanApiKey: string;
    /** User's Scraping Service API key (e.g., ZenRows, ScrapingBee) */
    scrapingApiKey: string;
    /** Enable simultaneous queries across all 50 jurisdictions */
    parallelFetch: boolean;
    /** Automatically run verification checks on returned statutes */
    autoVerify: boolean;
    /** Display confidence percentages and trust badges */
    showConfidence: boolean;
    /** Store verified results locally (experimental) */
    cacheResults: boolean;
    /** Primary theme color */
    themeColor: ThemeColor;
    /** Selected AI provider for scraper */
    activeAiProvider: 'openai' | 'gemini';
    /** Selected OpenAI model */
    openaiModel: string;
    /** Selected Gemini model */
    geminiModel: string;
}

interface SettingsActions {
    /** Set the data source */
    setDataSource: (source: DataSource) => void;
    /** Set the OpenAI API key */
    setOpenaiApiKey: (key: string) => void;
    /** Set the Gemini API key */
    setGeminiApiKey: (key: string) => void;
    /** Set the Open States API key */
    setOpenStatesApiKey: (key: string) => void;

    /** Set the LegiScan API key */
    setLegiscanApiKey: (key: string) => void;
    /** Set the Scraping Service API key */
    setScrapingApiKey: (key: string) => void;
    /** Set the active AI provider */
    setActiveAiProvider: (provider: 'openai' | 'gemini') => void;
    /** Set the OpenAI model */
    setOpenaiModel: (model: string) => void;
    /** Set the Gemini model */
    setGeminiModel: (model: string) => void;
    /** Update any boolean setting */
    setSetting: <K extends keyof Omit<SettingsState, 'dataSource' | 'openaiApiKey' | 'geminiApiKey' | 'openStatesApiKey' | 'legiscanApiKey' | 'scrapingApiKey' | 'themeColor' | 'openaiModel' | 'geminiModel' | 'activeAiProvider'>>(key: K, value: SettingsState[K]) => void;
    /** Toggle a boolean setting */
    toggleSetting: (key: keyof Omit<SettingsState, 'dataSource' | 'openaiApiKey' | 'geminiApiKey' | 'openStatesApiKey' | 'legiscanApiKey' | 'scrapingApiKey' | 'themeColor' | 'openaiModel' | 'geminiModel' | 'activeAiProvider'>) => void;
    /** Set the theme color */
    setThemeColor: (color: ThemeColor) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

const DEFAULT_SETTINGS: SettingsState = {
    dataSource: 'mock',
    openaiApiKey: '',
    geminiApiKey: '',
    openStatesApiKey: '',
    legiscanApiKey: '',
    scrapingApiKey: '',
    parallelFetch: true,
    autoVerify: true,
    showConfidence: true,
    cacheResults: false,
    themeColor: 'blue',
    activeAiProvider: 'openai',
    openaiModel: 'gpt-4o-mini',
    geminiModel: 'gemini-1.5-flash',
};

/**
 * Load settings from localStorage (client-side only)
 */
function loadPersistedSettings(): SettingsState {
    if (typeof window === 'undefined') {
        return DEFAULT_SETTINGS;
    }
    try {
        const stored = localStorage.getItem('lawvics-settings');
        if (stored) {
            // Merge stored settings with defaults to handle new fields
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch {
        // Ignore localStorage errors
    }
    return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage
 */
function persistSettings(settings: SettingsState): void {
    if (typeof window === 'undefined') return;
    try {
        // Only persist state, not actions
        const stateToPersist: Partial<SettingsState> = {
            dataSource: settings.dataSource,
            openaiApiKey: settings.openaiApiKey,
            geminiApiKey: settings.geminiApiKey,
            openStatesApiKey: settings.openStatesApiKey,
            legiscanApiKey: settings.legiscanApiKey,
            scrapingApiKey: settings.scrapingApiKey,
            parallelFetch: settings.parallelFetch,
            autoVerify: settings.autoVerify,
            showConfidence: settings.showConfidence,
            cacheResults: settings.cacheResults,
            themeColor: settings.themeColor,
            activeAiProvider: settings.activeAiProvider,
            openaiModel: settings.openaiModel,
            geminiModel: settings.geminiModel,
        };
        localStorage.setItem('lawvics-settings', JSON.stringify(stateToPersist));
    } catch {
        // Ignore localStorage errors
    }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    ...loadPersistedSettings(),

    setDataSource: (source) => {
        set({ dataSource: source });
        persistSettings(get());
    },

    setOpenaiApiKey: (key) => {
        set({ openaiApiKey: key });
        persistSettings(get());
    },

    setGeminiApiKey: (key) => {
        set({ geminiApiKey: key });
        persistSettings(get());
    },

    setOpenStatesApiKey: (key) => {
        set({ openStatesApiKey: key });
        persistSettings(get());
    },

    setLegiscanApiKey: (key) => {
        set({ legiscanApiKey: key });
        persistSettings(get());
    },

    setScrapingApiKey: (key) => {
        set({ scrapingApiKey: key });
        persistSettings(get());
    },

    setActiveAiProvider: (provider) => {
        set({ activeAiProvider: provider });
        persistSettings(get());
    },

    setOpenaiModel: (model) => {
        set({ openaiModel: model });
        persistSettings(get());
    },

    setGeminiModel: (model) => {
        set({ geminiModel: model });
        persistSettings(get());
    },

    setSetting: (key, value) => {
        set({ [key]: value } as Partial<SettingsState>);
        persistSettings(get());
    },

    toggleSetting: (key) => {
        const current = get()[key];
        set({ [key]: !current } as Partial<SettingsState>);
        persistSettings(get());
    },

    setThemeColor: (color) => {
        set({ themeColor: color });
        persistSettings(get());
    },
}));
