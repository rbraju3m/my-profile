import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { Option, ProjectCard as Card, StatusValue } from '@/shared/types';

import { Layout } from '@/site/components/Layout';
import { ProjectCard } from '@/site/components/projects/ProjectCard';
import { Container } from '@/site/components/ui/Container';
import { cn } from '@/site/lib/cn';
import { filterProjects, type ProjectFilter } from '@/site/lib/filterProjects';

type Props = {
    projects: Card[];
    filters: {
        categories: Option[];
        statuses: Option<StatusValue>[];
        technologies: { slug: string; name: string; count: number }[];
    };
    meta: { title: string; description: string };
    /** Filters from the query string, read by the server so SSR and the browser agree. */
    initial: ProjectFilter;
};

const EMPTY: ProjectFilter = { query: '', category: null, status: null, tech: null };

export default function ProjectsIndex({ projects, filters, meta, initial }: Props) {
    const [filter, setFilter] = useState<ProjectFilter>(initial);
    const [showAllTech, setShowAllTech] = useState(false);

    // Mirror the filters into the URL so a filtered view can be shared.
    useEffect(() => {
        const params = new URLSearchParams();
        if (filter.query) params.set('q', filter.query);
        if (filter.category) params.set('category', filter.category);
        if (filter.status) params.set('status', filter.status);
        if (filter.tech) params.set('tech', filter.tech);
        const qs = params.toString();
        window.history.replaceState(window.history.state, '', qs ? `?${qs}` : window.location.pathname);
    }, [filter]);

    const results = useMemo(() => filterProjects(projects, filter), [projects, filter]);
    const active = filter.query !== '' || filter.category !== null || filter.status !== null || filter.tech !== null;
    const tech = showAllTech ? filters.technologies : filters.technologies.slice(0, 14);
    const set = (patch: Partial<ProjectFilter>) => setFilter((f) => ({ ...f, ...patch }));

    return (
        <Layout>
            <Container className="pt-12 pb-24 sm:pt-16">
                <header className="max-w-2xl">
                    <p className="font-mono text-xs font-medium tracking-widest text-accent uppercase">Projects</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{meta.title.split(' · ')[0]}</h1>
                    <p className="mt-4 text-lg text-pretty text-muted">{meta.description}</p>
                </header>

                <div className="mt-10 space-y-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                        <label htmlFor="project-search" className="sr-only">
                            Search projects
                        </label>
                        <input
                            id="project-search"
                            type="search"
                            value={filter.query}
                            onChange={(e) => set({ query: e.target.value })}
                            placeholder="Search by name, client or technology…"
                            className="block min-h-11 w-full rounded-lg border border-border bg-bg pr-3 pl-9 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
                        />
                    </div>

                    <ChipGroup
                        label="Category"
                        options={filters.categories.map((c) => ({ value: c.value, label: c.label }))}
                        value={filter.category}
                        onChange={(category) => set({ category })}
                    />
                    <ChipGroup
                        label="Status"
                        options={filters.statuses.map((s) => ({ value: s.value, label: s.label }))}
                        value={filter.status}
                        onChange={(status) => set({ status })}
                    />
                    <ChipGroup
                        label="Technology"
                        options={tech.map((t) => ({ value: t.slug, label: `${t.name} · ${t.count}` }))}
                        value={filter.tech}
                        onChange={(t) => set({ tech: t })}
                        after={
                            filters.technologies.length > 14 && (
                                <button type="button" onClick={() => setShowAllTech((v) => !v)} className="min-h-9 px-2 text-xs text-accent hover:underline">
                                    {showAllTech ? 'Show fewer' : `Show all ${filters.technologies.length}`}
                                </button>
                            )
                        }
                    />
                </div>

                <div className="mt-8 flex items-center justify-between gap-4">
                    <p className="text-sm text-muted" role="status" aria-live="polite">
                        {results.length} {results.length === 1 ? 'project' : 'projects'}
                    </p>
                    {active && (
                        <button type="button" onClick={() => setFilter(EMPTY)} className="inline-flex min-h-9 items-center gap-1 text-sm text-accent hover:underline">
                            <X className="size-4" aria-hidden="true" />
                            Clear filters
                        </button>
                    )}
                </div>

                {results.length > 0 ? (
                    <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {results.map((project) => (
                            <li key={project.slug}>
                                <ProjectCard project={project} featured={project.is_featured} headingLevel="h2" />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-border p-12 text-center">
                        <p className="font-medium">No projects match these filters.</p>
                        <button type="button" onClick={() => setFilter(EMPTY)} className="mt-2 text-sm text-accent hover:underline">
                            Clear filters
                        </button>
                    </div>
                )}
            </Container>
        </Layout>
    );
}

function ChipGroup({
    label,
    options,
    value,
    onChange,
    after,
}: {
    label: string;
    options: { value: string; label: string }[];
    value: string | null;
    onChange: (value: string | null) => void;
    after?: React.ReactNode;
}) {
    return (
        <fieldset className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
            <legend className="float-left w-24 shrink-0 pt-2 font-mono text-[11px] tracking-wider text-muted uppercase">{label}</legend>
            <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
                {options.map((option) => {
                    const selected = value === option.value;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => onChange(selected ? null : option.value)}
                            className={cn(
                                'min-h-9 shrink-0 rounded-full border px-3 text-xs whitespace-nowrap transition-colors',
                                selected ? 'border-accent bg-accent-glow text-text' : 'border-border text-muted hover:border-border-strong hover:text-text',
                            )}
                        >
                            {option.label}
                        </button>
                    );
                })}
                {after}
            </div>
        </fieldset>
    );
}
