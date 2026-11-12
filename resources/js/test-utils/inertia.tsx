/**
 * A small stand-in for @inertiajs/react in component tests:
 * `vi.mock('@inertiajs/react', () => import('@/test-utils/inertia'))`.
 * Set the page props with `setPageProps()` and read form posts from `posts`.
 */
import { useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

let pageProps: Record<string, unknown> = {};

export const posts: { url: string; data: unknown; options: Record<string, unknown> }[] = [];

export function setPageProps(props: Record<string, unknown>) {
    pageProps = props;
    posts.length = 0;
}

export function usePage<T>() {
    return { props: pageProps as T, url: '/' };
}

export function Link({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; children?: ReactNode }) {
    const rest = { ...props };
    delete rest.prefetch;
    return (
        <a href={href} {...rest}>
            {children}
        </a>
    );
}

export function Head({ children }: { children?: ReactNode }) {
    return <>{children}</>;
}

export function useForm<T extends Record<string, unknown>>(initial: T) {
    const [data, setDataState] = useState<T>(initial);
    const [errors, setErrors] = useState<Record<string, string>>({});

    return {
        data,
        errors,
        processing: false,
        setData: (key: keyof T, value: unknown) => setDataState((d) => ({ ...d, [key]: value })),
        setError: (key: string, message: string) => setErrors((e) => ({ ...e, [key]: message })),
        clearErrors: () => setErrors({}),
        reset: () => setDataState(initial),
        post: (url: string, options: Record<string, unknown> = {}) => {
            posts.push({ url, data, options });
        },
    };
}
