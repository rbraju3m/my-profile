import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Experience, ProjectCard, SkillCategory } from '@/shared/types';
import { labels } from '@/test-utils/labels';

vi.mock('@inertiajs/react', () => ({
    usePage: () => ({ props: { labels } }),
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

const { Skills, usageByTechnology } = await import('./Skills');

const tech = (slug: string, name: string) => ({ slug, name });
const project = (slug: string, title: string, techs: string[]): ProjectCard =>
    ({
        slug,
        title,
        summary: '',
        company: null,
        client: null,
        period: null,
        category: { value: 'web', label: 'Web' },
        status: { value: 'live', label: 'Live' },
        status_note: null,
        is_featured: true,
        technologies: techs.map((t) => tech(t, t)),
        cover: null,
    }) as ProjectCard;

const projects = [project('erp', 'Orbito ERP', ['laravel', 'react']), project('ocr', 'Invoice OCR', ['laravel'])];
const experiences = [{ id: 1, company: 'Acme', title: 'Engineer', technologies: [tech('laravel', 'Laravel')], phases: [] } as unknown as Experience];
const skills: SkillCategory[] = [
    { slug: 'backend', name: 'Backend', description: null, icon: null, technologies: [tech('laravel', 'Laravel'), tech('go', 'Go')] },
];

describe('usageByTechnology', () => {
    it('maps each technology to the projects and roles that list it', () => {
        const usage = usageByTechnology(projects, experiences);

        expect(usage.get('laravel')?.projects.map((p) => p.slug)).toEqual(['erp', 'ocr']);
        expect(usage.get('laravel')?.roles).toHaveLength(1);
        expect(usage.get('react')?.roles).toHaveLength(0);
        expect(usage.get('go')).toBeUndefined();
    });
});

describe('Skills', () => {
    const copy = { eyebrow: 'Skills', heading: 'Skills', intro: null };

    it('shows how many projects use each technology, and opens a panel with them when picked', () => {
        render(<Skills copy={copy} skills={skills} projects={projects} experiences={experiences} />);
        const chip = screen.getByRole('button', { name: /Laravel/ });

        expect(chip).toHaveTextContent('Laravel2');
        expect(chip).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(chip);

        expect(chip).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('Projects: 2 · Roles: 1')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Invoice OCR/ })).toHaveAttribute('href', '/projects/ocr');
        expect(screen.getByRole('link', { name: /See all 2 on the projects page/ })).toHaveAttribute('href', '/projects?tech=laravel');

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(screen.queryByText('Projects: 2 · Roles: 1')).not.toBeInTheDocument();
    });

    it('lists at most six projects in the panel, and links to the rest', () => {
        const many = Array.from({ length: 9 }, (_, i) => project(`p${i}`, `Project ${i}`, ['laravel']));
        render(<Skills copy={copy} skills={skills} projects={many} experiences={[]} />);
        fireEvent.click(screen.getByRole('button', { name: /Laravel/ }));

        expect(screen.getAllByRole('link', { name: /^Project \d/ })).toHaveLength(6);
        expect(screen.getByRole('link', { name: /See all 9 on the projects page/ })).toBeInTheDocument();
    });

    it('claims nothing when neither a project nor a role lists the technology', () => {
        render(<Skills copy={copy} skills={skills} projects={projects} experiences={[]} />);
        fireEvent.click(screen.getByRole('button', { name: 'Go' }));

        expect(screen.getByText(labels.home.skill_unlinked)).toBeInTheDocument();
        expect(screen.queryByText(labels.home.skill_none)).not.toBeInTheDocument();
    });

    it('says so when no listed project uses the technology', () => {
        const goRole = [{ ...experiences[0]!, technologies: [tech('go', 'Go')] }];
        render(<Skills copy={copy} skills={skills} projects={projects} experiences={goRole} />);
        fireEvent.click(screen.getByRole('button', { name: 'Go' }));

        expect(screen.getByText(labels.home.skill_none)).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /projects page/ })).not.toBeInTheDocument();
    });
});
