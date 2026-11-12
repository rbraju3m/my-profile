import type { Diagram, DiagramEdge, DiagramNode } from '@/shared/types';

export const NODE_W = 184;
export const NODE_H = 76;
const GAP_X = 72;
const GAP_Y = 56;
const PAD_TOP = 36; // room for edges routed above a row
const PAD = 4;
const BIDI_OFFSET = 11;

export type PlacedNode = DiagramNode & { x: number; y: number };

export type PlacedEdge = {
    path: string;
    mode: DiagramEdge['mode'];
    label?: string;
    labelX: number;
    labelY: number;
    labelWidth: number;
};

export type Layout = { width: number; height: number; nodes: PlacedNode[]; edges: PlacedEdge[] };

/**
 * Places nodes on a grid and routes edges orthogonally:
 *  - neighbours in a row: a straight line (two lines, offset, if both directions exist);
 *  - same column: a straight vertical line;
 *  - same row but skipping columns: routed above the row so it never crosses a node;
 *  - otherwise: down/up to the gap between rows, across, then into the target.
 *
 * Pure function, unit-tested in layout.test.ts.
 */
export function layoutDiagram(diagram: Diagram): Layout {
    const cols = Math.max(0, ...diagram.nodes.map((n) => n.col)) + 1;
    const rows = Math.max(0, ...diagram.nodes.map((n) => n.row)) + 1;

    const nodes: PlacedNode[] = diagram.nodes.map((n) => ({
        ...n,
        x: PAD + n.col * (NODE_W + GAP_X),
        y: PAD_TOP + n.row * (NODE_H + GAP_Y),
    }));
    const byId = new Map(nodes.map((n) => [n.id, n]));

    const pairs = new Set(diagram.edges.map((e) => `${e.from}>${e.to}`));

    const edges: PlacedEdge[] = [];
    for (const edge of diagram.edges) {
        const a = byId.get(edge.from);
        const b = byId.get(edge.to);
        if (!a || !b) continue;

        const bidirectional = pairs.has(`${edge.to}>${edge.from}`);
        edges.push(route(a, b, edge, bidirectional));
    }

    return {
        width: PAD * 2 + cols * NODE_W + (cols - 1) * GAP_X,
        height: PAD_TOP + rows * NODE_H + (rows - 1) * GAP_Y + PAD * 2,
        nodes,
        edges,
    };
}

function route(a: PlacedNode, b: PlacedNode, edge: DiagramEdge, bidirectional: boolean): PlacedEdge {
    const label = edge.label;
    const labelWidth = label ? Math.ceil(label.length * 6.1) + 14 : 0;
    const base = { mode: edge.mode ?? 'sync', label, labelWidth };

    const acx = a.x + NODE_W / 2;
    const bcx = b.x + NODE_W / 2;
    const acy = a.y + NODE_H / 2;

    if (a.row === b.row && Math.abs(a.col - b.col) === 1) {
        // Offset by direction so the two arrows of a bidirectional pair sit apart,
        // with the label on the outer side of each.
        const forward = b.col > a.col;
        const offset = bidirectional ? (forward ? -BIDI_OFFSET : BIDI_OFFSET) : 0;
        const y = acy + offset;
        const x1 = forward ? a.x + NODE_W : a.x;
        const x2 = forward ? b.x - 2 : b.x + NODE_W + 2;

        return {
            ...base,
            path: `M ${x1} ${y} H ${x2}`,
            labelX: (x1 + x2) / 2,
            labelY: bidirectional ? y + (forward ? -14 : 14) : y - 14,
        };
    }

    if (a.row === b.row) {
        // Skips over intermediate nodes: go up, across above the row, then down.
        const top = a.y - 20;

        return {
            ...base,
            path: `M ${acx} ${a.y} V ${top} H ${bcx} V ${b.y - 2}`,
            labelX: (acx + bcx) / 2,
            labelY: top,
        };
    }

    const down = b.row > a.row;

    if (a.col === b.col) {
        const x = acx + (bidirectional ? (down ? -BIDI_OFFSET : BIDI_OFFSET) : 0);
        const y1 = down ? a.y + NODE_H : a.y;
        const y2 = down ? b.y - 2 : b.y + NODE_H + 2;

        return {
            ...base,
            path: `M ${x} ${y1} V ${y2}`,
            labelX: x + labelWidth / 2 + 8,
            labelY: (y1 + y2) / 2,
        };
    }

    // Different row and column: elbow through the gap between the two rows.
    const y1 = down ? a.y + NODE_H : a.y;
    const y2 = down ? b.y - 2 : b.y + NODE_H + 2;
    const mid = down ? a.y + NODE_H + GAP_Y / 2 : a.y - GAP_Y / 2;

    return {
        ...base,
        path: `M ${acx} ${y1} V ${mid} H ${bcx} V ${y2}`,
        labelX: (acx + bcx) / 2,
        labelY: mid,
    };
}
