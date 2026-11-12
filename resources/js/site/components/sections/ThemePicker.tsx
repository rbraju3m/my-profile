import { usePage } from '@inertiajs/react';
import { Check, Monitor, Palette } from 'lucide-react';
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';

import type { SharedProps, ThemeOption } from '@/shared/types';

import { cn } from '../../lib/cn';
import { useTheme } from '../../lib/useTheme';

/** A small preview of a theme: its own tokens, applied to just this element. */
function Swatch({ theme, className }: { theme: string; className?: string }) {
    return (
        <span data-theme={theme} aria-hidden="true" className={cn('relative flex shrink-0 overflow-hidden rounded-md border border-border bg-bg', className)}>
            <span className="m-1 flex flex-1 flex-col justify-center gap-1 rounded-sm bg-surface px-1">
                <span className="h-1 w-3/4 rounded-full bg-text/80" />
                <span className="h-1 w-1/2 rounded-full bg-muted" />
            </span>
            <span className="my-1 mr-1 w-1.5 rounded-sm bg-accent" />
        </span>
    );
}

type Option = { key: string; label: string; theme?: ThemeOption };

function useOptions(): Option[] {
    const { labels } = usePage<SharedProps>().props;
    const { appearance } = useTheme();
    const schemes = new Set(appearance.themes.map((t) => t.scheme));

    return [
        ...appearance.themes.map((t) => ({ key: t.key, label: t.label, theme: t })),
        // "System" only makes sense when both a light and a dark theme are offered.
        ...(schemes.size > 1 ? [{ key: 'system', label: labels.common.theme_system }] : []),
    ];
}

const centre = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

/** Header button with a popover listing the themes the admin offers. */
export function ThemePicker() {
    const { labels } = usePage<SharedProps>().props;
    const { theme, choice, setTheme, appearance } = useTheme();
    const options = useOptions();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const button = useRef<HTMLButtonElement>(null);
    const panelId = useId();

    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setOpen(false);
            button.current?.focus();
        };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    if (!appearance.picker || options.length < 2) return null;

    const selected = (key: string) => key === (choice === 'system' ? 'system' : theme);

    return (
        <div ref={ref} className="relative">
            <button
                ref={button}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={labels.common.theme}
                className="grid size-11 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
                <Palette className="theme-icon size-[18px]" aria-hidden="true" />
            </button>

            <div
                id={panelId}
                hidden={!open}
                className="theme-panel absolute top-full right-0 z-50 mt-2 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.45)]"
            >
                <p className="px-2.5 pt-1.5 pb-2 font-mono text-[11px] tracking-widest text-muted uppercase">{labels.common.theme}</p>
                <ul className="space-y-0.5">
                    {options.map((option) => (
                        <li key={option.key}>
                            <button
                                type="button"
                                aria-pressed={selected(option.key)}
                                onClick={(e) => {
                                    setTheme(option.key, centre(e));
                                    setOpen(false);
                                    button.current?.focus();
                                }}
                                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm transition-colors hover:bg-surface-2 aria-pressed:bg-surface-2"
                            >
                                {option.theme ? (
                                    <Swatch theme={option.key} className="h-7 w-10" />
                                ) : (
                                    <span aria-hidden="true" className="grid h-7 w-10 place-items-center rounded-md border border-border text-muted">
                                        <Monitor className="size-4" />
                                    </span>
                                )}
                                <span className="flex-1">{option.label}</span>
                                {selected(option.key) && <Check className="size-4 text-accent" aria-hidden="true" />}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

/** The same choices as large tiles, for the mobile menu. */
export function ThemeGrid() {
    const { labels } = usePage<SharedProps>().props;
    const { theme, choice, setTheme, appearance } = useTheme();
    const options = useOptions();

    if (!appearance.picker || options.length < 2) return null;

    const selected = (key: string) => key === (choice === 'system' ? 'system' : theme);

    return (
        <div>
            <p className="px-3 font-mono text-[11px] tracking-widest text-muted uppercase">{labels.common.theme}</p>
            <ul className="mt-3 grid grid-cols-3 gap-2">
                {options.map((option) => (
                    <li key={option.key}>
                        <button
                            type="button"
                            aria-pressed={selected(option.key)}
                            onClick={(e) => setTheme(option.key, centre(e))}
                            className="flex w-full flex-col items-center gap-2 rounded-xl border border-border p-2.5 text-xs transition-colors aria-pressed:border-accent aria-pressed:bg-surface-2"
                        >
                            {option.theme ? (
                                <Swatch theme={option.key} className="h-9 w-full" />
                            ) : (
                                <span aria-hidden="true" className="grid h-9 w-full place-items-center rounded-md border border-border text-muted">
                                    <Monitor className="size-4" />
                                </span>
                            )}
                            {option.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
