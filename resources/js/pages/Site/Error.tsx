import { Head } from '@inertiajs/react';

import { Button } from '@/site/components/ui/Button';
import { Container } from '@/site/components/ui/Container';

type Props = {
    status: number;
    title: string;
    message: string;
    meta: { title: string; description: string };
};

/**
 * Public error page (404, 500, ...). Self-contained on purpose: it can render
 * before any middleware ran, so it uses no shared props (nav, footer, site).
 */
export default function ErrorPage({ status, title, message, meta }: Props) {
    const recoverable = status === 404 || status === 403;

    return (
        <>
            {typeof window !== 'undefined' && (
                <Head>
                    <title>{meta.title}</title>
                </Head>
            )}
            <main id="main" className="flex min-h-dvh items-center py-24">
                <Container className="max-w-xl text-center">
                    <p className="font-mono text-sm tracking-wider text-accent">{status}</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h1>
                    <p className="mt-4 text-muted text-pretty">{message}</p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        <Button href="/">Back to home</Button>
                        {recoverable && (
                            <Button href="/projects" variant="secondary">
                                Browse projects
                            </Button>
                        )}
                    </div>
                </Container>
            </main>
        </>
    );
}
