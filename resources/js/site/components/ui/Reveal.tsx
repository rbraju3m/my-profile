import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/*
 * One observer for every Reveal on the page. The animation itself is a CSS
 * transition on opacity/transform (see [data-reveal] in site.css), so it runs
 * off the main thread and needs no animation library.
 */
let observer: IntersectionObserver | null = null;
const pending = new Set<HTMLElement>();

function reveal(el: HTMLElement) {
    el.dataset.revealed = '';
    pending.delete(el);
    observer?.unobserve(el);
}

/*
 * When frames are slow (a busy phone, a fast flick), an element can go from
 * below the viewport to above it between two frames. The observer never reports
 * that, since it was not intersecting either time, so it would stay hidden.
 * After every observer callback, and when scrolling stops, anything already
 * scrolled past is revealed.
 */
function sweep() {
    for (const el of pending) {
        if (el.getBoundingClientRect().bottom < 0) reveal(el);
    }
}

function observe(el: HTMLElement): () => void {
    if (typeof IntersectionObserver === 'undefined') {
        el.dataset.revealed = '';
        return () => {};
    }

    if (!observer) {
        observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    // In view, or already scrolled past (e.g. it hydrated late, or the visit started at #contact).
                    if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) reveal(entry.target as HTMLElement);
                }
                sweep();
            },
            { rootMargin: '0px 0px -60px 0px' },
        );
        window.addEventListener('scrollend', sweep, { passive: true });
    }

    pending.add(el);
    observer.observe(el);

    return () => {
        pending.delete(el);
        observer?.unobserve(el);
    };
}

/**
 * Fades content up 8px the first time it scrolls into view. Content is only
 * hidden once JavaScript is running (the `js` class from the pre-paint script),
 * and never for visitors who prefer reduced motion.
 */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => (ref.current ? observe(ref.current) : undefined), []);

    return (
        <div ref={ref} data-reveal="" className={className} style={delay ? ({ '--reveal-delay': `${delay}s` } as CSSProperties) : undefined}>
            {children}
        </div>
    );
}
