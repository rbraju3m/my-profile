import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

const CommandPalette = lazy(() => import('./CommandPalette'));

const OPEN_EVENT = 'palette:open';

/** Opens the command palette from anywhere (e.g. the search button in the nav). */
export function openPalette(): void {
    window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Listens for ⌘K / Ctrl+K (and "/" outside text fields) and mounts the
 * palette. Its code is a separate chunk, downloaded the first time it opens.
 */
export function PaletteHost({ onHome }: { onHome: boolean }) {
    const [open, setOpen] = useState(false);
    const returnFocus = useRef<HTMLElement | null>(null);

    const show = useCallback(() => {
        returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setOpen(true);
    }, []);

    const close = useCallback(() => {
        setOpen(false);
        returnFocus.current?.focus({ preventScroll: true });
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
            if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (open) close();
                else show();
            } else if (e.key === '/' && !typing && !open) {
                e.preventDefault();
                show();
            }
        };
        window.addEventListener('keydown', onKey);
        window.addEventListener(OPEN_EVENT, show);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener(OPEN_EVENT, show);
        };
    }, [open, show, close]);

    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);

    if (!open) return null;

    return (
        <Suspense fallback={null}>
            <CommandPalette onClose={close} onHome={onHome} />
        </Suspense>
    );
}
