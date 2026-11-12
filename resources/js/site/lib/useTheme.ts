import { usePage } from '@inertiajs/react';
import { useCallback, useSyncExternalStore } from 'react';

import type { Appearance, SharedProps, ThemeOption } from '@/shared/types';

/** A theme key, or 'system' to follow the device's light/dark setting. */
export type ThemeChoice = string;

/* The pre-paint script in site.blade.php sets `data-theme` (and `.dark` for
   dark-scheme themes) before first paint; this hook subscribes to those
   attributes instead of keeping a second copy of the state. */
function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-theme-choice'] });
    return () => observer.disconnect();
}

const readTheme = (): string | null => document.documentElement.dataset.theme ?? null;

function readChoice(): string | null {
    try {
        return localStorage.getItem('theme');
    } catch {
        return document.documentElement.dataset.themeChoice ?? null;
    }
}

/** The theme a choice resolves to. Same rules as the pre-paint script. */
export function resolveTheme(choice: string | null, appearance: Appearance): ThemeOption {
    const { themes } = appearance;
    let pick = choice !== 'system' && !themes.some((t) => t.key === choice) ? appearance.default : choice;
    const found = themes.find((t) => t.key === pick);
    if (found) return found;

    const dark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
    pick = (themes.find((t) => t.scheme === (dark ? 'dark' : 'light')) ?? themes[0])?.key ?? 'dark';

    return themes.find((t) => t.key === pick) ?? { key: 'dark', label: 'Dark', scheme: 'dark', bg: '#0a0b0d' };
}

function apply(theme: ThemeOption) {
    const root = document.documentElement;
    root.dataset.theme = theme.key;
    root.classList.toggle('dark', theme.scheme === 'dark');
    root.style.colorScheme = theme.scheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.bg);
}

type Origin = { x: number; y: number };

/**
 * Switches theme and remembers the choice. With an origin (the picker's
 * position), the new theme grows out of it as a circle, using the View
 * Transitions API. Browsers without it, and visitors who prefer reduced
 * motion, get the plain instant switch.
 */
function switchTheme(choice: ThemeChoice, appearance: Appearance, origin?: Origin) {
    try {
        localStorage.setItem('theme', choice);
    } catch {
        // Private mode: the switch still works for this visit.
    }
    document.documentElement.dataset.themeChoice = choice;

    const theme = resolveTheme(choice, appearance);
    if (theme.key === readTheme()) return;

    const root = document.documentElement;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!origin || reduce || typeof document.startViewTransition !== 'function') {
        apply(theme);
        return;
    }

    root.classList.add('theme-transition');
    const transition = document.startViewTransition(() => apply(theme));
    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));

    transition.ready
        .then(() =>
            root.animate(
                { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
                { duration: 550, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
            ),
        )
        .catch(() => {});
    transition.finished.finally(() => root.classList.remove('theme-transition')).catch(() => {});
}

/**
 * The active theme key (null on the server), the visitor's saved choice
 * (a theme key, 'system', or null when they never chose), and a setter.
 */
export function useTheme(): { theme: string | null; choice: string | null; setTheme: (choice: ThemeChoice, origin?: Origin) => void; appearance: Appearance } {
    const { appearance } = usePage<SharedProps>().props;
    const theme = useSyncExternalStore(subscribe, readTheme, () => null);
    const choice = useSyncExternalStore(subscribe, readChoice, () => null);

    const setTheme = useCallback((next: ThemeChoice, origin?: Origin) => switchTheme(next, appearance, origin), [appearance]);

    return { theme, choice, setTheme, appearance };
}
