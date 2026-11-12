import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => title,
        resolve: (name) => {
            const pages = import.meta.glob<{ default: ResolvedComponent }>(['../pages/Site/**/*.tsx', '!**/*.test.tsx'], { eager: true });

            return pages[`../pages/${name}.tsx`]!.default;
        },
        setup: ({ App, props }) => <App {...props} />,
    }),
    // INERTIA_SSR_PORT lets the browser tests run their own SSR server beside a dev one.
    { port: Number(process.env.INERTIA_SSR_PORT ?? 13714) },
);
