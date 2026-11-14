import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Diagram } from '@/shared/types';

import { FlowDiagram } from './FlowDiagram';

const diagram: Diagram = {
    slug: 'lab',
    title: 'Lab analyzer bridge',
    description: 'Results flow from the analyzer into the HMS.',
    nodes: [
        { id: 'hms', label: 'HMS', type: 'service', col: 2, row: 0 },
        { id: 'analyzer', label: 'Analyzer', sublabel: 'ASTM', type: 'device', col: 0, row: 0 },
        { id: 'bridge', label: 'Bridge', type: 'service', col: 1, row: 0 },
    ],
    edges: [
        { from: 'analyzer', to: 'bridge', label: 'serial', mode: 'sync' },
        { from: 'bridge', to: 'hms', mode: 'async' },
    ],
};

describe('FlowDiagram', () => {
    it('gives the SVG an accessible name and a text description of every arrow', () => {
        render(<FlowDiagram diagram={diagram} />);
        const svg = screen.getByRole('img', { name: /Lab analyzer bridge/ });

        expect(svg).toHaveAccessibleName('Lab analyzer bridge Analyzer to Bridge: serial. Bridge to HMS');
        expect(svg.querySelectorAll('path[stroke-dasharray]')).toHaveLength(1);
    });

    it('lists the steps in grid order for small screens, with arrow labels and async marked', () => {
        const { container } = render(<FlowDiagram diagram={diagram} />);
        const list = container.querySelector('ol.lg\\:hidden') as HTMLElement;
        const steps = within(list).getAllByRole('listitem').filter((li) => li.parentElement === list);

        expect(steps.map((li) => li.querySelector('p.font-semibold')?.textContent)).toEqual(['Analyzer', 'Bridge', 'HMS']);
        expect(steps[0]).toHaveTextContent('Bridge · serial');
        expect(steps[1]).toHaveTextContent('HMS (asynchronous)');
    });

    it('shows the description as a caption', () => {
        render(<FlowDiagram diagram={diagram} />);
        expect(screen.getByText('Results flow from the analyzer into the HMS.').tagName).toBe('FIGCAPTION');
    });

    it('uses unique marker ids when drawn twice on one page', () => {
        const { container } = render(
            <>
                <FlowDiagram diagram={diagram} />
                <FlowDiagram diagram={diagram} />
            </>,
        );
        const ids = [...container.querySelectorAll('marker')].map((m) => m.id);
        expect(ids.length).toBeGreaterThan(0);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('highlights a hovered component and its connections, and dims the rest', () => {
        const { container } = render(<FlowDiagram diagram={diagram} />);
        const svg = container.querySelector('svg[role="img"]') as SVGSVGElement;
        const analyzer = within(svg as unknown as HTMLElement).getByText('Analyzer').closest('div[style]') as HTMLElement;

        fireEvent.mouseEnter(analyzer);

        const edgeGroups = [...svg.querySelectorAll('g[opacity]')];
        expect(edgeGroups.map((g) => g.getAttribute('opacity'))).toEqual(['1', '0.18']);
        expect(within(svg as unknown as HTMLElement).getByText('HMS').closest('div[style]')).toHaveClass('opacity-35');

        fireEvent.mouseLeave(svg);
        expect([...svg.querySelectorAll('g[opacity]')].every((g) => g.getAttribute('opacity') === '1')).toBe(true);
    });

    it('shows a legend of the node types and line styles in use', () => {
        const { container } = render(<FlowDiagram diagram={diagram} />);
        const legend = container.querySelector('.border-t') as HTMLElement;

        expect(legend).toHaveTextContent(/Device.*Service.*Direct call.*Asynchronous/);
        expect(legend).not.toHaveTextContent('People');
    });

    it('zooms in and out in steps between 100% and 250%, and resets', () => {
        const { container } = render(<FlowDiagram diagram={diagram} />);
        const svg = () => container.querySelector('svg[role="img"]') as SVGSVGElement;
        const zoomIn = screen.getByRole('button', { name: 'Zoom in' });
        const zoomOut = screen.getByRole('button', { name: 'Zoom out' });

        expect(svg().style.width).toBe('100%');
        expect(zoomOut).toBeDisabled();

        fireEvent.click(zoomIn);
        fireEvent.click(zoomIn);
        expect(svg().style.width).toBe('150%');
        expect(screen.getByRole('button', { name: /Reset zoom/ })).toHaveTextContent('150%');

        for (let i = 0; i < 10; i++) fireEvent.click(zoomIn);
        expect(svg().style.width).toBe('250%');
        expect(zoomIn).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: /Reset zoom/ }));
        expect(svg().style.width).toBe('100%');
    });

    it('zooms with Ctrl + wheel and leaves a plain wheel to scroll the page', () => {
        const { container } = render(<FlowDiagram diagram={diagram} />);
        const svg = container.querySelector('svg[role="img"]') as SVGSVGElement;
        const scroller = svg.parentElement!;

        expect(fireEvent.wheel(scroller, { deltaY: -100 })).toBe(true);
        expect(svg.style.width).toBe('100%');

        expect(fireEvent.wheel(scroller, { deltaY: -100, ctrlKey: true })).toBe(false); // default prevented
        expect(parseFloat(svg.style.width)).toBeGreaterThan(100);
    });

    it('can be zoomed from the keyboard once the diagram area has focus', () => {
        const { container } = render(<FlowDiagram diagram={diagram} />);
        const area = screen.getByRole('group', { name: 'Lab analyzer bridge' });
        const svg = container.querySelector('svg[role="img"]') as SVGSVGElement;

        expect(area).toHaveAttribute('tabindex', '0');
        fireEvent.keyDown(area, { key: '+' });
        expect(svg.style.width).toBe('125%');
        fireEvent.keyDown(area, { key: '0' });
        expect(svg.style.width).toBe('100%');
    });

    it('falls back to the default text for any missing label', () => {
        render(<FlowDiagram diagram={diagram} labels={{ device: 'Gerät' }} />);

        expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    });
});
