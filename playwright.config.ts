import { defineConfig, devices } from '@playwright/test';

import { appEnv, BASE_URL, SSR_PORT } from './e2e/env';

/**
 * Browser tests against the built site (`npm run build` first), served by
 * PHP's built-in server with the SSR process alongside, like production.
 *
 * Three screen sizes in Chromium, plus desktop Firefox and desktop/mobile
 * WebKit. Each spec covers light and dark themes itself.
 */
export default defineConfig({
    testDir: 'e2e',
    globalSetup: './e2e/global-setup.ts',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : 4,
    reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
        { name: 'chromium-tablet', use: { ...devices['Desktop Chrome'], viewport: { width: 820, height: 1180 }, hasTouch: true } },
        { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
        { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], viewport: { width: 1440, height: 900 } } },
        { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], viewport: { width: 1440, height: 900 } } },
        { name: 'webkit-mobile', use: { ...devices['iPhone 15'] } },
    ],
    webServer: [
        {
            // Its own port, so a dev SSR server (13714) is never reused with a stale bundle.
            command: 'node bootstrap/ssr/ssr.js',
            url: `http://127.0.0.1:${SSR_PORT}/health`,
            env: appEnv,
            reuseExistingServer: false,
        },
        {
            // Laravel's router script expects to run from public/.
            command: `php -S 127.0.0.1:${new URL(BASE_URL).port} ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php`,
            cwd: 'public',
            url: `${BASE_URL}/up`,
            stderr: 'ignore', // one access-log line per request
            env: appEnv,
            reuseExistingServer: false,
        },
    ],
});
