import { ArrowRight } from 'lucide-react';
import { useId } from 'react';

import type { Diagram, DiagramEdge, DiagramNode, Labels } from '@/shared/types';

import { cn } from '../../lib/cn';
import { layoutDiagram, NODE_H, NODE_W } from './layout';

type DiagramLabels = Labels['diagram'];

/** Used where the site's labels are not shared (the admin's live preview). */
const DEFAULT_LABELS: DiagramLabels = {
    device: 'Device',
    service: 'Service',
    queue: 'Queue',
    storage: 'Storage',
    user: 'People',
    external: 'External',
    async: '(asynchronous)',
};

const typeTone: Record<DiagramNode['type'], string> = {
    device: 'bg-in-development',
    service: 'bg-accent',
    queue: 'bg-research',
    storage: 'bg-built',
    user: 'bg-live',
    external: 'bg-muted',
};

/**
 * Draws a diagram stored in the database (nodes on a column/row grid, edges
 * between them). Wide screens get SVG; narrow screens get the same content as
 * an ordered step list, which is also what screen readers read.
 */
export function FlowDiagram({ diagram, className, labels = DEFAULT_LABELS }: { diagram: Diagram; className?: string; labels?: DiagramLabels }) {
    const uid = useId().replace(/:/g, '');
    const layout = layoutDiagram(diagram);
    const titleId = `${uid}-title`;
    const descId = `${uid}-desc`;

    return (
        <figure className={cn('w-full', className)}>
            <div className="hidden lg:block">
                <svg
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                    className="h-auto w-full"
                    role="img"
                    aria-labelledby={`${titleId} ${descId}`}
                >
                    <title id={titleId}>{diagram.title}</title>
                    <desc id={descId}>{describe(diagram)}</desc>
                    <defs>
                        <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                            <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
                        </marker>
                    </defs>

                    {layout.edges.map((edge, i) => (
                        <g key={`e-${i}`}>
                            <path
                                d={edge.path}
                                fill="none"
                                stroke="var(--border-strong)"
                                strokeWidth={1.5}
                                strokeDasharray={edge.mode === 'async' ? '5 5' : undefined}
                                markerEnd={`url(#${uid}-arrow)`}
                                className={edge.mode === 'async' ? 'animate-[flow-dash_1.2s_linear_infinite]' : undefined}
                            />
                            {edge.label && (
                                <g transform={`translate(${edge.labelX}, ${edge.labelY})`}>
                                    <rect
                                        x={-edge.labelWidth / 2}
                                        y={-9}
                                        width={edge.labelWidth}
                                        height={18}
                                        rx={5}
                                        fill="var(--bg)"
                                        stroke="var(--border)"
                                    />
                                    <text textAnchor="middle" dominantBaseline="central" fontSize={10} fill="var(--muted)" fontFamily="var(--font-mono)">
                                        {edge.label}
                                    </text>
                                </g>
                            )}
                        </g>
                    ))}

                    {layout.nodes.map((node) => (
                        <foreignObject key={node.id} x={node.x} y={node.y} width={NODE_W} height={NODE_H}>
                            <div className="flex h-full flex-col justify-center rounded-xl border border-border bg-surface px-3 py-2 shadow-[0_1px_0_0_var(--border)]">
                                <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-muted uppercase">
                                    <span className={cn('size-1.5 rounded-full', typeTone[node.type])} />
                                    {labels[node.type]}
                                </div>
                                <div className="mt-0.5 truncate text-[13px] leading-tight font-semibold text-text">{node.label}</div>
                                {node.sublabel && <div className="mt-0.5 line-clamp-2 text-[10.5px] leading-snug text-muted">{node.sublabel}</div>}
                            </div>
                        </foreignObject>
                    ))}
                </svg>
            </div>

            <StepList diagram={diagram} className="lg:hidden" labels={labels} />

            {diagram.description && <figcaption className="mt-4 max-w-3xl text-sm text-pretty text-muted">{diagram.description}</figcaption>}
        </figure>
    );
}

/** The narrow-screen version: nodes in reading order with their outgoing edges. */
function StepList({ diagram, className, labels }: { diagram: Diagram; className?: string; labels: DiagramLabels }) {
    const byId = new Map(diagram.nodes.map((n) => [n.id, n]));
    const ordered = [...diagram.nodes].sort((a, b) => a.col - b.col || a.row - b.row);

    return (
        <ol className={cn('relative space-y-3 border-l border-border pl-5', className)}>
            {ordered.map((node) => {
                const outgoing = diagram.edges.filter((e) => e.from === node.id);

                return (
                    <li key={node.id} className="relative">
                        <span className={cn('absolute top-4 -left-[23.5px] size-2 rounded-full ring-4 ring-bg', typeTone[node.type])} aria-hidden="true" />
                        <div className="rounded-xl border border-border bg-surface p-3">
                            <p className="font-mono text-[10px] tracking-wider text-muted uppercase">{labels[node.type]}</p>
                            <p className="text-sm font-semibold">{node.label}</p>
                            {node.sublabel && <p className="text-xs text-muted">{node.sublabel}</p>}
                            {outgoing.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                    {outgoing.map((edge, i) => (
                                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted">
                                            <ArrowRight className="mt-0.5 size-3 shrink-0 text-accent" aria-hidden="true" />
                                            <span>
                                                <span className="text-text">{byId.get(edge.to)?.label ?? edge.to}</span>
                                                {edge.label && <> · {edge.label}</>}
                                                {edge.mode === 'async' && <span className="sr-only"> {labels.async}</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

function describe(diagram: Diagram): string {
    const byId = new Map(diagram.nodes.map((n) => [n.id, n.label]));

    return diagram.edges
        .map((e: DiagramEdge) => `${byId.get(e.from) ?? e.from} to ${byId.get(e.to) ?? e.to}${e.label ? `: ${e.label}` : ''}`)
        .join('. ');
}
