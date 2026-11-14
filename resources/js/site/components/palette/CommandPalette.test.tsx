import { afterEach, describe, expect, it, vi } from 'vitest';

const visit = vi.fn();
vi.mock('@inertiajs/react', () => ({ router: { visit: (...a: unknown[]) => visit(...a) }, usePage: () => ({ props: {} }) }));

const { navigate } = await import('./CommandPalette');

afterEach(() => {
    vi.restoreAllMocks();
    visit.mockReset();
});

describe('navigate', () => {
    it('uses Inertia only for the pages Inertia renders', () => {
        navigate('/projects', false);
        navigate('/projects/orbito-erp', false);
        navigate('/', false);
        navigate('#contact', false);

        expect(visit.mock.calls.map((c) => c[0])).toEqual(['/projects', '/projects/orbito-erp', '/', '/#contact']);
    });

    it('opens other sites in a new tab, and loads other paths (like the CV) normally', () => {
        const open = vi.spyOn(window, 'open').mockReturnValue(null);
        const assign = vi.fn();
        vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, assign } as Location);

        navigate('https://github.com/someone', false);
        navigate('/cv', false);

        expect(open).toHaveBeenCalledWith('https://github.com/someone', '_blank', 'noopener,noreferrer');
        expect(assign).toHaveBeenCalledWith('/cv');
        expect(visit).not.toHaveBeenCalled();
    });

    it('scrolls to a section on the home page without a visit', () => {
        document.body.innerHTML = '<section id="contact"></section>';
        const el = document.getElementById('contact')!;
        el.scrollIntoView = vi.fn();

        navigate('#contact', true);

        expect(el.scrollIntoView).toHaveBeenCalled();
        expect(visit).not.toHaveBeenCalled();
    });
});
