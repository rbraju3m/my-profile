import { Link, router, useForm } from '@inertiajs/react';
import {
    ActionIcon,
    Alert,
    Anchor,
    Button,
    Card,
    Group,
    Image,
    Indicator,
    MultiSelect,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Tabs,
    Text,
    Textarea,
    TextInput,
} from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';
import { ExternalLink, ImageUp, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { RepeaterInput, StringListInput } from '@/admin/components/ListInputs';
import { PageHeader } from '@/admin/components/PageHeader';
import { RichTextInput } from '@/admin/components/RichTextInput';
import { SaveBar } from '@/admin/components/SaveBar';
import { SortableList } from '@/admin/components/SortableList';
import { errorsOf, hasErrorsIn, slugify } from '@/admin/lib';
import type { SelectOption } from '@/admin/types';

type MediaItem = { id: number; url: string; thumb: string; alt: string; name: string };

type ProjectData = {
    title: string;
    slug: string;
    company: string;
    client: string;
    show_client: boolean;
    category: string;
    status: string;
    status_note: string;
    period: string;
    role: string;
    authorship_note: string;
    summary: string;
    problem: string;
    contribution: string;
    features: string[];
    challenges: { challenge: string; solution: string }[];
    metrics: { label: string; value: string; source: string | null }[];
    public_links: { label: string; url: string }[];
    seo: { title: string | null; description: string | null };
    is_featured: boolean;
    published: boolean;
    technologies: number[];
    diagrams: number[];
};

type Props = {
    project: (Partial<ProjectData> & { id: number; slug: string; cover: MediaItem | null; gallery: MediaItem[] }) | null;
    categories: SelectOption[];
    statuses: SelectOption[];
    technologies: SelectOption[];
    diagrams: SelectOption[];
};

const blank: ProjectData = {
    title: '',
    slug: '',
    company: 'Right Brain Solution',
    client: '',
    show_client: true,
    category: 'web',
    status: 'built',
    status_note: '',
    period: '',
    role: '',
    authorship_note: '',
    summary: '',
    problem: '',
    contribution: '',
    features: [],
    challenges: [],
    metrics: [],
    public_links: [],
    seo: { title: null, description: null },
    is_featured: false,
    published: false,
    technologies: [],
    diagrams: [],
};

export default function ProjectForm({ project, categories, statuses, technologies, diagrams }: Props) {
    const editing = project !== null;
    const form = useForm<ProjectData>({
        ...blank,
        ...Object.fromEntries(Object.entries(project ?? {}).filter(([k, v]) => k in blank && v !== null)),
    } as ProjectData);
    const err = errorsOf(form);
    const [slugTouched, setSlugTouched] = useState(editing);
    const [tab, setTab] = useState<string | null>('basics');
    const d = form.data;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => form.setDefaults() };
        if (editing) form.put(`/admin/projects/${project.slug}`, options);
        else form.post('/admin/projects', options);
    };

    const tabError = (keys: string[]) => (hasErrorsIn(form.errors as Record<string, unknown>, keys) ? <Indicator color="red" size={8} inline processing={false} /> : null);

    return (
        <AdminLayout title={editing ? d.title || 'Edit project' : 'New project'}>
            <PageHeader
                title={editing ? d.title || 'Edit project' : 'New project'}
                crumbs={[{ label: 'Projects', href: '/admin/projects' }, { label: editing ? 'Edit' : 'New' }]}
                actions={
                    editing && (
                        <>
                            <Button component="a" href={`/projects/${project.slug}`} target="_blank" variant="default" leftSection={<ExternalLink size={16} />}>
                                View on site
                            </Button>
                            <ConfirmButton
                                title="Delete this project?"
                                message={`“${d.title}” and its images will be removed from the site. This cannot be undone.`}
                                onConfirm={(done) => router.delete(`/admin/projects/${project.slug}`, { onFinish: done })}
                            >
                                Delete
                            </ConfirmButton>
                        </>
                    )
                }
            />

            {Object.keys(form.errors).length > 0 && (
                <Alert color="red" mb="md">
                    Some fields need attention. Tabs with problems are marked with a red dot.
                </Alert>
            )}

            <form onSubmit={submit}>
                <Tabs value={tab} onChange={setTab} keepMounted={false}>
                    <Tabs.List mb="md" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
                        <Tabs.Tab value="basics" rightSection={tabError(['title', 'slug', 'category', 'status', 'status_note', 'company', 'client', 'period', 'role', 'summary'])}>
                            Basics
                        </Tabs.Tab>
                        <Tabs.Tab value="story" rightSection={tabError(['problem', 'contribution', 'authorship_note'])}>
                            Story
                        </Tabs.Tab>
                        <Tabs.Tab value="features" rightSection={tabError(['features', 'challenges'])}>
                            Features & challenges
                        </Tabs.Tab>
                        <Tabs.Tab value="metrics" rightSection={tabError(['metrics', 'public_links'])}>
                            Numbers & links
                        </Tabs.Tab>
                        <Tabs.Tab value="tech" rightSection={tabError(['technologies', 'diagrams'])}>
                            Technologies & diagrams
                        </Tabs.Tab>
                        {editing && <Tabs.Tab value="media">Images</Tabs.Tab>}
                        <Tabs.Tab value="seo" rightSection={tabError(['seo'])}>
                            SEO
                        </Tabs.Tab>
                    </Tabs.List>

                    <Card withBorder>
                        <Tabs.Panel value="basics">
                            <Stack>
                                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                    <TextInput
                                        label="Title"
                                        required
                                        value={d.title}
                                        error={err('title')}
                                        onChange={(e) => {
                                            const title = e.currentTarget.value;
                                            form.setData((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
                                        }}
                                    />
                                    <TextInput
                                        label="URL slug"
                                        description={`/projects/${d.slug || '…'}`}
                                        required
                                        value={d.slug}
                                        error={err('slug')}
                                        onChange={(e) => {
                                            setSlugTouched(true);
                                            form.setData('slug', e.currentTarget.value);
                                        }}
                                    />
                                    <Select label="Category" data={categories} value={d.category} onChange={(v) => form.setData('category', v ?? 'web')} allowDeselect={false} error={err('category')} />
                                    <Select
                                        label="Status"
                                        description="Be honest: only “Live” if it runs in production."
                                        data={statuses}
                                        value={d.status}
                                        onChange={(v) => form.setData('status', v ?? 'built')}
                                        allowDeselect={false}
                                        error={err('status')}
                                    />
                                </SimpleGrid>
                                <TextInput
                                    label="Status note"
                                    description="Optional nuance shown under the status, e.g. “Validated against a simulator; rollout in progress.”"
                                    value={d.status_note}
                                    error={err('status_note')}
                                    onChange={(e) => form.setData('status_note', e.currentTarget.value)}
                                />
                                <SimpleGrid cols={{ base: 1, sm: 3 }}>
                                    <TextInput label="Company" value={d.company} error={err('company')} onChange={(e) => form.setData('company', e.currentTarget.value)} />
                                    <TextInput label="Client" value={d.client} error={err('client')} onChange={(e) => form.setData('client', e.currentTarget.value)} />
                                    <TextInput label="Period" placeholder="2024 – present" value={d.period} error={err('period')} onChange={(e) => form.setData('period', e.currentTarget.value)} />
                                </SimpleGrid>
                                <Switch label="Show the client name on the site" checked={d.show_client} onChange={(e) => form.setData('show_client', e.currentTarget.checked)} />
                                <TextInput label="My role" value={d.role} error={err('role')} onChange={(e) => form.setData('role', e.currentTarget.value)} />
                                <Textarea
                                    label="Summary"
                                    description={`${d.summary.length} / 600. Shown on the card and as the page introduction.`}
                                    required
                                    autosize
                                    minRows={3}
                                    value={d.summary}
                                    error={err('summary')}
                                    onChange={(e) => form.setData('summary', e.currentTarget.value)}
                                />
                                <Group>
                                    <Switch label="Featured on the home page" checked={d.is_featured} onChange={(e) => form.setData('is_featured', e.currentTarget.checked)} />
                                    <Switch label="Published" checked={d.published} onChange={(e) => form.setData('published', e.currentTarget.checked)} />
                                </Group>
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="story">
                            <Stack>
                                <Textarea label="The problem" autosize minRows={3} value={d.problem} error={err('problem')} onChange={(e) => form.setData('problem', e.currentTarget.value)} />
                                <RichTextInput label="What I did" value={d.contribution} error={err('contribution')} onChange={(v) => form.setData('contribution', v)} />
                                <Textarea
                                    label="Ownership note"
                                    description="Who wrote what, e.g. “484 of 485 commits are mine.”"
                                    autosize
                                    minRows={2}
                                    value={d.authorship_note}
                                    error={err('authorship_note')}
                                    onChange={(e) => form.setData('authorship_note', e.currentTarget.value)}
                                />
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="features">
                            <Stack gap="xl">
                                <StringListInput label="Key features" itemLabel="feature" multiline max={20} value={d.features} onChange={(v) => form.setData('features', v)} error={(i) => err(`features.${i}`)} />
                                <RepeaterInput
                                    label="Challenges and solutions"
                                    itemLabel="challenge"
                                    max={12}
                                    value={d.challenges}
                                    onChange={(v) => form.setData('challenges', v)}
                                    empty={() => ({ challenge: '', solution: '' })}
                                    renderItem={(c, i, update) => (
                                        <Stack gap="xs">
                                            <Textarea label="Challenge" autosize minRows={1} value={c.challenge} error={err(`challenges.${i}.challenge`)} onChange={(e) => update({ challenge: e.currentTarget.value })} />
                                            <Textarea label="Solution" autosize minRows={2} value={c.solution} error={err(`challenges.${i}.solution`)} onChange={(e) => update({ solution: e.currentTarget.value })} />
                                        </Stack>
                                    )}
                                />
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="metrics">
                            <Stack gap="xl">
                                <RepeaterInput
                                    label="Verified numbers"
                                    description="Only figures you can point to evidence for. The source is shown in small print."
                                    itemLabel="number"
                                    max={8}
                                    value={d.metrics}
                                    onChange={(v) => form.setData('metrics', v)}
                                    empty={() => ({ label: '', value: '', source: null })}
                                    renderItem={(m, i, update) => (
                                        <SimpleGrid cols={{ base: 1, sm: 3 }}>
                                            <TextInput label="Value" placeholder="27" value={m.value} error={err(`metrics.${i}.value`)} onChange={(e) => update({ value: e.currentTarget.value })} />
                                            <TextInput label="Label" value={m.label} error={err(`metrics.${i}.label`)} onChange={(e) => update({ label: e.currentTarget.value })} />
                                            <TextInput label="Source (optional)" value={m.source ?? ''} error={err(`metrics.${i}.source`)} onChange={(e) => update({ source: e.currentTarget.value || null })} />
                                        </SimpleGrid>
                                    )}
                                />
                                <RepeaterInput
                                    label="Public links"
                                    description="Live sites or public repositories only. Never private repositories or internal URLs."
                                    itemLabel="link"
                                    max={8}
                                    value={d.public_links}
                                    onChange={(v) => form.setData('public_links', v)}
                                    empty={() => ({ label: '', url: 'https://' })}
                                    renderItem={(l, i, update) => (
                                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                            <TextInput label="Label" value={l.label} error={err(`public_links.${i}.label`)} onChange={(e) => update({ label: e.currentTarget.value })} />
                                            <TextInput label="URL" value={l.url} error={err(`public_links.${i}.url`)} onChange={(e) => update({ url: e.currentTarget.value })} />
                                        </SimpleGrid>
                                    )}
                                />
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="tech">
                            <Stack>
                                <MultiSelect
                                    label="Technologies"
                                    description="In display order: the first three appear on the card. Add new ones under Skills."
                                    data={groupOptions(technologies)}
                                    searchable
                                    value={d.technologies.map(String)}
                                    onChange={(v) => form.setData('technologies', v.map(Number))}
                                    error={err('technologies')}
                                />
                                <MultiSelect
                                    label="Architecture diagrams"
                                    description="Shown on the case-study page."
                                    data={diagrams}
                                    value={d.diagrams.map(String)}
                                    onChange={(v) => form.setData('diagrams', v.map(Number))}
                                    error={err('diagrams')}
                                />
                                <Anchor component={Link} href="/admin/diagrams/create" size="sm">
                                    Create a new diagram
                                </Anchor>
                            </Stack>
                        </Tabs.Panel>

                        {editing && (
                            <Tabs.Panel value="media">
                                <ProjectMedia slug={project.slug} cover={project.cover} gallery={project.gallery} />
                            </Tabs.Panel>
                        )}

                        <Tabs.Panel value="seo">
                            <Stack>
                                <Text size="sm" c="dimmed">
                                    Leave blank to use the title and summary.
                                </Text>
                                <TextInput
                                    label="Search title"
                                    value={d.seo.title ?? ''}
                                    error={err('seo.title')}
                                    onChange={(e) => form.setData('seo', { ...d.seo, title: e.currentTarget.value || null })}
                                />
                                <Textarea
                                    label="Search description"
                                    description={`${(d.seo.description ?? '').length} / 300`}
                                    autosize
                                    minRows={2}
                                    value={d.seo.description ?? ''}
                                    error={err('seo.description')}
                                    onChange={(e) => form.setData('seo', { ...d.seo, description: e.currentTarget.value || null })}
                                />
                            </Stack>
                        </Tabs.Panel>
                    </Card>
                </Tabs>

                {tab !== 'media' && <SaveBar dirty={form.isDirty || !editing} processing={form.processing} label={editing ? 'Save changes' : 'Create project'} />}
            </form>
        </AdminLayout>
    );
}

function groupOptions(options: SelectOption[]) {
    const groups = new Map<string, { value: string; label: string }[]>();
    for (const o of options) {
        const key = o.group ?? 'Other';
        groups.set(key, [...(groups.get(key) ?? []), { value: o.value, label: o.label }]);
    }

    return [...groups.entries()].map(([group, items]) => ({ group, items }));
}

/** Cover and gallery uploads. Each upload asks for alt text, which the site requires. */
function ProjectMedia({ slug, cover, gallery }: { slug: string; cover: MediaItem | null; gallery: MediaItem[] }) {
    const [collection, setCollection] = useState<'cover' | 'gallery'>('cover');
    const [alt, setAlt] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState(false);
    const [order, setOrder] = useState(gallery);
    const [prev, setPrev] = useState(gallery);
    if (prev !== gallery) {
        setPrev(gallery);
        setOrder(gallery);
    }

    const upload = () => {
        router.post(
            `/admin/projects/${slug}/media`,
            { collection, alt, files },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setBusy(true),
                onFinish: () => setBusy(false),
                onSuccess: () => {
                    setFiles([]);
                    setAlt('');
                    setErrors({});
                },
                onError: setErrors,
            },
        );
    };

    const remove = (id: number) => router.delete(`/admin/media/${id}`, { preserveScroll: true });

    return (
        <Stack gap="xl">
            <Stack gap="xs">
                <Text fw={600}>Upload</Text>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <Select
                        label="Where"
                        data={[
                            { value: 'cover', label: 'Cover (card image, replaces the current one)' },
                            { value: 'gallery', label: 'Screenshot gallery' },
                        ]}
                        value={collection}
                        onChange={(v) => setCollection((v as 'cover' | 'gallery') ?? 'cover')}
                        allowDeselect={false}
                    />
                    <TextInput
                        label="Alt text"
                        description="Describe what the image shows, for screen readers."
                        required
                        value={alt}
                        onChange={(e) => setAlt(e.currentTarget.value)}
                        error={errors.alt}
                    />
                </SimpleGrid>
                <Dropzone onDrop={setFiles} accept={IMAGE_MIME_TYPE} maxSize={8 * 1024 * 1024} multiple={collection === 'gallery'}>
                    <Group justify="center" gap="sm" mih={90} style={{ pointerEvents: 'none' }}>
                        <ImageUp size={28} />
                        <div>
                            <Text>{files.length > 0 ? files.map((f) => f.name).join(', ') : 'Drop images here or click to choose'}</Text>
                            <Text size="xs" c="dimmed">
                                PNG, JPG or WebP up to 8 MB. Use demo data only: no real patient, customer or server details.
                            </Text>
                        </div>
                    </Group>
                </Dropzone>
                {(errors.files || errors['files.0']) && (
                    <Text c="red" size="sm">
                        {errors.files ?? errors['files.0']}
                    </Text>
                )}
                <Button onClick={upload} loading={busy} disabled={files.length === 0 || alt.trim() === ''} style={{ alignSelf: 'flex-start' }}>
                    Upload {files.length > 1 ? `${files.length} images` : 'image'}
                </Button>
            </Stack>

            <Stack gap="xs">
                <Text fw={600}>Cover</Text>
                {cover ? <MediaTile item={cover} onRemove={() => remove(cover.id)} /> : <Text c="dimmed" size="sm">No cover image.</Text>}
            </Stack>

            <Stack gap="xs">
                <Text fw={600}>Gallery</Text>
                {order.length === 0 ? (
                    <Text c="dimmed" size="sm">
                        No screenshots yet.
                    </Text>
                ) : (
                    <SortableList
                        items={order}
                        getId={(m) => m.id}
                        onReorder={(next) => {
                            setOrder(next);
                            router.post('/admin/reorder/gallery', { ids: next.map((m) => m.id) }, { preserveScroll: true, preserveState: true });
                        }}
                        render={(m, handle) => (
                            <Group mb="xs" wrap="nowrap">
                                {handle}
                                <MediaTile item={m} onRemove={() => remove(m.id)} />
                            </Group>
                        )}
                    />
                )}
            </Stack>
        </Stack>
    );
}

function MediaTile({ item, onRemove }: { item: MediaItem; onRemove: () => void }) {
    return (
        <Card withBorder padding="xs" style={{ flex: 1 }}>
            <Group wrap="nowrap">
                <Image src={item.thumb} alt={item.alt} w={120} h={68} radius="sm" fit="cover" />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" lineClamp={1}>
                        {item.name}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                        Alt: {item.alt || '—'}
                    </Text>
                </div>
                <ActionIcon color="red" variant="subtle" onClick={onRemove} aria-label={`Delete ${item.name}`}>
                    <Trash2 size={16} />
                </ActionIcon>
            </Group>
        </Card>
    );
}
