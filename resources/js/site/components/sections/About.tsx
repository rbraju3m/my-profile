import { usePage } from '@inertiajs/react';

import type { AboutContent, Education, SectionCopy, SharedProps } from '@/shared/types';

import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';

export function About({ about, education }: { about: AboutContent; education: Education[] }) {
    const { site, labels } = usePage<SharedProps>().props;
    const copy: SectionCopy = { eyebrow: labels.home.about_eyebrow, heading: about.heading };

    return (
        <Section id="about" copy={copy}>
            <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
                <Reveal>
                    {/* Bio HTML is written in the admin and sanitised on save. */}
                    <div className="prose-content max-w-2xl text-base leading-relaxed text-muted sm:text-lg" dangerouslySetInnerHTML={{ __html: about.bio }} />
                </Reveal>
                <div className="space-y-8">
                    {site.photo && (
                        <Reveal>
                            <figure className="portrait group relative mx-auto max-w-sm lg:mx-0">
                                {/* An accent frame behind the photo; it slides out on hover (site.css). */}
                                <div aria-hidden="true" className="portrait-frame absolute inset-0 rounded-2xl border border-accent/60" />
                                <div data-tilt="" data-spotlight="" className="relative overflow-hidden rounded-2xl border border-border bg-surface-2">
                                    <img
                                        src={site.photo.portrait}
                                        alt={`Portrait of ${site.name}`}
                                        width={640}
                                        height={800}
                                        loading="lazy"
                                        decoding="async"
                                        className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
                                    />
                                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-5 pt-16 text-white">
                                        <span className="block font-semibold tracking-tight">{site.name}</span>
                                        <span className="block text-sm text-white/80">{site.title}</span>
                                    </figcaption>
                                </div>
                            </figure>
                        </Reveal>
                    )}
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
                            <h3 className="font-mono text-xs tracking-widest text-muted uppercase">{labels.home.education}</h3>
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
