import { a11yViolations, ALL_THEMES, expect, hasHorizontalOverflow, isMobile, test, THEMES, visit } from './fixtures';

const PAGES = [
    { path: '/', heading: 'Building scalable software for real-world problems.' },
    { path: '/projects', heading: 'Selected work' },
    { path: '/projects/orbito-erp', heading: 'Orbito ERP' },
    { path: '/projects/ultrasound-dicom-integration', heading: /ultrasound/i },
];

for (const theme of THEMES) {
    test.describe(`${theme} theme`, () => {
        for (const { path, heading } of PAGES) {
            test(`${path} renders, fits the screen and passes axe`, async ({ page }) => {
                const response = await visit(page, path, theme);
                expect(response?.status()).toBe(200);

                await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
                expect(await hasHorizontalOverflow(page), 'sideways scrolling').toBe(false);
                // Content clipped by an overflow-hidden section doesn't scroll sideways, so check the heading fits too.
                const box = await page.getByRole('heading', { level: 1 }).boundingBox();
                expect((box?.x ?? 0) + (box?.width ?? 0), 'heading fits the screen').toBeLessThanOrEqual(page.viewportSize()!.width);
                expect(await a11yViolations(page)).toEqual([]);
            });
        }

        test('the 404 page is branded and passes axe', async ({ page, errors }) => {
            const response = await visit(page, '/no-such-page', theme);
            expect(response?.status()).toBe(404);
            // The browser logs the 404 of the page itself; that one is expected.
            errors.splice(0, errors.length, ...errors.filter((e) => !e.includes('status of 404')));

            await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
            await expect(page).toHaveTitle(/^Page not found · /);
            expect(await a11yViolations(page)).toEqual([]);
        });
    });
}

test('pages are server-rendered, so content is in the HTML before JavaScript runs', async ({ request }) => {
    const html = await (await request.get('/projects/orbito-erp')).text();

    expect(html).toMatch(/<div data-server-rendered="true" id="app">\s*<[a-z]/);
    expect(html).toContain('Orbito ERP');
    expect(html).toContain('<link rel="canonical"');
});

test('contact details are decoded in the browser but absent from the HTML', async ({ page, request }) => {
    const html = await (await request.get('/')).text();
    expect(html).not.toContain('rbraju3m@gmail.com');

    await visit(page, '/#contact');
    await expect(page.getByRole('link', { name: /rbraju3m@gmail\.com/ })).toHaveAttribute('href', 'mailto:rbraju3m@gmail.com');
});

for (const theme of ALL_THEMES.filter((t) => !THEMES.includes(t))) {
    test(`the ${theme} theme passes axe (contrast included)`, async ({ page }) => {
        await visit(page, '/', theme);
        // Below-the-fold sections hydrate as they near the viewport; bring them all in.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.evaluate(() => window.scrollTo(0, 0));
        expect(await a11yViolations(page)).toEqual([]);
    });
}

test('a first visit gets the dark theme, whatever the device prefers', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
});

test('the theme picker switches theme and remembers it', async ({ page }) => {
    test.skip(isMobile(page), 'the header picker; phones also get it in the menu');
    await visit(page, '/', 'dark');

    const picker = page.getByRole('button', { name: 'Theme', exact: true });
    await picker.click();
    await page.getByRole('button', { name: 'Midnight' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight');
    await expect(picker).toBeFocused();

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight');

    await picker.click();
    await page.getByRole('button', { name: 'Paper' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
});

test('the theme picker closes with Escape and on a click outside', async ({ page }) => {
    test.skip(isMobile(page), 'desktop header');
    await visit(page, '/');

    const picker = page.getByRole('button', { name: 'Theme', exact: true });
    await picker.click();
    await expect(page.getByRole('button', { name: 'Aurora' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Aurora' })).toBeHidden();
    await expect(picker).toBeFocused();

    await picker.click();
    await page.locator('h1').click();
    await expect(page.getByRole('button', { name: 'Aurora' })).toBeHidden();
});

test('on phones the menu offers the themes too', async ({ page }) => {
    test.skip(!isMobile(page), 'phones only');
    await visit(page, '/');

    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('#mobile-menu').getByRole('button', { name: 'Ember' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'ember');
    await expect(page.locator('#mobile-menu').getByRole('button', { name: 'Ember' })).toHaveAttribute('aria-pressed', 'true');
});

test('the mobile menu opens, navigates and closes with Escape', async ({ page }) => {
    test.skip(!isMobile(page), 'phones only');
    await visit(page, '/');

    const toggle = page.getByRole('button', { name: 'Open menu' });
    await toggle.click();
    const menu = page.getByRole('navigation', { name: 'Mobile' });
    await expect(menu).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await menu.getByRole('link', { name: 'Contact' }).click();
    await expect(menu).toBeHidden();
    await expect(page.locator('#contact')).toBeInViewport();
});

test('project filters narrow the list and are kept in a shareable URL', async ({ page }) => {
    await visit(page, '/projects');
    const cards = page.locator('main article');
    const total = await cards.count();
    expect(total).toBe(20);

    await page.getByRole('searchbox').fill('ultrasound');
    await expect(cards).not.toHaveCount(total);
    await expect(page).toHaveURL(/[?&]q=ultrasound/);
    const filtered = await cards.count();
    expect(filtered).toBeGreaterThan(0);

    // The same URL renders the same list on a fresh load (server and browser agree).
    await page.reload();
    await expect(cards).toHaveCount(filtered);
    await expect(page.getByRole('searchbox')).toHaveValue('ultrasound');
});

// #projects is a deferred section: this click lands before or after it hydrates, and must work either way.
test('opening a case study from the home page updates the title', async ({ page }) => {
    await visit(page, '/');
    await page.locator('#projects').getByRole('link', { name: 'Orbito ERP' }).first().click();

    await expect(page).toHaveURL(/\/projects\/orbito-erp$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Orbito ERP');
    await expect(page).toHaveTitle(/^Orbito ERP/);
});

test('the skip link moves focus to the main content', async ({ page }) => {
    test.skip(isMobile(page), 'keyboard navigation');
    await visit(page, '/');

    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
});

test('security headers and a CSP nonce reach the browser, also from the page cache', async ({ request }) => {
    for (let i = 0; i < 2; i++) {
        const response = await request.get('/projects');
        const csp = response.headers()['content-security-policy'] ?? '';
        const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];

        expect(nonce).toBeTruthy();
        expect(await response.text()).toContain(`nonce="${nonce}"`);
        expect(response.headers()['x-frame-options']).toBe('DENY');
    }
});

test('every section of the home page becomes visible and interactive as you scroll', async ({ page, isMobile }) => {
    // On phones the page is ~19,000px tall, so the 300px scroll steps alone take
    // ~25 s on a busy machine: triple the timeout there (test.slow).
    test.slow(isMobile, 'long page on phone screens: many scroll steps');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');

    // Scroll down the way a visitor does; deferred sections hydrate as they approach.
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= height; y += 300) {
        await page.evaluate((top) => window.scrollTo(0, top), y);
        await page.waitForTimeout(40);
    }
    await expect(page.locator('[data-reveal]:not([data-revealed])')).toHaveCount(0);

    // The contact form, last on the page, is hydrated: browser validation runs.
    await page.locator('#contact form').getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('#contact form').getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
});
