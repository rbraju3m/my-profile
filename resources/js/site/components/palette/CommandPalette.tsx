import { router, usePage } from '@inertiajs/react';
import { ArrowRight, Download, FolderOpen, Hash, Mail, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import type { SearchProject, SharedProps } from '@/shared/types';

import { cn } from '../../lib/cn';
import { searchPalette, type PaletteGroup, type PaletteItem } from '../../lib/paletteSearch';
import { useDecoded } from '../../lib/useDecoded';
import { StatusBadge } from '../ui/StatusBadge';

let projectsCache: Promise<SearchProject[]> | null = null;

/** The project list, fetched once per visit, the first time the palette opens. */
function loadProjects(): Promise<SearchProject[]> {
    projectsCache ??= fetch('/search.json', { headers: { Accept: 'application/json' } })
        .then((r) => (r.ok ? r.json() : { projects: [] }))
        .then((data: { projects?: SearchProject[] }) => data.projects ?? [])
        .catch(() => {
            projectsCache = null;
            return [];
        });

    return projectsCache;
}

/** Pages rendered by Inertia; anything else (other sites, /cv, files) is a full page load. */
const INERTIA_PATH = /^\/(projects(\/[^/?#]*)?)?([?#].*)?$/;

export function navigate(href: string, onHome: boolean): void {
    if (href.startsWith('#') && onHome) {
        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
        history.replaceState(history.state, '', href);
    } else if (href.startsWith('#')) {
        router.visit(`/${href}`);
    } else if (/^https?:\/\//.test(href)) {
        window.open(href, '_blank', 'noopener,noreferrer');
    } else if (INERTIA_PATH.test(href)) {
        router.visit(href);
    } else {
        window.location.assign(href);
    }
}

const ICONS: Record<PaletteGroup, ReactNode> = {
    sections: <Hash className="size-4" aria-hidden="true" />,
    projects: <FolderOpen className="size-4" aria-hidden="true" />,
    actions: <ArrowRight className="size-4" aria-hidden="true" />,
};

/**
 * ⌘K / Ctrl+K command palette: jump to a section, open a project, or run an
 * action. Loaded on demand (see PaletteHost), so it costs nothing until used.
 */
export default function CommandPalette({ onClose, onHome }: { onClose: () => void; onHome: boolean }) {
    const { nav, site, labels } = usePage<SharedProps>().props;
    const t = labels.palette;
    const email = useDecoded(site.contact.email);
    const uid = useId().replace(/:/g, '');
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [projects, setProjects] = useState<SearchProject[]>([]);
    const [notice, setNotice] = useState<string | null>(null);
    const input = useRef<HTMLInputElement>(null);
    const list = useRef<HTMLUListElement>(null);

    // After "Copied", close shortly; the cleanup cancels it if the palette closes first.
    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(onClose, 700);
        return () => window.clearTimeout(timer);
    }, [notice, onClose]);

    useEffect(() => {
        let live = true;
        loadProjects().then((p) => live && setProjects(p));
        input.current?.focus();
        return () => {
            live = false;
        };
    }, []);

    const items = useMemo<PaletteItem[]>(() => {
        const go = (href: string) => () => {
            onClose();
            navigate(href, onHome);
        };

        const all: PaletteItem[] = nav.map((n) => ({ id: `s-${n.href}`, group: 'sections', title: n.label, run: go(n.href) }));

        for (const p of projects) {
            all.push({
                id: `p-${p.slug}`,
                group: 'projects',
                title: p.title,
                detail: p.summary,
                keywords: [p.category, p.status.label, ...p.technologies],
                run: go(`/projects/${p.slug}`),
            });
        }

        all.push({ id: 'a-projects', group: 'actions', title: t.all_projects, run: go('/projects') });
        if (site.has_cv) {
            all.push({
                id: 'a-cv',
                group: 'actions',
                title: t.download_cv,
                keywords: ['cv', 'resume', 'résumé', 'pdf'],
                run: () => {
                    onClose();
                    window.location.assign('/cv');
                },
            });
        }
        if (email) {
            all.push({
                id: 'a-email',
                group: 'actions',
                title: t.copy_email,
                detail: email,
                keywords: ['contact', 'mail'],
                run: () => {
                    // No async clipboard (plain HTTP, older browsers): open the mail app instead.
                    if (!navigator.clipboard) {
                        onClose();
                        window.location.assign(`mailto:${email}`);
                        return;
                    }
                    navigator.clipboard.writeText(email).then(
                        () => setNotice(t.copied),
                        () => onClose(),
                    );
                },
            });
        }

        return all;
    }, [nav, projects, site.has_cv, email, t, onClose, onHome]);

    const results = useMemo(() => searchPalette(items, query), [items, query]);
    const current = Math.min(active, Math.max(0, results.length - 1));

    // Keep the highlighted option in view.
    useEffect(() => {
        list.current?.querySelector(`[data-index="${current}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [current]);

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') setActive((i) => (Math.min(i, results.length - 1) + 1) % Math.max(1, results.length));
        else if (e.key === 'ArrowUp') setActive((i) => (Math.min(i, results.length - 1) - 1 + results.length) % Math.max(1, results.length));
        else if (e.key === 'Home' && e.ctrlKey) setActive(0);
        else if (e.key === 'End' && e.ctrlKey) setActive(results.length - 1);
        else if (e.key === 'Enter') results[current]?.run();
        else return;
        e.preventDefault();
    };

    // On the dialog, so they work wherever focus is inside it (a click on a
    // label focuses the dialog itself, which has tabIndex -1).
    const onDialogKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        } else if (e.key === 'Tab') {
            // The field is the dialog's only control: keep focus on it.
            e.preventDefault();
            input.current?.focus();
        }
    };

    const option = (i: number) => `${uid}-opt-${i}`;
    const groups: { key: PaletteGroup; label: string }[] = [
        { key: 'sections', label: t.sections },
        { key: 'projects', label: t.projects },
        { key: 'actions', label: t.actions },
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="presentation">
            <div aria-hidden="true" className="absolute inset-0 bg-bg/70 backdrop-blur-sm" onClick={onClose} />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={t.open}
                tabIndex={-1}
                onKeyDown={onDialogKeyDown}
                className="palette-in outline-none relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-[0_30px_80px_-20px_rgb(0_0_0/0.5)]"
            >
                <div className="flex items-center gap-3 border-b border-border px-4">
                    <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
                    <input
                        ref={input}
                        role="combobox"
                        aria-expanded="true"
                        aria-controls={`${uid}-list`}
                        aria-activedescendant={results.length > 0 ? option(current) : undefined}
                        aria-autocomplete="list"
                        aria-label={t.placeholder}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActive(0);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder={t.placeholder}
                        className="min-h-14 w-full bg-transparent text-base outline-none placeholder:text-muted"
                    />
                    <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">Esc</kbd>
                </div>

                <ul ref={list} id={`${uid}-list`} role="listbox" aria-label={t.placeholder} className="flex-1 overflow-y-auto p-2">
                    {results.length === 0 && <li className="px-3 py-10 text-center text-sm text-muted">{t.empty}</li>}
                    {groups.map((g) => {
                        const inGroup = results.map((item, i) => ({ item, i })).filter((x) => x.item.group === g.key);
                        if (inGroup.length === 0) return null;

                        return (
                            <li key={g.key} role="presentation">
                                <p className="px-3 pt-3 pb-1.5 font-mono text-[10px] tracking-widest text-muted uppercase" aria-hidden="true">
                                    {g.label}
                                </p>
                                <ul role="group" aria-label={g.label}>
                                    {inGroup.map(({ item, i }) => {
                                        const project = item.group === 'projects' ? projects.find((p) => `p-${p.slug}` === item.id) : undefined;

                                        return (
                                            <li
                                                key={item.id}
                                                id={option(i)}
                                                data-index={i}
                                                role="option"
                                                aria-selected={i === current}
                                                onMouseMove={() => i !== current && setActive(i)}
                                                onClick={() => item.run()}
                                                className={cn(
                                                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm',
                                                    i === current ? 'bg-accent-glow text-text' : 'text-muted',
                                                )}
                                            >
                                                <span className={cn('shrink-0', i === current ? 'text-accent' : 'text-muted')}>
                                                    {item.id === 'a-cv' ? <Download className="size-4" aria-hidden="true" /> : item.id === 'a-email' ? <Mail className="size-4" aria-hidden="true" /> : ICONS[item.group]}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-medium text-text">{item.title}</span>
                                                    {item.detail && <span className="block truncate text-xs text-muted">{item.detail}</span>}
                                                </span>
                                                {project && <StatusBadge status={project.status} />}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        );
                    })}
                </ul>

                <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 font-mono text-[11px] text-muted">
                    <span>{t.hint}</span>
                    <span role="status" className="text-accent">
                        {notice}
                    </span>
                </div>
            </div>
        </div>
    );
}
