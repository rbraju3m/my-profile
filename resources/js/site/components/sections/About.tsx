import type { AboutContent, Education, SectionCopy } from '@/shared/types';

import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';

export function About({ about, education }: { about: AboutContent; education: Education[] }) {
    const copy: SectionCopy = { eyebrow: 'About', heading: about.heading };

    return (
        <Section id="about" copy={copy}>
            <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
                <Reveal>
                    {/* Bio HTML is written in the admin and sanitised on save. */}
                    <div className="prose-content max-w-2xl text-base leading-relaxed text-muted sm:text-lg" dangerouslySetInnerHTML={{ __html: about.bio }} />
                </Reveal>
                <div className="space-y-8">
                    <Reveal delay={0.05}>
                        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border">
                            {about.highlights.map((h) => (
                                <div key={h.label} className="bg-surface p-5">
                                    <dt className="sr-only">{h.label}</dt>
                                    <dd>
                                        <span className="block font-mono text-2xl font-semibold tracking-tight text-text sm:text-3xl">{h.value}</span>
                                        <span className="mt-1 block text-xs text-pretty text-muted">{h.label}</span>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>
                    {education.length > 0 && (
                        <Reveal delay={0.1}>
                            <h3 className="font-mono text-xs tracking-widest text-muted uppercase">Education</h3>
                            <ul className="mt-4 space-y-4">
                                {education.map((e) => (
                                    <li key={e.id} className="flex items-baseline justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium">{e.degree}</p>
                                            <p className="text-sm text-muted">
                                                {e.institution}
                                                {e.detail && ` · ${e.detail}`}
                                            </p>
                                        </div>
                                        <span className="shrink-0 font-mono text-xs text-muted">
                                            {e.started_year ? `${e.started_year} – ${e.ended_year ?? ''}` : e.ended_year}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                    )}
                </div>
            </div>
        </Section>
    );
}
