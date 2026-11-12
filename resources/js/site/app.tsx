import '../../css/site.css';

import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import { hydrateRoot, createRoot } from 'react-dom/client';

void createInertiaApp({
    title: (title) => title,
    resolve: async (name) => {
        const pages = import.meta.glob<{ default: ResolvedComponent }>('../pages/Site/**/*.tsx');
        const page = pages[`../pages/${name}.tsx`];

        if (page === undefined) {
            throw new Error(`Page not found: ${name}`);
        }

        return (await page()).default;
    },
    setup({ el, App, props }) {
        // Hydrate server-rendered markup; fall back to a client render when SSR is off (local dev).
        if (el.hasChildNodes()) {
            hydrateRoot(el, <App {...props} />);
        } else {
            createRoot(el).render(<App {...props} />);
        }
    },
    progress: { color: '#14b8a6', delay: 150 },
});
