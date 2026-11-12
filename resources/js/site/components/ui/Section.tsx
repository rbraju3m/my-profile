import type { ReactNode } from 'react';

import type { SectionCopy } from '@/shared/types';

import { cn } from '../../lib/cn';
import { Container } from './Container';
import { Reveal } from './Reveal';

type Props = {
    id: string;
    copy?: SectionCopy;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
};

/** A page section with the shared eyebrow / heading / intro block. */
export function Section({ id, copy, children, className, action }: Props) {
    const headingId = `${id}-heading`;

    return (
        <section id={id} aria-labelledby={copy ? headingId : undefined} className={cn('py-16 sm:py-24 lg:py-28', className)}>
            <Container>
                {copy && (
                    <Reveal className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
                        <div className="max-w-2xl">
                            {copy.eyebrow && (
                                <p className="mb-3 font-mono text-xs font-medium tracking-widest text-accent uppercase">{copy.eyebrow}</p>
                            )}
                            <h2 id={headingId} className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                                {copy.heading}
                            </h2>
                            {copy.intro && <p className="mt-4 text-base text-pretty text-muted sm:text-lg">{copy.intro}</p>}
                        </div>
                        {action}
                    </Reveal>
                )}
                {children}
            </Container>
        </section>
    );
}
