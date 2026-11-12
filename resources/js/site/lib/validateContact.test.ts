import { describe, expect, it } from 'vitest';

import { validateContact } from './validateContact';

const valid = { name: 'Ada', email: 'ada@example.com', subject: 'Hello', message: 'A message that is long enough.' };

describe('validateContact', () => {
    it('accepts a valid message', () => {
        expect(validateContact(valid)).toEqual({});
    });

    it('reports every problem, in form order', () => {
        expect(Object.keys(validateContact({ name: ' ', email: '', subject: 'x', message: 'short' }))).toEqual(['name', 'email', 'subject', 'message']);
    });

    it('trims before checking lengths, like the server', () => {
        expect(validateContact({ ...valid, name: '  A  ' }).name).toBe('Please enter your name.');
    });

    it.each(['plainaddress', 'a@b', 'a b@c.com', '@example.com'])('rejects the email %s', (email) => {
        expect(validateContact({ ...valid, email }).email).toBe('Please enter a valid email address.');
    });

    it('enforces the server maximums', () => {
        expect(validateContact({ ...valid, message: 'x'.repeat(5001) }).message).toBe('Message can be at most 5,000 characters.');
        expect(validateContact({ ...valid, message: 'x'.repeat(5000) }).message).toBeUndefined();
    });
});
