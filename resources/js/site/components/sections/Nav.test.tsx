import { describe, expect, it } from 'vitest';

import { initials } from './Nav';

describe('initials', () => {
    it('uses the first and last name and skips abbreviations', () => {
        expect(initials('Md. Rashedul Bari Raju')).toBe('RR');
        expect(initials('Rashedul Raju')).toBe('RR');
        expect(initials('Raju')).toBe('R');
        expect(initials('')).toBe('');
    });
});
