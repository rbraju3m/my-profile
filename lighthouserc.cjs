/**
 * Lighthouse CI: budgets for the public pages, measured on the built site
 * with SSR (scripts/e2e-server.sh). Run with `npm run lighthouse`.
 */
module.exports = {
    ci: {
        collect: {
            startServerCommand: 'scripts/e2e-server.sh',
            startServerReadyPattern: 'Inertia SSR server started',
            startServerReadyTimeout: 60000,
            url: ['http://127.0.0.1:8124/', 'http://127.0.0.1:8124/projects', 'http://127.0.0.1:8124/projects/orbito-erp'],
            numberOfRuns: 3,
            settings: {
                chromeFlags: '--no-sandbox --headless=new',
                // The test server is local on purpose; robots.txt blocks crawling outside production.
                skipAudits: ['is-crawlable', 'uses-http2', 'redirects-http'],
            },
        },
        assert: {
            assertions: {
                // Measured Nov 2026 (mobile emulation, 4x CPU throttle): home 0.84-0.93 across runs
                // (median ~0.87-0.92), /projects 0.97-1.0, case study 0.99-1.0. The floor sits below
                // the home page's run-to-run noise so CI is not flaky. See docs/phase-5-testing.md.
                'categories:performance': ['error', { minScore: 0.85, aggregationMethod: 'median' }],
                'categories:accessibility': ['error', { minScore: 1 }],
                'categories:best-practices': ['error', { minScore: 0.95 }],
                'categories:seo': ['error', { minScore: 0.95 }],
                'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-blocking-time': ['warn', { maxNumericValue: 300, aggregationMethod: 'median' }],
            },
        },
        upload: { target: 'filesystem', outputDir: '.lighthouseci' },
    },
};
