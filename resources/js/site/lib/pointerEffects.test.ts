import { afterEach, describe, expect, it, vi } from 'vitest';

import { installPointerEffects } from './pointerEffects';

function media(matches: Partial<Record<string, boolean>>) {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: matches[query] ?? false }));
}

function move(target: Element, clientX: number, clientY: number) {
    const event = new MouseEvent('pointermove', { bubbles: true, clientX, clientY });
    target.dispatchEvent(event);
}

function box(el: HTMLElement, rect: { left: number; top: number; width: number; height: number }) {
    el.getBoundingClientRect = () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top, toJSON: () => ({}) });
}

afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
});

describe('installPointerEffects', () => {
    it('writes the cursor position on every spotlight under the pointer, and tilts', () => {
        media({ '(pointer: fine)': true });
        // Frames run when flushed, as in a browser (never inside the event).
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
        const flush = () => frames.splice(0).forEach((cb) => cb(0));
        document.body.innerHTML = '<section data-spotlight><div data-tilt data-spotlight><span>x</span></div></section>';
        const outer = document.querySelector<HTMLElement>('section')!;
        const card = document.querySelector<HTMLElement>('[data-tilt]')!;
        box(outer, { left: 0, top: 0, width: 1000, height: 600 });
        box(card, { left: 100, top: 100, width: 200, height: 100 });

        const uninstall = installPointerEffects();
        move(document.querySelector('span')!, 300, 150);
        flush();

        expect(card.style.getPropertyValue('--mx')).toBe('200px');
        expect(card.style.getPropertyValue('--my')).toBe('50px');
        expect(outer.style.getPropertyValue('--mx')).toBe('300px');
        expect(card.style.getPropertyValue('--ry')).toBe('5.00deg');
        expect(card.style.getPropertyValue('--rx')).toBe('0.00deg');

        // Leaving the tilted element resets it.
        move(outer, 10, 10);
        flush();
        expect(card.style.getPropertyValue('--ry')).toBe('0deg');

        uninstall();
    });

    it('pulls magnetic elements toward the cursor, sets parallax and honours a per-element tilt', () => {
        media({ '(pointer: fine)': true });
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
        const flush = () => frames.splice(0).forEach((cb) => cb(0));
        document.body.innerHTML = '<section data-parallax><a data-magnetic>go</a><div data-tilt="2"><i>x</i></div></section>';
        const section = document.querySelector<HTMLElement>('section')!;
        const button = document.querySelector<HTMLElement>('a')!;
        const card = document.querySelector<HTMLElement>('[data-tilt]')!;
        box(section, { left: 0, top: 0, width: 1000, height: 500 });
        box(button, { left: 100, top: 100, width: 100, height: 40 });
        box(card, { left: 500, top: 100, width: 200, height: 100 });

        const uninstall = installPointerEffects();
        move(button, 190, 120); // 40px right of centre, at the vertical centre
        flush();

        expect(button.style.getPropertyValue('--tx')).toBe('10.0px'); // 40 × 0.3 = 12, capped at 10
        expect(button.style.getPropertyValue('--ty')).toBe('0.0px');
        expect(section.style.getPropertyValue('--px')).toBe('-0.620');
        expect(section.style.getPropertyValue('--py')).toBe('-0.520');

        move(document.querySelector('i')!, 700, 150);
        flush();
        expect(button.style.getPropertyValue('--tx')).toBe('0px');
        expect(card.style.getPropertyValue('--ry')).toBe('2.00deg');

        uninstall();
    });

    it('does nothing for touch screens or reduced motion', () => {
        for (const queries of [{}, { '(pointer: fine)': true, '(prefers-reduced-motion: reduce)': true }]) {
            media(queries);
            const raf = vi.fn();
            vi.stubGlobal('requestAnimationFrame', raf);
            document.body.innerHTML = '<div data-spotlight></div>';

            const uninstall = installPointerEffects();
            move(document.querySelector('div')!, 5, 5);

            expect(raf).not.toHaveBeenCalled();
            uninstall();
        }
    });
});
