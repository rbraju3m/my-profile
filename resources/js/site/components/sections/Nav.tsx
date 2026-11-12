import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { SharedProps } from '@/shared/types';

import { cn } from '../../lib/cn';
import { useActiveSection } from '../../lib/useActiveSection';
import { Container } from '../ui/Container';
import { ThemeGrid, ThemePicker } from './ThemePicker';

export function Nav({ onHome }: { onHome: boolean }) {
    const { site, nav, labels } = usePage<SharedProps>().props;
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const active = useActiveSection(onHome ? nav.map((item) => item.href.replace('#', '')) : []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    // On other pages, section links point back to the home page.
    const href = (target: string) => (target.startsWith('#') && !onHome ? `/${target}` : target);

    return (
        <header
            className={cn(
                'sticky top-0 z-40 border-b transition-colors duration-200',
                scrolled || open ? 'border-border bg-bg/80 backdrop-blur-md' : 'border-transparent bg-transparent',
            )}
        >
            <Container className="flex h-16 items-center justify-between gap-4">
                <Link href="/" className="group flex items-center gap-2.5 rounded-md">
                    {site.photo ? (
                        <img
                            src={site.photo.avatar}
                            alt=""
                            width={32}
                            height={32}
                            className="size-8 rounded-full border border-border object-cover transition-[border-color,scale] duration-300 group-hover:scale-110 group-hover:border-accent motion-reduce:group-hover:scale-100"
                        />
                    ) : (
                        <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg border border-border bg-surface font-mono text-xs font-bold text-accent transition-colors group-hover:border-accent">
                            {initials(site.name)}
                        </span>
                    )}
                    {/* The accessible name starts with the visible text (WCAG 2.5.3). */}
                    <span className="sr-only text-sm font-semibold sm:not-sr-only">{site.name}</span>
                    <span className="sr-only">, home</span>
                </Link>

                <nav aria-label="Primary" className="hidden md:block">
                    <ul className="flex items-center gap-1">
                        {nav.map((item) => {
                            const isActive = onHome && active === item.href.replace('#', '');

                            return (
                                <li key={item.href}>
                                    <a
                                        href={href(item.href)}
                                        aria-current={isActive ? 'true' : undefined}
                                        className={cn(
                                            'relative rounded-md px-3 py-2 text-sm transition-colors',
                                            isActive ? 'text-text' : 'text-muted hover:text-text',
                                        )}
                                    >
                                        {item.label}
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                'absolute inset-x-3 -bottom-px h-px origin-left bg-accent transition-transform duration-300',
                                                isActive ? 'scale-x-100' : 'scale-x-0',
                                            )}
                                        />
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="flex items-center gap-1">
                    <ThemePicker />
                    <button
                        type="button"
                        onClick={() => setOpen((v) => !v)}
                        className="grid size-11 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-text md:hidden"
                        aria-expanded={open}
                        aria-controls="mobile-menu"
                        aria-label={open ? labels.common.close_menu : labels.common.open_menu}
                    >
                        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
                    </button>
                </div>
            </Container>

            <div
                id="mobile-menu"
                hidden={!open}
                className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-bg md:hidden"
            >
                <Container className="py-6">
                    <nav aria-label="Mobile">
                        <ul className="space-y-1">
                            {nav.map((item) => (
                                <li key={item.href}>
                                    <a
                                        href={href(item.href)}
                                        onClick={() => setOpen(false)}
                                        className="flex min-h-12 items-center rounded-lg px-3 text-lg font-medium text-text hover:bg-surface-2"
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    {site.has_cv && (
                        <a
                            href="/cv"
                            download
                            className="mt-6 flex min-h-12 items-center justify-center rounded-lg border border-border text-sm font-medium"
                        >
                            {labels.common.download_cv}
                        </a>
                    )}
                    <div className="mt-8 border-t border-border pt-6">
                        <ThemeGrid />
                    </div>
                </Container>
            </div>
        </header>
    );
}

/** "Md. Rashedul Bari Raju" → "RR": first and last name, skipping abbreviations like "Md.". */
export function initials(name: string): string {
    const parts = name.split(/\s+/).filter((part) => part !== '' && !part.endsWith('.'));
    const picked = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;

    return picked.map((part) => part?.[0]?.toUpperCase() ?? '').join('');
}
