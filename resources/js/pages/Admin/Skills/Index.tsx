import { router, useForm } from '@inertiajs/react';
import { ActionIcon, Badge, Button, Card, Group, Modal, Select, SimpleGrid, Stack, Switch, Text, Textarea, TextInput, Title } from '@mantine/core';
import { EyeOff, Pencil, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { PageHeader } from '@/admin/components/PageHeader';
import { SortableList } from '@/admin/components/SortableList';

type Tech = { id: number; name: string; slug: string; show_in_skills: boolean; projects: number };
type Category = { id: number; name: string; slug: string; description: string | null; icon: string | null; technologies: Tech[] };

type Editing = { kind: 'category'; item: Category | null } | { kind: 'tech'; item: Tech | null; categoryId: number | null } | null;

export default function SkillsIndex({ categories, uncategorised, icons }: { categories: Category[]; uncategorised: Tech[]; icons: string[] }) {
    const [editing, setEditing] = useState<Editing>(null);
    const [order, setOrder] = useState(categories);
    const [prev, setPrev] = useState(categories);
    if (prev !== categories) {
        setPrev(categories);
        setOrder(categories);
    }

    const options = categories.map((c) => ({ value: String(c.id), label: c.name }));

    const reorderTech = (categoryId: number, next: Tech[]) => {
        setOrder((cs) => cs.map((c) => (c.id === categoryId ? { ...c, technologies: next } : c)));
        router.post('/admin/reorder/technologies', { ids: next.map((t) => t.id) }, { preserveScroll: true, preserveState: true });
    };

    return (
        <AdminLayout title="Skills">
            <PageHeader
                title="Skills"
                description="Technologies drive both the skill cards and the project filters. Hidden technologies stay usable on projects but don’t appear in the skills section."
                actions={
                    <>
                        <Button variant="default" leftSection={<Plus size={16} />} onClick={() => setEditing({ kind: 'tech', item: null, categoryId: categories[0]?.id ?? null })}>
                            Technology
                        </Button>
                        <Button leftSection={<Plus size={16} />} onClick={() => setEditing({ kind: 'category', item: null })}>
                            Category
                        </Button>
                    </>
                }
            />

            <Text size="sm" c="dimmed" mb="xs">
                Drag categories to reorder the skill cards; drag technologies within a card.
            </Text>
            <SortableList
                items={order}
                getId={(c) => c.id}
                onReorder={(next) => {
                    setOrder(next);
                    router.post('/admin/reorder/skill-categories', { ids: next.map((c) => c.id) }, { preserveScroll: true, preserveState: true });
                }}
                render={(c, handle) => (
                    <Card withBorder mb="sm">
                        <Group justify="space-between" mb="xs" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap">
                                {handle}
                                <div>
                                    <Title order={5}>{c.name}</Title>
                                    {c.description && (
                                        <Text size="xs" c="dimmed">
                                            {c.description}
                                        </Text>
                                    )}
                                </div>
                            </Group>
                            <Group gap={4} wrap="nowrap">
                                <ActionIcon variant="subtle" onClick={() => setEditing({ kind: 'tech', item: null, categoryId: c.id })} aria-label={`Add technology to ${c.name}`}>
                                    <Plus size={16} />
                                </ActionIcon>
                                <ActionIcon variant="subtle" onClick={() => setEditing({ kind: 'category', item: c })} aria-label={`Edit ${c.name}`}>
                                    <Pencil size={16} />
                                </ActionIcon>
                            </Group>
                        </Group>
                        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={6}>
                            <SortableList
                                items={c.technologies}
                                getId={(t) => t.id}
                                onReorder={(next) => reorderTech(c.id, next)}
                                render={(t, techHandle) => <TechRow tech={t} handle={techHandle} onEdit={() => setEditing({ kind: 'tech', item: t, categoryId: c.id })} />}
                            />
                        </SimpleGrid>
                    </Card>
                )}
            />

            {uncategorised.length > 0 && (
                <Card withBorder mt="md">
                    <Title order={5} mb="xs">
                        Uncategorised
                    </Title>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing={6}>
                        {uncategorised.map((t) => (
                            <TechRow key={t.id} tech={t} onEdit={() => setEditing({ kind: 'tech', item: t, categoryId: null })} />
                        ))}
                    </SimpleGrid>
                </Card>
            )}

            <Modal opened={editing !== null} onClose={() => setEditing(null)} title={editing?.kind === 'category' ? 'Skill category' : 'Technology'}>
                {editing?.kind === 'category' && <CategoryForm item={editing.item} icons={icons} onDone={() => setEditing(null)} />}
                {editing?.kind === 'tech' && <TechForm item={editing.item} categoryId={editing.categoryId} categories={options} onDone={() => setEditing(null)} />}
            </Modal>
        </AdminLayout>
    );
}

function TechRow({ tech, handle, onEdit }: { tech: Tech; handle?: React.ReactNode; onEdit: () => void }) {
    return (
        <Card withBorder padding={6} mb={4}>
            <Group gap={6} wrap="nowrap">
                {handle}
                <Text size="sm" style={{ flex: 1 }} lineClamp={1} c={tech.show_in_skills ? undefined : 'dimmed'}>
                    {tech.name}
                </Text>
                {!tech.show_in_skills && <EyeOff size={14} aria-label="Hidden from skills" />}
                <Badge size="xs" variant="light" color="gray" title="Projects using it">
                    {tech.projects}
                </Badge>
                <ActionIcon size="sm" variant="subtle" onClick={onEdit} aria-label={`Edit ${tech.name}`}>
                    <Pencil size={14} />
                </ActionIcon>
            </Group>
        </Card>
    );
}

function CategoryForm({ item, icons, onDone }: { item: Category | null; icons: string[]; onDone: () => void }) {
    const form = useForm({ name: item?.name ?? '', description: item?.description ?? '', icon: item?.icon ?? null });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: onDone };
        if (item) form.put(`/admin/skill-categories/${item.id}`, options);
        else form.post('/admin/skill-categories', options);
    };

    return (
        <form onSubmit={submit}>
            <Stack>
                <TextInput label="Name" required value={form.data.name} error={form.errors.name} onChange={(e) => form.setData('name', e.currentTarget.value)} />
                <Textarea label="Description" autosize value={form.data.description} error={form.errors.description} onChange={(e) => form.setData('description', e.currentTarget.value)} />
                <Select label="Icon" data={icons} clearable value={form.data.icon} onChange={(v) => form.setData('icon', v)} />
                <Group justify="space-between">
                    {item ? (
                        <ConfirmButton
                            title="Delete this category?"
                            message="Its technologies are kept and become uncategorised."
                            onConfirm={(done) => router.delete(`/admin/skill-categories/${item.id}`, { preserveScroll: true, onFinish: () => (done(), onDone()) })}
                        >
                            Delete
                        </ConfirmButton>
                    ) : (
                        <span />
                    )}
                    <Button type="submit" loading={form.processing}>
                        Save
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}

