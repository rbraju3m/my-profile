import type { Option, StatusValue } from '@/shared/types';

import { cn } from '../../lib/cn';

const tone: Record<StatusValue, string> = {
    live: 'text-live',
    built: 'text-built',
    in_development: 'text-in-development',
    research: 'text-research',
};

/** Honest project status: live, built, in development or research. */
export function StatusBadge({ status, className }: { status: Option<StatusValue>; className?: string }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
                tone[status.value],
                className,
            )}
        >
            <span
                aria-hidden="true"
                className={cn('size-1.5 rounded-full bg-current', status.value === 'live' && 'animate-[pulse-dot_2s_ease-in-out_infinite]')}
            />
            {status.label}
        </span>
    );
}
