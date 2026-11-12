import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

import type { ProjectCard as Card } from '@/shared/types';

import { cn } from '../../lib/cn';
import { StatusBadge } from '../ui/StatusBadge';
import { Tag } from '../ui/Tag';

/**
 * A project card. The whole card is one link (the title carries the accessible
 * name; the stretched ::after makes the full card clickable).
 */
export function ProjectCard({ project, featured = false, headingLevel = 'h3' }: { project: Card; featured?: boolean; headingLevel?: 'h2' | 'h3' }) {
    const Heading = headingLevel;
    const by = [project.client, project.period].filter(Boolean).join(' · ');

    return (
        <article
            data-spotlight=""
            className={cn(
                'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-[border-color,translate,box-shadow] duration-300',
                'hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_20px_50px_-30px_var(--accent-glow)] motion-reduce:hover:translate-y-0',
                'focus-within:border-accent',
            )}
        >
            {project.cover && (
                <div className="aspect-[16/9] overflow-hidden border-b border-border bg-surface-2">
                    <img
                        src={project.cover.url}
                        alt={project.cover.alt}
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                </div>
            )}
            <div className={cn('flex flex-1 flex-col', featured ? 'p-6' : 'p-5')}>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={project.status} />
                    <span className="font-mono text-[11px] text-muted">{project.category.label}</span>
                </div>
                <Heading className={cn('mt-4 font-semibold tracking-tight', featured ? 'text-xl' : 'text-base')}>
                    <Link href={`/projects/${project.slug}`} className="outline-none after:absolute after:inset-0 after:content-['']" prefetch>
                        {project.title}
                    </Link>
                </Heading>
                {by && <p className="mt-1 text-xs text-muted">{by}</p>}
                <p className={cn('mt-3 flex-1 text-pretty text-muted', featured ? 'text-[15px]' : 'text-sm')}>{project.summary}</p>
                <div className="mt-5 flex items-end justify-between gap-4">
                    <ul className="flex flex-wrap gap-1.5" aria-label="Technologies">
                        {project.technologies.slice(0, featured ? 5 : 3).map((t) => (
                            <li key={t.slug}>
                                <Tag>{t.name}</Tag>
                            </li>
                        ))}
                    </ul>
                    <ArrowUpRight
                        className="size-5 shrink-0 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
                        aria-hidden="true"
                    />
                </div>
            </div>
        </article>
    );
}
