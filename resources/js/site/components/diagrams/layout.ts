import type { Diagram, DiagramEdge, DiagramNode } from '@/shared/types';

export const NODE_W = 168;
export const NODE_H = 88;
const MIN_GAP_X = 52;
const GAP_Y = 72;
const PAD_TOP = 52; // room for edges routed above a row, and labels above the top row
const PAD = 8;
const BIDI_OFFSET = 12;
const RADIUS = 10;

/* Edge labels are monospace at 10px: each character is about 6.1px wide. */
export const LABEL_LINE_H = 12;
const CHAR_W = 6.1;
const LABEL_CHARS = 16;
const LABEL_MAX_LINES = 3;

export type PlacedNode = DiagramNode & { x: number; y: number };

export type Point = { x: number; y: number };

export type PlacedEdge = {
    from: string;
    to: string;
    path: string;
    points: Point[];
    length: number;
    mode: NonNullable<DiagramEdge['mode']>;
    label?: string;
    lines: string[];
    labelX: number;
    labelY: number;
    labelWidth: number;
    labelHeight: number;
};

/** `x`/`y`/`width`/`height` is the box around everything drawn: use it as the SVG viewBox. */
export type Layout = { x: number; y: number; width: number; height: number; nodes: PlacedNode[]; edges: PlacedEdge[] };

/**
 * Places nodes on a grid and routes edges orthogonally:
 *  - neighbours in a row: a straight line (two lines, offset, if both directions exist),
 *    and the gap between the two columns widens to fit the label;
 *  - same column: a straight vertical line;
 *  - same row but skipping columns: routed above the row so it never crosses a node;
 *  - otherwise: an L-shaped route if one misses every other node, else down/up to
 *    the gap between rows, across, then into the target.
 *
 * Pure function, unit-tested in layout.test.ts.
 */
export function layoutDiagram(diagram: Diagram): Layout {
    const cols = Math.max(0, ...diagram.nodes.map((n) => n.col)) + 1;
    const grid = new Map(diagram.nodes.map((n) => [n.id, n]));

    // Widen each column gap to fit the labels of the straight edges that cross it.
    const gaps = Array.from({ length: Math.max(0, cols - 1) }, () => MIN_GAP_X);
    for (const edge of diagram.edges) {
        const a = grid.get(edge.from);
        const b = grid.get(edge.to);
        if (!a || !b || a.row !== b.row || Math.abs(a.col - b.col) !== 1 || !edge.label) continue;

        const gap = Math.min(a.col, b.col);
        gaps[gap] = Math.max(gaps[gap]!, measureLabel(edge.label).width + 28);
    }

    const colX: number[] = [];
    for (let c = 0, x = PAD; c < cols; c++) {
        colX.push(x);
        x += NODE_W + (gaps[c] ?? 0);
    }

    const nodes: PlacedNode[] = diagram.nodes.map((n) => ({
        ...n,
        x: colX[n.col]!,
        y: PAD_TOP + n.row * (NODE_H + GAP_Y),
    }));
    const byId = new Map(nodes.map((n) => [n.id, n]));

    const pairs = new Set(diagram.edges.map((e) => `${e.from}>${e.to}`));

    const edges: PlacedEdge[] = [];
    for (const edge of diagram.edges) {
        const a = byId.get(edge.from);
        const b = byId.get(edge.to);
        if (!a || !b || a === b) continue;

        const bidirectional = pairs.has(`${edge.to}>${edge.from}`);
        edges.push(route(a, b, edge, bidirectional, nodes));
    }

    // Fit the canvas to what is drawn, so there is no empty band above or beside it.
    const xs: number[] = [];
    const ys: number[] = [];
    for (const n of nodes) {
        xs.push(n.x, n.x + NODE_W);
        ys.push(n.y, n.y + NODE_H);
    }
    for (const e of edges) {
        xs.push(...e.points.map((p) => p.x));
        ys.push(...e.points.map((p) => p.y));
        if (e.lines.length > 0) {
            xs.push(e.labelX - e.labelWidth / 2, e.labelX + e.labelWidth / 2);
            ys.push(e.labelY - e.labelHeight / 2, e.labelY + e.labelHeight / 2);
        }
    }
    if (xs.length === 0) return { x: 0, y: 0, width: 0, height: 0, nodes, edges };

    const x = Math.floor(Math.min(...xs)) - PAD;
    const y = Math.floor(Math.min(...ys)) - PAD;

    return {
        x,
        y,
        width: Math.ceil(Math.max(...xs)) + PAD - x,
        height: Math.ceil(Math.max(...ys)) + PAD - y,
        nodes,
        edges,
    };
}

