import type { InertiaFormProps } from '@inertiajs/react';

/** Laravel returns nested errors as dotted keys ("features.2"); read them by that key. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorsOf(form: InertiaFormProps<any>): (key: string) => string | undefined {
    const errors = form.errors as Record<string, string | undefined>;

    return (key: string) => errors[key];
}

/** True when any error key starts with one of the prefixes (to flag a tab that has errors). */
export function hasErrorsIn(errors: Record<string, unknown>, prefixes: string[]): boolean {
    return Object.keys(errors).some((key) => prefixes.some((p) => key === p || key.startsWith(`${p}.`)));
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120);
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
