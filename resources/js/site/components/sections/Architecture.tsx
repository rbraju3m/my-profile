import { useId, useRef, useState, type KeyboardEvent } from 'react';

import type { Diagram, SectionCopy } from '@/shared/types';

import { cn } from '../../lib/cn';
import { FlowDiagram } from '../diagrams/FlowDiagram';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';

/** Diagram showcase as an accessible tab list (arrow keys move between tabs). */
export function Architecture({ copy, diagrams }: { copy: SectionCopy; diagrams: Diagram[] }) {
    const [index, setIndex] = useState(0);
    const uid = useId();
    const tabs = useRef<(HTMLButtonElement | null)[]>([]);

    if (diagrams.length === 0) return null;

    const select = (i: number) => {
        const next = (i + diagrams.length) % diagrams.length;
        setIndex(next);
        tabs.current[next]?.focus();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'ArrowRight') select(index + 1);
        else if (e.key === 'ArrowLeft') select(index - 1);
        else if (e.key === 'Home') select(0);
        else if (e.key === 'End') select(diagrams.length - 1);
        else return;
        e.preventDefault();
    };

    const active = diagrams[index]!;

    return (
        <Section id="architecture" copy={copy}>
            <Reveal>
                <div
                    role="tablist"
                    aria-label="Architecture diagrams"
                    className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
                >
                    {diagrams.map((d, i) => (
                        <button
                            key={d.slug}
                            ref={(el) => {
                                tabs.current[i] = el;
                            }}
                            role="tab"
                            id={`${uid}-tab-${i}`}
                            aria-selected={i === index}
                            aria-controls={`${uid}-panel`}
                            tabIndex={i === index ? 0 : -1}
                            onClick={() => setIndex(i)}
                            onKeyDown={onKeyDown}
                            className={cn(
                                'min-h-10 shrink-0 snap-start rounded-full border px-4 text-sm whitespace-nowrap transition-colors',
                                i === index ? 'border-accent bg-accent-glow text-text' : 'border-border text-muted hover:border-border-strong hover:text-text',
                            )}
                        >
                            {d.title}
                        </button>
                    ))}
                </div>

                <div
                    role="tabpanel"
                    id={`${uid}-panel`}
                    aria-labelledby={`${uid}-tab-${index}`}
                    tabIndex={0}
                    className="mt-6 rounded-2xl border border-border bg-surface/50 p-4 sm:p-8"
                >
                    <FlowDiagram key={active.slug} diagram={active} />
                </div>
            </Reveal>
        </Section>
    );
}
