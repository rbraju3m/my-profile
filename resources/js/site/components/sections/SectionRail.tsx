import { usePage } from '@inertiajs/react';

import type { SharedProps } from '@/shared/types';

import { cn } from '../../lib/cn';

/**
 * Home page only, wide screens: a rail of dots on the right edge, one per
 * section. The current one is lit; hovering shows the section's name.
 */
export function SectionRail({ active }: { active: string | null }) {
    const { nav, labels } = usePage<SharedProps>().props;
    const sections = nav.filter((n) => n.href.startsWith('#'));

    if (sections.length === 0) return null;

    return (
        <nav aria-label={labels.home.sections} className="fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 xl:block">
            <ul className="flex flex-col items-end gap-1">
                {sections.map((item) => {
                    const on = active === item.href.slice(1);

                    return (
                        <li key={item.href}>
                            <a href={item.href} aria-current={on ? 'true' : undefined} className="group flex items-center justify-end gap-3 py-1.5 pl-4">
                                <span
                                    className={cn(
                                        'rounded-md border border-border bg-surface/90 px-2 py-0.5 font-mono text-[11px] whitespace-nowrap text-muted opacity-0 backdrop-blur-sm transition-[opacity,translate] duration-200',
                                        'translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100',
                                    )}
                                >
                                    {item.label}
                                </span>
                                <span
                                    aria-hidden="true"
                                    className={cn(
                                        'block w-1.5 rounded-full transition-all duration-300',
                                        on ? 'h-6 bg-accent' : 'h-1.5 bg-border-strong group-hover:bg-muted',
                                    )}
                                />
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
