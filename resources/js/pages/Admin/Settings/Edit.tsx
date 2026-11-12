import { router, useForm } from '@inertiajs/react';
import { Anchor, Avatar, Button, Checkbox, Card, Divider, FileButton, Group, Select, SimpleGrid, Stack, Switch, Text, Textarea, TextInput } from '@mantine/core';
import { FileText, ImageUp, Upload } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { RepeaterInput, StringListInput } from '@/admin/components/ListInputs';
import { PageHeader } from '@/admin/components/PageHeader';
import { RichTextInput } from '@/admin/components/RichTextInput';
import { SaveBar } from '@/admin/components/SaveBar';
import { errorsOf, formatBytes } from '@/admin/lib';
import type { SelectOption } from '@/admin/types';

type FileInfo = { name: string; size: number; url: string; updated: string | null } | null;

type Props = {
    group: 'site' | 'hero' | 'about' | 'sections' | 'nav' | 'footer' | 'seo' | 'appearance' | 'labels';
    value: Record<string, unknown>;
    projects: SelectOption[];
    icons: string[];
    cv: FileInfo;
    photo: FileInfo;
    ogImage: FileInfo;
    themes: { value: string; label: string; scheme: 'light' | 'dark' }[];
    labelSchema: { key: string; title: string; fields: { key: string; label: string; default: string }[] }[];
};

const titles: Record<Props['group'], [string, string]> = {
    site: ['Profile & contact', 'Your name, title, contact details and social links, shown in the hero, contact section and footer.'],
    hero: ['Hero', 'The first screen of the site: headline, buttons, technology chips and the system map.'],
    about: ['About', 'Your biography and the highlight numbers beside it.'],
    sections: ['Section headings', 'The small label, heading and intro line above each section of the home page.'],
    nav: ['Navigation', 'Menu links in the header and footer. Use #section for home page sections.'],
    footer: ['Footer', 'Footer text. {year} in the copyright line becomes the current year.'],
    seo: ['SEO & sharing', 'How the site appears in search results and when shared on social media.'],
    appearance: ['Appearance', 'Colour themes: which one visitors see first, and which ones they can switch to.'],
    labels: ['Labels', 'The small texts of the site: form labels, buttons and fixed headings. Leave a field empty to use the default shown in grey.'],
};

