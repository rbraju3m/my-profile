import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Briefcase, MousePointerClick, X } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';

import type { Experience, ProjectCard, SectionCopy, SharedProps, SkillCategory } from '@/shared/types';

import { cn } from '../../lib/cn';
import { Icon } from '../ui/Icon';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { StatusBadge } from '../ui/StatusBadge';

type Usage = { projects: ProjectCard[]; roles: Experience[] };

/** How many projects the panel lists; the rest are one click away on the projects page. */
const PANEL_LIMIT = 6;

/** For each technology slug: the projects and roles that list it. Pure, exported for tests. */
export function usageByTechnology(projects: ProjectCard[], experiences: Experience[]): Map<string, Usage> {
    const usage = new Map<string, Usage>();
    const entry = (slug: string) => {
        let u = usage.get(slug);
        if (!u) usage.set(slug, (u = { projects: [], roles: [] }));
        return u;
    };
    for (const p of projects) for (const t of p.technologies) entry(t.slug).projects.push(p);
    for (const e of experiences) for (const t of e.technologies) entry(t.slug).roles.push(e);

    return usage;
}

/**
 * Skill cards. Every technology is a toggle: picking one opens a panel with
 * the projects and roles that used it, linking to the filtered projects page.
 */
export function Skills({
    copy,
    skills,
    projects = [],
    experiences = [],
}: {
    copy: SectionCopy;
    skills: SkillCategory[];
    projects?: ProjectCard[];
    experiences?: Experience[];
}) {
    const { labels } = usePage<SharedProps>().props;
    const t = labels.home;
    const [picked, setPicked] = useState<string | null>(null);
    const usage = useMemo(() => usageByTechnology(projects, experiences), [projects, experiences]);

    const tech = picked ? skills.flatMap((c) => c.technologies).find((x) => x.slug === picked) : undefined;
    const used = picked ? usage.get(picked) : undefined;

    return (
        <Section id="skills" copy={copy} className="border-y border-border bg-surface/40">
            <p className="-mt-4 mb-6 inline-flex items-center gap-2 font-mono text-xs text-muted sm:-mt-8">
                <MousePointerClick className="size-3.5 text-accent" aria-hidden="true" />
                {t.skill_hint}
            </p>

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
                                    {category.technologies.map((tech, n) => {
                                        const on = picked === tech.slug;
                                        const count = usage.get(tech.slug)?.projects.length ?? 0;

                                        return (
                                            <li key={tech.slug} style={{ '--i': n } as CSSProperties}>
                                                <button
                                                    type="button"
                                                    aria-pressed={on}
                                                    aria-controls="skill-usage"
                                                    onClick={() => setPicked(on ? null : tech.slug)}
                                                    className={cn(
                                                        'relative z-[2] inline-flex min-h-7 items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
                                                        on
                                                            ? 'chip-picked bg-accent text-accent-contrast'
                                                            : 'bg-surface-2 text-text hover:bg-accent-glow hover:text-accent',
                                                    )}
                                                >
                                                    {tech.name}
                                                    {count > 0 && (
                                                        <span className={cn('font-mono text-[10px] tabular-nums', on ? 'opacity-80' : 'text-muted')}>{count}</span>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </article>
                        </Reveal>
                    </li>
                ))}
            </ul>

            <div id="skill-usage" aria-live="polite">
                {tech && (
                    <div key={tech.slug} className="panel-in relative mt-6 rounded-2xl border border-accent/40 bg-surface p-5 shadow-[0_20px_60px_-30px_var(--accent-glow)] sm:p-6">
                        <button
                            type="button"
                            onClick={() => setPicked(null)}
                            aria-label={t.skill_close}
                            className="absolute top-3 right-3 grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text"
                        >
                            <X className="size-4" aria-hidden="true" />
                        </button>

                        <h3 className="pr-10 text-lg font-semibold tracking-tight">{tech.name}</h3>
                        <p className="mt-1 text-sm text-muted">
                            {used && used.projects.length > 0
                                ? t.skill_used.replace(':projects', String(used.projects.length)).replace(':roles', String(used.roles.length))
                                : used && used.roles.length > 0
                                  ? t.skill_none
                                  : t.skill_unlinked}
                        </p>

                        {used && used.projects.length > 0 && (
                            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {used.projects.slice(0, PANEL_LIMIT).map((p) => (
                                    <li key={p.slug}>
                                        <Link
                                            href={`/projects/${p.slug}`}
                                            className="group flex h-full items-start justify-between gap-3 rounded-xl border border-border bg-bg p-3 transition-colors hover:border-accent"
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium">{p.title}</span>
                                                <span className="mt-1.5 block">
                                                    <StatusBadge status={p.status} />
                                                </span>
                                            </span>
                                            <ArrowRight
                                                className="mt-0.5 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {used && used.roles.length > 0 && (
                            <ul className="mt-4 flex flex-wrap gap-2">
                                {used.roles.map((role) => (
                                    <li key={role.id} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted">
                                        <Briefcase className="size-3 text-accent" aria-hidden="true" />
                                        {role.title} · {role.company}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {used && used.projects.length > 0 && (
                            <Link href={`/projects?tech=${encodeURIComponent(tech.slug)}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
                                {t.skill_all.replace(':count', String(used.projects.length))}
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </Section>
    );
}
