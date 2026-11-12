import { useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { z } from 'zod';

import type { SectionCopy, SharedProps } from '@/shared/types';

import { cn } from '../../lib/cn';
import { useDecoded } from '../../lib/useDecoded';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Reveal } from '../ui/Reveal';
import { Section } from '../ui/Section';
import { Turnstile } from './Turnstile';

/* Mirrors App\Http\Requests\Site\ContactMessageRequest, which stays the authority. */
const schema = z.object({
    name: z.string().trim().min(2, 'Please enter your name.').max(120),
    email: z.string().trim().email('Please enter a valid email address.').max(190),
    subject: z.string().trim().min(3, 'Please add a short subject.').max(160),
    message: z.string().trim().min(20, 'Please write at least 20 characters so I know how to help.').max(5000),
});

type Fields = z.infer<typeof schema> & { website: string; 'cf-turnstile-response': string };

export function Contact({ copy }: { copy: SectionCopy }) {
    const { site, flash, turnstileSiteKey } = usePage<SharedProps & { turnstileSiteKey: string | null }>().props;
    const [attempt, setAttempt] = useState(0);
    const email = useDecoded(site.contact.email);
    const phone = useDecoded(site.contact.phone);
    const whatsapp = useDecoded(site.contact.whatsapp);

    const form = useForm<Fields>({ name: '', email: '', subject: '', message: '', website: '', 'cf-turnstile-response': '' });
    // The success message comes from the server's flash; "send another" just hides it.
    const [dismissed, setDismissed] = useState(false);
    const sent = Boolean(flash.success) && !dismissed;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.clearErrors();

        const result = schema.safeParse(form.data);
        if (!result.success) {
            for (const issue of result.error.issues) {
                form.setError(issue.path[0] as keyof Fields, issue.message);
            }
            const first = result.error.issues[0]?.path[0];
            if (typeof first === 'string') document.getElementById(`contact-${first}`)?.focus();
            return;
        }

        if (turnstileSiteKey && !form.data['cf-turnstile-response']) {
            form.setError('form' as keyof Fields, 'Please complete the check above the Send button.');
            return;
        }

        form.post('/contact', {
            preserveScroll: true,
            // A Turnstile token is single-use, so ask for a new one after every attempt.
            onFinish: () => setAttempt((n) => n + 1),
            onSuccess: () => {
                form.reset();
                setDismissed(false);
            },
        });
    };

    const errors = form.errors as Partial<Record<keyof Fields | 'form', string>>;

    return (
        <Section id="contact" copy={copy}>
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
                <Reveal>
                    <ul className="space-y-3">
                        <ContactRow icon={<Mail className="size-4" />} label="Email" value={email} href={email ? `mailto:${email}` : undefined} />
                        <ContactRow icon={<Phone className="size-4" />} label="Phone" value={phone} href={phone ? `tel:${phone}` : undefined} />
                        <ContactRow
                            icon={<MessageCircle className="size-4" />}
                            label="WhatsApp"
                            value={whatsapp ? `+${whatsapp}` : null}
                            href={whatsapp ? `https://wa.me/${whatsapp}` : undefined}
                        />
                        {site.location && <ContactRow icon={<MapPin className="size-4" />} label="Location" value={site.location} />}
                    </ul>
                    <ul className="mt-6 flex gap-2">
                        {site.socials.map((s) => (
                            <li key={s.url}>
                                <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    className="grid size-11 place-items-center rounded-lg border border-border bg-surface text-muted transition-colors hover:border-border-strong hover:text-text"
                                >
                                    <Icon name={s.icon} className="size-[18px]" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </Reveal>

                <Reveal delay={0.05}>
                    {sent ? (
                        <div role="status" className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-8">
                            <CheckCircle2 className="size-8 text-live" aria-hidden="true" />
                            <p className="text-lg font-medium">{flash.success}</p>
                            <Button variant="secondary" onClick={() => setDismissed(true)}>
                                Send another message
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-8">
                            {errors.form && (
                                <p role="alert" className="rounded-lg border border-in-development/40 bg-in-development/10 px-3 py-2 text-sm">
                                    {errors.form}
                                </p>
                            )}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field id="name" label="Name" error={errors.name}>
                                    <input
                                        id="contact-name"
                                        autoComplete="name"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        {...fieldProps('name', errors.name)}
                                    />
                                </Field>
                                <Field id="email" label="Email" error={errors.email}>
                                    <input
                                        id="contact-email"
                                        type="email"
                                        autoComplete="email"
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                        {...fieldProps('email', errors.email)}
                                    />
                                </Field>
                            </div>
                            <Field id="subject" label="Subject" error={errors.subject}>
                                <input
                                    id="contact-subject"
                                    value={form.data.subject}
                                    onChange={(e) => form.setData('subject', e.target.value)}
                                    {...fieldProps('subject', errors.subject)}
                                />
                            </Field>
                            <Field id="message" label="Message" error={errors.message}>
                                <textarea
                                    id="contact-message"
                                    rows={6}
                                    value={form.data.message}
                                    onChange={(e) => form.setData('message', e.target.value)}
                                    {...fieldProps('message', errors.message)}
                                    className={cn(fieldProps('message', errors.message).className, 'min-h-36 resize-y py-3')}
                                />
                            </Field>

                            {/* Honeypot: invisible to people and screen readers; bots fill it in. */}
                            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                                <label htmlFor="contact-website">Website</label>
                                <input
                                    id="contact-website"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={form.data.website}
                                    onChange={(e) => form.setData('website', e.target.value)}
                                />
                            </div>

                            {turnstileSiteKey && (
                                <Turnstile siteKey={turnstileSiteKey} resetKey={attempt} onToken={(token) => form.setData('cf-turnstile-response', token)} />
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                <p className="text-xs text-muted">All fields are required.</p>
                                <Button type="submit" disabled={form.processing}>
                                    <Send className="size-4" aria-hidden="true" />
                                    {form.processing ? 'Sending…' : 'Send message'}
                                </Button>
                            </div>
                        </form>
                    )}
                </Reveal>
            </div>
        </Section>
    );
}

function fieldProps(name: string, error?: string) {
    return {
        name,
        required: true,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? `contact-${name}-error` : undefined,
        className: cn(
            'block min-h-11 w-full rounded-lg border bg-bg px-3 text-sm text-text placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus-visible:outline-none',
            error ? 'border-in-development' : 'border-border',
        ),
    };
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
    return (
        <div>
            <label htmlFor={`contact-${id}`} className="mb-1.5 block text-sm font-medium">
                {label}
            </label>
            {children}
            {error && (
                <p id={`contact-${id}-error`} className="mt-1.5 text-xs text-in-development">
                    {error}
                </p>
            )}
        </div>
    );
}

function ContactRow({ icon, label, value, href }: { icon: ReactNode; label: string; value: string | null; href?: string }) {
    const content = (
        <>
            <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface text-accent" aria-hidden="true">
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block text-xs text-muted">{label}</span>
                {/* Reserve the line so the layout does not jump when the value is decoded. */}
                <span className="block min-h-5 truncate text-sm font-medium">{value ?? ' '}</span>
            </span>
        </>
    );

    return (
        <li>
            {href ? (
                <a
                    href={href}
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-surface-2"
                >
                    {content}
                </a>
            ) : (
                <div className="flex items-center gap-3 p-1">{content}</div>
            )}
        </li>
    );
}
