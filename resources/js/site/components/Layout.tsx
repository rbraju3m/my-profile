import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

import type { SharedProps } from '@/shared/types';

import { Footer } from './sections/Footer';
import { Nav } from './sections/Nav';

type Meta = { title: string; description: string };

/** Shell shared by every public page: skip link, nav, main, footer. */
export function Layout({ children, onHome = false }: { children: ReactNode; onHome?: boolean }) {
    const { meta } = usePage<SharedProps & { meta: Meta }>().props;

    return (
        <>
            {/*
              The first load gets <title> and the description from the Blade view
              (server-side, so crawlers always see them). On the server this
              renders nothing to avoid duplicates; in the browser it keeps them
              current as Inertia navigates between pages.
            */}
            {typeof window !== 'undefined' && (
                <Head>
                    <title>{meta.title}</title>
                    <meta head-key="description" name="description" content={meta.description} />
                </Head>
            )}
            <a
                href="#main"
                className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-sm text-accent-contrast focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
                Skip to content
            </a>
            <Nav onHome={onHome} />
            <main id="main" tabIndex={-1} className="outline-none">
                {children}
            </main>
            <Footer onHome={onHome} />
        </>
    );
}
