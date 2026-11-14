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
});
