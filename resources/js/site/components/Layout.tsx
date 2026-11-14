import { Head, usePage } from '@inertiajs/react';
import { useEffect, type ReactNode } from 'react';

import type { SharedProps } from '@/shared/types';

import { installPointerEffects } from '../lib/pointerEffects';
import { useActiveSection } from '../lib/useActiveSection';
import { PaletteHost } from './palette/PaletteHost';
import { Footer } from './sections/Footer';
import { Nav } from './sections/Nav';
import { SectionRail } from './sections/SectionRail';

type Meta = { title: string; description: string };

/** Shell shared by every public page: skip link, nav, main, footer. */
export function Layout({ children, onHome = false }: { children: ReactNode; onHome?: boolean }) {
    const { meta, labels, nav } = usePage<SharedProps & { meta: Meta }>().props;
    // One observer for the nav underline and the section rail.
    const activeSection = useActiveSection(onHome ? nav.filter((n) => n.href.startsWith('#')).map((n) => n.href.slice(1)) : []);

    useEffect(() => installPointerEffects(), []);

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
                {labels.common.skip}
            </a>
            {/* Reading progress: a CSS scroll-driven animation, no JavaScript (site.css). */}
            <div aria-hidden="true" className="scroll-progress" />
            <Nav onHome={onHome} activeSection={activeSection} />
            <main id="main" tabIndex={-1} className="outline-none">
                {children}
            </main>
            <Footer onHome={onHome} />
            {onHome && <SectionRail active={activeSection} />}
            <PaletteHost onHome={onHome} />
        </>
    );
}
