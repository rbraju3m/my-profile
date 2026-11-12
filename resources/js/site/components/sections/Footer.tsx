import { usePage } from '@inertiajs/react';

import type { SharedProps } from '@/shared/types';

import { Container } from '../ui/Container';
import { Icon } from '../ui/Icon';

export function Footer({ onHome }: { onHome: boolean }) {
    const { site, nav, footer, labels } = usePage<SharedProps>().props;
    const copyright = (footer.copyright ?? '').replace('{year}', String(new Date().getFullYear()));

    return (
        <footer className="border-t border-border">
            <Container className="grid gap-10 py-12 sm:grid-cols-[1.5fr_1fr_1fr]">
                <div>
                    <p className="font-semibold">{site.name}</p>
                    <p className="mt-1 text-sm text-muted">{site.title}</p>
                    {footer.tagline && <p className="mt-4 max-w-sm text-sm text-pretty text-muted">{footer.tagline}</p>}
                </div>
                <nav aria-label="Footer">
                    <p className="font-mono text-xs tracking-widest text-muted uppercase">{labels.footer.navigate}</p>
                    <ul className="mt-3 space-y-2">
                        {nav.map((item) => (
                            <li key={item.href}>
                                <a href={onHome ? item.href : `/${item.href}`} className="text-sm text-muted transition-colors hover:text-text">
                                    {item.label}
                                </a>
                            </li>
                        ))}
                        <li>
                            <a href="/projects" className="text-sm text-muted transition-colors hover:text-text">
                                {labels.footer.all_projects}
                            </a>
                        </li>
                    </ul>
                </nav>
                <div>
                    <p className="font-mono text-xs tracking-widest text-muted uppercase">{labels.footer.elsewhere}</p>
                    <ul className="mt-3 space-y-2">
                        {site.socials.map((social) => (
                            <li key={social.url}>
                                <a
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-text"
                                >
                                    <Icon name={social.icon} className="size-4" />
                                    {social.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </Container>
            <Container className="border-t border-border py-6">
                <p className="text-xs text-muted">{copyright}</p>
            </Container>
        </footer>
    );
}
