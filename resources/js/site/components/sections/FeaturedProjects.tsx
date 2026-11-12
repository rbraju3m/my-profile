import { usePage } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

import type { ProjectCard as Card, SectionCopy, SharedProps } from '@/shared/types';

import { ProjectCard } from '../projects/ProjectCard';
import { Button } from '../ui/Button';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';

export function FeaturedProjects({ copy, featured, others }: { copy: SectionCopy; featured: Card[]; others: Card[] }) {
    const { labels } = usePage<SharedProps>().props;

    return (
        <Section
            id="projects"
            copy={copy}
            action={
                <Button href="/projects" variant="secondary" className="shrink-0">
                    {labels.home.all_projects}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" aria-hidden="true" />
                </Button>
            }
        >
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((project, i) => (
                    <li key={project.slug}>
                        <Reveal delay={(i % 3) * 0.05} className="h-full">
                            <ProjectCard project={project} featured />
                        </Reveal>
                    </li>
                ))}
            </ul>

            {others.length > 0 && (
                <div className="mt-16">
                    <h3 className="font-mono text-xs tracking-widest text-muted uppercase">{labels.home.more_work}</h3>
                    <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {others.map((project) => (
                            <li key={project.slug}>
                                <ProjectCard project={project} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Section>
    );
}
