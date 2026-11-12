import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTheme } from './useTheme';

function Toggle() {
    const [theme, toggle] = useTheme();
    return (
        <button type="button" onClick={toggle}>
            {theme}
        </button>
    );
}

afterEach(() => {
    document.documentElement.className = '';
    localStorage.clear();
    vi.restoreAllMocks();
});

describe('useTheme', () => {
    it('reads the class set by the pre-paint script', () => {
        document.documentElement.classList.add('dark');
        render(<Toggle />);
        expect(screen.getByRole('button')).toHaveTextContent('dark');
    });

    it('toggles the class, the colour scheme and the saved choice', async () => {
        render(<Toggle />);
        await act(async () => screen.getByRole('button').click());

        expect(document.documentElement).toHaveClass('dark');
        expect(document.documentElement.style.colorScheme).toBe('dark');
        expect(localStorage.getItem('theme')).toBe('dark');
        expect(screen.getByRole('button')).toHaveTextContent('dark');

        await act(async () => screen.getByRole('button').click());
        expect(document.documentElement).not.toHaveClass('dark');
        expect(localStorage.getItem('theme')).toBe('light');
    });

    it('still toggles when storage is blocked', async () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        render(<Toggle />);
        await act(async () => screen.getByRole('button').click());
        expect(document.documentElement).toHaveClass('dark');
    });
});
