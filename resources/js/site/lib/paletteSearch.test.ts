import { describe, expect, it } from 'vitest';

import { searchPalette, type PaletteItem } from './paletteSearch';

const item = (id: string, group: PaletteItem['group'], title: string, extra: Partial<PaletteItem> = {}): PaletteItem => ({
    id,
    group,
    title,
    run: () => {},
    ...extra,
});

const items = [
    item('a', 'actions', 'Browse all projects'),
    item('p1', 'projects', 'Invoice OCR', { keywords: ['Tesseract', 'Laravel'] }),
    item('p2', 'projects', 'Lab analyzer bridge', { detail: 'ASTM and HL7 over serial', keywords: ['Go'] }),
    item('s', 'sections', 'Projects'),
];

describe('searchPalette', () => {
    it('lists everything, sections first, for an empty query', () => {
        expect(searchPalette(items, '  ').map((i) => i.id)).toEqual(['s', 'p1', 'p2', 'a']);
    });

    it('matches every word anywhere: title, detail or keywords', () => {
        expect(searchPalette(items, 'laravel ocr').map((i) => i.id)).toEqual(['p1']);
        expect(searchPalette(items, 'hl7').map((i) => i.id)).toEqual(['p2']);
        expect(searchPalette(items, 'nothing like this')).toEqual([]);
    });

    it('ranks titles that start with the query above other matches within a group', () => {
        const ranked = searchPalette([item('x', 'projects', 'Mobile build pipeline'), item('y', 'projects', 'Build queue')], 'build');

        expect(ranked.map((i) => i.id)).toEqual(['y', 'x']);
    });
});
