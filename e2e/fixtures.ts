import AxeBuilder from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';

export { expect };

/**
 * Every test fails if the page logs a console error or throws, which is how
 * hydration mismatches, CSP violations and broken assets show up.
 */
export const test = base.extend<{ errors: string[] }>({
    errors: [
        async ({ page }, use) => {
            const errors: string[] = [];
            page.on('console', (msg) => {
                if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
            });
            page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
            await use(errors);
            expect(errors, 'browser errors').toEqual([]);
        },
        { auto: true },
    ],
});

export type Theme = 'light' | 'dark';
export const THEMES: Theme[] = ['light', 'dark'];

/** Opens a page in the given theme, the way a first-time visitor's OS would choose it. */
export async function visit(page: Page, path: string, theme: Theme = 'light') {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
    const response = await page.goto(path);
    await expect(page.locator('html')).toHaveClass(theme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/);
    return response;
}

/** WCAG 2.2 A/AA checks with axe. Returns readable violation summaries. */
export async function a11yViolations(page: Page) {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();

    return results.violations.map((v) => `${v.impact} ${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(' | ')}`);
}

/** True if anything is wider than the viewport (sideways scrolling on a phone). */
export async function hasHorizontalOverflow(page: Page) {
    return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1440) < 768;
