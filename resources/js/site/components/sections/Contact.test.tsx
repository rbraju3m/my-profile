import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { posts, setPageProps } from '@/test-utils/inertia';
import { labels } from '@/test-utils/labels';

import { Contact } from './Contact';

vi.mock('@inertiajs/react', () => import('@/test-utils/inertia'));
vi.mock('./Turnstile', () => ({ Turnstile: () => <div data-testid="turnstile" /> }));

const encode = (value: string) => btoa(value.split('').reverse().join(''));

const site = {
    name: 'R',
    title: 'T',
    role_line: '',
    location: 'Dhaka',
    socials: [{ label: 'GitHub', url: 'https://github.com/x', icon: 'github' }],
    availability: { enabled: true, text: '' },
    has_cv: false,
    contact: { email: encode('me@example.com'), phone: encode('+880 1700'), whatsapp: null },
};

function props(overrides: Record<string, unknown> = {}) {
    return { site, labels, nav: [], footer: {}, flash: { success: null }, turnstileSiteKey: null, ...overrides };
}

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fillValid() {
    fill('Name', 'Ada Lovelace');
    fill('Email', 'ada@example.com');
    fill('Subject', 'Backend role');
    fill('Message', 'We are hiring a senior Laravel engineer.');
}

beforeEach(() => setPageProps(props()));

describe('Contact', () => {
    it('shows the decoded email and phone as links', () => {
        render(<Contact copy={{ heading: 'Contact' }} />);

        expect(screen.getByRole('link', { name: /me@example.com/ })).toHaveAttribute('href', 'mailto:me@example.com');
        expect(screen.getByRole('link', { name: /\+880 1700/ })).toHaveAttribute('href', 'tel:+880 1700');
        expect(screen.queryByText('WhatsApp')).toBeInTheDocument();
    });

    it('validates in the browser, marks fields invalid and focuses the first one', async () => {
        render(<Contact copy={{ heading: 'Contact' }} />);
        fill('Email', 'nope');

        await act(async () => fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!));

        expect(posts).toHaveLength(0);
        expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Please enter your name.');
        expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Please enter a valid email address.');
        expect(document.activeElement).toBe(screen.getByLabelText('Name'));
    });

    it('posts a valid message to /contact, with the honeypot left empty', async () => {
        render(<Contact copy={{ heading: 'Contact' }} />);
        fillValid();

        await act(async () => fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!));

        expect(posts).toHaveLength(1);
        expect(posts[0]!.url).toBe('/contact');
        expect(posts[0]!.data).toMatchObject({ name: 'Ada Lovelace', website: '' });
    });

    it('asks for the Turnstile check before posting when it is switched on', async () => {
        setPageProps(props({ turnstileSiteKey: 'site-key' }));
        render(<Contact copy={{ heading: 'Contact' }} />);
        fillValid();

        await act(async () => fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!));

        expect(posts).toHaveLength(0);
        expect(screen.getByRole('alert')).toHaveTextContent('Please complete the check');
        expect(screen.getByTestId('turnstile')).toBeInTheDocument();
    });

    it('shows the success message from the server and lets you write another', async () => {
        setPageProps(props({ flash: { success: 'Thanks, I will reply soon.' } }));
        render(<Contact copy={{ heading: 'Contact' }} />);

        expect(screen.getByRole('status')).toHaveTextContent('Thanks, I will reply soon.');
        await act(async () => screen.getByRole('button', { name: 'Send another message' }).click());
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    it('hides the honeypot from people and assistive technology', () => {
        render(<Contact copy={{ heading: 'Contact' }} />);
        const honeypot = document.getElementById('contact-website')!;

        expect(honeypot).toHaveAttribute('tabindex', '-1');
        expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
    });
});
