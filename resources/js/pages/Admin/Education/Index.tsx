import { router, useForm } from '@inertiajs/react';
import { ActionIcon, Button, Card, Group, Modal, NumberInput, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { Pencil, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { PageHeader } from '@/admin/components/PageHeader';
import { SortableList } from '@/admin/components/SortableList';

type Row = { id: number; degree: string; institution: string; detail: string | null; started_year: number | null; ended_year: number | null };

export default function EducationIndex({ education }: { education: Row[] }) {
    const [rows, setRows] = useState(education);
    const [prev, setPrev] = useState(education);
    const [editing, setEditing] = useState<Row | 'new' | null>(null);
    if (prev !== education) {
        setPrev(education);
        setRows(education);
    }

    return (
        <AdminLayout title="Education">
            <PageHeader
                title="Education"
                description="Shown beside your biography."
                actions={
                    <Button leftSection={<Plus size={16} />} onClick={() => setEditing('new')}>
                        Add
                    </Button>
                }
            />
            <SortableList
                items={rows}
                getId={(r) => r.id}
                onReorder={(next) => {
                    setRows(next);
                    router.post('/admin/reorder/education', { ids: next.map((r) => r.id) }, { preserveScroll: true, preserveState: true });
                }}
                render={(r, handle) => (
                    <Card withBorder padding="sm" mb={6}>
                        <Group wrap="nowrap">
                            {handle}
                            <div style={{ flex: 1 }}>
                                <Text fw={600}>{r.degree}</Text>
                                <Text size="sm" c="dimmed">
                                    {r.institution}
                                    {r.detail && ` · ${r.detail}`} · {r.started_year ? `${r.started_year} – ` : ''}
                                    {r.ended_year}
                                </Text>
                            </div>
                            <ActionIcon variant="subtle" onClick={() => setEditing(r)} aria-label={`Edit ${r.degree}`}>
                                <Pencil size={16} />
                            </ActionIcon>
                        </Group>
                    </Card>
                )}
            />
            <Modal opened={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add education' : 'Edit education'}>
                {editing !== null && <EducationForm row={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />}
            </Modal>
        </AdminLayout>
    );
}

function EducationForm({ row, onDone }: { row: Row | null; onDone: () => void }) {
    const form = useForm({
        degree: row?.degree ?? '',
        institution: row?.institution ?? '',
        detail: row?.detail ?? '',
        started_year: row?.started_year ?? null,
        ended_year: row?.ended_year ?? null,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const options = { preserveScroll: true, onSuccess: onDone };
        if (row) form.put(`/admin/education/${row.id}`, options);
        else form.post('/admin/education', options);
    };

    return (
        <form onSubmit={submit}>
            <Stack>
                <TextInput label="Degree" required value={form.data.degree} error={form.errors.degree} onChange={(e) => form.setData('degree', e.currentTarget.value)} />
                <TextInput label="Institution" required value={form.data.institution} error={form.errors.institution} onChange={(e) => form.setData('institution', e.currentTarget.value)} />
                <TextInput label="Detail" placeholder="Science" value={form.data.detail} error={form.errors.detail} onChange={(e) => form.setData('detail', e.currentTarget.value)} />
                <SimpleGrid cols={2}>
                    <NumberInput label="Start year" value={form.data.started_year ?? ''} error={form.errors.started_year} onChange={(v) => form.setData('started_year', typeof v === 'number' ? v : null)} />
                    <NumberInput label="End year" value={form.data.ended_year ?? ''} error={form.errors.ended_year} onChange={(v) => form.setData('ended_year', typeof v === 'number' ? v : null)} />
                </SimpleGrid>
                <Group justify="space-between">
                    {row ? (
                        <ConfirmButton title="Delete this entry?" message={row.degree} onConfirm={(done) => router.delete(`/admin/education/${row.id}`, { preserveScroll: true, onFinish: () => (done(), onDone()) })}>
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
