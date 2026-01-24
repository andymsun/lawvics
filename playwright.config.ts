import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for demo video recording.
 * 
 * This config is optimized for creating watchable demo videos:
 * - slowMo: 1500ms delay between actions for human-paced viewing
 * - video: 'on' to record every test run
 * - 1920x1080 viewport for high-quality recordings
 */
export default defineConfig({
    testDir: './e2e',

    // Run tests sequentially for consistent demo recordings
    fullyParallel: false,

    // No retries for demo recording
    retries: 0,

    // Single worker for clean recording  
    workers: 1,

    // Use HTML reporter for easy viewing
    reporter: [['html', { open: 'never' }]],

    use: {
        // Base URL for the local dev server
        baseURL: 'http://localhost:3000',

        // Record video for every test run
        video: 'on',

        // Full HD viewport for crisp recordings
        viewport: { width: 1920, height: 1080 },

        // CRITICAL: Slow down actions for watchable demo
        launchOptions: {
            slowMo: 1500,
        },

        // Capture screenshots on failure
        screenshot: 'only-on-failure',

        // Capture trace on first retry
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Start the dev server before tests if not already running
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
});
