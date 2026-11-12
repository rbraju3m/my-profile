import { ADMIN } from './env';
import { a11yViolations, expect, test, visit } from './fixtures';

test('the admin login page passes axe', async ({ page }) => {
    await visit(page, '/admin/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    expect(await a11yViolations(page)).toEqual([]);
});

test('an edit in the admin shows on the public site straight away (page cache cleared)', async ({ page }, testInfo) => {
    // One project only: all projects share one database, and this test changes it.
    test.skip(testInfo.project.name !== 'chromium-desktop', 'changes shared data');

    // Warm the page cache first, so the test proves the save clears it.
    await visit(page, '/');
    await visit(page, '/');

    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN.email);
    await page.locator('input[type="password"]').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);

    await page.goto('/admin/settings/footer');
    const tagline = `Footer changed by the browser tests ${Date.now()}`;
    await page.getByLabel(/tagline/i).fill(tagline);
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Saved.').first()).toBeVisible();

    await page.context().clearCookies();
    await visit(page, '/');
    await expect(page.locator('footer')).toContainText(tagline);
});
