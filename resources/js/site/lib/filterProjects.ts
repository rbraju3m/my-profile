import type { ProjectCard } from '@/shared/types';

export type ProjectFilter = { query: string; category: string | null; status: string | null; tech: string | null };

/** Client-side filtering for the projects page. Pure, unit-tested. */
export function filterProjects(projects: ProjectCard[], filter: ProjectFilter): ProjectCard[] {
    const terms = filter.query.toLowerCase().split(/\s+/).filter(Boolean);

    return projects.filter((p) => {
        if (filter.category && p.category.value !== filter.category) return false;
        if (filter.status && p.status.value !== filter.status) return false;
        if (filter.tech && !p.technologies.some((t) => t.slug === filter.tech)) return false;
        if (terms.length === 0) return true;

        const haystack = [p.title, p.summary, p.client ?? '', p.company ?? '', p.category.label, ...p.technologies.map((t) => t.name)]
            .join(' ')
            .toLowerCase();

        return terms.every((term) => haystack.includes(term));
    });
}
