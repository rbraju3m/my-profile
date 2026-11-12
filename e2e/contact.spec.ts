import { a11yViolations, expect, test, visit } from './fixtures';

test('the contact form validates in the browser and points at the problem', async ({ page }) => {
    await visit(page, '/#contact');
    const form = page.locator('#contact form');

    await form.getByRole('button', { name: 'Send message' }).click();

    await expect(form.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
    await expect(form.getByLabel('Name')).toBeFocused();
    await expect(form.getByText('Please enter your name.')).toBeVisible();
    expect(await a11yViolations(page)).toEqual([]);
});

test('a valid message is sent and confirmed', async ({ page }, testInfo) => {
    await visit(page, '/#contact');
    const form = page.locator('#contact form');

    await form.getByLabel('Name').fill('Playwright Tester');
    await form.getByLabel('Email').fill('tester@example.com');
    await form.getByLabel('Subject').fill(`Browser test (${testInfo.project.name})`);
    await form.getByLabel('Message').fill('Hello! This message was sent by the automated browser tests.');
    await form.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByRole('status')).toContainText(/thank|sent|reply/i);
    await expect(page.getByRole('button', { name: 'Send another message' })).toBeVisible();
});
