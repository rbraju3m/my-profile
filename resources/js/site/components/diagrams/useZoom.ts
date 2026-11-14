import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from 'react';

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 2.5;
const STEP = 0.25;

const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
const noop = () => () => {};

/**
 * Zoom, pan and full screen for a diagram:
 *  - buttons step the zoom; Ctrl/⌘ + wheel (and trackpad pinch, which sends
 *    the same event) zooms smoothly;
 *  - the point under the cursor (or the centre, for buttons) stays put;
 *  - dragging with the mouse pans a zoomed diagram;
 *  - full screen uses the browser's Fullscreen API where it exists.
 */
export function useZoom() {
    const [zoom, setZoomState] = useState(MIN_ZOOM);
    const [full, setFull] = useState(false);
    const scroller = useRef<HTMLDivElement>(null);
    const figure = useRef<HTMLElement>(null);
    // Where to keep fixed through the next zoom change: a point as a share of the content.
    const anchor = useRef<{ fx: number; fy: number; px: number; py: number } | null>(null);
    const wasFull = useRef(false);
    const drag = useRef<{ x: number; y: number; left: number; top: number; id: number } | null>(null);

    // Server: no full-screen button (unknown support); the browser fills it in.
    const canFull = useSyncExternalStore(
        noop,
        () => typeof document.documentElement.requestFullscreen === 'function' && document.fullscreenEnabled !== false,
        () => false,
    );

    const setZoom = useCallback((next: number, at?: { x: number; y: number }) => {
        const el = scroller.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            const px = at ? at.x - rect.left : el.clientWidth / 2;
            const py = at ? at.y - rect.top : el.clientHeight / 2;
            anchor.current = {
                fx: (el.scrollLeft + px) / Math.max(1, el.scrollWidth),
                fy: (el.scrollTop + py) / Math.max(1, el.scrollHeight),
                px,
                py,
            };
        }
        setZoomState(clamp(next));
    }, []);

    // After the content has its new size, scroll so the anchored point is where it was.
    useLayoutEffect(() => {
        const el = scroller.current;
        const a = anchor.current;
        if (!el || !a) return;
        el.scrollLeft = a.fx * el.scrollWidth - a.px;
        el.scrollTop = a.fy * el.scrollHeight - a.py;
        anchor.current = null;
    }, [zoom]);

    // Ctrl/⌘ + wheel: needs a non-passive listener to stop the page zooming.
    useEffect(() => {
        const el = scroller.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            setZoomState((z) => {
                const next = clamp(z * Math.exp(-e.deltaY * 0.01));
                if (next !== z) {
                    const rect = el.getBoundingClientRect();
                    const px = e.clientX - rect.left;
                    const py = e.clientY - rect.top;
                    anchor.current = {
                        fx: (el.scrollLeft + px) / Math.max(1, el.scrollWidth),
                        fy: (el.scrollTop + py) / Math.max(1, el.scrollHeight),
                        px,
                        py,
                    };
                }
                return next;
            });
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    useEffect(() => {
        const onChange = () => {
            const isFull = document.fullscreenElement !== null && document.fullscreenElement === figure.current;
            // Only the diagram that entered or left full screen changes; it starts at "fit" (page width, or whole screen).
            if (isFull === wasFull.current) return;
            wasFull.current = isFull;
            setFull(isFull);
            setZoomState(MIN_ZOOM);
        };
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggleFull = useCallback(() => {
        if (document.fullscreenElement) void document.exitFullscreen?.();
        else void figure.current?.requestFullscreen?.().catch(() => {});
    }, []);

    // Mouse drag to pan (touch already scrolls natively).
    const pan = {
        onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
            const el = scroller.current;
            if (!el || e.pointerType !== 'mouse' || e.button !== 0) return;
            if (el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight) return;
            drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop, id: e.pointerId };
        },
        onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
            const el = scroller.current;
            const d = drag.current;
            if (!el || !d) return;
            // Only capture once it is clearly a drag, so plain clicks still reach the nodes.
            if (!el.hasPointerCapture(d.id) && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) el.setPointerCapture(d.id);
            el.scrollLeft = d.left - (e.clientX - d.x);
            el.scrollTop = d.top - (e.clientY - d.y);
        },
        onPointerUp: () => {
            drag.current = null;
        },
        onPointerCancel: () => {
            drag.current = null;
        },
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === '+' || e.key === '=') setZoom(zoom + STEP);
        else if (e.key === '-' || e.key === '_') setZoom(zoom - STEP);
        else if (e.key === '0') setZoom(MIN_ZOOM);
        else return;
        e.preventDefault();
    };

    return {
        onKeyDown,
        zoom,
        zoomIn: () => setZoom(zoom + STEP),
        zoomOut: () => setZoom(zoom - STEP),
        reset: () => setZoom(MIN_ZOOM),
        full,
        canFull,
        toggleFull,
        scroller,
        figure,
        pan,
    };
}