/**
 * Wraps a label onto up to three short lines of similar length (so "a b c d"
 * never leaves one word alone on the last line), and measures the box around it.
 */
export function measureLabel(label: string): { lines: string[]; width: number; height: number } {
    const words = label.trim().split(/\s+/);
    const count = wrap(words, LABEL_CHARS).length;

    // The narrowest width that still needs no more lines than the widest allowed one.
    let lines = wrap(words, LABEL_CHARS);
    for (let limit = Math.max(...words.map((w) => w.length)); limit < LABEL_CHARS; limit++) {
        const candidate = wrap(words, limit);
        if (candidate.length <= count) {
            lines = candidate;
            break;
        }
    }
    if (lines.length > LABEL_MAX_LINES) lines.splice(LABEL_MAX_LINES - 1, Infinity, lines.slice(LABEL_MAX_LINES - 1).join(' '));

    const longest = Math.max(0, ...lines.map((l) => l.length));

    return { lines, width: Math.ceil(longest * CHAR_W) + 14, height: lines.length * LABEL_LINE_H + 6 };
}

function wrap(words: string[], limit: number): string[] {
    const lines: string[] = [];
    for (const word of words) {
        const current = lines[lines.length - 1];
        if (current !== undefined && current.length + 1 + word.length <= limit) lines[lines.length - 1] = `${current} ${word}`;
        else lines.push(word);
    }

    return lines;
}

