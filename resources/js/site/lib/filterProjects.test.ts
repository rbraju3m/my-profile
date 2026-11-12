import { describe, expect, it } from 'vitest';

import type { ProjectCard } from '@/shared/types';

import { filterProjects } from './filterProjects';

const card = (slug: string, overrides: Partial<ProjectCard> = {}): ProjectCard => ({
    slug,
    title: slug,
    summary: '',
    company: null,
    client: null,
    period: null,
    category: { value: 'web', label: 'Web' },
    status: { value: 'live', label: 'Live' },
    status_note: null,
    is_featured: false,
    technologies: [],
    cover: null,
    ...overrides,
});

const projects = [
    card('dicom', { category: { value: 'healthcare', label: 'Healthcare' }, status: { value: 'built', label: 'Built' }, technologies: [{ slug: 'dicom', name: 'DICOM' }] }),
    card('ocr', { summary: 'Reads pharmacy invoices', technologies: [{ slug: 'python', name: 'Python' }] }),
    card('erp', { client: 'Nourish' }),
];

const none = { query: '', category: null, status: null, tech: null };

describe('filterProjects', () => {
    it('returns everything with no filter', () => {
        expect(filterProjects(projects, none)).toHaveLength(3);
    });

    it('filters by category, status and technology together', () => {
        expect(filterProjects(projects, { ...none, category: 'healthcare', status: 'built', tech: 'dicom' }).map((p) => p.slug)).toEqual(['dicom']);
        expect(filterProjects(projects, { ...none, category: 'healthcare', status: 'live' })).toHaveLength(0);
    });

    it('searches title, summary, client and technology names, all terms required', () => {
        expect(filterProjects(projects, { ...none, query: 'pharmacy' }).map((p) => p.slug)).toEqual(['ocr']);
        expect(filterProjects(projects, { ...none, query: 'nourish' }).map((p) => p.slug)).toEqual(['erp']);
        expect(filterProjects(projects, { ...none, query: 'python invoices' }).map((p) => p.slug)).toEqual(['ocr']);
        expect(filterProjects(projects, { ...none, query: 'python nourish' })).toHaveLength(0);
    });
});
