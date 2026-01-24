import { test, expect } from '@playwright/test';

/**
 * Demo Video: The Full Tour
 * 
 * This test creates a high-quality demo video showcasing Lawvics's features.
 * The slowMo setting in playwright.config.ts ensures actions are human-paced.
 * 
 * Video will be saved to: test-results/demo-video-The-Full-Tour-chromium/video.webm
 */
test('The Full Tour', async ({ page }) => {
    // =========================================================
    // 1. Landing Page - Enjoy the Infinite Grid Animation
    // =========================================================
    await page.goto('/');

    // Wait for the Infinite Grid hero animation to play
    await expect(page.locator('h1')).toContainText('Lawvics');
    await page.waitForTimeout(3000); // Let the animation breathe

    // =========================================================
    // 2. Enter the App - Click "Launch Console"
    // =========================================================
    await page.click('text=Launch Console');

    // Wait for dashboard to load
    await expect(page.locator('text=Geospatial')).toBeVisible();
    await page.waitForTimeout(2000); // Take in the dashboard

    // =========================================================
    // 3. Search - Run a 50-State Survey
    // =========================================================
    const searchInput = page.locator('input[placeholder*="Statute of limitations"]');
    await searchInput.fill('Statute of limitations for fraud');
    await page.waitForTimeout(500); // Let the typing settle

    // Press Enter to search
    await searchInput.press('Enter');

    // =========================================================
    // 4. Observe - Watch the Map Animate
    // =========================================================
    // Wait for the map to potentially update with results
    await page.waitForTimeout(5000); // Watch the parallel processing

    // =========================================================
    // 5. Interact - Click on a State (Texas)
    // =========================================================
    // Try to click on the Texas region of the map
    // The map uses SVG paths, so we'll click by position or find the Geography element
    try {
        // First, try to find and click the map container, then a state
        const mapContainer = page.locator('.flex-1.bg-card.border.border-border.rounded-lg');
        await mapContainer.click({ position: { x: 380, y: 280 } }); // Approximate TX position
    } catch {
        // Fallback: just click somewhere on the map area
        await page.click('text=Progress:');
    }

    await page.waitForTimeout(2000); // View the state details panel

    // =========================================================
    // 6. Explore Views - Switch to Matrix View
    // =========================================================
    await page.click('text=Matrix View');
    await page.waitForTimeout(2000); // View the matrix

    // Switch to Analytics View
    await page.click('text=Analytics');
    await page.waitForTimeout(2000); // View analytics

    // Back to Geospatial
    await page.click('text=Geospatial');
    await page.waitForTimeout(1000);

    // =========================================================
    // 7. Toggle Theme - Show off Dark Mode
    // =========================================================
    // Click the theme toggle button (Sun/Moon icon)
    const themeToggle = page.locator('button[title*="Mode"]');
    await themeToggle.click();
    await page.waitForTimeout(2000); // Admire dark mode

    // Toggle back to light
    await themeToggle.click();
    await page.waitForTimeout(1000);

    // =========================================================
    // 8. Settings - Open the Settings Modal
    // =========================================================
    const settingsButton = page.locator('button[title="Settings"]');
    await settingsButton.click();

    // Wait for modal to open
    await expect(page.locator('text=Preferences')).toBeVisible();
    await page.waitForTimeout(2000); // View the settings

    // Toggle a setting for visual effect
    await page.click('text=Auto-Verification');
    await page.waitForTimeout(1000);

    // Close the modal
    await page.click('text=Save Preferences');
    await page.waitForTimeout(1000);

    // =========================================================
    // 9. Navigate - Visit History Page
    // =========================================================
    await page.click('text=History');
    await page.waitForTimeout(2000); // View history (likely empty state)

    // =========================================================
    // 10. Navigate - Visit Settings Page
    // =========================================================
    await page.click('a[href="/dashboard/settings"]');
    await page.waitForTimeout(2000); // View full settings page

    // Return to workspace
    await page.click('text=Workspace');
    await page.waitForTimeout(2000);

    // =========================================================
    // Final - End with a nice view of the dashboard
    // =========================================================
    await page.waitForTimeout(2000); // Final pause for ending

    console.log('✅ Demo video recording complete!');
});
