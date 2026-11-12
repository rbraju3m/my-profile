import { describe, expect, it } from 'vitest';

import type { Diagram } from '@/shared/types';

import { layoutDiagram, NODE_H, NODE_W } from './layout';

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
        const top = Number(edges[0]!.path.split(' ')[4]); // "M x y V top H …"

        expect(top).toBeLessThan(nodes[0]!.y);
    });

    it('ignores edges that point at missing nodes', () => {
        const { edges } = layoutDiagram(diagram([node('a', 0, 0)], [{ from: 'a', to: 'ghost' }]));

        expect(edges).toHaveLength(0);
    });
});
