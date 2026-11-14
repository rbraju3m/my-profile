import { ArrowRight, Cpu, Database, Globe, Layers, Server, UserRound, type LucideIcon } from 'lucide-react';
import { useId, useState, type CSSProperties } from 'react';

import type { Diagram, DiagramEdge, DiagramNode, Labels } from '@/shared/types';

import { cn } from '../../lib/cn';
import { LABEL_LINE_H, layoutDiagram, NODE_H, NODE_W } from './layout';

type DiagramLabels = Labels['diagram'];
type NodeType = DiagramNode['type'];

/** Used where the site's labels are not shared (the admin's live preview). */
const DEFAULT_LABELS: DiagramLabels = {
    device: 'Device',
    service: 'Service',
    queue: 'Queue',
    storage: 'Storage',
    user: 'People',
    external: 'External',
    async: '(asynchronous)',
    sync_legend: 'Direct call',
    async_legend: 'Asynchronous',
    hint: 'Hover a component to trace its connections',
};

const TYPES: Record<NodeType, { tone: string; icon: LucideIcon }> = {
    device: { tone: 'var(--in-development)', icon: Cpu },
    service: { tone: 'var(--accent)', icon: Server },
    queue: { tone: 'var(--research)', icon: Layers },
    storage: { tone: 'var(--built)', icon: Database },
    user: { tone: 'var(--live)', icon: UserRound },
    external: { tone: 'var(--muted)', icon: Globe },
};

const ORDER: NodeType[] = ['user', 'device', 'service', 'queue', 'storage', 'external'];

const tone = (type: NodeType) => ({ '--tone': TYPES[type].tone }) as CSSProperties;

/**
 * Draws a diagram stored in the database (nodes on a column/row grid, edges
 * between them). Wide screens get SVG; narrow screens get the same content as
 * an ordered step list, which is also what screen readers read.
 */
