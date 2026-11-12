import { act, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

// This test drives hydrateRoot itself, outside Testing Library.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let trigger: (() => void) | null = null;

class ControlledObserver {
    constructor(private readonly callback: IntersectionObserverCallback) {
        trigger = () => this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe() {}
    disconnect() {}
}

function Label({ text }: { text: { value: string } }) {
    return <p>{text.value}</p>;
}

function Counter() {
    const [n, setN] = useState(0);
    return (
        <button type="button" onClick={() => setN(n + 1)}>
            clicked {n}
        </button>
    );
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    document.body.innerHTML = '';
});

describe('Deferred', () => {
    it('keeps the server HTML and hydrates only when the section nears the viewport', async () => {
        // The SSR server has no window, so its copy of the module never gates.
        vi.stubGlobal('window', undefined);
        const server = await import('./Deferred');
        vi.unstubAllGlobals();
        vi.resetModules();
        vi.stubGlobal('IntersectionObserver', ControlledObserver);
        const { Deferred } = await import('./Deferred');
        const errors = vi.spyOn(console, 'error').mockImplementation(() => {});

        const container = document.createElement('div');
        container.innerHTML = renderToString(
            <server.Deferred>
                <Counter />
            </server.Deferred>,
        );
        const app = (
            <Deferred>
                <Counter />
            </Deferred>
        );
        document.body.appendChild(container);
        const button = container.querySelector('button')!;

        await act(async () => {
            hydrateRoot(container, app);
        });

        // Not hydrated yet: same DOM node, content intact, no handler attached.
        expect(container.querySelector('button')).toBe(button);
        expect(button.textContent).toBe('clicked 0');

        await act(async () => trigger!());
        await act(async () => button.click());

        expect(container.querySelector('button')).toBe(button);
        expect(button.textContent).toBe('clicked 1');
        expect(errors.mock.calls.map((c) => String(c[0]).slice(0, 300))).toEqual([]);
    });

    it('keeps the server HTML when the page re-renders with equal data before hydrating', async () => {
        vi.stubGlobal('window', undefined);
        const server = await import('./Deferred');
        vi.unstubAllGlobals();
        vi.resetModules();
        vi.stubGlobal('IntersectionObserver', ControlledObserver);
        const { Deferred } = await import('./Deferred');

        const container = document.createElement('div');
        container.innerHTML = renderToString(
            <server.Deferred>
                <Label text={{ value: 'Hello' }} />
            </server.Deferred>,
        );
        const paragraph = container.querySelector('p')!;

        let root!: ReturnType<typeof hydrateRoot>;
        await act(async () => {
            root = hydrateRoot(
                container,
                <Deferred>
                    <Label text={{ value: 'Hello' }} />
                </Deferred>,
            );
        });
        // What Inertia does after mounting: the same data in new objects.
        await act(async () =>
            root.render(
                <Deferred>
                    <Label text={{ value: 'Hello' }} />
                </Deferred>,
            ),
        );
        expect(container.querySelector('p')).toBe(paragraph);

        // Real changes still render.
        await act(async () =>
            root.render(
                <Deferred>
                    <Label text={{ value: 'Changed' }} />
                </Deferred>,
            ),
        );
        expect(container.textContent).toBe('Changed');
    });
});
