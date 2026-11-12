import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

/* The pre-paint script in site.blade.php sets the `.dark` class; this hook
   subscribes to that class instead of keeping a second copy of the state. */
function subscribe(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
}

const read = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

export function useTheme(): [Theme | null, () => void] {
    const theme = useSyncExternalStore(subscribe, read, () => null);

    const toggle = useCallback(() => {
        const next: Theme = read() === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.toggle('dark', next === 'dark');
        document.documentElement.style.colorScheme = next;
        try {
            localStorage.setItem('theme', next);
        } catch {
            // Private mode: the toggle still works for this visit.
        }
    }, []);

    return [theme, toggle];
}
