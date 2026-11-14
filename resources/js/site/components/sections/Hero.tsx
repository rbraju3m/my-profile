import { usePage } from '@inertiajs/react';
import { ArrowRight, Download, MapPin } from 'lucide-react';
import type { CSSProperties } from 'react';

import type { HeroContent, SharedProps, Stat } from '@/shared/types';

import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { SystemMap } from './SystemMap';

export function Hero({ hero, stats = [] }: { hero: HeroContent; stats?: Stat[] }) {
    const { site, labels } = usePage<SharedProps>().props;

    return (
        <section aria-labelledby="hero-heading" data-spotlight="" data-parallax="" className="relative overflow-hidden [--spot-size:640px]">
            <div aria-hidden="true" className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
            <div
                aria-hidden="true"
                className="hero-drift parallax-far absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-accent-glow blur-3xl"
            />
            <div
                aria-hidden="true"
                className="hero-drift hero-drift-alt parallax-near absolute top-1/2 -right-40 hidden h-[360px] w-[520px] rounded-full bg-accent-glow blur-3xl lg:block"
            />

            {/* min-w-0 on both columns: otherwise the system map's row of steps widens the column past a phone screen. */}
            <Container className="relative grid gap-12 pt-12 pb-16 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:pt-24 lg:pb-24">
                <div className="min-w-0">
                    <div className="hero-enter flex items-center gap-4" style={step(0)}>
                        {site.photo && (
                            <span className="avatar-ring relative inline-block size-14 shrink-0 rounded-full p-[2px] sm:size-16">
                                <img
                                    src={site.photo.avatar}
                                    alt={site.name}
                                    width={64}
                                    height={64}
                                    className="relative size-full rounded-full border-2 border-bg object-cover"
                                />
                            </span>
                        )}
                        <div className="min-w-0">
                            <p className="truncate font-semibold tracking-tight">{site.name}</p>
                            {site.location && (
                                <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted">
                                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                                    {site.location}
                                </p>
                            )}
                        </div>
                    </div>

                    {site.availability.enabled && (
                        <p className="hero-enter mt-5" style={step(0.5)}>
                            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur-sm">
                                <span className="relative flex size-2 shrink-0">
                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60 motion-reduce:hidden" />
                                    <span className="relative inline-flex size-2 rounded-full bg-live" />
                                </span>
                                {site.availability.text}
                            </span>
                        </p>
                    )}

                    {hero.eyebrow && <p className="hero-enter mt-8 font-mono text-xs font-medium tracking-widest text-accent uppercase" style={step(1)}>{hero.eyebrow}</p>}
                    <h1 id="hero-heading" className="mt-3 text-[2.5rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[52px] xl:text-[60px]">
                        {hero.headline}
                    </h1>
                    <p className="mt-6 max-w-xl text-lg text-pretty text-muted">{hero.subheading}</p>

                    {/* The headline and subheading are not animated: one of them is the LCP element. */}
                    <div className="hero-enter mt-8 flex flex-wrap gap-3" style={step(2)}>
                        <Button href={hero.primary_cta.href} magnetic>
                            {hero.primary_cta.label}
                            <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" aria-hidden="true" />
                        </Button>
                        {site.has_cv && (
                            <Button href={hero.secondary_cta.href} variant="secondary" download magnetic>
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
                            {hero.chips.map((chip, i) => (
                                <li
                                    key={chip}
                                    style={step(3 + i * 0.4)}
                                    className="hero-enter rounded-md border border-border bg-surface/60 px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                                >
                                    {chip}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="hero-enter min-w-0" style={step(2.5)}>
                    <SystemMap flows={hero.flows} />
                </div>
            </Container>

            {stats.length > 0 && (
                <Container className="relative pb-16 lg:pb-20">
                    <dl className="hero-enter grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4" style={step(4)}>
                        {stats.map((stat, i) => (
                            <div
                                key={stat.key}
                                className="flex flex-col-reverse justify-end gap-1 bg-surface p-5 odd:last:col-span-2 sm:p-6 sm:odd:last:col-span-1"
                            >
                                <dt className="text-xs text-pretty text-muted sm:text-sm">{labels.home[`stat_${stat.key}`]}</dt>
                                <dd className="font-mono text-3xl font-semibold tracking-tight text-text tabular-nums sm:text-4xl">
                                    <span className="sr-only">
                                        {stat.value}
                                        {stat.suffix}
                                    </span>
                                    {/* Counts up from 0 in CSS (.count-up in site.css); the number above is what's read out. */}
                                    <span aria-hidden="true" className="count-up" style={{ '--to': stat.value, '--i': i } as CSSProperties} />
                                    {stat.suffix && (
                                        <span aria-hidden="true" className="text-accent">
                                            {stat.suffix}
                                        </span>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </Container>
            )}
        </section>
    );
}

/** Stagger index for the CSS entrance animation (`.hero-enter` in site.css). */
function step(i: number): CSSProperties {
    return { '--i': i } as CSSProperties;
}
