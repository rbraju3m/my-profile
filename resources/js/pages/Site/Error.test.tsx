import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ErrorPage from './Error';

vi.mock('@inertiajs/react', () => import('@/test-utils/inertia'));

const meta = { title: 'Page not found · R', description: '' };

describe('Error page', () => {
    it('shows the status, a heading and ways back', () => {
        render(<ErrorPage status={404} title="Page not found" message="Gone." meta={meta} />);

        expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
        expect(screen.getByRole('link', { name: 'Browse projects' })).toHaveAttribute('href', '/projects');
    });

    it('offers only the home link for server errors', () => {
        render(<ErrorPage status={500} title="Something went wrong" message="Oops." meta={meta} />);
        expect(screen.queryByRole('link', { name: 'Browse projects' })).not.toBeInTheDocument();
    });
});