/* Every group is edited with the same form; the fields differ per group. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyForm = any;

export default function SettingsEdit(props: Props) {
    const [title, description] = titles[props.group];
    const form = useForm<AnyForm>(withDefaults(props.group, props.value));
    const err = errorsOf(form);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.put(`/admin/settings/${props.group}`, { preserveScroll: true, onSuccess: () => form.setDefaults() });
    };

    const set = (key: string, value: unknown) => form.setData(key, value);
    const data = form.data as AnyForm;

    return (
        <AdminLayout title={title}>
            <PageHeader title={title} description={description} crumbs={[{ label: 'Site settings' }, { label: title }]} />

            {props.group === 'site' && (
                <>
                    <FileCard
                        title="Your photo"
                        kind="photo"
                        file={props.photo}
                        accept="image/png,image/jpeg,image/webp"
                        hint="Shown in the hero, the About section and the header. A head-and-shoulders photo, portrait 4:5, at least 400 × 500 px."
                    />
                    <FileCard title="CV (PDF)" kind="cv" file={props.cv} accept="application/pdf" hint="Shown as the Download CV button. Max 10 MB." />
                </>
            )}
            {props.group === 'seo' && (
                <FileCard title="Default share image" kind="og_image" file={props.ogImage} accept="image/png,image/jpeg,image/webp" hint="Used when the site is shared on social media. 1200 × 630 px recommended." />
            )}

            <form onSubmit={submit}>
                <Card withBorder>
                    <Stack>
                        {props.group === 'site' && <SiteFields data={data} set={set} err={err} icons={props.icons} />}
                        {props.group === 'hero' && <HeroFields data={data} set={set} err={err} projects={props.projects} />}
                        {props.group === 'about' && <AboutFields data={data} set={set} err={err} />}
                        {props.group === 'sections' && <SectionFields data={data} set={set} err={err} />}
                        {props.group === 'appearance' && <AppearanceFields data={data} set={set} err={err} themes={props.themes} />}
                        {props.group === 'labels' && <LabelFields data={data} set={set} err={err} schema={props.labelSchema} />}
                        {props.group === 'nav' && (
                            <RepeaterInput
                                label="Menu items"
                                itemLabel="link"
                                max={10}
                                value={data.items}
                                onChange={(v) => set('items', v)}
                                empty={() => ({ label: '', href: '#' })}
                                renderItem={(item: { label: string; href: string }, i, update) => (
                                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                        <TextInput label="Label" value={item.label} onChange={(e) => update({ label: e.currentTarget.value })} error={err(`items.${i}.label`)} />
                                        <TextInput label="Link" description="#section, /page or https://…" value={item.href} onChange={(e) => update({ href: e.currentTarget.value })} error={err(`items.${i}.href`)} />
                                    </SimpleGrid>
                                )}
                            />
                        )}
                        {props.group === 'footer' && (
                            <>
                                <Textarea label="Tagline" autosize minRows={2} value={data.tagline ?? ''} onChange={(e) => set('tagline', e.currentTarget.value)} error={err('tagline')} />
                                <TextInput label="Copyright line" value={data.copyright ?? ''} onChange={(e) => set('copyright', e.currentTarget.value)} error={err('copyright')} />
                            </>
                        )}
                        {props.group === 'seo' && (
                            <>
                                <TextInput label="Home page title" value={data.default_title} onChange={(e) => set('default_title', e.currentTarget.value)} error={err('default_title')} />
                                <TextInput
                                    label="Title template for other pages"
                                    description="%s is replaced by the page name, e.g. “%s · Md. Rashedul Bari Raju”."
                                    value={data.title_template}
                                    onChange={(e) => set('title_template', e.currentTarget.value)}
                                    error={err('title_template')}
                                />
                                <Textarea
                                    label="Description"
                                    description={`${(data.description ?? '').length} / 300 characters. Shown under your name in search results.`}
                                    autosize
                                    minRows={3}
                                    value={data.description}
                                    onChange={(e) => set('description', e.currentTarget.value)}
                                    error={err('description')}
                                />
                            </>
                        )}
                    </Stack>
                </Card>
                <SaveBar dirty={form.isDirty} processing={form.processing} />
            </form>
        </AdminLayout>
    );
}

type FieldProps = { data: AnyForm; set: (key: string, value: unknown) => void; err: (key: string) => string | undefined };

function SiteFields({ data, set, err, icons }: FieldProps & { icons: string[] }) {
    return (
        <>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput label="Name" value={data.name} onChange={(e) => set('name', e.currentTarget.value)} error={err('name')} />
                <TextInput label="Title" description="e.g. Senior Software Engineer" value={data.title} onChange={(e) => set('title', e.currentTarget.value)} error={err('title')} />
                <TextInput label="Role line" value={data.role_line ?? ''} onChange={(e) => set('role_line', e.currentTarget.value)} error={err('role_line')} />
                <TextInput label="Location" value={data.location ?? ''} onChange={(e) => set('location', e.currentTarget.value)} error={err('location')} />
            </SimpleGrid>
            <Divider label="Contact" labelPosition="left" />
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <TextInput label="Email" type="email" description="Also receives contact form messages." value={data.email ?? ''} onChange={(e) => set('email', e.currentTarget.value)} error={err('email')} />
                <TextInput label="Phone" value={data.phone ?? ''} onChange={(e) => set('phone', e.currentTarget.value)} error={err('phone')} />
                <TextInput label="WhatsApp number" description="Digits only, with country code." value={data.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.currentTarget.value)} error={err('whatsapp')} />
            </SimpleGrid>
            <Divider label="Availability" labelPosition="left" />
            <Group align="flex-end">
                <Switch
                    label="Show the availability badge"
                    checked={Boolean(data.availability?.enabled)}
                    onChange={(e) => set('availability', { ...data.availability, enabled: e.currentTarget.checked })}
                />
                <TextInput
                    style={{ flex: 1, minWidth: 240 }}
                    label="Badge text"
                    value={data.availability?.text ?? ''}
                    onChange={(e) => set('availability', { ...data.availability, text: e.currentTarget.value })}
                    error={err('availability.text')}
                />
            </Group>
            <Divider label="Social links" labelPosition="left" />
            <RepeaterInput
                label="Profiles"
                itemLabel="profile"
                max={10}
                value={data.socials}
                onChange={(v) => set('socials', v)}
                empty={() => ({ label: '', url: 'https://', icon: 'link' })}
                renderItem={(item: { label: string; url: string; icon: string }, i, update) => (
                    <SimpleGrid cols={{ base: 1, sm: 3 }}>
                        <TextInput label="Label" value={item.label} onChange={(e) => update({ label: e.currentTarget.value })} error={err(`socials.${i}.label`)} />
                        <TextInput label="URL" value={item.url} onChange={(e) => update({ url: e.currentTarget.value })} error={err(`socials.${i}.url`)} />
                        <Select label="Icon" data={icons} value={item.icon} onChange={(v) => update({ icon: v ?? 'link' })} allowDeselect={false} />
                    </SimpleGrid>
                )}
            />
        </>
    );
}

function HeroFields({ data, set, err, projects }: FieldProps & { projects: SelectOption[] }) {
    const cta = (key: string, label: string) => (
        <SimpleGrid cols={2}>
            <TextInput label={`${label}: label`} value={data[key]?.label ?? ''} onChange={(e) => set(key, { ...data[key], label: e.currentTarget.value })} error={err(`${key}.label`)} />
            <TextInput label={`${label}: link`} value={data[key]?.href ?? ''} onChange={(e) => set(key, { ...data[key], href: e.currentTarget.value })} error={err(`${key}.href`)} />
        </SimpleGrid>
    );

    return (
        <>
            <TextInput label="Small label above the headline" value={data.eyebrow ?? ''} onChange={(e) => set('eyebrow', e.currentTarget.value)} error={err('eyebrow')} />
            <TextInput label="Headline" value={data.headline} onChange={(e) => set('headline', e.currentTarget.value)} error={err('headline')} />
            <Textarea label="Subheading" autosize minRows={2} value={data.subheading} onChange={(e) => set('subheading', e.currentTarget.value)} error={err('subheading')} />
            <Divider label="Buttons" labelPosition="left" />
            {cta('primary_cta', 'Primary button')}
            {cta('secondary_cta', 'CV button')}
            {cta('tertiary_cta', 'Third button')}
            <Divider label="Technology chips" labelPosition="left" />
            <StringListInput label="Chips" itemLabel="chip" max={8} value={data.chips} onChange={(v) => set('chips', v)} error={(i) => err(`chips.${i}`)} />
            <Divider label="System map" labelPosition="left" />
            <RepeaterInput
                label="Flows"
                description="Up to 4 rows in the hero visual. Each links to a case study."
                itemLabel="flow"
                max={4}
                value={data.flows}
                onChange={(v) => set('flows', v)}
                empty={() => ({ label: '', project: projects[0]?.value ?? '', steps: ['', ''] })}
                renderItem={(flow: { label: string; project: string; steps: string[] }, i, update) => (
                    <Stack gap="xs">
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <TextInput label="Label" value={flow.label} onChange={(e) => update({ label: e.currentTarget.value })} error={err(`flows.${i}.label`)} />
                            <Select label="Links to project" data={projects} searchable value={flow.project} onChange={(v) => update({ project: v ?? '' })} error={err(`flows.${i}.project`)} />
                        </SimpleGrid>
                        <StringListInput label="Steps" itemLabel="step" max={5} value={flow.steps} onChange={(steps) => update({ steps })} error={(j) => err(`flows.${i}.steps.${j}`) ?? (j === 0 ? err(`flows.${i}.steps`) : undefined)} />
                    </Stack>
                )}
            />
        </>
    );
}

function AboutFields({ data, set, err }: FieldProps) {
    return (
        <>
            <TextInput label="Heading" value={data.heading} onChange={(e) => set('heading', e.currentTarget.value)} error={err('heading')} />
            <RichTextInput label="Biography" value={data.bio} onChange={(v) => set('bio', v)} error={err('bio')} />
            <RepeaterInput
                label="Highlights"
                description="Short numbers shown beside the bio. Only use figures you can back up."
                itemLabel="highlight"
                max={6}
                value={data.highlights}
                onChange={(v) => set('highlights', v)}
                empty={() => ({ value: '', label: '' })}
                renderItem={(h: { value: string; label: string }, i, update) => (
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput label="Value" placeholder="5+" value={h.value} onChange={(e) => update({ value: e.currentTarget.value })} error={err(`highlights.${i}.value`)} />
                        <TextInput label="Label" value={h.label} onChange={(e) => update({ label: e.currentTarget.value })} error={err(`highlights.${i}.label`)} />
                    </SimpleGrid>
                )}
            />
        </>
    );
}

const sectionNames: Record<string, string> = {
    skills: 'Skills',
    experience: 'Experience',
    projects: 'Projects',
    engineering: 'Engineering beyond',
    architecture: 'Architecture diagrams',
    contact: 'Contact',
};

function SectionFields({ data, set, err }: FieldProps) {
    return (
        <Stack gap="xl">
            {Object.entries(sectionNames).map(([key, name]) => (
                <Stack key={key} gap="xs">
                    <Text fw={600}>{name}</Text>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput label="Small label" value={data[key]?.eyebrow ?? ''} onChange={(e) => set(key, { ...data[key], eyebrow: e.currentTarget.value })} error={err(`${key}.eyebrow`)} />
                        <TextInput label="Heading" value={data[key]?.heading ?? ''} onChange={(e) => set(key, { ...data[key], heading: e.currentTarget.value })} error={err(`${key}.heading`)} />
                    </SimpleGrid>
                    <Textarea label="Intro" autosize minRows={1} value={data[key]?.intro ?? ''} onChange={(e) => set(key, { ...data[key], intro: e.currentTarget.value })} error={err(`${key}.intro`)} />
                    {key === 'contact' && (
                        <TextInput
                            label="Message shown after a successful send"
                            value={data.contact?.success ?? ''}
                            onChange={(e) => set('contact', { ...data.contact, success: e.currentTarget.value })}
                            error={err('contact.success')}
                        />
                    )}
                    <Divider />
                </Stack>
            ))}
        </Stack>
    );
}

function AppearanceFields({ data, set, err, themes }: FieldProps & { themes: Props['themes'] }) {
    const offered: string[] = data.themes ?? [];
    const defaultOptions = [
        { value: 'system', label: 'Follow the visitor’s device (light or dark)' },
        ...themes.filter((t) => offered.includes(t.value)).map((t) => ({ value: t.value, label: `${t.label} (${t.scheme})` })),
    ];

    return (
        <>
            <Checkbox.Group
                label="Themes visitors can choose"
                description="Every theme is checked for readable contrast. Offer at least one light and one dark theme if you want the “System” option."
                value={offered}
                onChange={(v) => set('themes', themes.map((t) => t.value).filter((key) => v.includes(key)))}
                error={err('themes')}
            >
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} mt="xs">
                    {themes.map((t) => (
                        <Checkbox key={t.value} value={t.value} label={`${t.label}`} description={t.scheme === 'dark' ? 'Dark' : 'Light'} />
                    ))}
                </SimpleGrid>
            </Checkbox.Group>
            <Select
                label="Default theme"
                description="What a first-time visitor sees."
                data={defaultOptions}
                value={data.default_theme}
                onChange={(v) => v && set('default_theme', v)}
                error={err('default_theme')}
                allowDeselect={false}
            />
            <Switch
                label="Show the theme picker in the header"
                checked={Boolean(data.picker)}
                onChange={(e) => set('picker', e.currentTarget.checked)}
            />
        </>
    );
}

function LabelFields({ data, set, err, schema }: FieldProps & { schema: Props['labelSchema'] }) {
    return (
        <Stack gap="xl">
            {schema.map((group) => (
                <Stack key={group.key} gap="xs">
                    <Text fw={600}>{group.title}</Text>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        {group.fields.map((field) => (
                            <TextInput
                                key={field.key}
                                label={field.label}
                                placeholder={field.default}
                                value={data[group.key]?.[field.key] ?? ''}
                                onChange={(e) => set(group.key, { ...data[group.key], [field.key]: e.currentTarget.value })}
                                error={err(`${group.key}.${field.key}`)}
                            />
                        ))}
                    </SimpleGrid>
                    <Divider />
                </Stack>
            ))}
        </Stack>
    );
}

function FileCard({ title, kind, file, accept, hint }: { title: string; kind: 'cv' | 'photo' | 'og_image'; file: FileInfo; accept: string; hint: ReactNode }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const upload = (picked: File | null) => {
        if (!picked) return;
        setError(null);
        router.post(
            `/admin/files/${kind}`,
            { file: picked },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setUploading(true),
                onFinish: () => setUploading(false),
                onError: (errors) => setError(errors.file ?? 'Upload failed.'),
            },
        );
    };

    return (
        <Card withBorder mb="lg">
            <Group justify="space-between" wrap="wrap">
                <Group gap="sm" wrap="nowrap">
                    {kind === 'photo' && file ? <Avatar src={file.url} alt="" size={44} radius="md" /> : kind === 'cv' ? <FileText size={28} /> : <ImageUp size={28} />}
                    <div>
                        <Text fw={600}>{title}</Text>
                        {file ? (
                            <Text size="sm" c="dimmed">
                                <Anchor href={file.url} target="_blank">
                                    {file.name}
                                </Anchor>{' '}
                                · {formatBytes(file.size)} · updated {file.updated}
                            </Text>
                        ) : (
                            <Text size="sm" c="dimmed">
                                Nothing uploaded. {hint}
                            </Text>
                        )}
                        {error && (
                            <Text size="sm" c="red">
                                {error}
                            </Text>
                        )}
                    </div>
                </Group>
                <Group gap="xs">
                    <FileButton onChange={upload} accept={accept}>
                        {(props) => (
                            <Button {...props} leftSection={<Upload size={16} />} loading={uploading} variant={file ? 'default' : 'filled'}>
                                {file ? 'Replace' : 'Upload'}
                            </Button>
                        )}
                    </FileButton>
                    {file && (
                        <ConfirmButton
                            title={`Remove ${title.toLowerCase()}?`}
                            message={
                                kind === 'cv'
                                    ? 'The Download CV buttons will disappear from the site.'
                                    : kind === 'photo'
                                      ? 'The site will show your initials instead.'
                                      : 'Shares will fall back to no image.'
                            }
                            confirmLabel="Remove"
                            onConfirm={(done) => router.delete(`/admin/files/${kind}`, { preserveScroll: true, onFinish: done })}
                        >
                            Remove
                        </ConfirmButton>
                    )}
                </Group>
            </Group>
        </Card>
    );
}

/** Make sure every list/object the form edits exists, even for an empty group. */
function withDefaults(group: Props['group'], value: Record<string, unknown>): Record<string, unknown> {
    const v = value as AnyForm;
    switch (group) {
        case 'site':
            return { socials: [], availability: { enabled: false, text: '' }, ...v };
        case 'hero':
            return { chips: [], flows: [], primary_cta: { label: '', href: '' }, secondary_cta: { label: '', href: '/cv' }, tertiary_cta: { label: '', href: '#contact' }, ...v };
        case 'about':
            return { heading: '', bio: '', highlights: [], ...v };
        case 'sections':
            return Object.fromEntries(Object.keys(sectionNames).map((k) => [k, { eyebrow: '', heading: '', intro: '', ...(v[k] ?? {}) }]));
        case 'nav':
            return { items: [], ...v };
        case 'seo':
            return { title_template: '%s', default_title: '', description: '', ...v };
        case 'appearance':
            return { default_theme: 'dark', themes: ['dark', 'light'], picker: true, ...v };
        default:
            return { ...v };
    }
}
