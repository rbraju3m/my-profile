import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { useDecoded } from './useDecoded';

/** Mirrors HandleInertiaRequests::encode: base64 of the reversed string. */
const encode = (value: string) => btoa(value.split('').reverse().join(''));

function Show({ value }: { value: string | null }) {
    return <span data-testid="out">{useDecoded(value) ?? 'none'}</span>;
}

describe('useDecoded', () => {
    it('decodes the value in the browser', () => {
        render(<Show value={encode('someone@example.com')} />);
        expect(screen.getByTestId('out')).toHaveTextContent('someone@example.com');
    });

    it('never puts the plain value in server-rendered HTML', () => {
        const html = renderToString(<Show value={encode('someone@example.com')} />);
        expect(html).not.toContain('someone@example.com');
        expect(html).toContain('none');
    });

    it('returns null for missing or broken values', () => {
        render(
            <>
                <Show value={null} />
                <Show value="%%%not base64%%%" />
            </>,
        );
        expect(screen.getAllByTestId('out').map((el) => el.textContent)).toEqual(['none', 'none']);
    });
});