function route(a: PlacedNode, b: PlacedNode, edge: DiagramEdge, bidirectional: boolean, nodes: PlacedNode[]): PlacedEdge {
    const measured = edge.label ? measureLabel(edge.label) : { lines: [], width: 0, height: 0 };

    const build = (points: Point[], labelX: number, labelY: number): PlacedEdge => ({
        from: a.id,
        to: b.id,
        path: toPath(points),
        points,
        length: points.slice(1).reduce((sum, p, i) => sum + Math.abs(p.x - points[i]!.x) + Math.abs(p.y - points[i]!.y), 0),
        mode: edge.mode ?? 'sync',
        label: edge.label,
        lines: measured.lines,
        labelX,
        labelY,
        labelWidth: measured.width,
        labelHeight: measured.height,
    });

    const acx = a.x + NODE_W / 2;
    const bcx = b.x + NODE_W / 2;
    const acy = a.y + NODE_H / 2;
    const bcy = b.y + NODE_H / 2;
    const half = measured.height / 2;

    if (a.row === b.row && Math.abs(a.col - b.col) === 1) {
        // Offset by direction so the two arrows of a bidirectional pair sit apart,
        // with the label on the outer side of each.
        const forward = b.col > a.col;
        const offset = bidirectional ? (forward ? -BIDI_OFFSET : BIDI_OFFSET) : 0;
        const y = acy + offset;
        const x1 = forward ? a.x + NODE_W : a.x;
        const x2 = forward ? b.x - 2 : b.x + NODE_W + 2;
        const below = bidirectional && !forward;

        return build(
            [
                { x: x1, y },
                { x: x2, y },
            ],
            (x1 + x2) / 2,
            below ? y + half + 6 : y - half - 6,
        );
    }

    if (a.row === b.row) {
        // Skips over intermediate nodes: go up, across above the row, then down.
        const top = a.y - 26;

        return build(
            [
                { x: acx, y: a.y },
                { x: acx, y: top },
                { x: bcx, y: top },
                { x: bcx, y: b.y - 2 },
            ],
            (acx + bcx) / 2,
            top,
        );
    }

    const down = b.row > a.row;

    if (a.col === b.col) {
        const x = acx + (bidirectional ? (down ? -BIDI_OFFSET : BIDI_OFFSET) : 0);
        const y1 = down ? a.y + NODE_H : a.y;
        const y2 = down ? b.y - 2 : b.y + NODE_H + 2;
        // The downward line of a pair sits on the left, so its label goes left too.
        const left = bidirectional && down;

        return build(
            [
                { x, y: y1 },
                { x, y: y2 },
            ],
            left ? x - measured.width / 2 - 8 : x + measured.width / 2 + 8,
            (y1 + y2) / 2,
        );
    }

    const right = b.col > a.col;
    const others = nodes.filter((n) => n !== a && n !== b);

    // L-shape, vertical first: out of a's top/bottom, into b's side.
    const vertical: Point[] = [
        { x: acx, y: down ? a.y + NODE_H : a.y },
        { x: acx, y: bcy },
        { x: right ? b.x - 2 : b.x + NODE_W + 2, y: bcy },
    ];
    if (isClear(vertical, others)) {
        return build(vertical, (acx + vertical[2]!.x) / 2, bcy);
    }

    // L-shape, horizontal first: out of a's side, into b's top/bottom.
    const horizontal: Point[] = [
        { x: right ? a.x + NODE_W : a.x, y: acy },
        { x: bcx, y: acy },
        { x: bcx, y: down ? b.y - 2 : b.y + NODE_H + 2 },
    ];
    if (isClear(horizontal, others)) {
        return build(horizontal, (horizontal[0]!.x + bcx) / 2, acy);
    }

    // Elbow through the gap between the two rows.
    const mid = down ? a.y + NODE_H + GAP_Y / 2 : a.y - GAP_Y / 2;

    return build(
        [
            { x: acx, y: down ? a.y + NODE_H : a.y },
            { x: acx, y: mid },
            { x: bcx, y: mid },
            { x: bcx, y: down ? b.y - 2 : b.y + NODE_H + 2 },
        ],
        (acx + bcx) / 2,
        mid,
    );
}

/** True when no segment of the route passes through (or right next to) another node. */
function isClear(points: Point[], others: PlacedNode[]): boolean {
    const margin = 6;

    return points.slice(1).every((p, i) => {
        const q = points[i]!;
        const [x1, x2] = [Math.min(p.x, q.x), Math.max(p.x, q.x)];
        const [y1, y2] = [Math.min(p.y, q.y), Math.max(p.y, q.y)];

        return others.every((n) => x2 < n.x - margin || x1 > n.x + NODE_W + margin || y2 < n.y - margin || y1 > n.y + NODE_H + margin);
    });
}

/** An orthogonal polyline with rounded corners. */
function toPath(points: Point[]): string {
    const [first, ...rest] = points;
    if (!first) return '';

    if (rest.length === 1) {
        const end = rest[0]!;
        return end.y === first.y ? `M ${first.x} ${first.y} H ${end.x}` : `M ${first.x} ${first.y} V ${end.y}`;
    }

    let d = `M ${first.x} ${first.y}`;
    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1]!;
        const corner = points[i]!;
        const next = points[i + 1]!;
        const r = Math.min(RADIUS, dist(prev, corner) / 2, dist(corner, next) / 2);

        const before = toward(corner, prev, r);
        const after = toward(corner, next, r);
        d += ` L ${before.x} ${before.y} Q ${corner.x} ${corner.y} ${after.x} ${after.y}`;
    }
    const end = points[points.length - 1]!;

    return `${d} L ${end.x} ${end.y}`;
}

function dist(p: Point, q: Point): number {
    return Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
}

function toward(from: Point, to: Point, r: number): Point {
    const d = dist(from, to) || 1;

    return { x: from.x + ((to.x - from.x) / d) * r, y: from.y + ((to.y - from.y) / d) * r };
}
