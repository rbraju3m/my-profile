import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setPageProps } from '@/test-utils/inertia';

import type { Appearance } from '@/shared/types';

import { resolveTheme, useTheme } from './useTheme';

vi.mock('@inertiajs/react', () => import('@/test-utils/inertia'));

const appearance: Appearance = {
    default: 'dark',
    picker: true,
    themes: [
        { key: 'dark', label: 'Dark', scheme: 'dark', bg: '#0a0b0d' },
        { key: 'light', label: 'Light', scheme: 'light', bg: '#fafaf9' },
        { key: 'midnight', label: 'Midnight', scheme: 'dark', bg: '#0b1020' },
    ],
};

function Picker() {
    const { theme, choice, setTheme } = useTheme();
    return (
        <>
            <p>
                {theme}/{choice ?? 'none'}
            </p>
            <button type="button" onClick={() => setTheme('midnight')}>
                midnight
            </button>
            <button type="button" onClick={() => setTheme('light')}>
                light
            </button>
        </>
    );
}

function prefersDark(dark: boolean) {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q === '(prefers-color-scheme: dark)' ? dark : false }));
}

beforeEach(() => setPageProps({ appearance }));

afterEach(() => {
    document.documentElement.className = '';
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.themeChoice;
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('resolveTheme', () => {
    it('uses a saved theme that is still offered', () => {
        expect(resolveTheme('midnight', appearance).key).toBe('midnight');
    });

    it('falls back to the default for nothing saved or a theme no longer offered', () => {
        expect(resolveTheme(null, appearance).key).toBe('dark');
        expect(resolveTheme('ember', appearance).key).toBe('dark');
    });

    it('follows the device for "system"', () => {
        prefersDark(false);
        expect(resolveTheme('system', appearance).key).toBe('light');
        prefersDark(true);
        expect(resolveTheme('system', appearance).key).toBe('dark');
        expect(resolveTheme(null, { ...appearance, default: 'system' }).key).toBe('dark');
    });
});

describe('useTheme', () => {
    it('reads the theme set by the pre-paint script', () => {
        document.documentElement.dataset.theme = 'dark';
        render(<Picker />);
        expect(screen.getByText('dark/none')).toBeInTheDocument();
    });

    it('switches the theme, scheme class, colour scheme and saved choice', async () => {
        document.documentElement.dataset.theme = 'dark';
        render(<Picker />);

        await act(async () => screen.getByText('light').click());
        expect(document.documentElement.dataset.theme).toBe('light');
        expect(document.documentElement).not.toHaveClass('dark');
        expect(document.documentElement.style.colorScheme).toBe('light');
        expect(localStorage.getItem('theme')).toBe('light');

        await act(async () => screen.getByText('midnight').click());
        expect(document.documentElement.dataset.theme).toBe('midnight');
        expect(document.documentElement).toHaveClass('dark');
        expect(screen.getByText('midnight/midnight')).toBeInTheDocument();
    });

    it('still switches when storage is blocked', async () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        render(<Picker />);
        await act(async () => screen.getByText('midnight').click());
        expect(document.documentElement.dataset.theme).toBe('midnight');
    });
});
