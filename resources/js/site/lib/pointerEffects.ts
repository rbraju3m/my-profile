/**
 * Pointer-driven effects for the whole page, from one delegated listener:
 *
 * - `[data-spotlight]` gets `--mx` / `--my` (pointer position inside it, in px),
 *   which the CSS uses for a glow that follows the cursor.
 * - `[data-tilt]` gets `--rx` / `--ry` (a few degrees), for a 3D tilt. The
 *   attribute's value, if any, is the largest tilt in degrees.
 * - `[data-parallax]` gets `--px` / `--py` (-1 to 1, from its centre), which the
 *   CSS uses to shift decorative layers with the cursor.
 * - `[data-magnetic]` gets `--tx` / `--ty` (px): it leans toward the cursor.
 *
 * Delegation means it also works on sections whose React code hasn't hydrated
 * yet (see components/Deferred.tsx). Only for fine pointers (mouse, trackpad),
 * and never for visitors who prefer reduced motion.
 */
const MAX_TILT = 5;
const MAGNET = 0.3; // share of the distance from the centre
const MAX_MAGNET = 10; // px

export function installPointerEffects(): () => void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

    let frame = 0;
    let last: PointerEvent | null = null;
    let tilted: HTMLElement | null = null;
    let pulled: HTMLElement | null = null;

    const resetTilt = () => {
        tilted?.style.setProperty('--rx', '0deg');
        tilted?.style.setProperty('--ry', '0deg');
        tilted = null;
    };

    const resetMagnet = () => {
        pulled?.style.setProperty('--tx', '0px');
        pulled?.style.setProperty('--ty', '0px');
        pulled = null;
    };

    const reset = () => {
        resetTilt();
        resetMagnet();
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

        const parallax = event.target.closest<HTMLElement>('[data-parallax]');
        if (parallax) {
            const rect = parallax.getBoundingClientRect();
            parallax.style.setProperty('--px', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
            parallax.style.setProperty('--py', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
        }

        const tilt = event.target.closest<HTMLElement>('[data-tilt]');
        if (tilted && tilted !== tilt) resetTilt();
        if (tilt) {
            const max = Number(tilt.dataset.tilt) || MAX_TILT;
            const rect = tilt.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            tilt.style.setProperty('--ry', `${(x * max * 2).toFixed(2)}deg`);
            tilt.style.setProperty('--rx', `${(-y * max * 2).toFixed(2)}deg`);
            tilted = tilt;
        }

        const magnet = event.target.closest<HTMLElement>('[data-magnetic]');
        if (pulled && pulled !== magnet) resetMagnet();
        if (magnet) {
            const rect = magnet.getBoundingClientRect();
            const clamp = (v: number) => Math.max(-MAX_MAGNET, Math.min(MAX_MAGNET, v));
            magnet.style.setProperty('--tx', `${clamp((event.clientX - rect.left - rect.width / 2) * MAGNET).toFixed(1)}px`);
            magnet.style.setProperty('--ty', `${clamp((event.clientY - rect.top - rect.height / 2) * MAGNET).toFixed(1)}px`);
            pulled = magnet;
        }
    };

    const onMove = (event: PointerEvent) => {
        last = event;
        frame ||= requestAnimationFrame(apply);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', reset);

    return () => {
        cancelAnimationFrame(frame);
        document.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', reset);
        reset();
    };
}
