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

/** The site's colour themes (App\\Support\\Themes). */
export type Theme = 'dark' | 'light' | 'midnight' | 'aurora' | 'ember' | 'paper';
/** Every page is tested in these two; all themes get an axe pass on the home page. */
export const THEMES: Theme[] = ['dark', 'light'];
export const ALL_THEMES: Theme[] = ['dark', 'light', 'midnight', 'aurora', 'ember', 'paper'];
export const DARK_THEMES: Theme[] = ['dark', 'midnight', 'aurora', 'ember'];

/**
 * Opens a page in the given theme, as if the visitor had picked it before.
 * Only set when nothing is saved yet, so a test can still switch and reload.
 */
export async function visit(page: Page, path: string, theme: Theme = 'dark') {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript((t) => {
        try {
            if (!localStorage.getItem('theme')) localStorage.setItem('theme', t);
        } catch {
            // Storage blocked: the site default applies.
        }
    }, theme);
    const response = await page.goto(path);
    if (!path.startsWith('/admin')) {
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(page.locator('html')).toHaveClass(DARK_THEMES.includes(theme) ? /\bdark\b/ : /^(?!.*\bdark\b)/);
    }
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
