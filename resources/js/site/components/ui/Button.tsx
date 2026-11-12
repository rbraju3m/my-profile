import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';

const styles: Record<Variant, string> = {
    primary: 'bg-accent text-accent-contrast hover:bg-accent-strong shadow-[0_0_0_1px_var(--accent),0_8px_24px_-8px_var(--accent-glow)]',
    secondary: 'border border-border bg-surface text-text hover:border-border-strong hover:bg-surface-2',
    ghost: 'text-muted hover:text-text hover:bg-surface-2',
};

const base =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-60';

type Props = {
    href?: string;
    variant?: Variant;
    children: ReactNode;
    className?: string;
    download?: boolean;
    type?: 'button' | 'submit';
    disabled?: boolean;
    onClick?: () => void;
};

/**
 * Renders an Inertia link for internal pages, a plain anchor for hashes,
 * downloads and external URLs, or a button.
 */
export function Button({ href, variant = 'primary', children, className, download, type = 'button', disabled, onClick }: Props) {
    const classes = cn(base, styles[variant], className);

    if (href === undefined) {
        return (
            <button type={type} className={classes} disabled={disabled} onClick={onClick}>
                {children}
            </button>
        );
    }

    const plain = href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || download;

    if (plain) {
        const external = href.startsWith('http');

        return (
            <a href={href} className={classes} download={download || undefined} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {children}
            </a>
        );
    }

    return (
        <Link href={href} className={classes}>
            {children}
        </Link>
    );
}
