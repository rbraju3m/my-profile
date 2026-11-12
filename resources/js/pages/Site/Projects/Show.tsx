import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, ExternalLink, Info } from 'lucide-react';

import type { ProjectDetail } from '@/shared/types';

import { FlowDiagram } from '@/site/components/diagrams/FlowDiagram';
import { Layout } from '@/site/components/Layout';
import { Container } from '@/site/components/ui/Container';
import { Reveal } from '@/site/components/ui/Reveal';
import { StatusBadge } from '@/site/components/ui/StatusBadge';
import { Tag } from '@/site/components/ui/Tag';

type Props = {
    project: ProjectDetail;
    previous: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
};

export default function ProjectShow({ project, previous, next }: Props) {
    const facts = [
        { label: 'Role', value: project.role },
        { label: 'Client', value: project.client },
        { label: 'Company', value: project.company },
        { label: 'Period', value: project.period },
    ].filter((f): f is { label: string; value: string } => Boolean(f.value));

    return (
        <Layout>
            <article>
                <header className="relative overflow-hidden border-b border-border">
                    <div aria-hidden="true" className="bg-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
                    <Container className="relative pt-10 pb-12 sm:pt-14 sm:pb-16">
                        <nav aria-label="Breadcrumb">
                            <ol className="flex items-center gap-2 text-sm text-muted">
                                <li>
                                    <Link href="/" className="hover:text-text">
                                        Home
                                    </Link>
                                </li>
                                <li aria-hidden="true">/</li>
                                <li>
                                    <Link href="/projects" className="hover:text-text">
                                        Projects
                                    </Link>
                                </li>
                            </ol>
                        </nav>
                        <div className="mt-8 flex flex-wrap items-center gap-2">
                            <StatusBadge status={project.status} />
                            <span className="font-mono text-xs text-muted">{project.category.label}</span>
                        </div>
                        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{project.title}</h1>
                        <p className="mt-5 max-w-3xl text-lg text-pretty text-muted">{project.summary}</p>
                        {project.status_note && (
                            <p className="mt-5 inline-flex max-w-3xl items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted">
                                <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                                {project.status_note}
                            </p>
                        )}
                        {facts.length > 0 && (
                            <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
                                {facts.map((f) => (
                                    <div key={f.label}>
                                        <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">{f.label}</dt>
                                        <dd className="mt-1 text-sm">{f.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </Container>
                </header>

                <Container className="grid gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_300px] lg:gap-16">
                    <div className="min-w-0 space-y-14">
                        {project.problem && (
                            <Block title="The problem">
                                <p className="text-pretty">{project.problem}</p>
                            </Block>
                        )}

                        {project.contribution && (
                            <Block title="What I did">
                                <div className="prose-content" dangerouslySetInnerHTML={{ __html: project.contribution }} />
                                {project.authorship_note && <p className="mt-4 border-l-2 border-accent pl-3 text-sm">{project.authorship_note}</p>}
                            </Block>
                        )}

                        {project.diagrams.map((diagram) => (
                            <Block key={diagram.slug} title={`Architecture: ${diagram.title}`}>
                                <div className="rounded-2xl border border-border bg-surface/50 p-4 sm:p-6">
                                    <FlowDiagram diagram={diagram} />
                                </div>
                            </Block>
                        ))}

                        {project.features.length > 0 && (
                            <Block title="Key features">
                                <ul className="grid gap-3 sm:grid-cols-2">
                                    {project.features.map((feature) => (
                                        <li key={feature} className="rounded-xl border border-border bg-surface p-4 text-sm text-pretty">
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </Block>
                        )}

                        {project.challenges.length > 0 && (
                            <Block title="Challenges and solutions">
                                <ol className="space-y-4">
                                    {project.challenges.map((c, i) => (
                                        <li key={c.challenge} className="grid gap-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-[auto_1fr]">
                                            <span className="font-mono text-xs text-accent">{String(i + 1).padStart(2, '0')}</span>
                                            <div>
                                                <p className="font-medium text-text">{c.challenge}</p>
                                                <p className="mt-2 text-sm text-pretty">{c.solution}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </Block>
                        )}

                        {project.gallery.length > 0 && (
                            <Block title="Screens">
                                <ul className="grid gap-4 sm:grid-cols-2">
                                    {project.gallery.map((image) => (
                                        <li key={image.url} className="overflow-hidden rounded-xl border border-border">
                                            <img src={image.url} alt={image.alt} loading="lazy" decoding="async" className="w-full" />
                                        </li>
                                    ))}
                                </ul>
                            </Block>
                        )}
                    </div>

                    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
                        {project.metrics.length > 0 && (
                            <section aria-labelledby="metrics-heading">
                                <h2 id="metrics-heading" className="font-mono text-xs tracking-widest text-muted uppercase">
                                    Verified numbers
                                </h2>
                                <dl className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
                                    {project.metrics.map((m) => (
                                        <div key={m.label} className="flex flex-col-reverse p-4">
                                            <dt className="mt-0.5 text-xs text-muted">
                                                {m.label}
                                                {m.source && <span className="mt-1 block text-[11px] text-muted/80">{m.source}</span>}
                                            </dt>
                                            <dd className="font-mono text-xl font-semibold tracking-tight">{m.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                        )}
                        <section aria-labelledby="stack-heading">
                            <h2 id="stack-heading" className="font-mono text-xs tracking-widest text-muted uppercase">
                                Technologies
                            </h2>
                            <ul className="mt-3 flex flex-wrap gap-1.5">
                                {project.technologies.map((t) => (
                                    <li key={t.slug}>
                                        <Link href={`/projects?tech=${t.slug}`}>
                                            <Tag className="transition-colors hover:border-accent hover:text-text">{t.name}</Tag>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                        {project.public_links.length > 0 && (
                            <section aria-labelledby="links-heading">
                                <h2 id="links-heading" className="font-mono text-xs tracking-widest text-muted uppercase">
                                    Links
                                </h2>
                                <ul className="mt-3 space-y-2">
                                    {project.public_links.map((l) => (
                                        <li key={l.url}>
                                            <a
                                                href={l.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                                            >
                                                {l.label}
                                                <ExternalLink className="size-3.5" aria-hidden="true" />
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </aside>
                </Container>

                <Container className="pb-20">
                    <nav aria-label="More projects" className="grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
                        {previous ? (
                            <Link href={`/projects/${previous.slug}`} className="group rounded-xl border border-border p-4 transition-colors hover:border-border-strong">
                                <span className="inline-flex items-center gap-1 text-xs text-muted">
                                    <ArrowLeft className="size-3.5" aria-hidden="true" /> Previous
                                </span>
                                <span className="mt-1 block font-medium group-hover:text-accent">{previous.title}</span>
                            </Link>
                        ) : (
                            <span />
                        )}
                        {next && (
                            <Link
                                href={`/projects/${next.slug}`}
                                className="group rounded-xl border border-border p-4 text-right transition-colors hover:border-border-strong"
                            >
                                <span className="inline-flex items-center gap-1 text-xs text-muted">
                                    Next <ArrowRight className="size-3.5" aria-hidden="true" />
                                </span>
                                <span className="mt-1 block font-medium group-hover:text-accent">{next.title}</span>
                            </Link>
                        )}
                    </nav>
                </Container>
            </article>
        </Layout>
    );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <Reveal>
            <section>
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                <div className="mt-4 text-base leading-relaxed text-muted">{children}</div>
            </section>
        </Reveal>
    );
}
