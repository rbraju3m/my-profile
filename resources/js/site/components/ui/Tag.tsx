import type { ReactNode } from 'react';

import { cn } from '../../lib/cn';

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <span className={cn('inline-flex items-center rounded-md border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted', className)}>
            {children}
        </span>
    );
}
