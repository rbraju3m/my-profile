import type { CSSProperties } from 'react';

import type { Experience, SectionCopy } from '@/shared/types';

import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { Tag } from '../ui/Tag';

export function ExperienceTimeline({ copy, experiences }: { copy: SectionCopy; experiences: Experience[] }) {
    return (
        <Section id="experience" copy={copy}>
            <ol className="space-y-10">
                {experiences.map((job) => (
                    <li key={job.id}>
                        <Reveal>
                            <article className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-12">
                                <header className="lg:sticky lg:top-24 lg:self-start">
                                    <p className="font-mono text-xs text-muted">
                                        {job.started_at} — {job.ended_at ?? 'Present'}
                                    </p>
                                    <h3 className="mt-2 text-xl font-semibold tracking-tight">{job.title}</h3>
                                    <p className="text-muted">{job.company}</p>
                                    {job.location && <p className="mt-1 text-sm text-muted">{job.location}</p>}
                                    {job.summary && <p className="mt-4 text-sm text-pretty text-muted">{job.summary}</p>}
                                    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
                                        {job.technologies.map((t) => (
                                            <li key={t.slug}>
                                                <Tag>{t.name}</Tag>
                                            </li>
                                        ))}
                                    </ul>
                                </header>

                                <div className="relative space-y-8 border-l border-border pl-6 sm:pl-8">
                                    {/* The line fills with the accent colour as it scrolls through the viewport (site.css). */}
                                    <span aria-hidden="true" className="timeline-fill absolute top-0 -left-px h-full w-px bg-accent" />
                                    {job.phases.map((phase, p) => (
                                        <section key={phase.title} aria-label={phase.title} className="timeline-phase relative">
                                            <span
                                                aria-hidden="true"
                                                style={{ '--i': p } as CSSProperties}
                                                className="timeline-dot absolute top-1.5 -left-[29px] grid size-2.5 place-items-center rounded-full border-2 border-accent bg-bg sm:-left-[37px]"
                                            >
                                                {/* Fills in as the phase reaches the middle of the screen (site.css). */}
                                                <span className="timeline-dot-fill size-full rounded-full" />
                                            </span>
                                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                                <h4 className="font-semibold">{phase.title}</h4>
                                                {phase.period && <span className="font-mono text-xs text-muted">{phase.period}</span>}
                                            </div>
                                            <ul className="mt-3 space-y-3">
                                                {phase.points.map((point) => (
                                                    <li key={point} className="relative pl-4 text-sm leading-relaxed text-pretty text-muted sm:text-[15px]">
                                                        <span aria-hidden="true" className="absolute top-2.5 left-0 h-px w-2 bg-border-strong" />
                                                        {point}
                                                    </li>
                                                ))}
                                            </ul>
                                        </section>
                                    ))}
                                </div>
                            </article>
                        </Reveal>
                    </li>
                ))}
            </ol>
        </Section>
    );
}