function TechForm({ item, categoryId, categories, onDone }: { item: Tech | null; categoryId: number | null; categories: { value: string; label: string }[]; onDone: () => void }) {
    const form = useForm({ name: item?.name ?? '', skill_category_id: categoryId, show_in_skills: item?.show_in_skills ?? true });
    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: onDone };
        if (item) form.put(`/admin/technologies/${item.id}`, options);
        else form.post('/admin/technologies', options);
    };

    return (
        <form onSubmit={submit}>
            <Stack>
                <TextInput label="Name" required value={form.data.name} error={form.errors.name} onChange={(e) => form.setData('name', e.currentTarget.value)} />
                <Select
                    label="Category"
                    data={categories}
                    clearable
                    value={form.data.skill_category_id === null ? null : String(form.data.skill_category_id)}
                    onChange={(v) => form.setData('skill_category_id', v === null ? null : Number(v))}
                    error={form.errors.skill_category_id}
                />
                <Switch label="Show in the skills section" checked={form.data.show_in_skills} onChange={(e) => form.setData('show_in_skills', e.currentTarget.checked)} />
                <Group justify="space-between">
                    {item ? (
                        <ConfirmButton
                            title={`Delete ${item.name}?`}
                            message={item.projects > 0 ? `It will be removed from ${item.projects} project(s).` : 'No projects use it.'}
                            onConfirm={(done) => router.delete(`/admin/technologies/${item.id}`, { preserveScroll: true, onFinish: () => (done(), onDone()) })}
                        >
                            Delete
                        </ConfirmButton>
                    ) : (
                        <span />
                    )}
                    <Button type="submit" loading={form.processing}>
                        Save
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
