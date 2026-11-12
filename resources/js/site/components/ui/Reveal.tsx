import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

/*
 * One observer for every Reveal on the page. The animation itself is a CSS
 * transition on opacity/transform (see [data-reveal] in site.css), so it runs
 * off the main thread and needs no animation library.
 */
let observer: IntersectionObserver | null = null;

function observe(el: HTMLElement): () => void {
    if (typeof IntersectionObserver === 'undefined') {
        el.dataset.revealed = '';
        return () => {};
    }

    observer ??= new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                // In view, or already scrolled past (e.g. it hydrated late, or the visit started at #contact).
                if (entry.isIntersecting || entry.boundingClientRect.bottom < 0) {
                    (entry.target as HTMLElement).dataset.revealed = '';
                    observer?.unobserve(entry.target);
                }
            }
        },
        { rootMargin: '0px 0px -60px 0px' },
    );
    observer.observe(el);

    return () => observer?.unobserve(el);
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
