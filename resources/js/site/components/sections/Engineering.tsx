import { Link, usePage } from '@inertiajs/react';

import type { SectionCopy, SharedProps, Specialization } from '@/shared/types';

import { Icon } from '../ui/Icon';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { StatusBadge } from '../ui/StatusBadge';

export function Engineering({ copy, specializations }: { copy: SectionCopy; specializations: Specialization[] }) {
    const { labels } = usePage<SharedProps>().props;

    return (
        <Section id="engineering" copy={copy} className="relative border-y border-border bg-surface/40">
            <ul className="grid gap-5 lg:grid-cols-3">
                {specializations.map((spec, i) => (
                    <li key={spec.slug}>
                        <Reveal delay={i * 0.06} className="h-full">
                            <article
                                data-spotlight=""
                                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-border-strong motion-reduce:hover:translate-y-0"
                            >
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -top-24 -right-24 size-56 rounded-full bg-accent-glow blur-2xl transition-transform duration-700 group-hover:scale-150 motion-reduce:transform-none"
                                />
                                <div className="relative grid size-11 place-items-center rounded-xl border border-border bg-bg text-accent transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transform-none">
                                    <Icon name={spec.icon} className="size-5" />
                                </div>
                                <h3 className="relative mt-5 text-lg font-semibold tracking-tight text-balance">{spec.title}</h3>
                                <p className="relative mt-2 text-sm text-pretty text-muted">{spec.summary}</p>

                                <ul className="relative mt-6 flex-1 space-y-3 border-t border-border pt-5">
                                    {spec.capabilities.map((cap) => (
                                        <li key={cap.text} className="flex flex-col gap-1.5">
                                            <span className="text-sm">{cap.text}</span>
                                            <StatusBadge status={cap.status} className="self-start" />
                                        </li>
                                    ))}
                                </ul>

                                {spec.projects.length > 0 && (
                                    <div className="relative mt-6 border-t border-border pt-4">
                                        <p className="font-mono text-[11px] tracking-wider text-muted uppercase">{labels.home.case_studies}</p>
                                        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                                            {spec.projects.map((p) => (
                                                <li key={p.slug}>
                                                    <Link
                                                        href={`/projects/${p.slug}`}
                                                        className="text-sm text-accent underline-offset-4 hover:underline"
                                                    >
                                                        {p.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </article>
                        </Reveal>
                    </li>
                ))}
            </ul>
        </Section>
    );
}
