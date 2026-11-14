import { describe, expect, it } from 'vitest';

import type { Diagram } from '@/shared/types';

import { layoutDiagram, measureLabel, NODE_H, NODE_W } from './layout';

const diagram = (nodes: Diagram['nodes'], edges: Diagram['edges']): Diagram => ({ slug: 't', title: 'T', description: null, nodes, edges });
const node = (id: string, col: number, row: number) => ({ id, label: id, type: 'service' as const, col, row });

describe('layoutDiagram', () => {
    it('sizes the canvas from the grid', () => {
        const layout = layoutDiagram(diagram([node('a', 0, 0), node('b', 2, 1)], []));

        expect(layout.width).toBeGreaterThan(3 * NODE_W);
        expect(layout.height).toBeGreaterThan(2 * NODE_H);
    });

    it('draws neighbours in a row as one straight horizontal line', () => {
        const { edges } = layoutDiagram(diagram([node('a', 0, 0), node('b', 1, 0)], [{ from: 'a', to: 'b' }]));

        expect(edges[0]!.path).toMatch(/^M [\d.]+ [\d.]+ H [\d.]+$/);
    });

    it('separates the two directions of a bidirectional pair', () => {
        const { edges } = layoutDiagram(
            diagram([node('a', 0, 0), node('b', 1, 0)], [
                { from: 'a', to: 'b' },
                { from: 'b', to: 'a' },
            ]),
        );
        const y = (path: string) => Number(path.split(' ')[2]);

        expect(y(edges[0]!.path)).not.toBe(y(edges[1]!.path));
    });

    it('routes a same-row edge that skips a column above the row', () => {
        const { nodes, edges } = layoutDiagram(diagram([node('a', 0, 0), node('m', 1, 0), node('b', 2, 0)], [{ from: 'b', to: 'a' }]));
        const top = Math.min(...edges[0]!.points.map((p) => p.y));

        expect(top).toBeLessThan(nodes[0]!.y);
    });

    it('widens a column gap so a long edge label never covers a node', () => {
        const label = 'Billed USG tests, every 30 s';
        const { nodes, edges } = layoutDiagram(diagram([node('a', 0, 0), node('b', 1, 0)], [{ from: 'a', to: 'b', label }]));
        const edge = edges[0]!;

        expect(edge.lines.length).toBeGreaterThan(1);
        expect(edge.labelX - edge.labelWidth / 2).toBeGreaterThan(nodes[0]!.x + NODE_W);
        expect(edge.labelX + edge.labelWidth / 2).toBeLessThan(nodes[1]!.x);
    });

    it('wraps labels onto at most three lines', () => {
        expect(measureLabel('one two three four five six seven eight nine ten').lines).toHaveLength(3);
        expect(measureLabel('opt-in').lines).toEqual(['opt-in']);
    });

    it('prefers an L-shaped route that misses other nodes', () => {
        // From (2,1) up to (3,0): going up first would cross the node at (2,0).
        const { edges } = layoutDiagram(diagram([node('blocker', 2, 0), node('a', 2, 1), node('b', 3, 0)], [{ from: 'a', to: 'b' }]));
        const { points } = edges[0]!;

        expect(points).toHaveLength(3);
        expect(points[0]!.y).toBe(points[1]!.y); // leaves sideways
        expect(points[1]!.x).toBe(points[2]!.x); // enters from below
    });

    it('ignores edges that point at missing nodes', () => {
        const { edges } = layoutDiagram(diagram([node('a', 0, 0)], [{ from: 'a', to: 'ghost' }]));

        expect(edges).toHaveLength(0);
    });
});
