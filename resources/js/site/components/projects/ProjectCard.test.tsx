import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { ProjectCard as Card } from '@/shared/types';

import { ProjectCard } from './ProjectCard';

vi.mock('@inertiajs/react', () => import('@/test-utils/inertia'));

const tech = ['Laravel', 'React', 'MySQL', 'Redis', 'Docker', 'Nginx'].map((name) => ({ slug: name.toLowerCase(), name }));

const project: Card = {
    slug: 'orbito-erp',
    title: 'Orbito ERP',
    summary: 'A multi-tenant ERP.',
    company: 'Right Brain Solution',
    client: 'Acme',
    period: '2026',
    category: { value: 'erp', label: 'ERP & Business' },
    status: { value: 'built', label: 'Built' },
    status_note: null,
    is_featured: true,
    technologies: tech,
    cover: null,
};

describe('ProjectCard', () => {
    it('links the title to the case study and shows the honest status', () => {
        render(<ProjectCard project={project} />);

        expect(screen.getByRole('link', { name: 'Orbito ERP' })).toHaveAttribute('href', '/projects/orbito-erp');
        expect(screen.getByText('Built')).toBeInTheDocument();
        expect(screen.getByText('Acme · 2026')).toBeInTheDocument();
    });

    it('shows three technologies on a normal card and five on a featured one', () => {
        const { rerender } = render(<ProjectCard project={project} />);
        expect(screen.getByRole('list', { name: 'Technologies' }).children).toHaveLength(3);

        rerender(<ProjectCard project={project} featured />);
        expect(screen.getByRole('list', { name: 'Technologies' }).children).toHaveLength(5);
    });

    it('hides the client line when the client is hidden and there is no period', () => {
        render(<ProjectCard project={{ ...project, client: null, period: null }} />);
        expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    it('renders the cover with its alt text, lazily', () => {
        render(<ProjectCard project={{ ...project, cover: { url: '/c.webp', alt: 'Sales screen' } }} />);
        const img = screen.getByRole('img', { name: 'Sales screen' });
        expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('uses the requested heading level', () => {
        render(<ProjectCard project={project} headingLevel="h2" />);
        expect(screen.getByRole('heading', { level: 2, name: 'Orbito ERP' })).toBeInTheDocument();
    });
});
