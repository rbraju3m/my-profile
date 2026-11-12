import { isValidElement, memo, Suspense, use, useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

/*
 * Progressive hydration for long pages.
 *
 * On the first page load, a <Deferred> section keeps its server-rendered HTML
 * (fully visible, links work) but React only hydrates it when it comes near
 * the viewport. This uses React's own selective hydration: a Suspense boundary
 * that suspends during hydration stays "dehydrated" until the promise
 * resolves. React also replays clicks made on a dehydrated section, hydrating
 * it first.
 *
 * Client-side navigations (and the server) render normally: there is nothing
 * to hydrate, so there is no gate.
 *
 * Any re-render that reaches a still-dehydrated boundary makes React discard
 * the server HTML and render it from scratch. Inertia re-renders the page once
 * after mount with new but identical props, so <Deferred> skips re-renders
 * whose section data is unchanged (sections take plain JSON props).
 */

type Gate = { promise: Promise<void>; open: () => void; isOpen: boolean };

let initialHydration = typeof window !== 'undefined';

function createGate(): Gate {
    let resolve = () => {};
    const promise = new Promise<void>((r) => (resolve = r));
    const gate: Gate = {
        promise,
        isOpen: false,
        open: () => {
            gate.isOpen = true;
            resolve();
        },
    };
    return gate;
}

function Wait({ gate }: { gate: Gate }) {
    if (!gate.isOpen) use(gate.promise);
    return null;
}

function DeferredInner({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    // Kept in this component's state (outside the Suspense boundary), so it survives the suspended attempt.
    const [gate] = useState<Gate | null>(() => (initialHydration ? createGate() : null));
    const [initialChildren] = useState(children);

    // The section's data really changed before it hydrated: render it now, rather than leave it empty.
    if (gate && children !== initialChildren) gate.open();

    useEffect(() => {
        // Every <Deferred> of the first render has its gate by now; later mounts are navigations.
        initialHydration = false;

        const el = ref.current;
        if (!gate || !el) return;
        if (typeof IntersectionObserver === 'undefined') return gate.open();

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    observer.disconnect();
                    gate.open();
                }
            },
            // Hydrate well before it scrolls in, so scroll-reveal animations are ready.
            { rootMargin: '800px 0px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [gate]);

    return (
        <div ref={ref}>
            <Suspense fallback={null}>
                {gate && <Wait gate={gate} />}
                {children}
            </Suspense>
        </div>
    );
}

function sameSection(prev: { children: ReactNode }, next: { children: ReactNode }): boolean {
    const a = prev.children;
    const b = next.children;
    if (!isValidElement(a) || !isValidElement(b)) return a === b;

    return a.type === b.type && JSON.stringify((a as ReactElement).props) === JSON.stringify((b as ReactElement).props);
}

/** Wrap one section element: <Deferred><Skills ... /></Deferred>. */
export const Deferred = memo(DeferredInner, sameSection);
