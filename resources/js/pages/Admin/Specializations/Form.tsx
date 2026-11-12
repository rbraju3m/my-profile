import { router, useForm } from '@inertiajs/react';
import { Card, MultiSelect, Select, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core';
import type { FormEvent } from 'react';

import { AdminLayout } from '@/admin/components/AdminLayout';
import { ConfirmButton } from '@/admin/components/ConfirmButton';
import { RepeaterInput } from '@/admin/components/ListInputs';
import { PageHeader } from '@/admin/components/PageHeader';
import { SaveBar } from '@/admin/components/SaveBar';
import { errorsOf } from '@/admin/lib';
import type { SelectOption } from '@/admin/types';

type Data = {
    title: string;
    icon: string | null;
    summary: string;
    capabilities: { text: string; status: string }[];
    diagram_id: string | null;
    projects: string[];
};

type Props = {
    specialization: (Data & { id: number }) | null;
    icons: string[];
    statuses: SelectOption[];
    diagrams: SelectOption[];
    projects: SelectOption[];
};

export default function SpecializationForm({ specialization, icons, statuses, diagrams, projects }: Props) {
    const editing = specialization !== null;
    const form = useForm<Data>({
        title: specialization?.title ?? '',
        icon: specialization?.icon ?? null,
        summary: specialization?.summary ?? '',
        capabilities: specialization?.capabilities ?? [],
        diagram_id: specialization?.diagram_id ?? null,
        projects: specialization?.projects ?? [],
    });
    const err = errorsOf(form);
    const d = form.data;

    const submit = (e: FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({ ...data, diagram_id: data.diagram_id ? Number(data.diagram_id) : null, projects: data.projects.map(Number) }));
        const options = { preserveScroll: true, onSuccess: () => form.setDefaults() };
        if (editing) form.put(`/admin/specializations/${specialization.id}`, options);
        else form.post('/admin/specializations', options);
    };

    return (
        <AdminLayout title={editing ? d.title : 'Add card'}>
            <PageHeader
                title={editing ? d.title : 'Add card'}
                crumbs={[{ label: 'Specialisations', href: '/admin/specializations' }, { label: editing ? 'Edit' : 'New' }]}
                actions={
                    editing && (
                        <ConfirmButton title="Delete this card?" message={d.title} onConfirm={(done) => router.delete(`/admin/specializations/${specialization.id}`, { onFinish: done })}>
                            Delete
                        </ConfirmButton>
                    )
                }
            />
            <form onSubmit={submit}>
                <Card withBorder>
                    <Stack>
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <TextInput label="Title" required value={d.title} error={err('title')} onChange={(e) => form.setData('title', e.currentTarget.value)} />
                            <Select label="Icon" data={icons} clearable value={d.icon} onChange={(v) => form.setData('icon', v)} error={err('icon')} />
                        </SimpleGrid>
                        <Textarea label="Summary" autosize minRows={2} required value={d.summary} error={err('summary')} onChange={(e) => form.setData('summary', e.currentTarget.value)} />
                        <RepeaterInput
                            label="Capabilities"
                            description="Each one shows its status, so researched or planned work is never shown as done."
                            itemLabel="capability"
                            max={8}
                            value={d.capabilities}
                            onChange={(v) => form.setData('capabilities', v)}
                            empty={() => ({ text: '', status: 'built' })}
                            renderItem={(c, i, update) => (
                                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                    <TextInput label="Capability" value={c.text} error={err(`capabilities.${i}.text`)} onChange={(e) => update({ text: e.currentTarget.value })} />
                                    <Select label="Status" data={statuses} value={c.status} allowDeselect={false} error={err(`capabilities.${i}.status`)} onChange={(v) => update({ status: v ?? 'built' })} />
                                </SimpleGrid>
                            )}
                        />
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <Select label="Diagram" data={diagrams} clearable value={d.diagram_id} onChange={(v) => form.setData('diagram_id', v)} error={err('diagram_id')} />
                            <MultiSelect label="Case studies" data={projects} searchable value={d.projects} onChange={(v) => form.setData('projects', v)} error={err('projects')} />
                        </SimpleGrid>
                    </Stack>
                </Card>
                <SaveBar dirty={form.isDirty || !editing} processing={form.processing} label={editing ? 'Save changes' : 'Create'} />
            </form>
        </AdminLayout>
    );
}
