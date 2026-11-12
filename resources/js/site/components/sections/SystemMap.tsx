import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

import type { HeroContent } from '@/shared/types';

/**
 * The hero visual: three real data flows from the projects, drawn as a
 * small live system map. Each row links to the case study it comes from.
 */
export function SystemMap({ flows }: { flows: HeroContent['flows'] }) {
    if (flows.length === 0) return null;

    return (
        <div className="relative rounded-2xl border border-border bg-surface/80 p-2 shadow-[0_30px_80px_-40px_var(--accent-glow)] backdrop-blur-sm">
            <div className="flex items-center gap-1.5 border-b border-border px-3 py-2.5">
                <span className="size-2.5 rounded-full bg-border-strong" />
                <span className="size-2.5 rounded-full bg-border-strong" />
                <span className="size-2.5 rounded-full bg-border-strong" />
                <span className="ml-2 font-mono text-[11px] text-muted">systems/in-production.map</span>
            </div>
            <ul className="divide-y divide-border">
                {flows.map((flow, i) => (
                    <li key={flow.project}>
                        <Link
                            href={`/projects/${flow.project}`}
                            className="group block rounded-xl px-3 py-4 transition-colors hover:bg-surface-2 sm:px-4"
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px] tracking-wider text-muted uppercase">{flow.label}</span>
                                <ArrowUpRight
                                    className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                                    aria-hidden="true"
                                />
                            </div>
                            <ol className="mt-3 flex items-center" aria-label={`${flow.label}: ${flow.steps.join(', then ')}`}>
                                {flow.steps.map((step, s) => (
                                    <li key={step} className="flex min-w-0 flex-1 items-center last:flex-none">
                                        <span className="truncate rounded-md border border-border bg-bg px-2 py-1 text-[11px] font-medium sm:text-xs">
                                            {step}
                                        </span>
                                        {s < flow.steps.length - 1 && (
                                            <svg className="mx-1 h-2 min-w-3 flex-1" preserveAspectRatio="none" viewBox="0 0 100 8" aria-hidden="true">
                                                <line
                                                    x1="0"
                                                    y1="4"
                                                    x2="100"
                                                    y2="4"
                                                    stroke="var(--accent)"
                                                    strokeWidth="2"
                                                    strokeDasharray="6 4"
                                                    vectorEffect="non-scaling-stroke"
                                                    className="animate-[flow-dash_1s_linear_infinite]"
                                                    style={{ animationDelay: `${i * 0.3 + s * 0.15}s` }}
                                                />
                                            </svg>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
