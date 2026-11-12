import type { CSSProperties } from 'react';

import type { SectionCopy, SkillCategory } from '@/shared/types';

import { Icon } from '../ui/Icon';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';

export function Skills({ copy, skills }: { copy: SectionCopy; skills: SkillCategory[] }) {
    return (
        <Section id="skills" copy={copy} className="border-y border-border bg-surface/40">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {skills.map((category, i) => (
                    <li key={category.slug}>
                        <Reveal delay={(i % 4) * 0.05} className="h-full">
                            <article
                                data-spotlight=""
                                className="group relative h-full rounded-2xl border border-border bg-surface p-5 transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-border-strong motion-reduce:hover:translate-y-0"
                            >
                                <div className="grid size-9 place-items-center rounded-lg border border-border bg-bg text-accent transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 motion-reduce:transform-none">
                                    <Icon name={category.icon} className="size-[18px]" />
                                </div>
                                <h3 className="mt-4 text-sm font-semibold">{category.name}</h3>
                                {category.description && <p className="mt-1 text-xs text-pretty text-muted">{category.description}</p>}
                                {/* Chips pop in one after another when the card is revealed (data-stagger in site.css). */}
                                <ul data-stagger="" className="mt-4 flex flex-wrap gap-1.5">
                                    {category.technologies.map((tech, t) => (
                                        <li
                                            key={tech.slug}
                                            style={{ '--i': t } as CSSProperties}
                                            className="rounded-md bg-surface-2 px-2 py-1 text-xs text-text hover:bg-accent-glow hover:text-accent"
                                        >
                                            {tech.name}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </Reveal>
                    </li>
                ))}
            </ul>
        </Section>
    );
}
