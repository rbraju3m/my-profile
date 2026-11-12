import { router, useForm } from '@inertiajs/react';
import { ActionIcon, Button, Card, Group, NumberInput, Select, SimpleGrid, Stack, Table, Text, Textarea, TextInput, Title } from '@mantine/core';
import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { PageHeader } from '@/admin/components/PageHeader';
import { SaveBar } from '@/admin/components/SaveBar';
import { errorsOf, slugify } from '@/admin/lib';
import type { DiagramEdge, DiagramNode } from '@/shared/types';
import { FlowDiagram } from '@/site/components/diagrams/FlowDiagram';

type Node = DiagramNode & { sublabel: string };
type Edge = { from: string; to: string; label: string; mode: 'sync' | 'async' };
type Data = { title: string; slug: string; description: string; nodes: Node[]; edges: Edge[] };

export default function DiagramForm({ diagram, types }: { diagram: (Data & { id: number }) | null; types: string[] }) {
    const editing = diagram !== null;
    const form = useForm<Data>({
        title: diagram?.title ?? '',
        slug: diagram?.slug ?? '',
        description: diagram?.description ?? '',
        nodes: diagram?.nodes ?? [{ id: 'a', label: 'First box', sublabel: '', type: 'service', col: 0, row: 0 }],
        edges: diagram?.edges ?? [],
    });
    const [slugTouched, setSlugTouched] = useState(editing);
    const err = errorsOf(form);
    const d = form.data;
    const nodeOptions = d.nodes.map((n) => ({ value: n.id, label: n.label || n.id }));

    const setNode = (i: number, patch: Partial<Node>) => {
        const old = d.nodes[i]!;
        const nodes = d.nodes.map((n, j) => (j === i ? { ...n, ...patch } : n));
        // Renaming a box id keeps its arrows attached.
        const edges = patch.id && patch.id !== old.id ? d.edges.map((e) => ({ ...e, from: e.from === old.id ? patch.id! : e.from, to: e.to === old.id ? patch.id! : e.to })) : d.edges;
        form.setData((prev) => ({ ...prev, nodes, edges }));
    };

    const addNode = () => {
        const maxCol = Math.max(-1, ...d.nodes.filter((n) => n.row === 0).map((n) => n.col));
        let id = `box-${d.nodes.length + 1}`;
        while (d.nodes.some((n) => n.id === id)) id = `${id}x`;
        form.setData('nodes', [...d.nodes, { id, label: 'New box', sublabel: '', type: 'service', col: Math.min(maxCol + 1, 6), row: 0 }]);
    };

    const removeNode = (i: number) => {
        const id = d.nodes[i]!.id;
        form.setData((prev) => ({ ...prev, nodes: prev.nodes.filter((_, j) => j !== i), edges: prev.edges.filter((e) => e.from !== id && e.to !== id) }));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: () => form.setDefaults() };
        if (editing) form.put(`/admin/diagrams/${diagram.id}`, options);
        else form.post('/admin/diagrams', options);
    };

    // The preview uses the same component as the public site.
    const preview = {
        slug: d.slug || 'preview',
        title: d.title || 'Untitled diagram',
        description: d.description || null,
        nodes: d.nodes.map((n) => ({ ...n, col: Number(n.col) || 0, row: Number(n.row) || 0, sublabel: n.sublabel || undefined })),
        edges: d.edges
            .filter((e) => e.from && e.to)
            .map((e): DiagramEdge => ({ from: e.from, to: e.to, label: e.label || undefined, mode: e.mode })),
    };

    return (
        <AdminLayout title={editing ? d.title : 'New diagram'}>
            <PageHeader
                title={editing ? d.title : 'New diagram'}
                description="Boxes sit on a grid: column 0 is the far left, row 0 the top. Arrows are drawn between boxes; dashed arrows mean asynchronous (queued or polled)."
                crumbs={[{ label: 'Diagrams', href: '/admin/diagrams' }, { label: editing ? 'Edit' : 'New' }]}
                actions={
                    editing && (
                        <ConfirmButton title="Delete this diagram?" message="It will be removed from any projects that use it." onConfirm={(done) => router.delete(`/admin/diagrams/${diagram.id}`, { onFinish: done })}>
                            Delete
                        </ConfirmButton>
                    )
                }
            />
            <form onSubmit={submit}>
                <Stack>
                    <Card withBorder>
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
                                    label="Slug"
                                    required
                                    value={d.slug}
                                    error={err('slug')}
                                    onChange={(e) => {
                                        setSlugTouched(true);
                                        form.setData('slug', e.currentTarget.value);
                                    }}
                                />
                            </SimpleGrid>
                            <Textarea label="Caption" autosize minRows={2} value={d.description} error={err('description')} onChange={(e) => form.setData('description', e.currentTarget.value)} />
                        </Stack>
                    </Card>

                    <Card withBorder>
                        <Group justify="space-between" mb="xs">
                            <Title order={5}>Boxes</Title>
                            <Button size="xs" variant="light" leftSection={<Plus size={14} />} onClick={addNode} disabled={d.nodes.length >= 20}>
                                Add box
                            </Button>
                        </Group>
                        {err('nodes') && (
                            <Text c="red" size="sm">
                                {err('nodes')}
                            </Text>
                        )}
                        <Table.ScrollContainer minWidth={760}>
                            <Table verticalSpacing={4}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th w={110}>Id</Table.Th>
                                        <Table.Th>Label</Table.Th>
                                        <Table.Th>Sub-label</Table.Th>
                                        <Table.Th w={120}>Type</Table.Th>
                                        <Table.Th w={80}>Column</Table.Th>
                                        <Table.Th w={80}>Row</Table.Th>
                                        <Table.Th w={40} />
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {d.nodes.map((n, i) => (
                                        <Table.Tr key={i}>
                                            <Table.Td>
                                                <TextInput size="xs" aria-label="Box id" value={n.id} error={err(`nodes.${i}.id`)} onChange={(e) => setNode(i, { id: e.currentTarget.value })} />
                                            </Table.Td>
                                            <Table.Td>
                                                <TextInput size="xs" aria-label="Label" value={n.label} error={err(`nodes.${i}.label`)} onChange={(e) => setNode(i, { label: e.currentTarget.value })} />
                                            </Table.Td>
                                            <Table.Td>
                                                <TextInput size="xs" aria-label="Sub-label" value={n.sublabel} error={err(`nodes.${i}.sublabel`)} onChange={(e) => setNode(i, { sublabel: e.currentTarget.value })} />
                                            </Table.Td>
                                            <Table.Td>
                                                <Select size="xs" aria-label="Type" data={types} value={n.type} allowDeselect={false} onChange={(v) => setNode(i, { type: (v ?? 'service') as Node['type'] })} />
                                            </Table.Td>
                                            <Table.Td>
                                                <NumberInput size="xs" aria-label="Column" min={0} max={6} value={n.col} error={err(`nodes.${i}.col`)} onChange={(v) => setNode(i, { col: Number(v) || 0 })} />
                                            </Table.Td>
                                            <Table.Td>
                                                <NumberInput size="xs" aria-label="Row" min={0} max={4} value={n.row} error={err(`nodes.${i}.row`)} onChange={(v) => setNode(i, { row: Number(v) || 0 })} />
                                            </Table.Td>
                                            <Table.Td>
                                                <ActionIcon color="red" variant="subtle" disabled={d.nodes.length <= 1} onClick={() => removeNode(i)} aria-label={`Remove ${n.label}`}>
                                                    <Trash2 size={14} />
                                                </ActionIcon>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>

                    <Card withBorder>
                        <Group justify="space-between" mb="xs">
                            <Title order={5}>Arrows</Title>
                            <Button
                                size="xs"
                                variant="light"
                                leftSection={<Plus size={14} />}
                                disabled={d.nodes.length < 2}
                                onClick={() => form.setData('edges', [...d.edges, { from: d.nodes[0]!.id, to: d.nodes[1]!.id, label: '', mode: 'sync' }])}
                            >
                                Add arrow
                            </Button>
                        </Group>
                        <Table.ScrollContainer minWidth={640}>
                            <Table verticalSpacing={4}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>From</Table.Th>
                                        <Table.Th>To</Table.Th>
                                        <Table.Th>Label</Table.Th>
                                        <Table.Th w={130}>Kind</Table.Th>
                                        <Table.Th w={40} />
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {d.edges.map((edge, i) => {
                                        const update = (patch: Partial<Edge>) => form.setData('edges', d.edges.map((x, j) => (j === i ? { ...x, ...patch } : x)));

                                        return (
                                            <Table.Tr key={i}>
                                                <Table.Td>
                                                    <Select size="xs" aria-label="From" data={nodeOptions} value={edge.from} error={err(`edges.${i}.from`)} onChange={(v) => update({ from: v ?? '' })} />
                                                </Table.Td>
                                                <Table.Td>
                                                    <Select size="xs" aria-label="To" data={nodeOptions} value={edge.to} error={err(`edges.${i}.to`)} onChange={(v) => update({ to: v ?? '' })} />
                                                </Table.Td>
                                                <Table.Td>
                                                    <TextInput size="xs" aria-label="Label" value={edge.label} error={err(`edges.${i}.label`)} onChange={(e) => update({ label: e.currentTarget.value })} />
                                                </Table.Td>
                                                <Table.Td>
                                                    <Select
                                                        size="xs"
                                                        aria-label="Kind"
                                                        data={[
                                                            { value: 'sync', label: 'Solid (direct)' },
                                                            { value: 'async', label: 'Dashed (async)' },
                                                        ]}
                                                        value={edge.mode}
                                                        allowDeselect={false}
                                                        onChange={(v) => update({ mode: (v ?? 'sync') as Edge['mode'] })}
                                                    />
                                                </Table.Td>
                                                <Table.Td>
                                                    <ActionIcon color="red" variant="subtle" onClick={() => form.setData('edges', d.edges.filter((_, j) => j !== i))} aria-label="Remove arrow">
                                                        <Trash2 size={14} />
                                                    </ActionIcon>
                                                </Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Card>

                    <Card withBorder>
                        <Title order={5} mb="xs">
                            Preview
                        </Title>
                        <Text size="xs" c="dimmed" mb="sm">
                            Exactly as on the site. On narrow screens the site shows this as a step list.
                        </Text>
                        <div className="site-preview" style={{ padding: 16, borderRadius: 12, overflowX: 'auto' }}>
                            <div style={{ minWidth: 1024 }}>
                                <FlowDiagram diagram={preview} />
                            </div>
                        </div>
                    </Card>
                </Stack>
                <SaveBar dirty={form.isDirty || !editing} processing={form.processing} label={editing ? 'Save changes' : 'Create diagram'} />
            </form>
        </AdminLayout>
    );
}