export function FlowDiagram({ diagram, className, labels = DEFAULT_LABELS }: { diagram: Diagram; className?: string; labels?: DiagramLabels }) {
    const uid = useId().replace(/:/g, '');
    const layout = layoutDiagram(diagram);
    const [active, setActive] = useState<string | null>(null);
    const titleId = `${uid}-title`;
    const descId = `${uid}-desc`;

    const linked = new Set<string>();
    if (active) {
        linked.add(active);
        for (const e of layout.edges) {
            if (e.from === active) linked.add(e.to);
            if (e.to === active) linked.add(e.from);
        }
    }
    const isLit = (e: { from: string; to: string }) => active !== null && (e.from === active || e.to === active);
    const types = ORDER.filter((t) => diagram.nodes.some((n) => n.type === t));
    const hasAsync = layout.edges.some((e) => e.mode === 'async');

    return (
        <figure className={cn('w-full', className)}>
            <div className="hidden lg:block">
                <div className="-mx-2 overflow-x-auto px-2 pb-2">
                    <svg
                        viewBox={`${layout.x} ${layout.y} ${layout.width} ${layout.height}`}
                        className="h-auto w-full"
                        style={{ minWidth: Math.round(layout.width * 0.75) }}
                        role="img"
                        aria-labelledby={`${titleId} ${descId}`}
                        onMouseLeave={() => setActive(null)}
                    >
                        <title id={titleId}>{diagram.title}</title>
                        <desc id={descId}>{describe(diagram)}</desc>
                        <defs>
                            <pattern id={`${uid}-dots`} width="16" height="16" patternUnits="userSpaceOnUse">
                                <circle cx="1" cy="1" r="1" fill="var(--border)" />
                            </pattern>
                            <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                                <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
                            </marker>
                            <marker id={`${uid}-arrow-lit`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                                <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
                            </marker>
                        </defs>

                        <rect x={layout.x} y={layout.y} width={layout.width} height={layout.height} fill={`url(#${uid}-dots)`} />

                        {layout.edges.map((edge, i) => {
                            const lit = isLit(edge);
                            const dim = active !== null && !lit;

                            return (
                                <g key={`e-${i}`} className="transition-opacity duration-200" opacity={dim ? 0.18 : 1}>
                                    <path
                                        d={edge.path}
                                        fill="none"
                                        stroke={lit ? 'var(--accent)' : 'var(--muted)'}
                                        strokeOpacity={lit ? 1 : 0.55}
                                        strokeWidth={lit ? 2 : 1.5}
                                        strokeLinecap="round"
                                        strokeDasharray={edge.mode === 'async' ? '5 5' : undefined}
                                        markerEnd={`url(#${uid}-arrow${lit ? '-lit' : ''})`}
                                        className={edge.mode === 'async' ? 'animate-[flow-dash_1.2s_linear_infinite]' : undefined}
                                    />
                                    {/* A packet travelling along the edge; hidden for reduced motion (site.css). */}
                                    <circle r={2.75} fill="var(--accent)" className="flow-packet" opacity={0}>
                                        <animateMotion
                                            dur={`${Math.max(1.6, edge.length / 70).toFixed(2)}s`}
                                            begin={`${(-(i * 0.7) % 3).toFixed(2)}s`}
                                            repeatCount="indefinite"
                                            path={edge.path}
                                        />
                                        <animate
                                            attributeName="opacity"
                                            values="0;1;1;0"
                                            keyTimes="0;0.1;0.85;1"
                                            dur={`${Math.max(1.6, edge.length / 70).toFixed(2)}s`}
                                            begin={`${(-(i * 0.7) % 3).toFixed(2)}s`}
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                    {edge.lines.length > 0 && (
                                        <g transform={`translate(${edge.labelX}, ${edge.labelY})`}>
                                            <rect
                                                x={-edge.labelWidth / 2}
                                                y={-edge.labelHeight / 2}
                                                width={edge.labelWidth}
                                                height={edge.labelHeight}
                                                rx={6}
                                                fill="var(--surface)"
                                                stroke={lit ? 'var(--accent)' : 'var(--border-strong)'}
                                            />
                                            <text textAnchor="middle" fontSize={10} fill={lit ? 'var(--text)' : 'var(--muted)'} fontFamily="var(--font-mono)">
                                                {edge.lines.map((line, l) => (
                                                    <tspan key={l} x={0} y={(l - (edge.lines.length - 1) / 2) * LABEL_LINE_H} dominantBaseline="central">
                                                        {line}
                                                    </tspan>
                                                ))}
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}

                        {layout.nodes.map((node) => {
                            const Icon = TYPES[node.type].icon;
                            const dim = active !== null && !linked.has(node.id);

                            return (
                                <foreignObject key={node.id} x={node.x} y={node.y} width={NODE_W} height={NODE_H}>
                                    <div
                                        style={tone(node.type)}
                                        onMouseEnter={() => setActive(node.id)}
                                        className={cn(
                                            'relative flex h-full flex-col overflow-hidden rounded-xl border bg-surface py-2.5 pr-3 pl-4 shadow-sm transition-[opacity,border-color,box-shadow] duration-200',
                                            active === node.id ? 'border-accent shadow-[0_0_0_3px_var(--accent-glow)]' : 'border-border-strong',
                                            dim && 'opacity-35',
                                        )}
                                    >
                                        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-(--tone)" />
                                        <div className="flex items-center gap-1.5 font-mono text-[9.5px] tracking-wider text-muted uppercase">
                                            <Icon className="size-3 text-(--tone)" strokeWidth={2.25} aria-hidden="true" />
                                            {labels[node.type]}
                                        </div>
                                        <div className="mt-1 truncate text-[13.5px] leading-tight font-semibold text-text">{node.label}</div>
                                        {node.sublabel && <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{node.sublabel}</div>}
                                    </div>
                                </foreignObject>
                            );
                        })}
                    </svg>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-muted">
                    {types.map((type) => {
                        const Icon = TYPES[type].icon;
                        return (
                            <span key={type} className="inline-flex items-center gap-1.5" style={tone(type)}>
                                <Icon className="size-3.5 text-(--tone)" aria-hidden="true" />
                                {labels[type]}
                            </span>
                        );
                    })}
                    <span className="inline-flex items-center gap-2">
                        <LineSample />
                        {labels.sync_legend}
                    </span>
                    {hasAsync && (
                        <span className="inline-flex items-center gap-2">
                            <LineSample dashed />
                            {labels.async_legend}
                        </span>
                    )}
                    <span className="ml-auto hidden font-mono text-[11px] [@media(hover:hover)]:inline">{labels.hint}</span>
                </div>
            </div>

            <StepList diagram={diagram} className="lg:hidden" labels={labels} />

            {diagram.description && <figcaption className="mt-4 max-w-3xl text-sm text-pretty text-muted">{diagram.description}</figcaption>}
        </figure>
    );
}

function LineSample({ dashed = false }: { dashed?: boolean }) {
    return (
        <svg width="28" height="8" viewBox="0 0 28 8" aria-hidden="true">
            <path d="M1 4 H22" stroke="var(--muted)" strokeWidth={1.5} strokeDasharray={dashed ? '4 3' : undefined} />
            <path d="M21 1 L27 4 L21 7 z" fill="var(--muted)" />
        </svg>
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
                const Icon = TYPES[node.type].icon;

                return (
                    <li key={node.id} className="relative" style={tone(node.type)}>
                        <span className="absolute top-4 -left-[23.5px] size-2 rounded-full bg-(--tone) ring-4 ring-bg" aria-hidden="true" />
                        <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-3 pl-4">
                            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-(--tone)" />
                            <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider text-muted uppercase">
                                <Icon className="size-3 text-(--tone)" aria-hidden="true" />
                                {labels[node.type]}
                            </p>
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
