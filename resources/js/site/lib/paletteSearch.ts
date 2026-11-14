export type PaletteGroup = 'sections' | 'projects' | 'actions';

export type PaletteItem = {
    id: string;
    group: PaletteGroup;
    title: string;
    /** Shown under the title, and searched. */
    detail?: string;
    /** Searched but not shown (technologies, category). */
    keywords?: string[];
    run: () => void;
};

const GROUP_ORDER: PaletteGroup[] = ['sections', 'projects', 'actions'];

/**
 * Filters and orders palette items for a query. Every word of the query must
 * appear somewhere in the item; titles that start with the query rank first,
 * then titles containing it, then matches elsewhere. Groups keep a fixed order.
 * Pure, unit-tested.
 */
export function searchPalette(items: PaletteItem[], query: string): PaletteItem[] {
    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    const scored = items
        .map((item, index) => {
            const title = item.title.toLowerCase();
            const haystack = [title, item.detail ?? '', ...(item.keywords ?? [])].join(' ').toLowerCase();
            if (!terms.every((t) => haystack.includes(t))) return null;

            const score = q === '' ? 0 : title.startsWith(q) ? 0 : title.includes(q) ? 1 : 2;
            return { item, index, score };
        })
        .filter((x): x is { item: PaletteItem; index: number; score: number } => x !== null);

    return scored
        .sort((a, b) => GROUP_ORDER.indexOf(a.item.group) - GROUP_ORDER.indexOf(b.item.group) || a.score - b.score || a.index - b.index)
        .map((x) => x.item);
}
