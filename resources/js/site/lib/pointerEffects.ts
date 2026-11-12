/**
 * Pointer-driven effects for the whole page, from one delegated listener:
 *
 * - `[data-spotlight]` gets `--mx` / `--my` (pointer position inside it, in px),
 *   which the CSS uses for a glow that follows the cursor.
 * - `[data-tilt]` gets `--rx` / `--ry` (a few degrees), for a 3D tilt.
 *
 * Delegation means it also works on sections whose React code hasn't hydrated
 * yet (see components/Deferred.tsx). Only for fine pointers (mouse, trackpad),
 * and never for visitors who prefer reduced motion.
 */
const MAX_TILT = 5;

export function installPointerEffects(): () => void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

    let frame = 0;
    let last: PointerEvent | null = null;
    let tilted: HTMLElement | null = null;

    const resetTilt = () => {
        tilted?.style.setProperty('--rx', '0deg');
        tilted?.style.setProperty('--ry', '0deg');
        tilted = null;
    };

    const apply = () => {
        frame = 0;
        const event = last;
        if (!event || !(event.target instanceof Element)) return;

        // Every spotlight under the pointer (e.g. the hero and the card inside it).
        for (let el = event.target.closest<HTMLElement>('[data-spotlight]'); el; el = el.parentElement?.closest<HTMLElement>('[data-spotlight]') ?? null) {
            const rect = el.getBoundingClientRect();
            el.style.setProperty('--mx', `${Math.round(event.clientX - rect.left)}px`);
            el.style.setProperty('--my', `${Math.round(event.clientY - rect.top)}px`);
        }

        const tilt = event.target.closest<HTMLElement>('[data-tilt]');
        if (tilted && tilted !== tilt) resetTilt();
        if (tilt) {
            const rect = tilt.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            tilt.style.setProperty('--ry', `${(x * MAX_TILT * 2).toFixed(2)}deg`);
            tilt.style.setProperty('--rx', `${(-y * MAX_TILT * 2).toFixed(2)}deg`);
            tilted = tilt;
        }
    };

    const onMove = (event: PointerEvent) => {
        last = event;
        frame ||= requestAnimationFrame(apply);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', resetTilt);

    return () => {
        cancelAnimationFrame(frame);
        document.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', resetTilt);
        resetTilt();
    };
}
