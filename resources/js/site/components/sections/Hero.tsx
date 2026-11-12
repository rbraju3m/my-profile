import { usePage } from '@inertiajs/react';
import { ArrowRight, Download, MapPin } from 'lucide-react';

import type { HeroContent, SharedProps } from '@/shared/types';

import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { SystemMap } from './SystemMap';

export function Hero({ hero }: { hero: HeroContent }) {
    const { site } = usePage<SharedProps>().props;

    return (
        <section aria-labelledby="hero-heading" className="relative overflow-hidden">
            <div aria-hidden="true" className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
            <div
                aria-hidden="true"
                className="absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-accent-glow blur-3xl"
            />

            <Container className="relative grid gap-12 pt-14 pb-16 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10 lg:pt-24 lg:pb-24">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        {site.availability.enabled && (
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
                                <span className="relative flex size-2">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60 motion-reduce:hidden" />
                                    <span className="relative inline-flex size-2 rounded-full bg-live" />
                                </span>
                                {site.availability.text}
                            </span>
                        )}
                        {site.location && (
                            <span className="inline-flex items-center gap-1.5 px-1 text-xs text-muted">
                                <MapPin className="size-3.5" aria-hidden="true" />
                                {site.location}
                            </span>
                        )}
                    </div>

                    {hero.eyebrow && <p className="mt-8 font-mono text-xs font-medium tracking-widest text-accent uppercase">{hero.eyebrow}</p>}
                    <h1 id="hero-heading" className="mt-3 text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[64px]">
                        {hero.headline}
                    </h1>
                    <p className="mt-6 max-w-xl text-lg text-pretty text-muted">{hero.subheading}</p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Button href={hero.primary_cta.href}>
                            {hero.primary_cta.label}
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Button>
                        {site.has_cv && (
                            <Button href={hero.secondary_cta.href} variant="secondary" download>
                                <Download className="size-4" aria-hidden="true" />
                                {hero.secondary_cta.label}
                            </Button>
                        )}
                        <Button href={hero.tertiary_cta.href} variant="ghost">
                            {hero.tertiary_cta.label}
                        </Button>
                    </div>

                    {hero.chips.length > 0 && (
                        <ul className="mt-10 flex flex-wrap gap-2" aria-label="Core technologies">
                            {hero.chips.map((chip) => (
                                <li key={chip} className="rounded-md border border-border bg-surface/60 px-2.5 py-1 font-mono text-xs text-muted">
                                    {chip}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <SystemMap flows={hero.flows} />
            </Container>
        </section>
    );
}
